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
import { ModalityMix } from "./ModalityMix";
import { ProgressBenchmarkChart } from "./ProgressBenchmarkChart";
import { WeekCompareBars } from "./WeekCompareBars";
import {
  PROGRESS_PERIODS,
  buildWeekCompareRows,
  computeBenchmarkDelta,
  deriveMilestones,
  filterSeriesByPeriod,
  formatKm,
  formatMinutes,
  formatPct,
  formatPointDate,
  pickBestImprovement,
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
  const bestImprovement = pickBestImprovement(periodSeries);
  const milestones = deriveMilestones(periodSeries);
  const weekRows = buildWeekCompareRows(analytics.currentWeek, analytics.previousWeek);

  const hasBenchmarkHistory = analytics.benchmarks.length > 0;
  const hasWeekSignal =
    analytics.currentWeek.plannedSessions > 0 || (analytics.previousWeek?.plannedSessions ?? 0) > 0;
  const modalitySlices = analytics.distribution
    .map((row) => ({
      label: MODALITY_LABEL[row.modality],
      minutes: row.durationMinutes,
      sessionCount: row.sessionCount,
    }))
    .filter((row) => row.sessionCount > 0);

  const periodLabel = PROGRESS_PERIODS.find((row) => row.id === period)?.label ?? "All";
  const isRegression = delta?.previous != null && delta.improved === false;
  const isImprovement = delta?.previous != null && delta.improved === true;
  const showBestElsewhere =
    bestImprovement != null &&
    selected != null &&
    bestImprovement.type !== selected.type;
  const milestoneInSideCard = !showBestElsewhere ? milestones[0] ?? null : null;
  const remainingMilestones = milestoneInSideCard ? milestones.slice(1) : milestones;

  return (
    <div className="space-y-8 lg:space-y-9" data-h365-progress-experience="">
      <MotionEnter>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={visualEyebrow}>Now · are you getting better?</p>
            <p className={`mt-1.5 ${visualMeta}`}>
              {hasBenchmarkHistory
                ? `Benchmark window · ${periodLabel}`
                : hasWeekSignal
                  ? "Training execution this week vs last"
                  : "Stored sessions and approved benchmarks only"}
            </p>
          </div>
          {hasBenchmarkHistory ? (
            <div className="space-y-1.5 sm:text-right">
              <PeriodFilter value={period} onChange={setPeriod} />
              <p className="text-[10px] tracking-wide text-zinc-600">Filters benchmark history only</p>
            </div>
          ) : null}
        </div>
      </MotionEnter>

      <MotionEnter>
        <section className={`${visualCard} ${visualCardPad}`}>
          {!selected || !delta ? (
            <SparseHero hasWeekSignal={hasWeekSignal} current={analytics.currentWeek} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)] lg:gap-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  {isRegression
                    ? "Latest result"
                    : isImprovement
                      ? "Latest mark"
                      : delta.previous
                        ? "Latest mark"
                        : "First stored mark"}
                </p>
                <p className="mt-1 text-xs text-zinc-400">{selected.label}</p>
                <p className={`mt-2 ${visualNumber}`}>{delta.latest.display}</p>

                <div className="mt-3 space-y-1.5">
                  {delta.previous ? (
                    <>
                      <p className="text-sm text-zinc-300">
                        {delta.absoluteLabel ? (
                          <>
                            <span
                              className={`font-semibold tabular-nums ${
                                isRegression ? "text-zinc-200" : "text-white"
                              }`}
                            >
                              {delta.absoluteLabel}
                            </span>
                            <span className="text-zinc-500">
                              {isRegression
                                ? " vs previous mark"
                                : isImprovement
                                  ? " vs previous mark"
                                  : " vs previous mark"}
                            </span>
                          </>
                        ) : (
                          <span className="text-zinc-500">Same as previous mark</span>
                        )}
                      </p>
                      {isRegression ? (
                        <p className={visualMeta}>
                          Below previous mark — shown as recorded, not softened.
                        </p>
                      ) : null}
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
                  <div
                    className="mt-5 flex flex-wrap gap-1.5"
                    role="tablist"
                    aria-label="Benchmark metrics"
                  >
                    {selectable.map((series) => {
                      const active = series.type === selected.type;
                      return (
                        <button
                          key={series.type}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setSelectedType(series.type)}
                          className={`min-h-9 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                            active
                              ? "border-yellow-400/55 bg-yellow-400/10 text-yellow-300"
                              : "border-zinc-800/90 bg-zinc-950/80 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
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
                  empty="No measured points in this benchmark window."
                />
              </FadeIn>
            </div>
          )}
        </section>
      </MotionEnter>

      {(showBestElsewhere || weekRows.length > 0 || hasWeekSignal) && (
        <MotionEnter>
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
            {showBestElsewhere && bestImprovement ? (
              <aside className={`${visualCard} ${visualCardPad}`} data-h365-best-improvement="">
                <p className={visualEyebrow}>Best recent improvement</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-white">
                  {bestImprovement.headline}
                </p>
                <p className={`mt-1.5 ${visualMeta}`}>{bestImprovement.meta}</p>
                <button
                  type="button"
                  className="mt-4 text-xs font-semibold text-yellow-400/90 hover:text-yellow-300"
                  onClick={() => setSelectedType(bestImprovement.type)}
                >
                  View {bestImprovement.label} →
                </button>
              </aside>
            ) : milestoneInSideCard ? (
              <aside className={`${visualCard} ${visualCardPad}`}>
                <p className={visualEyebrow}>Milestone</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-white">
                  {milestoneInSideCard.label}
                </p>
                <p className={`mt-1.5 ${visualMeta}`}>{milestoneInSideCard.meta}</p>
              </aside>
            ) : (
              <aside className={`${visualCard} ${visualCardPad}`}>
                <p className={visualEyebrow}>Recent improvement</p>
                <div className="mt-3 h-px w-16 bg-zinc-800" />
                <p className={`mt-3 max-w-sm text-sm leading-relaxed text-zinc-400`}>
                  No latest-vs-previous improvement in this benchmark window. Regressions stay
                  visible on the selected metric.
                </p>
              </aside>
            )}

            <aside className={`${visualCard} ${visualCardPad}`}>
              <p className={visualEyebrow}>This week vs last</p>
              <p className={`mt-1 ${visualMeta}`}>Two real Monday–Sunday windows only</p>
              <div className="mt-4">
                {weekRows.length > 0 ? (
                  <WeekCompareBars rows={weekRows} />
                ) : (
                  <CurrentWeekSparse
                    current={analytics.currentWeek}
                    previous={analytics.previousWeek}
                  />
                )}
              </div>
            </aside>
          </div>
        </MotionEnter>
      )}

      {remainingMilestones.length > 0 ? (
        <MotionEnter>
          <section>
            <p className={visualEyebrow}>Milestones</p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {remainingMilestones.map((item) => (
                <li key={item.id} className={`${visualCard} px-4 py-4`}>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className={`mt-1 ${visualMeta}`}>{item.meta}</p>
                </li>
              ))}
            </ul>
          </section>
        </MotionEnter>
      ) : null}

      <MotionEnter>
        <section className="border-t border-zinc-800 pt-7">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className={visualEyebrow}>Training volume · last 4 weeks</p>
              <p className={`mt-1 ${visualMeta}`}>
                Rolling totals · incomplete current week is not filled in
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <Stat
                  label="Run distance"
                  value={formatKm(analytics.rolling4.runDistanceKm)}
                  sub="Logged run distance"
                />
                <Stat
                  label="Duration"
                  value={formatMinutes(analytics.rolling4.trainingDurationMinutes)}
                  sub="Logged duration (actual)"
                />
                <Stat
                  label="Completion"
                  value={formatPct(analytics.rolling4.completionPct)}
                  sub="Completed of planned"
                />
                <Stat
                  label="Average RPE"
                  value={
                    analytics.rolling4.averageRpe == null
                      ? "—"
                      : String(analytics.rolling4.averageRpe)
                  }
                  sub={
                    analytics.rolling4.averageRpe == null ? "No logged RPE" : "Mean of logged RPE"
                  }
                />
              </dl>
              {analytics.rolling4.runDistanceKm == null &&
              analytics.rolling4.trainingDurationMinutes == null ? (
                <div className="mt-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-3">
                  <p className={`text-sm text-zinc-400`}>
                    Volume needs logged run distance or session duration. Completion and RPE still
                    report when present.
                  </p>
                </div>
              ) : null}
            </div>

            <div>
              <p className={visualEyebrow}>Modality · this week</p>
              <p className={`mt-1 ${visualMeta}`}>
                Published sessions in the current Monday–Sunday window up to today
              </p>
              <div className="mt-4">
                <ModalityMix slices={modalitySlices} />
              </div>
            </div>
          </div>
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
      className="inline-flex flex-wrap gap-0.5 rounded-lg border border-zinc-800 bg-zinc-950 p-0.5"
      role="group"
      aria-label="Benchmark history window"
    >
      {PROGRESS_PERIODS.map((row) => {
        const active = row.id === value;
        return (
          <button
            key={row.id}
            type="button"
            onClick={() => onChange(row.id)}
            className={`min-h-8 rounded-md px-2.5 text-[11px] font-semibold transition-colors ${
              active
                ? "bg-zinc-800 text-white shadow-sm shadow-black/40"
                : "text-zinc-500 hover:text-zinc-300"
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
}: {
  hasWeekSignal: boolean;
  current: HyroxAnalyticsWeekSummary;
}) {
  if (!hasWeekSignal) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-6 sm:px-5">
        <div className="flex items-end gap-2">
          {[18, 28, 22, 36, 24, 40].map((h, i) => (
            <div
              key={i}
              className="w-4 rounded-sm bg-zinc-900 sm:w-5"
              style={{ height: h }}
            />
          ))}
        </div>
        <p className={`mt-4 ${visualEyebrow}`}>No logged progress yet</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
          Progress appears from stored session logs and approved benchmarks. Missing weeks stay
          empty — nothing is invented to fill the chart.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
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
      </div>
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-4">
        <p className={visualEyebrow}>Benchmarks</p>
        <p className={`mt-2 text-sm leading-relaxed text-zinc-400`}>
          Log an approved benchmark to unlock longitudinal progression on this page.
        </p>
      </div>
    </div>
  );
}

function CurrentWeekSparse({
  current,
  previous,
}: {
  current: HyroxAnalyticsWeekSummary;
  previous: HyroxAnalyticsWeekSummary | null;
}) {
  const prevEmpty = !previous || previous.plannedSessions <= 0;
  return (
    <div>
      <WeekCompareBars
        rows={[]}
        empty={
          prevEmpty
            ? "Previous Monday–Sunday window has no published sessions — comparison waits for two real weeks."
            : "Not enough overlapping metrics to compare yet."
        }
      />
      {current.plannedSessions > 0 ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800/80 pt-4">
          <Stat
            label="This week"
            value={formatPct(current.completionPct)}
            sub={`${current.completedSessions}/${current.plannedSessions} sessions`}
          />
          <Stat
            label="Key"
            value={`${current.keySessionsCompleted}/${current.keySessionsPlanned}`}
            sub="Key sessions"
          />
        </dl>
      ) : null}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">{label}</dt>
      <dd className="mt-1 text-xl font-bold tabular-nums text-white sm:text-2xl">{value}</dd>
      <dd className={`mt-1 ${visualMeta}`}>{sub}</dd>
    </div>
  );
}
