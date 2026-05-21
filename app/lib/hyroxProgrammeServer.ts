import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import {
  BLOCK_WEEK_FOCUS_LABELS,
  computeWeeklySummary,
  generateCoachBlockDraftWeeks,
  generateCoachDraftWeekForBlockCycle,
  globalWeekForBlock,
  validateCoachDraft,
  type CoachDraftWeek,
  type CoachProgrammeStatus,
} from "@/app/lib/hyroxCoachProgrammeDraft";
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
  sortProgrammeSessions,
  type ProgrammeTimeOfDay,
} from "@/app/lib/hyroxAthleteProgrammeSort";
import type { HyroxSession, SessionStatus } from "@/app/lib/hyroxTeamDashboardMock";

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
};

export type AthletePublishedProgramme = {
  visibility: AthleteProgrammeVisibility;
  published: boolean;
  programmeStatus: string;
  athleteStatus: string;
  week: HyroxProgrammeWeekRow | null;
  sessions: HyroxProgrammeSessionRow[];
  weeks: PublishedProgrammeWeekBundle[];
  athlete: Pick<HyroxAthleteRow, "name" | "race_name" | "race_date" | "race_category" | "target_time" | "current_block" | "current_week">;
};

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
    coachStatus: CoachProgrammeStatus;
    changedBy: string | null;
  }
): Promise<HyroxProgrammeDraftRow> {
  const summary = computeWeeklySummary(params.draft, params.athlete);
  const validation = validateCoachDraft(params.draft, params.athlete);
  const dbStatus = coachStatusToDraftDb(params.coachStatus);

  const { data, error } = await supabase
    .from("hyrox_programme_drafts")
    .update({
      draft_data: params.draft as unknown as HyroxJson,
      weekly_summary: summary as unknown as HyroxJson,
      validation_warnings: {
        warnings: validation.warnings,
        positives: validation.positives,
      } as unknown as HyroxJson,
      coach_note: params.coachNote || null,
      athlete_facing_note: params.athleteFacingNote || null,
      status: dbStatus === "draft_generated" ? "edited" : dbStatus,
      block_number: params.draft.block,
      week_number: params.draft.week,
    })
    .eq("id", params.draftId)
    .select(DRAFT_SELECT)
    .single();

  if (error) throw new Error(error.message);

  const programmeStatus =
    dbStatus === "draft_generated" ? "edited" : dbStatus === "coach_reviewing" ? "edited" : dbStatus;

  if (params.athleteRow.programme_status !== programmeStatus) {
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

function inferSessionType(category: string, name: string): HyroxSession["type"] {
  const c = category.toLowerCase();
  const n = name.toLowerCase();
  if (c.includes("strength") || n.includes("strength")) return "Strength";
  if (c.includes("hyrox") || c.includes("station") || n.includes("hyrox")) return "Hybrid";
  if (c.includes("recovery") || n.includes("recovery")) return "Recovery";
  if (c.includes("aerobic") || c.includes("easy") || n.includes("aerobic")) return "Aerobic";
  if (c.includes("run") || n.includes("run") || n.includes("threshold")) return "Run";
  return "Hybrid";
}

export function mapPublishedSessionsToAthleteUi(
  sessions: HyroxProgrammeSessionRow[]
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
    const rpeTarget =
      (prescription.rpeTarget as string) ??
      (prescription.rpe_target as string) ??
      (meta.rpeTarget as string) ??
      "—";
    const duration =
      (meta.duration as string) ?? (prescription.duration as string) ?? "—";
    const day = s.day_of_week;
    const short = dayShort[day] ?? day.slice(0, 3);
    const timeOfDay = (s.session_slot as ProgrammeTimeOfDay) ?? "Main";
    const coachNote =
      (meta.coachNote as string) ??
      (prescription.coachNote as string) ??
      (prescription.coach_note as string) ??
      "";

    return {
      id: s.id,
      day,
      dayShort: short,
      dateLabel: formatProgrammeDayLabel(day, timeOfDay),
      name: s.session_name,
      type: inferSessionType(s.category, s.session_name),
      focus: (meta.focus as string) ?? s.category,
      duration,
      rpeTarget,
      status: mapDbSessionStatus(s.status),
      priority: (timeOfDay === "Optional" || s.session_slot === "Optional"
        ? "Optional"
        : "Key") as HyroxSession["priority"],
      intent: (meta.intent as string) ?? s.session_name,
      timeOfDay,
      coachNote: coachNote || undefined,
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

export async function fetchAthletePublishedProgramme(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  flags: { hasAssessment: boolean; hasTesting: boolean }
): Promise<AthletePublishedProgramme> {
  const blockNumber = athlete.current_block ?? 1;
  const blockWeekNumbers = [1, 2, 3, 4].map((cycle) =>
    globalWeekForBlock(blockNumber as 1 | 2 | 3, cycle as 1 | 2 | 3 | 4)
  );

  const [{ data: publishedWeeks }, { data: draft }] = await Promise.all([
    supabase
      .from("hyrox_programme_weeks")
      .select(
        "id, athlete_id, source_draft_id, created_at, updated_at, block_number, week_number, week_start_date, week_end_date, weekly_focus, coach_note, athlete_facing_note, weekly_summary, status, published_at"
      )
      .eq("athlete_id", athlete.id)
      .eq("block_number", blockNumber)
      .eq("status", "published")
      .in("week_number", blockWeekNumbers)
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

  const weeks: PublishedProgrammeWeekBundle[] = blockWeekNumbers.map((globalWeek) => {
    const week = weekRows.find((w) => w.week_number === globalWeek) ?? null;
    const sessionsForWeek = week
      ? allSessions.filter((s) => s.programme_week_id === week.id)
      : [];
    return {
      week,
      sessions: sessionsForWeek,
      generated: Boolean(week && sessionsForWeek.length > 0),
      weekNumber: globalWeek,
    };
  });

  const activeWeekNumber = athlete.current_week ?? weekRows[0]?.week_number ?? 1;
  const publishedWeek =
    weekRows.find((w) => w.week_number === activeWeekNumber) ?? weekRows[0] ?? null;
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
    athlete: {
      name: athlete.name,
      race_name: athlete.race_name,
      race_date: athlete.race_date,
      race_category: athlete.race_category,
      target_time: athlete.target_time,
      current_block: athlete.current_block,
      current_week: athlete.current_week,
    },
  };
}

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export async function publishProgrammeDraft(
  supabase: SupabaseClient,
  params: {
    draft: HyroxProgrammeDraftRow;
    athleteRow: HyroxAthleteRow;
    weeklyFocus: string;
    changedBy: string | null;
  }
): Promise<{ week: HyroxProgrammeWeekRow; sessionCount: number }> {
  if (params.draft.status !== "approved") {
    throw new Error("Draft must be approved before publishing.");
  }

  const draftWeek = parseCoachDraftWeek(params.draft.draft_data);
  if (!draftWeek) throw new Error("Invalid draft data.");

  const { data: week, error: weekError } = await supabase
    .from("hyrox_programme_weeks")
    .insert({
      athlete_id: params.athleteRow.id,
      source_draft_id: params.draft.id,
      block_number: params.draft.block_number,
      week_number: params.draft.week_number,
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

  const sessionRows = draftWeek.days.flatMap((day) =>
    day.sessions.map((sess) => ({
      programme_week_id: (week as HyroxProgrammeWeekRow).id,
      athlete_id: params.athleteRow.id,
      day_of_week: day.day,
      session_slot: sess.timeOfDay,
      session_name: sess.title,
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

  if (sessionRows.length > 0) {
    const { error: sessionsError } = await supabase
      .from("hyrox_programme_sessions")
      .insert(sessionRows);
    if (sessionsError) throw new Error(sessionsError.message);
  }

  const statusFrom = params.athleteRow.status;
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
        current_block: params.draft.block_number,
        current_week: params.draft.week_number,
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

  return { week: week as HyroxProgrammeWeekRow, sessionCount: sessionRows.length };
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

async function fetchDraftForAthleteWeek(
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

/** Publish all four weeks in the athlete's current block (skips weeks already published). */
export async function publishProgrammeBlock(
  supabase: SupabaseClient,
  params: {
    coachAthlete: CoachAthlete;
    athleteRow: HyroxAthleteRow;
    mappedProfileId: string | null;
    changedBy: string | null;
  }
): Promise<{ weeks: HyroxProgrammeWeekRow[]; sessionCount: number; generatedWeekNumbers: number[] }> {
  const blockNumber = params.coachAthlete.programmeBlock;
  const publishedWeeks: HyroxProgrammeWeekRow[] = [];
  let sessionCount = 0;
  const generatedWeekNumbers: number[] = [];

  for (const cycle of [1, 2, 3, 4] as const) {
    const globalWeek = globalWeekForBlock(blockNumber, cycle);
    const existing = await fetchPublishedWeekForAthlete(
      supabase,
      params.athleteRow.id,
      blockNumber,
      globalWeek
    );
    if (existing) {
      publishedWeeks.push(existing);
      continue;
    }

    let draftRow = await fetchDraftForAthleteWeek(
      supabase,
      params.athleteRow.id,
      blockNumber,
      globalWeek
    );

    const draftWeek = generateCoachDraftWeekForBlockCycle(params.coachAthlete, cycle);

    if (!draftRow) {
      draftRow = await insertProgrammeDraft(supabase, {
        athlete: params.coachAthlete,
        athleteRow: params.athleteRow,
        mappedProfileId: params.mappedProfileId,
        draft: draftWeek,
        coachNote: "",
        athleteFacingNote: "",
        changedBy: params.changedBy,
      });
    } else if (draftRow.status !== "published") {
      draftRow = await updateProgrammeDraft(supabase, {
        draftId: draftRow.id,
        athlete: params.coachAthlete,
        athleteRow: params.athleteRow,
        draft: draftWeek,
        coachNote: draftRow.coach_note ?? "",
        athleteFacingNote: draftRow.athlete_facing_note ?? "",
        coachStatus: "approved",
        changedBy: params.changedBy,
      });
    }

    if (draftRow.status !== "approved" && draftRow.status !== "published") {
      draftRow = await approveProgrammeDraft(supabase, {
        draftId: draftRow.id,
        athleteRow: params.athleteRow,
        changedBy: params.changedBy,
      });
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

    const result = await publishProgrammeDraft(supabase, {
      draft: draftRow,
      athleteRow: params.athleteRow,
      weeklyFocus: BLOCK_WEEK_FOCUS_LABELS[cycle],
      changedBy: params.changedBy,
    });
    publishedWeeks.push(result.week);
    sessionCount += result.sessionCount;
    generatedWeekNumbers.push(globalWeek);
  }

  const firstWeek = globalWeekForBlock(blockNumber, 1);
  await supabase
    .from("hyrox_athletes")
    .update({
      current_block: blockNumber,
      current_week: params.athleteRow.current_week ?? firstWeek,
    })
    .eq("id", params.athleteRow.id);

  return { weeks: publishedWeeks, sessionCount, generatedWeekNumbers };
}

export { DAY_ORDER };
