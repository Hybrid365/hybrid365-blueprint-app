import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getRequestOrigin, sanitizeAuthNextPath } from "@/app/lib/authRedirectUrl";
import type { EmailOtpType } from "@supabase/supabase-js";

function log(message: string, extra?: Record<string, unknown>) {
  if (extra) {
    console.log(message, extra);
  } else {
    console.log(message);
  }
}

function otpTypeFromParam(type: string | null): EmailOtpType | null {
  if (!type) return null;
  const t = type.toLowerCase();
  if (t === "magiclink" || t === "magic_link") return "magiclink";
  if (t === "email") return "email";
  if (t === "signup") return "signup";
  if (t === "invite") return "invite";
  if (t === "recovery") return "recovery";
  if (t === "email_change") return "email_change";
  return null;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const typeParam = requestUrl.searchParams.get("type");
  const next = sanitizeAuthNextPath(requestUrl.searchParams.get("next"));
  const origin = getRequestOrigin(request);
  const errorDescription = requestUrl.searchParams.get("error_description");

  log("[auth callback] received", {
    hasCode: Boolean(code),
    hasTokenHash: Boolean(tokenHash),
    type: typeParam,
    next,
    errorDescription: errorDescription ?? undefined,
  });

  if (errorDescription) {
    log("[auth callback] redirecting to login (provider error)", {
      errorDescription,
    });
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent(errorDescription.slice(0, 120))}`
    );
  }

  const successUrl = `${origin}${next}`;
  let response = NextResponse.redirect(successUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();

  if (existingUser) {
    log("[auth callback] already authenticated — skipping exchange");
    log("[auth callback] redirecting to", { next });
    return response;
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      log("[auth callback] exchange success");
      log("[auth callback] redirecting to", { next });
      return response;
    }

    log("[auth callback] exchange failed", {
      message: error.message,
      code: error.code,
      status: error.status,
    });

    const reason = encodeURIComponent(error.code ?? error.message ?? "exchange_failed");
    response = NextResponse.redirect(`${origin}/login?error=auth&reason=${reason}`);
    return response;
  }

  if (tokenHash) {
    const otpType = otpTypeFromParam(typeParam) ?? "email";
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });

    if (!error) {
      log("[auth callback] verifyOtp (token_hash) success", { type: otpType });
      log("[auth callback] redirecting to", { next });
      return response;
    }

    log("[auth callback] verifyOtp failed", {
      message: error.message,
      code: error.code,
      type: otpType,
    });

    const reason = encodeURIComponent(error.code ?? error.message ?? "verify_failed");
    response = NextResponse.redirect(`${origin}/login?error=auth&reason=${reason}`);
    return response;
  }

  log("[auth callback] no code or token_hash — redirecting to login");
  return NextResponse.redirect(`${origin}/login?error=auth&reason=missing_code`);
}
