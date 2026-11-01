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
  mergeClonedWeekIntoEmptySlots,
  resolveAutoCarryForward,
  resolveCopyWeekDecision,
  AUTO_CARRY_COPY,
  COPY_WEEK_ERROR,
  type CopyWeekConflictMode,
  type CopyWeekDestination,
  type CopyWeekTargetState,
} from "@/app/lib/hyroxCopyProgrammeWeek";
import {
  ensureUnpublishedWorkingDraft,
  isPublishedDraftRow,
  isUnpublishedWorkingDraft,
} from "@/app/lib/hyroxProgrammeDraftRevision";
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
import { fetchLatestDraftForGlobalWeek as fetchPreferredDraftForGlobalWeek } from "@/app/lib/hyroxSessionFamilyEnsureDraft";

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
  // Prefer unpublished working draft over a published draft snapshot.
  return fetchPreferredDraftForGlobalWeek(supabase, athleteId, weekNumber);
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
  const unpublished = draft && isUnpublishedWorkingDraft(draft) ? draft : null;
  const draftData = unpublished ? parseCoachDraftWeekJson(unpublished.draft_data) : null;
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
    hasUnpublishedDraft: Boolean(unpublished),
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

async function archiveUnpublishedDraftsForWeek(
  supabase: SupabaseClient,
  athleteId: string,
  weekNumber: number,
  exceptDraftId?: string | null
): Promise<void> {
  let query = supabase
    .from("hyrox_programme_drafts")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("athlete_id", athleteId)
    .eq("week_number", weekNumber)
    .neq("status", "archived")
    .is("published_at", null);
  if (exceptDraftId) {
    query = query.neq("id", exceptDraftId);
  }
  const { error } = await query;
  if (error) throw new Error(error.message);
}

/**
 * Same-stage Session Family re-resolve against current Programming Anchors.
 * Preserves coach_override slots from the source preview; never auto-progresses stage.
 */
async function reResolveFamilyLinkedDraftWeek(
  supabase: SupabaseClient,
  athleteId: string,
  sourceDraft: CoachDraftWeek,
  cloned: CoachDraftWeek
): Promise<CoachDraftWeek> {
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
      ...cloned,
      days: cloned.days.map((day, dayIndex) => ({
        ...day,
        sessions: day.sessions.map((session, sessionIndex) => {
          if (!session.sessionFamily) return session;
          const family = getSessionFamily(session.sessionFamily.familyId);
          if (!family) return session;
          const sourceSession = sourceDraft.days[dayIndex]?.sessions[sessionIndex];
          const overrides =
            sourceSession?.sessionFamily != null
              ? overridesFromDraftPreview(sourceSession.sessionFamily)
              : [];
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
    // Keep stripped preview; coach can refresh by editing. Never fail duplicate.
    return cloned;
  }
}

export async function copyProgrammeWeekDraft(
  supabase: SupabaseClient,
  params: {
    athleteId: string;
    athlete: CoachAthlete;
    sourceWeek: number;
    targetWeek: number;
    /** @deprecated Prefer conflictMode. `true` maps to replace. */
    replace?: boolean;
    conflictMode?: CopyWeekConflictMode | null;
  }
): Promise<{
  sourceWeek: number;
  targetWeek: number;
  targetBlock: number;
  targetCycle: 1 | 2 | 3 | 4;
  draft: HyroxProgrammeDraftRow;
  sessionCount: number;
  replaced: boolean;
  merged: boolean;
  seededFromPublished: boolean;
  draftRevision: boolean;
  skippedSlotCount: number;
}> {
  const sourceWeek = parseCoachGlobalWeek(params.sourceWeek);
  const targetWeek = parseCoachGlobalWeek(params.targetWeek);
  if (!sourceWeek || !targetWeek) {
    throw new CopyProgrammeWeekError("INVALID_WEEK", "Invalid source or target week.", 400);
  }
  if (sourceWeek === targetWeek) {
    throw new CopyProgrammeWeekError("SAME_WEEK", COPY_WEEK_ERROR.SAME_WEEK, 400);
  }

  const conflictMode: CopyWeekConflictMode | boolean | null =
    params.conflictMode ?? (params.replace === true ? "replace" : false);

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
  const decision = resolveCopyWeekDecision(targetState, conflictMode);
  if (!decision.ok) {
    throw new CopyProgrammeWeekError(decision.code, decision.message, 409);
  }

  const draftRevision = targetState.published;
  const targetBlock = blockNumberForGlobalWeek(targetWeek);

  // Always work on an unpublished draft revision — never mutate published draft / programme_weeks.
  if (decision.action === "replace") {
    await archiveUnpublishedDraftsForWeek(supabase, params.athleteId, targetWeek);
  }

  let cloned: CoachDraftWeek = cloneCoachDraftWeekForTarget(sourceDraft, {
    athleteId: params.athleteId,
    targetWeek,
  });
  cloned = await reResolveFamilyLinkedDraftWeek(
    supabase,
    params.athleteId,
    sourceDraft,
    cloned
  );

  let skippedSlotCount = 0;
  let sessionCount = sourceCount;
  let seededFromPublished = false;

  if (decision.action === "seed_from_published") {
    const ensured = await ensureUnpublishedWorkingDraft(supabase, {
      athleteId: params.athleteId,
      athlete: params.athlete,
      globalWeek: targetWeek,
      mappedProfileId: sourceRow.mapped_profile_id,
    });
    return {
      sourceWeek,
      targetWeek,
      targetBlock,
      targetCycle: cycleInBlockForGlobalWeek(targetWeek),
      draft: ensured.draft,
      sessionCount: countDraftProgrammingSessions(ensured.draftData),
      replaced: false,
      merged: false,
      seededFromPublished: ensured.forkedFromPublished || targetState.published,
      draftRevision: true,
      skippedSlotCount: 0,
    };
  }

  if (decision.action === "merge_empty_slots") {
    const working = await ensureUnpublishedWorkingDraft(supabase, {
      athleteId: params.athleteId,
      athlete: params.athlete,
      globalWeek: targetWeek,
      mappedProfileId: sourceRow.mapped_profile_id,
    });
    const baseDraft = working.draftData;
    const merged = mergeClonedWeekIntoEmptySlots(baseDraft, cloned);
    if (merged.copiedCount < 1) {
      throw new CopyProgrammeWeekError(
        "TARGET_MERGE_NO_EMPTY",
        COPY_WEEK_ERROR.TARGET_MERGE_NO_EMPTY,
        409
      );
    }
    cloned = merged.draft;
    sessionCount = merged.copiedCount;
    skippedSlotCount = merged.skippedCount;
    seededFromPublished = working.forkedFromPublished;

    const summary = computeWeeklySummary(cloned, params.athlete);
    const validation = validateCoachDraft(cloned, params.athlete);
    const { data, error } = await supabase
      .from("hyrox_programme_drafts")
      .update({
        draft_data: cloned as unknown as HyroxJson,
        weekly_summary: summary as unknown as HyroxJson,
        validation_warnings: {
          warnings: validation.warnings,
          positives: validation.positives,
          draftRevision,
        } as unknown as HyroxJson,
        coach_note: sourceRow.coach_note,
        athlete_facing_note: sourceRow.athlete_facing_note,
        status: "draft_generated",
        published_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", working.draft.id)
      .select(DRAFT_SELECT)
      .single();
    if (error) throw new Error(error.message);
    if (isPublishedDraftRow(data as HyroxProgrammeDraftRow)) {
      throw new Error("Refusing to leave published draft row as working revision.");
    }
    return {
      sourceWeek,
      targetWeek,
      targetBlock,
      targetCycle: cycleInBlockForGlobalWeek(targetWeek),
      draft: data as HyroxProgrammeDraftRow,
      sessionCount,
      replaced: false,
      merged: true,
      seededFromPublished,
      draftRevision,
      skippedSlotCount,
    };
  }

  // copy | replace → write duplicated source into unpublished revision
  const ensured = await ensureUnpublishedWorkingDraft(supabase, {
    athleteId: params.athleteId,
    athlete: params.athlete,
    globalWeek: targetWeek,
    seedDraftData: cloned,
    mappedProfileId: sourceRow.mapped_profile_id,
    coachNote: sourceRow.coach_note,
    athleteFacingNote: sourceRow.athlete_facing_note,
  });

  // ensure created empty/seeded shell; for replace we archived first so created=true with seed.
  // If it reused an empty unpublished shell, overwrite with cloned content.
  const summary = computeWeeklySummary(cloned, params.athlete);
  const validation = validateCoachDraft(cloned, params.athlete);
  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .update({
      draft_data: cloned as unknown as HyroxJson,
      weekly_summary: summary as unknown as HyroxJson,
      validation_warnings: {
        warnings: validation.warnings,
        positives: validation.positives,
        draftRevision,
      } as unknown as HyroxJson,
      coach_note: sourceRow.coach_note,
      athlete_facing_note: sourceRow.athlete_facing_note,
      status: "draft_generated",
      published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ensured.draft.id)
    .select(DRAFT_SELECT)
    .single();
  if (error) throw new Error(error.message);

  return {
    sourceWeek,
    targetWeek,
    targetBlock,
    targetCycle: cycleInBlockForGlobalWeek(targetWeek),
    draft: data as HyroxProgrammeDraftRow,
    sessionCount,
    replaced: decision.action === "replace",
    merged: false,
    seededFromPublished: ensured.forkedFromPublished,
    draftRevision,
    skippedSlotCount,
  };
}

async function inspectTargetWeekForAutoCarry(
  supabase: SupabaseClient,
  athleteId: string,
  weekNumber: number
): Promise<CopyWeekTargetState> {
  const state = await inspectTargetWeekState(supabase, athleteId, weekNumber);
  const { data: weekRows, error: weekError } = await supabase
    .from("hyrox_programme_weeks")
    .select("id, status")
    .eq("athlete_id", athleteId)
    .eq("week_number", weekNumber);
  if (weekError) throw new Error(weekError.message);
  const weeks = (weekRows as Array<{ id: string; status: string }> | null) ?? [];
  if (weeks.length === 0) return state;

  const { data: sessionRows, error: sessionError } = await supabase
    .from("hyrox_programme_sessions")
    .select("status, completed_at, athlete_feedback")
    .in(
      "programme_week_id",
      weeks.map((row) => row.id)
    );
  if (sessionError) throw new Error(sessionError.message);
  const sessions = (sessionRows as Pick<
    HyroxProgrammeSessionRow,
    "status" | "completed_at" | "athlete_feedback"
  >[]) ?? [];

  return {
    hasProgramming: state.hasProgramming || sessions.length > 0,
    published: state.published || weeks.some((row) => row.status === "published"),
    hasUnpublishedDraft: state.hasUnpublishedDraft,
    athleteHistory:
      state.athleteHistory || sessions.some((row) => publishedSessionHasAthleteLogs(row)),
  };
}

export type AutoCarryForwardResult = {
  status: "copied" | "preserved" | "skipped";
  fromWeek: number;
  toWeek: number;
  targetBlock: number;
  targetCycle: 1 | 2 | 3 | 4;
  sessionCount: number | null;
  draftId: string | null;
  message: string;
  detail: string | null;
  reason:
    | "copied"
    | "has_programming"
    | "published"
    | "athlete_activity"
    | "not_consecutive"
    | "source_unavailable";
};

/**
 * Consecutive week convenience: seed an empty target from the previous week's coach draft.
 * Never overwrites. Never fails the week change. Reuses copyProgrammeWeekDraft.
 */
export async function autoCarryForwardProgrammeWeek(
  supabase: SupabaseClient,
  params: {
    athleteId: string;
    athlete: CoachAthlete;
    fromWeek: number;
    toWeek: number;
  }
): Promise<AutoCarryForwardResult> {
  const fromWeek = parseCoachGlobalWeek(params.fromWeek);
  const toWeek = parseCoachGlobalWeek(params.toWeek);
  if (!fromWeek || !toWeek) {
    throw new CopyProgrammeWeekError("INVALID_WEEK", "Invalid source or target week.", 400);
  }

  const targetBlock = blockNumberForGlobalWeek(toWeek);
  const targetCycle = cycleInBlockForGlobalWeek(toWeek);
  const base = {
    fromWeek,
    toWeek,
    targetBlock,
    targetCycle,
    sessionCount: null as number | null,
    draftId: null as string | null,
  };

  const sourceRow = await fetchLatestDraftForGlobalWeek(supabase, params.athleteId, fromWeek);
  const sourceDraft = sourceRow ? parseCoachDraftWeekJson(sourceRow.draft_data) : null;
  const sourceHasProgramming = countDraftProgrammingSessions(sourceDraft) > 0;
  const target = await inspectTargetWeekForAutoCarry(supabase, params.athleteId, toWeek);
  const decision = resolveAutoCarryForward({
    fromWeek,
    toWeek,
    target,
    sourceHasProgramming,
  });

  if (decision.action === "skip") {
    return {
      ...base,
      status: "skipped",
      reason: decision.reason,
      message:
        decision.reason === "source_unavailable" ? AUTO_CARRY_COPY.sourceUnavailable : "",
      detail: null,
    };
  }

  if (decision.action === "preserve") {
    return {
      ...base,
      status: "preserved",
      reason: decision.reason,
      message: AUTO_CARRY_COPY.preservedTitle(toWeek),
      detail: AUTO_CARRY_COPY.preservedDetail,
    };
  }

  try {
    const copied = await copyProgrammeWeekDraft(supabase, {
      athleteId: params.athleteId,
      athlete: params.athlete,
      sourceWeek: fromWeek,
      targetWeek: toWeek,
      replace: false,
    });
    return {
      ...base,
      status: "copied",
      reason: "copied",
      sessionCount: copied.sessionCount,
      draftId: copied.draft.id,
      targetBlock: copied.targetBlock,
      targetCycle: copied.targetCycle,
      message: AUTO_CARRY_COPY.copiedTitle(fromWeek, toWeek),
      detail: AUTO_CARRY_COPY.copiedDetail,
    };
  } catch (e) {
    if (e instanceof CopyProgrammeWeekError) {
      if (
        e.code === "TARGET_HAS_PROGRAMMING" ||
        e.code === "TARGET_PUBLISHED" ||
        e.code === "TARGET_ATHLETE_ACTIVITY"
      ) {
        return {
          ...base,
          status: "preserved",
          reason:
            e.code === "TARGET_PUBLISHED"
              ? "published"
              : e.code === "TARGET_ATHLETE_ACTIVITY"
                ? "athlete_activity"
                : "has_programming",
          message: AUTO_CARRY_COPY.preservedTitle(toWeek),
          detail: AUTO_CARRY_COPY.preservedDetail,
        };
      }
      if (e.code === "SOURCE_MISSING" || e.code === "SOURCE_EMPTY") {
        return {
          ...base,
          status: "skipped",
          reason: "source_unavailable",
          message: AUTO_CARRY_COPY.sourceUnavailable,
          detail: null,
        };
      }
    }
    throw e;
  }
}
