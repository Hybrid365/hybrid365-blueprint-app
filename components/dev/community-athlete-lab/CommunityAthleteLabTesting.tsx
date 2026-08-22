import { ALEX_MORGAN_COMMUNITY_LAB } from "@/app/lib/dev/community-athlete-lab/alexMorganFixture";

export function CommunityAthleteLabTesting() {
  const lab = ALEX_MORGAN_COMMUNITY_LAB;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-yellow-400/90">Testing week</p>
      <h1 className="mt-2 text-2xl font-bold text-white">Mock benchmark results</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Fixture only — nothing is written to `benchmark_tests`. Live Community testing is `/dashboard/testing`.
      </p>
      <ul className="mt-8 space-y-2">
        {lab.testing.map((row) => (
          <li
            key={row.id}
            className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3"
          >
            <div>
              <p className="font-semibold text-white">{row.test}</p>
              <p className="text-xs text-zinc-500">{row.testedAt}{row.notes ? ` · ${row.notes}` : ""}</p>
            </div>
            <p className="text-right font-bold text-yellow-300">
              {row.value}
              <span className="ml-1 text-xs font-medium text-zinc-500">{row.unit}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
