import { NextResponse, type NextRequest } from "next/server";
import { resolveVerifyOtpRedirect } from "@/app/lib/authRedirectUrl";
import {
  assertAuthRouteSession,
  createAuthRouteHandlerSupabase,
} from "@/app/lib/supabase/authRouteHandler";
import {
  attachH365OtpAuthProbe,
  copySetCookieHeaders,
  H365_OTP_AUTH_PROBE_NAME,
  H365_OTP_AUTH_PROBE_VALUE,
} from "@/app/lib/supabase/cookieProbe";
import {
  MAIN_AUTH_COOKIE_OVERWRITE_ERROR,
  type ResponseSetCookieDebug,
} from "@/app/lib/supabase/persistSupabaseSessionCookies";

const COOKIE_ATTACH_ERROR =
  "OTP verified but auth cookies were not attached to response";

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
  }
): VerifyOtpDebug {
  const pending = auth.getPendingAuthCookieDebug();
  return {
    ok: extra.verifyOtpSuccess && (extra.setCookie?.setCookieHeaderPresent ?? false),
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
    setCookieHeaderPresent: extra.setCookie?.setCookieHeaderPresent ?? false,
    setCookieHeaderCount: extra.setCookie?.setCookieHeaderCount ?? 0,
    setCookieHeaderCharLength: extra.setCookie?.setCookieHeaderCharLength ?? 0,
    setCookieCookieNames: extra.setCookie?.setCookieCookieNames ?? [],
    setCookieValueLengths: extra.setCookie?.setCookieValueLengths ?? [],
    setCookieMaxAgeZeroFlags: extra.setCookie?.setCookieMaxAgeZeroFlags ?? [],
    setCookieExpiresDeleteFlags: extra.setCookie?.setCookieExpiresDeleteFlags ?? [],
    hasLargeAuthCookie: extra.setCookie?.hasLargeAuthCookie ?? false,
    mainAuthTokenSetCookieCount: extra.setCookie?.mainAuthTokenSetCookieCount ?? 0,
    duplicateMainAuthTokenNames: extra.setCookie?.duplicateMainAuthTokenNames ?? false,
    emptyMainAuthTokenSetCookie: extra.setCookie?.emptyMainAuthTokenSetCookie ?? false,
    finalMainAuthTokenValueLength: extra.setCookie?.finalMainAuthTokenValueLength ?? 0,
    codeVerifierDeletionNames: extra.setCookie?.codeVerifierDeletionNames ?? [],
    maxSetCookieValueLength: extra.setCookie?.maxSetCookieValueLength ?? 0,
    sessionChunkSetCookieCount: extra.setCookie?.sessionChunkSetCookieCount ?? 0,
    setCookieExceedsSafeLimit: extra.setCookie?.setCookieExceedsSafeLimit ?? false,
    h365AuthProbeSet: extra.h365AuthProbeSet ?? false,
    h365AuthProbeCookie: extra.h365AuthProbeSet ? H365_OTP_AUTH_PROBE_NAME : null,
    h365AuthProbeValue: extra.h365AuthProbeSet ? H365_OTP_AUTH_PROBE_VALUE : null,
  };
}

function cookieAttachFailureMessage(inspect: ResponseSetCookieDebug): string {
  if (inspect.duplicateMainAuthTokenNames || inspect.emptyMainAuthTokenSetCookie) {
    return MAIN_AUTH_COOKIE_OVERWRITE_ERROR;
  }
  return COOKIE_ATTACH_ERROR;
}

export async function POST(request: NextRequest) {
  let body: { email?: string; token?: string; next?: string; portal?: "athlete" | "community" };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, success: false, error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const token = body.token?.trim().replace(/\s/g, "") ?? "";
  const referer = request.headers.get("referer") ?? "";
  const portalFromReferer = referer.includes("/athlete/login") ? "athlete" : undefined;
  const portal =
    body.portal ??
    portalFromReferer ??
    (body.next?.trim().startsWith("/athlete/") ? "athlete" : "community");

  const redirectTo = resolveVerifyOtpRedirect(body.next, portal);
  const includeDebug = portal === "athlete";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, success: false, error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  if (token.length < 6) {
    return NextResponse.json(
      { ok: false, success: false, error: "Enter the 6-digit code from your email." },
      { status: 400 }
    );
  }

  const auth = await createAuthRouteHandlerSupabase(request);

  const { data, error } = await auth.supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    const failBody: Record<string, unknown> = {
      ok: false,
      success: false,
      error:
        error.message?.includes("expired") || error.message?.includes("invalid")
          ? "That code expired or was already used. Request a new code and use the latest one."
          : error.message || "Check the code and try again.",
    };
    if (includeDebug) {
      failBody.debug = buildVerifyOtpDebug(data, auth, {
        verifyOtpSuccess: false,
        responseStatus: 401,
      });
    }
    return NextResponse.json(failBody, { status: 401 });
  }

  if (!data.session?.access_token || !data.session.refresh_token) {
    const failBody: Record<string, unknown> = {
      ok: false,
      success: false,
      error: "Verification succeeded but no session was returned. Request a new code.",
    };
    if (includeDebug) {
      failBody.debug = buildVerifyOtpDebug(data, auth, {
        verifyOtpSuccess: true,
        responseStatus: 500,
      });
    }
    return NextResponse.json(failBody, { status: 500 });
  }

  auth.commitSessionCookies(data.session);

  if (!auth.hasValidPendingSessionCookies()) {
    const failBody: Record<string, unknown> = {
      ok: false,
      success: false,
      error: "Session could not be saved. Try again or use the email link.",
    };
    if (includeDebug) {
      failBody.debug = buildVerifyOtpDebug(data, auth, {
        verifyOtpSuccess: true,
        responseStatus: 500,
      });
    }
    return NextResponse.json(failBody, { status: 500 });
  }

  const sessionUser = await assertAuthRouteSession(auth.supabase, auth);
  if (!sessionUser) {
    const failBody: Record<string, unknown> = {
      ok: false,
      success: false,
      error: "Could not establish a session. Try again.",
    };
    if (includeDebug) {
      failBody.debug = buildVerifyOtpDebug(data, auth, {
        verifyOtpSuccess: true,
        responseStatus: 500,
      });
    }
    return NextResponse.json(failBody, { status: 500 });
  }

  const cookieProbe = new NextResponse(null, { status: 200 });
  auth.attachSessionCookiesToResponse(cookieProbe);
  const setCookieInspect = auth.inspectResponseSetCookies(cookieProbe);

  const fullDebug = buildVerifyOtpDebug(data, auth, {
    verifyOtpSuccess: true,
    responseStatus: 200,
    setCookie: setCookieInspect,
  });

  if (!auth.responseAuthCookiesAreValid(cookieProbe)) {
    console.error("[auth otp] verify cookie attach failed", {
      userId: sessionUser.userId.slice(0, 8),
      emailHint: emailLogHint(email),
      pending: auth.getPendingAuthCookieDebug(),
      setCookie: setCookieInspect,
    });
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: cookieAttachFailureMessage(setCookieInspect),
        ...(includeDebug ? { debug: fullDebug } : {}),
      },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    success: true,
    redirectTo,
    authCookiesSet: true,
  });
  auth.attachSessionCookiesToResponse(response);
  attachH365OtpAuthProbe(response);

  const returnedInspect = auth.inspectResponseSetCookies(response);
  if (!auth.responseAuthCookiesAreValid(response)) {
    console.error("[auth otp] returned response missing Set-Cookie", {
      userId: sessionUser.userId.slice(0, 8),
      emailHint: emailLogHint(email),
      probe: setCookieInspect,
      returned: returnedInspect,
    });
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: cookieAttachFailureMessage(returnedInspect),
        ...(includeDebug
          ? {
              debug: buildVerifyOtpDebug(data, auth, {
                verifyOtpSuccess: true,
                responseStatus: 500,
                setCookie: returnedInspect,
              }),
            }
          : {}),
      },
      { status: 500 }
    );
  }

  if (includeDebug) {
    const withDebug = NextResponse.json({
      ok: true,
      success: true,
      redirectTo,
      authCookiesSet: true,
      debug: {
        ...buildVerifyOtpDebug(data, auth, {
          verifyOtpSuccess: true,
          responseStatus: 200,
          setCookie: returnedInspect,
          h365AuthProbeSet: true,
        }),
        h365AuthProbeCookie: H365_OTP_AUTH_PROBE_NAME,
        h365AuthProbeValue: H365_OTP_AUTH_PROBE_VALUE,
      },
    });
    copySetCookieHeaders(response, withDebug);
    console.log("[auth otp] verify success", {
      userId: sessionUser.userId.slice(0, 8),
      emailHint: emailLogHint(email),
      redirectTo,
      setCookie: returnedInspect,
      pending: auth.getPendingAuthCookieDebug(),
      h365AuthProbe: H365_OTP_AUTH_PROBE_NAME,
    });
    return withDebug;
  }

  console.log("[auth otp] verify success", {
    userId: sessionUser.userId.slice(0, 8),
    emailHint: emailLogHint(email),
    redirectTo,
    setCookie: returnedInspect,
    pending: auth.getPendingAuthCookieDebug(),
    h365AuthProbe: H365_OTP_AUTH_PROBE_NAME,
  });

  return response;
}
