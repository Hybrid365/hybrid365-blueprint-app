import type {
  AthleteClassificationId,
  HyroxAbilityLevel,
  RecoveryStatus,
  StationWeakness,
} from "./types";

export type ExperienceLevel = "new" | "some_structure" | "experienced" | "competitive";

export type StrengthLevel = "low" | "moderate" | "high";

export type AthleteClassificationInput = {
  experienceLevel: ExperienceLevel;
  abilityLevel?: HyroxAbilityLevel;
  fiveKmSeconds?: number | null;
  tenKmSeconds?: number | null;
  weeklyRunKm?: number | null;
  strengthLevel?: StrengthLevel;
  stationWeaknesses?: StationWeakness[];
  recoveryProfile?: RecoveryStatus;
  weeksToRace?: number | null;
  /** Optional benchmark flags */
  benchmarksComplete?: boolean;
  compromisedTestLogged?: boolean;
};

export type AthleteClassificationResult = {
  classification: AthleteClassificationId;
  confidence: "low" | "medium" | "high";
  rationale: string[];
  suggestedFocus: string[];
  maxHardDaysPerWeek: number;
  preferErgOverRun: boolean;
};

const RUNNING_LIMITED_5K_SEC = 28 * 60; // slower than 28:00
const RUNNING_STRONG_5K_SEC = 22 * 60; // faster than 22:00
const LOW_WEEKLY_RUN_KM = 20;
const HIGH_WEEKLY_RUN_KM = 45;

function hasStationWeakness(weaknesses: StationWeakness[] | undefined, ...keys: StationWeakness[]): boolean {
  if (!weaknesses?.length) return false;
  return weaknesses.some((w) => keys.includes(w) && w !== "none_significant");
}

/**
 * Classify athlete for programme rules and session prioritisation.
 * Heuristic v1 — refine with coach review and more signals.
 */
export function classifyAthlete(input: AthleteClassificationInput): AthleteClassificationResult {
  const rationale: string[] = [];
  const suggestedFocus: string[] = [];

  const runLimited =
    (input.fiveKmSeconds != null && input.fiveKmSeconds > RUNNING_LIMITED_5K_SEC) ||
    (input.weeklyRunKm != null && input.weeklyRunKm < LOW_WEEKLY_RUN_KM);

  const runStrong =
    input.fiveKmSeconds != null && input.fiveKmSeconds < RUNNING_STRONG_5K_SEC;

  const stationLimited = hasStationWeakness(
    input.stationWeaknesses,
    "sled",
    "sled_push_pull",
    "wall_ball",
    "wall_balls",
    "lunges",
    "ski",
    "row",
    "carry",
    "farmers_carry",
    "burpees",
    "running_under_fatigue"
  );

  const strengthHigh = input.strengthLevel === "high";
  const strengthLow = input.strengthLevel === "low";
  const poorRecovery = input.recoveryProfile === "poor";
  const beginner =
    input.experienceLevel === "new" || input.abilityLevel === "beginner";
  const advanced =
    input.experienceLevel === "competitive" ||
    input.abilityLevel === "advanced" ||
    input.abilityLevel === "pro";

  if (beginner) {
    rationale.push("New to structured Hyrox training or beginner ability level.");
    suggestedFocus.push("Easy running frequency", "Movement quality", "Conservative hard-day spacing");
    return {
      classification: "beginner_foundation",
      confidence: "high",
      rationale,
      suggestedFocus,
      maxHardDaysPerWeek: 2,
      preferErgOverRun: true,
    };
  }

  if (poorRecovery) {
    rationale.push("Recovery profile flagged as poor — limit cumulative stress.");
    suggestedFocus.push("Z2 bike/erg", "Fewer hard days", "Sleep and load management");
    return {
      classification: "high_output_poor_recovery",
      confidence: "medium",
      rationale,
      suggestedFocus,
      maxHardDaysPerWeek: 2,
      preferErgOverRun: true,
    };
  }

  if (advanced && !runLimited && !stationLimited) {
    rationale.push("Advanced training age with balanced limiters.");
    suggestedFocus.push("Race-specific compromised work", "Threshold density", "Benchmark tracking");
    return {
      classification: "advanced_competitive",
      confidence: "medium",
      rationale,
      suggestedFocus,
      maxHardDaysPerWeek: 4,
      preferErgOverRun: false,
    };
  }

  if (strengthHigh && runLimited) {
    rationale.push("High strength base but running engine or volume is limited.");
    suggestedFocus.push("Threshold runs", "Easy run frequency", "Controlled compromised running");
    return {
      classification: "strength_dominant_run_limited",
      confidence: "medium",
      rationale,
      suggestedFocus,
      maxHardDaysPerWeek: 3,
      preferErgOverRun: true,
    };
  }

  if (runStrong && stationLimited) {
    rationale.push("Running fitness is relatively strong; stations break down under fatigue.");
    suggestedFocus.push("Station capacity", "Compromised density", "Wall ball / sled / lunge strength");
    return {
      classification: "runner_dominant_station_limited",
      confidence: "medium",
      rationale,
      suggestedFocus,
      maxHardDaysPerWeek: 3,
      preferErgOverRun: false,
    };
  }

  if (runLimited && !stationLimited) {
    rationale.push("5km time or weekly run volume suggests running is the primary limiter.");
    suggestedFocus.push("Threshold progression", "Long aerobic", "Erg threshold to spare legs");
    return {
      classification: "running_limited",
      confidence: input.fiveKmSeconds != null ? "high" : "medium",
      rationale,
      suggestedFocus,
      maxHardDaysPerWeek: 3,
      preferErgOverRun: true,
    };
  }

  if (stationLimited) {
    rationale.push("Station weaknesses dominate race performance.");
    suggestedFocus.push("Sled, wall ball, lunge work", "Erg threshold", "Maintain run maintenance");
    return {
      classification: "station_limited",
      confidence: "medium",
      rationale,
      suggestedFocus,
      maxHardDaysPerWeek: 3,
      preferErgOverRun: false,
    };
  }

  if (strengthLow && !runLimited) {
    rationale.push("Strength is relatively low — station durability may lag.");
    suggestedFocus.push("Lower/upper strength", "Carries", "Gradual compromised intro");
  }

  rationale.push("No single dominant limiter — balanced hybrid progression.");
  suggestedFocus.push("Even run / erg / strength / compromised distribution");

  return {
    classification: "balanced_intermediate",
    confidence: "medium",
    rationale,
    suggestedFocus,
    maxHardDaysPerWeek: 3,
    preferErgOverRun: false,
  };
}

export const CLASSIFICATION_LABELS: Record<AthleteClassificationId, string> = {
  beginner_foundation: "Beginner foundation",
  running_limited: "Running limited",
  station_limited: "Station limited",
  strength_dominant_run_limited: "Strong — run limited",
  runner_dominant_station_limited: "Runner — station limited",
  balanced_intermediate: "Balanced intermediate",
  advanced_competitive: "Advanced competitive",
  high_output_poor_recovery: "High output — poor recovery",
};
