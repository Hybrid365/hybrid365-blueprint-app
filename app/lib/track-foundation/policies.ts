import type { EvidenceSource } from "./types";

/**
 * Useful life of a result. These are coaching windows, not a single global expiry.
 * A race can stay informative after a short threshold test has gone stale.
 */
export type RecencyPolicy = {
  id: string;
  label: string;
  currentDays: number;
  supportingDays: number;
};

export const RECENCY_POLICIES = {
  run_5k: { id: "run_5k", label: "5K", currentDays: 70, supportingDays: 150 },
  run_10k: { id: "run_10k", label: "10K", currentDays: 90, supportingDays: 200 },
  run_half: { id: "run_half", label: "Half marathon", currentDays: 150, supportingDays: 320 },
  run_threshold: { id: "run_threshold", label: "Threshold test", currentDays: 28, supportingDays: 56 },
  run_lab_threshold: { id: "run_lab_threshold", label: "Lab threshold", currentDays: 42, supportingDays: 90 },
  hyrox_race: { id: "hyrox_race", label: "HYROX race", currentDays: 120, supportingDays: 270 },
  ski_2k: { id: "ski_2k", label: "SkiErg 2K", currentDays: 56, supportingDays: 120 },
  row_2k: { id: "row_2k", label: "RowErg 2K", currentDays: 56, supportingDays: 120 },
  bike_20min: { id: "bike_20min", label: "Bike 20-minute test", currentDays: 42, supportingDays: 90 },
  bike_ftp: { id: "bike_ftp", label: "FTP", currentDays: 42, supportingDays: 90 },
  strength_lower: { id: "strength_lower", label: "Strength benchmark", currentDays: 56, supportingDays: 140 },
  station: { id: "station", label: "Station benchmark", currentDays: 42, supportingDays: 100 },
} as const satisfies Record<string, RecencyPolicy>;

export type PolicyId = keyof typeof RECENCY_POLICIES;

/**
 * Categorical source quality. Higher outranks lower when both results are usable.
 * Not a fake confidence percentage.
 */
export const SOURCE_RANK: Record<EvidenceSource, number> = {
  official_race: 6,
  lab_test: 6,
  coach_test: 5,
  training_test: 4,
  self_entered_benchmark: 3,
  watch_estimate: 1,
};

export const SOURCE_LABEL: Record<EvidenceSource, string> = {
  official_race: "Official race",
  lab_test: "Lab test",
  coach_test: "Coach test",
  training_test: "Training test",
  self_entered_benchmark: "Self-entered benchmark",
  watch_estimate: "Watch estimate",
};

/** Watch-predicted times never become the prescription anchor. */
export function sourceCanAnchor(source: EvidenceSource): boolean {
  return source !== "watch_estimate";
}

export function policyFor(policyId: string): RecencyPolicy | null {
  if (policyId in RECENCY_POLICIES) return RECENCY_POLICIES[policyId as PolicyId];
  return null;
}

/**
 * How directly a running result measures threshold.
 * Used only as a tie-break after source quality.
 */
export function runningThresholdSpecificity(testId: string): number {
  if (testId === "run_lab_threshold") return 5;
  if (testId === "run_threshold") return 4;
  if (testId === "run_5k") return 3;
  if (testId === "run_10k") return 2;
  return 0;
}

/** 20-minute average power × 0.95. Same factor used on existing bike benchmark notes. */
export const FTP_FROM_20_MIN_FACTOR = 0.95;

/** Guidance added to a 2K /500m split. Labelled guidance, not a lab threshold. */
export const ERG_THRESHOLD_OFFSET_SEC = 5;
