import { NextResponse, type NextRequest } from "next/server";
import {
  getRequestOrigin,
  isAthletePortalParam,
  resolveAuthCallbackNext,
  sanitizeAthleteAuthNextPath,
  sanitizeAuthNextPath,
} from "@/app/lib/authRedirectUrl";
import { autoLinkHyroxAthleteByEmail } from "@/app/lib/hyroxAthleteAutoLink";
import { createAuthRouteHandlerSupabase } from "@/app/lib/supabase/authRouteHandler";
import { hasSupabaseAuthCookieNames } from "@/app/lib/supabase/apiRoute";
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
  rawNext: string | null,
  portal: string | null
): NextResponse {
  const params = new URLSearchParams({
    error: "auth",
    reason,
  });
  const athletePortal =
    isAthletePortalParam(portal) || (rawNext?.trim().startsWith("/athlete/") ?? false);

  if (rawNext) {
    const trimmed = rawNext.trim();
    const nextParam = athletePortal
      ? sanitizeAthleteAuthNextPath(trimmed)
      : sanitizeAuthNextPath(trimmed);
    params.set("next", nextParam);
  }

  const loginPath = athletePortal ? "/athlete/login" : "/login";
  return NextResponse.redirect(`${origin}${loginPath}?${params.toString()}`);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const typeParam = requestUrl.searchParams.get("type");
  const portal = requestUrl.searchParams.get("portal");
  const rawNext = requestUrl.searchParams.get("next");
  const next = resolveAuthCallbackNext(rawNext, { portal });
  const origin = getRequestOrigin(request);
  const errorDescription = requestUrl.searchParams.get("error_description");

  log("[auth callback] received", {
    hasCode: Boolean(code),
    hasTokenHash: Boolean(tokenHash),
    type: typeParam,
    portal,
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
      rawNext,
      portal
    );
  }

  const successUrl = `${origin}${next}`;
  const { supabase, withAuthCookies, getPendingAuthCookieNames } =
    await createAuthRouteHandlerSupabase(request);

  async function tryAthleteAutoLink() {
    if (!next.startsWith("/athlete/")) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return;
    const linkResult = await autoLinkHyroxAthleteByEmail(user.id, user.email);
    log("[auth callback] athlete auto-link", linkResult);
  }

  function finishSuccessRedirect(stage: string, userId: string | null) {
    const cookieNames = getPendingAuthCookieNames();
    const hasAuthCookies = hasSupabaseAuthCookieNames(
      cookieNames.map((name) => ({ name }))
    );
    log("[auth callback] success", {
      stage,
      userId,
      next,
      authCookieNames: cookieNames,
      authCookiesPending: hasAuthCookies,
    });
    if (!hasAuthCookies) {
      log("[auth callback] warning — no auth cookies set on redirect", { cookieNames });
    }
    return withAuthCookies(NextResponse.redirect(successUrl));
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await tryAthleteAutoLink();
      return finishSuccessRedirect("exchange", user?.id ?? null);
    }

    log("[auth callback] exchange failed", {
      message: error.message,
      code: error.code,
      status: error.status,
    });

    const reason = encodeURIComponent(error.code ?? error.message ?? "exchange_failed");
    return loginErrorRedirect(origin, reason, rawNext, portal);
  }

  if (tokenHash) {
    const otpType = otpTypeFromParam(typeParam) ?? "email";
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });

    if (!error) {
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await tryAthleteAutoLink();
      return finishSuccessRedirect("token_hash", user?.id ?? null);
    }

    log("[auth callback] verifyOtp failed", {
      message: error.message,
      code: error.code,
      type: otpType,
    });

    const reason = encodeURIComponent(error.code ?? error.message ?? "verify_failed");
    return loginErrorRedirect(origin, reason, rawNext, portal);
  }

  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();

  if (existingUser) {
    log("[auth callback] existing session — redirecting", {
      userId: existingUser.id,
      next,
    });
    await tryAthleteAutoLink();
    return finishSuccessRedirect("existing-session", existingUser.id);
  }

  log("[auth callback] no code or token_hash — redirecting to login");
  return loginErrorRedirect(origin, "missing_code", rawNext, portal);
}
