"use client";

import {
  Activity,
  ClipboardCheck,
  Dumbbell,
  Footprints,
  Target,
  Zap,
} from "lucide-react";
import { MOCK_BENCHMARK_SNAPSHOT, MOCK_PROGRESS_STATS, MOCK_THIS_WEEK_TRACKING } from "@/app/lib/hyroxTeamDashboardMock";
import { BenchmarkSnapshotStrip } from "@/components/dashboard/BenchmarkSnapshotStrip";

function StatCell({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-zinc-800/90 bg-zinc-950/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-zinc-400">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      </div>
      <p className="break-words text-lg font-bold leading-tight text-white sm:text-xl">{value}</p>
      {sub ? <p className="mt-1 text-[11px] leading-snug text-zinc-500">{sub}</p> : null}
    </div>
  );
}

type Props = {
  onCompleteCheckIn?: () => void;
};

export function HyroxThisWeekTrackingCard({ onCompleteCheckIn }: Props) {
  const t = MOCK_THIS_WEEK_TRACKING;
  const stats = MOCK_PROGRESS_STATS;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black shadow-xl shadow-black/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(250,204,21,0.1),transparent)]" />
      <div className="relative p-5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">This week</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
          Hyrox command centre — track the work.
        </h2>
        <p className="mt-4 text-sm font-medium text-zinc-300">{t.consistencyLabel}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
          <StatCell
            icon={<Activity className="h-4 w-4 shrink-0 text-yellow-400" />}
            label="Sessions"
            value={`${t.sessions.completed} / ${t.sessions.planned}`}
            sub="Programme week"
          />
          <StatCell
            icon={<Footprints className="h-4 w-4 shrink-0 text-blue-400" />}
            label="Runs"
            value={`${t.runs.completed} / ${t.runs.planned}`}
            sub={`${stats.weeklyRunKm} km · target ${stats.weeklyRunKmPlanned} km`}
          />
          <StatCell
            icon={<Dumbbell className="h-4 w-4 shrink-0 text-red-400" />}
            label="Strength"
            value={`${t.strength.completed} / ${t.strength.planned}`}
          />
          <StatCell
            icon={<Zap className="h-4 w-4 shrink-0 text-purple-400" />}
            label="Hybrid"
            value={`${t.hybrid.completed} / ${t.hybrid.planned}`}
            sub="Key Hyrox session"
          />
          <StatCell
            icon={<ClipboardCheck className="h-4 w-4 shrink-0 text-emerald-400" />}
            label="Check-in"
            value={t.checkInComplete ? "Complete" : "Due"}
            sub={t.checkInComplete ? "Coach reviewed" : "Due Sunday"}
          />
          <StatCell
            icon={<Target className="h-4 w-4 shrink-0 text-amber-400" />}
            label="Completion"
            value={`${stats.weeklyCompletionPct}%`}
            sub={`${stats.modifiedSessions} modified · ${stats.missedSessions} missed`}
          />
        </div>

        {!t.checkInComplete && onCompleteCheckIn ? (
          <button
            type="button"
            onClick={onCompleteCheckIn}
            className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-yellow-500/35 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-100 transition hover:bg-yellow-400/15 sm:w-auto"
          >
            Complete weekly check-in
          </button>
        ) : null}

        <div className="mt-8 border-t border-zinc-800/80 pt-6">
          <BenchmarkSnapshotStrip items={MOCK_BENCHMARK_SNAPSHOT} compact />
        </div>
      </div>
    </section>
  );
}
