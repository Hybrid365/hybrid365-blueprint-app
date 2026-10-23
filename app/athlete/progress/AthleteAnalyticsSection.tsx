"use client";

import type {
  HyroxAthleteAnalytics,
  HyroxAnalyticsWeekSummary,
  HyroxAnalyticsModality,
} from "@/app/lib/hyroxAthleteAnalytics";
import {
  BenchmarkCard,
  MetricDelta,
  ProgressChartCard,
  SectionHeader,
  StatusPill,
  TrainingSummary,
  athleteBenchmarkStatus,
} from "@/components/athlete-command-centre/visual";

const MODALITY_LABEL: Record<HyroxAnalyticsModality, string> = {
  run: "Run",
  bike: "Bike",
  skierg: "SkiErg",
  rowerg: "RowErg",
  strength: "Strength",
  hyrox_specific: "HYROX",
  other: "Other",
};

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const a = new Date(`${start}T12:00:00`).toLocaleDateString("en-GB", opts);
  const b = new Date(`${end}T12:00:00`).toLocaleDateString("en-GB", opts);
  return `${a} – ${b}`;
}

function formatMinutes(value: number | null): string {
  if (value == null) return "—";
  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const mins = Math.round(value % 60);
    return mins ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${value} min`;
}

function formatKm(value: number | null): string {
  return value == null ? "—" : `${value} km`;
}

function formatPct(value: number | null): string {
  return value == null ? "—" : `${value}%`;
}

function weekItems(week: HyroxAnalyticsWeekSummary) {
  return [
    {
      label: "Completion",
      value: formatPct(week.completionPct),
      sub:
        week.plannedSessions === 0
          ? "No published sessions this week"
          : `${week.completedSessions} of ${week.plannedSessions} sessions`,
    },
    {
      label: "Run distance",
      value: formatKm(week.runDistanceKm),
      sub: week.runDistanceKm == null ? "No logged run distance" : "Logged run distance only",
    },
    {
      label: "Duration",
      value: formatMinutes(week.trainingDurationMinutes),
      sub: week.trainingDurationMinutes == null ? "No logged duration" : "Logged duration only",
    },
    {
      label: "Average RPE",
      value: week.averageRpe == null ? "—" : String(week.averageRpe),
      sub: week.averageRpe == null ? "No logged RPE" : "Mean of logged RPE",
    },
    {
      label: "Session-RPE load",
      value: week.sessionRpeLoad == null ? "—" : String(week.sessionRpeLoad),
      sub:
        week.sessionRpeLoad == null
          ? "Needs duration and RPE on the same session"
          : "Sum of duration × RPE",
    },
    {
      label: "Key sessions",
      value: `${week.keySessionsCompleted} of ${week.keySessionsPlanned}`,
      sub: "Key sessions completed of planned",
    },
  ];
}

function completionDelta(current: HyroxAnalyticsWeekSummary, previous: HyroxAnalyticsWeekSummary | null) {
  if (current.completionPct == null || previous?.completionPct == null) return null;
  const delta = current.completionPct - previous.completionPct;
  if (delta === 0) return "Same completion as last week";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta} pts vs previous week`;
}

export function AthleteAnalyticsSection({ analytics }: { analytics: HyroxAthleteAnalytics }) {
  const hasAnySession =
    analytics.currentWeek.plannedSessions > 0 || (analytics.previousWeek?.plannedSessions ?? 0) > 0;
  const delta = completionDelta(analytics.currentWeek, analytics.previousWeek);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="This week"
        description={`${formatDateRange(analytics.currentWeek.startDate, analytics.currentWeek.endDate)}${
          analytics.currentWeek.complete ? "" : " · In progress — remaining sessions stay planned"
        }`}
      />
      {!hasAnySession ? (
        <TrainingSummary
          items={[]}
          empty="No published sessions yet. Completion, duration, and RPE will appear here from logged sessions — not from sample charts."
        />
      ) : (
        <>
          <TrainingSummary items={weekItems(analytics.currentWeek)} />
          <MetricDelta value={delta} />
        </>
      )}

      <SectionHeader
        title="Previous week"
        description={
          analytics.previousWeek
            ? formatDateRange(analytics.previousWeek.startDate, analytics.previousWeek.endDate)
            : undefined
        }
      />
      {analytics.previousWeek && analytics.previousWeek.plannedSessions > 0 ? (
        <TrainingSummary items={weekItems(analytics.previousWeek)} />
      ) : (
        <TrainingSummary
          items={[]}
          empty="No published sessions in the previous Monday–Sunday window."
        />
      )}

      <SectionHeader
        title="Last 4 weeks"
        description="Includes only days up to today. A partial current week is not filled in."
      />
      <TrainingSummary
        items={[
          { label: "Run distance", value: formatKm(analytics.rolling4.runDistanceKm) },
          { label: "Duration", value: formatMinutes(analytics.rolling4.trainingDurationMinutes) },
          { label: "Completion", value: formatPct(analytics.rolling4.completionPct) },
          {
            label: "Average RPE",
            value: analytics.rolling4.averageRpe == null ? "—" : String(analytics.rolling4.averageRpe),
          },
        ]}
      />

      <SectionHeader
        title="Modality mix"
        description="Published sessions in the current Monday–Sunday week."
      />
      <ProgressChartCard
        title="Modality mix"
        series={analytics.distribution.map((row) => ({
          label: `${MODALITY_LABEL[row.modality]} · ${
            row.durationMinutes == null
              ? `${row.sessionCount} session${row.sessionCount === 1 ? "" : "s"}`
              : formatMinutes(row.durationMinutes)
          }`,
          value: row.durationMinutes ?? row.sessionCount,
        }))}
        empty="No published sessions this week up to today, so there is no modality mix to show."
      />

      <SectionHeader
        title="Benchmark history"
        description="Stored results only. Missing tests stay empty."
      />
      {analytics.benchmarks.length === 0 ? (
        <TrainingSummary
          items={[]}
          empty="No benchmark history yet. Each logged result will appear as its own point — nothing is interpolated."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {analytics.benchmarks.map((series) => {
            const latest = series.points[series.points.length - 1];
            return (
              <div key={series.type} className="space-y-3">
                <BenchmarkCard
                  label={series.label}
                  value={latest?.display ?? null}
                  status={athleteBenchmarkStatus({ status: latest?.status ?? "approved" })}
                  meta={`${series.points.length} measured point${series.points.length === 1 ? "" : "s"}`}
                />
                {latest ? <StatusPill status={athleteBenchmarkStatus({ status: latest.status })} /> : null}
                <ProgressChartCard
                  title={series.label}
                  series={series.points.map((point) => ({
                    label: point.date,
                    value: point.normalizedValue,
                  }))}
                  empty="No measured points in this series."
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
