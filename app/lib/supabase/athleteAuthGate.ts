import { hasSupabaseAuthCookieNames } from "@/app/lib/supabase/apiRoute";

/** Forwarded by middleware on every /athlete/* response so layout matches request.cookies. */
export const HYROX_MW_COOKIE_HEADER = "x-hyrox-cookie-present";
export const HYROX_MW_USER_HEADER = "x-hyrox-user-present";
export const HYROX_MW_STAGE_HEADER = "x-hyrox-middleware-stage";
export const HYROX_MW_REDIRECT_SOURCE_HEADER = "x-hyrox-redirect-source";
export const HYROX_MW_REDIRECT_TARGET_HEADER = "x-hyrox-redirect-target";

const ATHLETE_PUBLIC_PATHS = new Set(["/athlete/login", "/athlete/no-access"]);

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
    headerStore.get(HYROX_MW_USER_HEADER) === "yes"
  );
}

/**
 * Layout must not redirect to login when middleware already allowed the request through
 * with auth cookies or a resolved user (see probeAthleteAuthMarkers).
 */
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
