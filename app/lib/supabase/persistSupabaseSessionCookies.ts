import { createChunks, isChunkLike } from "@supabase/ssr/dist/module/utils/chunker";
import { BROWSER_COOKIE_VALUE_SAFE_MAX, H365_OTP_AUTH_PROBE_NAME } from "@/app/lib/supabase/cookieProbe";
import { stringToBase64URL } from "@supabase/ssr/dist/module/utils/base64url";
import { DEFAULT_COOKIE_OPTIONS } from "@supabase/ssr/dist/module/utils/constants";
import type { CookieOptions } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";
import { serialize } from "cookie";
import { isSupabaseAuthCookieName } from "@/app/lib/supabase/apiRoute";

const BASE64_PREFIX = "base64-";

/**
 * Per-cookie payload limit for createChunks (URI-encoded length).
 * Browsers often reject a single Set-Cookie > ~4KB and store the name with an empty value.
 */
/** URI-encoded chunk budget — keep each Set-Cookie wire size under proxy/browser limits. */
export const AUTH_SESSION_CHUNK_SIZE = 1800;

export const REFUSE_MAIN_AUTH_EMPTY_ERROR =
  "Refusing login: main auth cookie would be empty/deleted";

export const SUPABASE_SESSION_NOT_ATTACHED_ERROR =
  "OTP verified but Supabase session cookies were not attached.";

const WIRE_COOKIE_SAFE_MAX = 3800;

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
  const user = session.user;
  return JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    token_type: session.token_type,
    user: {
      id: user.id,
      aud: user.aud,
      role: user.role,
      email: user.email,
      phone: user.phone ?? "",
      confirmed_at: user.confirmed_at,
      recovery_sent_at: user.recovery_sent_at,
      last_sign_in_at: user.last_sign_in_at,
      app_metadata: user.app_metadata ?? {},
      user_metadata: user.user_metadata ?? {},
      created_at: user.created_at,
      updated_at: user.updated_at,
      is_anonymous: user.is_anonymous ?? false,
    },
  });
}

export type SessionCookiesBuildDebug = {
  mainStorageKey: string;
  encodedSessionLength: number;
  chunkSize: number;
  cookiesBuiltNames: string[];
  cookiesBuiltValueLengths: number[];
  usesChunkedSessionCookies: boolean;
  totalAuthChunkValueLength: number;
};

export type SessionCookiesBuildResult = {
  cookies: SessionCookieToSet[];
  buildDebug: SessionCookiesBuildDebug;
};

function sessionCookieOptions(): CookieOptions {
  const secure =
    process.env.NODE_ENV === "production" ? true : (DEFAULT_COOKIE_OPTIONS.secure ?? false);
  return {
    path: DEFAULT_COOKIE_OPTIONS.path,
    sameSite: DEFAULT_COOKIE_OPTIONS.sameSite ?? "lax",
    httpOnly: DEFAULT_COOKIE_OPTIONS.httpOnly,
    secure,
    maxAge: DEFAULT_COOKIE_OPTIONS.maxAge,
  };
}

function removalCookieOptions(): CookieOptions {
  const secure =
    process.env.NODE_ENV === "production" ? true : (DEFAULT_COOKIE_OPTIONS.secure ?? false);
  return {
    path: DEFAULT_COOKIE_OPTIONS.path,
    sameSite: DEFAULT_COOKIE_OPTIONS.sameSite ?? "lax",
    httpOnly: DEFAULT_COOKIE_OPTIONS.httpOnly,
    secure,
    maxAge: 0,
  };
}

/** Append one Set-Cookie line directly (avoids Next.js cookies jar dropping large redirect cookies). */
export function appendSetCookieLine(
  response: NextResponse,
  name: string,
  value: string,
  options?: CookieOptions
) {
  const opts = options ?? sessionCookieOptions();
  response.headers.append(
    "Set-Cookie",
    serialize(name, value, {
      path: opts.path ?? "/",
      sameSite: (opts.sameSite as "lax" | "strict" | "none" | undefined) ?? "lax",
      httpOnly: opts.httpOnly ?? false,
      secure: opts.secure ?? false,
      maxAge: opts.maxAge,
    })
  );
}

/**
 * Build removal + chunked Set-Cookie entries from a verified Supabase session.
 * Synchronous — does not rely on async onAuthStateChange / applyServerStorage.
 */
export function buildSessionCookiesToSet(
  session: Session,
  existingCookieNames: string[]
): SessionCookiesBuildResult {
  const storageKey = getSupabaseAuthStorageKey();
  const encoded =
    BASE64_PREFIX + stringToBase64URL(serializeSupabaseSessionForStorage(session));

  let chunks = createChunks(storageKey, encoded, AUTH_SESSION_CHUNK_SIZE);

  const single = chunks.length === 1 && chunks[0]?.name === storageKey;
  if (single && (chunks[0]?.value?.length ?? 0) > 3200) {
    chunks = createChunks(storageKey, encoded, 1200);
  }

  const removals = existingCookieNames
    .filter((name) => isSupabaseAuthChunkCookieName(name, storageKey))
    .map((name) => ({
      name,
      value: "",
      options: removalCookieOptions(),
    }));

  const setOpts = sessionCookieOptions();
  const sets = chunks
    .filter(({ name, value }) => {
      if ((value?.length ?? 0) === 0) return false;
      if (name === storageKey && (value?.length ?? 0) < 80) return false;
      return true;
    })
    .map(({ name, value }) => ({
      name,
      value,
      options: setOpts,
    }));

  const cookies = [...sets, ...removals];
  const setOnly = sets;
  const usesChunks = setOnly.some((c) => isSupabaseAuthChunkCookieName(c.name, storageKey));

  return {
    cookies,
    buildDebug: {
      mainStorageKey: storageKey,
      encodedSessionLength: encoded.length,
      chunkSize: AUTH_SESSION_CHUNK_SIZE,
      cookiesBuiltNames: cookies.map((c) => c.name),
      cookiesBuiltValueLengths: cookies.map((c) => c.value?.length ?? 0),
      usesChunkedSessionCookies: usesChunks,
      totalAuthChunkValueLength: setOnly.reduce((n, c) => n + (c.value?.length ?? 0), 0),
    },
  };
}

/** Write pending session cookies onto the response via raw Set-Cookie headers. */
export function attachSessionCookiesToResponseHeaders(
  response: NextResponse,
  pendingCookies: SessionCookieToSet[],
  storageKey?: string
) {
  const key = storageKey ?? getSupabaseAuthStorageKey();

  const sets = pendingCookies.filter((c) => {
    const len = c.value?.length ?? 0;
    if (len === 0) return false;
    if (isMainSupabaseAuthStorageKey(c.name, key) && len < 80) return false;
    return true;
  });

  const removals = pendingCookies.filter(
    (c) =>
      (!c.value || c.options?.maxAge === 0) &&
      !isMainSupabaseAuthStorageKey(c.name, key) &&
      (isSupabasePkceCodeVerifierCookieName(c.name) ||
        isSupabaseAuthChunkCookieName(c.name, key))
  );

  for (const { name, value, options } of sets) {
    appendSetCookieLine(response, name, value, options ?? sessionCookieOptions());
  }
  for (const { name, options } of removals) {
    appendSetCookieLine(response, name, "", options ?? removalCookieOptions());
  }
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
  mainStorageKey: string;
  responseSetCookieNames: string[];
  responseSetCookieValueLengths: number[];
  responseSetCookieDeleteFlags: boolean[];
  mainAuthCookieSetCount: number;
  mainAuthCookieLargestValueLength: number;
  mainAuthCookieEmptySetCount: number;
  chunkCookieNames: string[];
  codeVerifierCookieNames: string[];
  refusedBecauseMainCookieEmpty: boolean;
  usesChunkedSessionCookies: boolean;
  totalAuthChunkValueLength: number;
  hasH365AuthProbeInResponse: boolean;
  hasMainAuthTokenInResponse: boolean;
  hasAuthTokenChunk0InResponse: boolean;
  anyCookieOver3800Chars: boolean;
  anyEmptyAuthCookie: boolean;
  finalRedirectSetCookieCount: number;
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

  const mainAuthCookieEmptySetCount = mainEntries.filter(
    (p) => p.valueLength === 0 || p.maxAgeZero || p.expiresDelete
  ).length;

  const emptyMainAuthTokenSetCookie = mainAuthCookieEmptySetCount > 0;

  const mainAuthCookieLargestValueLength = Math.max(
    0,
    ...mainEntries.filter((p) => !p.maxAgeZero && !p.expiresDelete).map((p) => p.valueLength)
  );

  const chunkCookieNames = parsed
    .filter((p) => isSupabaseAuthChunkCookieName(p.name, storageKey))
    .map((p) => p.name);

  const codeVerifierCookieNames = parsed
    .filter((p) => isSupabasePkceCodeVerifierCookieName(p.name))
    .map((p) => p.name);

  const usesChunkedSessionCookies = chunkCookieNames.some((n) =>
    parsed.some((p) => p.name === n && p.valueLength > 80)
  );

  const responseSetCookieDeleteFlags = parsed.map(
    (p) => p.maxAgeZero || p.expiresDelete
  );

  const refusedBecauseMainCookieEmpty = emptyMainAuthTokenSetCookie;

  const totalAuthChunkValueLength = chunkCookieNames.reduce((sum, chunkName) => {
    const idx = setCookieCookieNames.indexOf(chunkName);
    return sum + (idx >= 0 ? (setCookieValueLengths[idx] ?? 0) : 0);
  }, 0);

  const hasH365AuthProbeInResponse = setCookieCookieNames.includes(H365_OTP_AUTH_PROBE_NAME);

  const hasMainAuthTokenInResponse = mainEntries.some(
    (p) => p.valueLength > 80 && !p.maxAgeZero && !p.expiresDelete
  );

  const hasAuthTokenChunk0InResponse = parsed.some(
    (p) =>
      p.name === `${storageKey}.0` && p.valueLength > 80 && !p.maxAgeZero && !p.expiresDelete
  );

  const anyCookieOver3800Chars = setCookieValueLengths.some((l) => l > WIRE_COOKIE_SAFE_MAX);

  const anyEmptyAuthCookie = parsed.some(
    (p) =>
      isSupabaseAuthCookieName(p.name) &&
      (p.valueLength === 0 || p.maxAgeZero || p.expiresDelete)
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
    mainStorageKey: storageKey,
    responseSetCookieNames: setCookieCookieNames,
    responseSetCookieValueLengths: setCookieValueLengths,
    responseSetCookieDeleteFlags,
    mainAuthCookieSetCount: mainEntries.length,
    mainAuthCookieLargestValueLength,
    mainAuthCookieEmptySetCount,
    chunkCookieNames,
    codeVerifierCookieNames,
    refusedBecauseMainCookieEmpty,
    usesChunkedSessionCookies,
    totalAuthChunkValueLength,
    hasH365AuthProbeInResponse,
    hasMainAuthTokenInResponse,
    hasAuthTokenChunk0InResponse,
    anyCookieOver3800Chars,
    anyEmptyAuthCookie,
    finalRedirectSetCookieCount: headers.length,
  };
}

/** True when response Set-Cookie includes a usable Supabase session (main or chunks). */
export function sessionAuthCookiesAttachedOnResponse(debug: ResponseSetCookieDebug): boolean {
  if (debug.refusedBecauseMainCookieEmpty || debug.anyEmptyAuthCookie) return false;
  if (debug.mainAuthCookieLargestValueLength > 500) return true;
  if (debug.totalAuthChunkValueLength > 500) return true;
  if (debug.hasAuthTokenChunk0InResponse) return true;
  return false;
}

export function responseAuthSetCookiesAreValid(debug: ResponseSetCookieDebug): boolean {
  if (!debug.setCookieHeaderPresent) return false;
  if (debug.duplicateMainAuthTokenNames) return false;
  if (debug.emptyMainAuthTokenSetCookie) return false;
  if (debug.anyCookieOver3800Chars) return false;
  return sessionAuthCookiesAttachedOnResponse(debug);
}

export function debugPendingSessionCookies(
  cookies: SessionCookieToSet[]
): PendingSessionCookieDebug {
  const authCookies = cookies.filter((c) => isSupabaseAuthCookieName(c.name));
  const valueLengths = cookies.map((c) => c.value?.length ?? 0);
  const maxAgeZero = cookies.map((c) => c.options?.maxAge === 0);
  const totalValueChars = valueLengths.reduce((n, l) => n + l, 0);

  const storageKey = getSupabaseAuthStorageKey();
  const setCookies = cookies.filter((c) => (c.value?.length ?? 0) > 0);
  const maxPendingCookieValueLength = Math.max(0, ...valueLengths);
  const sessionChunkCount = setCookies.filter((c) =>
    isSupabaseAuthChunkCookieName(c.name, storageKey)
  ).length;
  const hasChunkPayload = setCookies.some(
    (c) => isSupabaseAuthChunkCookieName(c.name, storageKey) && (c.value?.length ?? 0) >= 80
  );
  const hasMainPayload = setCookies.some(
    (c) => isMainSupabaseAuthStorageKey(c.name, storageKey) && (c.value?.length ?? 0) >= 80
  );

  return {
    names: cookies.map((c) => c.name),
    valueLengths,
    maxAgeZero,
    totalValueChars,
    hasValueOver500: valueLengths.some((l) => l > 500),
    hasValidSession:
      (hasMainPayload || hasChunkPayload) &&
      authCookies.some(
        (c) =>
          (c.value?.length ?? 0) >= 80 &&
          (c.value?.startsWith(BASE64_PREFIX) || (c.value?.length ?? 0) >= 200)
      ) &&
      totalValueChars >= 120,
    sessionChunkCount,
    maxPendingCookieValueLength,
    pendingCookieExceedsSafeLimit: maxPendingCookieValueLength > BROWSER_COOKIE_VALUE_SAFE_MAX,
  };
}

