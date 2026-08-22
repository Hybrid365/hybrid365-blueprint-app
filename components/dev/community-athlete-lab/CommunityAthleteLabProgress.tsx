import { ALEX_MORGAN_COMMUNITY_LAB } from "@/app/lib/dev/community-athlete-lab/alexMorganFixture";
import { ThisWeekTrackingCard } from "@/components/dashboard/ThisWeekTrackingCard";

export function CommunityAthleteLabProgress() {
  const lab = ALEX_MORGAN_COMMUNITY_LAB;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-yellow-400/90">Progress</p>
      <h1 className="mt-2 text-2xl font-bold text-white">Training history</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Mock weeks 1–6 so charts can be designed against real-looking numbers. Live Community progress is{" "}
        `/dashboard/progress`.
      </p>

      <div className="mt-8">
        <ThisWeekTrackingCard summary={lab.weekTracking} />
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-3">Week</th>
              <th className="px-3 py-3">Run km</th>
              <th className="px-3 py-3">Duration</th>
              <th className="px-3 py-3">Sessions</th>
              <th className="px-3 py-3">RPE</th>
              <th className="px-3 py-3">Threshold min</th>
              <th className="px-3 py-3">HYROX min</th>
              <th className="px-3 py-3">Readiness</th>
              <th className="px-3 py-3">Habits</th>
            </tr>
          </thead>
          <tbody>
            {lab.progressHistory.map((week) => (
              <tr key={week.week} className="border-t border-zinc-800 text-zinc-300">
                <td className="px-3 py-3 font-semibold text-white">{week.week}</td>
                <td className="px-3 py-3">
                  {week.completedRunKm}/{week.plannedRunKm}
                </td>
                <td className="px-3 py-3">{Math.round(week.durationMinutes / 60)}h {week.durationMinutes % 60}m</td>
                <td className="px-3 py-3">
                  {week.sessionsCompleted}/{week.sessionsPlanned}
                </td>
                <td className="px-3 py-3">{week.avgRpe.toFixed(1)}</td>
                <td className="px-3 py-3">{week.thresholdMinutes}</td>
                <td className="px-3 py-3">{week.hyroxStationMinutes}</td>
                <td className="px-3 py-3">{week.readiness}/10</td>
                <td className="px-3 py-3">{week.habitAdherencePct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        {(["z1", "z2", "z3", "z4", "z5"] as const).map((zone) => (
          <div key={zone} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">{zone}</p>
            <p className="mt-1 text-lg font-bold text-white">
              {lab.progressHistory[5].hrZones[zone]}%
            </p>
            <p className="text-[11px] text-zinc-500">Week 6 distribution</p>
          </div>
        ))}
      </div>
    </div>
  );
}
