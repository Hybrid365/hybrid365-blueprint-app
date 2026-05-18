/** Shared types for Hybrid365 Hyrox programming foundation. */

export type HyroxAbilityLevel = "beginner" | "intermediate" | "advanced" | "pro";

export type HyroxSessionCategory =
  | "run_development"
  | "erg_development"
  | "compromised_running"
  | "strength"
  | "testing";

export type AthleteClassificationId =
  | "beginner_foundation"
  | "running_limited"
  | "station_limited"
  | "strength_dominant_run_limited"
  | "runner_dominant_station_limited"
  | "balanced_intermediate"
  | "advanced_competitive"
  | "high_output_poor_recovery";

export type RaceTimelinePhase = "far" | "mid" | "near" | "race_week";

export type RecoveryStatus = "good" | "moderate" | "poor";

/** Station weaknesses reported in assessment — drive personalisation rules. */
export type StationWeakness =
  | "wall_balls"
  | "wall_ball"
  | "sled_push_pull"
  | "sled"
  | "burpees"
  | "lunges"
  | "ski"
  | "row"
  | "farmers_carry"
  | "carry"
  | "running_under_fatigue"
  | "none_significant";

/** Readiness for double sessions — progressive ladder, not jump to double threshold. */
export type DoubleSessionReadiness =
  | "not_ready"
  | "aerobic_double_only"
  | "threshold_run_plus_easy_aerobic"
  | "threshold_run_plus_erg_threshold";

export type BlockWeekInCycle = 1 | 2 | 3 | 4;

export type HyroxSessionVariant = {
  /** Preserves intended benefit at this level */
  summary: string;
  volume?: string;
  intensity?: string;
  rest?: string;
  load?: string;
  complexity?: string;
  notes?: string;
};

export type HyroxSessionDefinition = {
  id: string;
  name: string;
  category: HyroxSessionCategory;
  subcategory: string;
  objective: string;
  difficultyLevels: HyroxAbilityLevel[];
  duration: string;
  equipment: string[];
  bestFor: string[];
  avoidIf: string[];
  warmup: string[];
  mainSet: string[];
  cooldown: string[];
  intensity: string;
  beginnerVersion: HyroxSessionVariant;
  intermediateVersion: HyroxSessionVariant;
  advancedVersion: HyroxSessionVariant;
  proVersion: HyroxSessionVariant;
  whatToRecord: string[];
  coachNotes: string[];
  tags: string[];
  /** Optional 4-week in-block progression (same session, progressive stimulus). */
  progressionExamples?: Record<`week${BlockWeekInCycle}`, string>;
  /** Prompt athlete to film for coach feedback / social proof. */
  filmPrompt?: string | null;
  /** Why this session exists for dashboard personalisation copy. */
  prescriptionRationale?: string;
};

export type PaceZoneKey =
  | "easy"
  | "steady"
  | "threshold"
  | "tenK"
  | "fiveK"
  | "intervalVo2"
  | "hyroxRaceRun";

export type PaceZones = Record<PaceZoneKey, string>;

export type WeeklyStructureId =
  | "beginner_4_day"
  | "intermediate_5_day"
  | "advanced_6_day"
  | "pro_high_volume_6_7_day";

export type DaySlotRole =
  | "easy_run"
  | "hard_run"
  | "long_aerobic"
  | "erg_threshold"
  | "erg_z2"
  | "strength_lower"
  | "strength_upper"
  | "compromised_hybrid"
  | "testing"
  | "recovery"
  | "rest";

export type WeeklyDayTemplate = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  role: DaySlotRole;
  intensity: "easy" | "moderate" | "hard" | "rest";
  notes?: string;
};

export type WeeklyStructureTemplate = {
  id: WeeklyStructureId;
  label: string;
  daysPerWeek: number;
  allowsDoubleSessions: boolean;
  description: string;
  hardEasyRhythm: string;
  days: WeeklyDayTemplate[];
  sessionCategoryEmphasis: HyroxSessionCategory[];
};

export type ProgrammeRulePriority = "must" | "should" | "may";

export type ProgrammeRule = {
  id: string;
  priority: ProgrammeRulePriority;
  when: string;
  then: string;
  sessionCategories?: HyroxSessionCategory[];
  sessionTags?: string[];
};
