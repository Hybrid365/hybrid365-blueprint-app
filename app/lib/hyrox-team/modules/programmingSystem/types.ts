/**
 * HYROX Team Programming System — shared types.
 * Library / coach-facing only. Does not mutate published athlete programmes.
 */

export type ProgrammingProgressionLevel =
  | "level_1"
  | "level_2"
  | "level_3"
  | "deload"
  | "advanced";

export type ProgrammingTrainingPhase =
  | "base"
  | "build"
  | "specific"
  | "peak"
  | "race_week"
  | "deload"
  | "return_to_train";

export type ProgrammingAthleteLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "pro"
  | "all";

export type ProgrammingFatigueCost = "low" | "moderate" | "high" | "very_high";

export type ProgrammingTechnicalDemand = "low" | "moderate" | "high";

/** Session standards — every programming-system session should populate these. */
export type ProgrammingSessionStandards = {
  purpose: string;
  primaryAdaptation: string;
  secondaryAdaptation?: string | null;
  trainingPhase: ProgrammingTrainingPhase[];
  suitableAthleteLevel: ProgrammingAthleteLevel[];
  estimatedDurationMinutes: number;
  estimatedFatigueCost: ProgrammingFatigueCost;
  technicalDemand: ProgrammingTechnicalDemand;
  equipmentRequired: string[];
  progressionFamily: string;
  progressionLevel: ProgrammingProgressionLevel;
  recommendedProgression?: string | null;
  recommendedRegression?: string | null;
  suggestedSessionPlacement: string[];
  adjacencyWarnings: string[];
  expectedRpe: string;
  recommendedLoggingFields: string[];
};

/** Progression family registry entry. */
export type ProgrammingProgressionFamily = {
  id: string;
  name: string;
  pillar:
    | "running_development"
    | "hyrox_volume_builders"
    | "strength_endurance"
    | "hybrid_engine";
  stationFamily?: string | null;
  description: string;
  levels: ProgrammingProgressionLevel[];
  notes?: string;
};

/**
 * Coach-assigned Performance Profile after testing week.
 * This is a coaching profile — NOT a score and NOT auto-generated for existing athletes.
 */
export type HyroxCoachPerformanceProfile = {
  athleteId: string;
  /** ISO date when coach last updated this profile. */
  updatedAt: string | null;
  /** Coach who assigned the profile (auth user id or display name). */
  assignedBy?: string | null;
  primaryLimiter: string | null;
  supportingLimiter: string | null;
  currentStrengths: string[];
  developmentPriorities: string[];
  recommendedWeeklyFocus: string[];
  recommendedSessionFamilies: string[];
  /** ISO date for next testing / retest window. */
  retestDate: string | null;
  coachNotes?: string | null;
  /** Schema version for future AI / recommendation consumers. */
  schemaVersion: 1;
};

export const EMPTY_COACH_PERFORMANCE_PROFILE = (
  athleteId: string
): HyroxCoachPerformanceProfile => ({
  athleteId,
  updatedAt: null,
  assignedBy: null,
  primaryLimiter: null,
  supportingLimiter: null,
  currentStrengths: [],
  developmentPriorities: [],
  recommendedWeeklyFocus: [],
  recommendedSessionFamilies: [],
  retestDate: null,
  coachNotes: null,
  schemaVersion: 1,
});

/** Guidance chips shown in Programme Builder — advisory only. */
export type ProgrammingBuilderHintKind =
  | "progression_available"
  | "regression_available"
  | "suitable_for_limiter"
  | "recommended_this_phase"
  | "high_fatigue"
  | "pairs_well_with_threshold"
  | "volume_builder"
  | "technical_builder";

export type ProgrammingBuilderHint = {
  kind: ProgrammingBuilderHintKind;
  label: string;
  tone: "neutral" | "positive" | "caution" | "info";
};
