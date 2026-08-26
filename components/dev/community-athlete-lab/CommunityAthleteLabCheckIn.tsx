import { ALEX_MORGAN_COMMUNITY_LAB } from "@/app/lib/dev/community-athlete-lab/alexMorganFixture";

export function CommunityAthleteLabCheckIn() {
  const lab = ALEX_MORGAN_COMMUNITY_LAB;
  const week = lab.progressHistory[lab.programme.currentWeek - 1];

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-yellow-400/90">Weekly check-in</p>
      <h1 className="mt-2 text-2xl font-bold text-white">Week {lab.programme.currentWeek} snapshot</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Read-only fixture. Live Community check-in (including HYROX extras) is `/dashboard/check-in`.
      </p>
      <dl className="mt-8 space-y-3">
        {[
          ["Readiness", `${week.readiness}/10`],
          ["Session completion", `${week.sessionsCompleted}/${week.sessionsPlanned}`],
          ["Running", `${week.completedRunKm} / ${week.plannedRunKm} km`],
          ["Average RPE", week.avgRpe.toFixed(1)],
          ["Habit adherence", `${week.habitAdherencePct}%`],
          ["Check-in submitted", lab.weekTracking.weeklyCheckInComplete ? "Yes" : "Not yet"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3"
          >
            <dt className="text-sm text-zinc-500">{label}</dt>
            <dd className="font-semibold text-white">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
