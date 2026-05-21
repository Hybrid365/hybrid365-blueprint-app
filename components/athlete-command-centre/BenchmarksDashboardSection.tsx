"use client";

import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { MOCK_BENCHMARKS_TRACKER } from "@/app/lib/hyroxTeamDashboardMock";
import {
  SectionTitle,
  athleteCard,
  athleteCardInteractive,
  athleteCardPadding,
  btnPrimaryClass,
  eyebrowClass,
} from "./athleteUi";
import { useAthleteDashboardLive } from "./useAthleteDashboardLive";

export function BenchmarksDashboardSection() {
  const { useLive, benchmarkSnapshot, benchmarksLoading, benchmarksError } = useAthleteDashboardLive();

  if (useLive && benchmarksLoading) {
    return (
      <div className={`${athleteCard} ${athleteCardPadding}`}>
        <p className="text-sm text-zinc-500">Loading your saved test results…</p>
      </div>
    );
  }

  if (useLive && benchmarksError) {
    return (
      <div className={`${athleteCard} ${athleteCardPadding}`}>
        <p className="text-sm text-amber-300/90">{benchmarksError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={`${btnPrimaryClass} mt-4`}
        >
          Retry
        </button>
      </div>
    );
  }

  if (useLive) {
    const logged = benchmarkSnapshot?.filter((b) => b.logged) ?? [];
    if (!logged.length) {
      return (
        <div className="space-y-8">
          <div className={`${athleteCard} ${athleteCardPadding}`}>
            <p className={eyebrowClass}>Benchmarks</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              No saved test results yet. Complete your core tests in Testing — your coach will set
              targets when ready.
            </p>
            <Link href="/athlete/testing" className={`${btnPrimaryClass} mt-6 inline-flex`}>
              Go to Testing →
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <p className="text-xs text-zinc-500">
          Live results from your saved tests. Targets show &quot;Coach to set target&quot; until your
          coach publishes them.
        </p>
        <section>
          <SectionTitle
            title="Test results"
            description="Latest submitted results from your testing flow"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {(benchmarkSnapshot ?? []).map((b) => (
              <article
                key={b.label}
                className={`${athleteCardInteractive} ${athleteCardPadding}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white">{b.label}</h3>
                  {b.logged && b.change ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      {b.change.includes("slower") ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {b.change}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">
                      {b.logged ? "Latest" : "Not logged yet"}
                    </span>
                  )}
                </div>
                <div className="mt-4 rounded-lg border border-yellow-400/30 bg-yellow-400/5 py-3 text-center">
                  <p className="text-[10px] font-semibold uppercase text-yellow-400/80">Latest</p>
                  <p className="mt-1 text-lg font-bold text-white">{b.latest}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <div className="flex justify-center border-t border-zinc-800/80 pt-6">
          <Link href="/athlete/testing" className={btnPrimaryClass}>
            Update tests →
          </Link>
        </div>
      </div>
    );
  }

  const tracker = MOCK_BENCHMARKS_TRACKER;
  const improved = tracker.filter((b) => b.positive && b.progressPct > 0).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/25 px-5 py-4 text-sm text-zinc-300">
        <span className="text-2xl font-bold text-emerald-400">{improved}</span>
        <span>
          of <strong className="text-white">{tracker.length}</strong> benchmarks trending positively
          (demo preview)
        </span>
      </div>
      <section>
        <SectionTitle title="Test results" description="Demo preview data" />
        <div className="grid gap-4 sm:grid-cols-2">
          {tracker.map((b) => (
            <article key={b.id} className={`${athleteCardInteractive} ${athleteCardPadding}`}>
              <h3 className="font-bold text-white">{b.name}</h3>
              <p className="mt-2 text-sm text-zinc-400">{b.latest}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
