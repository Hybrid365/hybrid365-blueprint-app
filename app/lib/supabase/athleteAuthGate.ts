import type { NextRequest } from "next/server";
import { hasSupabaseAuthCookieNames } from "@/app/lib/supabase/apiRoute";

/** Forwarded by middleware on every /athlete/* response so layout matches request.cookies. */
export const HYROX_MW_COOKIE_HEADER = "x-hyrox-cookie-present";
export const HYROX_MW_USER_HEADER = "x-hyrox-user-present";
export const HYROX_MW_STAGE_HEADER = "x-hyrox-middleware-stage";
export const HYROX_MW_AUTH_STAGE_HEADER = "x-hyrox-auth-stage";
export const HYROX_MW_REDIRECT_SOURCE_HEADER = "x-hyrox-redirect-source";
export const HYROX_MW_REDIRECT_TARGET_HEADER = "x-hyrox-redirect-target";
export const HYROX_MW_INTERNAL_NAV_HEADER = "x-hyrox-internal-nav";
export const HYROX_MW_PATH_HEADER = "x-hyrox-path";

const ATHLETE_PUBLIC_PATHS = new Set(["/athlete/login", "/athlete/no-access"]);

export function isAthletePublicPath(pathname: string): boolean {
  return ATHLETE_PUBLIC_PATHS.has(pathname);
}

export function isProtectedAthletePortalPath(pathname: string): boolean {
  return pathname.startsWith("/athlete/") && !isAthletePublicPath(pathname);
}

export function parseCookieHeaderNames(cookieHeader: string): string[] {
  if (!cookieHeader.trim()) return [];
  return cookieHeader
    .split(";")
    .map((part) => part.trim().split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name));
}

export function supabaseAuthMarkersPresent(cookies: { name: string }[]): boolean {
  return hasSupabaseAuthCookieNames(cookies);
}

export type AthleteAuthMarkerProbe = {
  fromCookieStore: boolean;
  fromCookieHeader: boolean;
  fromMiddlewareHeader: boolean;
  present: boolean;
};

/** cookies() can be empty on RSC navigations while middleware still saw auth cookies on the request. */
export function probeAthleteAuthMarkers(
  cookieStore: { getAll(): { name: string }[] },
  headerStore: { get(name: string): string | null }
): AthleteAuthMarkerProbe {
  const fromCookieStore = supabaseAuthMarkersPresent(cookieStore.getAll());
  const cookieHeader = headerStore.get("cookie") ?? "";
  const fromCookieHeader = supabaseAuthMarkersPresent(
    parseCookieHeaderNames(cookieHeader).map((name) => ({ name }))
  );
  const fromMiddlewareHeader = headerStore.get(HYROX_MW_COOKIE_HEADER) === "yes";
  return {
    fromCookieStore,
    fromCookieHeader,
    fromMiddlewareHeader,
    present: fromCookieStore || fromCookieHeader || fromMiddlewareHeader,
  };
}

export function middlewareForwardedAthleteAuth(headerStore: {
  get(name: string): string | null;
}): boolean {
  return (
    headerStore.get(HYROX_MW_COOKIE_HEADER) === "yes" ||
    headerStore.get(HYROX_MW_USER_HEADER) === "yes" ||
    headerStore.get(HYROX_MW_INTERNAL_NAV_HEADER) === "1"
  );
}

/**
 * Layout must not redirect to login when middleware already allowed the request through
 * with auth cookies or a resolved user (see probeAthleteAuthMarkers).
 */
/** Next.js client soft navigation (RSC flight) — not link prefetch. */
export function isRscSoftNavigation(request: { headers: { get(name: string): string | null } }): boolean {
  const rsc = request.headers.get("Rsc") ?? request.headers.get("rsc");
  return rsc === "1";
}

/** User navigated from another protected athlete page (e.g. programme → dashboard). */
export function isAthletePortalInternalNavigation(request: NextRequest): boolean {
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    const refPath = new URL(referer).pathname;
    return isProtectedAthletePortalPath(refPath);
  } catch {
    return false;
  }
}

/** Middleware: request.cookies can be empty on RSC flights while Cookie header still has tokens. */
export function authCookiesPresentOnRequest(request: NextRequest): boolean {
  if (supabaseAuthMarkersPresent(request.cookies.getAll())) return true;
  const raw = request.headers.get("cookie") ?? "";
  return supabaseAuthMarkersPresent(
    parseCookieHeaderNames(raw).map((name) => ({ name }))
  );
}

export function shouldAthleteLayoutRedirectToLogin(options: {
  pathname: string;
  userPresent: boolean;
  authMarkers: AthleteAuthMarkerProbe;
  middlewareForwardedAuth: boolean;
  isPrefetch: boolean;
}): boolean {
  if (options.userPresent) return false;
  if (ATHLETE_PUBLIC_PATHS.has(options.pathname)) return false;
  if (options.authMarkers.present) return false;
  if (options.middlewareForwardedAuth) return false;
  if (options.isPrefetch) return false;
  return true;
}
