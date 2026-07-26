/**
 * HYROX Team admin/coach “View as Athlete” preview session.
 * Not account impersonation — coach auth remains; athlete data is read-only.
 * Server-only (cookies + crypto). Client path helpers live in hyroxAdminAthletePreviewPaths.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE,
} from "@/app/lib/hyroxAdminAthletePreviewPaths";

export {
  HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE,
  HYROX_ADMIN_ATHLETE_PREVIEW_HEADER,
  athleteHrefToPreviewSection,
  previewPathForAthlete,
  previewSectionFromPath,
} from "@/app/lib/hyroxAdminAthletePreviewPaths";

export const HYROX_ADMIN_ATHLETE_PREVIEW_PURPOSE = "hyrox-admin-athlete-preview" as const;
export const HYROX_ADMIN_ATHLETE_PREVIEW_TTL_MS = 4 * 60 * 60 * 1000; // 4h

export type HyroxAdminAthletePreviewPayload = {
  mode: "admin-athlete-preview";
  purpose: typeof HYROX_ADMIN_ATHLETE_PREVIEW_PURPOSE;
  coachUserId: string;
  athleteId: string;
  issuedAt: number;
  expiresAt: number;
};

function getSigningSecret(): string {
  const secret = process.env.HYROX_PORTAL_SIGNING_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("HYROX_PORTAL_SIGNING_SECRET is required for admin athlete preview.");
  }
  return "dev-only-hyrox-portal-mutation-signing-secret";
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(body: string): string {
  return createHmac("sha256", getSigningSecret()).update(body).digest("base64url");
}

export function createHyroxAdminAthletePreviewToken(input: {
  coachUserId: string;
  athleteId: string;
}): string {
  const issuedAt = Date.now();
  const payload: HyroxAdminAthletePreviewPayload = {
    mode: "admin-athlete-preview",
    purpose: HYROX_ADMIN_ATHLETE_PREVIEW_PURPOSE,
    coachUserId: input.coachUserId,
    athleteId: input.athleteId,
    issuedAt,
    expiresAt: issuedAt + HYROX_ADMIN_ATHLETE_PREVIEW_TTL_MS,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifyHyroxAdminAthletePreviewToken(
  token: string | null | undefined
):
  | { ok: true; payload: HyroxAdminAthletePreviewPayload }
  | { ok: false; reason: "missing" | "malformed" | "bad-signature" | "expired" | "wrong-purpose" } {
  if (!token?.trim()) return { ok: false, reason: "missing" };
  const [body, sig] = token.trim().split(".");
  if (!body || !sig) return { ok: false, reason: "malformed" };
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "bad-signature" };
    }
  } catch {
    return { ok: false, reason: "bad-signature" };
  }
  try {
    const json = Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
      "utf8"
    );
    const payload = JSON.parse(json) as HyroxAdminAthletePreviewPayload;
    if (payload.purpose !== HYROX_ADMIN_ATHLETE_PREVIEW_PURPOSE) {
      return { ok: false, reason: "wrong-purpose" };
    }
    if (payload.mode !== "admin-athlete-preview") {
      return { ok: false, reason: "wrong-purpose" };
    }
    if (!payload.athleteId || !payload.coachUserId) return { ok: false, reason: "malformed" };
    if (Date.now() > payload.expiresAt) return { ok: false, reason: "expired" };
    return { ok: true, payload };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}

function readPreviewTokenFromRequest(request?: NextRequest | Request | null): string | null {
  if (!request) return null;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

/**
 * True when the request is in admin athlete preview mode (signed cookie present).
 */
export function isHyroxAdminAthletePreviewRequest(
  request?: NextRequest | Request | null
): boolean {
  const token = readPreviewTokenFromRequest(request);
  return verifyHyroxAdminAthletePreviewToken(token).ok;
}

export async function readHyroxAdminAthletePreviewFromCookies(): Promise<
  HyroxAdminAthletePreviewPayload | null
> {
  const jar = await cookies();
  const raw = jar.get(HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE)?.value ?? null;
  const verified = verifyHyroxAdminAthletePreviewToken(raw);
  return verified.ok ? verified.payload : null;
}

export function previewCookieOptions(maxAgeSec = HYROX_ADMIN_ATHLETE_PREVIEW_TTL_MS / 1000) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(maxAgeSec),
  };
}

/** Default TZ for preview when athlete has no stored timezone (matches coach Today APIs). */
export const HYROX_ADMIN_PREVIEW_FALLBACK_TIMEZONE = "Europe/London";

export const HYROX_ADMIN_PREVIEW_READONLY_ERROR =
  "Read-only preview — mutations are disabled." as const;

/**
 * Reject athlete mutations when an admin preview cookie is present on the request.
 */
export function getAdminAthletePreviewMutationBlock(
  request?: NextRequest | Request | null
): { blocked: true; reason: string } | { blocked: false } {
  if (!isHyroxAdminAthletePreviewRequest(request)) {
    return { blocked: false };
  }
  return { blocked: true, reason: HYROX_ADMIN_PREVIEW_READONLY_ERROR };
}

export async function getAdminAthletePreviewMutationBlockFromCookies(): Promise<
  { blocked: true; reason: string } | { blocked: false }
> {
  const payload = await readHyroxAdminAthletePreviewFromCookies();
  if (!payload) return { blocked: false };
  return { blocked: true, reason: HYROX_ADMIN_PREVIEW_READONLY_ERROR };
}
