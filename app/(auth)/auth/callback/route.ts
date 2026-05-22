import { NextResponse, type NextRequest } from "next/server";
import {
  getRequestOrigin,
  isAthletePortalParam,
  resolveAuthCallbackNext,
  sanitizeAthleteAuthNextPath,
  sanitizeAuthNextPath,
} from "@/app/lib/authRedirectUrl";
import { autoLinkHyroxAthleteByEmail } from "@/app/lib/hyroxAthleteAutoLink";
import {
  assertAuthRouteSession,
  createAuthRouteHandlerSupabase,
} from "@/app/lib/supabase/authRouteHandler";
import type { EmailOtpType, Session } from "@supabase/supabase-js";

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
  const auth = await createAuthRouteHandlerSupabase(request);

  async function tryAthleteAutoLink() {
    if (!next.startsWith("/athlete/")) return;
    const {
      data: { user },
    } = await auth.supabase.auth.getUser();
    if (!user?.email) return;
    const linkResult = await autoLinkHyroxAthleteByEmail(user.id, user.email);
    log("[auth callback] athlete auto-link", linkResult);
  }

  async function finishSuccessRedirect(stage: string, session: Session | null) {
    if (!session?.access_token || !session.refresh_token) {
      log("[auth callback] no session on success path", { stage });
      return loginErrorRedirect(origin, "session_not_returned", rawNext, portal);
    }

    auth.commitSessionCookies(session);
    const sessionUser = await assertAuthRouteSession(auth.supabase, auth);
    const cookieDebug = auth.getPendingAuthCookieDebug();

    log("[auth callback] success", {
      stage,
      userId: sessionUser?.userId ?? null,
      next,
      cookieDebug,
    });

    if (!sessionUser || !auth.hasValidPendingSessionCookies()) {
      log("[auth callback] invalid session cookies after auth", { stage, cookieDebug });
      return loginErrorRedirect(origin, "session_not_saved", rawNext, portal);
    }

    await tryAthleteAutoLink();
    return auth.withAuthCookies(NextResponse.redirect(successUrl));
  }

  if (code) {
    const { data, error } = await auth.supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return finishSuccessRedirect("exchange", data.session);
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
    const { data, error } = await auth.supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });

    if (!error) {
      return finishSuccessRedirect("token_hash", data.session);
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
  } = await auth.supabase.auth.getUser();

  if (existingUser) {
    log("[auth callback] existing session — redirecting", {
      userId: existingUser.id,
      next,
    });
    const {
      data: { session },
    } = await auth.supabase.auth.getSession();
    return finishSuccessRedirect("existing-session", session);
  }

  log("[auth callback] no code or token_hash — redirecting to login");
  return loginErrorRedirect(origin, "missing_code", rawNext, portal);
}
