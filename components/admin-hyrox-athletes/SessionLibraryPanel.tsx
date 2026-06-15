"use client";

import { useMemo, useState } from "react";
import {
  COACH_LIBRARY_QUICK_FILTERS,
  filterCoachLibrary,
  getSessionGuardrailWarnings,
  guardrailContextFromAthlete,
  isCoachStapleEntry,
  LIBRARY_CATEGORY_LABELS,
  LIBRARY_QUICK_FILTER_LABELS,
  type LibraryCategory,
  type LibraryQuickFilter,
  type CoachLibraryEntry,
} from "@/app/lib/hyroxCoachSessionLibrary";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import type { WeekdayName } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { SandboxTimeOfDay } from "@/app/lib/hyroxProgrammeSandbox";
import { Plus } from "lucide-react";

const CATEGORIES = Object.keys(LIBRARY_CATEGORY_LABELS) as LibraryCategory[];

function HyroxMetadataSummary({ entry }: { entry: CoachLibraryEntry }) {
  const m = entry.hyroxMetadata;
  if (!m) return null;

  return (
    <div className="mt-1.5 space-y-0.5 border-t border-zinc-800/60 pt-1.5 text-[9px] text-zinc-600">
      <p>
        <span className="text-zinc-500">Category:</span> {m.primaryCategory.replace(/_/g, " ")}
        {m.secondaryCategory ? ` · ${m.secondaryCategory.replace(/_/g, " ")}` : ""}
      </p>
      <p>
        <span className="text-zinc-500">Type:</span> {m.sessionType.replace(/_/g, " ")} ·{" "}
        <span className="text-zinc-500">Fatigue:</span> {m.fatigueCost}
      </p>
      <p className="line-clamp-2">
        <span className="text-zinc-500">Weakness:</span> {m.weaknessTargets.slice(0, 4).join(", ")}
      </p>
      <p className="line-clamp-2">
        <span className="text-zinc-500">Phase:</span> {m.bestTrainingPhase.slice(0, 3).join(", ")}
      </p>
    </div>
  );
}

export function SessionLibraryPanel({
  addTarget,
  onAdd,
  equipmentAvailable,
  athlete,
}: {
  addTarget: { day: WeekdayName; slot: SandboxTimeOfDay } | null;
  onAdd: (entry: CoachLibraryEntry) => void;
  equipmentAvailable?: Record<string, boolean>;
  athlete?: CoachAthlete | null;
}) {
  const [category, setCategory] = useState<LibraryCategory>("all");
  const [quickFilter, setQuickFilter] = useState<LibraryQuickFilter | null>(null);
  const [equipmentOnly, setEquipmentOnly] = useState(false);
  const [query, setQuery] = useState("");

  const guardrailContext = useMemo(
    () => (athlete ? guardrailContextFromAthlete(athlete) : undefined),
    [athlete]
  );

  const sessions = useMemo(
    () =>
      filterCoachLibrary(category, query, {
        quickFilter,
        equipmentAvailable: equipmentOnly ? equipmentAvailable : undefined,
        guardrailContext,
      }),
    [category, query, quickFilter, equipmentOnly, equipmentAvailable, guardrailContext]
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
        {sessions.map((s) => {
          const guardrails = guardrailContext
            ? getSessionGuardrailWarnings(s, guardrailContext)
            : [];
          const hasWarn = guardrails.some((g) => g.severity === "warn" || g.severity === "block_suggestion");

          return (
          <li
            key={s.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-2.5 hover:border-zinc-700"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{s.name}</p>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {s.hyroxMetadata ? (
                    <span className="rounded bg-orange-400/15 px-1 text-[8px] font-semibold text-orange-200">
                      HYROX Batch
                    </span>
                  ) : null}
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
                  s.hyroxMetadata?.fatigueCost === "very_high" ||
                  (s.stationStress === "high" && s.muscularStress === "high") ? (
                    <span className="rounded bg-red-500/20 px-1 text-[8px] font-semibold text-red-200">
                      High Stress
                    </span>
                  ) : null}
                  {hasWarn ? (
                    <span className="rounded bg-amber-500/20 px-1 text-[8px] font-semibold text-amber-200">
                      Check guardrails
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
                <p className="mt-1 line-clamp-3 text-[10px] text-zinc-500">{s.prescription.objective}</p>
                <p className="mt-1 text-[10px] text-zinc-600">
                  {s.hardEasy} · {s.duration}
                  {s.thresholdMinutes ? ` · ${s.thresholdMinutes}′ TH` : ""}
                </p>
                <p className="text-[10px] text-zinc-600">{s.equipment.slice(0, 3).join(" · ")}</p>
                <HyroxMetadataSummary entry={s} />
                {guardrails.length > 0 ? (
                  <p className="mt-1 line-clamp-2 text-[9px] text-amber-300/80">
                    {guardrails[0]?.message}
                  </p>
                ) : null}
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
          );
        })}
      </ul>
    </aside>
  );
}
