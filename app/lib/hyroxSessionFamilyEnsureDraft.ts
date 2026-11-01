/**
 * Ensure programme draft weeks exist for progression apply.
 * Creates empty draft shells / unpublished revisions only — never publishes,
 * never mutates current_week, never mutates published draft rows in place.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import {
  parseCoachDraftWeekJson,
  type CoachDraftWeek,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import type { HyroxProgrammeDraftRow } from "@/app/lib/hyroxDatabaseTypes";
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
    .neq("status", "published")
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
 * Idempotent: return unpublished working draft for global week, or insert a shell /
 * fork from a published draft snapshot. Does NOT update hyrox_athletes.current_week.
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

  const { ensureUnpublishedWorkingDraft, isUnpublishedWorkingDraft } = await import(
    "@/app/lib/hyroxProgrammeDraftRevision"
  );
  if (existing && isUnpublishedWorkingDraft(existing)) {
    const parsed =
      parseCoachDraftWeekJson(existing.draft_data) ??
      buildEmptyCoachDraftWeekShell({
        athleteId: params.athleteId,
        globalWeek: params.globalWeek,
      });
    return { draft: existing, draftData: parsed, created: false };
  }

  const ensured = await ensureUnpublishedWorkingDraft(supabase, {
    athleteId: params.athleteId,
    athlete: params.athlete,
    globalWeek: params.globalWeek,
    mappedProfileId: params.mappedProfileId,
    coachNote: params.coachNote,
    athleteFacingNote: params.athleteFacingNote,
  });
  return {
    draft: ensured.draft,
    draftData: ensured.draftData,
    created: ensured.created,
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
