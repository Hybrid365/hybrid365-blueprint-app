import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  buildAthleteLoginNextFromRequest,
  buildLoginNextFromRequest,
} from "@/app/lib/authRedirectUrl";
import { evaluateAthleteEmailAccess } from "@/app/lib/hyroxAthleteAutoLink";
import { logHyroxAuthDebug } from "@/app/lib/hyroxAuthDebug";
import {
  resolveHyroxAthleteAccess,
  resolveHyroxCoachAccess,
} from "@/app/lib/hyroxAccess";
import type { ProfileRole } from "@/app/lib/hyroxRoles";

export function createMiddlewareClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, supabaseResponse };
}

/** Preserve Supabase session cookies and forward pathname to server layouts. */
function finalizeMiddlewareResponse(
  request: NextRequest,
  supabaseResponse: NextResponse
): NextResponse {
  request.headers.set(
    "x-pathname",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
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
  const safeNext = buildAthleteLoginNextFromRequest(
    request.nextUrl.pathname,
    request.nextUrl.search
  );
  const loginUrl = new URL("/athlete/login", request.url);
  loginUrl.searchParams.set("next", safeNext);
  return NextResponse.redirect(loginUrl);
}

/** Dashboard membership routes — auth required only. */
export async function updateSession(request: NextRequest) {
  const { supabase, supabaseResponse } = createMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return communityLoginRedirect(request);
  }

  return finalizeMiddlewareResponse(request, supabaseResponse);
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
  const { supabase, supabaseResponse } = createMiddlewareClient(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  logHyroxAuthDebug("middleware", {
    path,
    hasUser: Boolean(user),
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    userError: userError?.message ?? null,
  });

  if (!user) {
    if (path === "/athlete/login") {
      return finalizeMiddlewareResponse(request, supabaseResponse);
    }
    if (path.startsWith("/athlete")) {
      return athleteLoginRedirect(request);
    }
    return communityLoginRedirect(request);
  }

  if (path === "/athlete/login") {
    return finalizeMiddlewareResponse(request, supabaseResponse);
  }

  if (path === "/admin/no-access" || path === "/athlete/no-access") {
    return finalizeMiddlewareResponse(request, supabaseResponse);
  }

  const access = await fetchHyroxAccessForMiddleware(supabase, user.id, user.email);

  if (path.startsWith("/admin")) {
    if (!access.isCoach) {
      const denied = request.nextUrl.clone();
      denied.pathname = "/admin/no-access";
      return NextResponse.redirect(denied);
    }
    return finalizeMiddlewareResponse(request, supabaseResponse);
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
      return NextResponse.redirect(denied);
    }
    return finalizeMiddlewareResponse(request, supabaseResponse);
  }

  return finalizeMiddlewareResponse(request, supabaseResponse);
}
