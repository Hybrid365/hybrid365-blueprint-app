import {
  Activity,
  ClipboardCheck,
  Dumbbell,
  Footprints,
  ListChecks,
  Target,
  Trophy,
} from "lucide-react";
import { HABIT_TOTAL } from "@/app/lib/dailyHabitLogs";
import type { DashboardWeekTrackingSummary } from "@/app/lib/dashboardWeekTracking";
import { BenchmarkSnapshotStrip } from "@/components/dashboard/BenchmarkSnapshotStrip";

type Props = {
  summary: DashboardWeekTrackingSummary;
  onCompleteCheckIn?: () => void;
};

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

function runVolumeSub(summary: DashboardWeekTrackingSummary): string | undefined {
  const rv = summary.runVolume;
  const { runs } = summary;
  if (rv.hasPerSessionKmMetadata && rv.completedRunKm != null) {
    return `Completed ${rv.completedRunKm} km this week`;
  }
  if (rv.hasPlannedKmEstimate && rv.plannedKmMin != null && rv.plannedKmMax != null) {
    return `Week target ~${rv.plannedKmMin}–${rv.plannedKmMax} km`;
  }
  if (
    !rv.hasPerSessionKmMetadata &&
    !rv.hasPlannedKmEstimate &&
    runs.planned > 0
  ) {
    return "Accurate mileage needs estimated_run_km on sessions from programme generation.";
  }
  return undefined;
}

export function ThisWeekTrackingCard({ summary, onCompleteCheckIn }: Props) {
  const { sessions, runs, strength, habit, challenge } = summary;
  const showEmpty =
    !summary.hasAnyTrackingActivity && !summary.hasProgrammePlan;

  const sessionsValue =
    summary.hasProgrammePlan && sessions.planned > 0
      ? `${sessions.completed} / ${sessions.planned}`
      : summary.hasProgrammePlan
        ? "0 planned"
        : "—";

  const runsValue =
    summary.hasProgrammePlan && runs.planned > 0
      ? `${runs.completed} / ${runs.planned}`
      : summary.hasProgrammePlan
        ? "—"
        : "—";

  const strengthValue =
    summary.hasProgrammePlan && strength.planned > 0
      ? `${strength.completed} / ${strength.planned}`
      : summary.hasProgrammePlan
        ? "—"
        : "—";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black shadow-xl shadow-black/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(250,204,21,0.1),transparent)]" />
      <div className="relative p-5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">This week</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
          Track the work. Stack the proof.
        </h2>

        {showEmpty ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Your tracking dashboard builds as you complete sessions, log habits and submit check-ins.
          </p>
        ) : null}

        <p className="mt-4 text-sm font-medium text-zinc-300">{summary.consistencyLabel}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
          <StatCell
            icon={<Activity className="h-4 w-4 shrink-0 text-yellow-400" />}
            label="Sessions"
            value={sessionsValue}
            sub="Programme week"
          />
          <StatCell
            icon={<Footprints className="h-4 w-4 shrink-0 text-blue-400" />}
            label="Runs"
            value={runsValue}
            sub={runVolumeSub(summary)}
          />
          <StatCell
            icon={<Dumbbell className="h-4 w-4 shrink-0 text-red-400" />}
            label="Strength"
            value={strengthValue}
          />
          <StatCell
            icon={<ListChecks className="h-4 w-4 shrink-0 text-yellow-400" />}
            label="Habits"
            value={habit ? `${habit.todayDone}/${HABIT_TOTAL} today` : "Log habits"}
            sub={
              habit
                ? `${habit.weekPct}% this week${habit.streak > 0 ? ` · ${habit.streak}d streak` : ""}`
                : "Tap Habits to score today"
            }
          />
          <StatCell
            icon={<ClipboardCheck className="h-4 w-4 shrink-0 text-emerald-400" />}
            label="Check-in"
            value={summary.weeklyCheckInComplete ? "Complete" : "Due"}
            sub={
              summary.weeklyCheckInComplete
                ? "Weekly check-in complete"
                : "Weekly check-in due"
            }
          />
          {challenge ? (
            <StatCell
              icon={<Trophy className="h-4 w-4 shrink-0 text-amber-400" />}
              label="Challenge"
              value={`${challenge.provisionalPoints} pts`}
              sub="Provisional · proof + habits + sessions"
            />
          ) : (
            <StatCell
              icon={<Target className="h-4 w-4 shrink-0 text-zinc-500" />}
              label="Challenge"
              value="—"
              sub="Open Challenge to stack points"
            />
          )}
        </div>

        {!summary.weeklyCheckInComplete && onCompleteCheckIn ? (
          <button
            type="button"
            onClick={onCompleteCheckIn}
            className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-yellow-500/35 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-100 transition hover:bg-yellow-400/15 sm:w-auto"
          >
            Complete check-in
          </button>
        ) : null}

        <div className="mt-8 border-t border-zinc-800/80 pt-6">
          <BenchmarkSnapshotStrip items={summary.benchmarks} compact />
        </div>
      </div>
    </section>
  );
}
