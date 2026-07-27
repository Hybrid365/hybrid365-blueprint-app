"use client";

import type { PerformanceHubPayload } from "@/app/lib/hyrox-team/modules/performanceHub/types";
import { pctOf } from "@/app/lib/hyrox-team/modules/performanceHub/types";
import { AthletePortalNavLink } from "../AthletePortalNavLink";
import { athleteCard, athleteCardPadding, eyebrowClass } from "../athleteUi";
import { AnimatedProgressBar } from "./motion";

type InsightMetric = {
  key: string;
  label: string;
  current: string;
  planned?: string | null;
  pct?: number | null;
  unit?: string;
};

function pickInsightMetrics(hub: PerformanceHubPayload): InsightMetric[] {
  const out: InsightMetric[] = [];

  const run = hub.summary.find((m) => m.key === "run_distance_km");
  if (run?.value != null) {
    const planned = hub.plannedVsCompleted.find((c) => c.key === "run_distance_km");
    out.push({
      key: "run",
      label: "Running",
      current: run.display,
      planned: planned?.planned != null ? `${planned.planned} km` : null,
      pct: planned ? pctOf(planned.planned, planned.completed) : null,
      unit: "km",
    });
  }

  const hours = hub.summary.find((m) => m.key === "training_hours");
  if (hours?.value != null) {
    const planned = hub.plannedVsCompleted.find((c) => c.key === "training_minutes");
    out.push({
      key: "hours",
      label: "Training hours",
      current: hours.display,
      planned: planned?.planned != null ? `${(planned.planned / 60).toFixed(1)} h` : null,
      pct: planned ? pctOf(planned.planned, planned.completed) : null,
      unit: "h",
    });
  }

  const threshold = hub.summary.find((m) => m.key === "threshold_minutes");
  if (threshold?.value != null) {
    out.push({ key: "threshold", label: "Threshold minutes", current: threshold.display });
  }

  const strength = hub.distribution.find((d) => d.bucket === "strength");
  if (strength?.sessionCount) {
    out.push({
      key: "strength",
      label: "Strength sessions",
      current: String(strength.sessionCount),
    });
  }

  const hyrox = hub.hyroxExposures.find((e) => e.sessionsContaining != null && e.sessionsContaining > 0);
  if (hyrox) {
    out.push({
      key: "hyrox",
      label: "HYROX exposures",
      current: String(hyrox.sessionsContaining),
    });
  }

  if (hub.readiness.avg7d != null) {
    out.push({
      key: "readiness",
      label: "Avg readiness (7d)",
      current: String(Math.round(hub.readiness.avg7d)),
    });
  }

  const completion = hub.plannedVsCompleted.find((c) => c.key === "session_completion");
  if (completion?.pct != null) {
    out.push({
      key: "completion",
      label: "Session completion",
      current: `${completion.pct}%`,
      pct: completion.pct,
    });
  }

  return out.slice(0, 4);
}

type Props = {
  performanceHubEnabled: boolean;
  hub: PerformanceHubPayload | null;
  hubLoading: boolean;
  hubError: string | null;
  legacyMetrics?: Array<{ label: string; value: string; sub?: string }>;
  readOnly?: boolean;
};

export function HomeProgressInsights({
  performanceHubEnabled,
  hub,
  hubLoading,
  hubError,
  legacyMetrics = [],
  readOnly,
}: Props) {
  if (!performanceHubEnabled) {
    if (legacyMetrics.length === 0) return null;
    return (
      <section className={`${athleteCard} ${athleteCardPadding}`} aria-label="Progress insights">
        <Header readOnly={readOnly} hubEnabled={false} />
        <div className="grid grid-cols-2 gap-3">
          {legacyMetrics.map((m) => (
            <div key={m.label} className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{m.label}</p>
              <p className="mt-1 text-xl font-bold text-white">{m.value}</p>
              {m.sub ? <p className="mt-0.5 text-[10px] text-zinc-600">{m.sub}</p> : null}
            </div>
          ))}
        </div>
      </section>
    );
  }

  const metrics = hub ? pickInsightMetrics(hub) : [];
  const sparse = !hubLoading && metrics.length === 0;

  return (
    <section className={`${athleteCard} ${athleteCardPadding}`} aria-label="Progress insights">
      <Header readOnly={readOnly} hubEnabled />

      {hubLoading ? (
        <p className="text-sm text-zinc-500">Loading progress insights…</p>
      ) : hubError ? (
        <p className="text-sm text-amber-300/90">{hubError}</p>
      ) : sparse ? (
        <p className="text-sm text-zinc-500">
          More performance data will appear as sessions are logged.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {metrics.map((m) => (
            <div key={m.key} className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                {m.label}
              </p>
              <p className="mt-1 text-lg font-bold text-white">{m.current}</p>
              {m.planned ? (
                <p className="mt-0.5 text-[10px] text-zinc-500">
                  Plan: {m.planned}
                  {m.pct != null ? ` · ${m.pct}% of weekly plan` : ""}
                </p>
              ) : null}
              {m.pct != null ? (
                <div className="mt-2">
                  <AnimatedProgressBar value={Math.min(100, m.pct)} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Header({ readOnly, hubEnabled }: { readOnly?: boolean; hubEnabled: boolean }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div>
        <p className={eyebrowClass}>Progress insights</p>
        <h2 className="mt-1 text-base font-bold text-white">This week</h2>
      </div>
      {!readOnly && hubEnabled ? (
        <AthletePortalNavLink
          href="/athlete/progress"
          className="text-xs font-semibold text-yellow-400 hover:text-yellow-300"
        >
          View full Performance Hub →
        </AthletePortalNavLink>
      ) : !readOnly ? (
        <AthletePortalNavLink
          href="/athlete/progress"
          className="text-xs font-semibold text-yellow-400 hover:text-yellow-300"
        >
          View progress →
        </AthletePortalNavLink>
      ) : null}
    </div>
  );
}
