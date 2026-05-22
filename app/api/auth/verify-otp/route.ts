import { NextResponse, type NextRequest } from "next/server";
import { resolveVerifyOtpRedirect } from "@/app/lib/authRedirectUrl";
import { createAuthRouteHandlerSupabase } from "@/app/lib/supabase/authRouteHandler";
import { hasSupabaseAuthCookieNames } from "@/app/lib/supabase/apiRoute";

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

  const { supabase, withAuthCookies, getPendingAuthCookieNames } =
    await createAuthRouteHandlerSupabase(request);

  const { data, error } = await supabase.auth.verifyOtp({
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

  if (data.session) {
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    if (setSessionError) {
      console.log("[auth otp] setSession failed", {
        code: setSessionError.code ?? null,
        message: setSessionError.message?.slice(0, 120) ?? null,
      });
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("[auth otp] verify failed", { reason: "no_session_after_verify" });
    return NextResponse.json(
      { ok: false, success: false, error: "Could not establish a session. Try again." },
      { status: 500 }
    );
  }

  const cookieNames = getPendingAuthCookieNames();
  const hasAuthCookies = hasSupabaseAuthCookieNames(
    cookieNames.map((name) => ({ name }))
  );

  console.log("[auth otp] verify success", {
    userId: user.id.slice(0, 8),
    emailHint: emailLogHint(email),
    redirectTo,
    hasSession: Boolean(data.session),
    authCookieNames: cookieNames,
    authCookiesPending: hasAuthCookies,
  });

  if (!hasAuthCookies) {
    console.error("[auth otp] verify succeeded but no Supabase auth cookies were set", {
      cookieNames,
    });
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "Session could not be saved. Try again or use the email link.",
      },
      { status: 500 }
    );
  }

  /**
   * JSON + Set-Cookie (not 303). fetch(redirect:"manual") often hides Location on 303,
   * so the client uses redirectTo + window.location.assign after cookies are set.
   */
  return withAuthCookies(
    NextResponse.json({
      ok: true,
      success: true,
      redirectTo,
      authCookiesSet: true,
    })
  );
}
