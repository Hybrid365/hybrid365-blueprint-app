"use client";

import { useAthleteDashboardLive } from "./useAthleteDashboardLive";
import { BenchmarkCard, ProgressChartCard, SectionHeader, TrainingSummary } from "./visual";

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
    <div className="space-y-8">
      <ProgressChartCard
        title="Progress"
        empty="Your performance trends will appear here as more sessions and testing data are logged."
      />

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
        </section>
      ) : null}
    </div>
  );
}
