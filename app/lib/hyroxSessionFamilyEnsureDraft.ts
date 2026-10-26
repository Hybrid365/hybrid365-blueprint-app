/**
 * Ensure programme draft weeks exist for progression apply.
 * Creates empty draft shells only — never publishes, never mutates current_week.
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

const DRAFT_SELECT =
  "id, athlete_id, mapped_profile_id, created_at, updated_at, block_number, week_number, draft_data, weekly_summary, validation_warnings, coach_note, athlete_facing_note, status, published_at";

export async function fetchLatestDraftForGlobalWeek(
  supabase: SupabaseClient,
  athleteId: string,
  weekNumber: number
): Promise<HyroxProgrammeDraftRow | null> {
  // Prefer an unpublished working draft over a published snapshot of the same week.
  const { data: unpublished, error: unpubErr } = await supabase
    .from("hyrox_programme_drafts")
    .select(DRAFT_SELECT)
    .eq("athlete_id", athleteId)
    .eq("week_number", weekNumber)
    .neq("status", "archived")
    .is("published_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (unpubErr) throw new Error(unpubErr.message);
  if (unpublished) return unpublished as HyroxProgrammeDraftRow;

  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .select(DRAFT_SELECT)
    .eq("athlete_id", athleteId)
    .eq("week_number", weekNumber)
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as HyroxProgrammeDraftRow | null) ?? null;
}

/**
 * Idempotent: return existing draft for global week, or insert an empty shell.
 * Does NOT update hyrox_athletes.current_week / current_block.
 */
export async function ensureProgrammeDraftWeekExists(
  supabase: SupabaseClient,
  params: {
    athleteId: string;
    athlete: CoachAthlete;
    globalWeek: number;
    mappedProfileId?: string | null;
    coachNote?: string;
    athleteFacingNote?: string;
  }
): Promise<{
  draft: HyroxProgrammeDraftRow;
  draftData: CoachDraftWeek;
  created: boolean;
}> {
  const existing = await fetchLatestDraftForGlobalWeek(
    supabase,
    params.athleteId,
    params.globalWeek
  );
  if (existing) {
    const parsed =
      parseCoachDraftWeekJson(existing.draft_data) ??
      buildEmptyCoachDraftWeekShell({
        athleteId: params.athleteId,
        globalWeek: params.globalWeek,
      });
    return { draft: existing, draftData: parsed, created: false };
  }

  const shell = buildEmptyCoachDraftWeekShell({
    athleteId: params.athleteId,
    globalWeek: params.globalWeek,
  });
  const summary = computeWeeklySummary(shell, params.athlete);
  const validation = validateCoachDraft(shell, params.athlete);
  const block = blockNumberForGlobalWeek(params.globalWeek);

  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .insert({
      athlete_id: params.athleteId,
      mapped_profile_id: params.mappedProfileId ?? null,
      block_number: block,
      week_number: params.globalWeek,
      draft_data: shell as unknown as HyroxJson,
      weekly_summary: summary as unknown as HyroxJson,
      validation_warnings: {
        warnings: validation.warnings,
        positives: validation.positives,
        progressionShell: true,
      } as unknown as HyroxJson,
      coach_note: params.coachNote || null,
      athlete_facing_note: params.athleteFacingNote || null,
      status: "draft_generated",
      published_at: null,
    })
    .select(DRAFT_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return {
    draft: data as HyroxProgrammeDraftRow,
    draftData: shell,
    created: true,
  };
}

export async function ensureProgrammeDraftWeeksExist(
  supabase: SupabaseClient,
  params: {
    athleteId: string;
    athlete: CoachAthlete;
    globalWeeks: number[];
    mappedProfileId?: string | null;
    coachNote?: string;
    athleteFacingNote?: string;
  }
): Promise<
  Array<{
    globalWeek: number;
    draftId: string;
    draftData: CoachDraftWeek;
    created: boolean;
  }>
> {
  const out = [];
  for (const globalWeek of params.globalWeeks) {
    const ensured = await ensureProgrammeDraftWeekExists(supabase, {
      athleteId: params.athleteId,
      athlete: params.athlete,
      globalWeek,
      mappedProfileId: params.mappedProfileId,
      coachNote: params.coachNote,
      athleteFacingNote: params.athleteFacingNote,
    });
    out.push({
      globalWeek,
      draftId: ensured.draft.id,
      draftData: ensured.draftData,
      created: ensured.created,
    });
  }
  return out;
}
