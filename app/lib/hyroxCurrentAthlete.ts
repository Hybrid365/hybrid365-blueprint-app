import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import { logHyroxAuthDebug } from "@/app/lib/hyroxAuthDebug";
import { createClient } from "@/app/lib/supabase/server";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

export const HYROX_ATHLETE_SELECT =
  "id, user_id, application_id, created_at, updated_at, name, email, status, race_name, race_date, race_category, target_time, current_block, current_week, current_programme_block, programme_start_date, programme_length_weeks, programme_started_at, programme_updated_at, programme_status, payment_status, stripe_customer_id, stripe_subscription_id, coach_notes";

export type ResolvedHyroxAthleteSource = "user_id" | "email" | null;

export type ResolvedHyroxAthleteResult = {
  user: User | null;
  athlete: HyroxAthleteRow | null;
  source: ResolvedHyroxAthleteSource;
  foundByUserId: boolean;
  foundByEmail: boolean;
};

async function fetchAthleteByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<{ athlete: HyroxAthleteRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("hyrox_athletes")
    .select(HYROX_ATHLETE_SELECT)
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    return { athlete: null, error: error.message };
  }

  const row = (data?.[0] as HyroxAthleteRow | undefined) ?? null;
  return { athlete: row, error: null };
}

/** Logged-in user's linked hyrox_athletes row (user_id = auth.uid()), or null. */
export async function getCurrentHyroxAthlete(): Promise<HyroxAthleteRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logHyroxAuthDebug("getCurrentHyroxAthlete", { authUserId: null });
    return null;
  }

  const { athlete, error } = await fetchAthleteByUserId(supabase, user.id);

  logHyroxAuthDebug("getCurrentHyroxAthlete", {
    authUserId: user.id,
    authEmail: user.email ?? null,
    found: Boolean(athlete),
    athleteId: athlete?.id ?? null,
    linkedUserId: athlete?.user_id ?? null,
    error: error ?? null,
  });

  if (error) {
    console.warn("[hyrox] getCurrentHyroxAthlete:", error);
  }

  return athlete;
}

/**
 * Resolve athlete for portal/API: session user_id lookup, then paid email-match fallback
 * (same logic as app/athlete/layout.tsx).
 */
export async function resolveCurrentHyroxAthlete(
  supabase?: SupabaseClient
): Promise<ResolvedHyroxAthleteResult> {
  const client = supabase ?? (await createClient());
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return {
      user: null,
      athlete: null,
      source: null,
      foundByUserId: false,
      foundByEmail: false,
    };
  }

  const portal = await resolveHyroxPortalAthlete({
    user,
    supabase: client,
    attemptAutoLink: true,
  });

  const athlete =
    portal.accessReason === "LINKED" && portal.athlete?.user_id === user.id
      ? portal.athlete
      : null;

  const source: ResolvedHyroxAthleteSource =
    portal.matchSource === "none" ? null : portal.matchSource;

  logHyroxAuthDebug("resolveCurrentHyroxAthlete", {
    authUserId: user.id,
    authEmail: user.email ?? null,
    foundByUserId: portal.matchSource === "user_id",
    foundByEmail: portal.matchSource === "email",
    source,
    athleteId: athlete?.id ?? null,
    athleteUserId: athlete?.user_id ?? null,
    paymentStatus: athlete?.payment_status ?? null,
    accessReason: portal.accessReason,
    duplicateEmailCount: portal.duplicateEmailAthletes.length,
    autoLinked: portal.autoLinked,
  });

  return {
    user,
    athlete,
    source,
    foundByUserId: portal.matchSource === "user_id",
    foundByEmail: portal.matchSource === "email",
  };
}
