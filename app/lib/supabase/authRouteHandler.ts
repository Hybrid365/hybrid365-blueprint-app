import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { hasValidSupabaseSessionCookies } from "@/app/lib/supabase/apiRoute";
import { readAthleteRouteHandlerCookies } from "@/app/lib/supabase/mergedAthleteCookies";
import {
  buildSessionCookiesToSet,
  debugPendingSessionCookies,
  inspectResponseSetCookieHeaders,
  type SessionCookieToSet,
} from "@/app/lib/supabase/persistSupabaseSessionCookies";

type CookieToSet = SessionCookieToSet;

function passthroughCookieOptions(options?: CookieOptions): CookieOptions | undefined {
  if (!options) return { path: "/" };
  return { ...options, path: options.path ?? "/" };
}

function totalCookieValueLength(batch: CookieToSet[]): number {
  return batch.reduce((n, c) => n + (c.value?.length ?? 0), 0);
}

function isWipeOnlyBatch(batch: CookieToSet[]): boolean {
  if (batch.length === 0) return true;
  return batch.every((c) => !c.value || c.options?.maxAge === 0);
}

/**
 * Route Handler Supabase client — getAll/setAll plus synchronous session cookie commit
 * from verifyOtp / exchangeCodeForSession data.session (SSR async storage is unreliable).
 */
export async function createAuthRouteHandlerSupabase(request: NextRequest) {
  const cookieStore = await cookies();
  const { cookies: initialMerged } = await readAthleteRouteHandlerCookies(request);
  let mergedRequestCookies = [...initialMerged];
  let pendingCookies: CookieToSet[] = [];

  const applyToHandlers = (batch: CookieToSet[]) => {
    for (const { name, value, options } of batch) {
      const opts = passthroughCookieOptions(options);
      try {
        if (!value) {
          request.cookies.delete(name);
        } else {
          request.cookies.set(name, value);
        }
      } catch {
        /* request.cookies may be read-only in some contexts */
      }
      try {
        if (!value) {
          cookieStore.delete(name);
          mergedRequestCookies = mergedRequestCookies.filter((c) => c.name !== name);
        } else {
          cookieStore.set(name, value, opts);
          const existing = mergedRequestCookies.findIndex((c) => c.name === name);
          const entry = { name, value };
          if (existing >= 0) mergedRequestCookies[existing] = entry;
          else mergedRequestCookies.push(entry);
        }
      } catch {
        /* mirrored on response */
      }
    }
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return mergedRequestCookies;
        },
        setAll(cookiesToSet) {
          const incomingTotal = totalCookieValueLength(cookiesToSet);
          const pendingTotal = totalCookieValueLength(pendingCookies);
          const incomingWipe = isWipeOnlyBatch(cookiesToSet);
          const pendingValid = hasValidSupabaseSessionCookies(pendingCookies);
          const incomingValid = hasValidSupabaseSessionCookies(cookiesToSet);

          let shouldReplacePending = false;
          if (incomingValid) shouldReplacePending = true;
          else if (!pendingValid && !incomingWipe) shouldReplacePending = incomingTotal >= pendingTotal;
          else if (!pendingValid && incomingWipe) shouldReplacePending = false;

          if (shouldReplacePending) {
            pendingCookies = cookiesToSet.map(({ name, value, options }) => ({
              name,
              value,
              options: passthroughCookieOptions(options),
            }));
          }

          if (shouldReplacePending || incomingValid) {
            applyToHandlers(cookiesToSet);
          }
        },
      },
    }
  );

  return {
    supabase,

    /**
     * Write real Supabase SSR session cookies from verifyOtp/exchangeCodeForSession result.
     * Required because onAuthStateChange → applyServerStorage often runs after the response.
     */
    commitSessionCookies(session: Session) {
      const existingNames = mergedRequestCookies.map((c) => c.name);
      pendingCookies = buildSessionCookiesToSet(session, existingNames);
      applyToHandlers(pendingCookies);
    },

    /** Deterministic write of pending session cookies onto the response (no async setAll). */
    attachSessionCookiesToResponse(response: NextResponse) {
      pendingCookies.forEach(({ name, value, options }) => {
        if (!value) {
          response.cookies.delete(name);
          return;
        }
        response.cookies.set(name, value, passthroughCookieOptions(options));
      });
      return response;
    },

    withAuthCookies(response: NextResponse) {
      return this.attachSessionCookiesToResponse(response);
    },

    getPendingAuthCookieDebug() {
      return debugPendingSessionCookies(pendingCookies);
    },

    hasValidPendingSessionCookies(): boolean {
      return debugPendingSessionCookies(pendingCookies).hasValidSession;
    },

    inspectResponseSetCookies(response: NextResponse) {
      return inspectResponseSetCookieHeaders(response);
    },
  };
}

export async function assertAuthRouteSession(
  supabase: SupabaseClient,
  auth: Awaited<ReturnType<typeof createAuthRouteHandlerSupabase>>
): Promise<{ userId: string; email: string | null } | null> {
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
