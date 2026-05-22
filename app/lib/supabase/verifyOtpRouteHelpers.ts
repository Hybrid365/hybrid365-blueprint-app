import { NextResponse, type NextRequest } from "next/server";
import type { AuthPortal } from "@/app/lib/authRedirectUrl";
import { attachH365OtpAuthProbe } from "@/app/lib/supabase/cookieProbe";
import {
  MAIN_AUTH_COOKIE_OVERWRITE_ERROR,
  REFUSE_MAIN_AUTH_EMPTY_ERROR,
  type ResponseSetCookieDebug,
} from "@/app/lib/supabase/persistSupabaseSessionCookies";
import type { createAuthRouteHandlerSupabase } from "@/app/lib/supabase/authRouteHandler";

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

/** JSON fetch (community) vs browser form POST (athlete document navigation). */
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

export function cookieAttachFailureMessage(inspect: ResponseSetCookieDebug): string {
  if (inspect.refusedBecauseMainCookieEmpty || inspect.emptyMainAuthTokenSetCookie) {
    return REFUSE_MAIN_AUTH_EMPTY_ERROR;
  }
  if (inspect.duplicateMainAuthTokenNames) {
    return MAIN_AUTH_COOKIE_OVERWRITE_ERROR;
  }
  return "OTP verified but auth cookies were not attached to response";
}

type AuthHandler = Awaited<ReturnType<typeof createAuthRouteHandlerSupabase>>;

export function attachVerifiedSessionCookies(
  auth: AuthHandler,
  response: NextResponse
): ResponseSetCookieDebug {
  auth.attachSessionCookiesToResponse(response);
  attachH365OtpAuthProbe(response);
  return auth.inspectResponseSetCookies(response);
}
