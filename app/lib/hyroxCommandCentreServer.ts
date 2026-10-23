import type { SupabaseClient } from "@supabase/supabase-js";
import { getHyroxAthletePerformanceProfile } from "@/app/lib/hyroxAthleteBenchmarkServer";
import { fetchCoachCheckInHistory } from "@/app/lib/hyroxAthleteCheckInServer";
import { athleteFacingWeeklyNote } from "@/app/lib/hyroxAthleteFacingCopy";
import { parseHyroxAthleteSessionFeedback } from "@/app/lib/hyroxAthleteSessionFeedback";
import { daySortIndex, sessionDateYmdFromProgrammeStart } from "@/app/lib/hyroxAthleteProgrammeSort";
import { isKeyProgrammeSession, parseLoggedRpe } from "@/app/lib/hyroxBlockReview";
import { parsePrescribedRpeRange } from "@/app/lib/hyroxCoachAttentionParse";
import {
  evaluateCoachAttentionFlags,
  type CoachAttentionCheckIn,
  type CoachAttentionReadiness,
  type CoachAttentionSession,
} from "@/app/lib/hyroxCoachAttention";
import { loadHyroxAthleteAnalyticsFromEngine } from "@/app/lib/hyroxCommandCentreAnalyticsAdapter";
import {
  overlayAnalyticsOnThisWeek,
  pickUpcomingKeySession,
  summarizePublishedWeek,
} from "@/app/lib/hyroxCommandCentreBuild";
import type { HyroxCommandCentrePayload } from "@/app/lib/hyroxCommandCentreTypes";
import {
  formatDuration,
  formatPacePerKm,
  formatSplitPer500,
  formatWatts,
} from "@/app/lib/hyroxBenchmarkMath";
import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import { benchmarkLabel } from "@/app/lib/hyroxBenchmarkTypes";
import type {
  HyroxAthleteRow,
  HyroxProgrammeSessionRow,
  HyroxProgrammeWeekRow,
} from "@/app/lib/hyroxDatabaseTypes";
import {
  deriveLiveGlobalWeek,
  deriveWeekCalendarStatusForAthleteWeek,
  weekDateRangeFromProgrammeStart,
} from "@/app/lib/hyroxProgrammeDates";
import { extractPlannedTargets } from "@/app/lib/hyrox-team/modules/sessionLogging/plannedTargets";
import {
  isHyroxDailyReadinessRelationMissing,
  localDateYmdInTimeZone,
} from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import { sessionCompletedStatus } from "@/app/lib/hyroxWeeklyReview";

const WEEK_SELECT =
  "id, athlete_id, block_number, week_number, week_start_date, week_end_date, weekly_focus, coach_note, athlete_facing_note, status, published_at";

const SESSION_SELECT =
  "id, programme_week_id, athlete_id, day_of_week, session_slot, session_name, category, prescription, metadata, status, completed_at, athlete_feedback";

const COACH_TZ = "Europe/London";

function asRecord(value: unknown): Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function painFromFeedback(metrics: unknown): string | null {
  const pain = asRecord(metrics).painOrTightness;
  if (typeof pain === "string" && pain.trim()) return pain.trim();
  return null;
}

function sessionCalendarYmd(params: {
  programmeStartYmd: string | null;
  weekNumber: number;
  dayOfWeek: string;
  weekStartDate: string | null;
}): string | null {
  if (params.programmeStartYmd) {
    try {
      return sessionDateYmdFromProgrammeStart(params.programmeStartYmd, params.weekNumber, params.dayOfWeek);
    } catch {
      /* fall through */
    }
  }
  if (params.weekStartDate) {
    const offset = daySortIndex(params.dayOfWeek);
    if (offset > 6) return null;
    return addDaysYmd(params.weekStartDate, offset);
  }
  return null;
}




function mapAttentionSession(row: HyroxProgrammeSessionRow, dateYmd: string | null): CoachAttentionSession {
  const feedback = parseHyroxAthleteSessionFeedback(row.athlete_feedback);
  const planned = extractPlannedTargets({
    prescription: row.prescription,
    category: row.category,
    sessionName: row.session_name,
  });
  return {
    id: row.id,
    name: row.session_name,
    dateYmd,
    dayOfWeek: row.day_of_week,
    slot: row.session_slot,
    completed: sessionCompletedStatus(row.status),
    isKey: isKeyProgrammeSession({
      metadata: asRecord(row.metadata),
      sessionSlot: row.session_slot,
      category: row.category,
    }),
    loggedRpe: parseLoggedRpe(feedback.rpe),
    prescribedRpeMax: parsePrescribedRpeRange(planned.targetRPE)?.max ?? null,
    notes: feedback.notes ?? null,
    painOrTightness: painFromFeedback(feedback.metrics),
  };
}

async function loadPublishedWeeks(
  supabase: SupabaseClient,
  athleteId: string,
  weekNumbers: number[]
): Promise<Map<number, { week: HyroxProgrammeWeekRow; sessions: HyroxProgrammeSessionRow[] }>> {
  const unique = [...new Set(weekNumbers.filter((n) => n >= 1))];
  const out = new Map<number, { week: HyroxProgrammeWeekRow; sessions: HyroxProgrammeSessionRow[] }>();
  if (!unique.length) return out;

  const { data: weeks } = await supabase
    .from("hyrox_programme_weeks")
    .select(WEEK_SELECT)
    .eq("athlete_id", athleteId)
    .eq("status", "published")
    .in("week_number", unique);

  const weekRows = (weeks as HyroxProgrammeWeekRow[] | null) ?? [];
  if (!weekRows.length) return out;

  const { data: sessionRows } = await supabase
    .from("hyrox_programme_sessions")
    .select(SESSION_SELECT)
    .in(
      "programme_week_id",
      weekRows.map((week) => week.id)
    );

  const byWeekId = new Map<string, HyroxProgrammeSessionRow[]>();
  for (const row of (sessionRows as HyroxProgrammeSessionRow[] | null) ?? []) {
    const list = byWeekId.get(row.programme_week_id) ?? [];
    list.push(row);
    byWeekId.set(row.programme_week_id, list);
  }

  for (const week of weekRows) {
    out.set(week.week_number, { week, sessions: byWeekId.get(week.id) ?? [] });
  }
  return out;
}

async function loadRecentReadiness(
  supabase: SupabaseClient,
  athleteId: string,
  sinceYmd: string
): Promise<CoachAttentionReadiness[]> {
  const { data, error } = await supabase
    .from("hyrox_daily_readiness")
    .select("local_date, feeling_unwell, muscle_soreness")
    .eq("athlete_id", athleteId)
    .gte("local_date", sinceYmd)
    .order("local_date", { ascending: false });

  if (error) {
    if (isHyroxDailyReadinessRelationMissing(error)) return [];
    return [];
  }

  return ((data ?? []) as Array<{
    local_date: string;
    feeling_unwell: boolean | null;
    muscle_soreness: number | null;
  }>).map((row) => ({
    localDate: row.local_date,
    feelingUnwell: Boolean(row.feeling_unwell),
    muscleSoreness: row.muscle_soreness,
  }));
}

function formatProfileAnchors(
  profile: HyroxAthletePerformanceProfile
): HyroxCommandCentrePayload["performanceProfile"]["anchors"] {
  return [
    {
      key: "run5k",
      label: "5K",
      display: profile.run5k ? formatDuration(profile.run5k.resultSeconds) : null,
      derived: profile.run5k ? formatPacePerKm(profile.run5k.paceSecondsPerKm) : null,
      resultDate: profile.run5k?.resultDate ?? null,
    },
    {
      key: "threshold",
      label: "Threshold",
      display: profile.threshold ? formatPacePerKm(profile.threshold.paceSecondsPerKm) : null,
      derived: null,
      resultDate: profile.threshold?.resultDate ?? null,
    },
    {
      key: "ski2k",
      label: "Ski 2K",
      display: profile.ski2k ? formatDuration(profile.ski2k.resultSeconds) : null,
      derived: profile.ski2k ? formatSplitPer500(profile.ski2k.splitSecondsPer500) : null,
      resultDate: profile.ski2k?.resultDate ?? null,
    },
    {
      key: "row2k",
      label: "Row 2K",
      display: profile.row2k ? formatDuration(profile.row2k.resultSeconds) : null,
      derived: profile.row2k ? formatSplitPer500(profile.row2k.splitSecondsPer500) : null,
      resultDate: profile.row2k?.resultDate ?? null,
    },
    {
      key: "ftp",
      label: "FTP",
      display: profile.ftp ? formatWatts(profile.ftp.watts) : null,
      derived: null,
      resultDate: profile.ftp?.resultDate ?? null,
    },
    {
      key: "hyroxRun",
      label: "HYROX run pace",
      display: profile.hyroxRun ? formatPacePerKm(profile.hyroxRun.paceSecondsPerKm) : null,
      derived: null,
      resultDate: profile.hyroxRun?.resultDate ?? null,
    },
  ];
}

export async function loadHyroxCommandCentre(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow
): Promise<HyroxCommandCentrePayload> {
  const generatedAt = new Date().toISOString();
  const todayYmd = localDateYmdInTimeZone(new Date(), COACH_TZ);
  const programmeStart = athlete.programme_start_date?.trim() || null;
  const weekNumber = programmeStart
    ? deriveLiveGlobalWeek(programmeStart)
    : athlete.current_week ?? null;

  const weekNumbers = weekNumber != null ? [weekNumber - 1, weekNumber].filter((n) => n >= 1) : [];

  const [published, checkIns, profileResult, recentReadiness, analyticsLoad] = await Promise.all([
    loadPublishedWeeks(supabase, athlete.id, weekNumbers),
    fetchCoachCheckInHistory(supabase, athlete.id, 8).catch(() => []),
    getHyroxAthletePerformanceProfile(supabase, athlete.id),
    loadRecentReadiness(supabase, athlete.id, addDaysYmd(todayYmd, -6)),
    loadHyroxAthleteAnalyticsFromEngine({ athleteId: athlete.id, client: supabase }),
  ]);

  const currentBundle = weekNumber != null ? published.get(weekNumber) : undefined;
  const previousBundle = weekNumber != null && weekNumber > 1 ? published.get(weekNumber - 1) : undefined;

  const weekDates =
    programmeStart && weekNumber != null
      ? weekDateRangeFromProgrammeStart(programmeStart, weekNumber)
      : currentBundle?.week.week_start_date && currentBundle.week.week_end_date
        ? { startYmd: currentBundle.week.week_start_date, endYmd: currentBundle.week.week_end_date }
        : { startYmd: null as string | null, endYmd: null as string | null };

  const calendarStatus =
    weekNumber != null && currentBundle
      ? deriveWeekCalendarStatusForAthleteWeek({
          programmeStartYmd: programmeStart,
          weekNumber,
          dbWeekStartYmd: currentBundle.week.week_start_date,
          dbWeekEndYmd: currentBundle.week.week_end_date,
        })
      : "unpublished";

  const mapBundle = (number: number, bundle: { week: HyroxProgrammeWeekRow; sessions: HyroxProgrammeSessionRow[] }) =>
    bundle.sessions.map((row) =>
      mapAttentionSession(
        row,
        sessionCalendarYmd({
          programmeStartYmd: programmeStart,
          weekNumber: number,
          dayOfWeek: row.day_of_week,
          weekStartDate: bundle.week.week_start_date,
        })
      )
    );

  const currentSessions = currentBundle && weekNumber != null ? mapBundle(weekNumber, currentBundle) : [];
  const previousSessions =
    previousBundle && weekNumber != null ? mapBundle(weekNumber - 1, previousBundle) : [];

  const currentFacts = currentBundle ? summarizePublishedWeek(currentSessions) : null;
  const previousFacts = previousBundle ? summarizePublishedWeek(previousSessions) : null;
  const upcoming = pickUpcomingKeySession(currentSessions, todayYmd);

  const attentionCheckIns: CoachAttentionCheckIn[] = checkIns.map((row) => ({
    id: row.id,
    weekNumber: row.weekNumber,
    submittedAt: row.submittedAt,
    energy: row.energy,
    soreness: row.soreness,
    painNiggles: row.painNiggles,
    biggestStruggle: row.biggestStruggle,
  }));
  const currentWeekCheckIn =
    weekNumber != null ? attentionCheckIns.find((row) => row.weekNumber === weekNumber) ?? null : null;
  const latestCheckIn = attentionCheckIns[0] ?? null;

  const pendingRows = profileResult.unavailable
    ? []
    : profileResult.rows.filter((row) => row.status === "pending");

  const needsAttention = evaluateCoachAttentionFlags({
    athleteId: athlete.id,
    todayYmd,
    currentWeekNumber: weekNumber,
    currentWeekCalendarStatus: currentBundle ? calendarStatus : "unpublished",
    currentWeekPublished: Boolean(currentBundle),
    currentWeekSessions: currentSessions,
    previousWeekSessions: previousSessions,
    recentCheckIns: attentionCheckIns,
    currentWeekCheckIn,
    recentReadiness,
    pendingBenchmarks: pendingRows.map((row) => ({
      id: row.id,
      type: row.benchmark_type,
      label: benchmarkLabel(row.benchmark_type),
      resultDate: row.result_date,
    })),
  });



  const thisWeek = overlayAnalyticsOnThisWeek(
    {
      weekNumber,
      startDate: weekDates.startYmd,
      endDate: weekDates.endYmd,
      published: Boolean(currentBundle),
      calendarStatus: currentBundle ? calendarStatus : "unpublished",
      plannedSessions: currentFacts?.plannedSessions ?? null,
      completedSessions: currentFacts?.completedSessions ?? null,
      completionPct: currentFacts?.completionPct ?? null,
      runDistanceKm: null,
      trainingDurationMinutes: null,
      averageRpe: currentFacts?.averageRpe ?? null,
      sessionRpeLoad: null,
      keySessionsCompleted: currentFacts?.keySessionsCompleted ?? null,
      keySessionsPlanned: currentFacts?.keySessionsPlanned ?? null,
      latestCheckIn: latestCheckIn
        ? {
            weekNumber: latestCheckIn.weekNumber,
            submittedAt: latestCheckIn.submittedAt,
            sleep: checkIns.find((row) => row.id === latestCheckIn.id)?.sleep ?? null,
            energy: latestCheckIn.energy,
            soreness: latestCheckIn.soreness,
            painNiggles: latestCheckIn.painNiggles,
          }
        : null,
      pendingBenchmarkCount: profileResult.unavailable ? null : pendingRows.length,
      pendingBenchmarkUnavailable: profileResult.unavailable,
      upcomingKeySession: upcoming
        ? {
            id: upcoming.id,
            name: upcoming.name,
            dateYmd: upcoming.dateYmd,
            dayOfWeek: upcoming.dayOfWeek,
            slot: upcoming.slot,
          }
        : null,
    },
    analyticsLoad.analytics
  );

  const athleteNote = athleteFacingWeeklyNote(currentBundle?.week.athlete_facing_note);
  const internalNote = currentBundle?.week.coach_note?.trim() || null;

  return {
    athleteId: athlete.id,
    generatedAt,
    analyticsStatus: analyticsLoad.status,
    analytics: analyticsLoad.analytics,
    thisWeek,
    recentProgress: {
      previousWeekPlanned: previousFacts?.plannedSessions ?? null,
      previousWeekCompleted: previousFacts?.completedSessions ?? null,
      previousWeekAverageRpe: previousFacts?.averageRpe ?? null,
    },
    needsAttention,
    performanceProfile: {
      unavailable: profileResult.unavailable,
      pendingCount: profileResult.unavailable ? null : pendingRows.length,
      anchors: formatProfileAnchors(profileResult.profile),
    },
    notes: {
      athleteFacingNote: athleteNote || null,
      internalCoachNote: internalNote,
    },
  };
}

/** @deprecated use loadHyroxCommandCentre */
export const loadHyroxCoachCommandCentre = loadHyroxCommandCentre;
