import { NextResponse, type NextRequest } from "next/server";
import { sanitizeAuthNextPath } from "@/app/lib/authRedirectUrl";
import { createRouteHandlerSupabase } from "@/app/lib/supabase/routeHandler";

function emailLogHint(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "invalid";
  return `${email[0] ?? "?"}***@${email.slice(at + 1)}`;
}

export async function POST(request: NextRequest) {
  let body: { email?: string; token?: string; next?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    console.log("[auth otp] verify failed", { reason: "invalid_json" });
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const token = body.token?.trim().replace(/\s/g, "") ?? "";
  const redirectTo = sanitizeAuthNextPath(body.next);

  console.log("[auth otp] verify requested", {
    emailHint: emailLogHint(email),
    tokenLength: token.length,
    next: redirectTo,
  });

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log("[auth otp] verify failed", { reason: "invalid_email" });
    return NextResponse.json(
      { success: false, error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  if (token.length < 6) {
    console.log("[auth otp] verify failed", { reason: "invalid_token" });
    return NextResponse.json(
      { success: false, error: "Enter the 6-digit code from your email." },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ success: true, redirectTo });
  const supabase = createRouteHandlerSupabase(request, response);

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
    return NextResponse.json({ success: false, error: detail }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("[auth otp] verify failed", { reason: "no_session_after_verify" });
    return NextResponse.json(
      { success: false, error: "Could not establish a session. Try again." },
      { status: 500 }
    );
  }

  console.log("[auth otp] verify success", {
    userId: user.id.slice(0, 8),
    emailHint: emailLogHint(email),
    next: redirectTo,
    hasSession: Boolean(data.session),
  });

  return response;
}
