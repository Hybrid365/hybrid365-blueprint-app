"use client";

import type { BlockWeekMeta } from "./useCoachBlockProgramme";

export function CoachBlockWeekTabs({
  weeks,
  selectedCycle,
  onSelect,
  loading,
}: {
  weeks: BlockWeekMeta[];
  selectedCycle: 1 | 2 | 3 | 4;
  onSelect: (cycle: 1 | 2 | 3 | 4) => void;
  loading?: boolean;
}) {
  const cycles: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];

  return (
    <div className="flex flex-wrap gap-2">
      {cycles.map((cycle) => {
        const meta = weeks.find((w) => w.cycle === cycle);
        const active = selectedCycle === cycle;
        const chipStatus = meta?.published
          ? "Published"
          : meta?.approved
            ? "Approved"
            : meta?.generated
              ? "Draft"
              : "Not generated";

        return (
          <button
            key={cycle}
            type="button"
            disabled={loading}
            onClick={() => onSelect(cycle)}
            className={`flex min-w-[108px] flex-col rounded-xl border px-3 py-2.5 text-left transition ${
              active
                ? "border-yellow-400/50 bg-yellow-400/10"
                : "border-zinc-800 bg-zinc-950/80 hover:border-zinc-600"
            }`}
          >
            <span className="text-sm font-bold text-white">W{cycle}</span>
            <span className="text-[10px] text-zinc-500">{meta?.role ?? "—"}</span>
            <span
              className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                meta?.published
                  ? "text-emerald-400"
                  : meta?.approved
                    ? "text-yellow-400/90"
                    : meta?.generated
                      ? "text-zinc-400"
                      : "text-zinc-600"
              }`}
            >
              {loading ? "…" : chipStatus}
              {meta?.generated ? ` · ${meta.sessionCount} sessions` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
