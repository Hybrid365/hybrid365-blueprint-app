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
import {
  deriveProgrammingBuilderHints,
  getProgressionFamily,
  type HyroxCoachPerformanceProfile,
} from "@/app/lib/hyrox-team/modules/programmingSystem";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import type { WeekdayName } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { SandboxTimeOfDay } from "@/app/lib/hyroxProgrammeSandbox";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

const CATEGORIES = Object.keys(LIBRARY_CATEGORY_LABELS) as LibraryCategory[];

function hintToneClass(tone: "neutral" | "positive" | "caution" | "info"): string {
  switch (tone) {
    case "positive":
      return "bg-emerald-500/15 text-emerald-200";
    case "caution":
      return "bg-amber-500/20 text-amber-200";
    case "info":
      return "bg-sky-500/15 text-sky-200";
    default:
      return "bg-zinc-700/80 text-zinc-300";
  }
}

function PriorityMeta({ entry }: { entry: CoachLibraryEntry }) {
  const std = entry.programmingStandards;
  const family = getProgressionFamily(entry.progressionFamily);
  const fatigue =
    std?.estimatedFatigueCost ??
    entry.hyroxMetadata?.fatigueCost ??
    (entry.hardDay ? "high" : null);
  const phase = std?.trainingPhase?.[0] ?? entry.hyroxMetadata?.bestTrainingPhase?.[0];
  const adjacency = std?.adjacencyWarnings?.[0];

  return (
    <div className="mt-1.5 space-y-0.5 text-[9px] text-zinc-500">
      {std?.primaryAdaptation ? (
        <p>
          <span className="text-zinc-600">Adaptation:</span>{" "}
          {std.primaryAdaptation.replace(/_/g, " ")}
        </p>
      ) : null}
      <p>
        {fatigue ? (
          <>
            <span className="text-zinc-600">Fatigue:</span> {fatigue}
          </>
        ) : null}
        {entry.progressionLevel ? (
          <>
            {fatigue ? " · " : null}
            <span className="text-zinc-600">Level:</span>{" "}
            {entry.progressionLevel.replace(/_/g, " ")}
          </>
        ) : null}
        {phase ? (
          <>
            {" · "}
            <span className="text-zinc-600">Phase:</span> {String(phase).replace(/_/g, " ")}
          </>
        ) : null}
      </p>
      {family ? (
        <p>
          <span className="text-zinc-600">Family:</span> {family.name}
        </p>
      ) : null}
      {adjacency ? (
        <p className="text-amber-300/80">
          <span className="text-zinc-600">Avoid near:</span> {adjacency.replace(/_/g, " ")}
        </p>
      ) : null}
    </div>
  );
}

function ExpandableStandards({ entry }: { entry: CoachLibraryEntry }) {
  const [open, setOpen] = useState(false);
  const std = entry.programmingStandards;
  if (!std && !entry.hyroxMetadata) return null;

  return (
    <div className="mt-1.5 border-t border-zinc-800/60 pt-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[9px] font-semibold text-zinc-500 hover:text-zinc-300"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Session detail
      </button>
      {open ? (
        <div className="mt-1.5 space-y-1 text-[9px] text-zinc-600">
          {std ? (
            <>
              <p>
                <span className="text-zinc-500">Purpose:</span> {std.purpose}
              </p>
              {std.secondaryAdaptation ? (
                <p>
                  <span className="text-zinc-500">Secondary:</span>{" "}
                  {std.secondaryAdaptation.replace(/_/g, " ")}
                </p>
              ) : null}
              <p>
                <span className="text-zinc-500">Duration:</span> ~{std.estimatedDurationMinutes}{" "}
                min · <span className="text-zinc-500">RPE:</span> {std.expectedRpe}
              </p>
              <p>
                <span className="text-zinc-500">Levels:</span>{" "}
                {std.suitableAthleteLevel.join(", ")}
              </p>
              <p>
                <span className="text-zinc-500">Placement:</span>{" "}
                {std.suggestedSessionPlacement.slice(0, 2).join(" · ").replace(/_/g, " ")}
              </p>
              {std.recommendedProgression ? (
                <p>
                  <span className="text-zinc-500">Progress:</span> {std.recommendedProgression}
                </p>
              ) : null}
              {std.recommendedRegression ? (
                <p>
                  <span className="text-zinc-500">Regress:</span> {std.recommendedRegression}
                </p>
              ) : null}
              <p>
                <span className="text-zinc-500">Log:</span>{" "}
                {std.recommendedLoggingFields.slice(0, 4).join(", ")}
              </p>
            </>
          ) : null}
          {entry.hyroxMetadata ? (
            <p className="line-clamp-2">
              <span className="text-zinc-500">Batch meta:</span>{" "}
              {entry.hyroxMetadata.primaryCategory.replace(/_/g, " ")} ·{" "}
              {entry.hyroxMetadata.sessionType.replace(/_/g, " ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SessionLibraryPanel({
  addTarget,
  onAdd,
  onBuildFromScratch,
  replaceMode = false,
  equipmentAvailable,
  athlete,
  performanceProfile = null,
}: {
  addTarget: { day: WeekdayName; slot: SandboxTimeOfDay } | null;
  onAdd: (entry: CoachLibraryEntry) => void;
  onBuildFromScratch?: () => void;
  replaceMode?: boolean;
  equipmentAvailable?: Record<string, boolean>;
  athlete?: CoachAthlete | null;
  performanceProfile?: HyroxCoachPerformanceProfile | null;
}) {
  const [category, setCategory] = useState<LibraryCategory>("all");
  const [quickFilter, setQuickFilter] = useState<LibraryQuickFilter | null>(null);
  const [equipmentOnly, setEquipmentOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [intensityBand, setIntensityBand] = useState<string>("all");
  const [movementFocus, setMovementFocus] = useState<string>("all");

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
        intensityBand: intensityBand === "all" ? null : intensityBand,
        movementFocus: movementFocus === "all" ? null : movementFocus,
      }),
    [
      category,
      query,
      quickFilter,
      equipmentOnly,
      equipmentAvailable,
      guardrailContext,
      intensityBand,
      movementFocus,
    ]
  );

  const canScratch = Boolean(addTarget) || replaceMode;

  return (
    <aside className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-950/80">
      <div className="border-b border-zinc-800 p-4">
        <h2 className="text-sm font-bold text-white">Add session</h2>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          {replaceMode
            ? "Replace with a library session or build from scratch"
            : addTarget
              ? `Adding to ${addTarget.day} · ${addTarget.slot}`
              : "Select day slot, then choose a route"}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
              Browse session library
            </p>
            <p className="text-[11px] text-zinc-500">Search, filter, then add a snapshot.</p>
          </div>
          <button
            type="button"
            disabled={!canScratch || !onBuildFromScratch}
            onClick={() => onBuildFromScratch?.()}
            className="min-h-12 rounded-xl border border-yellow-500/40 bg-yellow-400/15 px-3 py-2 text-left disabled:opacity-40"
          >
            <p className="text-sm font-bold text-yellow-100">+ Build from scratch</p>
            <p className="text-[11px] text-yellow-100/70">Blank session · compile to athlete prescription</p>
          </button>
        </div>
        <input
          type="search"
          placeholder="Search family, limiter, fatigue, phase…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="block text-[10px] font-semibold uppercase text-zinc-500">
            Intensity
            <select
              value={intensityBand}
              onChange={(e) => setIntensityBand(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs text-white"
            >
              <option value="all">All intensities</option>
              <option value="easy_technique">Easy / Technique</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
              <option value="race_specific">Race specific</option>
            </select>
          </label>
          <label className="block text-[10px] font-semibold uppercase text-zinc-500">
            Movement / focus
            <select
              value={movementFocus}
              onChange={(e) => setMovementFocus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs text-white"
            >
              <option value="all">All movements</option>
              <option value="mixed_hyrox">Mixed HYROX</option>
              <option value="ski">Ski</option>
              <option value="sled_push">Sled Push</option>
              <option value="sled_pull">Sled Pull</option>
              <option value="bbj">Burpee Broad Jump</option>
              <option value="row">Row</option>
              <option value="farmers">Farmers Carry</option>
              <option value="lunges">Sandbag Lunges</option>
              <option value="wall_balls">Wall Balls</option>
              <option value="running">Running</option>
            </select>
          </label>
        </div>
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
          const hasWarn = guardrails.some(
            (g) => g.severity === "warn" || g.severity === "block_suggestion"
          );
          const hints = deriveProgrammingBuilderHints(s, { performanceProfile });

          return (
            <li
              key={s.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-2.5 hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">{s.name}</p>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {s.category === "hyrox_volume_builders" ? (
                      <span className="rounded bg-teal-400/15 px-1 text-[8px] font-semibold text-teal-200">
                        Volume Builder
                      </span>
                    ) : null}
                    {s.category === "hybrid_engine" ? (
                      <span className="rounded bg-cyan-400/15 px-1 text-[8px] font-semibold text-cyan-200">
                        Hybrid Engine
                      </span>
                    ) : null}
                    {hints.map((h) => (
                      <span
                        key={h.kind}
                        className={`rounded px-1 text-[8px] font-semibold ${hintToneClass(h.tone)}`}
                      >
                        {h.label}
                      </span>
                    ))}
                    {isCoachStapleEntry(s) ? (
                      <span className="rounded bg-yellow-400/20 px-1 text-[8px] font-semibold text-yellow-200">
                        Staple
                      </span>
                    ) : null}
                    {hasWarn ? (
                      <span className="rounded bg-amber-500/20 px-1 text-[8px] font-semibold text-amber-200">
                        Guardrails
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10px] text-zinc-500">
                    {s.prescription.objective}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-600">
                    {s.hardEasy} · {s.duration}
                    {s.programmingStandards?.expectedRpe
                      ? ` · RPE ${s.programmingStandards.expectedRpe}`
                      : ""}
                  </p>
                  <PriorityMeta entry={s} />
                  <ExpandableStandards entry={s} />
                  {guardrails.length > 0 ? (
                    <p className="mt-1 line-clamp-2 text-[9px] text-amber-300/80">
                      {guardrails[0]?.message}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={!addTarget && !replaceMode}
                  onClick={() => onAdd(s)}
                  title={
                    addTarget || replaceMode
                      ? replaceMode
                        ? "Replace session"
                        : "Add to schedule"
                      : "Pick a day slot first"
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400/20 text-yellow-300 disabled:opacity-30"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
