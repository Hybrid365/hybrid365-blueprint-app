"use client";

import type { HyroxDailyReadinessRow } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import type { PerformanceHubPayload } from "@/app/lib/hyrox-team/modules/performanceHub/types";
import { ReadinessRing } from "../today/ReadinessRing";
import { athleteCard, athleteCardPadding, eyebrowClass } from "../athleteUi";
import { AnimatedProgressBar, CountUp } from "./motion";

function Sparkline({ values }: { values: Array<number | null> }) {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (nums.length < 2) return null;
  const w = 72;
  const h = 28;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 1;
  const pts = nums
    .map((v, i) => {
      const x = (i / (nums.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="text-yellow-400/80" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  );
}

type Props = {
  readiness: HyroxDailyReadinessRow | null;
  todayV2Enabled: boolean;
  weeklyCompletionPct: number;
  sessionsCompleted: number;
  sessionsPlanned: number;
  hub: PerformanceHubPayload | null;
  hubLoading: boolean;
  performanceHubEnabled: boolean;
};

export function HomePerformanceStatus({
  readiness,
  todayV2Enabled,
  weeklyCompletionPct,
  sessionsCompleted,
  sessionsPlanned,
  hub,
  hubLoading,
  performanceHubEnabled,
}: Props) {
  const submitted = Boolean(readiness?.submitted_at);
  const category = readiness?.category ?? null;
  const label =
    category === "green"
      ? "Ready"
      : category === "red"
        ? "Recovery priority"
        : category === "amber"
          ? "Manage load"
          : "Not submitted";

  const trendScores =
    hub?.weeklySeries?.slice(-7).map((p) => p.readinessAvg) ??
    (submitted && readiness?.score != null ? [readiness.score] : []);

  const trainingHours = hub?.summary.find((m) => m.key === "training_hours");
  const runDistance = hub?.summary.find((m) => m.key === "run_distance_km");
  const avgRpe = hub?.summary.find((m) => m.key === "avg_rpe");
  const plannedVsCompleted = hub?.plannedVsCompleted.find(
    (c) => c.key === "training_minutes" || c.key === "session_completion"
  );

  const illnessAlert = Boolean(readiness?.feeling_unwell);
  const highSoreness = (readiness?.muscle_soreness ?? 0) >= 8;

  return (
    <section
      className={`${athleteCard} ${athleteCardPadding} lg:col-span-7`}
      aria-label="Performance status"
    >
      <p className={eyebrowClass}>Performance status</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {todayV2Enabled ? (
          <div className="flex items-center gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
            <ReadinessRing
              score={submitted ? readiness?.score ?? null : null}
              category={category}
              label={label}
              size={88}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-400">Today&apos;s readiness</p>
              {submitted && readiness?.explanation ? (
                <p className="mt-1 line-clamp-2 text-xs text-zinc-300">{readiness.explanation}</p>
              ) : (
                <p className="mt-1 text-xs text-zinc-500">Submit morning readiness to unlock your indicator.</p>
              )}
              {trendScores.length >= 2 ? (
                <div className="mt-2">
                  <p className="text-[10px] text-zinc-600">7-day trend</p>
                  <Sparkline values={trendScores} />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Weekly sessions
          </p>
          <p className="mt-1 text-2xl font-bold text-yellow-400">
            <CountUp value={weeklyCompletionPct} suffix="%" />
          </p>
          <p className="text-xs text-zinc-500">
            {sessionsCompleted}/{sessionsPlanned} complete
          </p>
          <div className="mt-2">
            <AnimatedProgressBar value={weeklyCompletionPct} />
          </div>
        </div>

        {performanceHubEnabled && !hubLoading && hub ? (
          <>
            {trainingHours?.value != null ? (
              <MetricTile label="Training hours" value={trainingHours.display} unit={trainingHours.unit} />
            ) : null}
            {runDistance?.value != null ? (
              <MetricTile label="Running" value={runDistance.display} unit={runDistance.unit} />
            ) : null}
            {avgRpe?.value != null ? (
              <MetricTile label="Average RPE" value={avgRpe.display} unit={avgRpe.unit} />
            ) : null}
            {plannedVsCompleted && plannedVsCompleted.pct != null ? (
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  {plannedVsCompleted.label}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-200">
                  {plannedVsCompleted.completed ?? "—"} / {plannedVsCompleted.planned ?? "—"}{" "}
                  {plannedVsCompleted.unit}
                </p>
                <div className="mt-2">
                  <AnimatedProgressBar value={plannedVsCompleted.pct} />
                </div>
              </div>
            ) : null}
          </>
        ) : hubLoading ? (
          <p className="text-xs text-zinc-500 sm:col-span-2">Loading performance data…</p>
        ) : !performanceHubEnabled ? null : (
          <p className="text-xs text-zinc-500 sm:col-span-2">
            More performance data will appear as sessions are logged.
          </p>
        )}

        {illnessAlert || highSoreness ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 sm:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-300">Recovery alert</p>
            <p className="mt-1 text-xs text-amber-100/90">
              {illnessAlert
                ? "Illness flagged in today's readiness — your coach can see this."
                : "High muscle soreness reported — manage load today."}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">
        {value}
        {unit ? <span className="ml-0.5 text-sm font-medium text-zinc-400">{unit}</span> : null}
      </p>
    </div>
  );
}
