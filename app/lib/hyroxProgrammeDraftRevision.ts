/**
 * Unpublished working drafts for weeks that already have a published athlete-visible snapshot.
 *
 * Published programme_weeks (+ any draft row marked published) stay immutable.
 * Coaches edit a separate unpublished draft revision until explicit republish.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import {
  computeWeeklySummary,
  parseCoachDraftWeekJson,
  validateCoachDraft,
  type CoachDraftWeek,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import type { HyroxJson, HyroxProgrammeDraftRow } from "@/app/lib/hyroxDatabaseTypes";
import { blockNumberForGlobalWeek } from "@/app/lib/hyroxProgrammeDates";
import { buildEmptyCoachDraftWeekShell } from "@/app/lib/hyroxSessionFamilyApply";
import { fetchLatestDraftForGlobalWeek } from "@/app/lib/hyroxSessionFamilyEnsureDraft";

const DRAFT_SELECT =
  "id, athlete_id, mapped_profile_id, created_at, updated_at, block_number, week_number, draft_data, weekly_summary, validation_warnings, coach_note, athlete_facing_note, status, published_at";

export function isPublishedDraftRow(
  row: Pick<HyroxProgrammeDraftRow, "status" | "published_at"> | null | undefined
): boolean {
  if (!row) return false;
  return row.status === "published" || row.published_at != null;
}

export function isUnpublishedWorkingDraft(
  row: Pick<HyroxProgrammeDraftRow, "status" | "published_at"> | null | undefined
): boolean {
  if (!row) return false;
  return row.status !== "archived" && !isPublishedDraftRow(row);
}

/**
 * Prefer an unpublished working draft for a week. Falls back to latest non-archived
 * (may be published) — callers that need a writable revision should call
 * ensureUnpublishedWorkingDraft.
 */
export async function fetchWorkingDraftForGlobalWeek(
  supabase: SupabaseClient,
  athleteId: string,
  weekNumber: number
): Promise<HyroxProgrammeDraftRow | null> {
  return fetchLatestDraftForGlobalWeek(supabase, athleteId, weekNumber);
}

/**
 * Ensure there is an unpublished draft revision for this athlete + week_number.
 * Never mutates a published draft row or published programme_weeks.
 */
export async function ensureUnpublishedWorkingDraft(
  supabase: SupabaseClient,
  params: {
    athleteId: string;
    athlete: CoachAthlete;
    globalWeek: number;
    /** When forking / creating, seed content (defaults to existing published draft data or empty shell). */
    seedDraftData?: CoachDraftWeek | null;
    mappedProfileId?: string | null;
    coachNote?: string | null;
    athleteFacingNote?: string | null;
  }
): Promise<{
  draft: HyroxProgrammeDraftRow;
  draftData: CoachDraftWeek;
  created: boolean;
  forkedFromPublished: boolean;
}> {
  const existing = await fetchLatestDraftForGlobalWeek(
    supabase,
    params.athleteId,
    params.globalWeek
  );

  if (existing && isUnpublishedWorkingDraft(existing)) {
    const parsed =
      parseCoachDraftWeekJson(existing.draft_data) ??
      buildEmptyCoachDraftWeekShell({
        athleteId: params.athleteId,
        globalWeek: params.globalWeek,
      });
    return {
      draft: existing,
      draftData: parsed,
      created: false,
      forkedFromPublished: false,
    };
  }

  const forkedFromPublished = Boolean(existing && isPublishedDraftRow(existing));
  const seed =
    params.seedDraftData ??
    (existing ? parseCoachDraftWeekJson(existing.draft_data) : null) ??
    buildEmptyCoachDraftWeekShell({
      athleteId: params.athleteId,
      globalWeek: params.globalWeek,
    });

  const draftData: CoachDraftWeek = {
    ...seed,
    athleteId: params.athleteId,
    block: blockNumberForGlobalWeek(params.globalWeek),
    week: params.globalWeek,
    generatedAt: new Date().toISOString(),
  };

  const summary = computeWeeklySummary(draftData, params.athlete);
  const validation = validateCoachDraft(draftData, params.athlete);
  const block = blockNumberForGlobalWeek(params.globalWeek);

  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .insert({
      athlete_id: params.athleteId,
      mapped_profile_id: params.mappedProfileId ?? existing?.mapped_profile_id ?? null,
      block_number: block,
      week_number: params.globalWeek,
      draft_data: draftData as unknown as HyroxJson,
      weekly_summary: summary as unknown as HyroxJson,
      validation_warnings: {
        warnings: validation.warnings,
        positives: validation.positives,
        draftRevision: true,
        forkedFromPublishedDraftId: forkedFromPublished ? existing?.id ?? null : null,
      } as unknown as HyroxJson,
      coach_note: params.coachNote ?? existing?.coach_note ?? null,
      athlete_facing_note: params.athleteFacingNote ?? existing?.athlete_facing_note ?? null,
      status: "draft_generated",
      published_at: null,
    })
    .select(DRAFT_SELECT)
    .single();

  if (error) throw new Error(error.message);

  return {
    draft: data as HyroxProgrammeDraftRow,
    draftData,
    created: true,
    forkedFromPublished,
  };
}

/**
 * Choose the coach-facing draft among candidates for one week_number.
 * Unpublished working drafts always win over published snapshot drafts.
 */
export function selectPreferredDraftRow(
  rows: HyroxProgrammeDraftRow[]
): HyroxProgrammeDraftRow | null {
  if (!rows.length) return null;
  const unpublished = rows
    .filter((r) => isUnpublishedWorkingDraft(r))
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  if (unpublished[0]) return unpublished[0];
  return [...rows].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0] ?? null;
}
