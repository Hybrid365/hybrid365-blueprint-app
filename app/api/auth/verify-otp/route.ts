import { NextResponse, type NextRequest } from "next/server";
import { resolveVerifyOtpRedirect } from "@/app/lib/authRedirectUrl";
import {
  assertAuthRouteSession,
  createAuthRouteHandlerSupabase,
} from "@/app/lib/supabase/authRouteHandler";

function emailLogHint(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "invalid";
  return `${email[0] ?? "?"}***@${email.slice(at + 1)}`;
}

function buildVerifyOtpDebug(
  data: {
    session: { access_token?: string; refresh_token?: string } | null;
    user: { id?: string; email?: string } | null;
  } | null,
  auth: Awaited<ReturnType<typeof createAuthRouteHandlerSupabase>>,
  extra?: {
    verifyOtpSuccess?: boolean;
    setCookieHeader?: ReturnType<typeof auth.getSetCookieHeaderDebug>;
    responseStatus?: number;
  }
) {
  const pending = auth.getPendingAuthCookieDebug();
  return {
    ok: extra?.verifyOtpSuccess ?? false,
    verifyOtpSuccess: extra?.verifyOtpSuccess ?? false,
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
    finalSetCookieCount: extra?.setCookieHeader?.count ?? 0,
    finalSetCookieValueLengths: extra?.setCookieHeader?.valueLengths ?? [],
    finalSetCookieHasMaxAgeZero: extra?.setCookieHeader?.hasMaxAgeZero ?? false,
    responseStatus: extra?.responseStatus ?? 200,
  };
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
      failBody.debug = buildVerifyOtpDebug(data, auth, { verifyOtpSuccess: false, responseStatus: 401 });
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
      failBody.debug = buildVerifyOtpDebug(data, auth, { verifyOtpSuccess: true, responseStatus: 500 });
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
      failBody.debug = buildVerifyOtpDebug(data, auth, { verifyOtpSuccess: true, responseStatus: 500 });
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
      failBody.debug = buildVerifyOtpDebug(data, auth, { verifyOtpSuccess: true, responseStatus: 500 });
    }
    return NextResponse.json(failBody, { status: 500 });
  }

  const jsonBody: Record<string, unknown> = {
    ok: true,
    success: true,
    redirectTo,
    authCookiesSet: true,
  };

  if (includeDebug) {
    jsonBody.debug = buildVerifyOtpDebug(data, auth, { verifyOtpSuccess: true, responseStatus: 200 });
  }

  const response = auth.withAuthCookies(NextResponse.json(jsonBody, { status: 200 }));

  console.log("[auth otp] verify success", {
    userId: sessionUser.userId.slice(0, 8),
    emailHint: emailLogHint(email),
    redirectTo,
    setCookie: auth.getSetCookieHeaderDebug(response),
    pending: auth.getPendingAuthCookieDebug(),
  });

  return response;
}
