import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeWeeklySummary,
  parseCoachDraftWeekJson,
  validateCoachDraft,
  type CoachDraftWeek,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import type {
  HyroxJson,
  HyroxProgrammeDraftRow,
  HyroxProgrammeSessionRow,
  HyroxProgrammeWeekRow,
} from "@/app/lib/hyroxDatabaseTypes";
import {
  cloneCoachDraftWeekForTarget,
  countDraftProgrammingSessions,
  destinationMetaForWeek,
  resolveCopyWeekDecision,
  COPY_WEEK_ERROR,
  type CopyWeekDestination,
  type CopyWeekTargetState,
} from "@/app/lib/hyroxCopyProgrammeWeek";
import {
  blockNumberForGlobalWeek,
  cycleInBlockForGlobalWeek,
  parseCoachGlobalWeek,
  visibleCoachBlockCount,
  type ProgrammeLengthWeeks,
} from "@/app/lib/hyroxProgrammeDates";
import {
  fetchHighestProgrammeBlockNumber,
  publishedSessionHasAthleteLogs,
} from "@/app/lib/hyroxProgrammeServer";

const DRAFT_SELECT =
  "id, athlete_id, mapped_profile_id, created_at, updated_at, block_number, week_number, draft_data, weekly_summary, validation_warnings, coach_note, athlete_facing_note, status, published_at";

const WEEK_SELECT =
  "id, athlete_id, source_draft_id, created_at, updated_at, block_number, week_number, week_start_date, week_end_date, weekly_focus, coach_note, athlete_facing_note, weekly_summary, status, published_at";

export class CopyProgrammeWeekError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number = 409
  ) {
    super(message);
    this.name = "CopyProgrammeWeekError";
  }
}

async function fetchLatestDraftForGlobalWeek(
  supabase: SupabaseClient,
  athleteId: string,
  weekNumber: number
): Promise<HyroxProgrammeDraftRow | null> {
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

async function fetchPublishedWeekForGlobalWeek(
  supabase: SupabaseClient,
  athleteId: string,
  weekNumber: number
): Promise<HyroxProgrammeWeekRow | null> {
  const { data, error } = await supabase
    .from("hyrox_programme_weeks")
    .select(WEEK_SELECT)
    .eq("athlete_id", athleteId)
    .eq("week_number", weekNumber)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as HyroxProgrammeWeekRow | null) ?? null;
}

async function inspectTargetWeekState(
  supabase: SupabaseClient,
  athleteId: string,
  weekNumber: number
): Promise<CopyWeekTargetState> {
  const [draft, published] = await Promise.all([
    fetchLatestDraftForGlobalWeek(supabase, athleteId, weekNumber),
    fetchPublishedWeekForGlobalWeek(supabase, athleteId, weekNumber),
  ]);
  const draftData = draft ? parseCoachDraftWeekJson(draft.draft_data) : null;
  const hasProgramming = countDraftProgrammingSessions(draftData) > 0;
  let athleteHistory = false;
  if (published) {
    const { data, error } = await supabase
      .from("hyrox_programme_sessions")
      .select("status, completed_at, athlete_feedback")
      .eq("programme_week_id", published.id);
    if (error) throw new Error(error.message);
    const rows = (data as Pick<
      HyroxProgrammeSessionRow,
      "status" | "completed_at" | "athlete_feedback"
    >[]) ?? [];
    athleteHistory = rows.some((row) => publishedSessionHasAthleteLogs(row));
  }
  return {
    hasProgramming,
    published: Boolean(published),
    athleteHistory,
  };
}

export async function listCopyWeekDestinations(
  supabase: SupabaseClient,
  params: {
    athleteId: string;
    sourceWeek: number;
    programmeStartYmd: string | null;
    programmeLengthWeeks: ProgrammeLengthWeeks;
  }
): Promise<{ source: HyroxProgrammeDraftRow; destinations: CopyWeekDestination[] }> {
  const source = await fetchLatestDraftForGlobalWeek(
    supabase,
    params.athleteId,
    params.sourceWeek
  );
  if (!source) {
    throw new CopyProgrammeWeekError("SOURCE_MISSING", COPY_WEEK_ERROR.SOURCE_MISSING, 404);
  }
  const sourceDraft = parseCoachDraftWeekJson(source.draft_data);
  if (countDraftProgrammingSessions(sourceDraft) < 1) {
    throw new CopyProgrammeWeekError("SOURCE_EMPTY", COPY_WEEK_ERROR.SOURCE_EMPTY, 400);
  }

  const highestExisting = await fetchHighestProgrammeBlockNumber(supabase, params.athleteId);
  const sourceBlock = blockNumberForGlobalWeek(params.sourceWeek);
  const maxBlocks = visibleCoachBlockCount({
    programmeLengthWeeks: params.programmeLengthWeeks,
    highestExistingBlock: Math.max(highestExisting, sourceBlock),
    requestedBlock: sourceBlock,
  });
  const maxWeek = Math.max(maxBlocks * 4, params.sourceWeek + 4);

  const destinations: CopyWeekDestination[] = [];
  for (let week = 1; week <= maxWeek; week += 1) {
    if (week === params.sourceWeek) continue;
    const state = await inspectTargetWeekState(supabase, params.athleteId, week);
    destinations.push(
      destinationMetaForWeek({
        week,
        programmeStartYmd: params.programmeStartYmd,
        state,
      })
    );
  }

  return { source, destinations };
}

export async function copyProgrammeWeekDraft(
  supabase: SupabaseClient,
  params: {
    athleteId: string;
    athlete: CoachAthlete;
    sourceWeek: number;
    targetWeek: number;
    replace: boolean;
  }
): Promise<{
  sourceWeek: number;
  targetWeek: number;
  targetBlock: number;
  targetCycle: 1 | 2 | 3 | 4;
  draft: HyroxProgrammeDraftRow;
  sessionCount: number;
  replaced: boolean;
}> {
  const sourceWeek = parseCoachGlobalWeek(params.sourceWeek);
  const targetWeek = parseCoachGlobalWeek(params.targetWeek);
  if (!sourceWeek || !targetWeek) {
    throw new CopyProgrammeWeekError("INVALID_WEEK", "Invalid source or target week.", 400);
  }
  if (sourceWeek === targetWeek) {
    throw new CopyProgrammeWeekError("SAME_WEEK", COPY_WEEK_ERROR.SAME_WEEK, 400);
  }

  const sourceRow = await fetchLatestDraftForGlobalWeek(supabase, params.athleteId, sourceWeek);
  if (!sourceRow) {
    throw new CopyProgrammeWeekError("SOURCE_MISSING", COPY_WEEK_ERROR.SOURCE_MISSING, 404);
  }
  const sourceDraft = parseCoachDraftWeekJson(sourceRow.draft_data);
  const sourceCount = countDraftProgrammingSessions(sourceDraft);
  if (!sourceDraft || sourceCount < 1) {
    throw new CopyProgrammeWeekError("SOURCE_EMPTY", COPY_WEEK_ERROR.SOURCE_EMPTY, 400);
  }

  const targetState = await inspectTargetWeekState(supabase, params.athleteId, targetWeek);
  const decision = resolveCopyWeekDecision(targetState, params.replace);
  if (!decision.ok) {
    throw new CopyProgrammeWeekError(decision.code, decision.message, 409);
  }

  const cloned: CoachDraftWeek = cloneCoachDraftWeekForTarget(sourceDraft, {
    athleteId: params.athleteId,
    targetWeek,
  });
  const summary = computeWeeklySummary(cloned, params.athlete);
  const validation = validateCoachDraft(cloned, params.athlete);
  const targetBlock = blockNumberForGlobalWeek(targetWeek);

  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .insert({
      athlete_id: params.athleteId,
      mapped_profile_id: sourceRow.mapped_profile_id,
      block_number: targetBlock,
      week_number: targetWeek,
      draft_data: cloned as unknown as HyroxJson,
      weekly_summary: summary as unknown as HyroxJson,
      validation_warnings: {
        warnings: validation.warnings,
        positives: validation.positives,
      } as unknown as HyroxJson,
      coach_note: sourceRow.coach_note,
      athlete_facing_note: sourceRow.athlete_facing_note,
      status: "draft_generated",
      published_at: null,
    })
    .select(DRAFT_SELECT)
    .single();

  if (error) throw new Error(error.message);

  return {
    sourceWeek,
    targetWeek,
    targetBlock,
    targetCycle: cycleInBlockForGlobalWeek(targetWeek),
    draft: data as HyroxProgrammeDraftRow,
    sessionCount: sourceCount,
    replaced: decision.action === "replace",
  };
}
