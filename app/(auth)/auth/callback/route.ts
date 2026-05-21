import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getRequestOrigin,
  resolveAuthCallbackNext,
  sanitizeAthleteAuthNextPath,
  sanitizeAuthNextPath,
} from "@/app/lib/authRedirectUrl";
import { autoLinkHyroxAthleteByEmail } from "@/app/lib/hyroxAthleteAutoLink";
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

function loginErrorRedirect(
  origin: string,
  reason: string,
  rawNext: string | null
): NextResponse {
  const params = new URLSearchParams({
    error: "auth",
    reason,
  });
  if (rawNext) {
    const trimmed = rawNext.trim();
    const nextParam = trimmed.startsWith("/athlete/")
      ? sanitizeAthleteAuthNextPath(trimmed)
      : sanitizeAuthNextPath(trimmed);
    params.set("next", nextParam);
    const loginPath = trimmed.startsWith("/athlete/") ? "/athlete/login" : "/login";
    return NextResponse.redirect(`${origin}${loginPath}?${params.toString()}`);
  }
  return NextResponse.redirect(`${origin}/login?${params.toString()}`);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const typeParam = requestUrl.searchParams.get("type");
  const rawNext = requestUrl.searchParams.get("next");
  const next = resolveAuthCallbackNext(rawNext);
  const origin = getRequestOrigin(request);
  const errorDescription = requestUrl.searchParams.get("error_description");

  log("[auth callback] received", {
    hasCode: Boolean(code),
    hasTokenHash: Boolean(tokenHash),
    type: typeParam,
    rawNext,
    next,
    errorDescription: errorDescription ?? undefined,
  });

  if (errorDescription) {
    log("[auth callback] redirecting to login (provider error)", {
      errorDescription,
    });
    return loginErrorRedirect(
      origin,
      encodeURIComponent(errorDescription.slice(0, 120)),
      rawNext
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

  const hasAuthPayload = Boolean(code || tokenHash);

  async function tryAthleteAutoLink() {
    if (!next.startsWith("/athlete/")) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return;
    const linkResult = await autoLinkHyroxAthleteByEmail(user.id, user.email);
    log("[auth callback] athlete auto-link", linkResult);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      log("[auth callback] exchange success", { userId: user?.id ?? null, next });
      await tryAthleteAutoLink();
      return response;
    }

    log("[auth callback] exchange failed", {
      message: error.message,
      code: error.code,
      status: error.status,
    });

    const reason = encodeURIComponent(error.code ?? error.message ?? "exchange_failed");
    return loginErrorRedirect(origin, reason, rawNext);
  }

  if (tokenHash) {
    const otpType = otpTypeFromParam(typeParam) ?? "email";
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      log("[auth callback] verifyOtp (token_hash) success", {
        type: otpType,
        userId: user?.id ?? null,
        next,
      });
      await tryAthleteAutoLink();
      return response;
    }

    log("[auth callback] verifyOtp failed", {
      message: error.message,
      code: error.code,
      type: otpType,
    });

    const reason = encodeURIComponent(error.code ?? error.message ?? "verify_failed");
    return loginErrorRedirect(origin, reason, rawNext);
  }

  if (!hasAuthPayload) {
    const {
      data: { user: existingUser },
    } = await supabase.auth.getUser();

    if (existingUser) {
      log("[auth callback] existing session — redirecting", {
        userId: existingUser.id,
        next,
      });
      await tryAthleteAutoLink();
      return response;
    }
  }

  log("[auth callback] no code or token_hash — redirecting to login");
  return loginErrorRedirect(origin, "missing_code", rawNext);
}
