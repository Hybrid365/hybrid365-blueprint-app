import {
  countCoachDraftSessions,
  type CoachDraftWeek,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import type { HyroxJson, HyroxProgrammeDraftRow } from "@/app/lib/hyroxDatabaseTypes";

function parseCoachDraftWeek(data: HyroxJson | null | undefined): CoachDraftWeek | null {
  if (!data || typeof data !== "object") return null;
  const d = data as CoachDraftWeek;
  if (!d.days || !Array.isArray(d.days)) return null;
  return d;
}

export type PublishWeekSlotCounts = {
  main: number;
  am: number;
  pm: number;
  optional: number;
  key: number;
};

export type PublishWeekAudit = {
  draftId: string;
  athleteId: string;
  blockId: number;
  weekNumber: number;
  draftStatus: string;
  approvedDraftSessionCount: number;
  approvedDraftSessionTitles: string[];
  slotCounts: PublishWeekSlotCounts;
  expectedSessionCount: number | null;
};

import type {
  PublishSessionSyncDetail,
  PublishWeekVerification,
} from "@/app/lib/hyroxProgrammeSessionSync";

export type { PublishSessionSyncDetail, PublishWeekVerification } from "@/app/lib/hyroxProgrammeSessionSync";

export type PublishWeekSyncUpdatedSession = {
  id: string;
  title: string;
  hadLogs: boolean;
};

export type PublishWeekSyncAudit = PublishWeekAudit & {
  sessionsToInsertCount: number;
  sessionsToInsertTitles: string[];
  existingRowsBefore: number;
  draftSessionsCount: number;
  insertedRowsCount: number;
  updatedRowsCount: number;
  unchangedRowsCount: number;
  skippedRowsCount: number;
  skippedBecauseLoggedCount: number;
  skippedReasons: string[];
  warnings: string[];
  updatedSessions: PublishWeekSyncUpdatedSession[];
  sessionSyncDetails: PublishSessionSyncDetail[];
  verification: PublishWeekVerification;
  rowsAfterPublish: number;
};

export class StaleDraftPublishError extends Error {
  readonly code = "STALE_DRAFT_SESSION_COUNT";
  readonly audit: PublishWeekAudit;

  constructor(audit: PublishWeekAudit) {
    const expected = audit.expectedSessionCount ?? "?";
    super(
      `Publish route received stale/partial draft: week ${audit.weekNumber} UI expects ${expected} sessions but approved draft ${audit.draftId.slice(0, 8)}… has ${audit.approvedDraftSessionCount}. Regenerate and approve the block before publishing — publish does not rebuild from profile.`
    );
    this.name = "StaleDraftPublishError";
    this.audit = audit;
  }
}

export function loadApprovedDraftWeekFromRow(
  draftRow: HyroxProgrammeDraftRow
): { draftWeek: CoachDraftWeek; audit: PublishWeekAudit } {
  const draftWeek = parseCoachDraftWeek(draftRow.draft_data);
  if (!draftWeek) {
    throw new Error(`Invalid draft_data for week ${draftRow.week_number} (draft ${draftRow.id}).`);
  }
  const counts = countCoachDraftSessions(draftWeek);
  const audit: PublishWeekAudit = {
    draftId: draftRow.id,
    athleteId: draftRow.athlete_id,
    blockId: draftRow.block_number,
    weekNumber: draftRow.week_number,
    draftStatus: draftRow.status,
    approvedDraftSessionCount: counts.total,
    approvedDraftSessionTitles: draftWeek.days.flatMap((d) =>
      d.sessions.map((s) => s.title)
    ),
    slotCounts: {
      main: counts.main,
      am: counts.am,
      pm: counts.pm,
      optional: counts.optional,
      key: counts.key,
    },
    expectedSessionCount: null,
  };
  return { draftWeek, audit };
}

export function assertDraftSessionCountMatchesUi(
  audit: PublishWeekAudit,
  expectedSessionCount: number | null | undefined
): void {
  if (expectedSessionCount == null || expectedSessionCount <= 0) return;
  const withExpected = { ...audit, expectedSessionCount };
  if (expectedSessionCount > audit.approvedDraftSessionCount) {
    throw new StaleDraftPublishError(withExpected);
  }
}
