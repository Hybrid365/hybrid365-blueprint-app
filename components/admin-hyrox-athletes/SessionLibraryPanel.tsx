"use client";

import { useMemo, useState } from "react";
import {
  COACH_LIBRARY_QUICK_FILTERS,
  filterCoachLibrary,
  isCoachStapleEntry,
  LIBRARY_CATEGORY_LABELS,
  LIBRARY_QUICK_FILTER_LABELS,
  type LibraryCategory,
  type LibraryQuickFilter,
  type CoachLibraryEntry,
} from "@/app/lib/hyroxCoachSessionLibrary";
import type { WeekdayName } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { SandboxTimeOfDay } from "@/app/lib/hyroxProgrammeSandbox";
import { Plus } from "lucide-react";

const CATEGORIES = Object.keys(LIBRARY_CATEGORY_LABELS) as LibraryCategory[];

export function SessionLibraryPanel({
  addTarget,
  onAdd,
  equipmentAvailable,
}: {
  addTarget: { day: WeekdayName; slot: SandboxTimeOfDay } | null;
  onAdd: (entry: CoachLibraryEntry) => void;
  equipmentAvailable?: Record<string, boolean>;
}) {
  const [category, setCategory] = useState<LibraryCategory>("all");
  const [quickFilter, setQuickFilter] = useState<LibraryQuickFilter | null>(null);
  const [equipmentOnly, setEquipmentOnly] = useState(false);
  const [query, setQuery] = useState("");

  const sessions = useMemo(
    () =>
      filterCoachLibrary(category, query, {
        quickFilter,
        equipmentAvailable: equipmentOnly ? equipmentAvailable : undefined,
      }),
    [category, query, quickFilter, equipmentOnly, equipmentAvailable]
  );

  return (
    <aside className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-950/80">
      <div className="border-b border-zinc-800 p-4">
        <h2 className="text-sm font-bold text-white">Session library</h2>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          {addTarget ? `Adding to ${addTarget.day} · ${addTarget.slot}` : "Select day slot, then Add"}
        </p>
        <input
          type="search"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="flex flex-wrap gap-1 border-b border-zinc-800/60 p-2">
        {COACH_LIBRARY_QUICK_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setQuickFilter((prev) => (prev === f ? null : f))}
            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
              quickFilter === f
                ? "bg-sky-400/15 text-sky-200 ring-1 ring-sky-500/35"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {LIBRARY_QUICK_FILTER_LABELS[f]}
          </button>
        ))}
        {equipmentAvailable ? (
          <button
            type="button"
            onClick={() => setEquipmentOnly((v) => !v)}
            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
              equipmentOnly
                ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-500/35"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Equipment
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1 border-b border-zinc-800 p-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
              category === c
                ? "bg-yellow-400/15 text-yellow-200 ring-1 ring-yellow-500/35"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {LIBRARY_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
      <ul className="flex-1 space-y-2 overflow-y-auto p-2">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-2.5 hover:border-zinc-700"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{s.name}</p>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {isCoachStapleEntry(s) ? (
                    <span className="rounded bg-yellow-400/20 px-1 text-[8px] font-semibold text-yellow-200">
                      Coach Staple
                    </span>
                  ) : null}
                  {s.source === "Kieran personal session" || s.tags.includes("kieran-session") ? (
                    <span className="rounded bg-violet-400/15 px-1 text-[8px] font-semibold text-violet-200">
                      Kieran Session
                    </span>
                  ) : null}
                  {s.sessionStress === "very_high" ||
                  (s.stationStress === "high" && s.muscularStress === "high") ? (
                    <span className="rounded bg-red-500/20 px-1 text-[8px] font-semibold text-red-200">
                      High Stress
                    </span>
                  ) : null}
                  {(s.level === "advanced" || s.level === "pro") && (
                    <span className="rounded bg-zinc-700 px-1 text-[8px] text-zinc-300">
                      {s.level}
                    </span>
                  )}
                  {s.isStaple ? (
                    <span className="rounded bg-yellow-400/10 px-1 text-[8px] text-yellow-200/80">
                      staple
                    </span>
                  ) : null}
                </div>
                <p className="text-[10px] text-zinc-500">{s.abbrev}</p>
                <p className="mt-1 text-[10px] text-zinc-600">
                  {s.hardEasy} · {s.duration}
                  {s.thresholdMinutes ? ` · ${s.thresholdMinutes}′ TH` : ""}
                </p>
                <p className="text-[10px] text-zinc-600">{s.equipment.slice(0, 2).join(" · ")}</p>
              </div>
              <button
                type="button"
                disabled={!addTarget}
                onClick={() => onAdd(s)}
                title={addTarget ? "Add to schedule" : "Pick a day slot first"}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-yellow-400/20 text-yellow-300 disabled:opacity-30"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
