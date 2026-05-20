"use client";

import {
  TIME_OF_DAY_OPTIONS,
  WEEKDAYS,
  type CoachDraftSession,
  type WeekdayName,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import type { SandboxTimeOfDay } from "@/app/lib/hyroxProgrammeSandbox";

export type SessionModalMode = "edit" | "move" | "replace" | "add" | null;

export function SessionActionModal({
  mode,
  session,
  targetDay,
  targetSlot,
  coachNote,
  onCoachNoteChange,
  onTargetDayChange,
  onTargetSlotChange,
  onConfirm,
  onClose,
}: {
  mode: SessionModalMode;
  session: CoachDraftSession | null;
  targetDay: WeekdayName;
  targetSlot: SandboxTimeOfDay;
  coachNote: string;
  onCoachNoteChange: (v: string) => void;
  onTargetDayChange: (d: WeekdayName) => void;
  onTargetSlotChange: (s: SandboxTimeOfDay) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!mode) return null;

  const titles: Record<NonNullable<SessionModalMode>, string> = {
    edit: "Edit session note",
    move: "Move session",
    replace: "Replace session",
    add: "Add optional session",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-white">{titles[mode]}</h3>
        {session ? (
          <p className="mt-1 text-sm text-zinc-500">{session.title}</p>
        ) : null}

        {(mode === "move" || mode === "add") && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block text-xs text-zinc-500">
              Day
              <select
                value={targetDay}
                onChange={(e) => onTargetDayChange(e.target.value as WeekdayName)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
              >
                {WEEKDAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-zinc-500">
              Slot
              <select
                value={targetSlot}
                onChange={(e) => onTargetSlotChange(e.target.value as SandboxTimeOfDay)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
              >
                {TIME_OF_DAY_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {(mode === "edit" || mode === "replace") && (
          <label className="mt-4 block text-xs text-zinc-500">
            Coach note (session-specific)
            <textarea
              value={coachNote}
              onChange={(e) => onCoachNoteChange(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
              placeholder="Cue for this session…"
            />
          </label>
        )}

        {mode === "replace" ? (
          <p className="mt-3 text-xs text-yellow-400/80">
            Select a replacement from the session library panel, then confirm.
          </p>
        ) : null}

        {mode === "add" ? (
          <p className="mt-3 text-xs text-zinc-500">
            Pick a session from the library, then confirm to add as optional add-on.
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
