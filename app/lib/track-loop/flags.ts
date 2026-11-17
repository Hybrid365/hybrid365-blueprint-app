import { TRACK_PROGRAMME_MUTATION_ENABLED } from "@/app/lib/track-foundation/productionBoundary";
import { isTrackAdaptationEnabled } from "@/app/lib/daily-readiness/flag";

export const PRODUCTION_SUPABASE_REF = "uuqdgbsntdjhojjkjkgd";
export const CANONICAL_STAGING_SUPABASE_REF = "bfwboqaovirzjpxpwgty";
export const DEAD_STAGING_SUPABASE_REF = "uluapwqohujavhlpucta";

/**
 * Production mutation stays off.
 * The canary env flag cannot approve a live write by itself.
 */
export function trackMutationAllowed(env: Record<string, string | undefined> = process.env): false {
  if (TRACK_PROGRAMME_MUTATION_ENABLED !== false) {
    throw new Error("TRACK_PROGRAMME_MUTATION_ENABLED must stay false.");
  }
  if (isTrackAdaptationEnabled(env)) {
    throw new Error("Track canary flag is not approval to write a live programme.");
  }
  return false;
}

export function assertNoLiveWrite(env?: Record<string, string | undefined>): void {
  trackMutationAllowed(env);
}

function projectRef(url: string | undefined): string | null {
  const match = (url ?? "").match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

/**
 * A staging transaction is allowed only for the canonical staging project,
 * an explicit staging write flag, and one allowlisted athlete.
 * Production stays blocked even if those flags are copied onto it.
 */
export function trackStagingWriteAllowed(
  env: Record<string, string | undefined>,
  athleteId: string
): boolean {
  if (TRACK_PROGRAMME_MUTATION_ENABLED !== false) return false;
  const ref = projectRef(env.NEXT_PUBLIC_SUPABASE_URL);
  const declared = env.HYROX_STAGING_SUPABASE_REF;
  if (ref == null || declared == null || ref !== declared) return false;
  if (ref === PRODUCTION_SUPABASE_REF || ref === DEAD_STAGING_SUPABASE_REF) return false;
  if (ref !== CANONICAL_STAGING_SUPABASE_REF) return false;
  if (env.VERCEL_ENV === "production" || env.HYROX_ENV === "production") return false;
  if (env.HYROX_ENV !== "staging") return false;
  if (env.HYROX_TRACK_STAGING_WRITE !== "1") return false;
  const allowed = (env.HYROX_TRACK_CANARY_ATHLETE_IDS ?? "")
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return allowed.includes(athleteId);
}
