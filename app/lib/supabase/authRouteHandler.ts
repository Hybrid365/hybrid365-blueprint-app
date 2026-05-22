import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseAuthCookieNames } from "@/app/lib/supabase/apiRoute";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

function normalizeCookieOptions(options?: CookieOptions): CookieOptions {
  const secure =
    options?.secure ?? process.env.NODE_ENV === "production";
  return {
    ...options,
    path: options?.path ?? "/",
    sameSite: options?.sameSite ?? "lax",
    secure,
    httpOnly: options?.httpOnly ?? true,
  };
}

/**
 * Route Handler Supabase client for login/callback flows.
 * Writes session cookies via next/headers cookies().set (reliable Set-Cookie)
 * and mirrors them onto the Route Handler response.
 */
export async function createAuthRouteHandlerSupabase(request: NextRequest) {
  const cookieStore = await cookies();
  const requestCookieList = request.cookies.getAll();
  let pendingCookies: CookieToSet[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const merged = new Map<string, { name: string; value: string }>();
          for (const c of requestCookieList) merged.set(c.name, c);
          for (const c of cookieStore.getAll()) merged.set(c.name, c);
          return Array.from(merged.values());
        },
        setAll(cookiesToSet) {
          pendingCookies = cookiesToSet.map(({ name, value, options }) => ({
            name,
            value,
            options: normalizeCookieOptions(options),
          }));
          try {
            pendingCookies.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* Apply on response via withAuthCookies. */
          }
        },
      },
    }
  );

  return {
    supabase,
    withAuthCookies(response: NextResponse) {
      pendingCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    },
    getPendingAuthCookieNames(): string[] {
      return pendingCookies.map((c) => c.name);
    },
    hadAuthCookiesOnRequest(): boolean {
      return hasSupabaseAuthCookieNames(requestCookieList);
    },
  };
}
