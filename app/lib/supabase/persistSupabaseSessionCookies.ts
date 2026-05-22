import { createChunks, isChunkLike, MAX_CHUNK_SIZE } from "@supabase/ssr/dist/module/utils/chunker";
import { BROWSER_COOKIE_VALUE_SAFE_MAX } from "@/app/lib/supabase/cookieProbe";
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

export function isMainSupabaseAuthStorageKey(name: string, storageKey?: string): boolean {
  const key = storageKey ?? getSupabaseAuthStorageKey();
  return name === key;
}

/** PKCE verifier cookie — safe to delete; not the session auth-token. */
export function isSupabasePkceCodeVerifierCookieName(name: string): boolean {
  return name.includes("code-verifier");
}

/** Chunk cookies (e.g. sb-…-auth-token.0) — not the undecorated main storage key. */
export function isSupabaseAuthChunkCookieName(name: string, storageKey?: string): boolean {
  const key = storageKey ?? getSupabaseAuthStorageKey();
  return isChunkLike(name, key) && name !== key;
}

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

  // Only remove orphan chunk cookies (.0, .1, …). Never emit Max-Age=0 for the main
  // storage key in the same response as the session set — browsers can keep the empty cookie.
  const removals = existingCookieNames
    .filter((name) => isSupabaseAuthChunkCookieName(name, storageKey))
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

  return [...sets, ...removals];
}

export type PendingSessionCookieDebug = {
  names: string[];
  valueLengths: number[];
  maxAgeZero: boolean[];
  totalValueChars: number;
  hasValueOver500: boolean;
  hasValidSession: boolean;
  sessionChunkCount: number;
  maxPendingCookieValueLength: number;
  pendingCookieExceedsSafeLimit: boolean;
};

export type ParsedSetCookieHeader = {
  name: string;
  valueLength: number;
  maxAgeZero: boolean;
  expiresDelete: boolean;
};

export type ResponseSetCookieDebug = {
  setCookieHeaderPresent: boolean;
  setCookieHeaderCount: number;
  setCookieHeaderCharLength: number;
  setCookieCookieNames: string[];
  setCookieValueLengths: number[];
  setCookieMaxAgeZeroFlags: boolean[];
  setCookieExpiresDeleteFlags: boolean[];
  hasLargeAuthCookie: boolean;
  mainAuthTokenSetCookieCount: number;
  duplicateMainAuthTokenNames: boolean;
  emptyMainAuthTokenSetCookie: boolean;
  finalMainAuthTokenValueLength: number;
  codeVerifierDeletionNames: string[];
  maxSetCookieValueLength: number;
  sessionChunkSetCookieCount: number;
  setCookieExceedsSafeLimit: boolean;
};

export const MAIN_AUTH_COOKIE_OVERWRITE_ERROR =
  "Main auth cookie would be overwritten by empty cookie";

function parseSetCookieHeaderLine(header: string): ParsedSetCookieHeader {
  const valuePart = header.split(";")[0] ?? "";
  const eq = valuePart.indexOf("=");
  const name = eq < 0 ? valuePart.trim() : valuePart.slice(0, eq).trim();
  const valueLength = eq < 0 ? 0 : valuePart.slice(eq + 1).length;
  const lower = header.toLowerCase();
  return {
    name,
    valueLength,
    maxAgeZero: /\bmax-age=0\b/.test(lower),
    expiresDelete: /\bexpires=/.test(lower) && /\b1970\b/.test(lower),
  };
}

/** Inspect Set-Cookie on the exact NextResponse returned to the browser. */
export function inspectResponseSetCookieHeaders(response: NextResponse): ResponseSetCookieDebug {
  const headers = response.headers.getSetCookie?.() ?? [];
  const parsed = headers.map(parseSetCookieHeaderLine);
  const storageKey = getSupabaseAuthStorageKey();

  const mainEntries = parsed.filter((p) => isMainSupabaseAuthStorageKey(p.name, storageKey));
  const finalMain = mainEntries.at(-1);

  const setCookieCookieNames = parsed.map((p) => p.name);
  const setCookieValueLengths = parsed.map((p) => p.valueLength);
  const setCookieHeaderCharLength = headers.reduce((n, h) => n + h.length, 0);
  const chunkEntries = parsed.filter((p) => isSupabaseAuthChunkCookieName(p.name, storageKey));
  const sessionEntries = [...mainEntries, ...chunkEntries].filter(
    (p) => !p.maxAgeZero && !p.expiresDelete && p.valueLength > 0
  );
  const hasLargeAuthCookie = sessionEntries.some((p) => p.valueLength > 500);
  const maxSetCookieValueLength = Math.max(0, ...parsed.map((p) => p.valueLength));
  const sessionChunkSetCookieCount = chunkEntries.filter((p) => p.valueLength > 0).length;

  const emptyMainAuthTokenSetCookie = mainEntries.some(
    (p) =>
      p.valueLength === 0 ||
      p.maxAgeZero ||
      p.expiresDelete
  );

  return {
    setCookieHeaderPresent: headers.length > 0,
    setCookieHeaderCount: headers.length,
    setCookieHeaderCharLength,
    setCookieCookieNames,
    setCookieValueLengths,
    setCookieMaxAgeZeroFlags: parsed.map((p) => p.maxAgeZero),
    setCookieExpiresDeleteFlags: parsed.map((p) => p.expiresDelete),
    hasLargeAuthCookie,
    mainAuthTokenSetCookieCount: mainEntries.length,
    duplicateMainAuthTokenNames: mainEntries.length > 1,
    emptyMainAuthTokenSetCookie,
    finalMainAuthTokenValueLength: finalMain?.valueLength ?? 0,
    codeVerifierDeletionNames: parsed
      .filter(
        (p) =>
          isSupabasePkceCodeVerifierCookieName(p.name) &&
          (p.valueLength === 0 || p.maxAgeZero || p.expiresDelete)
      )
      .map((p) => p.name),
    maxSetCookieValueLength,
    sessionChunkSetCookieCount,
    setCookieExceedsSafeLimit: maxSetCookieValueLength > BROWSER_COOKIE_VALUE_SAFE_MAX,
  };
}

export function responseAuthSetCookiesAreValid(debug: ResponseSetCookieDebug): boolean {
  if (!debug.setCookieHeaderPresent || !debug.hasLargeAuthCookie) return false;
  if (debug.duplicateMainAuthTokenNames) return false;
  if (debug.emptyMainAuthTokenSetCookie) return false;
  if (debug.setCookieExceedsSafeLimit) return false;
  const mainOk = debug.finalMainAuthTokenValueLength > 500;
  const chunkedOk = debug.sessionChunkSetCookieCount > 0 && debug.hasLargeAuthCookie;
  if (!mainOk && !chunkedOk) return false;
  return true;
}

export function debugPendingSessionCookies(
  cookies: SessionCookieToSet[]
): PendingSessionCookieDebug {
  const authCookies = cookies.filter((c) => isSupabaseAuthCookieName(c.name));
  const valueLengths = cookies.map((c) => c.value?.length ?? 0);
  const maxAgeZero = cookies.map((c) => c.options?.maxAge === 0);
  const totalValueChars = valueLengths.reduce((n, l) => n + l, 0);

  const setCookies = cookies.filter((c) => (c.value?.length ?? 0) > 0);
  const maxPendingCookieValueLength = Math.max(0, ...valueLengths);
  const sessionChunkCount = setCookies.filter((c) =>
    isSupabaseAuthChunkCookieName(c.name)
  ).length;

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
    sessionChunkCount,
    maxPendingCookieValueLength,
    pendingCookieExceedsSafeLimit: maxPendingCookieValueLength > BROWSER_COOKIE_VALUE_SAFE_MAX,
  };
}

