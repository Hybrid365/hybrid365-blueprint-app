/** Frozen calculation helpers. Implementation lives in hyroxAthleteAnalytics.ts */
export {
  ANALYTICS_UNSUPPORTED_METRICS,
  ATHLETE_ANALYTICS_UNSUPPORTED,
  analyticsWeekContaining,
  computeHyroxAthleteAnalytics,
  mapActivityToModality,
  modalityFromSession,
  readLoggedAnalyticsMetrics,
  shiftAnalyticsWeek,
} from "@/app/lib/hyroxAthleteAnalytics";

export type {
  ComputeHyroxAthleteAnalyticsInput,
  HyroxAnalyticsBenchmarkInput,
  HyroxAnalyticsBenchmarkPoint,
  HyroxAnalyticsBenchmarkSeries,
  HyroxAnalyticsDistribution,
  HyroxAnalyticsDistributionRow,
  HyroxAnalyticsModality,
  HyroxAnalyticsSessionInput,
  HyroxAnalyticsWeek,
  HyroxAnalyticsWeekSummary,
  HyroxAthleteAnalytics,
  HyroxBenchmarkPoint,
  HyroxModality,
  HyroxModalityBucket,
  HyroxModalitySlice,
} from "@/app/lib/hyroxAthleteAnalytics";
