import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasSupabaseAuthCookieNames,
  hasValidSupabaseSessionCookies,
} from "@/app/lib/supabase/apiRoute";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

function passthroughCookieOptions(options?: CookieOptions): CookieOptions | undefined {
  if (!options) return { path: "/" };
  return { ...options, path: options.path ?? "/" };
}

function totalCookieValueLength(batch: CookieToSet[]): number {
  return batch.reduce((n, c) => n + (c.value?.length ?? 0), 0);
}

/**
 * Route Handler Supabase client — official getAll/setAll pattern.
 * @supabase/ssr persists cookies via onAuthStateChange → applyServerStorage → setAll.
 * We keep the richest setAll batch (avoid a later wipe-only batch overwriting session cookies).
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
          const incomingTotal = totalCookieValueLength(cookiesToSet);
          const pendingTotal = totalCookieValueLength(pendingCookies);
          if (incomingTotal >= pendingTotal) {
            pendingCookies = cookiesToSet.map(({ name, value, options }) => ({
              name,
              value,
              options: passthroughCookieOptions(options),
            }));
          }

          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              cookieStore.set(name, value, passthroughCookieOptions(options));
            });
          } catch {
            /* Route Handler — mirrored on response via withAuthCookies. */
          }
        },
      },
    }
  );

  return {
    supabase,
    withAuthCookies(response: NextResponse) {
      pendingCookies.forEach(({ name, value, options }) => {
        if (!value) {
          response.cookies.delete(name);
          return;
        }
        response.cookies.set(name, value, options);
      });
      return response;
    },
    getPendingAuthCookieNames(): string[] {
      return pendingCookies.map((c) => c.name);
    },
    getPendingAuthCookieDebug() {
      return {
        names: pendingCookies.map((c) => c.name),
        valueLengths: pendingCookies.map((c) => c.value?.length ?? 0),
        totalValueChars: totalCookieValueLength(pendingCookies),
        hasValidSession: hasValidSupabaseSessionCookies(pendingCookies),
      };
    },
    hasValidPendingSessionCookies(): boolean {
      return hasValidSupabaseSessionCookies(pendingCookies);
    },
    /**
     * Wait for @supabase/ssr applyServerStorage (async onAuthStateChange) to call setAll
     * with full chunked session cookies — not just empty removal placeholders.
     */
    async waitForSessionCookies(options?: {
      minTotalValueChars?: number;
      timeoutMs?: number;
    }): Promise<boolean> {
      const minTotal = options?.minTotalValueChars ?? 120;
      const timeoutMs = options?.timeoutMs ?? 3000;
      const deadline = Date.now() + timeoutMs;

      while (Date.now() < deadline) {
        if (
          hasValidSupabaseSessionCookies(pendingCookies) &&
          totalCookieValueLength(pendingCookies) >= minTotal
        ) {
          return true;
        }
        await new Promise((r) => setTimeout(r, 25));
      }

      return (
        hasValidSupabaseSessionCookies(pendingCookies) &&
        totalCookieValueLength(pendingCookies) >= minTotal
      );
    },
  };
}

/** After verifyOtp / exchangeCodeForSession — do not call setSession again (wipes cookies). */
export async function assertAuthRouteSession(
  supabase: SupabaseClient,
  auth: Awaited<ReturnType<typeof createAuthRouteHandlerSupabase>>
): Promise<{ userId: string; email: string | null } | null> {
  await auth.waitForSessionCookies();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("[auth route] no user after auth", {
      sessionError: sessionError?.message ?? null,
      userError: userError?.message ?? null,
      hasSession: Boolean(session),
      cookieDebug: auth.getPendingAuthCookieDebug(),
    });
    return null;
  }

  return { userId: user.id, email: user.email?.trim().toLowerCase() ?? null };
}
