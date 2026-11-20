/**
 * Track authority boundary.
 *
 * One Hybrid365 coaching engine. Different authority.
 * 1-1: the system interprets, the coach decides.
 * Track: the same athlete data and the same programme engine.
 * Safe decisions may later be offered as an athlete choice.
 *
 * This build must not publish or mutate a live Track programme.
 */

/** Explicitly false. A future build has to change this in code and pass review. */
export const TRACK_PROGRAMME_MUTATION_ENABLED = false as const;

export const TRACK_PRODUCT_AUTHORITY = "athlete_choice_when_offered" as const;

export const TRACK_PROGRAMME_ENGINE = "generate12WeekProgramme" as const;

/** Existing deterministic week repair. Track does not call it in this build. */
export const TRACK_REFLOW_ENGINE = "repairWeekSchedule" as const;

export const TRACK_REFLOW_APPLIED_IN_THIS_BUILD = false as const;

export type TrackProgrammeChoice = "pending" | "accept" | "keep_original";

/**
 * Meaningful programme changes stay as a recommendation until the athlete chooses.
 * Accepting does not apply reflow while mutation is off.
 */
export type TrackProgrammeDecision = {
  kind: "recommended_change";
  summary: string;
  choice: TrackProgrammeChoice;
  reflowEngine: typeof TRACK_REFLOW_ENGINE;
  applied: false;
  mutationEnabled: false;
  persisted: false;
};

export function holdProgrammeDecision(summary: string): TrackProgrammeDecision {
  return {
    kind: "recommended_change",
    summary,
    choice: "pending",
    reflowEngine: TRACK_REFLOW_ENGINE,
    applied: false,
    mutationEnabled: false,
    persisted: false,
  };
}
