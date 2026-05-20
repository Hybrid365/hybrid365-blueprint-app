"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildAthleteWeekPreview } from "@/app/lib/buildAthleteWeekPreview";
import { generateWeeklyRationale } from "@/app/lib/generateWeeklyRationale";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import type { CoachLibraryEntry } from "@/app/lib/hyroxCoachSessionLibrary";
import {
  applyEditConfigToSession,
  computeWeeklySummary,
  duplicateAsOptional,
  generateCoachDraftWeek,
  sessionFromLibrary,
  validateCoachDraft,
  WEEKDAYS,
  type CoachDraftSession,
  type CoachDraftWeek,
  type CoachProgrammeStatus,
  type CoachSessionEditConfig,
  type WeekdayName,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import type { SandboxTimeOfDay } from "@/app/lib/hyroxProgrammeSandbox";
import { ProgrammeValidationPanel } from "@/components/admin-hyrox-athletes/ProgrammeValidationPanel";
import { SessionEditDrawer } from "@/components/admin-hyrox-athletes/SessionEditDrawer";
import { SessionLibraryPanel } from "@/components/admin-hyrox-athletes/SessionLibraryPanel";
import { WeeklyScheduleBuilder } from "@/components/admin-hyrox-athletes/WeeklyScheduleBuilder";
import { WeeklySummaryPanel } from "@/components/admin-hyrox-athletes/WeeklySummaryPanel";
import { AthleteWeekPreviewModal } from "@/components/admin-hyrox-athletes/AthleteWeekPreviewModal";
import { ProgrammeStatusBadge } from "@/components/admin-hyrox-athletes/StatusBadge";
import { WeeklyRationalePanel } from "@/components/admin-hyrox-athletes/WeeklyRationalePanel";

type MoveState = {
  dayIndex: number;
  sessionIndex: number;
  targetDay: WeekdayName;
  targetSlot: SandboxTimeOfDay;
} | null;

export function ProgrammeBuilder({
  athlete,
  programmeStatus,
  onStatusChange,
  coachNotes,
  onCoachNotesChange,
}: {
  athlete: CoachAthlete;
  programmeStatus: CoachProgrammeStatus;
  onStatusChange: (s: CoachProgrammeStatus) => void;
  coachNotes: {
    weeklyCoachNote: string;
    weekRationale: string;
    keyFocus: string;
    thingsToAvoid: string;
    athleteFacingNote: string;
  };
  onCoachNotesChange: (patch: Partial<typeof coachNotes>) => void;
}) {
  const [draft, setDraft] = useState<CoachDraftWeek>(() => generateCoachDraftWeek(athlete));
  const [status, setStatus] = useState(programmeStatus);
  const [toast, setToast] = useState<string | null>(null);
  const [addTarget, setAddTarget] = useState<{ day: WeekdayName; slot: SandboxTimeOfDay } | null>({
    day: "Mon",
    slot: "Main",
  });
  const [editTarget, setEditTarget] = useState<{
    dayIndex: number;
    sessionIndex: number;
  } | null>(null);
  const [moveState, setMoveState] = useState<MoveState>(null);
  const [replaceTarget, setReplaceTarget] = useState<{
    dayIndex: number;
    sessionIndex: number;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rationaleAutoFilled, setRationaleAutoFilled] = useState(false);
  const rationaleTouched = useRef(false);

  const summary = useMemo(() => computeWeeklySummary(draft, athlete), [draft, athlete]);
  const validation = useMemo(() => validateCoachDraft(draft, athlete), [draft, athlete]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const applyAutoRationale = useCallback(() => {
    const text = generateWeeklyRationale(athlete, draft);
    onCoachNotesChange({ weekRationale: text });
    setRationaleAutoFilled(true);
    showToast("Weekly note auto-filled from programme");
  }, [athlete, draft, onCoachNotesChange]);

  useEffect(() => {
    if (rationaleTouched.current || coachNotes.weekRationale.trim()) return;
    onCoachNotesChange({ weekRationale: generateWeeklyRationale(athlete, draft) });
    setRationaleAutoFilled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial auto-fill per draft generation
  }, [athlete.id, draft.block, draft.week, draft.generatedAt]);

  const athletePreview = useMemo(
    () => buildAthleteWeekPreview(athlete, draft, coachNotes),
    [athlete, draft, coachNotes]
  );

  const updateDay = useCallback(
    (dayIndex: number, updater: (sessions: CoachDraftSession[]) => CoachDraftSession[]) => {
      setDraft((prev) => ({
        ...prev,
        days: prev.days.map((d, i) =>
          i === dayIndex ? { ...d, sessions: updater(d.sessions) } : d
        ),
      }));
    },
    []
  );

  const handleAdd = (entry: CoachLibraryEntry) => {
    if (!addTarget) return;
    const session = sessionFromLibrary(athlete, entry.id, addTarget.slot);
    if (!session) return;
    const dayIndex = draft.days.findIndex((d) => d.day === addTarget.day);
    if (dayIndex < 0) return;
    updateDay(dayIndex, (s) => [...s, session]);
    showToast(`Added ${entry.name} to ${addTarget.day} ${addTarget.slot}`);
    setStatus("edited_draft");
    onStatusChange("edited_draft");
  };

  const handleLibraryAddForReplace = (entry: CoachLibraryEntry) => {
    if (!replaceTarget) return;
    const session = sessionFromLibrary(athlete, entry.id, "Main");
    if (!session) return;
    updateDay(replaceTarget.dayIndex, (sessions) =>
      sessions.map((s, i) => (i === replaceTarget.sessionIndex ? session : s))
    );
    setReplaceTarget(null);
    showToast(`Replaced with ${entry.name}`);
    setStatus("edited_draft");
    onStatusChange("edited_draft");
  };

  const editSession = editTarget
    ? draft.days[editTarget.dayIndex]?.sessions[editTarget.sessionIndex]
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Block {draft.block} · Week {draft.week} · generated{" "}
          {new Date(draft.generatedAt).toLocaleString()}
        </p>
        <div className="flex flex-wrap gap-2">
          <ProgrammeStatusBadge status={status} />
          <button
            type="button"
            onClick={() => {
              setDraft(generateCoachDraftWeek(athlete));
              rationaleTouched.current = false;
              showToast("Regenerated from methodology");
              setStatus("generated_draft");
              onStatusChange("generated_draft");
            }}
            className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300"
          >
            Regenerate draft
          </button>
        </div>
      </div>

      {toast ? (
        <p className="rounded-lg border border-yellow-500/30 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-200">
          {toast}
        </p>
      ) : null}

      <div className="grid min-h-[640px] grid-cols-1 gap-4 xl:grid-cols-[280px_1fr_300px]">
        <SessionLibraryPanel
          addTarget={replaceTarget ? null : addTarget}
          onAdd={replaceTarget ? handleLibraryAddForReplace : handleAdd}
          equipmentAvailable={athlete.programmeInputs.equipment}
        />
        <WeeklyScheduleBuilder
          days={draft.days}
          addTarget={addTarget}
          onSelectAddTarget={(day, slot) => setAddTarget({ day, slot })}
          onEdit={(di, si) => setEditTarget({ dayIndex: di, sessionIndex: si })}
          onMove={(di, si) =>
            setMoveState({
              dayIndex: di,
              sessionIndex: si,
              targetDay: draft.days[di]?.day as WeekdayName,
              targetSlot: draft.days[di]?.sessions[si]?.timeOfDay ?? "Main",
            })
          }
          onReplace={(di, si) => setReplaceTarget({ dayIndex: di, sessionIndex: si })}
          onRemove={(di, si) => {
            updateDay(di, (s) => s.filter((_, i) => i !== si));
            showToast("Session removed");
            setStatus("edited_draft");
            onStatusChange("edited_draft");
          }}
          onDuplicate={(di, si) => {
            const src = draft.days[di]?.sessions[si];
            if (!src) return;
            updateDay(di, (s) => [...s, duplicateAsOptional(src)]);
            showToast("Duplicated as optional add-on");
          }}
          onViewDetail={(di, si) => {
            updateDay(di, (s) =>
              s.map((sess, i) =>
                i === si ? { ...sess, showDetail: !sess.showDetail } : sess
              )
            );
          }}
        />
        <aside className="flex flex-col gap-4 overflow-y-auto">
          <WeeklySummaryPanel summary={summary} />
          <ProgrammeValidationPanel
            warnings={validation.warnings}
            positives={validation.positives}
          />
          <WeeklyRationalePanel
            value={coachNotes.weekRationale}
            onChange={(v) => {
              rationaleTouched.current = true;
              onCoachNotesChange({ weekRationale: v });
            }}
            onRegenerate={applyAutoRationale}
            autoFilled={rationaleAutoFilled}
          />
          <PublishPanel
            status={status}
            onPreview={() => setPreviewOpen(true)}
            onSaveDraft={() => {
              setStatus("coach_reviewing");
              onStatusChange("coach_reviewing");
              showToast("Draft saved (local)");
            }}
            onApprove={() => {
              setStatus("approved");
              onStatusChange("approved");
              showToast("Week approved");
            }}
            onPublish={() => {
              setStatus("published");
              onStatusChange("published");
              showToast("Published to athlete dashboard (mock)");
            }}
          />
          <CoachNotesPanel notes={coachNotes} onChange={onCoachNotesChange} />
        </aside>
      </div>

      <SessionEditDrawer
        session={editSession ?? null}
        open={editTarget != null}
        onClose={() => setEditTarget(null)}
        onSave={(config: CoachSessionEditConfig) => {
          if (!editTarget) return;
          updateDay(editTarget.dayIndex, (sessions) =>
            sessions.map((s, i) => {
              if (i !== editTarget.sessionIndex) return s;
              const updated = { ...s, editConfig: config };
              return applyEditConfigToSession(updated);
            })
          );
          setEditTarget(null);
          setStatus("edited_draft");
          onStatusChange("edited_draft");
          showToast("Session updated");
        }}
      />

      {moveState ? (
        <MoveModal
          initialDay={moveState.targetDay}
          initialSlot={moveState.targetSlot}
          onClose={() => setMoveState(null)}
          onConfirm={(targetDay, targetSlot) => {
            const moving = draft.days[moveState.dayIndex]?.sessions[moveState.sessionIndex];
            if (!moving) return;
            const destIdx = draft.days.findIndex((d) => d.day === targetDay);
            if (destIdx < 0) return;
            const fromIdx = moveState.dayIndex;
            const fromSi = moveState.sessionIndex;
            setDraft((prev) => ({
              ...prev,
              days: prev.days.map((d, i) => {
                if (i === fromIdx) {
                  return {
                    ...d,
                    sessions: d.sessions.filter((_, si) => si !== fromSi),
                  };
                }
                if (i === destIdx) {
                  return {
                    ...d,
                    sessions: [...d.sessions, { ...moving, timeOfDay: targetSlot }],
                  };
                }
                return d;
              }),
            }));
            setMoveState(null);
            showToast(`Moved to ${targetDay} ${targetSlot}`);
            setStatus("edited_draft");
            onStatusChange("edited_draft");
          }}
        />
      ) : null}

      <AthleteWeekPreviewModal
        preview={athletePreview}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      {replaceTarget ? (
        <p className="text-center text-xs text-sky-300">
          Replace mode — pick a session from the library (left panel), then selection applies.
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setReplaceTarget(null)}
          >
            Cancel
          </button>
        </p>
      ) : null}
    </div>
  );
}

function PublishPanel({
  status,
  onPreview,
  onSaveDraft,
  onApprove,
  onPublish,
}: {
  status: CoachProgrammeStatus;
  onPreview: () => void;
  onSaveDraft: () => void;
  onApprove: () => void;
  onPublish: () => void;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <h2 className="text-sm font-bold text-white">Publish</h2>
      <p className="mt-1 text-[11px] text-zinc-500">Local mock state only</p>
      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={onPreview}
          className="rounded-full border border-yellow-500/40 bg-yellow-400/10 py-2 text-xs font-bold text-yellow-200"
        >
          Preview as athlete
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          className="rounded-full border border-zinc-600 py-2 text-xs font-semibold text-zinc-200"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={onApprove}
          className="rounded-full border border-emerald-500/40 bg-emerald-400/10 py-2 text-xs font-bold text-emerald-200"
        >
          Approve week
        </button>
        <button
          type="button"
          onClick={onPublish}
          className="rounded-full bg-yellow-400 py-2 text-xs font-black text-zinc-950"
        >
          Publish to athlete dashboard
        </button>
      </div>
      <p className="mt-2 text-[10px] text-zinc-600">Status: {status.replace(/_/g, " ")}</p>
    </section>
  );
}

function CoachNotesPanel({
  notes,
  onChange,
}: {
  notes: {
    weeklyCoachNote: string;
    weekRationale: string;
    keyFocus: string;
    thingsToAvoid: string;
    athleteFacingNote: string;
  };
  onChange: (patch: Partial<typeof notes>) => void;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <h2 className="text-sm font-bold text-white">Coach notes</h2>
      <div className="mt-3 space-y-2">
        <Note label="Weekly coach note" value={notes.weeklyCoachNote} onChange={(v) => onChange({ weeklyCoachNote: v })} />
        <Note label="Key focus" value={notes.keyFocus} onChange={(v) => onChange({ keyFocus: v })} />
        <Note label="Things to avoid" value={notes.thingsToAvoid} onChange={(v) => onChange({ thingsToAvoid: v })} />
        <Note label="Athlete-facing note" value={notes.athleteFacingNote} onChange={(v) => onChange({ athleteFacingNote: v })} />
      </div>
    </section>
  );
}

function Note({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-[10px] text-zinc-500">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="mt-0.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white"
      />
    </label>
  );
}

function MoveModal({
  initialDay,
  initialSlot,
  onClose,
  onConfirm,
}: {
  initialDay: WeekdayName;
  initialSlot: SandboxTimeOfDay;
  onClose: () => void;
  onConfirm: (day: WeekdayName, slot: SandboxTimeOfDay) => void;
}) {
  const [day, setDay] = useState(initialDay);
  const [slot, setSlot] = useState(initialSlot);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
        <h3 className="font-bold text-white">Move session</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-xs text-zinc-500">
            Day
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as WeekdayName)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
            >
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Slot
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value as SandboxTimeOfDay)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
            >
              {(["AM", "Main", "PM", "Optional"] as SandboxTimeOfDay[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm text-zinc-400">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(day, slot)}
            className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950"
          >
            Confirm move
          </button>
        </div>
      </div>
    </div>
  );
}
