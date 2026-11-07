"use client";

import { useAthleteDashboardLive } from "./useAthleteDashboardLive";
import { BenchmarkCard, SectionHeader, TrainingSummary, visualEyebrow, visualMeta } from "./visual";

/**
 * Sparse Progress fallback when athlete analytics flag is off.
 * Honest empty chart — no invented trend lines.
 */
export function ProgressDashboardSection() {
  const { useLive, dashboardLive } = useAthleteDashboardLive();
  const completion =
    useLive && dashboardLive && dashboardLive.sessionsPlanned > 0
      ? {
          pct: dashboardLive.weeklyCompletionPct,
          done: dashboardLive.sessionsCompleted,
          planned: dashboardLive.sessionsPlanned,
        }
      : null;
  const benchmarks = (useLive && dashboardLive ? dashboardLive.benchmarkSnapshot : []).filter(
    (item) => item.logged && item.latest.trim()
  );

  return (
    <div className="space-y-8" data-h365-progress-fallback="">
      <section>
        <p className={visualEyebrow}>Now · are you getting better?</p>
        <p className={`mt-2 max-w-xl text-sm leading-relaxed text-zinc-400`}>
          Benchmark progression unlocks when athlete analytics is enabled for your account. Until
          then, only logged completion and approved benchmark snapshots appear here — no sample
          charts.
        </p>
      </section>

      {completion ? (
        <TrainingSummary
          title="This week"
          items={[
            { label: "Completion", value: `${completion.pct}%` },
            { label: "Logged", value: `${completion.done}/${completion.planned}`, sub: "Sessions" },
          ]}
        />
      ) : (
        <TrainingSummary
          title="This week"
          items={[]}
          empty="Session completion appears after this week is logged."
        />
      )}

      {benchmarks.length > 0 ? (
        <section>
          <SectionHeader title="Logged benchmarks" />
          <div className="grid gap-3 sm:grid-cols-2">
            {benchmarks.map((item) => (
              <BenchmarkCard
                key={item.label}
                label={item.label}
                value={item.latest}
                status="approved"
                meta={item.change?.trim() || null}
              />
            ))}
          </div>
          {benchmarks.every((item) => !item.change?.trim()) ? (
            <p className={`mt-3 ${visualMeta}`}>
              Complete another result for a metric to unlock progression.
            </p>
          ) : null}
        </section>
      ) : (
        <TrainingSummary
          title="Benchmarks"
          items={[]}
          empty="No approved benchmarks yet. Each logged result will appear as its own point — nothing is interpolated."
        />
      )}
    </div>
  );
}
