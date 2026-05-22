import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  buildAthleteLoginNextFromRequest,
  buildLoginNextFromRequest,
} from "@/app/lib/authRedirectUrl";
import {
  authCookiesPresentOnRequest,
  HYROX_MW_AUTH_STAGE_HEADER,
  HYROX_MW_INTERNAL_NAV_HEADER,
  HYROX_MW_PATH_HEADER,
  isAthletePortalInternalNavigation,
  isAthletePublicPath,
  isProtectedAthletePortalPath,
} from "@/app/lib/supabase/athleteAuthGate";
import {
  isHyroxProgrammeRoute,
  isNextRouterPrefetch,
  resolveAuthUserForMiddleware,
  shouldExposeHyroxMiddlewareDebug,
} from "@/app/lib/supabase/resolveAuthUser";
import { evaluateAthleteEmailAccess } from "@/app/lib/hyroxAthleteAutoLink";
import { logHyroxAuthDebug } from "@/app/lib/hyroxAuthDebug";
import {
  resolveHyroxAthleteAccess,
  resolveHyroxCoachAccess,
} from "@/app/lib/hyroxAccess";
import type { ProfileRole } from "@/app/lib/hyroxRoles";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export type HyroxMiddlewareDebugMeta = {
  stage: string;
  userPresent: boolean;
  cookiePresent: boolean;
  refreshAttempted: boolean;
  redirectTarget?: string;
};

export function createMiddlewareClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  let pendingCookies: CookieToSet[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          pendingCookies = cookiesToSet;
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, supabaseResponse, getPendingCookies: () => pendingCookies };
}

function applyPendingCookies(response: NextResponse, pendingCookies: CookieToSet[]) {
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
}

function attachHyroxMiddlewareDebugHeaders(
  response: NextResponse,
  path: string,
  meta: HyroxMiddlewareDebugMeta,
  options?: {
    redirectSource?: "middleware" | "layout" | "client" | "other";
    internalNav?: boolean;
  }
): NextResponse {
  const programmeRoute = isHyroxProgrammeRoute(path);
  const athleteRoute = path.startsWith("/athlete");
  const exposeDebug =
    programmeRoute || (shouldExposeHyroxMiddlewareDebug() && athleteRoute);

  if (athleteRoute) {
    response.headers.set(HYROX_MW_PATH_HEADER, path);
    response.headers.set("x-hyrox-middleware-stage", meta.stage);
    response.headers.set(HYROX_MW_AUTH_STAGE_HEADER, meta.stage);
    response.headers.set("x-hyrox-cookie-present", meta.cookiePresent ? "yes" : "no");
    response.headers.set("x-hyrox-user-present", meta.userPresent ? "yes" : "no");
    if (meta.redirectTarget) {
      response.headers.set("x-hyrox-redirect-target", meta.redirectTarget);
    }
    if (options?.redirectSource) {
      response.headers.set("x-hyrox-redirect-source", options.redirectSource);
    }
    if (options?.internalNav) {
      response.headers.set(HYROX_MW_INTERNAL_NAV_HEADER, "1");
    }
    if (programmeRoute) {
      response.headers.set("x-hyrox-programme-route-hit", "1");
    }
  }

  if (!exposeDebug) return response;

  response.headers.set("x-hyrox-refresh-attempted", meta.refreshAttempted ? "yes" : "no");
  return response;
}

/** Apply refreshed Supabase cookies and forward pathname to server layouts. */
function finalizeMiddlewareResponse(
  request: NextRequest,
  pendingCookies: CookieToSet[],
  meta: HyroxMiddlewareDebugMeta,
  options?: { internalNav?: boolean }
): NextResponse {
  const path = request.nextUrl.pathname;
  const response = NextResponse.next({ request });
  applyPendingCookies(response, pendingCookies);
  response.headers.set(
    "x-pathname",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  return attachHyroxMiddlewareDebugHeaders(response, path, meta, options);
}

function communityLoginRedirect(
  request: NextRequest,
  pendingCookies: CookieToSet[],
  meta: HyroxMiddlewareDebugMeta
) {
  const safeNext = buildLoginNextFromRequest(
    request.nextUrl.pathname,
    request.nextUrl.search
  );
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", safeNext);
  const response = NextResponse.redirect(loginUrl);
  applyPendingCookies(response, pendingCookies);
  return attachHyroxMiddlewareDebugHeaders(response, request.nextUrl.pathname, {
    ...meta,
    redirectTarget: loginUrl.pathname,
  });
}

function athleteLoginRedirect(
  request: NextRequest,
  pendingCookies: CookieToSet[],
  meta: HyroxMiddlewareDebugMeta
) {
  const path = request.nextUrl.pathname;
  const safeNext = buildAthleteLoginNextFromRequest(path, request.nextUrl.search);
  const loginUrl = new URL("/athlete/login", request.url);
  loginUrl.searchParams.set("next", safeNext);
  const response = NextResponse.redirect(loginUrl);
  applyPendingCookies(response, pendingCookies);
  if (isHyroxProgrammeRoute(path)) {
    console.log("[hyrox-programme-route] middleware redirect login", {
      path,
      next: safeNext,
      cookiePresent: meta.cookiePresent,
    });
  }
  return attachHyroxMiddlewareDebugHeaders(
    response,
    path,
    {
      ...meta,
      stage: meta.stage || "redirect-login-no-user",
      userPresent: false,
      redirectTarget: `${loginUrl.pathname}?next=${encodeURIComponent(safeNext)}`,
    },
    { redirectSource: "middleware" }
  );
}

const ATHLETE_PUBLIC_PATHS = new Set(["/athlete/login", "/athlete/no-access"]);

/** Community dashboard — refresh session cookies; auth gate in dashboard layout. */
export async function updateSession(request: NextRequest) {
  const route = request.nextUrl.pathname;
  const { supabase, supabaseResponse, getPendingCookies } = createMiddlewareClient(request);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("[dashboard auth] route", route);
  console.log("[dashboard auth] hasUser", { route, hasUser: Boolean(user) });
  if (userError) {
    console.log("[dashboard auth] getUser error", {
      route,
      message: userError.message,
    });
  }

  if (!user) {
    console.log("[dashboard auth] redirect login", { route, hasUser: false });
    return communityLoginRedirect(request, getPendingCookies(), {
      stage: "redirect-login-no-user",
      userPresent: false,
      cookiePresent: authCookiesPresentOnRequest(request),
      refreshAttempted: false,
    });
  }

  return finalizeMiddlewareResponse(request, getPendingCookies(), {
    stage: "community-ok",
    userPresent: true,
    cookiePresent: true,
    refreshAttempted: false,
  });
}

async function fetchHyroxAccessForMiddleware(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  email: string | null | undefined
) {
  const [{ data: profile, error: profileError }, { data: athleteRow, error: athleteError }, rpc] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
      supabase
        .from("hyrox_athletes")
        .select("id, user_id")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.rpc("is_hyrox_athlete"),
    ]);

  const profileRole = (profile?.role as ProfileRole | undefined) ?? null;
  const hyroxAthleteId = athleteRow?.id ?? null;
  const rpcAthlete = rpc.data === true;

  let emailAccess: Awaited<ReturnType<typeof evaluateAthleteEmailAccess>> | null = null;
  if (email?.trim()) {
    emailAccess = await evaluateAthleteEmailAccess(userId, email);
  }

  const paidEmailPortalAccess = emailAccess?.canAccessPortal ?? false;

  const access = {
    profileRole,
    hyroxAthleteId,
    linkedUserId: athleteRow?.user_id ?? null,
    isCoach: resolveHyroxCoachAccess(profileRole, email),
    isAthlete:
      resolveHyroxAthleteAccess(profileRole, hyroxAthleteId) ||
      rpcAthlete ||
      paidEmailPortalAccess,
    profileError: profileError?.message ?? null,
    athleteError: athleteError?.message ?? null,
    rpcAthlete,
    rpcError: rpc.error?.message ?? null,
    emailAccessReason: emailAccess?.debug.accessReason ?? null,
    emailAthleteUserId: emailAccess?.debug.athleteUserId ?? null,
  };

  logHyroxAuthDebug("middleware-access", {
    userId,
    email,
    ...access,
    emailAccessDebug: emailAccess?.debug ?? null,
  });

  return access;
}

/**
 * Hyrox admin + athlete portals — refresh session cookies, then gate access.
 * /athlete/* uses identical auth logic for every path (dashboard, programme, etc.).
 */
export async function updateHyroxProtectedSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const { supabase, getPendingCookies } = createMiddlewareClient(request);
  const hasAuthCookie = authCookiesPresentOnRequest(request);
  const isPrefetch = isNextRouterPrefetch(request);
  const internalNav =
    isProtectedAthletePortalPath(path) && isAthletePortalInternalNavigation(request);

  const { user, error: userError, retriedWithSession } = await resolveAuthUserForMiddleware(
    supabase,
    hasAuthCookie
  );

  const pendingCookies = getPendingCookies();

  const baseMeta: HyroxMiddlewareDebugMeta = {
    stage: "pending",
    userPresent: Boolean(user),
    cookiePresent: hasAuthCookie,
    refreshAttempted: retriedWithSession,
  };

  logHyroxAuthDebug("middleware", {
    path,
    hasUser: Boolean(user),
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    userError: userError?.message ?? null,
    hasAuthCookie,
    retriedWithSession,
    isPrefetch,
    internalNav,
  });

  if (isHyroxProgrammeRoute(path)) {
    console.log("[hyrox-programme-route]", {
      path,
      hasUser: Boolean(user),
      hasAuthCookie,
      isPrefetch,
      userError: userError?.message ?? null,
    });
  }

  /** Athlete JSON APIs — refresh session cookies only; route handlers return 401/403. */
  if (path.startsWith("/api/hyrox/athlete")) {
    return finalizeMiddlewareResponse(request, pendingCookies, {
      ...baseMeta,
      stage: "api-cookie-refresh",
    });
  }

  if (!user) {
    if (path === "/athlete/login") {
      return finalizeMiddlewareResponse(request, pendingCookies, {
        ...baseMeta,
        stage: "login-public",
        userPresent: false,
      });
    }

    if (path.startsWith("/athlete")) {
      /** Prefetch must not cache a login redirect for protected athlete routes. */
      if (isPrefetch) {
        return finalizeMiddlewareResponse(
          request,
          pendingCookies,
          { ...baseMeta, stage: "prefetch-pass-no-user", userPresent: false },
          { internalNav }
        );
      }

      /**
       * Auth cookies present but user not resolved — allow page/layout to render
       * in-page debug instead of hiding behind a premature login redirect.
       */
      if (hasAuthCookie) {
        return finalizeMiddlewareResponse(
          request,
          pendingCookies,
          { ...baseMeta, stage: "pass-auth-cookie-no-user", userPresent: false },
          { internalNav }
        );
      }

      /**
       * Soft navigation between protected athlete pages (e.g. programme ↔ dashboard).
       * RSC flights may omit parsed cookies even though the portal session is valid.
       */
      if (internalNav) {
        console.log("[hyrox-athlete-nav] pass internal portal navigation", {
          path,
          referer: request.headers.get("referer"),
        });
        return finalizeMiddlewareResponse(
          request,
          pendingCookies,
          { ...baseMeta, stage: "pass-internal-athlete-nav", userPresent: false },
          { internalNav: true }
        );
      }

      if (isAthletePublicPath(path)) {
        return finalizeMiddlewareResponse(request, pendingCookies, {
          ...baseMeta,
          stage: "athlete-public",
          userPresent: false,
        });
      }

      return athleteLoginRedirect(request, pendingCookies, {
        ...baseMeta,
        stage: "redirect-login-no-user",
      });
    }

    return communityLoginRedirect(request, pendingCookies, {
      ...baseMeta,
      stage: "redirect-community-login",
    });
  }

  if (path === "/athlete/login") {
    return finalizeMiddlewareResponse(request, pendingCookies, {
      ...baseMeta,
      stage: "login-authed",
      userPresent: true,
    });
  }

  if (path === "/admin/no-access" || path === "/athlete/no-access") {
    return finalizeMiddlewareResponse(request, pendingCookies, {
      ...baseMeta,
      stage: "no-access",
      userPresent: true,
    });
  }

  const access = await fetchHyroxAccessForMiddleware(supabase, user.id, user.email);

  if (path.startsWith("/admin")) {
    if (!access.isCoach) {
      const denied = request.nextUrl.clone();
      denied.pathname = "/admin/no-access";
      const response = NextResponse.redirect(denied);
      applyPendingCookies(response, pendingCookies);
      return attachHyroxMiddlewareDebugHeaders(response, path, {
        ...baseMeta,
        stage: "redirect-admin-no-access",
        redirectTarget: denied.pathname,
      });
    }
    return finalizeMiddlewareResponse(request, pendingCookies, {
      ...baseMeta,
      stage: "admin-ok",
      userPresent: true,
    });
  }

  if (path.startsWith("/athlete")) {
    if (!access.isAthlete) {
      logHyroxAuthDebug("middleware-deny-athlete", {
        path,
        userId: user.id,
        profileRole: access.profileRole,
        hyroxAthleteId: access.hyroxAthleteId,
      });
      const denied = request.nextUrl.clone();
      denied.pathname = "/athlete/no-access";
      const response = NextResponse.redirect(denied);
      applyPendingCookies(response, pendingCookies);
      return attachHyroxMiddlewareDebugHeaders(response, path, {
        ...baseMeta,
        stage: "redirect-no-access",
        userPresent: true,
        redirectTarget: denied.pathname,
      });
    }
    return finalizeMiddlewareResponse(request, pendingCookies, {
      ...baseMeta,
      stage: "athlete-ok",
      userPresent: true,
    });
  }

  return finalizeMiddlewareResponse(request, pendingCookies, {
    ...baseMeta,
    stage: "fallback-ok",
    userPresent: true,
  });
}
