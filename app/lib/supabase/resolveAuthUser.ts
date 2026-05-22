import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";
import { hasSupabaseAuthCookieNames } from "@/app/lib/supabase/apiRoute";

export type AuthUserResolution = {
  user: User | null;
  error: AuthError | null;
  retriedWithSession: boolean;
};

/**
 * Resolve the current Supabase user — mirrors app/athlete/layout.tsx:
 * getUser() first, then getSession() + getUser() when auth cookies are present.
 */
export async function resolveAuthUserWithSessionRetry(
  supabase: SupabaseClient,
  options?: { hasAuthCookie?: boolean }
): Promise<AuthUserResolution> {
  let retriedWithSession = false;

  const {
    data: { user: firstUser },
    error: firstError,
  } = await supabase.auth.getUser();

  if (firstUser) {
    return { user: firstUser, error: firstError, retriedWithSession: false };
  }

  const hasAuthCookie = options?.hasAuthCookie ?? true;
  if (!hasAuthCookie) {
    return { user: null, error: firstError, retriedWithSession: false };
  }

  await supabase.auth.getSession();
  retriedWithSession = true;

  const {
    data: { user: secondUser },
    error: secondError,
  } = await supabase.auth.getUser();

  if (secondUser) {
    return { user: secondUser, error: secondError, retriedWithSession: true };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    user: session?.user ?? null,
    error: secondError ?? firstError,
    retriedWithSession: true,
  };
}

export function authCookiesPresent(cookies: { name: string }[]): boolean {
  return hasSupabaseAuthCookieNames(cookies);
}

/**
 * Middleware-optimised auth: refresh session first, then resolve user.
 * Avoids redirecting on expired access tokens when a refresh token is still valid.
 */
export async function resolveAuthUserForMiddleware(
  supabase: SupabaseClient,
  hasAuthCookie: boolean
): Promise<AuthUserResolution> {
  let retriedWithSession = false;

  if (hasAuthCookie) {
    await supabase.auth.getSession();
    retriedWithSession = true;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user) {
    return { user, error, retriedWithSession };
  }

  if (!hasAuthCookie) {
    return { user: null, error, retriedWithSession: false };
  }

  if (!retriedWithSession) {
    await supabase.auth.getSession();
    retriedWithSession = true;
    const retry = await supabase.auth.getUser();
    if (retry.data.user) {
      return { user: retry.data.user, error: retry.error, retriedWithSession: true };
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    user: session?.user ?? null,
    error,
    retriedWithSession: true,
  };
}

export function isNextRouterPrefetch(request: { headers: Headers }): boolean {
  return (
    request.headers.get("Next-Router-Prefetch") === "1" ||
    request.headers.get("Purpose") === "prefetch" ||
    request.headers.get("x-middleware-prefetch") === "1" ||
    request.headers.get("RSC") === "1"
  );
}

export function shouldExposeHyroxMiddlewareDebug(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.HYROX_MIDDLEWARE_DEBUG === "1"
  );
}
