/**
 * Performance Hub types + metric calculation definitions.
 *
 * CALCULATION DEFINITIONS (central — UI must not re-implement)
 * -------------------------------------------------------------
 * Date range:
 *   this_week  — Mon–Sun containing athlete-local "today" (programme calendar weeks)
 *   last_4     — rolling 28 local days ending today (inclusive)
 *   last_12    — rolling 84 local days ending today (inclusive)
 * Timezone: athlete-provided IANA tz for readiness dates; session dates from
 *   programme_start_date + weekday (same as athlete programme calendar).
 *
 * Planned inclusion:
 *   Sessions scheduled with calendar YMD inside [start, end].
 *   Planned duration = prescription estimatedDurationMinutes / duration field /
 *     plannedTargets snapshot when present.
 *   Planned run distance = only when prescription/editConfig has explicit distance;
 *     otherwise planned run distance metric is Partial Data (not zero).
 *
 * Completed inclusion:
 *   Duration/distance/RPE from athlete_feedback V2 metrics when present;
 *   legacy rpe/notes count as "hasLog" for completion/compliance but not as
 *   structured volume (shows Partial Data / Not enough structured data).
 *   Status "completed" without metrics → session completion counts; volume metrics
 *   remain Partial Data if no structured duration/distance.
 *
 * Skipped / missed:
 *   status missed → not completed; excluded from completed volume.
 * Partial sessions:
 *   hasLog but status not complete → completion partial; volume included if metrics exist.
 *
 * Legacy-data:
 *   No fabricated zeroes for volume when athlete may have trained without detail.
 *   Empty structured series → null + emptyReason string.
 *
 * Units:
 *   Hours = minutes / 60 (1 decimal). Distance km. Erg meters→km if value > 50.
 */

import type { TrainingDistributionBucket } from "@/app/lib/hyrox-team/modules/performanceHub/classification";

export type HubRangeKey = "this_week" | "last_4" | "last_12";

export type ExecutionState = "on_plan" | "below_plan" | "above_plan" | "partial_data";

export type HubMetricValue = {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  display: string;
  emptyReason?: string | null;
  tooltip: string;
};

export type PlannedVsCompletedCard = {
  key: string;
  label: string;
  planned: number | null;
  completed: number | null;
  unit: string;
  pct: number | null;
  state: ExecutionState;
  tooltip: string;
  emptyReason?: string | null;
};

export type DistributionSlice = {
  bucket: TrainingDistributionBucket;
  label: string;
  sessionCount: number;
  minutes: number | null;
  sharePct: number | null;
  confidenceNote: string;
};

export type WeeklyTrendPoint = {
  weekStartYmd: string;
  weekLabel: string;
  trainingHours: number | null;
  runDistanceKm: number | null;
  thresholdMinutes: number | null;
  easyMinutes: number | null;
  strengthSessions: number | null;
  hyroxSessions: number | null;
  averageRpe: number | null;
  readinessAvg: number | null;
  bodyweightKg: number | null;
  completionPct: number | null;
  structuredData: boolean;
};

export type HyroxExposureRow = {
  movement: string;
  sessionsContaining: number | null;
  structuredVolume: string | null;
  lastExposureYmd: string | null;
  emptyReason?: string | null;
};

export type HubInsight = {
  id: string;
  title: string;
  body: string;
  dataSource: string;
  comparisonPeriod: string;
};

export type HubReadinessSummary = {
  currentScore: number | null;
  currentCategory: string | null;
  avg7d: number | null;
  trend: "up" | "down" | "flat" | "unknown";
  missingDays: number;
  illnessDays: number;
  highSorenessDays: number;
  emptyReason?: string | null;
};

export type HubBenchmarkPreview = {
  id: string;
  label: string;
  latest: string | null;
  previous: string | null;
  change: string | null;
  date: string | null;
};

export type CoachHubFlag = {
  id: string;
  label: string;
  severity: "info" | "watch" | "alert";
  detail: string;
};

export type PerformanceHubPayload = {
  range: {
    key: HubRangeKey;
    startYmd: string;
    endYmd: string;
    label: string;
  };
  summary: HubMetricValue[];
  plannedVsCompleted: PlannedVsCompletedCard[];
  distribution: DistributionSlice[];
  weeklySeries: WeeklyTrendPoint[];
  hyroxExposures: HyroxExposureRow[];
  insights: HubInsight[];
  readiness: HubReadinessSummary;
  benchmarks: HubBenchmarkPreview[];
  coachFlags: CoachHubFlag[];
  checkInComplete: boolean | null;
  dataNotes: string[];
};

export function executionState(
  planned: number | null,
  completed: number | null,
  tolerancePct = 0.08
): ExecutionState {
  if (planned == null || completed == null) return "partial_data";
  if (planned <= 0) return completed > 0 ? "above_plan" : "on_plan";
  const ratio = completed / planned;
  if (Math.abs(ratio - 1) <= tolerancePct) return "on_plan";
  if (ratio < 1 - tolerancePct) return "below_plan";
  return "above_plan";
}

export function executionStateLabel(state: ExecutionState): string {
  switch (state) {
    case "on_plan":
      return "On Plan";
    case "below_plan":
      return "Below Plan";
    case "above_plan":
      return "Above Plan";
    default:
      return "Partial Data";
  }
}

export function pctOf(planned: number | null, completed: number | null): number | null {
  if (planned == null || completed == null || planned <= 0) return null;
  return Math.round((completed / planned) * 100);
}

export function formatMetricNumber(value: number | null, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}
