import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { H365_ATHLETE_SESSION_COOKIE } from "@/app/lib/supabase/cookieProbe";
import { appendSetCookieLine } from "@/app/lib/supabase/persistSupabaseSessionCookies";
import { createServiceRoleClient } from "@/app/lib/supabaseAdmin";

export { H365_ATHLETE_SESSION_COOKIE };

const ATHLETE_SESSION_PURPOSE = "h365-athlete-portal";
const ATHLETE_SESSION_MAX_AGE_SEC = 400 * 24 * 60 * 60;

export type AthleteSessionCookiePayload = {
  userId: string;
  email: string | null;
  exp: number;
  purpose: typeof ATHLETE_SESSION_PURPOSE;
};

function getSigningSecret(): string | null {
  const secret = process.env.HYROX_PORTAL_SIGNING_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") return null;
  return "dev-only-hyrox-portal-mutation-signing-secret";
}

function signBody(bodyB64: string, secret: string): string {
  return createHmac("sha256", secret).update(bodyB64).digest("base64url");
}

export function buildAthleteSessionCookieValue(input: {
  userId: string;
  email?: string | null;
}): string | null {
  const secret = getSigningSecret();
  if (!secret) return null;

  const exp = Math.floor(Date.now() / 1000) + ATHLETE_SESSION_MAX_AGE_SEC;
  const payload: AthleteSessionCookiePayload = {
    userId: input.userId,
    email: input.email?.trim().toLowerCase() ?? null,
    exp,
    purpose: ATHLETE_SESSION_PURPOSE,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${signBody(body, secret)}`;
}

export function verifyAthleteSessionCookieValue(
  value: string | null | undefined
): AthleteSessionCookiePayload | null {
  if (!value?.trim()) return null;
  const secret = getSigningSecret();
  if (!secret) return null;

  const parts = value.trim().split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  const expected = signBody(parts[0], secret);
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(parts[1]);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf8")
    ) as AthleteSessionCookiePayload;
    if (payload.purpose !== ATHLETE_SESSION_PURPOSE || !payload.userId) return null;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getAthleteSessionCookieOptions() {
  return {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: ATHLETE_SESSION_MAX_AGE_SEC,
  };
}

/** Attach last on verify-otp redirect so it survives proxy/browser Set-Cookie limits. */
export function attachH365AthleteSessionCookie(
  response: NextResponse,
  input: { userId: string; email?: string | null }
): boolean {
  const value = buildAthleteSessionCookieValue(input);
  if (!value) return false;
  appendSetCookieLine(response, H365_ATHLETE_SESSION_COOKIE, value, getAthleteSessionCookieOptions());
  return true;
}

export function readAthleteSessionCookieFromEntries(
  cookies: { name: string; value: string }[]
): AthleteSessionCookiePayload | null {
  const entry = cookies.find((c) => c.name === H365_ATHLETE_SESSION_COOKIE);
  return verifyAthleteSessionCookieValue(entry?.value);
}

export async function resolveSupabaseUserFromAthleteSession(
  payload: AthleteSessionCookiePayload
): Promise<User | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    if (payload.email) {
      return {
        id: payload.userId,
        email: payload.email,
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: "",
      } as User;
    }
    return null;
  }

  try {
    const admin = createServiceRoleClient();
    const { data, error } = await admin.auth.admin.getUserById(payload.userId);
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}
