import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readAthletePortalCookies } from "@/app/lib/supabase/mergedAthleteCookies";

/**
 * Server Supabase client for athlete portal pages.
 * Uses merged cookies (cookies() + raw Cookie header) — never lets empty cookies()
 * values block the real session from the request header.
 */
export async function createAthleteServerSupabase() {
  const cookieStore = await cookies();
  const { cookies: mergedCookies } = await readAthletePortalCookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return mergedCookies;
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* Server Component — middleware refreshes session cookies. */
          }
        },
      },
    }
  );
}
