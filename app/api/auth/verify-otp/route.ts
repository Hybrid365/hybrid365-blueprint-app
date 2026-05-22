import { NextResponse, type NextRequest } from "next/server";
import { resolveVerifyOtpRedirect } from "@/app/lib/authRedirectUrl";
import {
  assertAuthRouteSession,
  createAuthRouteHandlerSupabase,
} from "@/app/lib/supabase/authRouteHandler";
import {
  attachH365OtpAuthProbe,
  H365_OTP_AUTH_PROBE_NAME,
  H365_OTP_AUTH_PROBE_VALUE,
} from "@/app/lib/supabase/cookieProbe";
import type { ResponseSetCookieDebug } from "@/app/lib/supabase/persistSupabaseSessionCookies";
import {
  attachVerifiedSessionCookies,
  athleteVerifyOtpCookieDebugRedirect,
  athleteVerifyOtpErrorRedirect,
  cookieAttachFailureMessage,
  logAndFailAttach,
  parseVerifyOtpRequestBody,
  resolveVerifyOtpPortal,
  verifyOtpSessionCookiesOk,
  wantsJsonVerifyOtpResponse,
} from "@/app/lib/supabase/verifyOtpRouteHelpers";

export const dynamic = "force-dynamic";

function emailLogHint(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "invalid";
  return `${email[0] ?? "?"}***@${email.slice(at + 1)}`;
}

type VerifyOtpDebug = {
  ok: boolean;
  verifyOtpSuccess: boolean;
  dataSessionExists: boolean;
  dataUserExists: boolean;
  accessTokenLength: number;
  refreshTokenLength: number;
  pendingCookieBatchCount: number;
  pendingCookieNames: string[];
  pendingCookieValueLengths: number[];
  pendingHasMaxAgeZero: boolean[];
  pendingHasValueOver500: boolean;
  pendingTotalValueChars: number;
  pendingHasValidSession: boolean;
  responseStatus: number;
  h365AuthProbeSet: boolean;
  h365AuthProbeCookie: string | null;
  h365AuthProbeValue: string | null;
  responseMode: "json" | "redirect" | "probe";
} & ResponseSetCookieDebug;

function buildVerifyOtpDebug(
  data: {
    session: { access_token?: string; refresh_token?: string } | null;
    user: { id?: string; email?: string } | null;
  } | null,
  auth: Awaited<ReturnType<typeof createAuthRouteHandlerSupabase>>,
  extra: {
    verifyOtpSuccess: boolean;
    responseStatus: number;
    setCookie?: ResponseSetCookieDebug;
    h365AuthProbeSet?: boolean;
    responseMode: VerifyOtpDebug["responseMode"];
  }
): VerifyOtpDebug {
  const pending = auth.getPendingAuthCookieDebug();
  const setCookie = extra.setCookie;
  return {
    ok: extra.verifyOtpSuccess && (setCookie?.setCookieHeaderPresent ?? false),
    verifyOtpSuccess: extra.verifyOtpSuccess,
    dataSessionExists: Boolean(data?.session),
    dataUserExists: Boolean(data?.user),
    accessTokenLength: data?.session?.access_token?.length ?? 0,
    refreshTokenLength: data?.session?.refresh_token?.length ?? 0,
    pendingCookieBatchCount: pending.names.length,
    pendingCookieNames: pending.names,
    pendingCookieValueLengths: pending.valueLengths,
    pendingHasMaxAgeZero: pending.maxAgeZero,
    pendingHasValueOver500: pending.hasValueOver500,
    pendingTotalValueChars: pending.totalValueChars,
    pendingHasValidSession: pending.hasValidSession,
    responseStatus: extra.responseStatus,
    responseMode: extra.responseMode,
    setCookieHeaderPresent: setCookie?.setCookieHeaderPresent ?? false,
    setCookieHeaderCount: setCookie?.setCookieHeaderCount ?? 0,
    setCookieHeaderCharLength: setCookie?.setCookieHeaderCharLength ?? 0,
    setCookieCookieNames: setCookie?.setCookieCookieNames ?? [],
    setCookieValueLengths: setCookie?.setCookieValueLengths ?? [],
    setCookieMaxAgeZeroFlags: setCookie?.setCookieMaxAgeZeroFlags ?? [],
    setCookieExpiresDeleteFlags: setCookie?.setCookieExpiresDeleteFlags ?? [],
    hasLargeAuthCookie: setCookie?.hasLargeAuthCookie ?? false,
    mainAuthTokenSetCookieCount: setCookie?.mainAuthTokenSetCookieCount ?? 0,
    duplicateMainAuthTokenNames: setCookie?.duplicateMainAuthTokenNames ?? false,
    emptyMainAuthTokenSetCookie: setCookie?.emptyMainAuthTokenSetCookie ?? false,
    finalMainAuthTokenValueLength: setCookie?.finalMainAuthTokenValueLength ?? 0,
    codeVerifierDeletionNames: setCookie?.codeVerifierDeletionNames ?? [],
    maxSetCookieValueLength: setCookie?.maxSetCookieValueLength ?? 0,
    sessionChunkSetCookieCount: setCookie?.sessionChunkSetCookieCount ?? 0,
    setCookieExceedsSafeLimit: setCookie?.setCookieExceedsSafeLimit ?? false,
    mainStorageKey: setCookie?.mainStorageKey ?? "",
    responseSetCookieNames: setCookie?.responseSetCookieNames ?? [],
    responseSetCookieValueLengths: setCookie?.responseSetCookieValueLengths ?? [],
    responseSetCookieDeleteFlags: setCookie?.responseSetCookieDeleteFlags ?? [],
    mainAuthCookieSetCount: setCookie?.mainAuthCookieSetCount ?? 0,
    mainAuthCookieLargestValueLength: setCookie?.mainAuthCookieLargestValueLength ?? 0,
    mainAuthCookieEmptySetCount: setCookie?.mainAuthCookieEmptySetCount ?? 0,
    chunkCookieNames: setCookie?.chunkCookieNames ?? [],
    codeVerifierCookieNames: setCookie?.codeVerifierCookieNames ?? [],
    refusedBecauseMainCookieEmpty: setCookie?.refusedBecauseMainCookieEmpty ?? false,
    usesChunkedSessionCookies: setCookie?.usesChunkedSessionCookies ?? false,
    totalAuthChunkValueLength: setCookie?.totalAuthChunkValueLength ?? 0,
    hasH365AuthProbeInResponse: setCookie?.hasH365AuthProbeInResponse ?? false,
    hasMainAuthTokenInResponse: setCookie?.hasMainAuthTokenInResponse ?? false,
    hasAuthTokenChunk0InResponse: setCookie?.hasAuthTokenChunk0InResponse ?? false,
    anyCookieOver3800Chars: setCookie?.anyCookieOver3800Chars ?? false,
    anyEmptyAuthCookie: setCookie?.anyEmptyAuthCookie ?? false,
    finalRedirectSetCookieCount: setCookie?.finalRedirectSetCookieCount ?? 0,
    h365AuthProbeSet: extra.h365AuthProbeSet ?? false,
    h365AuthProbeCookie: extra.h365AuthProbeSet ? H365_OTP_AUTH_PROBE_NAME : null,
    h365AuthProbeValue: extra.h365AuthProbeSet ? H365_OTP_AUTH_PROBE_VALUE : null,
  };
}

/** GET ?probeOnly=1 — probe cookie only (same pattern as /api/auth/cookie-probe). */
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("probeOnly") !== "1") {
    return NextResponse.json({ ok: false, error: "Use POST to verify OTP." }, { status: 405 });
  }
  const response = NextResponse.json({
    ok: true,
    probeOnly: true,
    cookie: H365_OTP_AUTH_PROBE_NAME,
  });
  attachH365OtpAuthProbe(response);
  return response;
}

export async function POST(request: NextRequest) {
  const probeOnly = request.nextUrl.searchParams.get("probeOnly") === "1";
  const body = await parseVerifyOtpRequestBody(request);
  const portal = resolveVerifyOtpPortal(request, body);
  const redirectTo = resolveVerifyOtpRedirect(body.next, portal);
  const useJsonResponse = wantsJsonVerifyOtpResponse(request);
  const includeDebug = portal === "athlete" && useJsonResponse;

  if (probeOnly) {
    const response = NextResponse.json({
      ok: true,
      probeOnly: true,
      cookie: H365_OTP_AUTH_PROBE_NAME,
      responseMode: useJsonResponse ? "json" : "redirect",
    });
    attachH365OtpAuthProbe(response);
    return response;
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const token = body.token?.trim().replace(/\s/g, "") ?? "";

  const fail = (message: string, status: number, debug?: VerifyOtpDebug) => {
    if (portal === "athlete" && !useJsonResponse) {
      return athleteVerifyOtpErrorRedirect(request, message, redirectTo);
    }
    return NextResponse.json(
      { ok: false, success: false, error: message, ...(debug ? { debug } : {}) },
      { status }
    );
  };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("Enter a valid email address.", 400);
  }

  if (token.length < 6) {
    return fail("Enter the 6-digit code from your email.", 400);
  }

  const auth = await createAuthRouteHandlerSupabase(request);

  const { data, error } = await auth.supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    const message =
      error.message?.includes("expired") || error.message?.includes("invalid")
        ? "That code expired or was already used. Request a new code and use the latest one."
        : error.message || "Check the code and try again.";
    return fail(
      message,
      401,
      includeDebug
        ? buildVerifyOtpDebug(data, auth, {
            verifyOtpSuccess: false,
            responseStatus: 401,
            responseMode: useJsonResponse ? "json" : "redirect",
          })
        : undefined
    );
  }

  if (!data.session?.access_token || !data.session.refresh_token) {
    return fail(
      "Verification succeeded but no session was returned. Request a new code.",
      500,
      includeDebug
        ? buildVerifyOtpDebug(data, auth, {
            verifyOtpSuccess: true,
            responseStatus: 500,
            responseMode: useJsonResponse ? "json" : "redirect",
          })
        : undefined
    );
  }

  auth.commitSessionCookies(data.session);

  if (!auth.hasValidPendingSessionCookies()) {
    return fail(
      "Session could not be saved. Try again or use the email link.",
      500,
      includeDebug
        ? buildVerifyOtpDebug(data, auth, {
            verifyOtpSuccess: true,
            responseStatus: 500,
            responseMode: useJsonResponse ? "json" : "redirect",
          })
        : undefined
    );
  }

  const sessionUser = await assertAuthRouteSession(auth.supabase, auth);
  if (!sessionUser) {
    return fail(
      "Could not establish a session. Try again.",
      500,
      includeDebug
        ? buildVerifyOtpDebug(data, auth, {
            verifyOtpSuccess: true,
            responseStatus: 500,
            responseMode: useJsonResponse ? "json" : "redirect",
          })
        : undefined
    );
  }

  const responseMode = useJsonResponse ? "json" : "redirect";

  if (portal === "athlete" && !useJsonResponse) {
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    const { setCookie: setCookieInspect, attachDebug } = attachVerifiedSessionCookies(
      auth,
      response,
      data
    );

    if (!verifyOtpSessionCookiesOk(setCookieInspect, attachDebug)) {
      logAndFailAttach("redirect cookie attach failed", attachDebug, {
        userId: sessionUser.userId.slice(0, 8),
        emailHint: emailLogHint(email),
        pending: auth.getPendingAuthCookieDebug(),
      });
      return athleteVerifyOtpCookieDebugRedirect(request, attachDebug, redirectTo);
    }

    console.log("[auth otp] verify redirect success", {
      userId: sessionUser.userId.slice(0, 8),
      emailHint: emailLogHint(email),
      redirectTo,
      attachDebug,
      responseMode: "redirect",
    });

    return response;
  }

  const response = NextResponse.json({
    ok: true,
    success: true,
    redirectTo,
    authCookiesSet: true,
    ...(includeDebug
      ? {
          debug: buildVerifyOtpDebug(data, auth, {
            verifyOtpSuccess: true,
            responseStatus: 200,
            responseMode: "json",
          }),
        }
      : {}),
  });
  const { setCookie: setCookieInspect, attachDebug } = attachVerifiedSessionCookies(
    auth,
    response,
    data
  );

  if (!verifyOtpSessionCookiesOk(setCookieInspect, attachDebug)) {
    logAndFailAttach("json cookie attach failed", attachDebug, {
      userId: sessionUser.userId.slice(0, 8),
      emailHint: emailLogHint(email),
    });
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: cookieAttachFailureMessage(setCookieInspect, attachDebug),
        attachDebug,
        ...(includeDebug
          ? {
              debug: buildVerifyOtpDebug(data, auth, {
                verifyOtpSuccess: true,
                responseStatus: 500,
                setCookie: setCookieInspect,
                responseMode: "json",
              }),
            }
          : {}),
      },
      { status: 500 }
    );
  }

  if (includeDebug) {
    return NextResponse.json({
      ok: true,
      success: true,
      redirectTo,
      authCookiesSet: true,
      attachDebug,
      debug: buildVerifyOtpDebug(data, auth, {
        verifyOtpSuccess: true,
        responseStatus: 200,
        setCookie: setCookieInspect,
        h365AuthProbeSet: true,
        responseMode: "json",
      }),
    });
  }

  console.log("[auth otp] verify json success", {
    userId: sessionUser.userId.slice(0, 8),
    emailHint: emailLogHint(email),
    redirectTo,
    attachDebug,
    responseMode: "json",
  });

  return response;
}
