import type { CoachDraftSession, CoachDraftWeek } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { HyroxJson, HyroxProgrammeSessionRow } from "@/app/lib/hyroxDatabaseTypes";

export type DraftSessionInsertRow = {
  day_of_week: string;
  session_slot: string;
  session_name: string;
  category: string;
  prescription: HyroxJson;
  metadata: HyroxJson | null;
};

export type SessionMatchSource = "metadata.draftId" | "day+slot" | "none";

export type PublishSessionSyncDetail = {
  draftSessionId: string | null;
  draftTitle: string;
  draftPreview: string;
  matchedPublishedSessionId: string | null;
  matchSource: SessionMatchSource;
  previousPublishedTitle: string | null;
  previousPublishedPreview: string | null;
  newPublishedPreview: string | null;
  changedFields: string[];
  updateAttempted: boolean;
  updateSuccess: boolean;
  unchangedReason: string | null;
  syncError: string | null;
};

export type PublishWeekVerification = {
  verificationPassed: boolean;
  missingOrUnsyncedDraftSessionTitles: string[];
  livePreviewForEditedSessions: Array<{
    draftSessionId: string | null;
    draftTitle: string;
    preview: string;
    publishedSessionId: string | null;
    publishedPreview: string | null;
  }>;
  errors: string[];
};

export function sessionRowKey(dayOfWeek: string, sessionSlot: string): string {
  return `${dayOfWeek}|${sessionSlot}`;
}

export function draftIdFromMetadata(metadata: HyroxJson | null | undefined): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const id = (metadata as Record<string, unknown>).draftId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

/** Name written to hyrox_programme_sessions.session_name (athlete UI primary label). */
export function derivePublishedSessionName(sess: CoachDraftSession): string {
  return sess.title?.trim() || sess.editConfig?.sessionName?.trim() || "Session";
}

export function pickSessionSyncFields(row: {
  day_of_week: string;
  session_slot: string;
  session_name: string;
  category: string;
  prescription: HyroxJson;
  metadata: HyroxJson | null;
}) {
  return {
    day_of_week: row.day_of_week,
    session_slot: row.session_slot,
    session_name: row.session_name,
    category: row.category,
    prescription: row.prescription,
    metadata: row.metadata,
  };
}

function editConfigFromPrescription(prescription: HyroxJson | null | undefined): Record<string, unknown> {
  if (!prescription || typeof prescription !== "object" || Array.isArray(prescription)) return {};
  const cfg = (prescription as Record<string, unknown>).editConfig;
  return cfg && typeof cfg === "object" && !Array.isArray(cfg)
    ? (cfg as Record<string, unknown>)
    : {};
}

/** Athlete-facing display name from a published DB row. */
export function resolveAthleteSessionDisplayName(row: HyroxProgrammeSessionRow): string {
  const cfg = editConfigFromPrescription(row.prescription);
  const cfgName = typeof cfg.sessionName === "string" ? cfg.sessionName.trim() : "";
  return cfgName || row.session_name?.trim() || "Session";
}

export function publishedSessionLivePreview(row: HyroxProgrammeSessionRow): string {
  const cfg = editConfigFromPrescription(row.prescription);
  const parts = [resolveAthleteSessionDisplayName(row), row.category];
  if (typeof cfg.ergReps === "number" && typeof cfg.intervalDurationMinutes === "number") {
    parts.push(`${cfg.ergReps} x ${cfg.intervalDurationMinutes} min`);
  } else if (typeof cfg.reps === "number" && typeof cfg.repDurationMinutes === "number") {
    parts.push(`${cfg.reps} x ${cfg.repDurationMinutes} min`);
  }
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  if (typeof meta.duration === "string") parts.push(meta.duration);
  if (typeof meta.intent === "string") parts.push(meta.intent);
  return parts.filter(Boolean).join(" · ");
}

export function draftInsertRowPreview(row: DraftSessionInsertRow): string {
  const cfg = editConfigFromPrescription(row.prescription);
  const parts = [row.session_name, row.category];
  if (typeof cfg.ergReps === "number" && typeof cfg.intervalDurationMinutes === "number") {
    parts.push(`${cfg.ergReps} x ${cfg.intervalDurationMinutes} min`);
  } else if (typeof cfg.reps === "number" && typeof cfg.repDurationMinutes === "number") {
    parts.push(`${cfg.reps} x ${cfg.repDurationMinutes} min`);
  }
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  if (typeof meta.duration === "string") parts.push(meta.duration);
  if (typeof meta.intent === "string") parts.push(meta.intent);
  return parts.filter(Boolean).join(" · ");
}

function stableJson(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableJson(obj[k])}`).join(",")}}`;
}

export function diffSessionSyncFields(
  existing: Pick<
    HyroxProgrammeSessionRow,
    "day_of_week" | "session_slot" | "session_name" | "category" | "prescription" | "metadata"
  >,
  draft: DraftSessionInsertRow
): string[] {
  const changed: string[] = [];
  const fields = pickSessionSyncFields(existing);
  const next = pickSessionSyncFields(draft);
  for (const key of Object.keys(next) as Array<keyof typeof next>) {
    if (stableJson(fields[key]) !== stableJson(next[key])) {
      changed.push(key);
    }
  }
  return changed;
}

export function findPublishedSessionForDraftRow(
  existing: HyroxProgrammeSessionRow[],
  draftRow: DraftSessionInsertRow,
  usedIds: Set<string>
): { row: HyroxProgrammeSessionRow | undefined; source: SessionMatchSource } {
  const draftId = draftIdFromMetadata(draftRow.metadata);
  if (draftId) {
    const byDraftId = existing.find(
      (row) => !usedIds.has(row.id) && draftIdFromMetadata(row.metadata) === draftId
    );
    if (byDraftId) return { row: byDraftId, source: "metadata.draftId" };
  }
  const key = sessionRowKey(draftRow.day_of_week, draftRow.session_slot);
  const bySlot = existing.find(
    (row) =>
      !usedIds.has(row.id) && sessionRowKey(row.day_of_week, row.session_slot) === key
  );
  if (bySlot) return { row: bySlot, source: "day+slot" };
  return { row: undefined, source: "none" };
}

export function verifyPublishedWeekMatchesDraft(params: {
  draftRows: DraftSessionInsertRow[];
  publishedRows: HyroxProgrammeSessionRow[];
  sessionDetails: PublishSessionSyncDetail[];
}): PublishWeekVerification {
  const errors: string[] = [];
  const missingOrUnsyncedDraftSessionTitles: string[] = [];
  const livePreviewForEditedSessions: PublishWeekVerification["livePreviewForEditedSessions"] =
    [];
  const usedPublished = new Set<string>();

  for (const draftRow of params.draftRows) {
    const { row: published } = findPublishedSessionForDraftRow(
      params.publishedRows,
      draftRow,
      usedPublished
    );
    if (published) usedPublished.add(published.id);

    const draftSessionId = draftIdFromMetadata(draftRow.metadata);
    const draftPreview = draftInsertRowPreview(draftRow);

    if (!published) {
      missingOrUnsyncedDraftSessionTitles.push(draftRow.session_name);
      errors.push(`No published row for draft session "${draftRow.session_name}".`);
      livePreviewForEditedSessions.push({
        draftSessionId,
        draftTitle: draftRow.session_name,
        preview: draftPreview,
        publishedSessionId: null,
        publishedPreview: null,
      });
      continue;
    }

    const livePreview = publishedSessionLivePreview(published);
    livePreviewForEditedSessions.push({
      draftSessionId,
      draftTitle: draftRow.session_name,
      preview: draftPreview,
      publishedSessionId: published.id,
      publishedPreview: livePreview,
    });

    const remaining = diffSessionSyncFields(published, draftRow);
    if (remaining.length > 0) {
      missingOrUnsyncedDraftSessionTitles.push(draftRow.session_name);
      errors.push(
        `Draft edit was not synced to published session "${draftRow.session_name}" (${published.id.slice(0, 8)}…): still differs on ${remaining.join(", ")}. Live: "${livePreview}". Draft: "${draftPreview}".`
      );
    }
  }

  for (const detail of params.sessionDetails) {
    if (detail.updateAttempted && !detail.updateSuccess) {
      missingOrUnsyncedDraftSessionTitles.push(detail.draftTitle);
      errors.push(
        `Update failed for "${detail.draftTitle}": ${detail.syncError ?? "unknown error"}.`
      );
    }
    if (detail.changedFields.length > 0 && !detail.updateAttempted) {
      missingOrUnsyncedDraftSessionTitles.push(detail.draftTitle);
      errors.push(
        `Draft edit was not synced to published session "${detail.draftTitle}": ${detail.unchangedReason ?? "update not attempted"}.`
      );
    }
  }

  return {
    verificationPassed: errors.length === 0,
    missingOrUnsyncedDraftSessionTitles: [...new Set(missingOrUnsyncedDraftSessionTitles)],
    livePreviewForEditedSessions,
    errors,
  };
}

export function draftSessionIdFromInsertRow(row: DraftSessionInsertRow): string | null {
  return draftIdFromMetadata(row.metadata);
}

export function collectDraftMarkersFromWeek(_draftWeek: CoachDraftWeek): string[] {
  return [];
}
