/**
 * Transparent, rule-based Performance Hub insights (not AI).
 */

import type { HubInsight, PlannedVsCompletedCard, WeeklyTrendPoint } from "@/app/lib/hyrox-team/modules/performanceHub/types";
import type { HubReadinessSummary } from "@/app/lib/hyrox-team/modules/performanceHub/types";

function pctChange(curr: number, prev: number): number | null {
  if (!Number.isFinite(curr) || !Number.isFinite(prev) || prev === 0) return null;
  return Math.round(((curr - prev) / Math.abs(prev)) * 100);
}

export function buildHubInsights(params: {
  rangeLabel: string;
  weeklySeries: WeeklyTrendPoint[];
  pvc: PlannedVsCompletedCard[];
  readiness: HubReadinessSummary;
  completionPct: number | null;
  priorCompletionPct: number | null;
}): HubInsight[] {
  const insights: HubInsight[] = [];
  const series = params.weeklySeries.filter((w) => w.structuredData);
  const half = Math.floor(series.length / 2);

  if (series.length >= 4 && half > 0) {
    const recent = series.slice(-half);
    const prior = series.slice(0, half);
    const sum = (xs: WeeklyTrendPoint[], key: keyof WeeklyTrendPoint) => {
      const nums = xs
        .map((x) => x[key])
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
      return nums.length ? nums.reduce((a, b) => a + b, 0) : null;
    };
    const recentRun = sum(recent, "runDistanceKm");
    const priorRun = sum(prior, "runDistanceKm");
    const delta = recentRun != null && priorRun != null ? pctChange(recentRun, priorRun) : null;
    if (delta != null) {
      insights.push({
        id: "run-volume",
        title: "Running volume",
        body: `${delta >= 0 ? "Up" : "Down"} ${Math.abs(delta)}% versus the previous ${half}-week period in this view.`,
        dataSource: "Logged run distance from session metrics (athlete_feedback).",
        comparisonPeriod: params.rangeLabel,
      });
    }
  }

  const runPvc = params.pvc.find((c) => c.key === "run_distance");
  if (runPvc?.pct != null && runPvc.state !== "partial_data") {
    insights.push({
      id: "run-execution",
      title: "Running distance execution",
      body: `Completed ${runPvc.pct}% of planned running distance in ${params.rangeLabel.toLowerCase()}. Status: ${runPvc.state.replace(/_/g, " ")}.`,
      dataSource: "Planned prescription targets vs completed run metrics.",
      comparisonPeriod: params.rangeLabel,
    });
  }

  if (params.readiness.avg7d != null && params.readiness.trend !== "unknown") {
    const trendWord =
      params.readiness.trend === "up"
        ? "increased"
        : params.readiness.trend === "down"
          ? "declined"
          : "been stable";
    insights.push({
      id: "readiness-trend",
      title: "Recovery",
      body: `Average readiness has ${trendWord} across the last seven days${
        params.readiness.illnessDays > 0
          ? ` (${params.readiness.illnessDays} illness flag day(s))`
          : ""
      }.`,
      dataSource: "hyrox_daily_readiness scores (readiness indicator).",
      comparisonPeriod: "Last 7 local days",
    });
  }

  if (
    params.completionPct != null &&
    params.priorCompletionPct != null &&
    params.completionPct !== params.priorCompletionPct
  ) {
    insights.push({
      id: "consistency",
      title: "Consistency",
      body: `Session logging changed from ${Math.round(params.priorCompletionPct)}% to ${Math.round(params.completionPct)}% versus the prior comparable window.`,
      dataSource: "Programme session status + athlete_feedback presence.",
      comparisonPeriod: params.rangeLabel,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "sparse",
      title: "Building your picture",
      body: "Not enough structured data yet to compare trends. Keep logging sessions and morning readiness for clearer insights.",
      dataSource: "Hub analytics (insufficient structured rows).",
      comparisonPeriod: params.rangeLabel,
    });
  }

  return insights.slice(0, 5);
}
