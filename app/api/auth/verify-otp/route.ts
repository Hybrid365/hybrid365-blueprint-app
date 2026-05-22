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
    return NextResponse.json({ ok: false, success: false, error: detail }, { status: 401 });
  }

  const cookiesReady = await auth.waitForSessionCookies();
  const sessionUser = await assertAuthRouteSession(auth.supabase, auth);
  const cookieDebug = auth.getPendingAuthCookieDebug();

  const devDebug =
    process.env.NODE_ENV === "development"
      ? {
          verifyReturnedSession: Boolean(data.session),
          sessionHasAccessToken: Boolean(data.session?.access_token),
          sessionHasRefreshToken: Boolean(data.session?.refresh_token),
          userEmail: sessionUser?.email ?? null,
          cookiesReady,
          cookieNames: cookieDebug.names,
          cookieValueLengths: cookieDebug.valueLengths,
          pendingCookieCount: cookieDebug.names.length,
        }
      : undefined;

  if (!sessionUser) {
    console.log("[auth otp] verify failed", {
      reason: "no_session_after_verify",
      cookieDebug,
      cookiesReady,
    });
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "Could not establish a session. Try again.",
        debug: devDebug,
      },
      { status: 500 }
    );
  }

  if (!auth.hasValidPendingSessionCookies()) {
    console.error("[auth otp] verify succeeded but session cookies are invalid/too small", {
      cookieDebug,
      cookiesReady,
    });
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "Session could not be saved. Try again or use the email link.",
        debug: devDebug,
      },
      { status: 500 }
    );
  }

  console.log("[auth otp] verify success", {
    userId: sessionUser.userId.slice(0, 8),
    emailHint: emailLogHint(email),
    redirectTo,
    cookieDebug,
    cookiesReady,
  });

  const jsonBody: Record<string, unknown> = {
    ok: true,
    success: true,
    redirectTo,
    authCookiesSet: true,
  };
  if (devDebug) jsonBody.debug = devDebug;

  const response = NextResponse.json(jsonBody);
  const final = auth.withAuthCookies(response);
  const setCookieCount = final.headers.getSetCookie?.()?.length ?? 0;

  if (process.env.NODE_ENV === "development") {
    console.log("[auth otp] response Set-Cookie count", setCookieCount);
  }

  return final;
}
