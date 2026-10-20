"use client";

import { useAthleteDashboardLive } from "./useAthleteDashboardLive";
import { athleteCard, athleteCardPadding, eyebrowClass } from "./athleteUi";

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
    <div className="space-y-6">
      <div className={`${athleteCard} ${athleteCardPadding}`}>
        <p className={eyebrowClass}>Progress</p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          Your performance trends will appear here as more sessions and testing data are logged.
        </p>
      </div>

      {completion ? (
        <div className={`${athleteCard} ${athleteCardPadding}`}>
          <p className={eyebrowClass}>This week</p>
          <p className="mt-2 text-2xl font-bold text-white">{completion.pct}%</p>
          <p className="mt-1 text-sm text-zinc-400">
            {completion.done} of {completion.planned} sessions logged
          </p>
        </div>
      ) : null}

      {benchmarks.length > 0 ? (
        <section className="space-y-3">
          <p className={eyebrowClass}>Logged benchmarks</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {benchmarks.map((item) => (
              <article key={item.label} className={`${athleteCard} ${athleteCardPadding}`}>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-lg font-bold text-white">{item.latest}</p>
                {item.change ? <p className="mt-1 text-xs text-zinc-500">{item.change}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
