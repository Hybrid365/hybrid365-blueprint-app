/**
 * Rich coach programme-builder session library types.
 */

import type { WeekdayName } from "@/app/lib/hyroxCoachProgrammeDraft";

export type LibraryCategory =
  | "all"
  | "coach_staples"
  | "run_development"
  | "threshold_runs"
  | "tempo_aerobic"
  | "hyrox_compromised"
  | "erg_intervals"
  | "easy_erg"
  | "strength_endurance"
  | "station_emom"
  | "upper_grip"
  | "testing"
  | "race_week";

export type LibraryQuickFilter =
  | "staples"
  | "coach_staples"
  | "kieran_sessions"
  | "easy"
  | "hard"
  | "threshold"
  | "tempo"
  | "strength"
  | "hyrox"
  | "add_ons"
  | "testing"
  | "race_week"
  | "station_overload"
  | "leg_endurance"
  | "high_fatigue";

export type CoachSessionSource = "Kieran personal session" | "Hybrid365 library";

export type SessionStressLevel = "moderate" | "high" | "very_high";

export type CoachSessionLevel = "beginner" | "intermediate" | "advanced" | "pro" | "all";
export type ImpactType = "run" | "erg" | "bike" | "strength" | "mixed";
export type StressLevel = "low" | "moderate" | "high";
export type StationStress = "none" | "low" | "moderate" | "high";

export type CoachSessionPrescription = {
  objective: string;
  warmup: string[];
  mainSet: string[];
  cooldown: string[];
  targetPace?: string | null;
  targetLoad?: string | null;
  targetHR?: string | null;
  targetRPE?: string | null;
  whatToRecord: string[];
  coachNote: string;
  safetyNote?: string;
  progression?: string;
  regression?: string;
};

/** Rich HYROX programming metadata — optional, backwards-compatible extension. */
export type CoachSessionHyroxMetadata = {
  primaryCategory: string;
  secondaryCategory?: string;
  sessionType: string;
  trainingGoals: string[];
  energySystem: string;
  fatigueCost: "moderate" | "high" | "very_high";
  muscleDamageRisk: "low" | "moderate" | "moderate_high" | "high";
  impactTypeDetail?: string;
  runningVolume: number | string;
  runIncluded: boolean;
  hyroxSpecificity: string;
  raceSimulation: boolean;
  stationFocus: string[];
  weaknessTargets: string[];
  suitableLevels: string[];
  notSuitableFor: string[];
  bestWeekPlacement: string[];
  avoidAdjacentTo: string[];
  bestTrainingPhase: string[];
  progressionMethods: string[];
  /** Hide from smart/auto suggestions for beginner/low-intermediate unless admin override. */
  requiresAdvancedOrPro?: boolean;
  /** Block full-volume use in race week unless coach manually overrides. */
  blocksRaceWeekFullVolume?: boolean;
  /** Block full-volume use in deload week unless coach manually overrides. */
  blocksDeloadWeekFullVolume?: boolean;
  /** Session includes hill sprints — block if lower-leg issues flagged. */
  includesHillSprints?: boolean;
  /** High wall ball volume — warn if adjacent to other WB-heavy days. */
  highWallBallVolume?: boolean;
  /** High lower-body muscular load — warn near heavy legs / sled / lunge overload. */
  highLowerBodyMuscularLoad?: boolean;
};

export type CoachLibraryEntry = {
  id: string;
  sessionLibraryId: string;
  name: string;
  category: LibraryCategory;
  subcategory: string;
  level: CoachSessionLevel;
  durationMinutes: number;
  duration: string;
  hardDay: boolean;
  hardDayReason?: string;
  hardEasy: "hard" | "easy" | "moderate";
  intensityType: string;
  impactType: ImpactType;
  muscularStress: StressLevel;
  stationStress: StationStress;
  thresholdMinutes?: number;
  qualityRunMinutes?: number;
  runDistanceKm?: number;
  ergMinutes?: number;
  bikeMinutes?: number;
  strengthMinutes?: number;
  stationVolume?: number;
  equipmentRequired: string[];
  equipment: string[];
  bestFor: string[];
  avoidIf: string[];
  tags: string[];
  isStaple?: boolean;
  isOptionalAddOn?: boolean;
  preferredDay?: WeekdayName;
  avoidDayBefore?: WeekdayName[];
  avoidDayAfter?: WeekdayName[];
  similarSessions?: string[];
  source?: CoachSessionSource;
  sessionStress?: SessionStressLevel;
  editableVariables: string[];
  prescription: CoachSessionPrescription;
  progressionOptions?: string[];
  regressionOptions?: string[];
  abbrev: string;
  /** Extended HYROX session metadata for admin display and guardrails. */
  hyroxMetadata?: CoachSessionHyroxMetadata;
};

export type CoachSessionVolumeMeta = {
  durationMinutes: number;
  thresholdMinutes: number;
  qualityRunMinutes: number;
  runDistanceKm: number;
  ergMinutes: number;
  bikeMinutes: number;
  strengthMinutes: number;
  stationVolume: number;
  hardDay: boolean;
  impactType: ImpactType;
  muscularStress: StressLevel;
  stationStress: StationStress;
  isOptionalAddOn: boolean;
};

export function volumeMetaFromEntry(e: CoachLibraryEntry): CoachSessionVolumeMeta {
  return {
    durationMinutes: e.durationMinutes,
    thresholdMinutes: e.thresholdMinutes ?? 0,
    qualityRunMinutes: e.qualityRunMinutes ?? 0,
    runDistanceKm: e.runDistanceKm ?? 0,
    ergMinutes: e.ergMinutes ?? 0,
    bikeMinutes: e.bikeMinutes ?? 0,
    strengthMinutes: e.strengthMinutes ?? 0,
    stationVolume: e.stationVolume ?? 0,
    hardDay: e.hardDay,
    impactType: e.impactType,
    muscularStress: e.muscularStress,
    stationStress: e.stationStress,
    isOptionalAddOn: e.isOptionalAddOn ?? false,
  };
}

type EntryInput = Omit<
  CoachLibraryEntry,
  "equipment" | "hardEasy" | "abbrev" | "duration"
> & {
  duration?: string;
  equipment?: string[];
  hardEasy?: CoachLibraryEntry["hardEasy"];
  abbrev?: string;
};

export function buildCoachEntry(input: EntryInput): CoachLibraryEntry {
  const hardEasy =
    input.hardEasy ?? (input.hardDay ? "hard" : input.intensityType.includes("easy") ? "easy" : "moderate");
  const duration =
    input.duration ??
    (input.durationMinutes >= 90
      ? `${input.durationMinutes - 15}–${input.durationMinutes} min`
      : `${Math.max(20, input.durationMinutes - 10)}–${input.durationMinutes} min`);
  const abbrev =
    input.abbrev ??
    input.name
      .replace(/—/g, " ")
      .replace(/\s+/g, " ")
      .split(" ")
      .slice(0, 4)
      .join(" ")
      .slice(0, 28);

  return {
    ...input,
    hardEasy,
    duration,
    abbrev,
    equipment: input.equipment ?? input.equipmentRequired,
  };
}

export function isCoachStapleEntry(entry: CoachLibraryEntry): boolean {
  return (
    entry.source === "Kieran personal session" ||
    entry.tags.includes("kieran-session") ||
    entry.tags.includes("hybrid365-staple") ||
    entry.tags.includes("coach-staple")
  );
}

export function categoryToSessionType(
  category: LibraryCategory
): import("@/src/lib/hyrox/types").HyroxSessionCategory {
  switch (category) {
    case "coach_staples":
      return "compromised_running";
    case "tempo_aerobic":
      return "tempo_aerobic_quality";
    case "hyrox_compromised":
      return "compromised_running";
    case "erg_intervals":
    case "easy_erg":
      return "erg_development";
    case "strength_endurance":
    case "upper_grip":
    case "station_emom":
      return "strength";
    case "testing":
      return "testing";
    case "threshold_runs":
    case "run_development":
    case "race_week":
    default:
      return "run_development";
  }
}
