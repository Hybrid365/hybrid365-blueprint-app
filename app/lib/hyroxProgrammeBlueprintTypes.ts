import type { CoachDraftWeek, CoachProgrammeStatus } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { HyroxProgrammeDraftStatus } from "@/app/lib/hyroxDatabaseTypes";

/** Validated coach programme blueprint — reusable import unit. */
export type ProgrammeBlueprintDocument = {
  id: string;
  name: string;
  version: string;
  /** Exactly four weeks for a block import (cycles 1–4). */
  weeks: CoachDraftWeek[];
  coachNote?: string;
  athleteFacingNote?: string;
  meta?: Record<string, unknown>;
  /** Optional change log when this is a revised variant of another blueprint. */
  changeSummary?: string[];
  /** Id of the blueprint this revises (if any). */
  revisesId?: string | null;
};

export type BlueprintCatalogEntry = {
  id: string;
  name: string;
  version: string;
  description: string;
  revisesId?: string | null;
  changeSummary?: string[];
};

export type BlueprintConflictStrategy =
  | "abort"
  | "replace_unpublished_confirmed";

export type BlueprintWeekDiffSession = {
  day: string;
  title: string;
  key: boolean;
  familyId: string | null;
  coachLibraryId: string | null;
  source: "session_family" | "coach_library" | "composed" | "unknown";
};

export type BlueprintWeekDiff = {
  cycle: 1 | 2 | 3 | 4;
  globalWeek: number;
  blueprintSessionCount: number;
  existingSessionCount: number;
  existingDraftId: string | null;
  existingDbStatus: HyroxProgrammeDraftStatus | null;
  existingCoachStatus: CoachProgrammeStatus | null;
  existingPublished: boolean;
  hasUnpublishedContent: boolean;
  conflict: "none" | "unpublished_content" | "published_snapshot";
  added: BlueprintWeekDiffSession[];
  removed: BlueprintWeekDiffSession[];
  changed: Array<{ day: string; from: string; to: string }>;
  unchangedCount: number;
};

export type BlueprintImportPreview = {
  athleteId: string;
  targetBlock: number;
  blueprint: Pick<ProgrammeBlueprintDocument, "id" | "name" | "version" | "changeSummary" | "revisesId">;
  weeks: BlueprintWeekDiff[];
  canApplyWithoutReplace: boolean;
  requiresReplaceConfirmation: boolean;
  blockedByPublished: boolean;
  summary: string;
};

export type BlueprintImportApplyResult = {
  success: true;
  athleteId: string;
  targetBlock: number;
  draftIds: string[];
  weeks: Array<{
    cycle: 1 | 2 | 3 | 4;
    globalWeek: number;
    draftId: string;
    action: "inserted" | "updated" | "replaced_in_place" | "replaced_via_archive_insert";
  }>;
  rolledBack?: boolean;
  message: string;
};
