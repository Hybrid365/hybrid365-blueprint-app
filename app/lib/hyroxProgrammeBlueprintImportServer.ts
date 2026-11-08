/**
 * Server-side blueprint import — coach-auth callers only.
 * Unpublished drafts only.
 *
 * Integrity model (v1 hardened):
 * - Validate all weeks before any write.
 * - Replace / empty-shell paths UPDATE the preferred unpublished row in place
 *   (optimistic `updated_at`) so they cooperate with
 *   `hyrox_programme_drafts_one_unpublished_week_idx`.
 * - Fresh empty weeks INSERT; unique_violation → concurrent-write error.
 * - Compensation journal restores: unarchive siblings, restore in-place updates,
 *   archive newly inserted rows — on any mid-apply failure.
 * - Not a Postgres multi-statement transaction (no import RPC); compensation is
 *   the architecture-consistent safety net used elsewhere for draft revisions.
 * - Concurrent empty-block imports may both fail (retry); they cannot leave
 *   sibling active unpublished drafts once the unique index is applied.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import {
  computeWeeklySummary,
  globalWeekForBlock,
  validateCoachDraft,
  type CoachDraftWeek,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import type {
  HyroxAthleteRow,
  HyroxJson,
  HyroxProgrammeDraftRow,
  HyroxProgrammeDraftStatus,
} from "@/app/lib/hyroxDatabaseTypes";
import { blockWeekRange } from "@/app/lib/hyroxBlockReview";
import {
  buildBlueprintImportPreview,
  parseProgrammeBlueprintDocument,
  remapBlueprintWeekToAthleteBlock,
  sanitizeBlueprintWeekForImport,
} from "@/app/lib/hyroxProgrammeBlueprint";
import type {
  BlueprintConflictStrategy,
  BlueprintImportApplyResult,
  BlueprintImportPreview,
  ProgrammeBlueprintDocument,
} from "@/app/lib/hyroxProgrammeBlueprintTypes";
import {
  isPublishedDraftRow,
  isUnpublishedWorkingDraft,
  selectPreferredDraftRow,
} from "@/app/lib/hyroxProgrammeDraftRevision";
import {
  PROGRAMME_BLOCK_HARD_CAP,
  visibleCoachBlockCount,
  type ProgrammeLengthWeeks,
} from "@/app/lib/hyroxProgrammeDates";

const DRAFT_SELECT =
  "id, athlete_id, mapped_profile_id, created_at, updated_at, block_number, week_number, draft_data, weekly_summary, validation_warnings, coach_note, athlete_facing_note, status, published_at";

/** Max serialized blueprint JSON accepted on apply/preview (~1.5MB). */
export const BLUEPRINT_JSON_MAX_CHARS = 1_500_000;

export function isPostgresUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  return e.code === "23505" || Boolean(e.message?.includes("duplicate key"));
}

type CompensationEntry =
  | { kind: "inserted"; draftId: string }
  | {
      kind: "archived";
      draftId: string;
      priorStatus: HyroxProgrammeDraftStatus;
      priorValidation: HyroxJson | null;
    }
  | {
      kind: "updated";
      draftId: string;
      priorDraftData: HyroxJson;
      priorWeeklySummary: HyroxJson | null;
      priorValidation: HyroxJson | null;
      priorCoachNote: string | null;
      priorAthleteFacingNote: string | null;
      priorStatus: HyroxProgrammeDraftStatus;
      priorUpdatedAt: string;
    };

async function fetchPublishedWeekNumbers(
  supabase: SupabaseClient,
  athleteId: string,
  blockNumber: number
): Promise<Set<number>> {
  const { weeksStart, weeksEnd } = blockWeekRange(blockNumber);
  const { data, error } = await supabase
    .from("hyrox_programme_weeks")
    .select("week_number")
    .eq("athlete_id", athleteId)
    .eq("status", "published")
    .gte("week_number", weeksStart)
    .lte("week_number", weeksEnd);
  if (error) throw new Error(error.message);
  return new Set(
    ((data as Array<{ week_number: number }> | null) ?? []).map((r) => r.week_number)
  );
}

async function fetchExistingDraftsForBlock(
  supabase: SupabaseClient,
  athleteId: string,
  blockNumber: number
): Promise<Map<number, HyroxProgrammeDraftRow | null>> {
  const weekNumbers = ([1, 2, 3, 4] as const).map((c) => globalWeekForBlock(blockNumber, c));
  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .select(DRAFT_SELECT)
    .eq("athlete_id", athleteId)
    .eq("block_number", blockNumber)
    .in("week_number", weekNumbers)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data as HyroxProgrammeDraftRow[]) ?? [];
  const byWeek = new Map<number, HyroxProgrammeDraftRow[]>();
  for (const row of rows) {
    const list = byWeek.get(row.week_number) ?? [];
    list.push(row);
    byWeek.set(row.week_number, list);
  }

  const preferred = new Map<number, HyroxProgrammeDraftRow | null>();
  for (const w of weekNumbers) {
    preferred.set(w, selectPreferredDraftRow(byWeek.get(w) ?? []));
  }
  return preferred;
}

export function assertTargetBlockAllowed(args: {
  targetBlock: number;
  programmeLengthWeeks: number | null | undefined;
}): void {
  if (!Number.isInteger(args.targetBlock) || args.targetBlock < 1) {
    throw new Error("targetBlock must be an integer >= 1.");
  }
  if (args.targetBlock > PROGRAMME_BLOCK_HARD_CAP) {
    throw new Error(`targetBlock exceeds hard cap (${PROGRAMME_BLOCK_HARD_CAP}).`);
  }
  const lengthWeeks = (args.programmeLengthWeeks === 16 ? 16 : 12) as ProgrammeLengthWeeks;
  const visible = visibleCoachBlockCount({
    programmeLengthWeeks: lengthWeeks,
    highestExistingBlock: Math.max(1, args.targetBlock - 1),
    requestedBlock: args.targetBlock,
  });
  if (args.targetBlock > visible) {
    throw new Error(
      `targetBlock ${args.targetBlock} is beyond the next available programme block (max ${visible}).`
    );
  }
}

export async function previewProgrammeBlueprintImport(
  supabase: SupabaseClient,
  params: {
    athleteId: string;
    targetBlock: number;
    blueprintRaw: unknown;
    programmeLengthWeeks?: number | null;
  }
): Promise<{ preview: BlueprintImportPreview; blueprint: ProgrammeBlueprintDocument }> {
  const parsed = parseProgrammeBlueprintDocument(params.blueprintRaw);
  if (!parsed.ok) throw new Error(parsed.error);
  assertTargetBlockAllowed({
    targetBlock: params.targetBlock,
    programmeLengthWeeks: params.programmeLengthWeeks,
  });

  const existingByGlobalWeek = await fetchExistingDraftsForBlock(
    supabase,
    params.athleteId,
    params.targetBlock
  );
  const publishedWeekNumbers = await fetchPublishedWeekNumbers(
    supabase,
    params.athleteId,
    params.targetBlock
  );

  const preview = buildBlueprintImportPreview({
    athleteId: params.athleteId,
    targetBlock: params.targetBlock,
    blueprint: parsed.blueprint,
    existingByGlobalWeek,
    publishedWeekNumbers,
  });

  return { preview, blueprint: parsed.blueprint };
}

async function archiveDraftChecked(
  supabase: SupabaseClient,
  draftId: string,
  reason: string
): Promise<{ priorStatus: HyroxProgrammeDraftStatus; priorValidation: HyroxJson | null }> {
  const { data: before, error: fetchError } = await supabase
    .from("hyrox_programme_drafts")
    .select(DRAFT_SELECT)
    .eq("id", draftId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!before) throw new Error(`Draft ${draftId} not found for archive.`);
  const row = before as HyroxProgrammeDraftRow;
  if (isPublishedDraftRow(row)) {
    throw new Error(`Refusing to archive published draft ${draftId}.`);
  }

  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .update({
      status: "archived",
      validation_warnings: {
        ...(typeof row.validation_warnings === "object" && row.validation_warnings
          ? (row.validation_warnings as object)
          : {}),
        archivedReason: reason,
        archivedAt: new Date().toISOString(),
        priorStatus: row.status,
      } as unknown as HyroxJson,
    })
    .eq("id", draftId)
    .is("published_at", null)
    .neq("status", "published")
    .neq("status", "archived")
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Archive failed for ${draftId}: ${error.message}`);
  if (!data) throw new Error(`Archive matched no row for ${draftId} (already archived/published?).`);

  return {
    priorStatus: row.status,
    priorValidation: (row.validation_warnings as HyroxJson | null) ?? null,
  };
}

async function unarchiveDraft(
  supabase: SupabaseClient,
  draftId: string,
  priorStatus: HyroxProgrammeDraftStatus,
  priorValidation: HyroxJson | null
): Promise<void> {
  const { error } = await supabase
    .from("hyrox_programme_drafts")
    .update({
      status: priorStatus === "archived" ? "edited" : priorStatus,
      validation_warnings: priorValidation,
      published_at: null,
    })
    .eq("id", draftId)
    .eq("status", "archived");
  if (error) throw new Error(`Unarchive failed for ${draftId}: ${error.message}`);
}

async function insertUnpublishedDraft(
  supabase: SupabaseClient,
  params: {
    athleteId: string;
    athlete: CoachAthlete;
    mappedProfileId: string | null;
    draft: CoachDraftWeek;
    coachNote: string;
    athleteFacingNote: string;
    importMeta: Record<string, unknown>;
  }
): Promise<HyroxProgrammeDraftRow> {
  const summary = computeWeeklySummary(params.draft, params.athlete);
  const validation = validateCoachDraft(params.draft, params.athlete);
  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .insert({
      athlete_id: params.athleteId,
      mapped_profile_id: params.mappedProfileId,
      block_number: params.draft.block,
      week_number: params.draft.week,
      draft_data: params.draft as unknown as HyroxJson,
      weekly_summary: summary as unknown as HyroxJson,
      validation_warnings: {
        warnings: validation.warnings,
        positives: validation.positives,
        blueprintImport: params.importMeta,
      } as unknown as HyroxJson,
      coach_note: params.coachNote || null,
      athlete_facing_note: params.athleteFacingNote || null,
      status: "draft_generated",
      published_at: null,
    })
    .select(DRAFT_SELECT)
    .single();
  if (error) {
    if (isPostgresUniqueViolation(error)) {
      throw new Error(
        `Concurrent programme draft write detected for week ${params.draft.week}. Another import or editor created an unpublished draft first — retry after refresh.`
      );
    }
    throw new Error(error.message);
  }
  return data as HyroxProgrammeDraftRow;
}

async function updateUnpublishedDraftContent(
  supabase: SupabaseClient,
  params: {
    draftId: string;
    expectedUpdatedAt: string;
    athlete: CoachAthlete;
    draft: CoachDraftWeek;
    coachNote: string;
    athleteFacingNote: string;
    importMeta: Record<string, unknown>;
  }
): Promise<HyroxProgrammeDraftRow> {
  const summary = computeWeeklySummary(params.draft, params.athlete);
  const validation = validateCoachDraft(params.draft, params.athlete);
  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .update({
      draft_data: params.draft as unknown as HyroxJson,
      weekly_summary: summary as unknown as HyroxJson,
      validation_warnings: {
        warnings: validation.warnings,
        positives: validation.positives,
        blueprintImport: params.importMeta,
      } as unknown as HyroxJson,
      coach_note: params.coachNote || null,
      athlete_facing_note: params.athleteFacingNote || null,
      block_number: params.draft.block,
      week_number: params.draft.week,
      status: "edited",
      published_at: null,
    })
    .eq("id", params.draftId)
    .eq("updated_at", params.expectedUpdatedAt)
    .is("published_at", null)
    .neq("status", "published")
    .neq("status", "archived")
    .select(DRAFT_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error(
      `Concurrent edit detected for draft ${params.draftId} (week ${params.draft.week}). Refresh Programme Builder and retry the import.`
    );
  }
  return data as HyroxProgrammeDraftRow;
}

/**
 * Archive any unpublished sibling drafts for the target weeks except the preferred
 * row. Defensive against pre-index duplicates; with the unique index this is usually a no-op.
 */
async function archiveUnpublishedSiblings(
  supabase: SupabaseClient,
  athleteId: string,
  blockNumber: number,
  preferredByWeek: Map<number, HyroxProgrammeDraftRow | null>,
  journal: CompensationEntry[]
): Promise<void> {
  const weekNumbers = ([1, 2, 3, 4] as const).map((c) => globalWeekForBlock(blockNumber, c));
  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .select(DRAFT_SELECT)
    .eq("athlete_id", athleteId)
    .eq("block_number", blockNumber)
    .in("week_number", weekNumbers)
    .is("published_at", null)
    .not("status", "in", '("archived","published")');
  if (error) throw new Error(error.message);

  for (const row of (data as HyroxProgrammeDraftRow[]) ?? []) {
    const preferred = preferredByWeek.get(row.week_number);
    if (preferred && preferred.id === row.id) continue;
    if (!isUnpublishedWorkingDraft(row)) continue;
    const archived = await archiveDraftChecked(
      supabase,
      row.id,
      "Archived sibling unpublished draft before blueprint import"
    );
    journal.push({
      kind: "archived",
      draftId: row.id,
      priorStatus: archived.priorStatus,
      priorValidation: archived.priorValidation,
    });
  }
}

async function reResolveImportedWeek(
  supabase: SupabaseClient,
  athleteId: string,
  draft: CoachDraftWeek
): Promise<CoachDraftWeek> {
  const sanitized = sanitizeBlueprintWeekForImport(draft);
  try {
    const { getHyroxAthletePerformanceProfile } = await import(
      "@/app/lib/hyroxAthleteBenchmarkServer"
    );
    const { getSessionFamily } = await import("@/app/lib/hyroxSessionFamilyRegistry");
    const { overridesFromDraftPreview, refreshFamilyLinkedDraftPreview } = await import(
      "@/app/lib/hyroxSessionFamilyDraft"
    );
    const profileResult = await getHyroxAthletePerformanceProfile(supabase, athleteId);
    const resolvedAt = new Date().toISOString();
    return {
      ...sanitized,
      days: sanitized.days.map((day) => ({
        ...day,
        sessions: day.sessions.map((session) => {
          if (!session.sessionFamily) return session;
          const family = getSessionFamily(session.sessionFamily.familyId);
          if (!family) return session;
          const overrides = overridesFromDraftPreview(session.sessionFamily);
          return refreshFamilyLinkedDraftPreview(
            session,
            family,
            profileResult.profile,
            resolvedAt,
            overrides.length > 0 ? overrides : undefined
          );
        }),
      })),
    };
  } catch {
    return sanitized;
  }
}

async function compensate(supabase: SupabaseClient, journal: CompensationEntry[]): Promise<string[]> {
  const errors: string[] = [];
  // Reverse order
  for (let i = journal.length - 1; i >= 0; i--) {
    const entry = journal[i]!;
    try {
      if (entry.kind === "inserted") {
        await archiveDraftChecked(supabase, entry.draftId, "Rollback after failed blueprint import");
      } else if (entry.kind === "archived") {
        await unarchiveDraft(supabase, entry.draftId, entry.priorStatus, entry.priorValidation);
      } else if (entry.kind === "updated") {
        const { error } = await supabase
          .from("hyrox_programme_drafts")
          .update({
            draft_data: entry.priorDraftData,
            weekly_summary: entry.priorWeeklySummary,
            validation_warnings: entry.priorValidation,
            coach_note: entry.priorCoachNote,
            athlete_facing_note: entry.priorAthleteFacingNote,
            status: entry.priorStatus,
            published_at: null,
          })
          .eq("id", entry.draftId)
          .is("published_at", null)
          .neq("status", "published");
        if (error) throw new Error(error.message);
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  return errors;
}

export async function applyProgrammeBlueprintImport(
  supabase: SupabaseClient,
  params: {
    athleteId: string;
    athlete: CoachAthlete;
    athleteRow: HyroxAthleteRow;
    mappedProfileId: string | null;
    targetBlock: number;
    blueprintRaw: unknown;
    conflictStrategy: BlueprintConflictStrategy;
    confirmReplaceGlobalWeeks?: number[];
    confirmApply: boolean;
  }
): Promise<BlueprintImportApplyResult> {
  if (!params.confirmApply) {
    throw new Error("confirmApply must be true to persist an import.");
  }

  const { preview, blueprint } = await previewProgrammeBlueprintImport(supabase, {
    athleteId: params.athleteId,
    targetBlock: params.targetBlock,
    blueprintRaw: params.blueprintRaw,
    programmeLengthWeeks: params.athleteRow.programme_length_weeks,
  });

  if (preview.blockedByPublished) {
    throw new Error(preview.summary);
  }

  if (preview.requiresReplaceConfirmation) {
    if (params.conflictStrategy !== "replace_unpublished_confirmed") {
      throw new Error(
        "Existing unpublished drafts detected. Set conflictStrategy to replace_unpublished_confirmed after review, or choose another block."
      );
    }
    const required = preview.weeks
      .filter((w) => w.conflict === "unpublished_content")
      .map((w) => w.globalWeek)
      .sort((a, b) => a - b);
    const confirmed = [...(params.confirmReplaceGlobalWeeks ?? [])].sort((a, b) => a - b);
    if (required.length === 0 || confirmed.join(",") !== required.join(",")) {
      throw new Error(
        `confirmReplaceGlobalWeeks must exactly match conflicted weeks: [${required.join(", ")}].`
      );
    }
  }

  const remapped: Array<{ cycle: 1 | 2 | 3 | 4; globalWeek: number; draft: CoachDraftWeek }> = [];
  for (let cycle = 1 as 1 | 2 | 3 | 4; cycle <= 4; cycle = (cycle + 1) as 1 | 2 | 3 | 4) {
    const base = remapBlueprintWeekToAthleteBlock({
      week: blueprint.weeks[cycle - 1]!,
      athleteId: params.athleteId,
      targetBlock: params.targetBlock,
      cycle,
    });
    const draft = await reResolveImportedWeek(supabase, params.athleteId, base);
    validateCoachDraft(draft, params.athlete);
    remapped.push({ cycle, globalWeek: draft.week, draft });
  }

  const journal: CompensationEntry[] = [];
  const results: BlueprintImportApplyResult["weeks"] = [];
  const coachNote = blueprint.coachNote ?? "";
  const athleteFacingNote = blueprint.athleteFacingNote ?? "";

  try {
    // Fresh state immediately before writes (reduces TOCTOU)
    const existingMap = await fetchExistingDraftsForBlock(
      supabase,
      params.athleteId,
      params.targetBlock
    );
    const publishedNow = await fetchPublishedWeekNumbers(
      supabase,
      params.athleteId,
      params.targetBlock
    );

    // Drop any unexpected unpublished siblings before writing (safe with/without unique index).
    await archiveUnpublishedSiblings(
      supabase,
      params.athleteId,
      params.targetBlock,
      existingMap,
      journal
    );

    for (const item of remapped) {
      if (publishedNow.has(item.globalWeek)) {
        throw new Error(
          `Week ${item.globalWeek} became published during import — aborting with no partial active changes.`
        );
      }

      const existing = existingMap.get(item.globalWeek) ?? null;
      if (existing && isPublishedDraftRow(existing)) {
        throw new Error(`Refusing to modify published draft ${existing.id} for week ${item.globalWeek}.`);
      }

      const importMeta = {
        blueprintId: blueprint.id,
        blueprintVersion: blueprint.version,
        importedAt: new Date().toISOString(),
        targetBlock: params.targetBlock,
        conflictStrategy: params.conflictStrategy,
      };

      const weekPreview = preview.weeks.find((w) => w.globalWeek === item.globalWeek);
      const needsReplace = weekPreview?.conflict === "unpublished_content";

      // Replace and empty-shell paths UPDATE the preferred unpublished row in place.
      // This cooperates with hyrox_programme_drafts_one_unpublished_week_idx (no second active row).
      if (
        existing &&
        isUnpublishedWorkingDraft(existing) &&
        (needsReplace || (weekPreview?.existingSessionCount ?? 0) === 0)
      ) {
        if (needsReplace && params.conflictStrategy !== "replace_unpublished_confirmed") {
          throw new Error(
            `Unexpected unpublished content on week ${item.globalWeek} without replace confirmation.`
          );
        }
        journal.push({
          kind: "updated",
          draftId: existing.id,
          priorDraftData: existing.draft_data as HyroxJson,
          priorWeeklySummary: (existing.weekly_summary as HyroxJson | null) ?? null,
          priorValidation: (existing.validation_warnings as HyroxJson | null) ?? null,
          priorCoachNote: existing.coach_note,
          priorAthleteFacingNote: existing.athlete_facing_note,
          priorStatus: existing.status,
          priorUpdatedAt: existing.updated_at,
        });
        const updated = await updateUnpublishedDraftContent(supabase, {
          draftId: existing.id,
          expectedUpdatedAt: existing.updated_at,
          athlete: params.athlete,
          draft: item.draft,
          coachNote,
          athleteFacingNote,
          importMeta: needsReplace
            ? { ...importMeta, replacedInPlace: true }
            : importMeta,
        });
        results.push({
          cycle: item.cycle,
          globalWeek: item.globalWeek,
          draftId: updated.id,
          action: needsReplace ? "replaced_in_place" : "updated",
        });
        continue;
      }

      if (existing && isUnpublishedWorkingDraft(existing)) {
        throw new Error(
          `Unexpected unpublished content on week ${item.globalWeek} without replace confirmation.`
        );
      }

      const inserted = await insertUnpublishedDraft(supabase, {
        athleteId: params.athleteId,
        athlete: params.athlete,
        mappedProfileId: params.mappedProfileId,
        draft: item.draft,
        coachNote,
        athleteFacingNote,
        importMeta,
      });
      journal.push({ kind: "inserted", draftId: inserted.id });
      results.push({
        cycle: item.cycle,
        globalWeek: item.globalWeek,
        draftId: inserted.id,
        action: "inserted",
      });
    }

    const { error: athleteError } = await supabase
      .from("hyrox_athletes")
      .update({
        status: "draft_generated",
        programme_status: "draft_generated",
        current_block: params.targetBlock,
        current_week: globalWeekForBlock(params.targetBlock, 1),
        current_programme_block: params.targetBlock,
      })
      .eq("id", params.athleteId);
    if (athleteError) {
      throw new Error(`Drafts saved but athlete pointer update failed: ${athleteError.message}`);
    }

    return {
      success: true,
      athleteId: params.athleteId,
      targetBlock: params.targetBlock,
      draftIds: results.map((r) => r.draftId),
      weeks: results,
      message: `Imported ${blueprint.name} v${blueprint.version} into Block ${params.targetBlock} as unpublished drafts.`,
    };
  } catch (e) {
    const rollbackErrors = await compensate(supabase, journal);
    const message = e instanceof Error ? e.message : "Blueprint import failed.";
    const rollbackNote = journal.length
      ? ` Compensated ${journal.length} write(s)${
          rollbackErrors.length ? ` with ${rollbackErrors.length} rollback error(s)` : ""
        }.`
      : "";
    throw new Error(`${message}${rollbackNote}`);
  }
}
