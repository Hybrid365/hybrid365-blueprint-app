"use client";

import {
  athleteCard,
  athleteCardPadding,
  eyebrowClass,
} from "@/components/athlete-command-centre/athleteUi";
import type {
  HyroxAthleteAnalytics,
  HyroxAnalyticsWeekSummary,
  HyroxAnalyticsBenchmarkPoint,
  HyroxAnalyticsModality,
  HyroxAnalyticsDistributionRow,
} from "@/app/lib/hyroxAthleteAnalytics";

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

function weekInProgress(week: HyroxAnalyticsWeekSummary): boolean {
  return !week.complete;
}

function MetricTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className={`${athleteCard} ${athleteCardPadding}`}>
      <p className={eyebrowClass}>{label}</p>
      <p className="mt-2 text-[30px] font-bold tracking-tight text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </article>
  );
}

function WeekFacts({
  week,
  title,
}: {
  week: HyroxAnalyticsWeekSummary;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <div>
        <p className={eyebrowClass}>{title}</p>
        <p className="mt-1 text-sm text-zinc-400">
          {formatDateRange(week.startDate, week.endDate)}
          {weekInProgress(week) ? " · In progress" : ""}
        </p>
        {week.complete ? null : (
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Week in progress — remaining sessions stay planned. This is not a finished 7-day sample.
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricTile
          label="Completion"
          value={formatPct(week.completionPct)}
          hint={
            week.plannedSessions === 0
              ? "No published sessions this week"
              : `${week.completedSessions} of ${week.plannedSessions} sessions`
          }
        />
        <MetricTile
          label="Run distance"
          value={formatKm(week.runDistanceKm)}
          hint={week.runDistanceKm == null ? "No logged run distance" : "Logged run distance only"}
        />
        <MetricTile
          label="Duration"
          value={formatMinutes(week.trainingDurationMinutes)}
          hint={week.trainingDurationMinutes == null ? "No logged duration" : "Logged duration only"}
        />
        <MetricTile
          label="Average RPE"
          value={week.averageRpe == null ? "—" : String(week.averageRpe)}
          hint={week.averageRpe == null ? "No logged RPE" : "Mean of logged RPE"}
        />
        <MetricTile
          label="Session-RPE load"
          value={week.sessionRpeLoad == null ? "—" : String(week.sessionRpeLoad)}
          hint={
            week.sessionRpeLoad == null
              ? "Needs duration and RPE on the same session"
              : "Sum of duration × RPE"
          }
        />
        <MetricTile
          label="Key sessions"
          value={`${week.keySessionsCompleted} of ${week.keySessionsPlanned}`}
          hint="Key sessions completed of planned"
        />
      </div>
    </section>
  );
}

function DistributionList({ rows }: { rows: HyroxAnalyticsDistributionRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-zinc-400">
        No published sessions this week up to today, so there is no modality mix to show.
      </p>
    );
  }
  const maxDuration = Math.max(0, ...rows.map((row) => row.durationMinutes ?? 0));
  const maxCount = Math.max(1, ...rows.map((row) => row.sessionCount));
  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const useDuration = maxDuration > 0 && row.durationMinutes != null;
        const widthPct = useDuration
          ? Math.round((row.durationMinutes! / maxDuration) * 100)
          : Math.round((row.sessionCount / maxCount) * 100);
        return (
          <li key={row.modality}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-zinc-200">{MODALITY_LABEL[row.modality]}</span>
              <span className="text-zinc-500">
                {row.durationMinutes == null
                  ? `${row.sessionCount} session${row.sessionCount === 1 ? "" : "s"}`
                  : `${formatMinutes(row.durationMinutes)} · ${row.sessionCount}`}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-yellow-400/80" style={{ width: `${Math.max(widthPct, 4)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function BenchmarkSeriesChart({ points }: { points: HyroxAnalyticsBenchmarkPoint[] }) {
  if (points.length === 0) return null;
  const width = 280;
  const height = 72;
  const padX = 10;
  const padY = 8;
  const values = points.map((point) => point.normalizedValue);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : padX + (index / (points.length - 1)) * (width - padX * 2);
    const y = height - padY - ((point.normalizedValue - min) / span) * (height - padY * 2);
    return { x, y, point };
  });
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-3 h-16 w-full text-yellow-400"
      role="img"
      aria-label={`${points.length} measured result${points.length === 1 ? "" : "s"}`}
    >
      {coords.length > 1 ? (
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          points={coords.map((c) => `${c.x},${c.y}`).join(" ")}
        />
      ) : null}
      {coords.map((c) => (
        <circle
          key={`${c.point.date}-${c.point.normalizedValue}-${c.point.status}`}
          cx={c.x}
          cy={c.y}
          r="3.5"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

export function AthleteAnalyticsSection({ analytics }: { analytics: HyroxAthleteAnalytics }) {
  const hasAnySession =
    analytics.currentWeek.plannedSessions > 0 || (analytics.previousWeek?.plannedSessions ?? 0) > 0;
  return (
    <div className="space-y-8">
      {!hasAnySession ? (
        <div className={`${athleteCard} ${athleteCardPadding}`}>
          <p className={eyebrowClass}>Training week</p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            No published sessions yet. Completion, duration, and RPE will appear here from logged
            sessions — not from sample charts.
          </p>
        </div>
      ) : (
        <>
          <WeekFacts week={analytics.currentWeek} title="This week" />
          {analytics.previousWeek && analytics.previousWeek.plannedSessions > 0 ? (
            <WeekFacts week={analytics.previousWeek} title="Previous week" />
          ) : (
            <div className={`${athleteCard} ${athleteCardPadding}`}>
              <p className={eyebrowClass}>Previous week</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                No published sessions in the previous Monday–Sunday window.
              </p>
            </div>
          )}
        </>
      )}

      <section className="space-y-3">
        <div>
          <p className={eyebrowClass}>Last 4 weeks</p>
          <p className="mt-1 text-sm text-zinc-500">
            Includes only days up to today. A partial current week is not filled in.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricTile label="Run distance" value={formatKm(analytics.rolling4.runDistanceKm)} />
          <MetricTile label="Duration" value={formatMinutes(analytics.rolling4.trainingDurationMinutes)} />
          <MetricTile label="Completion" value={formatPct(analytics.rolling4.completionPct)} />
          <MetricTile
            label="Average RPE"
            value={analytics.rolling4.averageRpe == null ? "—" : String(analytics.rolling4.averageRpe)}
          />
        </div>
      </section>

      <section className={`${athleteCard} ${athleteCardPadding} space-y-4`}>
        <div>
          <p className={eyebrowClass}>Modality mix</p>
          <p className="mt-1 text-sm text-zinc-500">Published sessions in the current Monday–Sunday week.</p>
        </div>
        <DistributionList rows={analytics.distribution} />
      </section>

      <section className="space-y-3">
        <div>
          <p className={eyebrowClass}>Benchmark history</p>
          <p className="mt-1 text-sm text-zinc-500">Stored results only. Missing tests stay empty.</p>
        </div>
        {analytics.benchmarks.length === 0 ? (
          <div className={`${athleteCard} ${athleteCardPadding}`}>
            <p className="text-sm leading-relaxed text-zinc-300">
              No benchmark history yet. Each logged result will appear as its own point — nothing is
              interpolated.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {analytics.benchmarks.map((series) => (
              <article key={series.type} className={`${athleteCard} ${athleteCardPadding}`}>
                <p className="text-sm font-semibold text-white">{series.label}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {series.points.length} measured point{series.points.length === 1 ? "" : "s"}
                </p>
                <BenchmarkSeriesChart points={series.points} />
                <ol className="mt-3 space-y-1.5">
                  {series.points.map((point) => (
                    <li
                      key={`${series.type}-${point.date}-${point.normalizedValue}-${point.status}`}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="text-zinc-400">{point.date}</span>
                      <span className="font-medium text-zinc-100">{point.display}</span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
