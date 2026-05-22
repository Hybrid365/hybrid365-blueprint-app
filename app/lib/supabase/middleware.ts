import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  buildAthleteLoginNextFromRequest,
  buildLoginNextFromRequest,
} from "@/app/lib/authRedirectUrl";
import {
  authCookiesPresent,
  resolveAuthUserWithSessionRetry,
} from "@/app/lib/supabase/resolveAuthUser";
import { evaluateAthleteEmailAccess } from "@/app/lib/hyroxAthleteAutoLink";
import { logHyroxAuthDebug } from "@/app/lib/hyroxAuthDebug";
import {
  resolveHyroxAthleteAccess,
  resolveHyroxCoachAccess,
} from "@/app/lib/hyroxAccess";
import type { ProfileRole } from "@/app/lib/hyroxRoles";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

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

function attachHyroxMiddlewareDebugHeaders(
  response: NextResponse,
  path: string,
  stage: string,
  userPresent: boolean
): NextResponse {
  if (process.env.NODE_ENV !== "development") return response;
  if (!path.startsWith("/athlete")) return response;
  response.headers.set("x-hyrox-path", path);
  response.headers.set("x-hyrox-auth-user-present", userPresent ? "yes" : "no");
  response.headers.set("x-hyrox-auth-stage", stage);
  return response;
}

/** Apply refreshed Supabase cookies and forward pathname to server layouts. */
function finalizeMiddlewareResponse(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pendingCookies: CookieToSet[],
  debug?: { stage: string; userPresent: boolean }
): NextResponse {
  const path = request.nextUrl.pathname;
  const response = NextResponse.next({ request });
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
  response.headers.set(
    "x-pathname",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  return attachHyroxMiddlewareDebugHeaders(
    response,
    path,
    debug?.stage ?? "ok",
    debug?.userPresent ?? true
  );
}

function communityLoginRedirect(request: NextRequest) {
  const safeNext = buildLoginNextFromRequest(
    request.nextUrl.pathname,
    request.nextUrl.search
  );
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", safeNext);
  return NextResponse.redirect(loginUrl);
}

function athleteLoginRedirect(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const safeNext = buildAthleteLoginNextFromRequest(path, request.nextUrl.search);
  const loginUrl = new URL("/athlete/login", request.url);
  loginUrl.searchParams.set("next", safeNext);
  const response = NextResponse.redirect(loginUrl);
  return attachHyroxMiddlewareDebugHeaders(
    response,
    path,
    "redirect-login-no-user",
    false
  );
}

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
    return communityLoginRedirect(request);
  }

  return finalizeMiddlewareResponse(request, supabaseResponse, getPendingCookies());
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

/** Hyrox admin + athlete portals — auth + role gate. */
export async function updateHyroxProtectedSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const { supabase, supabaseResponse, getPendingCookies } = createMiddlewareClient(request);
  const requestCookies = request.cookies.getAll();
  const hasAuthCookie = authCookiesPresent(requestCookies);

  const { user, error: userError, retriedWithSession } =
    await resolveAuthUserWithSessionRetry(supabase, { hasAuthCookie });

  logHyroxAuthDebug("middleware", {
    path,
    hasUser: Boolean(user),
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    userError: userError?.message ?? null,
    hasAuthCookie,
    retriedWithSession,
  });

  /** Athlete JSON APIs — refresh session cookies only; route handlers return 401/403. */
  if (path.startsWith("/api/hyrox/athlete")) {
    return finalizeMiddlewareResponse(request, supabaseResponse, getPendingCookies(), {
      stage: "api-cookie-refresh",
      userPresent: Boolean(user),
    });
  }

  if (!user) {
    if (path === "/athlete/login") {
      return finalizeMiddlewareResponse(request, supabaseResponse, getPendingCookies(), {
        stage: "login-public",
        userPresent: false,
      });
    }
    if (path.startsWith("/athlete")) {
      return athleteLoginRedirect(request);
    }
    return communityLoginRedirect(request);
  }

  if (path === "/athlete/login") {
    return finalizeMiddlewareResponse(request, supabaseResponse, getPendingCookies(), {
      stage: "login-authed",
      userPresent: true,
    });
  }

  if (path === "/admin/no-access" || path === "/athlete/no-access") {
    return finalizeMiddlewareResponse(request, supabaseResponse, getPendingCookies(), {
      stage: "no-access",
      userPresent: true,
    });
  }

  const access = await fetchHyroxAccessForMiddleware(supabase, user.id, user.email);

  if (path.startsWith("/admin")) {
    if (!access.isCoach) {
      const denied = request.nextUrl.clone();
      denied.pathname = "/admin/no-access";
      return NextResponse.redirect(denied);
    }
    return finalizeMiddlewareResponse(request, supabaseResponse, getPendingCookies(), {
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
      return attachHyroxMiddlewareDebugHeaders(
        response,
        path,
        "redirect-no-access",
        true
      );
    }
    return finalizeMiddlewareResponse(request, supabaseResponse, getPendingCookies(), {
      stage: "athlete-ok",
      userPresent: true,
    });
  }

  return finalizeMiddlewareResponse(request, supabaseResponse, getPendingCookies(), {
    stage: "fallback-ok",
    userPresent: true,
  });
}
