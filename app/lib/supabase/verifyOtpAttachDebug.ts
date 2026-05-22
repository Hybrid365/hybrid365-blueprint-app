import type { Session } from "@supabase/supabase-js";
import type { createAuthRouteHandlerSupabase } from "@/app/lib/supabase/authRouteHandler";
import { H365_ATHLETE_SESSION_COOKIE } from "@/app/lib/supabase/cookieProbe";
import {
  supabaseSessionAuthOnResponse,
  type ResponseSetCookieDebug,
  type SessionCookiesBuildDebug,
} from "@/app/lib/supabase/persistSupabaseSessionCookies";

export type VerifyOtpAttachDebug = {
  dataSessionExists: boolean;
  accessTokenLength: number;
  refreshTokenLength: number;
  encodedSessionLength: number;
  chunkSize: number;
  cookiesBuiltNames: string[];
  cookiesBuiltValueLengths: number[];
  cookiesBuiltUsesChunks: boolean;
  cookiesBuiltTotalAuthChars: number;
  responseSetCookieNames: string[];
  responseSetCookieValueLengths: number[];
  responseSetCookieDeleteFlags: boolean[];
  hasH365AuthProbe: boolean;
  hasMainAuthToken: boolean;
  hasAuthTokenChunk0: boolean;
  totalAuthChunkValueLength: number;
  mainAuthCookieLargestValueLength: number;
  anyCookieOver3800Chars: boolean;
  anyEmptyAuthCookie: boolean;
  finalRedirectSetCookieCount: number;
  sessionAuthAttached: boolean;
  hasH365AthleteSessionInResponse: boolean;
  h365AthleteSessionAttached: boolean;
  refusedBecauseMainCookieEmpty: boolean;
  refuseReason: string | null;
};

export function buildVerifyOtpAttachDebug(
  data: { session: Session | null } | null,
  build: SessionCookiesBuildDebug | null,
  setCookie: ResponseSetCookieDebug
): VerifyOtpAttachDebug {
  const sbSessionOnResponse = supabaseSessionAuthOnResponse(setCookie);
  const athleteIdx = setCookie.responseSetCookieNames.indexOf(H365_ATHLETE_SESSION_COOKIE);
  const hasH365AthleteSessionInResponse =
    athleteIdx >= 0 && (setCookie.responseSetCookieValueLengths[athleteIdx] ?? 0) > 40;
  const sessionAuthAttached = sbSessionOnResponse || hasH365AthleteSessionInResponse;
  let refuseReason: string | null = null;
  if (!sessionAuthAttached) {
    if (setCookie.refusedBecauseMainCookieEmpty || setCookie.anyEmptyAuthCookie) {
      refuseReason = "main auth cookie empty or deleted in Set-Cookie";
    } else if ((build?.totalAuthChunkValueLength ?? 0) === 0) {
      refuseReason = "no session cookies built from Supabase session";
    } else if (setCookie.finalRedirectSetCookieCount === 0) {
      refuseReason = "no Set-Cookie headers on redirect response";
    } else if (
      setCookie.hasH365AuthProbeInResponse &&
      !sbSessionOnResponse &&
      !hasH365AthleteSessionInResponse
    ) {
      refuseReason =
        "h365_auth_probe present but sb auth chunks and h365_athlete_session missing from response (proxy/header limit?)";
    } else if (
      (build?.totalAuthChunkValueLength ?? 0) > 500 &&
      setCookie.totalAuthChunkValueLength < 80
    ) {
      refuseReason = "sb auth cookies built but not attached to response Set-Cookie headers";
    } else {
      refuseReason = "Supabase session not present on response Set-Cookie headers";
    }
  }

  return {
    dataSessionExists: Boolean(data?.session),
    accessTokenLength: data?.session?.access_token?.length ?? 0,
    refreshTokenLength: data?.session?.refresh_token?.length ?? 0,
    encodedSessionLength: build?.encodedSessionLength ?? 0,
    chunkSize: build?.chunkSize ?? 0,
    cookiesBuiltNames: build?.cookiesBuiltNames ?? [],
    cookiesBuiltValueLengths: build?.cookiesBuiltValueLengths ?? [],
    cookiesBuiltUsesChunks: build?.usesChunkedSessionCookies ?? false,
    cookiesBuiltTotalAuthChars: build?.totalAuthChunkValueLength ?? 0, // alias for UI
    responseSetCookieNames: setCookie.responseSetCookieNames,
    responseSetCookieValueLengths: setCookie.responseSetCookieValueLengths,
    responseSetCookieDeleteFlags: setCookie.responseSetCookieDeleteFlags,
    hasH365AuthProbe: setCookie.hasH365AuthProbeInResponse,
    hasMainAuthToken: setCookie.hasMainAuthTokenInResponse,
    hasAuthTokenChunk0: setCookie.hasAuthTokenChunk0InResponse,
    totalAuthChunkValueLength: setCookie.totalAuthChunkValueLength,
    mainAuthCookieLargestValueLength: setCookie.mainAuthCookieLargestValueLength,
    anyCookieOver3800Chars: setCookie.anyCookieOver3800Chars,
    anyEmptyAuthCookie: setCookie.anyEmptyAuthCookie,
    finalRedirectSetCookieCount: setCookie.finalRedirectSetCookieCount,
    sessionAuthAttached,
    hasH365AthleteSessionInResponse,
    h365AthleteSessionAttached: hasH365AthleteSessionInResponse,
    refusedBecauseMainCookieEmpty: setCookie.refusedBecauseMainCookieEmpty,
    refuseReason,
  };
}

export function logVerifyOtpAttachDebug(
  stage: string,
  debug: VerifyOtpAttachDebug,
  extra?: Record<string, unknown>
) {
  console.log(`[auth otp] ${stage}`, { ...debug, ...extra });
}
