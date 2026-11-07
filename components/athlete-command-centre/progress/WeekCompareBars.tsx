"use client";

import { visualMeta } from "@/components/athlete-command-centre/visual";
import type { WeekCompareRow } from "./progressMath";

export function WeekCompareBars({
  rows,
  empty,
}: {
  rows: WeekCompareRow[];
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-5">
        <div className="flex h-1.5 overflow-hidden rounded-sm bg-zinc-900">
          <div className="w-2/5 bg-zinc-800" />
          <div className="w-1/5 bg-zinc-900" />
          <div className="flex-1 bg-zinc-950" />
        </div>
        <p className={`mt-3 ${visualMeta}`}>
          {empty ?? "Current vs previous needs published sessions in both Monday–Sunday windows."}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4" data-h365-week-compare="">
      {rows.map((row) => {
        const max = Math.max(row.current, row.previous, 0.0001);
        const currentPct = Math.max(4, (row.current / max) * 100);
        const previousPct = Math.max(4, (row.previous / max) * 100);
        const tone =
          row.higherIsBetter == null || row.deltaLabel === "Same"
            ? "text-zinc-400"
            : row.current > row.previous === row.higherIsBetter
              ? "text-yellow-400/90"
              : "text-zinc-500";
        return (
          <li key={row.id}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                {row.label}
              </span>
              {row.deltaLabel ? <span className={`text-xs tabular-nums ${tone}`}>{row.deltaLabel}</span> : null}
            </div>
            <div className="space-y-1.5">
              <CompareTrack
                label="Now"
                display={row.currentDisplay}
                widthPct={currentPct}
                emphasize
              />
              <CompareTrack
                label="Prev"
                display={row.previousDisplay}
                widthPct={previousPct}
                emphasize={false}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function CompareTrack({
  label,
  display,
  widthPct,
  emphasize,
}: {
  label: string;
  display: string;
  widthPct: number;
  emphasize: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-[10px] uppercase tracking-wide text-zinc-600">{label}</span>
      <div className="h-1.5 min-w-0 flex-1 rounded-sm bg-zinc-900">
        <div
          className={`h-1.5 rounded-sm ${emphasize ? "bg-yellow-400/85" : "bg-zinc-600"}`}
          style={{ width: `${Math.min(100, widthPct)}%` }}
        />
      </div>
      <span
        className={`w-16 shrink-0 text-right text-xs tabular-nums ${
          emphasize ? "font-semibold text-white" : "text-zinc-400"
        }`}
      >
        {display}
      </span>
    </div>
  );
}
