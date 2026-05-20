"use client";

import type { WeeklySummary } from "@/app/lib/hyroxCoachProgrammeDraft";

export function WeeklySummaryPanel({ summary }: { summary: WeeklySummary }) {
  const hoursPct = Math.min(
    100,
    Math.round((summary.plannedHours / Math.max(summary.availableHours, 1)) * 100)
  );

  const rows = [
    ["Planned hours", `${summary.plannedHours}h / ${summary.availableHours}h (${hoursPct}%)`],
    ["Run volume", `${summary.runVolumeKm} km`],
    ["Threshold min", String(summary.thresholdMinutes)],
    ["Quality run min", String(summary.qualityRunMinutes)],
    ["Erg min", String(summary.ergMinutes)],
    ["Bike min", String(summary.bikeMinutes)],
    ["Strength min", String(summary.strengthMinutes)],
    ["Station volume", String(summary.stationVolume)],
    ["Hard days", String(summary.hardDays)],
    ["Easy / support", String(summary.easySupportDays)],
    ["Strength sessions", String(summary.strengthSessions)],
    ["Hyrox-specific", String(summary.hyroxSessions)],
    ["Double-session days", String(summary.doubleSessionDays)],
    ["Upper / grip", String(summary.upperGripTouches)],
    ["Optional add-ons", String(summary.optionalAddOns)],
  ];

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <h2 className="text-sm font-bold text-white">Weekly summary</h2>
      <dl className="mt-3 space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 text-xs">
            <dt className="text-zinc-500">{k}</dt>
            <dd className="font-medium text-zinc-200">{v}</dd>
          </div>
        ))}
      </dl>
      {summary.stationWeaknessTouches.length > 0 ? (
        <p className="mt-3 border-t border-zinc-800 pt-3 text-[11px] text-zinc-500">
          Station exposure: {summary.stationWeaknessTouches.join(" · ")}
        </p>
      ) : null}
    </section>
  );
}
