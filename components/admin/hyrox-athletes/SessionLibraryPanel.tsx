"use client";

import { useMemo, useState } from "react";
import {
  filterSessionLibrary,
  LIBRARY_FILTER_LABELS,
  type LibraryFilter,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import { DashCard, SectionHeading } from "@/components/hyrox-team/HyroxDashboardUi";

export function SessionLibraryPanel({
  onSelect,
  selectedId,
}: {
  onSelect: (sessionId: string) => void;
  selectedId?: string | null;
}) {
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [query, setQuery] = useState("");

  const sessions = useMemo(() => {
    let list = filterSessionLibrary(filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.tags.some((t) => t.includes(q)) ||
          s.category.includes(q)
      );
    }
    return list.slice(0, 40);
  }, [filter, query]);

  return (
    <DashCard className="sticky top-4 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
      <SectionHeading title="Session library" />
      <input
        type="search"
        placeholder="Search sessions…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-3 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
      />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(Object.keys(LIBRARY_FILTER_LABELS) as LibraryFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition ${
              filter === f
                ? "border-yellow-500/40 bg-yellow-400/15 text-yellow-200"
                : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
            }`}
          >
            {LIBRARY_FILTER_LABELS[f]}
          </button>
        ))}
      </div>
      <ul className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1 pb-2">
        {sessions.map((s) => {
          const selected = selectedId === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selected
                    ? "border-yellow-500/40 bg-yellow-400/10"
                    : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                }`}
              >
                <p className="text-sm font-semibold text-white">{s.name}</p>
                <p className="mt-0.5 text-[10px] uppercase text-zinc-500">
                  {s.category.replace(/_/g, " ")} · {s.duration}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {s.scheduling?.hardDay ? "Hard" : "Easy/support"}
                  {s.scheduling?.thresholdMinutes
                    ? ` · ${s.scheduling.thresholdMinutes} threshold min`
                    : ""}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] text-zinc-600">
                  Best for: {s.bestFor.slice(0, 2).join(", ")}
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-600">
                  {s.equipment.slice(0, 3).join(" · ")}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </DashCard>
  );
}
