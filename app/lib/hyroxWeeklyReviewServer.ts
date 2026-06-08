import type { SupabaseClient } from "@supabase/supabase-js";
import { parseHyroxAthleteSessionFeedback } from "@/app/lib/hyroxAthleteSessionFeedback";
import {
  formatSessionCalendarDateLabel,
  sessionDateYmdFromProgrammeStart,
} from "@/app/lib/hyroxAthleteProgrammeSort";
import { resolveAthleteSessionDetailFromPublishedRow } from "@/app/lib/hyroxAthleteSessionDetail";
import type {
  HyroxAthleteRow,
  HyroxCheckInRow,
  HyroxProgrammeSessionRow,
  HyroxProgrammeWeekRow,
  HyroxWeeklyCoachReviewRow,
} from "@/app/lib/hyroxDatabaseTypes";
import {
  deriveWeekCalendarStatusForAthleteWeek,
  type ProgrammeLengthWeeks,
} from "@/app/lib/hyroxProgrammeDates";
import {
  averageRpeFromSessions,
  buildSessionReviewRow,
  computeWeeklyReviewAlerts,
  emptyWeeklyCoachNotes,
  parseWeeklyCoachNotesJson,
  sessionCompletedStatus,
  sortWeeklyReviewSessions,
  type HyroxWeeklyCoachNotes,
  type HyroxWeeklyReviewPayload,
  type WeeklyReviewCheckIn,
  type WeeklyReviewWeekSummary,
} from "@/app/lib/hyroxWeeklyReview";

const WEEK_SELECT =
  "id, athlete_id, block_number, week_number, week_start_date, week_end_date, weekly_focus, status, published_at";

const SESSION_SELECT =
  "id, programme_week_id, athlete_id, day_of_week, session_slot, session_name, category, prescription, metadata, status, completed_at, athlete_feedback";

const CHECK_IN_SELECT =
  "id, athlete_id, programme_week_id, submitted_at, week_number, sleep, energy, stress, soreness, motivation, bodyweight, sessions_completed, biggest_win, biggest_struggle, pain_niggles, next_week_availability, raw_answers, status";

const REVIEW_SELECT =
  "id, athlete_id, week_number, programme_week_id, coach_notes, created_at, updated_at";

function programmeLength(athlete: HyroxAthleteRow): ProgrammeLengthWeeks {
  return athlete.programme_length_weeks === 16 ? 16 : 12;
}

function checkInToReview(row: HyroxCheckInRow): WeeklyReviewCheckIn {
  const raw =
    row.raw_answers && typeof row.raw_answers === "object" && !Array.isArray(row.raw_answers)
      ? (row.raw_answers as Record<string, unknown>)
      : {};
  const recovery =
    typeof raw.recovery === "number"
      ? raw.recovery
      : row.motivation != null
        ? row.motivation
        : null;

  return {
    id: row.id,
    weekNumber: row.week_number ?? 0,
    submittedAt: row.submitted_at,
    status: row.status,
    sleep: row.sleep,
    energy: row.energy,
    stress: row.stress,
    soreness: row.soreness,
    recovery,
    bodyweight: row.bodyweight != null ? Number(row.bodyweight) : null,
    sessionsCompleted: row.sessions_completed,
    biggestWin: row.biggest_win,
    biggestStruggle: row.biggest_struggle,
    painNiggles: row.pain_niggles,
    nextWeekAvailability: row.next_week_availability,
  };
}

export async function listAvailableReviewWeeks(
  supabase: SupabaseClient,
  athleteId: string,
  maxWeeks: number
): Promise<number[]> {
  const [{ data: weeks }, { data: checkIns }] = await Promise.all([
    supabase
      .from("hyrox_programme_weeks")
      .select("week_number")
      .eq("athlete_id", athleteId)
      .eq("status", "published")
      .order("week_number", { ascending: true }),
    supabase
      .from("hyrox_check_ins")
      .select("week_number")
      .eq("athlete_id", athleteId)
      .not("week_number", "is", null),
  ]);

  const set = new Set<number>();
  for (const w of weeks ?? []) {
    const n = (w as { week_number: number }).week_number;
    if (n >= 1 && n <= maxWeeks) set.add(n);
  }
  for (const c of checkIns ?? []) {
    const n = (c as { week_number: number | null }).week_number;
    if (n != null && n >= 1 && n <= maxWeeks) set.add(n);
  }

  if (set.size === 0) {
    return [1];
  }

  return [...set].sort((a, b) => a - b);
}

export async function loadWeeklyReviewForCoach(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  weekNumber: number
): Promise<HyroxWeeklyReviewPayload> {
  const lengthWeeks = programmeLength(athlete);
  const programmeStart = athlete.programme_start_date?.trim() || null;

  const availableWeeks = await listAvailableReviewWeeks(supabase, athlete.id, lengthWeeks);

  const [{ data: weekRow }, { data: checkInRow }, { data: reviewRow }] = await Promise.all([
    supabase
      .from("hyrox_programme_weeks")
      .select(WEEK_SELECT)
      .eq("athlete_id", athlete.id)
      .eq("week_number", weekNumber)
      .eq("status", "published")
      .maybeSingle(),
    supabase
      .from("hyrox_check_ins")
      .select(CHECK_IN_SELECT)
      .eq("athlete_id", athlete.id)
      .eq("week_number", weekNumber)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("hyrox_weekly_coach_reviews")
      .select(REVIEW_SELECT)
      .eq("athlete_id", athlete.id)
      .eq("week_number", weekNumber)
      .maybeSingle(),
  ]);

  const publishedWeek = weekRow as HyroxProgrammeWeekRow | null;
  const programmeWeekId = publishedWeek?.id ?? null;

  let sessionRows: HyroxProgrammeSessionRow[] = [];
  if (programmeWeekId) {
    const { data: weekSessions } = await supabase
      .from("hyrox_programme_sessions")
      .select(SESSION_SELECT)
      .eq("programme_week_id", programmeWeekId);
    sessionRows = (weekSessions as HyroxProgrammeSessionRow[] | null) ?? [];
  }

  const calendarStatus = publishedWeek
    ? deriveWeekCalendarStatusForAthleteWeek({
        programmeStartYmd: programmeStart,
        weekNumber,
        dbWeekStartYmd: publishedWeek.week_start_date,
        dbWeekEndYmd: publishedWeek.week_end_date,
      })
    : "unpublished";

  const dateRangeLabel =
    publishedWeek?.week_start_date && publishedWeek?.week_end_date
      ? `${publishedWeek.week_start_date} – ${publishedWeek.week_end_date}`
      : null;

  const reviewSessions = sortWeeklyReviewSessions(
    sessionRows.map((s) => {
      const detail = resolveAthleteSessionDetailFromPublishedRow(s);
      const feedback = parseHyroxAthleteSessionFeedback(s.athlete_feedback);
      const dateLabel =
        programmeStart && publishedWeek
          ? formatSessionCalendarDateLabel(
              s.day_of_week,
              sessionDateYmdFromProgrammeStart(programmeStart, weekNumber, s.day_of_week),
              s.session_slot
            )
          : null;

      return buildSessionReviewRow({
        session: {
          id: s.id,
          day_of_week: s.day_of_week,
          session_slot: s.session_slot,
          session_name: s.session_name,
          category: s.category,
          status: s.status,
          completed_at: s.completed_at,
          metadata: (s.metadata ?? {}) as Record<string, unknown>,
          athlete_feedback: s.athlete_feedback,
        },
        plannedDuration: detail.duration || null,
        plannedDurationMinutes: detail.durationMin ?? null,
        dateLabel,
        feedback,
      });
    })
  );

  const sessionsCompleted = reviewSessions.filter((s) => s.completed).length;
  const sessionsTotal = reviewSessions.length;
  const completionPercent =
    sessionsTotal > 0 ? Math.round((sessionsCompleted / sessionsTotal) * 100) : 0;
  const { average: averageRpe, count: rpeSampleCount } = averageRpeFromSessions(reviewSessions);
  const sessionsWithNotes = reviewSessions.filter((s) => s.notes?.trim()).length;
  const missedOrIncomplete = reviewSessions.filter((s) => !s.completed).length;

  const checkIn =
    checkInRow && (checkInRow as HyroxCheckInRow).status === "submitted"
      ? checkInToReview(checkInRow as HyroxCheckInRow)
      : checkInRow && (checkInRow as HyroxCheckInRow).submitted_at
        ? checkInToReview(checkInRow as HyroxCheckInRow)
        : null;

  const checkInStatus: WeeklyReviewWeekSummary["checkInStatus"] = checkIn
    ? "completed"
    : publishedWeek
      ? "needs_completing"
      : "not_applicable";

  const summary: WeeklyReviewWeekSummary = {
    weekNumber,
    programmeWeekId,
    published: Boolean(publishedWeek),
    dateRangeLabel,
    calendarStatus,
    weeklyFocus: publishedWeek?.weekly_focus ?? null,
    sessionsCompleted,
    sessionsTotal,
    completionPercent,
    averageRpe,
    rpeSampleCount,
    sessionsWithNotes,
    missedOrIncomplete,
    checkInStatus,
    checkInSubmittedAt: checkIn?.submittedAt ?? null,
  };

  const alerts = computeWeeklyReviewAlerts({
    summary,
    sessions: reviewSessions,
    checkIn,
  });

  const saved = reviewRow as HyroxWeeklyCoachReviewRow | null;

  return {
    weekNumber,
    availableWeeks,
    programmeLengthWeeks: lengthWeeks,
    summary,
    sessions: reviewSessions,
    checkIn,
    alerts,
    coachNotes: saved ? parseWeeklyCoachNotesJson(saved.coach_notes) : emptyWeeklyCoachNotes(),
    coachReviewUpdatedAt: saved?.updated_at ?? null,
  };
}

export async function upsertWeeklyCoachReview(
  supabase: SupabaseClient,
  params: {
    athleteId: string;
    weekNumber: number;
    programmeWeekId: string | null;
    coachNotes: HyroxWeeklyCoachNotes;
  }
): Promise<{ coachNotes: HyroxWeeklyCoachNotes; updatedAt: string }> {
  const now = new Date().toISOString();
  const payload = {
    athlete_id: params.athleteId,
    week_number: params.weekNumber,
    programme_week_id: params.programmeWeekId,
    coach_notes: params.coachNotes as Record<string, unknown>,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("hyrox_weekly_coach_reviews")
    .upsert(payload, { onConflict: "athlete_id,week_number" })
    .select(REVIEW_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as HyroxWeeklyCoachReviewRow;
  return {
    coachNotes: parseWeeklyCoachNotesJson(row.coach_notes),
    updatedAt: row.updated_at,
  };
}
