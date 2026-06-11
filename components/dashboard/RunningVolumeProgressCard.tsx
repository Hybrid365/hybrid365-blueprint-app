"use client";

import { useEffect, useMemo, useState } from "react";
import { Footprints } from "lucide-react";
import {
  buildRunningVolumeProgress,
  isCountableRunningVolumeLog,
  type RunningVolumeLog,
  type RunningVolumeView,
} from "@/app/lib/runningVolumeProgress";

type Props = {
  sessionLogs: RunningVolumeLog[];
  effectiveWeek: number;
  isHyroxTrack?: boolean;
};

const TABS: { id: RunningVolumeView; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "4weeks", label: "This month" },
  { id: "12weeks", label: "Last 3 months" },
];

const TAB_EMPTY_COPY: Record<RunningVolumeView, string> = {
  week: "No running distance logged this calendar week yet.",
  "4weeks": "No running distance logged in the last 4 weeks.",
  "12weeks": "No running distance logged in the last 12 weeks.",
};

function BarChart({ bars, maxKm }: { bars: { label: string; km: number }[]; maxKm: number }) {
  const scale = maxKm > 0 ? maxKm : 1;
  return (
    <div className="mt-6 flex items-end justify-between gap-1 sm:gap-2">
      {bars.map((bar) => {
        const pct = bar.km > 0 ? Math.max(8, (bar.km / scale) * 100) : 4;
        return (
          <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="text-[10px] font-semibold text-yellow-300/90 tabular-nums">
              {bar.km > 0 ? bar.km : ""}
            </span>
            <div className="flex h-24 w-full items-end sm:h-28">
              <div
                className={`w-full rounded-t-md transition-all ${
                  bar.km > 0
                    ? "bg-gradient-to-t from-yellow-500 to-yellow-400"
                    : "bg-zinc-800"
                }`}
                style={{ height: `${pct}%` }}
                title={bar.km > 0 ? `${bar.km} km` : "No runs"}
              />
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function RunningVolumeProgressCard({
  sessionLogs,
  effectiveWeek,
  isHyroxTrack = false,
}: Props) {
  const [view, setView] = useState<RunningVolumeView>("week");

  const countableLogs = useMemo(
    () => sessionLogs.filter(isCountableRunningVolumeLog),
    [sessionLogs]
  );

  const hasAnyDistanceLogs = countableLogs.length > 0;

  const progress = useMemo(
    () => buildRunningVolumeProgress(sessionLogs, { view, effectiveWeek }),
    [sessionLogs, view, effectiveWeek]
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.log("[RunningVolumeProgressCard]", {
      sessionLogsLength: sessionLogs.length,
      withDistance: sessionLogs.filter((l) => Number(l.distance_km) > 0).length,
      countable: countableLogs.length,
      view,
      progress: {
        hasData: progress.hasData,
        totalKm: progress.totalKm,
        runsLogged: progress.runsLogged,
        dailyKm: progress.dailyKm,
        weeklyKm: progress.weeklyKm,
      },
    });
  }, [sessionLogs, countableLogs, view, progress]);

  const chartBars = progress.dailyKm ?? progress.weeklyKm ?? [];
  const maxKm = chartBars.reduce((m, b) => Math.max(m, b.km), 0);

  const subtitle = isHyroxTrack
    ? "Weekly run volume helps build the engine for stronger running between stations."
    : "Keep building consistency across your weekly running volume.";

  return (
    <section className="rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400/12 ring-1 ring-yellow-400/20">
            <Footprints className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Running volume progress</h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/80 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                view === tab.id
                  ? "bg-yellow-400 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {!hasAnyDistanceLogs ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-zinc-300">
            Log your run distance after each session to build your running volume graph.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Open a session log and add distance in KM.
          </p>
        </div>
      ) : !progress.hasData ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-zinc-300">{TAB_EMPTY_COPY[view]}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Try another time range, or log distance on a session completed this period.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total KM" value={`${progress.totalKm} km`} highlight />
            <Stat label="Runs logged" value={String(progress.runsLogged)} />
            <Stat label="Longest run" value={`${progress.longestRunKm} km`} />
            {progress.averagePace ? (
              <Stat label="Latest pace" value={progress.averagePace} />
            ) : view !== "week" && progress.averageWeeklyKm != null ? (
              <Stat label="Avg weekly KM" value={`${progress.averageWeeklyKm} km`} />
            ) : progress.calendarWeekLabel ? (
              <Stat label="Calendar week" value={progress.calendarWeekLabel} />
            ) : null}
          </div>

          {view !== "week" && progress.highestWeekKm != null && progress.highestWeekKm > 0 ? (
            <p className="mt-4 text-xs text-zinc-500">
              Highest week:{" "}
              <span className="font-semibold text-zinc-300">{progress.highestWeekKm} km</span>
              {progress.averageWeeklyKm != null ? (
                <>
                  {" "}
                  · Avg{" "}
                  <span className="font-semibold text-zinc-300">{progress.averageWeeklyKm} km</span>{" "}
                  / week
                </>
              ) : null}
            </p>
          ) : null}

          <BarChart bars={chartBars} maxKm={maxKm} />
        </>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? "border-yellow-500/25 bg-yellow-400/5" : "border-zinc-800 bg-zinc-950/50"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${highlight ? "text-yellow-300" : "text-white"}`}>
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-[10px] text-zinc-600">{sub}</p> : null}
    </div>
  );
}
