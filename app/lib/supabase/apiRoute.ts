import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export type ApiRouteAuthDebug = {
  hasAuthCookieOnRequest: boolean;
  hasAuthCookieInHeaderStore: boolean;
  requestCookieCount: number;
  headerCookieCount: number;
  getUserSucceeded: boolean;
  cookiesRefreshed: boolean;
  userError: string | null;
};

export type ApiRouteSupabase = {
  supabase: SupabaseClient;
  /** Attach refreshed Supabase auth cookies to a Route Handler response. */
  withAuthCookies: (response: NextResponse) => NextResponse;
  authDebug: ApiRouteAuthDebug;
};

export function hasSupabaseAuthCookieNames(
  cookies: { name: string }[]
): boolean {
  return cookies.some((c) => {
    const name = c.name;
    return (
      name.includes("-auth-token") ||
      (name.startsWith("sb-") && (name.includes("auth") || name.includes("refresh")))
    );
  });
}

/**
 * Route Handler Supabase client — uses cookies() from next/headers (same source as
 * app/athlete/layout.tsx) and merges refreshed tokens onto the JSON response.
 */
export async function createApiRouteSupabase(
  request: NextRequest
): Promise<ApiRouteSupabase> {
  const cookieStore = await cookies();
  const requestCookieList = request.cookies.getAll();
  let pendingCookies: CookieToSet[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Merge request + next/headers (layout uses headers store; middleware updates both).
          const merged = new Map<string, { name: string; value: string }>();
          for (const c of requestCookieList) merged.set(c.name, c);
          for (const c of cookieStore.getAll()) merged.set(c.name, c);
          return Array.from(merged.values());
        },
        setAll(cookiesToSet) {
          pendingCookies = cookiesToSet;
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Route Handler — refreshed cookies applied via withAuthCookies on response.
          }
        },
      },
    }
  );

  const headerCookieList = cookieStore.getAll();
  const authDebug: ApiRouteAuthDebug = {
    hasAuthCookieOnRequest: hasSupabaseAuthCookieNames(requestCookieList),
    hasAuthCookieInHeaderStore: hasSupabaseAuthCookieNames(headerCookieList),
    requestCookieCount: requestCookieList.length,
    headerCookieCount: headerCookieList.length,
    getUserSucceeded: false,
    cookiesRefreshed: false,
    userError: null,
  };

  await supabase.auth.getSession();

  return {
    supabase,
    authDebug,
    withAuthCookies(response: NextResponse) {
      if (pendingCookies.length > 0) {
        authDebug.cookiesRefreshed = true;
      }
      pendingCookies.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options)
      );
      return response;
    },
  };
}

/** JSON response that always merges Supabase session refresh cookies. */
export function hyroxAthleteApiJson(
  withAuthCookies: ApiRouteSupabase["withAuthCookies"],
  body: Record<string, unknown>,
  status = 200
) {
  return withAuthCookies(NextResponse.json(body, { status }));
}
