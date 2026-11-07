"use client";

import { useMemo, useState } from "react";
import type {
  HyroxAthleteAnalytics,
  HyroxAnalyticsModality,
  HyroxAnalyticsWeekSummary,
} from "@/app/lib/hyroxAthleteAnalytics";
import {
  FadeIn,
  MotionEnter,
  visualCard,
  visualCardPad,
  visualEyebrow,
  visualMeta,
  visualNumber,
} from "@/components/athlete-command-centre/visual";
import { ModalityBar } from "@/components/athlete-command-centre/visual/concepts/viz";
import { ProgressBenchmarkChart } from "./ProgressBenchmarkChart";
import {
  PROGRESS_PERIODS,
  computeBenchmarkDelta,
  deriveMilestones,
  filterSeriesByPeriod,
  formatKm,
  formatMinutes,
  formatPct,
  formatPointDate,
  pickPrimarySeries,
  type ProgressPeriod,
} from "./progressMath";

const MODALITY_LABEL: Record<HyroxAnalyticsModality, string> = {
  run: "Run",
  bike: "Bike",
  skierg: "Ski",
  rowerg: "Row",
  strength: "Strength",
  hyrox_specific: "HYROX",
  other: "Other",
};

export function ProgressExperience({ analytics }: { analytics: HyroxAthleteAnalytics }) {
  const asOfYmd = analytics.asOf.slice(0, 10);
  const [period, setPeriod] = useState<ProgressPeriod>("all");

  const periodSeries = useMemo(
    () => analytics.benchmarks.map((series) => filterSeriesByPeriod(series, period, asOfYmd)),
    [analytics.benchmarks, period, asOfYmd]
  );

  const selectable = periodSeries.filter((series) => series.points.length > 0);
  const primary = pickPrimarySeries(selectable);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const selected =
    selectable.find((series) => series.type === selectedType) ?? primary ?? null;
  const delta = selected ? computeBenchmarkDelta(selected) : null;
  const milestones = deriveMilestones(periodSeries);

  const hasBenchmarkHistory = analytics.benchmarks.length > 0;
  const hasWeekSignal =
    analytics.currentWeek.plannedSessions > 0 || (analytics.previousWeek?.plannedSessions ?? 0) > 0;
  const modalitySlices = analytics.distribution
    .map((row) => ({
      label: MODALITY_LABEL[row.modality],
      minutes: row.durationMinutes ?? 0,
      sessionCount: row.sessionCount,
      hasDuration: row.durationMinutes != null,
    }))
    .filter((row) => row.sessionCount > 0);
  const modalityWithDuration = modalitySlices.filter((row) => row.hasDuration && row.minutes > 0);

  const completionDelta = weekCompletionDelta(analytics.currentWeek, analytics.previousWeek);
  const periodLabel = PROGRESS_PERIODS.find((row) => row.id === period)?.label ?? "All";

  return (
    <div className="space-y-10" data-h365-progress-experience="">
      <MotionEnter>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={visualEyebrow}>Now · are you getting better?</p>
            <p className={`mt-2 ${visualMeta}`}>
              {hasBenchmarkHistory
                ? `Benchmark history · ${periodLabel}`
                : hasWeekSignal
                  ? "Training execution this week vs last"
                  : "Progress appears from stored sessions and approved benchmarks"}
            </p>
          </div>
          {hasBenchmarkHistory ? (
            <PeriodFilter value={period} onChange={setPeriod} />
          ) : null}
        </div>
      </MotionEnter>

      <MotionEnter>
        <section className={`${visualCard} ${visualCardPad}`}>
          {!selected || !delta ? (
            <SparseHero
              hasWeekSignal={hasWeekSignal}
              current={analytics.currentWeek}
              previous={analytics.previousWeek}
              completionDelta={completionDelta}
            />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <div>
                <p className="text-xs text-zinc-400">{selected.label}</p>
                <p className={`mt-2 ${visualNumber}`}>{delta.latest.display}</p>
                <div className="mt-3 space-y-1">
                  {delta.previous ? (
                    <>
                      <p className="text-sm text-zinc-300">
                        {delta.absoluteLabel ? (
                          <>
                            <span className="font-semibold tabular-nums text-white">
                              {delta.absoluteLabel}
                            </span>
                            <span className="text-zinc-400"> vs previous mark</span>
                          </>
                        ) : (
                          <span className="text-zinc-400">Same as previous mark</span>
                        )}
                      </p>
                      {delta.percentLabel ? (
                        <p className={visualMeta}>{delta.percentLabel}</p>
                      ) : null}
                      <p className={visualMeta}>
                        Previous {delta.previous.display} · {formatPointDate(delta.previous.date)}
                      </p>
                    </>
                  ) : (
                    <p className={visualMeta}>
                      First stored mark · {formatPointDate(delta.latest.date)}
                    </p>
                  )}
                  <p className={visualMeta}>{delta.dateRangeLabel}</p>
                </div>

                {selectable.length > 1 ? (
                  <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Benchmark metrics">
                    {selectable.map((series) => {
                      const active = series.type === selected.type;
                      return (
                        <button
                          key={series.type}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setSelectedType(series.type)}
                          className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                            active
                              ? "border-yellow-400/60 bg-yellow-400/10 text-yellow-300"
                              : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                          }`}
                        >
                          {series.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <FadeIn key={`${selected.type}-${period}`}>
                <ProgressBenchmarkChart
                  label={selected.label}
                  type={selected.type}
                  points={selected.points}
                  empty="No measured points in this window."
                />
              </FadeIn>
            </div>
          )}
        </section>
      </MotionEnter>

      {milestones.length > 0 ? (
        <MotionEnter>
          <section>
            <p className={visualEyebrow}>Milestones</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {milestones.map((item) => (
                <li key={item.id} className={`${visualCard} ${visualCardPad}`}>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className={`mt-1 ${visualMeta}`}>{item.meta}</p>
                </li>
              ))}
            </ul>
          </section>
        </MotionEnter>
      ) : null}

      <MotionEnter>
        <section className="border-t border-zinc-800 pt-8">
          <p className={visualEyebrow}>This week vs last</p>
          <p className={`mt-1 ${visualMeta}`}>
            Planned sessions from published programme · actual from logged completion
          </p>
          {!hasWeekSignal ? (
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              No published sessions in the current or previous Monday–Sunday window yet.
            </p>
          ) : (
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <WeekPanel title="This week" week={analytics.currentWeek} />
              <WeekPanel
                title="Previous week"
                week={analytics.previousWeek}
                empty="No published sessions in the previous Monday–Sunday window."
              />
            </div>
          )}
          {completionDelta ? (
            <p className={`mt-4 ${visualMeta}`}>{completionDelta}</p>
          ) : null}
        </section>
      </MotionEnter>

      <MotionEnter>
        <section className="border-t border-zinc-800 pt-8">
          <p className={visualEyebrow}>Training volume · last 4 weeks</p>
          <p className={`mt-1 ${visualMeta}`}>
            Rolling totals only · incomplete current week is not filled in
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Run distance" value={formatKm(analytics.rolling4.runDistanceKm)} sub="Logged run distance" />
            <Stat
              label="Duration"
              value={formatMinutes(analytics.rolling4.trainingDurationMinutes)}
              sub="Logged duration (actual)"
            />
            <Stat label="Completion" value={formatPct(analytics.rolling4.completionPct)} sub="Completed of planned" />
            <Stat
              label="Average RPE"
              value={analytics.rolling4.averageRpe == null ? "—" : String(analytics.rolling4.averageRpe)}
              sub={analytics.rolling4.averageRpe == null ? "No logged RPE" : "Mean of logged RPE"}
            />
          </dl>
          {analytics.rolling4.runDistanceKm == null &&
          analytics.rolling4.trainingDurationMinutes == null ? (
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Volume trends need logged run distance or session duration on completed sessions.
            </p>
          ) : null}
        </section>
      </MotionEnter>

      <MotionEnter>
        <section className="border-t border-zinc-800 pt-8">
          <p className={visualEyebrow}>Modality · this week</p>
          <p className={`mt-1 ${visualMeta}`}>
            Published sessions in the current Monday–Sunday window up to today
          </p>
          {modalitySlices.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              No published sessions this week up to today, so there is no modality mix to show.
            </p>
          ) : modalityWithDuration.length > 0 ? (
            <div className="mt-5 max-w-xl">
              <ModalityBar
                slices={modalityWithDuration.map((row) => ({
                  label: row.label,
                  minutes: row.minutes,
                }))}
              />
            </div>
          ) : (
            <ul className="mt-5 space-y-2">
              {modalitySlices.map((row) => (
                <li key={row.label} className="flex justify-between text-sm text-zinc-300">
                  <span>{row.label}</span>
                  <span className="tabular-nums text-zinc-200">
                    {row.sessionCount} session{row.sessionCount === 1 ? "" : "s"}
                    <span className="ml-2 text-xs text-zinc-500">duration not logged</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </MotionEnter>
    </div>
  );
}

function PeriodFilter({
  value,
  onChange,
}: {
  value: ProgressPeriod;
  onChange: (next: ProgressPeriod) => void;
}) {
  return (
    <div
      className="flex flex-wrap gap-1 rounded-xl border border-zinc-800 bg-zinc-950/80 p-1"
      role="group"
      aria-label="Benchmark period"
    >
      {PROGRESS_PERIODS.map((row) => {
        const active = row.id === value;
        return (
          <button
            key={row.id}
            type="button"
            onClick={() => onChange(row.id)}
            className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors ${
              active ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {row.label}
          </button>
        );
      })}
    </div>
  );
}

function SparseHero({
  hasWeekSignal,
  current,
  previous,
  completionDelta,
}: {
  hasWeekSignal: boolean;
  current: HyroxAnalyticsWeekSummary;
  previous: HyroxAnalyticsWeekSummary | null;
  completionDelta: string | null;
}) {
  if (!hasWeekSignal) {
    return (
      <div>
        <p className={visualEyebrow}>No logged progress yet</p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
          Progress appears from stored session logs and approved benchmarks. Missing weeks stay
          empty — nothing is invented to fill the chart.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <p className="text-xs text-zinc-400">This week · completion</p>
        <p className={`mt-2 ${visualNumber}`}>
          {current.completionPct == null ? "—" : `${current.completionPct}%`}
        </p>
        <p className={`mt-2 ${visualMeta}`}>
          {current.plannedSessions === 0
            ? "No published sessions this week"
            : `${current.completedSessions} of ${current.plannedSessions} sessions`}
        </p>
        {completionDelta ? <p className={`mt-2 ${visualMeta}`}>{completionDelta}</p> : null}
      </div>
      <div>
        <p className="text-xs text-zinc-400">Key sessions</p>
        <p className={`mt-2 ${visualNumber}`}>
          {current.keySessionsCompleted}/{current.keySessionsPlanned}
        </p>
        <p className={`mt-2 ${visualMeta}`}>
          {previous
            ? `Last week ${previous.keySessionsCompleted}/${previous.keySessionsPlanned}`
            : "No previous week"}
        </p>
        <p className={`mt-4 ${visualMeta}`}>
          Log another approved benchmark to unlock longitudinal progression.
        </p>
      </div>
    </div>
  );
}

function WeekPanel({
  title,
  week,
  empty,
}: {
  title: string;
  week: HyroxAnalyticsWeekSummary | null;
  empty?: string;
}) {
  if (!week || week.plannedSessions === 0) {
    return (
      <div className={`${visualCard} ${visualCardPad}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{title}</p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          {empty ?? "No published sessions in this window."}
        </p>
      </div>
    );
  }

  return (
    <div className={`${visualCard} ${visualCardPad}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{title}</p>
      <p className={`mt-1 ${visualMeta}`}>
        {formatDateRange(week.startDate, week.endDate)}
        {week.complete ? "" : " · In progress"}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Completion" value={formatPct(week.completionPct)} sub={`${week.completedSessions}/${week.plannedSessions} sessions`} />
        <Stat label="Run" value={formatKm(week.runDistanceKm)} sub={week.runDistanceKm == null ? "Not logged" : "Actual"} />
        <Stat
          label="Duration"
          value={formatMinutes(week.trainingDurationMinutes)}
          sub={week.trainingDurationMinutes == null ? "Not logged" : "Actual"}
        />
        <Stat
          label="Key"
          value={`${week.keySessionsCompleted}/${week.keySessionsPlanned}`}
          sub="Key sessions"
        />
      </dl>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">{label}</dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums text-white">{value}</dd>
      <dd className={`mt-1 ${visualMeta}`}>{sub}</dd>
    </div>
  );
}

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const a = new Date(`${start}T12:00:00`).toLocaleDateString("en-GB", opts);
  const b = new Date(`${end}T12:00:00`).toLocaleDateString("en-GB", opts);
  return `${a} – ${b}`;
}

function weekCompletionDelta(
  current: HyroxAnalyticsWeekSummary,
  previous: HyroxAnalyticsWeekSummary | null
): string | null {
  if (current.completionPct == null || previous?.completionPct == null) return null;
  const delta = current.completionPct - previous.completionPct;
  if (delta === 0) return "Same completion as last week";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta} pts vs previous week`;
}
