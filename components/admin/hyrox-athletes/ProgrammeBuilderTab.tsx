"use client";

import { useCallback, useMemo, useState } from "react";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import {
  computeWeeklySummary,
  generateCoachDraftWeek,
  sessionFromLibrary,
  validateCoachDraft,
  type CoachDraftDay,
  type CoachDraftSession,
  type CoachDraftWeek,
  type CoachProgrammeStatus,
  type WeekdayName,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import type { SandboxTimeOfDay } from "@/app/lib/hyroxProgrammeSandbox";
import { DraftSessionCard } from "@/components/admin/hyrox-athletes/DraftSessionCard";
import { ProgrammeValidationPanel } from "@/components/admin/hyrox-athletes/ProgrammeValidationPanel";
import { PublishBar } from "@/components/admin/hyrox-athletes/PublishBar";
import {
  SessionActionModal,
  type SessionModalMode,
} from "@/components/admin/hyrox-athletes/SessionActionModal";
import { SessionLibraryPanel } from "@/components/admin/hyrox-athletes/SessionLibraryPanel";
import { WeeklySummaryPanel } from "@/components/admin/hyrox-athletes/WeeklySummaryPanel";
import { DashCard, SectionHeading } from "@/components/hyrox-team/HyroxDashboardUi";

type ModalTarget = {
  dayIndex: number;
  sessionIndex: number;
  session: CoachDraftSession;
};

export function ProgrammeBuilderTab({
  athlete,
  programmeStatus,
  onStatusChange,
  weeklyCoachNote,
  weekRationale,
  thingsToAvoid,
  keyFocus,
  onCoachNotesChange,
}: {
  athlete: CoachAthlete;
  programmeStatus: CoachProgrammeStatus;
  onStatusChange: (s: CoachProgrammeStatus) => void;
  weeklyCoachNote: string;
  weekRationale: string;
  thingsToAvoid: string;
  keyFocus: string;
  onCoachNotesChange: (patch: {
    weeklyCoachNote?: string;
    weekRationale?: string;
    thingsToAvoid?: string;
    keyFocus?: string;
  }) => void;
}) {
  const [draft, setDraft] = useState<CoachDraftWeek>(() => generateCoachDraftWeek(athlete));
  const [status, setStatus] = useState(programmeStatus);
  const [toast, setToast] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<SessionModalMode>(null);
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);
  const [pendingLibraryId, setPendingLibraryId] = useState<string | null>(null);
  const [targetDay, setTargetDay] = useState<WeekdayName>("Mon");
  const [targetSlot, setTargetSlot] = useState<SandboxTimeOfDay>("Optional");
  const [coachNoteDraft, setCoachNoteDraft] = useState("");

  const summary = useMemo(() => computeWeeklySummary(draft, athlete), [draft, athlete]);
  const validation = useMemo(() => validateCoachDraft(draft, athlete), [draft, athlete]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const updateDay = useCallback((dayIndex: number, updater: (d: CoachDraftDay) => CoachDraftDay) => {
    setDraft((prev) => ({
      ...prev,
      days: prev.days.map((d, i) => (i === dayIndex ? updater(d) : d)),
    }));
  }, []);

  const openModal = (
    mode: SessionModalMode,
    dayIndex: number,
    sessionIndex: number,
    session: CoachDraftSession
  ) => {
    setModalMode(mode);
    setModalTarget({ dayIndex, sessionIndex, session });
    setCoachNoteDraft(session.coachNote);
    setTargetDay(draft.days[dayIndex]?.day as WeekdayName);
    setTargetSlot(session.timeOfDay);
  };

  const handleLibrarySelect = (sessionId: string) => {
    setPendingLibraryId(sessionId);
    if (modalMode === "replace" || modalMode === "add") {
      showToast(`Selected: ${sessionId} — confirm in modal`);
    }
  };

  const confirmModal = () => {
    if (!modalTarget || !modalMode) return;
    const { dayIndex, sessionIndex, session } = modalTarget;

    if (modalMode === "edit") {
      updateDay(dayIndex, (d) => ({
        ...d,
        sessions: d.sessions.map((s, i) =>
          i === sessionIndex ? { ...s, coachNote: coachNoteDraft } : s
        ),
      }));
      showToast("Session note updated");
    }

    if (modalMode === "move") {
      const moving = { ...session, coachNote: coachNoteDraft, timeOfDay: targetSlot };
      const destIdx = draft.days.findIndex((d) => d.day === targetDay);
      if (destIdx < 0) return;
      setDraft((prev) => ({
        ...prev,
        days: prev.days.map((d, i) => {
          if (i === dayIndex) {
            return { ...d, sessions: d.sessions.filter((_, si) => si !== sessionIndex) };
          }
          if (i === destIdx) {
            return { ...d, sessions: [...d.sessions, moving] };
          }
          return d;
        }),
      }));
      showToast(`Moved to ${targetDay} ${targetSlot}`);
    }

    if (modalMode === "replace" && pendingLibraryId) {
      const replacement = sessionFromLibrary(athlete, pendingLibraryId, session.timeOfDay);
      if (replacement) {
        replacement.coachNote = coachNoteDraft;
        updateDay(dayIndex, (d) => ({
          ...d,
          sessions: d.sessions.map((s, i) => (i === sessionIndex ? replacement : s)),
        }));
        showToast("Session replaced");
      }
    }

    if (modalMode === "add" && pendingLibraryId) {
      const added = sessionFromLibrary(athlete, pendingLibraryId, targetSlot);
      const destIdx = draft.days.findIndex((d) => d.day === targetDay);
      if (added && destIdx >= 0) {
        added.isOptional = true;
        added.badges = [...added.badges, "Optional Add-On"];
        updateDay(destIdx, (d) => ({ ...d, sessions: [...d.sessions, added] }));
        showToast(`Added to ${targetDay}`);
      }
    }

    setModalMode(null);
    setModalTarget(null);
    setPendingLibraryId(null);
  };

  const removeSession = (dayIndex: number, sessionIndex: number) => {
    updateDay(dayIndex, (d) => ({
      ...d,
      sessions: d.sessions.filter((_, i) => i !== sessionIndex),
    }));
    showToast("Session removed");
  };

  const regenerate = () => {
    setDraft(generateCoachDraftWeek(athlete));
    setStatus("generated_draft");
    onStatusChange("generated_draft");
    showToast("Regenerated draft from methodology");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">
            Block {draft.block} · Week {draft.week} · generated{" "}
            {new Date(draft.generatedAt).toLocaleString()}
          </p>
        </div>
        <button
          type="button"
          onClick={regenerate}
          className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-yellow-500/40"
        >
          Regenerate from rules
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {draft.days.map((day, dayIndex) => (
            <DashCard key={day.day} className="!p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-yellow-400/90">{day.day}</p>
                  <p className="text-xs text-zinc-500">
                    {day.roleLabel} · {day.hardEasyLabel}
                    {day.thresholdMinutes > 0 ? ` · ${day.thresholdMinutes} threshold min` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalMode("add");
                    setModalTarget(null);
                    setTargetDay(day.day as WeekdayName);
                    setTargetSlot("Optional");
                    setPendingLibraryId(null);
                  }}
                  className="text-[11px] font-semibold text-sky-300 hover:text-sky-200"
                >
                  + Add optional
                </button>
              </div>
              {day.intensity === "rest" || day.sessions.length === 0 ? (
                <p className="text-sm text-zinc-500">Rest / no sessions</p>
              ) : (
                <div className="space-y-3">
                  {day.sessions.map((session, sessionIndex) => (
                    <DraftSessionCard
                      key={session.draftId}
                      session={session}
                      hardEasyLabel={day.hardEasyLabel}
                      onEdit={() => openModal("edit", dayIndex, sessionIndex, session)}
                      onMove={() => openModal("move", dayIndex, sessionIndex, session)}
                      onReplace={() => {
                        openModal("replace", dayIndex, sessionIndex, session);
                        setPendingLibraryId(null);
                      }}
                      onRemove={() => removeSession(dayIndex, sessionIndex)}
                    />
                  ))}
                </div>
              )}
            </DashCard>
          ))}

          <DashCard>
            <SectionHeading title="Coach notes — this week" />
            <div className="grid gap-3 sm:grid-cols-2">
              <NoteField
                label="Weekly coach note"
                value={weeklyCoachNote}
                onChange={(v) => onCoachNotesChange({ weeklyCoachNote: v })}
              />
              <NoteField
                label="Why this week is built this way"
                value={weekRationale}
                onChange={(v) => onCoachNotesChange({ weekRationale: v })}
              />
              <NoteField
                label="Things to avoid"
                value={thingsToAvoid}
                onChange={(v) => onCoachNotesChange({ thingsToAvoid: v })}
              />
              <NoteField
                label="Key focus"
                value={keyFocus}
                onChange={(v) => onCoachNotesChange({ keyFocus: v })}
              />
            </div>
          </DashCard>
        </div>

        <div className="space-y-4">
          <WeeklySummaryPanel summary={summary} />
          <ProgrammeValidationPanel
            warnings={validation.warnings}
            positives={validation.positives}
          />
          <SessionLibraryPanel
            onSelect={handleLibrarySelect}
            selectedId={pendingLibraryId}
          />
        </div>
      </div>

      <PublishBar
        status={status}
        toast={toast}
        onSaveDraft={() => {
          setStatus("coach_reviewing");
          onStatusChange("coach_reviewing");
          showToast("Draft saved locally");
        }}
        onApprove={() => {
          setStatus("approved");
          onStatusChange("approved");
          showToast("Week approved — ready to publish");
        }}
        onPublish={() => {
          setStatus("published");
          onStatusChange("published");
          showToast("Published to athlete dashboard (mock)");
        }}
      />

      <SessionActionModal
        mode={modalMode}
        session={modalTarget?.session ?? null}
        targetDay={targetDay}
        targetSlot={targetSlot}
        coachNote={coachNoteDraft}
        onCoachNoteChange={setCoachNoteDraft}
        onTargetDayChange={setTargetDay}
        onTargetSlotChange={setTargetSlot}
        onConfirm={confirmModal}
        onClose={() => {
          setModalMode(null);
          setModalTarget(null);
        }}
      />
    </div>
  );
}

function NoteField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs text-zinc-500">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
      />
    </label>
  );
}
