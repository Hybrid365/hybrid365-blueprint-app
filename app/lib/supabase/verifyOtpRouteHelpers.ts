import { NextResponse, type NextRequest } from "next/server";
import type { AuthPortal } from "@/app/lib/authRedirectUrl";
import { attachH365OtpAuthProbe } from "@/app/lib/supabase/cookieProbe";
import {
  REFUSE_MAIN_AUTH_EMPTY_ERROR,
  responseAuthSetCookiesAreValid,
  sessionAuthCookiesAttachedOnResponse,
  SUPABASE_SESSION_NOT_ATTACHED_ERROR,
  type ResponseSetCookieDebug,
} from "@/app/lib/supabase/persistSupabaseSessionCookies";
import {
  buildVerifyOtpAttachDebug,
  logVerifyOtpAttachDebug,
  type VerifyOtpAttachDebug,
} from "@/app/lib/supabase/verifyOtpAttachDebug";
import type { createAuthRouteHandlerSupabase } from "@/app/lib/supabase/authRouteHandler";
import type { Session } from "@supabase/supabase-js";

export type { VerifyOtpAttachDebug };

export type VerifyOtpRequestBody = {
  email?: string;
  token?: string;
  next?: string;
  portal?: AuthPortal;
};

export async function parseVerifyOtpRequestBody(
  request: NextRequest
): Promise<VerifyOtpRequestBody> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return (await request.json()) as VerifyOtpRequestBody;
    } catch {
      return {};
    }
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    const portalRaw = form.get("portal")?.toString().trim().toLowerCase();
    return {
      email: form.get("email")?.toString(),
      token: form.get("token")?.toString() ?? form.get("code")?.toString(),
      next: form.get("next")?.toString(),
      portal: portalRaw === "athlete" || portalRaw === "community" ? portalRaw : undefined,
    };
  }

  return {};
}

export function wantsJsonVerifyOtpResponse(request: NextRequest): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return true;
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    return false;
  }
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html")) return false;
  return accept.includes("application/json");
}

export function resolveVerifyOtpPortal(
  request: NextRequest,
  body: VerifyOtpRequestBody
): AuthPortal {
  const referer = request.headers.get("referer") ?? "";
  const portalFromReferer = referer.includes("/athlete/login") ? "athlete" : undefined;
  return (
    body.portal ??
    portalFromReferer ??
    (body.next?.trim().startsWith("/athlete/") ? "athlete" : "community")
  );
}

export function athleteVerifyOtpErrorRedirect(
  request: NextRequest,
  message: string,
  next: string
): NextResponse {
  const url = new URL("/athlete/login", request.url);
  url.searchParams.set("error", "otp");
  url.searchParams.set("reason", message.slice(0, 200));
  if (next) url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

/** Visible debug page when session Set-Cookie attachment fails. */
export function athleteVerifyOtpCookieDebugRedirect(
  request: NextRequest,
  attachDebug: VerifyOtpAttachDebug,
  next: string
): NextResponse {
  const url = new URL("/athlete/login/verify-debug", request.url);
  if (next) url.searchParams.set("next", next);
  try {
    const payload = Buffer.from(JSON.stringify(attachDebug), "utf8").toString("base64url");
    if (payload.length < 6000) {
      url.searchParams.set("d", payload);
    }
  } catch {
    /* ignore */
  }
  return NextResponse.redirect(url);
}

export function cookieAttachFailureMessage(
  inspect: ResponseSetCookieDebug,
  attachDebug?: VerifyOtpAttachDebug
): string {
  if (attachDebug?.refuseReason?.includes("empty or deleted")) {
    return REFUSE_MAIN_AUTH_EMPTY_ERROR;
  }
  if (inspect.refusedBecauseMainCookieEmpty || inspect.anyEmptyAuthCookie) {
    return REFUSE_MAIN_AUTH_EMPTY_ERROR;
  }
  return SUPABASE_SESSION_NOT_ATTACHED_ERROR;
}

type AuthHandler = Awaited<ReturnType<typeof createAuthRouteHandlerSupabase>>;

export function attachVerifiedSessionCookies(
  auth: AuthHandler,
  response: NextResponse,
  data: { session: Session | null } | null
): { setCookie: ResponseSetCookieDebug; attachDebug: VerifyOtpAttachDebug } {
  auth.attachSessionCookiesToResponse(response);
  attachH365OtpAuthProbe(response);
  const setCookie = auth.inspectResponseSetCookies(response);
  const attachDebug = buildVerifyOtpAttachDebug(
    data,
    auth.getLastCookiesBuildDebug(),
    setCookie
  );
  return { setCookie, attachDebug };
}

export function verifyOtpSessionCookiesOk(
  setCookie: ResponseSetCookieDebug,
  attachDebug: VerifyOtpAttachDebug
): boolean {
  return responseAuthSetCookiesAreValid(setCookie) && attachDebug.sessionAuthAttached;
}

export function logAndFailAttach(
  stage: string,
  attachDebug: VerifyOtpAttachDebug,
  extra?: Record<string, unknown>
) {
  logVerifyOtpAttachDebug(stage, attachDebug, extra);
}
