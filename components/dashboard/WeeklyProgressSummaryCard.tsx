"use client";

import type { DashboardWeekTrackingSummary } from "@/app/lib/dashboardWeekTracking";
import { buildWeeklyProgressNarrative } from "@/app/lib/dashboardWeekTracking";

type Props = {
  summary: DashboardWeekTrackingSummary;
  isHyroxTrack?: boolean;
  onLogSession?: () => void;
};

export function WeeklyProgressSummaryCard({ summary, isHyroxTrack, onLogSession }: Props) {
  const narrative = isHyroxTrack
    ? buildWeeklyProgressNarrative({
        completed: summary.sessions.completed,
        planned: summary.sessions.planned,
        remaining: Math.max(0, summary.sessions.planned - summary.sessions.completed),
        completionPct: summary.consistencyPct,
        isHyrox: true,
      })
    : summary.weeklyNarrative;

  const { sessions, runs, strength, aerobicRecovery, consistencyPct } = summary;

  if (!summary.hasProgrammePlan) {
    return (
      <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-yellow-400/90">
          This week so far
        </p>
        <p className="mt-3 text-sm text-zinc-400">
          Your weekly progress will appear here once your programme week is unlocked.
        </p>
      </section>
    );
  }

  const showEmpty = !summary.hasAnyTrackingActivity && sessions.completed === 0;

  return (
    <section className="mb-8 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-yellow-400/90">
            This week so far
          </p>
          <h3 className="mt-2 text-lg font-bold text-white sm:text-xl">{narrative.headline}</h3>
        </div>
        {consistencyPct != null && sessions.planned > 0 ? (
          <div className="rounded-xl border border-yellow-500/25 bg-yellow-400/10 px-3 py-2 text-center">
            <p className="text-2xl font-black text-yellow-300">{consistencyPct}%</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Complete</p>
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{narrative.body}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Sessions" value={`${sessions.completed}/${sessions.planned}`} />
        <Stat
          label="Runs"
          value={runs.planned > 0 ? `${runs.completed}/${runs.planned}` : "—"}
        />
        <Stat
          label="Strength"
          value={strength.planned > 0 ? `${strength.completed}/${strength.planned}` : "—"}
        />
        <Stat
          label="Aerobic"
          value={
            aerobicRecovery.planned > 0
              ? `${aerobicRecovery.completed}/${aerobicRecovery.planned}`
              : "—"
          }
        />
      </div>

      {(summary.partialCount > 0 || summary.skippedCount > 0) && (
        <p className="mt-4 text-xs text-zinc-500">
          {summary.partialCount > 0 ? `${summary.partialCount} partial` : ""}
          {summary.partialCount > 0 && summary.skippedCount > 0 ? " · " : ""}
          {summary.skippedCount > 0 ? `${summary.skippedCount} skipped` : ""}
        </p>
      )}

      {showEmpty && onLogSession ? (
        <button
          type="button"
          onClick={onLogSession}
          className="mt-5 w-full rounded-xl border border-yellow-500/30 bg-yellow-400/10 py-3 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-400/15"
        >
          Log your first session this week
        </button>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/60 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-base font-bold text-white">{value}</p>
    </div>
  );
}
