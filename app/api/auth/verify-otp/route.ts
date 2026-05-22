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
  extra?: { verifyOtpSuccess?: boolean; setCookieHeader?: ReturnType<typeof auth.getSetCookieHeaderDebug> }
) {
  const pending = auth.getPendingAuthCookieDebug();
  return {
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
  };
}

export async function POST(request: NextRequest) {
  let body: { email?: string; token?: string; next?: string; portal?: "athlete" | "community" };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    console.log("[auth otp] verify failed", { reason: "invalid_json" });
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

  console.log("[auth otp] verify requested", {
    emailHint: emailLogHint(email),
    tokenLength: token.length,
    portal,
    nextRaw: body.next ?? null,
    redirectTo,
  });

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log("[auth otp] verify failed", { reason: "invalid_email" });
    return NextResponse.json(
      { ok: false, success: false, error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  if (token.length < 6) {
    console.log("[auth otp] verify failed", { reason: "invalid_token" });
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
    console.log("[auth otp] verify failed", {
      emailHint: emailLogHint(email),
      code: error.code ?? null,
      message: error.message?.slice(0, 120) ?? null,
    });
    const detail =
      error.message?.includes("expired") || error.message?.includes("invalid")
        ? "That code expired or was already used. Request a new code and use the latest one."
        : error.message || "Check the code and try again.";
    return NextResponse.json({
      ok: false,
      success: false,
      error: detail,
      ...(includeDebug ? { debug: buildVerifyOtpDebug(data, auth, { verifyOtpSuccess: false }) } : {}),
    }, { status: 401 });
  }

  if (!data.session?.access_token || !data.session.refresh_token) {
    console.error("[auth otp] verifyOtp returned no session tokens", {
      hasSession: Boolean(data.session),
      hasUser: Boolean(data.user),
    });
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "Verification succeeded but no session was returned. Request a new code.",
        debug: includeDebug
          ? buildVerifyOtpDebug(data, auth, { verifyOtpSuccess: true })
          : undefined,
      },
      { status: 500 }
    );
  }

  auth.commitSessionCookies(data.session);

  const sessionUser = await assertAuthRouteSession(auth.supabase, auth);
  const cookieDebug = auth.getPendingAuthCookieDebug();

  if (!auth.hasValidPendingSessionCookies()) {
    console.error("[auth otp] commitSessionCookies produced invalid pending batch", {
      cookieDebug,
      accessTokenLength: data.session.access_token.length,
    });
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "Session could not be saved. Try again or use the email link.",
        debug: includeDebug
          ? buildVerifyOtpDebug(data, auth, { verifyOtpSuccess: true })
          : undefined,
      },
      { status: 500 }
    );
  }

  if (!sessionUser) {
    console.log("[auth otp] verify failed", {
      reason: "no_user_after_commit",
      cookieDebug,
    });
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "Could not establish a session. Try again.",
        debug: includeDebug
          ? buildVerifyOtpDebug(data, auth, { verifyOtpSuccess: true })
          : undefined,
      },
      { status: 500 }
    );
  }

  console.log("[auth otp] verify success", {
    userId: sessionUser.userId.slice(0, 8),
    emailHint: emailLogHint(email),
    redirectTo,
    cookieDebug,
  });

  const successResponse = auth.withAuthCookies(
    NextResponse.json({
      ok: true,
      success: true,
      redirectTo,
      authCookiesSet: true,
    })
  );

  if (includeDebug) {
    return NextResponse.json(
      {
        ok: true,
        success: true,
        redirectTo,
        authCookiesSet: true,
        debug: buildVerifyOtpDebug(data, auth, {
          verifyOtpSuccess: true,
          setCookieHeader: auth.getSetCookieHeaderDebug(successResponse),
        }),
      },
      { headers: successResponse.headers }
    );
  }

  return successResponse;
}
