import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export type ApiRouteSupabase = {
  supabase: SupabaseClient;
  /** Attach refreshed Supabase auth cookies to a Route Handler response. */
  withAuthCookies: (response: NextResponse) => NextResponse;
};

/** Route Handler Supabase client — reads request cookies and can refresh session on the response. */
export function createApiRouteSupabase(request: NextRequest): ApiRouteSupabase {
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
        },
      },
    }
  );

  return {
    supabase,
    withAuthCookies(response: NextResponse) {
      pendingCookies.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options)
      );
      return response;
    },
  };
}

export function hasSupabaseAuthCookieNames(
  cookies: { name: string }[]
): boolean {
  return cookies.some(
    (c) =>
      c.name.includes("-auth-token") ||
      (c.name.startsWith("sb-") && c.name.includes("auth"))
  );
}
