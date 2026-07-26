/**
 * HYROX Team — activity-specific session logging contracts (Phase 1 foundation).
 * Stored inside hyrox_programme_sessions.athlete_feedback jsonb (additive).
 * Legacy fields (rpe, notes, modifications, score, loggedAt) remain required for dual-read.
 */

export const SESSION_LOG_SCHEMA_VERSION = 2 as const;

export type SessionActivityType =
  | "run"
  | "strength"
  | "bike"
  | "row"
  | "ski"
  | "hyrox"
  | "other";

/** Snapshot of prescription targets at log time — enables planned vs completed later. */
export type SessionPlannedTargets = {
  purpose?: string | null;
  estimatedDurationMinutes?: number | null;
  targetPace?: string | null;
  targetSplit?: string | null;
  targetLoad?: string | null;
  targetHR?: string | null;
  targetRPE?: string | null;
  activityType?: SessionActivityType | null;
};

export type RunSessionMetrics = {
  distanceKm?: string | null;
  duration?: string | null;
  averagePace?: string | null;
  averageHr?: string | null;
  maxHr?: string | null;
  cadence?: string | null;
  elevationM?: string | null;
  powerW?: string | null;
  rpe?: string | null;
  painOrTightness?: string | null;
  notes?: string | null;
};

export type StrengthExerciseEntry = {
  exercise: string;
  sets?: string | null;
  reps?: string | null;
  load?: string | null;
  rpeOrRir?: string | null;
  notes?: string | null;
};

export type StrengthSessionMetrics = {
  exercises?: StrengthExerciseEntry[];
  sessionRpe?: string | null;
  notes?: string | null;
};

export type ErgSessionMetrics = {
  /** bike | row | ski — mirrored at metrics level for clarity */
  modality?: "bike" | "row" | "ski";
  distance?: string | null;
  duration?: string | null;
  paceOrSplit?: string | null;
  watts?: string | null;
  calories?: string | null;
  averageHr?: string | null;
  maxHr?: string | null;
  cadenceOrStrokeRate?: string | null;
  rpe?: string | null;
  notes?: string | null;
};

export type HyroxSessionMetrics = {
  totalDuration?: string | null;
  runSplits?: string | null;
  stationSplits?: string | null;
  limitingStation?: string | null;
  strongestStation?: string | null;
  rpe?: string | null;
  notes?: string | null;
};

export type OtherSessionMetrics = {
  duration?: string | null;
  rpe?: string | null;
  notes?: string | null;
};

export type SessionActivityMetrics =
  | RunSessionMetrics
  | StrengthSessionMetrics
  | ErgSessionMetrics
  | HyroxSessionMetrics
  | OtherSessionMetrics;

export type HyroxAthleteSessionFeedbackV2 = {
  /** Legacy fields — always dual-read by existing UI */
  rpe?: string | null;
  notes?: string | null;
  modifications?: string | null;
  score?: string | null;
  loggedAt?: string | null;
  /** Phase 1 additive */
  schemaVersion?: typeof SESSION_LOG_SCHEMA_VERSION | 1;
  activityType?: SessionActivityType | null;
  planned?: SessionPlannedTargets | null;
  metrics?: SessionActivityMetrics | null;
};

export function emptyStrengthEntry(): StrengthExerciseEntry {
  return { exercise: "", sets: "", reps: "", load: "", rpeOrRir: "", notes: "" };
}

export function emptyRunMetrics(): RunSessionMetrics {
  return {
    distanceKm: "",
    duration: "",
    averagePace: "",
    averageHr: "",
    maxHr: "",
    cadence: "",
    elevationM: "",
    powerW: "",
    rpe: "",
    painOrTightness: "",
    notes: "",
  };
}

export function emptyErgMetrics(modality: "bike" | "row" | "ski"): ErgSessionMetrics {
  return {
    modality,
    distance: "",
    duration: "",
    paceOrSplit: "",
    watts: "",
    calories: "",
    averageHr: "",
    maxHr: "",
    cadenceOrStrokeRate: "",
    rpe: "",
    notes: "",
  };
}

export function emptyHyroxMetrics(): HyroxSessionMetrics {
  return {
    totalDuration: "",
    runSplits: "",
    stationSplits: "",
    limitingStation: "",
    strongestStation: "",
    rpe: "",
    notes: "",
  };
}

export function emptyOtherMetrics(): OtherSessionMetrics {
  return { duration: "", rpe: "", notes: "" };
}

export function emptyMetricsForActivity(type: SessionActivityType): SessionActivityMetrics {
  switch (type) {
    case "run":
      return emptyRunMetrics();
    case "strength":
      return { exercises: [emptyStrengthEntry()], sessionRpe: "", notes: "" };
    case "bike":
      return emptyErgMetrics("bike");
    case "row":
      return emptyErgMetrics("row");
    case "ski":
      return emptyErgMetrics("ski");
    case "hyrox":
      return emptyHyroxMetrics();
    default:
      return emptyOtherMetrics();
  }
}
