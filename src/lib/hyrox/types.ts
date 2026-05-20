/** Shared types for Hybrid365 Hyrox programming foundation. */

export type HyroxAbilityLevel = "beginner" | "intermediate" | "advanced" | "pro";

export type HyroxSessionCategory =
  | "run_development"
  | "tempo_aerobic_quality"
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

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type IntensityType = "easy" | "steady" | "tempo" | "threshold" | "quality" | "race_pace";

export type ThresholdModality = "run" | "ski" | "row" | "bike" | "mixed";

export type ImpactType = "run" | "erg" | "bike" | "mixed" | "none";

export type MuscularStress = "low" | "moderate" | "high";

export type PaceTargetType = "easy" | "HM" | "10k" | "5k" | "threshold" | "race_pace";

/** Scheduling + dashboard tracking metadata for a session template. */
export type SessionSchedulingMetadata = {
  hardDay: boolean;
  hardDayReason?: string;
  intensityType?: IntensityType;
  thresholdMinutes?: number;
  qualityRunMinutes?: number;
  fastRunMinutes?: number;
  thresholdModality?: ThresholdModality;
  impactType?: ImpactType;
  muscularStress?: MuscularStress;
  stationStress?: string[];
  compromisedRunVolumeM?: number;
  stationOverloadMinutes?: number;
  sessionStress?: "low" | "moderate" | "high";
  preferredDay?: Weekday[];
  avoidDayBefore?: DaySlotRole[];
  avoidDayAfter?: DaySlotRole[];
  estimatedDurationMinutes?: number;
  paceTargetType?: PaceTargetType;
  /** EMOM/add-on may attach to these day roles — not easy aerobic by default */
  emomAttachRoles?: DaySlotRole[];
};

export type EmomPrescription = {
  id: string;
  movement: string;
  durationMinutes: number;
  repsOrLoad: string;
  rpe: string;
  purpose: string;
  whatToRecord: string[];
  attachToRole: DaySlotRole;
  lowFatigueTechniqueOnly?: boolean;
};

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
  /** Session-specific safety / scaling warning (shown in resolved prescription). */
  safetyNote?: string;
  /** Hard/easy classification, threshold minutes, preferred placement */
  scheduling?: SessionSchedulingMetadata;
  /** Compromised session progression levers */
  compromisedProgression?: {
    rounds?: string;
    runDistance?: string;
    stationVolume?: string;
    restPrescription?: string;
    progressionMethod?: string;
  };
};

/** Fully resolved, athlete-executable session — single source for preview and generation. */
export type ResolvedSessionPrescription = {
  sessionLibraryId: string;
  name: string;
  category: string;
  subcategory: string;
  objective: string;
  warmup: string[];
  mainSet: string[];
  cooldown: string[];
  keySetSummary: string;
  targetPace: string | null;
  targetSplit: string | null;
  targetLoad: string | null;
  targetHRRange: string | null;
  fallbackHRGuide: string | null;
  rpeTarget: string;
  duration: string;
  thresholdMinutes?: number;
  qualityRunMinutes?: number;
  hardDay: boolean;
  hardDayReason?: string;
  whatToRecord: string[];
  coachNote: string;
  safetyNote: string;
  progressionNote: string;
  filmPrompt: string | null;
  equipmentRequired: string[];
  progressionLabel: string;
  variantSummary: string;
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
  | "intermediate_4_day"
  | "intermediate_5_day"
  | "advanced_6_day"
  | "pro_high_volume_6_7_day";

export type DaySlotRole =
  | "easy_run"
  | "hard_run"
  | "tempo_aerobic"
  | "long_aerobic"
  | "erg_threshold"
  | "erg_z2"
  | "strength_lower"
  | "strength_upper"
  | "gym_aerobic_upper"
  | "compromised_hybrid"
  | "testing"
  | "recovery"
  | "rest";

export type WeeklyDayTemplate = {
  day: Weekday;
  role: DaySlotRole;
  intensity: "easy" | "moderate" | "hard" | "rest";
  notes?: string;
  /** When false, day is not counted toward training days */
  active?: boolean;
  /** Optional AM session (e.g. Thursday tempo) — does not replace staple role */
  optionalAmRole?: DaySlotRole;
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

export type SchedulingValidationWarning = {
  id: string;
  severity: "warn" | "error";
  message: string;
  days?: Weekday[];
};

export type WeeklyHoursPlan = {
  weeklyTrainingHoursTarget: number;
  plannedKeySessionMinutes: number;
  plannedEasySupportMinutes: number;
  remainingAerobicMinutes: number;
  totalPlannedMinutes: number;
  weeklyThresholdMinutes: number;
  fillStrategy: string[];
  coachRationale: string;
};
