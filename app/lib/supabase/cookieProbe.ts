import type { NextResponse } from "next/server";
import { isSupabaseAuthCookieName } from "@/app/lib/supabase/apiRoute";
import type { MergedCookieEntry } from "@/app/lib/supabase/mergedAthleteCookies";

/** Small probe set by GET /api/auth/cookie-probe */
export const H365_COOKIE_PROBE_NAME = "h365_probe";
export const H365_COOKIE_PROBE_VALUE = "ok";

/** Small probe set on successful POST /api/auth/verify-otp */
export const H365_OTP_AUTH_PROBE_NAME = "h365_auth_probe";
export const H365_OTP_AUTH_PROBE_VALUE = "otp-ok";

/** Typical per-cookie limit in browsers (~4 KB). */
export const BROWSER_COOKIE_VALUE_SAFE_MAX = 4096;

export function getH365ProbeCookieOptions() {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
  };
}

export function attachH365CookieProbe(response: NextResponse) {
  response.cookies.set(
    H365_COOKIE_PROBE_NAME,
    H365_COOKIE_PROBE_VALUE,
    getH365ProbeCookieOptions()
  );
  return response;
}

export function attachH365OtpAuthProbe(response: NextResponse) {
  response.cookies.set(
    H365_OTP_AUTH_PROBE_NAME,
    H365_OTP_AUTH_PROBE_VALUE,
    getH365ProbeCookieOptions()
  );
  return response;
}

/** Copy Set-Cookie headers onto a new response (e.g. when rebuilding JSON body with debug). */
export function copySetCookieHeaders(from: NextResponse, to: NextResponse) {
  const headers = from.headers.getSetCookie?.() ?? [];
  for (const header of headers) {
    to.headers.append("Set-Cookie", header);
  }
  return to;
}

export type AuthRelatedCookieEntry = { name: string; valueLength: number };

export function listAuthRelatedCookieEntries(
  cookies: MergedCookieEntry[]
): AuthRelatedCookieEntry[] {
  return cookies
    .filter(
      (c) =>
        isSupabaseAuthCookieName(c.name) ||
        c.name === H365_COOKIE_PROBE_NAME ||
        c.name === H365_OTP_AUTH_PROBE_NAME
    )
    .map((c) => ({ name: c.name, valueLength: c.value?.length ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type CookieStorageProbeReadDebug = {
  h365ProbePresent: boolean;
  h365ProbeValue: string | null;
  h365AuthProbePresent: boolean;
  h365AuthProbeValue: string | null;
  authRelatedCookieEntries: AuthRelatedCookieEntry[];
  storageInterpretation: string;
};

export function buildCookieStorageProbeReadDebug(
  cookies: MergedCookieEntry[],
  mainAuth: {
    mainAuthTokenExists: boolean;
    mainAuthTokenValueLength: number;
    codeVerifierCookiePresent: boolean;
  }
): CookieStorageProbeReadDebug {
  const h365Probe = cookies.find((c) => c.name === H365_COOKIE_PROBE_NAME);
  const h365AuthProbe = cookies.find((c) => c.name === H365_OTP_AUTH_PROBE_NAME);
  const h365ProbePresent = Boolean(h365Probe?.value);
  const h365AuthProbePresent = Boolean(h365AuthProbe?.value);

  let storageInterpretation: string;
  if (!h365ProbePresent && !h365AuthProbePresent && !mainAuth.mainAuthTokenExists) {
    storageInterpretation =
      "Browser is not sending back app cookies. Check Secure, SameSite, domain, and that Set-Cookie from /api/auth/* is stored.";
  } else if (h365ProbePresent && !h365AuthProbePresent && !mainAuth.mainAuthTokenExists) {
    storageInterpretation =
      "Isolated cookie-probe works; verify-otp probe and Supabase session were not stored.";
  } else if (h365AuthProbePresent && !mainAuth.mainAuthTokenExists) {
    storageInterpretation =
      "App probe cookies persist; Supabase sb auth-token is missing or rejected (size/format/delete collision).";
  } else if (h365ProbePresent && h365AuthProbePresent && mainAuth.mainAuthTokenValueLength === 0) {
    storageInterpretation =
      "Probes persist but main auth-token is empty — likely overwritten by a deletion Set-Cookie.";
  } else if (mainAuth.mainAuthTokenValueLength > 500) {
    storageInterpretation = "Session cookie appears stored with a non-empty main auth-token.";
  } else if (mainAuth.mainAuthTokenExists && mainAuth.mainAuthTokenValueLength === 0) {
    storageInterpretation =
      "Main auth-token name present but 0 B — session cookie stored empty.";
  } else {
    storageInterpretation =
      "Partial cookie state — check auth-related entries and chunk cookies (.0, .1).";
  }

  return {
    h365ProbePresent,
    h365ProbeValue: h365Probe?.value ?? null,
    h365AuthProbePresent,
    h365AuthProbeValue: h365AuthProbe?.value ?? null,
    authRelatedCookieEntries: listAuthRelatedCookieEntries(cookies),
    storageInterpretation,
  };
}

export function formatAuthRelatedCookieEntries(entries: AuthRelatedCookieEntry[]): string {
  if (entries.length === 0) return "—";
  return entries.map((e) => `${e.name}: ${e.valueLength} B`).join("; ");
}
