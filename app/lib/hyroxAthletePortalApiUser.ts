/**
 * Unified athlete-portal user resolution for Route Handlers.
 * Mirrors probeHyroxPortalAuth — Supabase cookies first, then h365_athlete_session.
 */

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AthletePortalAuthSource } from "@/app/lib/hyroxAthletePortalSnapshot";
import {
  readAthleteSessionCookieFromEntries,
  resolveSupabaseUserFromAthleteSession,
} from "@/app/lib/supabase/hyroxAthleteSessionCookie";
import {
  resolveAuthUserForMiddleware,
  resolveAuthUserWithSessionRetry,
} from "@/app/lib/supabase/resolveAuthUser";

export type AthletePortalApiUserResolution = {
  user: User | null;
  source: AthletePortalAuthSource;
  retriedWithSession: boolean;
  h365SessionPresent: boolean;
  h365SessionValid: boolean;
};

/** Same resolution chain as server pages — do not require re-login when h365 cookie is valid. */
export async function resolveAthletePortalUserForApi(input: {
  supabase: SupabaseClient;
  mergedCookies: { name: string; value: string }[];
  hasAuthCookie: boolean;
}): Promise<AthletePortalApiUserResolution> {
  const { user: userFirst, retriedWithSession: retriedFirst } =
    await resolveAuthUserForMiddleware(input.supabase, input.hasAuthCookie);
  const { user: userAfterRetry, retriedWithSession: retriedSecond } =
    await resolveAuthUserWithSessionRetry(input.supabase, {
      hasAuthCookie: input.hasAuthCookie,
    });

  let user: User | null = userAfterRetry ?? userFirst;
  let source: AthletePortalAuthSource = user ? "supabase-cookie" : "none";
  let retriedWithSession = retriedFirst || retriedSecond;

  const athleteSessionPayload = readAthleteSessionCookieFromEntries(input.mergedCookies);
  const h365SessionPresent = Boolean(athleteSessionPayload);
  let h365SessionValid = false;

  if (!user && athleteSessionPayload) {
    const fromAthleteSession = await resolveSupabaseUserFromAthleteSession(athleteSessionPayload);
    if (fromAthleteSession) {
      user = fromAthleteSession;
      source = "h365-athlete-session";
      h365SessionValid = true;
      if (process.env.NODE_ENV === "development") {
        console.log("[athlete-portal-api] resolved user via h365_athlete_session", {
          userId: user.id,
          email: user.email ?? null,
        });
      }
    }
  }

  return {
    user,
    source,
    retriedWithSession,
    h365SessionPresent,
    h365SessionValid,
  };
}
