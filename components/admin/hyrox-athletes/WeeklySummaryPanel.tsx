"use client";

import type { WeeklySummary } from "@/app/lib/hyroxCoachProgrammeDraft";
import { DashCard, SectionHeading, StatTile } from "@/components/hyrox-team/HyroxDashboardUi";

export function WeeklySummaryPanel({ summary }: { summary: WeeklySummary }) {
  const hoursPct = Math.min(
    100,
    Math.round((summary.plannedHours / Math.max(summary.availableHours, 1)) * 100)
  );

  return (
    <DashCard>
      <SectionHeading title="Weekly summary" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          label="Planned hours"
          value={`${summary.plannedHours}h`}
          sub={`Available ${summary.availableHours}h · ${hoursPct}%`}
        />
        <StatTile label="Run volume" value={`${summary.runVolumeKm} km`} sub="Target weekly" />
        <StatTile label="Threshold min" value={String(summary.thresholdMinutes)} />
        <StatTile label="Hard days" value={String(summary.hardDays)} />
        <StatTile label="Easy / support" value={String(summary.easySupportDays)} />
        <StatTile label="Strength sessions" value={String(summary.strengthSessions)} />
        <StatTile label="Hyrox-specific" value={String(summary.hyroxSessions)} />
        <StatTile label="Upper / grip touches" value={String(summary.upperGripTouches)} />
      </div>
      {summary.stationWeaknessTouches.length > 0 ? (
        <p className="mt-4 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-400">Station exposure: </span>
          {summary.stationWeaknessTouches.join(" · ")}
        </p>
      ) : null}
    </DashCard>
  );
}
