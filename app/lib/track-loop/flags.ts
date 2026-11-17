import { TRACK_PROGRAMME_MUTATION_ENABLED } from "@/app/lib/track-foundation/productionBoundary";
import { isTrackAdaptationEnabled } from "@/app/lib/daily-readiness/flag";

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
