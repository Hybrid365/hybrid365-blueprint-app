import { ALEX_MORGAN_COMMUNITY_LAB } from "@/app/lib/dev/community-athlete-lab/alexMorganFixture";

export function CommunityAthleteLabHabits() {
  const lab = ALEX_MORGAN_COMMUNITY_LAB;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-yellow-400/90">Habits</p>
      <h1 className="mt-2 text-2xl font-bold text-white">Daily states</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Lab fields: hydration, mobility, stretching, sleep, nutrition. Live Community habits use{" "}
        `daily_habit_logs` on `/dashboard/habits`.
      </p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Hydration</th>
              <th className="px-3 py-3">Mobility</th>
              <th className="px-3 py-3">Stretch</th>
              <th className="px-3 py-3">Sleep</th>
              <th className="px-3 py-3">Nutrition</th>
            </tr>
          </thead>
          <tbody>
            {lab.habits.map((day) => (
              <tr key={day.date} className="border-t border-zinc-800 text-zinc-300">
                <td className="px-3 py-2 font-medium text-white">{day.date}</td>
                <td className="px-3 py-2">{day.hydration ? "Yes" : "—"}</td>
                <td className="px-3 py-2">{day.mobility ? "Yes" : "—"}</td>
                <td className="px-3 py-2">{day.stretching ? "Yes" : "—"}</td>
                <td className="px-3 py-2">{day.sleep ? "Yes" : "—"}</td>
                <td className="px-3 py-2">{day.nutrition ? "Yes" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
