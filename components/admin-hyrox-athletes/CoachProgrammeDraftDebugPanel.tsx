"use client";

import {
  countCoachDraftSessions,
  sessionPrescriptionPreview,
  type CoachDraftSession,
  type CoachDraftWeek,
} from "@/app/lib/hyroxCoachProgrammeDraft";

export type CoachDraftDebugState = {
  unsavedChanges: boolean;
  draftDirty: boolean;
  lastSavedAt: string | null;
  approvedDraftSessionCount: number;
  activeDraftId: string | null;
  localSelectedPreview: string;
  dbSelectedPreview: string;
  saveButtonClickedAt: string | null;
  saveRequestStartedAt: string | null;
  saveRequestFinishedAt: string | null;
  lastSaveStatus: "idle" | "saving" | "success" | "error";
  lastSaveError: string | null;
  savePayloadSessionCount: number;
  localFingerprint: string;
  savedFingerprint: string;
  dirtyBecause: string;
};

export function CoachProgrammeDraftDebugPanel({
  debug,
  selectedSessionTitle,
}: {
  debug: CoachDraftDebugState;
  selectedSessionTitle: string | null;
}) {
  return (
    <section className="rounded-2xl border border-sky-500/25 bg-sky-950/20 p-3 text-[10px] text-zinc-300">
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-sky-200">
        Draft save debug
      </h3>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        <Dt k="unsavedChanges" v={debug.unsavedChanges ? "yes" : "no"} warn={debug.unsavedChanges} />
        <Dt k="draftDirty" v={debug.draftDirty ? "yes" : "no"} warn={debug.draftDirty} />
        <Dt
          k="lastSavedAt"
          v={debug.lastSavedAt ? new Date(debug.lastSavedAt).toLocaleString() : "—"}
        />
        <Dt k="approvedDraftSessionCount" v={String(debug.approvedDraftSessionCount)} />
        <Dt k="activeDraftId" v={debug.activeDraftId?.slice(0, 8) ?? "—"} mono />
        <Dt k="lastSaveStatus" v={debug.lastSaveStatus} warn={debug.lastSaveStatus === "error"} />
        <Dt k="lastSaveError" v={debug.lastSaveError ?? "—"} className="col-span-2" warn={Boolean(debug.lastSaveError)} />
        <Dt k="savePayloadSessionCount" v={String(debug.savePayloadSessionCount)} />
        <Dt k="localFingerprint" v={debug.localFingerprint.slice(0, 24)} mono className="col-span-2" />
        <Dt k="savedFingerprint" v={debug.savedFingerprint.slice(0, 24)} mono className="col-span-2" />
        <Dt k="dirtyBecause" v={debug.dirtyBecause} className="col-span-2" warn={debug.draftDirty} />
        <Dt
          k="saveButtonClickedAt"
          v={debug.saveButtonClickedAt ? new Date(debug.saveButtonClickedAt).toLocaleTimeString() : "—"}
        />
        <Dt
          k="saveRequestStartedAt"
          v={debug.saveRequestStartedAt ? new Date(debug.saveRequestStartedAt).toLocaleTimeString() : "—"}
        />
        <Dt
          k="saveRequestFinishedAt"
          v={debug.saveRequestFinishedAt ? new Date(debug.saveRequestFinishedAt).toLocaleTimeString() : "—"}
        />
        {selectedSessionTitle ? (
          <Dt k="selected session" v={selectedSessionTitle} className="col-span-2" />
        ) : null}
        <Dt k="local preview" v={debug.localSelectedPreview} className="col-span-2" />
        <Dt k="DB after save" v={debug.dbSelectedPreview} className="col-span-2" />
      </dl>
    </section>
  );
}

function Dt({
  k,
  v,
  warn,
  mono,
  className,
}: {
  k: string;
  v: string;
  warn?: boolean;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-zinc-500">{k}</dt>
      <dd className={`${warn ? "font-bold text-amber-200" : "text-zinc-200"} ${mono ? "font-mono" : ""}`}>
        {v}
      </dd>
    </div>
  );
}

export function findSessionPreviewInDraft(
  draft: CoachDraftWeek,
  draftSessionId: string | null | undefined
): string {
  if (!draftSessionId) return "—";
  for (const day of draft.days) {
    const sess = day.sessions.find((s) => s.draftId === draftSessionId);
    if (sess) return sessionPrescriptionPreview(sess);
  }
  return "—";
}

export function countApprovedSessions(draft: CoachDraftWeek): number {
  return countCoachDraftSessions(draft).total;
}

export function findSessionByIndices(
  draft: CoachDraftWeek,
  dayIndex: number | null,
  sessionIndex: number | null
): CoachDraftSession | null {
  if (dayIndex == null || sessionIndex == null) return null;
  return draft.days[dayIndex]?.sessions[sessionIndex] ?? null;
}
