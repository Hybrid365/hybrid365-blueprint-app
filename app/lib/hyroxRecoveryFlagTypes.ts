/**
 * Release 2 scaffold — wellness recovery flag (not implemented in Release 1).
 *
 * TODO(Release 2): Compare current resting HR against baseline alongside sleep,
 * fatigue, soreness, motivation, illness and pain. Never flag from resting HR alone.
 * Surface athlete options: keep planned session, choose easier day, contact coach.
 * Do not silently replace programme sessions.
 */

export type RecoveryFlagLevel = "none" | "minor" | "moderate" | "major";

export type RecoveryFlagInput = {
  currentRestingHr?: number | null;
  baselineRestingHr?: number | null;
  sleep?: number | null;
  fatigue?: number | null;
  soreness?: number | null;
  motivation?: number | null;
  illnessSymptoms?: boolean;
  painInjuryFlag?: boolean;
};

export type RecoveryFlagResult = {
  level: RecoveryFlagLevel;
  reasons: string[];
  /** Athlete-facing guidance — not a diagnosis. */
  message: string | null;
};

export type EasierDayOption =
  | "keep_planned"
  | "zone1_erg_mobility"
  | "reduced_volume"
  | "full_rest"
  | "contact_coach";

/**
 * Placeholder — returns no flag until Release 2 implements guarded rules.
 */
export function evaluateRecoveryFlag(_input: RecoveryFlagInput): RecoveryFlagResult {
  return {
    level: "none",
    reasons: [],
    message: null,
  };
}
