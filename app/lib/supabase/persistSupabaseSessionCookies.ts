import { createChunks, isChunkLike } from "@supabase/ssr/dist/module/utils/chunker";
import { stringToBase64URL } from "@supabase/ssr/dist/module/utils/base64url";
import { DEFAULT_COOKIE_OPTIONS } from "@supabase/ssr/dist/module/utils/constants";
import type { CookieOptions } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";
import { isSupabaseAuthCookieName } from "@/app/lib/supabase/apiRoute";

const BASE64_PREFIX = "base64-";

export type SessionCookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

/** Storage key used by @supabase/ssr / GoTrue for this project. */
export function getSupabaseAuthStorageKey(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  try {
    const ref = new URL(url).hostname.split(".")[0] ?? "localhost";
    return `sb-${ref}-auth-token`;
  } catch {
    return "sb-auth-token";
  }
}

/** JSON payload stored inside the auth-token cookie (matches GoTrue / @supabase/ssr). */
export function serializeSupabaseSessionForStorage(session: Session): string {
  return JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    token_type: session.token_type,
    user: session.user,
  });
}

/**
 * Build removal + chunked Set-Cookie entries from a verified Supabase session.
 * Synchronous — does not rely on async onAuthStateChange / applyServerStorage.
 */
export function buildSessionCookiesToSet(
  session: Session,
  existingCookieNames: string[]
): SessionCookieToSet[] {
  const storageKey = getSupabaseAuthStorageKey();
  const encoded =
    BASE64_PREFIX + stringToBase64URL(serializeSupabaseSessionForStorage(session));

  const chunks = createChunks(storageKey, encoded);

  const secure =
    process.env.NODE_ENV === "production" ? true : (DEFAULT_COOKIE_OPTIONS.secure ?? false);

  const removeCookieOptions: CookieOptions = {
    path: DEFAULT_COOKIE_OPTIONS.path,
    sameSite: DEFAULT_COOKIE_OPTIONS.sameSite ?? "lax",
    httpOnly: DEFAULT_COOKIE_OPTIONS.httpOnly,
    secure,
    maxAge: 0,
  };

  const setCookieOptions: CookieOptions = {
    path: DEFAULT_COOKIE_OPTIONS.path,
    sameSite: DEFAULT_COOKIE_OPTIONS.sameSite ?? "lax",
    httpOnly: DEFAULT_COOKIE_OPTIONS.httpOnly,
    secure,
    maxAge: DEFAULT_COOKIE_OPTIONS.maxAge,
  };

  const removals = existingCookieNames
    .filter((name) => isChunkLike(name, storageKey))
    .map((name) => ({
      name,
      value: "",
      options: removeCookieOptions,
    }));

  const sets = chunks.map(({ name, value }) => ({
    name,
    value,
    options: setCookieOptions,
  }));

  return [...removals, ...sets];
}

export type PendingSessionCookieDebug = {
  names: string[];
  valueLengths: number[];
  maxAgeZero: boolean[];
  totalValueChars: number;
  hasValueOver500: boolean;
  hasValidSession: boolean;
};

export type ResponseSetCookieDebug = {
  setCookieHeaderPresent: boolean;
  setCookieHeaderCount: number;
  setCookieHeaderCharLength: number;
  setCookieCookieNames: string[];
  setCookieValueLengths: number[];
  hasLargeAuthCookie: boolean;
};

function parseSetCookieHeaderLine(header: string): { name: string; valueLength: number } {
  const valuePart = header.split(";")[0] ?? "";
  const eq = valuePart.indexOf("=");
  if (eq < 0) return { name: valuePart.trim(), valueLength: 0 };
  return {
    name: valuePart.slice(0, eq).trim(),
    valueLength: valuePart.slice(eq + 1).length,
  };
}

/** Inspect Set-Cookie on the exact NextResponse returned to the browser. */
export function inspectResponseSetCookieHeaders(response: NextResponse): ResponseSetCookieDebug {
  const headers = response.headers.getSetCookie?.() ?? [];
  const parsed = headers.map(parseSetCookieHeaderLine);
  const setCookieCookieNames = parsed.map((p) => p.name);
  const setCookieValueLengths = parsed.map((p) => p.valueLength);
  const setCookieHeaderCharLength = headers.reduce((n, h) => n + h.length, 0);
  const hasLargeAuthCookie = parsed.some(
    (p) => isSupabaseAuthCookieName(p.name) && p.valueLength > 500
  );

  return {
    setCookieHeaderPresent: headers.length > 0,
    setCookieHeaderCount: headers.length,
    setCookieHeaderCharLength,
    setCookieCookieNames,
    setCookieValueLengths,
    hasLargeAuthCookie,
  };
}

export function debugPendingSessionCookies(
  cookies: SessionCookieToSet[]
): PendingSessionCookieDebug {
  const authCookies = cookies.filter((c) => isSupabaseAuthCookieName(c.name));
  const valueLengths = cookies.map((c) => c.value?.length ?? 0);
  const maxAgeZero = cookies.map((c) => c.options?.maxAge === 0);
  const totalValueChars = valueLengths.reduce((n, l) => n + l, 0);

  return {
    names: cookies.map((c) => c.name),
    valueLengths,
    maxAgeZero,
    totalValueChars,
    hasValueOver500: valueLengths.some((l) => l > 500),
    hasValidSession:
      authCookies.some(
        (c) =>
          (c.value?.length ?? 0) >= 80 &&
          (c.value?.startsWith(BASE64_PREFIX) || (c.value?.length ?? 0) >= 200)
      ) && totalValueChars >= 120,
  };
}
