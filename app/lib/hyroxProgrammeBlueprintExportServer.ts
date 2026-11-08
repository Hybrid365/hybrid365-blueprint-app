/**
 * Server-side programme blueprint export — coach-auth callers only.
 * Read-only. Never mutates drafts or athlete rows.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { blockWeekRange } from "@/app/lib/hyroxBlockReview";
import { assertTargetBlockAllowed } from "@/app/lib/hyroxProgrammeBlueprintImportServer";
import {
  buildProgrammeBlueprintExportDocument,
  resolveExportGlobalWeeks,
  suggestedExportFilename,
} from "@/app/lib/hyroxProgrammeBlueprintExport";
import type {
  ProgrammeBlueprintExportDocument,
  ProgrammeBlueprintExportSelection,
} from "@/app/lib/hyroxProgrammeBlueprintTypes";
import {
  isPublishedDraftRow,
  isUnpublishedWorkingDraft,
  selectPreferredDraftRow,
} from "@/app/lib/hyroxProgrammeDraftRevision";
import type { HyroxProgrammeDraftRow } from "@/app/lib/hyroxDatabaseTypes";

const DRAFT_SELECT =
  "id, athlete_id, mapped_profile_id, created_at, updated_at, block_number, week_number, draft_data, weekly_summary, validation_warnings, coach_note, athlete_facing_note, status, published_at";

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

/**
 * Prefer unpublished working draft (what Programme Builder edits).
 * Fall back to published snapshot. Never invent content.
 */
async function fetchPreferredDraftsForWeeks(
  supabase: SupabaseClient,
  athleteId: string,
  blockNumber: number,
  globalWeeks: number[]
): Promise<Map<number, HyroxProgrammeDraftRow | null>> {
  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .select(DRAFT_SELECT)
    .eq("athlete_id", athleteId)
    .eq("block_number", blockNumber)
    .in("week_number", globalWeeks)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  const byWeek = new Map<number, HyroxProgrammeDraftRow[]>();
  for (const row of (data as HyroxProgrammeDraftRow[]) ?? []) {
    const list = byWeek.get(row.week_number) ?? [];
    list.push(row);
    byWeek.set(row.week_number, list);
  }

  const preferred = new Map<number, HyroxProgrammeDraftRow | null>();
  for (const w of globalWeeks) {
    const rows = byWeek.get(w) ?? [];
    // Explicit preference: unpublished working draft, else published snapshot via selectPreferred
    const unpublished = rows
      .filter((r) => isUnpublishedWorkingDraft(r))
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
    if (unpublished[0]) {
      preferred.set(w, unpublished[0]);
      continue;
    }
    const published = rows
      .filter((r) => isPublishedDraftRow(r))
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
    preferred.set(w, published[0] ?? selectPreferredDraftRow(rows));
  }
  return preferred;
}

export async function exportProgrammeBlueprint(
  supabase: SupabaseClient,
  params: {
    athleteId: string;
    block: number;
    selection: ProgrammeBlueprintExportSelection;
    globalWeeks?: number[];
    athleteLabel?: string | null;
    programmeLengthWeeks?: number | null;
  }
): Promise<{ document: ProgrammeBlueprintExportDocument; filename: string }> {
  assertTargetBlockAllowed({
    targetBlock: params.block,
    programmeLengthWeeks: params.programmeLengthWeeks,
  });

  const selectedGlobalWeeks = resolveExportGlobalWeeks({
    block: params.block,
    selection: params.selection,
    globalWeeks: params.globalWeeks,
  });

  // Reject accidental cross-athlete leakage: only path athleteId is queried.
  const preferredByWeek = await fetchPreferredDraftsForWeeks(
    supabase,
    params.athleteId,
    params.block,
    selectedGlobalWeeks
  );
  const publishedWeekNumbers = await fetchPublishedWeekNumbers(
    supabase,
    params.athleteId,
    params.block
  );

  const document = buildProgrammeBlueprintExportDocument({
    athleteId: params.athleteId,
    athleteLabel: params.athleteLabel,
    block: params.block,
    selection: params.selection,
    selectedGlobalWeeks,
    preferredByWeek,
    publishedWeekNumbers,
  });

  return {
    document,
    filename: suggestedExportFilename(document),
  };
}
