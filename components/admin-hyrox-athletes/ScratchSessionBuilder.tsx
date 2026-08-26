"use client";

import { useMemo, useState } from "react";
import {
  CUSTOM_PART_TYPE_LABELS,
  CUSTOM_PART_TYPES,
  SCRATCH_FOCUS_OPTIONS,
  emptyCustomPart,
  fieldsForCustomPartType,
  type CoachCustomPartType,
  type CoachCustomSessionPart,
  type CustomPartFieldKey,
} from "@/app/lib/hyroxCoachCustomSession";
import type { LibraryCategory } from "@/app/lib/hyroxCoachSessionLibrary";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";

const FIELD_LABELS: Record<CustomPartFieldKey, string> = {
  sets: "Sets",
  reps: "Reps",
  rounds: "Rounds",
  duration: "Duration",
  distance: "Distance",
  targetPace: "Target pace",
  targetSplit: "Target split",
  watts: "Watts",
  hr: "HR",
  rpe: "RPE",
  load: "Load / prescription",
  rest: "Rest / recovery",
  notes: "Notes",
};

const FIELD_PLACEHOLDERS: Partial<Record<CustomPartFieldKey, string>> = {
  sets: "e.g. 5",
  reps: "e.g. 25",
  rounds: "e.g. 4",
  duration: "e.g. 5 min",
  distance: "e.g. 25m / 800m / 1km",
  targetPace: "e.g. HYROX target pace",
  targetSplit: "e.g. target Ski/Row split",
  watts: "e.g. prescribed watts",
  hr: "e.g. Z2",
  rpe: "e.g. 5",
  load: "e.g. race load / coach-prescribed",
  rest: "e.g. 60s recovery",
  notes: "Coaching cue",
};

export type ScratchSessionSavePayload = {
  sessionName: string;
  libraryCategory: LibraryCategory;
  objective: string;
  duration: string;
  rpeTarget: string;
  hrZone: string;
  coachNote: string;
  warmUpLines: string[];
  coolDownLines: string[];
  customParts: CoachCustomSessionPart[];
};

export function ScratchSessionBuilder({
  open,
  slotLabel,
  onClose,
  onSave,
}: {
  open: boolean;
  slotLabel: string;
  onClose: () => void;
  onSave: (payload: ScratchSessionSavePayload) => void;
}) {
  const [sessionName, setSessionName] = useState("");
  const [focusId, setFocusId] = useState(SCRATCH_FOCUS_OPTIONS[1]?.id ?? "hyrox");
  const [objective, setObjective] = useState("");
  const [duration, setDuration] = useState("50 min");
  const [rpeTarget, setRpeTarget] = useState("RPE 6–7");
  const [hrZone, setHrZone] = useState("");
  const [coachNote, setCoachNote] = useState("");
  const [warmUpLines, setWarmUpLines] = useState<string[]>([""]);
  const [coolDownLines, setCoolDownLines] = useState<string[]>([""]);
  const [parts, setParts] = useState<CoachCustomSessionPart[]>([emptyCustomPart("run")]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const focus = useMemo(
    () => SCRATCH_FOCUS_OPTIONS.find((o) => o.id === focusId) ?? SCRATCH_FOCUS_OPTIONS[0]!,
    [focusId]
  );

  if (!open) return null;

  const patchPart = (id: string, patch: Partial<CoachCustomSessionPart>) => {
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const addPart = (type: CoachCustomPartType) => {
    const next = emptyCustomPart(type);
    setParts((prev) => [...prev, next]);
  };

  const handleSave = () => {
    onSave({
      sessionName,
      libraryCategory: focus.libraryCategory,
      objective,
      duration,
      rpeTarget,
      hrZone,
      coachNote,
      warmUpLines,
      coolDownLines,
      customParts: parts,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden border-zinc-700 bg-zinc-950 sm:h-[min(92dvh,900px)] sm:rounded-2xl sm:border">
        <header className="flex items-start justify-between gap-3 border-b border-zinc-800 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-yellow-400/80">
              Build from scratch
            </p>
            <h2 className="text-lg font-bold text-white">New custom session</h2>
            <p className="text-[11px] text-zinc-500">{slotLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400">Session details</h3>
            <label className="block text-xs text-zinc-500">
              Session name
              <input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Sled Strength Endurance + Compromised Run"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-white"
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Session focus / category
              <select
                value={focusId}
                onChange={(e) => setFocusId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-white"
              >
                {SCRATCH_FOCUS_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-zinc-500">
              Objective
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={3}
                placeholder="What this session trains…"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-white"
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block text-xs text-zinc-500">
                Estimated duration
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Target RPE
                <input
                  value={rpeTarget}
                  onChange={(e) => setRpeTarget(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                HR zone (optional)
                <input
                  value={hrZone}
                  onChange={(e) => setHrZone(e.target.value)}
                  placeholder="e.g. Z2"
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-white"
                />
              </label>
            </div>
            <label className="block text-xs text-zinc-500">
              Coach notes (optional)
              <textarea
                value={coachNote}
                onChange={(e) => setCoachNote(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-white"
              />
            </label>
          </section>

          <LineListSection
            title="Warm up"
            addLabel="Add instruction"
            lines={warmUpLines}
            onChange={setWarmUpLines}
          />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400">Main session</h3>
              <p className="text-[10px] text-zinc-600">{parts.length} part{parts.length === 1 ? "" : "s"}</p>
            </div>
            {parts.map((part, index) => {
              const isCollapsed = collapsed[part.id];
              const fields = fieldsForCustomPartType(part.type);
              return (
                <article key={part.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsed((prev) => ({ ...prev, [part.id]: !prev[part.id] }))
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 text-zinc-400"
                      aria-label={isCollapsed ? "Expand part" : "Collapse part"}
                    >
                      {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </button>
                    <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">
                      Part {index + 1} — {part.title || CUSTOM_PART_TYPE_LABELS[part.type]}
                    </p>
                    <button
                      type="button"
                      onClick={() => setParts((prev) => prev.filter((p) => p.id !== part.id))}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/30 text-red-300"
                      aria-label="Remove part"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {!isCollapsed ? (
                    <div className="mt-3 space-y-3">
                      <label className="block text-xs text-zinc-500">
                        Part title
                        <input
                          value={part.title}
                          onChange={(e) => patchPart(part.id, { title: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white"
                        />
                      </label>
                      <label className="block text-xs text-zinc-500">
                        Part type
                        <select
                          value={part.type}
                          onChange={(e) => {
                            const type = e.target.value as CoachCustomPartType;
                            patchPart(part.id, {
                              type,
                              title: part.title.trim() ? part.title : CUSTOM_PART_TYPE_LABELS[type],
                            });
                          }}
                          className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white"
                        >
                          {CUSTOM_PART_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {CUSTOM_PART_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs text-zinc-500">
                        Instructions / content
                        <textarea
                          value={part.instructions}
                          onChange={(e) => patchPart(part.id, { instructions: e.target.value })}
                          rows={3}
                          className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white"
                        />
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {fields.map((key) =>
                          key === "notes" ? (
                            <label key={key} className="block text-xs text-zinc-500 sm:col-span-2">
                              {FIELD_LABELS[key]}
                              <input
                                value={part[key] ?? ""}
                                onChange={(e) => patchPart(part.id, { [key]: e.target.value })}
                                placeholder={FIELD_PLACEHOLDERS[key]}
                                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white"
                              />
                            </label>
                          ) : (
                            <label key={key} className="block text-xs text-zinc-500">
                              {FIELD_LABELS[key]}
                              <input
                                value={part[key] ?? ""}
                                onChange={(e) => patchPart(part.id, { [key]: e.target.value })}
                                placeholder={FIELD_PLACEHOLDERS[key]}
                                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white"
                              />
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
            <div>
              <p className="mb-2 text-[11px] font-semibold text-zinc-500">Add part</p>
              <div className="flex flex-wrap gap-2">
                {CUSTOM_PART_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addPart(t)}
                    className="min-h-11 rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-yellow-500/40 hover:text-yellow-100"
                  >
                    + {CUSTOM_PART_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <LineListSection
            title="Cool down"
            addLabel="Add instruction"
            lines={coolDownLines}
            onChange={setCoolDownLines}
          />
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-zinc-800 p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-full border border-zinc-600 px-5 text-sm font-semibold text-zinc-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-12 rounded-full bg-yellow-400 px-5 text-sm font-black text-zinc-950"
          >
            Save session into programme
          </button>
        </footer>
      </div>
    </div>
  );
}

function LineListSection({
  title,
  addLabel,
  lines,
  onChange,
}: {
  title: string;
  addLabel: string;
  lines: string[];
  onChange: (lines: string[]) => void;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400">{title}</h3>
      {lines.map((line, i) => (
        <div key={`${title}-${i}`} className="flex gap-2">
          <input
            value={line}
            onChange={(e) =>
              onChange(lines.map((l, idx) => (idx === i ? e.target.value : l)))
            }
            placeholder="Instruction"
            className="min-h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
          />
          <button
            type="button"
            onClick={() => onChange(lines.filter((_, idx) => idx !== i))}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 text-zinc-500"
            aria-label="Remove instruction"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...lines, ""])}
        className="flex min-h-11 items-center gap-1 rounded-full border border-zinc-700 px-4 text-xs font-semibold text-zinc-200"
      >
        <Plus className="h-4 w-4" /> {addLabel}
      </button>
    </section>
  );
}
