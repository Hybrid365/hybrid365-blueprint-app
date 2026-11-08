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

/** Coach export selection mode in Programme Builder. */
export type ProgrammeBlueprintExportSelection =
  | "current_week"
  | "selected_weeks"
  | "entire_block";

/**
 * Per-week provenance for an export. Separate from CoachDraftWeek workout payload.
 * contentSource describes which row's draft_data was copied into `weeks[]`.
 */
export type ProgrammeBlueprintExportWeekProvenance = {
  cycle: 1 | 2 | 3 | 4;
  globalWeek: number;
  draftId: string | null;
  dbStatus: HyroxProgrammeDraftStatus | null;
  coachStatus: CoachProgrammeStatus | null;
  /** True when an athlete-visible published week exists for this global week. */
  athleteWeekPublished: boolean;
  /**
   * Which content was exported:
   * - unpublished_working_draft — preferred Builder working draft (incl. edited)
   * - published_snapshot — published draft row (no unpublished fork)
   * - missing — no draft row / empty week
   */
  contentSource: "unpublished_working_draft" | "published_snapshot" | "missing";
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
  sessionCount: number;
};

export type ProgrammeBlueprintExportProvenance = {
  exportedAt: string;
  /** Opaque stable athlete reference — not email / not raw UUID. */
  athleteRef: string;
  /** Optional coach-supplied display label (never auto-filled from email). */
  athleteLabel: string | null;
  sourceBlock: number;
  selection: ProgrammeBlueprintExportSelection;
  selectedGlobalWeeks: number[];
  weekProvenance: ProgrammeBlueprintExportWeekProvenance[];
};

/**
 * Export document: import-compatible id/name/version/weeks core + separate provenance.
 * Partial exports may have 1–3 weeks; full block has 4.
 */
export type ProgrammeBlueprintExportDocument = {
  format: "hybrid365.programme_blueprint_export";
  formatVersion: "1";
  id: string;
  name: string;
  version: string;
  weeks: CoachDraftWeek[];
  coachNote?: string;
  athleteFacingNote?: string;
  export: ProgrammeBlueprintExportProvenance;
  meta?: Record<string, unknown>;
};
