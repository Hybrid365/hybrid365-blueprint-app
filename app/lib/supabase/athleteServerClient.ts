import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { parseCookieHeaderNames } from "@/app/lib/supabase/athleteAuthGate";

/**
 * Server Supabase client for athlete portal pages.
 * Merges next/headers cookies() with the raw Cookie header — RSC navigations often
 * have an empty cookie store while the request Cookie header still carries sb-* tokens.
 */
export async function createAthleteServerSupabase() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const headerCookieRaw = headerStore.get("cookie") ?? "";

  const merged = new Map<string, { name: string; value: string }>();
  for (const c of cookieStore.getAll()) {
    merged.set(c.name, { name: c.name, value: c.value });
  }

  if (headerCookieRaw.trim()) {
    const parts = headerCookieRaw.split(";");
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const name = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (name && !merged.has(name)) {
        merged.set(name, { name, value });
      }
    }
  }

  const cookieList = Array.from(merged.values());

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieList;
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
