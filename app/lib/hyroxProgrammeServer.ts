import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import {
  BLOCK_WEEK_FOCUS_LABELS,
  computeWeeklySummary,
  countCoachDraftSessions,
  globalWeekForBlock,
  validateCoachDraft,
  type CoachDraftWeek,
  type CoachProgrammeStatus,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  assertDraftSessionCountMatchesUi,
  loadApprovedDraftWeekFromRow,
  type PublishWeekAudit,
  type PublishWeekSyncAudit,
  StaleDraftPublishError,
} from "@/app/lib/hyroxProgrammePublishAudit";

export { StaleDraftPublishError } from "@/app/lib/hyroxProgrammePublishAudit";
export type { PublishWeekAudit, PublishWeekSyncAudit } from "@/app/lib/hyroxProgrammePublishAudit";
import { coachStatusToDraftDb } from "@/app/lib/hyroxCoachProgrammeStatusMap";
import type {
  HyroxAthleteProfile,
  ProfileReviewOverrides,
} from "@/app/lib/hyroxAthleteProfileTypes";
import { recordHyroxStatusHistory } from "@/app/lib/hyroxAthleteServer";
import type {
  HyroxAthleteRow,
  HyroxJson,
  HyroxMappedProfileRow,
  HyroxProgrammeDraftRow,
  HyroxProgrammeDraftStatus,
  HyroxProgrammeSessionRow,
  HyroxProgrammeWeekRow,
} from "@/app/lib/hyroxDatabaseTypes";
import {
  formatProgrammeDayLabel,
  formatSessionCalendarDateLabel,
  sessionDateYmdFromProgrammeStart,
  sortProgrammeSessions,
  type ProgrammeTimeOfDay,
} from "@/app/lib/hyroxAthleteProgrammeSort";
import { parseHyroxAthleteSessionFeedback } from "@/app/lib/hyroxAthleteSessionFeedback";
import type { HyroxSession, SessionStatus } from "@/app/lib/hyroxTeamDashboardMock";
import {
  derivePublishedSessionName,
  diffSessionSyncFields,
  draftInsertRowPreview,
  draftSessionIdFromInsertRow,
  findPublishedSessionForDraftRow,
  pickSessionSyncFields,
  publishedSessionLivePreview,
  resolveAthleteSessionDisplayName,
  sessionRowKey,
  verifyPublishedWeekMatchesDraft,
  type DraftSessionInsertRow,
  type PublishSessionSyncDetail,
} from "@/app/lib/hyroxProgrammeSessionSync";
import { resolveAthleteSessionDetailFromPublishedRow } from "@/app/lib/hyroxAthleteSessionDetail";
import {
  deriveLiveGlobalWeek,
  deriveWeekCalendarStatusForAthleteWeek,
  getBlockWeekRole,
  resolveAthleteWeekDateRange,
  weekDateRangeFromProgrammeStart,
  type ProgrammeLengthWeeks,
  type ProgrammeWeekCalendarStatus,
} from "@/app/lib/hyroxProgrammeDates";

export { sessionRowKey } from "@/app/lib/hyroxProgrammeSessionSync";

const MAPPED_PROFILE_SELECT =
  "id, athlete_id, created_at, updated_at, mapped_profile, coach_overrides, effective_profile, athlete_level, main_limiter, secondary_limiter, recovery_risk, double_session_readiness, first_block_focus, coach_review_flags, status";

const DRAFT_SELECT =
  "id, athlete_id, mapped_profile_id, created_at, updated_at, block_number, week_number, draft_data, weekly_summary, validation_warnings, coach_note, athlete_facing_note, status, published_at";

export type AthleteProgrammeVisibility = "coach_reviewing" | "building" | "published";

export type AthleteProgrammeApiState = "published" | "building" | "coach_reviewing" | "not_started";

export function resolveAthleteProgrammeApiState(params: {
  published: boolean;
  visibility: AthleteProgrammeVisibility;
  athleteStatus: string;
}): AthleteProgrammeApiState {
  if (params.published) return "published";
  if (params.visibility === "building") return "building";
  if (
    params.athleteStatus === "assessment_required" ||
    params.athleteStatus === "testing_required" ||
    params.athleteStatus === "accepted" ||
    params.athleteStatus === "payment_confirmed"
  ) {
    return "not_started";
  }
  return "coach_reviewing";
}

export type PublishedProgrammeWeekBundle = {
  week: HyroxProgrammeWeekRow | null;
  sessions: HyroxProgrammeSessionRow[];
  generated: boolean;
  weekNumber: number;
  weekStartDate: string | null;
  weekEndDate: string | null;
  calendarStatus: ProgrammeWeekCalendarStatus | "not_generated" | "locked";
};

export type AthletePublishedProgramme = {
  visibility: AthleteProgrammeVisibility;
  published: boolean;
  programmeStatus: string;
  athleteStatus: string;
  week: HyroxProgrammeWeekRow | null;
  sessions: HyroxProgrammeSessionRow[];
  weeks: PublishedProgrammeWeekBundle[];
  programmeStartDate: string | null;
  programmeLengthWeeks: ProgrammeLengthWeeks;
  liveGlobalWeek: number;
  athlete: Pick<
    HyroxAthleteRow,
    | "name"
    | "race_name"
    | "race_date"
    | "race_category"
    | "target_time"
    | "current_block"
    | "current_week"
    | "programme_start_date"
    | "programme_length_weeks"
  >;
};

export function resolvePublishedWeekCalendarStatus(
  bundle: Pick<
    PublishedProgrammeWeekBundle,
    "generated" | "weekStartDate" | "weekEndDate" | "weekNumber" | "week"
  >,
  programmeStartDate: string | null
): PublishedProgrammeWeekBundle["calendarStatus"] {
  if (!bundle.generated) return "not_generated";
  const dbStart = bundle.week?.week_start_date ?? bundle.weekStartDate;
  const dbEnd = bundle.week?.week_end_date ?? bundle.weekEndDate;
  return deriveWeekCalendarStatusForAthleteWeek({
    programmeStartYmd: programmeStartDate,
    weekNumber: bundle.weekNumber,
    dbWeekStartYmd: dbStart,
    dbWeekEndYmd: dbEnd,
  });
}

/** Normalized week dates + label for athlete UI (raw DB when valid, else programme_start_date). */
export function resolvePublishedWeekDates(
  bundle: Pick<
    PublishedProgrammeWeekBundle,
    "weekStartDate" | "weekEndDate" | "weekNumber" | "week"
  >,
  programmeStartDate: string | null
) {
  const dbStart = bundle.week?.week_start_date ?? bundle.weekStartDate;
  const dbEnd = bundle.week?.week_end_date ?? bundle.weekEndDate;
  return resolveAthleteWeekDateRange({
    programmeStartYmd: programmeStartDate,
    weekNumber: bundle.weekNumber,
    dbWeekStartYmd: dbStart,
    dbWeekEndYmd: dbEnd,
  });
}

/** One active mapped profile per athlete — update latest row (simplest safe model). */
export async function upsertMappedProfile(
  supabase: SupabaseClient,
  params: {
    athleteId: string;
    mappedProfile: HyroxAthleteProfile;
    coachOverrides: ProfileReviewOverrides;
    effectiveProfile: HyroxAthleteProfile;
    changedBy: string | null;
  }
): Promise<{ profile: HyroxMappedProfileRow; created: boolean }> {
  const { data: existing } = await supabase
    .from("hyrox_mapped_profiles")
    .select("id")
    .eq("athlete_id", params.athleteId)
    .neq("status", "superseded")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = {
    athlete_id: params.athleteId,
    mapped_profile: params.mappedProfile as unknown as HyroxJson,
    coach_overrides: params.coachOverrides as unknown as HyroxJson,
    effective_profile: params.effectiveProfile as unknown as HyroxJson,
    athlete_level: params.effectiveProfile.abilityLevel,
    main_limiter: params.effectiveProfile.mainLimiter,
    secondary_limiter: params.effectiveProfile.secondaryLimiter,
    recovery_risk: params.effectiveProfile.recoveryRisk,
    double_session_readiness: params.effectiveProfile.doubleSessionReadiness,
    first_block_focus: params.effectiveProfile.firstBlockFocus,
    coach_review_flags: params.effectiveProfile.coachReviewFlags as unknown as HyroxJson,
    status: "mapped" as const,
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("hyrox_mapped_profiles")
      .update(row)
      .eq("id", existing.id)
      .select(MAPPED_PROFILE_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return { profile: data as HyroxMappedProfileRow, created: false };
  }

  const { data, error } = await supabase
    .from("hyrox_mapped_profiles")
    .insert(row)
    .select(MAPPED_PROFILE_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return { profile: data as HyroxMappedProfileRow, created: true };
}

export async function fetchLatestMappedProfile(
  supabase: SupabaseClient,
  athleteId: string
): Promise<HyroxMappedProfileRow | null> {
  const { data } = await supabase
    .from("hyrox_mapped_profiles")
    .select(MAPPED_PROFILE_SELECT)
    .eq("athlete_id", athleteId)
    .neq("status", "superseded")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as HyroxMappedProfileRow | null) ?? null;
}

export async function fetchLatestProgrammeDraft(
  supabase: SupabaseClient,
  athleteId: string
): Promise<HyroxProgrammeDraftRow | null> {
  const { data } = await supabase
    .from("hyrox_programme_drafts")
    .select(DRAFT_SELECT)
    .eq("athlete_id", athleteId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as HyroxProgrammeDraftRow | null) ?? null;
}

export async function fetchBlockProgrammeDrafts(
  supabase: SupabaseClient,
  athleteId: string,
  blockNumber: number
): Promise<HyroxProgrammeDraftRow[]> {
  const weekNumbers = [1, 2, 3, 4].map((cycle) =>
    globalWeekForBlock(blockNumber as 1 | 2 | 3, cycle as 1 | 2 | 3 | 4)
  );
  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .select(DRAFT_SELECT)
    .eq("athlete_id", athleteId)
    .eq("block_number", blockNumber)
    .in("week_number", weekNumbers)
    .neq("status", "archived")
    .order("week_number", { ascending: true });

  if (error) throw new Error(error.message);
  const rows = (data as HyroxProgrammeDraftRow[]) ?? [];
  const latestByWeek = new Map<number, HyroxProgrammeDraftRow>();
  for (const row of rows) {
    const prev = latestByWeek.get(row.week_number);
    if (!prev || row.updated_at > prev.updated_at) {
      latestByWeek.set(row.week_number, row);
    }
  }
  return weekNumbers
    .map((w) => latestByWeek.get(w))
    .filter((r): r is HyroxProgrammeDraftRow => Boolean(r));
}

export async function approveProgrammeBlockDrafts(
  supabase: SupabaseClient,
  params: {
    athleteRow: HyroxAthleteRow;
    blockNumber: number;
    changedBy: string | null;
  }
): Promise<{ approved: number; draftIds: string[] }> {
  const rows = await fetchBlockProgrammeDrafts(supabase, params.athleteRow.id, params.blockNumber);
  const draftIds: string[] = [];
  let approved = 0;

  for (const row of rows) {
    if (row.status === "published" || row.status === "approved") {
      if (row.status === "approved") draftIds.push(row.id);
      continue;
    }
    const saved = await approveProgrammeDraft(supabase, {
      draftId: row.id,
      athleteRow: params.athleteRow,
      changedBy: params.changedBy,
    });
    draftIds.push(saved.id);
    approved += 1;
  }

  return { approved, draftIds };
}

export async function fetchProgrammeDraftById(
  supabase: SupabaseClient,
  draftId: string
): Promise<{ draft: HyroxProgrammeDraftRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .select(DRAFT_SELECT)
    .eq("id", draftId)
    .maybeSingle();

  if (error) {
    return { draft: null, error: error.message };
  }
  return { draft: (data as HyroxProgrammeDraftRow | null) ?? null, error: null };
}

export function logCoachDraftRoute(
  action: "approve" | "publish" | "patch" | "load",
  draftId: string,
  draft: HyroxProgrammeDraftRow | null,
  extra?: Record<string, unknown>
) {
  if (process.env.NODE_ENV !== "development") return;
  console.log(`[hyrox/programme-drafts] ${action}`, {
    draftId,
    found: Boolean(draft),
    athlete_id: draft?.athlete_id ?? null,
    status: draft?.status ?? null,
    ...extra,
  });
}

export function parseCoachDraftWeek(data: HyroxJson | null | undefined): CoachDraftWeek | null {
  if (!data || typeof data !== "object") return null;
  const d = data as CoachDraftWeek;
  if (!d.days || !Array.isArray(d.days)) return null;
  return d;
}

export async function insertProgrammeDraft(
  supabase: SupabaseClient,
  params: {
    athlete: CoachAthlete;
    athleteRow: HyroxAthleteRow;
    mappedProfileId: string | null;
    draft: CoachDraftWeek;
    coachNote: string;
    athleteFacingNote: string;
    changedBy: string | null;
  }
): Promise<HyroxProgrammeDraftRow> {
  const summary = computeWeeklySummary(params.draft, params.athlete);
  const validation = validateCoachDraft(params.draft, params.athlete);

  const { data: draftRow, error: draftError } = await supabase
    .from("hyrox_programme_drafts")
    .insert({
      athlete_id: params.athleteRow.id,
      mapped_profile_id: params.mappedProfileId,
      block_number: params.draft.block,
      week_number: params.draft.week,
      draft_data: params.draft as unknown as HyroxJson,
      weekly_summary: summary as unknown as HyroxJson,
      validation_warnings: {
        warnings: validation.warnings,
        positives: validation.positives,
      } as unknown as HyroxJson,
      coach_note: params.coachNote || null,
      athlete_facing_note: params.athleteFacingNote || null,
      status: "draft_generated",
    })
    .select(DRAFT_SELECT)
    .single();

  if (draftError) throw new Error(draftError.message);

  const statusFrom = params.athleteRow.status;
  const { error: athleteError } = await supabase
    .from("hyrox_athletes")
    .update({
      status: "draft_generated",
      programme_status: "draft_generated",
      current_block: params.draft.block,
      current_week: params.draft.week,
    })
    .eq("id", params.athleteRow.id)
    .select("id, status, programme_status")
    .single();

  if (athleteError) throw new Error(athleteError.message);

  await recordHyroxStatusHistory(supabase, {
    athleteId: params.athleteRow.id,
    statusFrom,
    statusTo: "draft_generated",
    changedBy: params.changedBy,
    reason: "programme_draft_generated",
    metadata: {
      draft_id: (draftRow as HyroxProgrammeDraftRow).id,
      programme_status: "draft_generated",
    },
  });

  return draftRow as HyroxProgrammeDraftRow;
}

export async function updateProgrammeDraft(
  supabase: SupabaseClient,
  params: {
    draftId: string;
    athlete: CoachAthlete;
    athleteRow: HyroxAthleteRow;
    draft: CoachDraftWeek;
    coachNote: string;
    athleteFacingNote: string;
    coachStatus?: CoachProgrammeStatus;
    changedBy: string | null;
  }
): Promise<HyroxProgrammeDraftRow> {
  const summary = computeWeeklySummary(params.draft, params.athlete);
  const validation = validateCoachDraft(params.draft, params.athlete);
  const dbStatus = params.coachStatus ? coachStatusToDraftDb(params.coachStatus) : null;

  const updatePayload: Record<string, unknown> = {
    draft_data: params.draft as unknown as HyroxJson,
    weekly_summary: summary as unknown as HyroxJson,
    validation_warnings: {
      warnings: validation.warnings,
      positives: validation.positives,
    } as unknown as HyroxJson,
    coach_note: params.coachNote || null,
    athlete_facing_note: params.athleteFacingNote || null,
    block_number: params.draft.block,
    week_number: params.draft.week,
  };

  if (dbStatus) {
    updatePayload.status = dbStatus === "draft_generated" ? "edited" : dbStatus;
  }

  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .update(updatePayload)
    .eq("id", params.draftId)
    .select(DRAFT_SELECT)
    .single();

  if (error) throw new Error(error.message);

  const programmeStatus = dbStatus
    ? dbStatus === "draft_generated"
      ? "edited"
      : dbStatus === "coach_reviewing"
        ? "edited"
        : dbStatus
    : null;

  if (programmeStatus && params.athleteRow.programme_status !== programmeStatus) {
    await supabase
      .from("hyrox_athletes")
      .update({ programme_status: programmeStatus })
      .eq("id", params.athleteRow.id);

    await recordHyroxStatusHistory(supabase, {
      athleteId: params.athleteRow.id,
      statusFrom: params.athleteRow.status,
      statusTo: params.athleteRow.status,
      changedBy: params.changedBy,
      reason: "programme_draft_saved",
      metadata: { draft_id: params.draftId, programme_status: programmeStatus },
    });
  }

  return data as HyroxProgrammeDraftRow;
}

export async function approveProgrammeDraft(
  supabase: SupabaseClient,
  params: {
    draftId: string;
    athleteRow: HyroxAthleteRow;
    changedBy: string | null;
  }
): Promise<HyroxProgrammeDraftRow> {
  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .update({ status: "approved" })
    .eq("id", params.draftId)
    .select(DRAFT_SELECT)
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from("hyrox_athletes")
    .update({ programme_status: "approved" })
    .eq("id", params.athleteRow.id);

  await recordHyroxStatusHistory(supabase, {
    athleteId: params.athleteRow.id,
    statusFrom: params.athleteRow.status,
    statusTo: params.athleteRow.status,
    changedBy: params.changedBy,
    reason: "programme_draft_approved",
    metadata: { draft_id: params.draftId, programme_status: "approved" },
  });

  return data as HyroxProgrammeDraftRow;
}

function mapDbSessionStatus(status: HyroxProgrammeSessionRow["status"]): SessionStatus {
  if (status === "completed") return "complete";
  if (status === "missed") return "missed";
  if (status === "modified") return "modified";
  return "upcoming";
}

function inferSessionType(
  category: string | null | undefined,
  name: string | null | undefined
): HyroxSession["type"] {
  const c = typeof category === "string" ? category.toLowerCase() : "";
  const n = typeof name === "string" ? name.toLowerCase() : "";
  if (c.includes("strength") || n.includes("strength")) return "Strength";
  if (c.includes("hyrox") || c.includes("station") || n.includes("hyrox")) return "Hybrid";
  if (c.includes("recovery") || n.includes("recovery")) return "Recovery";
  if (c.includes("aerobic") || c.includes("easy") || n.includes("aerobic")) return "Aerobic";
  if (c.includes("run") || n.includes("run") || n.includes("threshold")) return "Run";
  return "Hybrid";
}

export function mapPublishedSessionsToAthleteUi(
  sessions: HyroxProgrammeSessionRow[],
  calendar?: { programmeStartYmd: string; globalWeekNumber: number }
): HyroxSession[] {
  const dayShort: Record<string, string> = {
    Mon: "Mon",
    Tue: "Tue",
    Wed: "Wed",
    Thu: "Thu",
    Fri: "Fri",
    Sat: "Sat",
    Sun: "Sun",
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };

  const mapped = sessions.map((s) => {
    const prescription = (s.prescription ?? {}) as Record<string, unknown>;
    const meta = (s.metadata ?? {}) as Record<string, unknown>;
    const detail = resolveAthleteSessionDetailFromPublishedRow(s);
    const rpeTarget = detail.rpe;
    const duration = detail.duration;
    const day = s.day_of_week;
    const short = dayShort[day] ?? day.slice(0, 3);
    const timeOfDay = (s.session_slot as ProgrammeTimeOfDay) ?? "Main";
    const coachNote =
      (meta.coachNote as string) ??
      (prescription.coachNote as string) ??
      (prescription.coach_note as string) ??
      "";
    const feedback = parseHyroxAthleteSessionFeedback(s.athlete_feedback);

    return {
      id: s.id,
      programmeWeekId: s.programme_week_id,
      day,
      dayShort: short,
      dateLabel: calendar
        ? formatSessionCalendarDateLabel(
            day,
            sessionDateYmdFromProgrammeStart(
              calendar.programmeStartYmd,
              calendar.globalWeekNumber,
              day
            ),
            timeOfDay
          )
        : formatProgrammeDayLabel(day, timeOfDay),
      name: resolveAthleteSessionDisplayName(s),
      type: inferSessionType(s.category, s.session_name),
      focus: (meta.focus as string) ?? s.category,
      duration,
      rpeTarget,
      status: mapDbSessionStatus(s.status),
      loggedRpe: feedback.rpe ?? undefined,
      logNotes: feedback.notes ?? undefined,
      logModifications: feedback.modifications ?? undefined,
      logScore: feedback.score ?? undefined,
      completedAt: s.completed_at,
      priority: (timeOfDay === "Optional" || s.session_slot === "Optional"
        ? "Optional"
        : "Key") as HyroxSession["priority"],
      intent: detail.objective || (meta.intent as string) || s.session_name,
      timeOfDay,
      coachNote: detail.coachNote || coachNote || undefined,
      detail,
    };
  });

  return sortProgrammeSessions(mapped);
}

export function resolveAthleteProgrammeVisibility(params: {
  publishedWeek: HyroxProgrammeWeekRow | null;
  latestDraftStatus: HyroxProgrammeDraftStatus | null;
  hasAssessment: boolean;
  hasTesting: boolean;
}): AthleteProgrammeVisibility {
  if (params.publishedWeek) return "published";
  if (
    params.latestDraftStatus &&
    ["draft_generated", "coach_reviewing", "edited", "approved"].includes(params.latestDraftStatus)
  ) {
    return "building";
  }
  if (params.hasAssessment && params.hasTesting) return "coach_reviewing";
  return "coach_reviewing";
}

export async function fetchPublishedWeekCountForBlock(
  supabase: SupabaseClient,
  athleteId: string,
  blockNumber: number
): Promise<number> {
  const weekNumbers = [1, 2, 3, 4].map((cycle) =>
    globalWeekForBlock(blockNumber as 1 | 2 | 3, cycle as 1 | 2 | 3 | 4)
  );
  const { count, error } = await supabase
    .from("hyrox_programme_weeks")
    .select("id", { count: "exact", head: true })
    .eq("athlete_id", athleteId)
    .eq("status", "published")
    .in("week_number", weekNumbers);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function fetchAthletePublishedProgramme(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  flags: { hasAssessment: boolean; hasTesting: boolean }
): Promise<AthletePublishedProgramme> {
  const [{ data: publishedWeeks }, { data: draft }] = await Promise.all([
    supabase
      .from("hyrox_programme_weeks")
      .select(
        "id, athlete_id, source_draft_id, created_at, updated_at, block_number, week_number, week_start_date, week_end_date, weekly_focus, coach_note, athlete_facing_note, weekly_summary, status, published_at"
      )
      .eq("athlete_id", athlete.id)
      .eq("status", "published")
      .order("week_number", { ascending: true }),
    supabase
      .from("hyrox_programme_drafts")
      .select("status")
      .eq("athlete_id", athlete.id)
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const weekRows = (publishedWeeks as HyroxProgrammeWeekRow[] | null) ?? [];
  const weekIds = weekRows.map((w) => w.id);

  let allSessions: HyroxProgrammeSessionRow[] = [];
  if (weekIds.length > 0) {
    const { data: sessionRows } = await supabase
      .from("hyrox_programme_sessions")
      .select(
        "id, programme_week_id, athlete_id, created_at, updated_at, day_of_week, session_slot, session_name, category, prescription, metadata, status, completed_at, athlete_feedback"
      )
      .in("programme_week_id", weekIds)
      .order("day_of_week", { ascending: true })
      .order("session_slot", { ascending: true });

    allSessions = (sessionRows as HyroxProgrammeSessionRow[]) ?? [];
  }

  const programmeStartDate = athlete.programme_start_date?.trim() || null;
  const programmeLengthWeeks = (athlete.programme_length_weeks === 16 ? 16 : 12) as ProgrammeLengthWeeks;
  const liveGlobalWeek = programmeStartDate
    ? deriveLiveGlobalWeek(programmeStartDate)
    : 1;

  const weeks: PublishedProgrammeWeekBundle[] = weekRows.map((week) => {
    const globalWeek = week.week_number;
    const sessionsForWeek = allSessions.filter((s) => s.programme_week_id === week.id);
    const generated = Boolean(sessionsForWeek.length > 0);
    const dbWeekStart = week.week_start_date ?? null;
    const dbWeekEnd = week.week_end_date ?? null;
    const resolvedDates = resolveAthleteWeekDateRange({
      programmeStartYmd: programmeStartDate,
      weekNumber: globalWeek,
      dbWeekStartYmd: dbWeekStart,
      dbWeekEndYmd: dbWeekEnd,
    });
    const weekStartDate = resolvedDates?.startYmd ?? dbWeekStart;
    const weekEndDate = resolvedDates?.endYmd ?? dbWeekEnd;
    const base: PublishedProgrammeWeekBundle = {
      week,
      sessions: sessionsForWeek,
      generated,
      weekNumber: globalWeek,
      weekStartDate,
      weekEndDate,
      calendarStatus: "not_generated",
    };
    return {
      ...base,
      calendarStatus: resolvePublishedWeekCalendarStatus(base, programmeStartDate),
    };
  });

  const activeWeekNumber = programmeStartDate
    ? liveGlobalWeek
    : athlete.current_week ?? weekRows[weekRows.length - 1]?.week_number ?? 1;
  const publishedWeek =
    weekRows.find((w) => w.week_number === activeWeekNumber) ??
    weekRows.filter((w) => w.week_number <= activeWeekNumber).pop() ??
    weekRows[0] ??
    null;
  const sessions = publishedWeek
    ? allSessions.filter((s) => s.programme_week_id === publishedWeek.id)
    : [];

  const latestDraftStatus = (draft?.status as HyroxProgrammeDraftStatus | undefined) ?? null;
  const visibility = resolveAthleteProgrammeVisibility({
    publishedWeek,
    latestDraftStatus,
    hasAssessment: flags.hasAssessment,
    hasTesting: flags.hasTesting,
  });

  return {
    visibility,
    published: weekRows.length > 0,
    programmeStatus: athlete.programme_status,
    athleteStatus: athlete.status,
    week: publishedWeek,
    sessions,
    weeks,
    programmeStartDate,
    programmeLengthWeeks,
    liveGlobalWeek,
    athlete: {
      name: athlete.name,
      race_name: athlete.race_name,
      race_date: athlete.race_date,
      race_category: athlete.race_category,
      target_time: athlete.target_time,
      current_block: athlete.current_block,
      current_week: activeWeekNumber,
      programme_start_date: programmeStartDate,
      programme_length_weeks: programmeLengthWeeks,
    },
  };
}

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PUBLISHED_SESSION_SYNC_SELECT =
  "id, day_of_week, session_slot, session_name, category, prescription, metadata, status, completed_at, athlete_feedback";

export function publishedSessionHasAthleteLogs(
  row: Pick<
    HyroxProgrammeSessionRow,
    "status" | "completed_at" | "athlete_feedback"
  >
): boolean {
  if (row.status === "completed" || row.status === "missed" || row.status === "modified") {
    return true;
  }
  if (row.completed_at) return true;
  const feedback = parseHyroxAthleteSessionFeedback(row.athlete_feedback);
  return Boolean(
    feedback.rpe?.trim() ||
      feedback.notes?.trim() ||
      feedback.modifications?.trim() ||
      feedback.score?.trim()
  );
}

function toDraftInsertRow(
  row: ReturnType<typeof buildSessionInsertRowsFromDraftWeek>[number]
): DraftSessionInsertRow {
  return {
    day_of_week: row.day_of_week,
    session_slot: row.session_slot,
    session_name: row.session_name,
    category: row.category,
    prescription: row.prescription,
    metadata: row.metadata,
  };
}

export function buildSessionInsertRowsFromDraftWeek(
  draftWeek: CoachDraftWeek,
  params: { programmeWeekId: string; athleteId: string }
) {
  return draftWeek.days.flatMap((day) =>
    day.sessions.map((sess) => ({
      programme_week_id: params.programmeWeekId,
      athlete_id: params.athleteId,
      day_of_week: day.day,
      session_slot: sess.timeOfDay,
      session_name: derivePublishedSessionName(sess),
      category: sess.sessionType ?? "general",
      prescription: {
        ...(sess.prescription ?? {}),
        editConfig: sess.editConfig,
        rpeTarget: sess.rpeHr ?? sess.prescription?.rpeTarget,
      } as unknown as HyroxJson,
      metadata: {
        duration: sess.duration,
        intensity: sess.intensity,
        focus: day.stationFocus ?? sess.title,
        intent: sess.rationale,
        isKeySession: sess.isKeySession,
        isOptional: sess.isOptional,
        draftId: sess.draftId,
        coachLibraryId: sess.coachLibraryId,
      } as unknown as HyroxJson,
      status: "scheduled" as const,
    }))
  );
}

/**
 * Sync approved draft sessions into an already-published week.
 * Matches published rows by metadata.draftId, else day + session_slot.
 * Updates content fields; preserves status / completed_at / athlete_feedback.
 * Does not delete published sessions missing from the draft.
 */
export async function syncPublishedWeekSessionsFromDraft(
  supabase: SupabaseClient,
  params: {
    week: HyroxProgrammeWeekRow;
    draftWeek: CoachDraftWeek;
    athleteId: string;
    programmeStartDate: string;
    sourceDraftId?: string | null;
    audit?: PublishWeekAudit;
  }
): Promise<PublishWeekSyncAudit> {
  const { data: existingRows, error: fetchError } = await supabase
    .from("hyrox_programme_sessions")
    .select(PUBLISHED_SESSION_SYNC_SELECT)
    .eq("programme_week_id", params.week.id);

  if (fetchError) throw new Error(fetchError.message);

  const existing = (existingRows ?? []) as HyroxProgrammeSessionRow[];
  const usedPublishedIds = new Set<string>();

  const allRows = buildSessionInsertRowsFromDraftWeek(params.draftWeek, {
    programmeWeekId: params.week.id,
    athleteId: params.athleteId,
  });
  const draftInsertRows = allRows.map(toDraftInsertRow);

  const warnings: string[] = [];
  const skippedReasons: string[] = [];
  const updatedSessions: PublishWeekSyncAudit["updatedSessions"] = [];
  const sessionSyncDetails: PublishSessionSyncDetail[] = [];
  const toInsert: typeof allRows = [];
  let updatedRowsCount = 0;
  let unchangedRowsCount = 0;
  const now = new Date().toISOString();

  for (const draftRow of allRows) {
    const draftInsert = toDraftInsertRow(draftRow);
    const { row: match, source: matchSource } = findPublishedSessionForDraftRow(
      existing,
      draftInsert,
      usedPublishedIds
    );

  const detailBase: PublishSessionSyncDetail = {
      draftSessionId: draftSessionIdFromInsertRow(draftInsert),
      draftTitle: draftInsert.session_name,
      draftPreview: draftInsertRowPreview(draftInsert),
      matchedPublishedSessionId: match?.id ?? null,
      matchSource,
      previousPublishedTitle: match?.session_name ?? null,
      previousPublishedPreview: match ? publishedSessionLivePreview(match) : null,
      newPublishedPreview: draftInsertRowPreview(draftInsert),
      changedFields: [],
      updateAttempted: false,
      updateSuccess: false,
      unchangedReason: null,
      syncError: null,
    };

    if (!match) {
      toInsert.push(draftRow);
      detailBase.unchangedReason = "no published match — will insert";
      sessionSyncDetails.push(detailBase);
      continue;
    }

    usedPublishedIds.add(match.id);
    const changedFields = diffSessionSyncFields(match, draftInsert);
    detailBase.changedFields = changedFields;

    if (changedFields.length === 0) {
      unchangedRowsCount += 1;
      detailBase.unchangedReason = "content matches draft";
      sessionSyncDetails.push(detailBase);
      continue;
    }

    const hadLogs = publishedSessionHasAthleteLogs(match);
    detailBase.updateAttempted = true;

    const { data: updatedRow, error: updateError } = await supabase
      .from("hyrox_programme_sessions")
      .update({
        ...pickSessionSyncFields(draftInsert),
        updated_at: now,
      })
      .eq("id", match.id)
      .select(PUBLISHED_SESSION_SYNC_SELECT)
      .maybeSingle();

    if (updateError) {
      detailBase.syncError = updateError.message;
      detailBase.updateSuccess = false;
      sessionSyncDetails.push(detailBase);
      throw new Error(updateError.message);
    }

    if (!updatedRow) {
      detailBase.syncError = "Update returned no row (check RLS / session id).";
      detailBase.updateSuccess = false;
      sessionSyncDetails.push(detailBase);
      warnings.push(
        `Draft edit was not synced to published session "${draftInsert.session_name}": update returned 0 rows.`
      );
      continue;
    }

    detailBase.updateSuccess = true;
    detailBase.newPublishedPreview = publishedSessionLivePreview(
      updatedRow as HyroxProgrammeSessionRow
    );
    updatedRowsCount += 1;
    updatedSessions.push({
      id: match.id,
      title: draftInsert.session_name,
      hadLogs,
    });
    if (hadLogs) {
      warnings.push(
        `Updated session with existing logs: "${match.session_name}" (${sessionRowKey(match.day_of_week, match.session_slot)}).`
      );
    }
    sessionSyncDetails.push(detailBase);
  }

  for (const row of existing) {
    if (usedPublishedIds.has(row.id)) continue;
    warnings.push(
      `Published session exists but not in draft; not deleted: "${row.session_name}" (${sessionRowKey(row.day_of_week, row.session_slot)}).`
    );
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("hyrox_programme_sessions")
      .insert(toInsert);
    if (insertError) throw new Error(insertError.message);
  }

  const { startYmd, endYmd } = weekDateRangeFromProgrammeStart(
    params.programmeStartDate,
    params.week.week_number
  );

  await supabase
    .from("hyrox_programme_weeks")
    .update({
      week_start_date: startYmd,
      week_end_date: endYmd,
      source_draft_id: params.sourceDraftId ?? params.week.source_draft_id,
      updated_at: now,
    })
    .eq("id", params.week.id);

  const { data: refreshedRows, error: refreshError } = await supabase
    .from("hyrox_programme_sessions")
    .select(PUBLISHED_SESSION_SYNC_SELECT)
    .eq("programme_week_id", params.week.id);

  if (refreshError) throw new Error(refreshError.message);

  const publishedAfter = (refreshedRows ?? []) as HyroxProgrammeSessionRow[];
  const verification = verifyPublishedWeekMatchesDraft({
    draftRows: draftInsertRows,
    publishedRows: publishedAfter,
    sessionDetails: sessionSyncDetails,
  });

  if (!verification.verificationPassed) {
    warnings.push(...verification.errors);
  }

  const dbSessionCountBefore = existing.length;
  const insertedRowsCount = toInsert.length;
  const rowsAfterPublish = publishedAfter.length;
  const skippedBecauseLoggedCount = 0;
  const skippedRowsCount = unchangedRowsCount;
  const baseAudit = params.audit ?? {
    draftId: params.sourceDraftId ?? "",
    athleteId: params.athleteId,
    blockId: params.week.block_number,
    weekNumber: params.week.week_number,
    draftStatus: "published",
    approvedDraftSessionCount: allRows.length,
    approvedDraftSessionTitles: draftWeekTitles(params.draftWeek),
    slotCounts: slotCountsFromDraft(params.draftWeek),
    expectedSessionCount: null,
  };

  if (process.env.NODE_ENV === "development") {
    console.log("[hyrox/sync-published-week]", {
      weekNumber: params.week.week_number,
      draftId: baseAudit.draftId,
      existingRowsBefore: dbSessionCountBefore,
      draftSessionsCount: allRows.length,
      insertedRowsCount,
      updatedRowsCount,
      unchangedRowsCount,
      verificationPassed: verification.verificationPassed,
      sessionSyncDetails,
      warnings,
    });
  }

  return {
    ...baseAudit,
    sessionsToInsertCount: toInsert.length,
    sessionsToInsertTitles: toInsert.map((r) => r.session_name),
    existingRowsBefore: dbSessionCountBefore,
    draftSessionsCount: allRows.length,
    insertedRowsCount,
    updatedRowsCount,
    unchangedRowsCount,
    skippedRowsCount,
    skippedBecauseLoggedCount,
    skippedReasons,
    warnings,
    updatedSessions,
    sessionSyncDetails,
    verification,
    rowsAfterPublish,
  };
}

function draftWeekTitles(draftWeek: CoachDraftWeek): string[] {
  return draftWeek.days.flatMap((d) => d.sessions.map((s) => s.title));
}

function slotCountsFromDraft(draftWeek: CoachDraftWeek) {
  const c = countCoachDraftSessions(draftWeek);
  return { main: c.main, am: c.am, pm: c.pm, optional: c.optional, key: c.key };
}

export async function fetchDraftForAthleteWeek(
  supabase: SupabaseClient,
  athleteId: string,
  blockNumber: number,
  weekNumber: number
): Promise<HyroxProgrammeDraftRow | null> {
  const { data } = await supabase
    .from("hyrox_programme_drafts")
    .select(DRAFT_SELECT)
    .eq("athlete_id", athleteId)
    .eq("block_number", blockNumber)
    .eq("week_number", weekNumber)
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as HyroxProgrammeDraftRow | null) ?? null;
}

export async function publishProgrammeDraft(
  supabase: SupabaseClient,
  params: {
    draft: HyroxProgrammeDraftRow;
    athleteRow: HyroxAthleteRow;
    weeklyFocus: string;
    programmeStartDate: string;
    changedBy: string | null;
    expectedSessionCount?: number | null;
  }
): Promise<{ week: HyroxProgrammeWeekRow; sessionCount: number; audit: PublishWeekAudit }> {
  if (params.draft.status !== "approved") {
    throw new Error("Draft must be approved before publishing.");
  }

  const { draftWeek, audit: baseAudit } = loadApprovedDraftWeekFromRow(params.draft);
  const audit: PublishWeekAudit = {
    ...baseAudit,
    expectedSessionCount: params.expectedSessionCount ?? null,
  };
  assertDraftSessionCountMatchesUi(audit, params.expectedSessionCount);

  if (process.env.NODE_ENV === "development") {
    console.log("[hyrox/publish-draft]", audit);
  }

  const { startYmd, endYmd } = weekDateRangeFromProgrammeStart(
    params.programmeStartDate,
    params.draft.week_number
  );

  const { data: week, error: weekError } = await supabase
    .from("hyrox_programme_weeks")
    .insert({
      athlete_id: params.athleteRow.id,
      source_draft_id: params.draft.id,
      block_number: params.draft.block_number,
      week_number: params.draft.week_number,
      week_start_date: startYmd,
      week_end_date: endYmd,
      weekly_focus: params.weeklyFocus || null,
      coach_note: params.draft.coach_note,
      athlete_facing_note: params.draft.athlete_facing_note,
      weekly_summary: params.draft.weekly_summary,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select(
      "id, athlete_id, source_draft_id, created_at, updated_at, block_number, week_number, week_start_date, week_end_date, weekly_focus, coach_note, athlete_facing_note, weekly_summary, status, published_at"
    )
    .single();

  if (weekError) throw new Error(weekError.message);

  const sessionRows = buildSessionInsertRowsFromDraftWeek(draftWeek, {
    programmeWeekId: (week as HyroxProgrammeWeekRow).id,
    athleteId: params.athleteRow.id,
  });

  if (sessionRows.length > 0) {
    const { error: sessionsError } = await supabase
      .from("hyrox_programme_sessions")
      .insert(sessionRows);
    if (sessionsError) throw new Error(sessionsError.message);
  }

  const statusFrom = params.athleteRow.status;
  const liveWeek = deriveLiveGlobalWeek(params.programmeStartDate);
  await Promise.all([
    supabase
      .from("hyrox_programme_drafts")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", params.draft.id),
    supabase
      .from("hyrox_athletes")
      .update({
        status: "programme_published",
        programme_status: "published",
        programme_start_date: params.programmeStartDate,
        programme_started_at:
          params.athleteRow.programme_started_at ?? new Date().toISOString(),
        programme_updated_at: new Date().toISOString(),
        current_block: params.draft.block_number,
        current_programme_block: params.draft.block_number,
        current_week: liveWeek,
      })
      .eq("id", params.athleteRow.id),
  ]);

  await recordHyroxStatusHistory(supabase, {
    athleteId: params.athleteRow.id,
    statusFrom,
    statusTo: "programme_published",
    changedBy: params.changedBy,
    reason: "programme_published",
    metadata: {
      draft_id: params.draft.id,
      programme_week_id: (week as HyroxProgrammeWeekRow).id,
      programme_status: "published",
      session_count: sessionRows.length,
    },
  });

  return {
    week: week as HyroxProgrammeWeekRow,
    sessionCount: sessionRows.length,
    audit,
  };
}

async function fetchPublishedWeekForAthlete(
  supabase: SupabaseClient,
  athleteId: string,
  blockNumber: number,
  weekNumber: number
): Promise<HyroxProgrammeWeekRow | null> {
  const { data } = await supabase
    .from("hyrox_programme_weeks")
    .select(
      "id, athlete_id, source_draft_id, created_at, updated_at, block_number, week_number, week_start_date, week_end_date, weekly_focus, coach_note, athlete_facing_note, weekly_summary, status, published_at"
    )
    .eq("athlete_id", athleteId)
    .eq("block_number", blockNumber)
    .eq("week_number", weekNumber)
    .eq("status", "published")
    .maybeSingle();
  return (data as HyroxProgrammeWeekRow | null) ?? null;
}

/** Publish all four weeks from approved draft_data in DB (no regeneration at publish). */
export async function publishProgrammeBlock(
  supabase: SupabaseClient,
  params: {
    athleteRow: HyroxAthleteRow;
    blockNumber: number;
    programmeStartDate: string;
    changedBy: string | null;
    /** When true (default), insert missing sessions for weeks already published. */
    syncExistingWeeks?: boolean;
    /** UI session counts per global week — publish fails if DB draft has fewer. */
    expectedSessionCountsByWeek?: Partial<Record<number, number>>;
    seedDraftId?: string | null;
  }
): Promise<{
  weeks: HyroxProgrammeWeekRow[];
  sessionCount: number;
  generatedWeekNumbers: number[];
  syncedWeekNumbers: number[];
  weekResults: PublishWeekSyncAudit[];
}> {
  const blockNumber = Math.min(3, Math.max(1, params.blockNumber)) as 1 | 2 | 3;
  const publishedWeeks: HyroxProgrammeWeekRow[] = [];
  let sessionCount = 0;
  const generatedWeekNumbers: number[] = [];
  const syncedWeekNumbers: number[] = [];
  const weekResults: PublishWeekSyncAudit[] = [];
  const syncExistingWeeks = params.syncExistingWeeks !== false;

  const draftRows = await fetchBlockProgrammeDrafts(supabase, params.athleteRow.id, blockNumber);
  const draftByWeek = new Map(draftRows.map((r) => [r.week_number, r]));

  for (const cycle of [1, 2, 3, 4] as const) {
    const globalWeek = globalWeekForBlock(blockNumber, cycle);
    const draftRow = draftByWeek.get(globalWeek);
    if (!draftRow) {
      throw new Error(
        `No programme draft for block ${blockNumber} week ${globalWeek}. Generate and approve the block first.`
      );
    }

    const expectedCount = params.expectedSessionCountsByWeek?.[globalWeek];
    const { draftWeek, audit: baseAudit } = loadApprovedDraftWeekFromRow(draftRow);
    const audit: PublishWeekAudit = {
      ...baseAudit,
      expectedSessionCount: expectedCount ?? null,
    };
    assertDraftSessionCountMatchesUi(audit, expectedCount);

    if (process.env.NODE_ENV === "development" || params.seedDraftId) {
      console.log("[hyrox/publish-block] week", {
        seedDraftId: params.seedDraftId,
        ...audit,
        sessionsToInsertCount: audit.approvedDraftSessionCount,
      });
    }

    const existing = await fetchPublishedWeekForAthlete(
      supabase,
      params.athleteRow.id,
      blockNumber,
      globalWeek
    );

    if (existing && syncExistingWeeks) {
      if (draftRow.status !== "approved" && draftRow.status !== "published") {
        throw new Error(
          `Week ${globalWeek} draft must be approved before syncing (status: ${draftRow.status}).`
        );
      }
      const sync = await syncPublishedWeekSessionsFromDraft(supabase, {
        week: existing,
        draftWeek,
        athleteId: params.athleteRow.id,
        programmeStartDate: params.programmeStartDate,
        sourceDraftId: draftRow.id,
        audit,
      });
      weekResults.push(sync);
      sessionCount += sync.insertedRowsCount;
      syncedWeekNumbers.push(globalWeek);
      publishedWeeks.push(existing);
      if (draftRow.status !== "published") {
        await supabase
          .from("hyrox_programme_drafts")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", draftRow.id);
      }
      continue;
    }

    if (existing) {
      publishedWeeks.push(existing);
      continue;
    }

    if (draftRow.status === "published") {
      const week = await fetchPublishedWeekForAthlete(
        supabase,
        params.athleteRow.id,
        blockNumber,
        globalWeek
      );
      if (week) publishedWeeks.push(week);
      continue;
    }

    if (draftRow.status !== "approved") {
      throw new Error(
        `Week ${globalWeek} draft must be approved before publishing (status: ${draftRow.status}).`
      );
    }

    const length = (params.athleteRow.programme_length_weeks === 16 ? 16 : 12) as ProgrammeLengthWeeks;
    const weeklyFocus = getBlockWeekRole(blockNumber, cycle, length);

    const result = await publishProgrammeDraft(supabase, {
      draft: draftRow,
      athleteRow: params.athleteRow,
      weeklyFocus,
      programmeStartDate: params.programmeStartDate,
      changedBy: params.changedBy,
    });
    publishedWeeks.push(result.week);
    sessionCount += result.sessionCount;
    generatedWeekNumbers.push(globalWeek);
    weekResults.push({
      ...audit,
      sessionsToInsertCount: result.sessionCount,
      sessionsToInsertTitles: draftWeekTitles(draftWeek),
      existingRowsBefore: 0,
      draftSessionsCount: audit.approvedDraftSessionCount,
      insertedRowsCount: result.sessionCount,
      updatedRowsCount: 0,
      unchangedRowsCount: 0,
      skippedRowsCount: 0,
      skippedBecauseLoggedCount: 0,
      skippedReasons: [],
      warnings: [],
      updatedSessions: [],
      sessionSyncDetails: [],
      verification: {
        verificationPassed: true,
        missingOrUnsyncedDraftSessionTitles: [],
        livePreviewForEditedSessions: [],
        errors: [],
      },
      rowsAfterPublish: result.sessionCount,
    });
  }

  const liveWeek = deriveLiveGlobalWeek(params.programmeStartDate);
  const now = new Date().toISOString();
  await supabase
    .from("hyrox_athletes")
    .update({
      programme_start_date: params.programmeStartDate,
      programme_started_at: params.athleteRow.programme_started_at ?? now,
      programme_updated_at: now,
      current_block: blockNumber,
      current_programme_block: blockNumber,
      current_week: liveWeek,
    })
    .eq("id", params.athleteRow.id);

  return { weeks: publishedWeeks, sessionCount, generatedWeekNumbers, syncedWeekNumbers, weekResults };
}

export { DAY_ORDER };
