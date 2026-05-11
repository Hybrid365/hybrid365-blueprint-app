/**
 * Hybrid Challenge — scoring & weekly snapshots (Milestone 14). Pure helpers, no I/O.
 */

import { countHabitsHit, shiftLocalDateKey, type DailyHabitLogRow } from "./dailyHabitLogs";
import { HYBRID_CHALLENGE_DURATION_WEEKS, HYBRID_CHALLENGE_POINTS } from "./hybridChallengeConfig";
import {
  coreBaselineAreaFlags,
  type HybridBaselineChecklist,
} from "./benchmarkCoreAreas";
import {
  buildSessionKey,
  extractScheduleFromPlanJson,
  normalizeMemberSchedule,
  type MemberSessionDetail,
} from "./memberDashboardSchedule";
import type { SessionLogLike, WeeklyCheckInLike } from "./progressMetrics";

export type ChallengeSubmissionRow = {
  id: string;
  user_id: string;
  programme_instance_id: string | null;
  challenge_key: string;
  challenge_week: number;
  challenge_title: string;
  score_value: string | number | null;
  score_unit: string | null;
  score_time: string | null;
  proof_url: string | null;
  proof_note: string | null;
  status: string;
  points_awarded: number;
  admin_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
};

export type SessionWithKey = MemberSessionDetail & { sessionKey: string };

export function challengeHabitWindow(todayYmd: string): { fromYmd: string; toYmd: string } {
  return { fromYmd: shiftLocalDateKey(todayYmd, -41), toYmd: todayYmd };
}

export function habitPointsFromLogs(logs: DailyHabitLogRow[], fromYmd: string, toYmd: string): number {
  let total = 0;
  for (const row of logs) {
    if (row.log_date >= fromYmd && row.log_date <= toYmd) {
      total += countHabitsHit(row) * HYBRID_CHALLENGE_POINTS.habitPerCompletion;
    }
  }
  return total;
}

export function habitPointsToday(logs: DailyHabitLogRow[], todayYmd: string): number {
  const row = logs.find((l) => l.log_date === todayYmd);
  return countHabitsHit(row ?? null) * HYBRID_CHALLENGE_POINTS.habitPerCompletion;
}

export function weeklyCheckInPointsInChallenge(checkIns: WeeklyCheckInLike[]): number {
  const weeks = new Set<number>();
  for (const c of checkIns) {
    if (
      typeof c.week_number === "number" &&
      c.week_number >= 1 &&
      c.week_number <= HYBRID_CHALLENGE_DURATION_WEEKS &&
      c.submitted_at
    ) {
      weeks.add(c.week_number);
    }
  }
  return weeks.size * HYBRID_CHALLENGE_POINTS.weeklyCheckIn;
}

export function sessionCompletionPointsChallengeWindow(sessionLogs: SessionLogLike[]): number {
  let n = 0;
  for (const log of sessionLogs) {
    if (
      log.completed &&
      typeof log.week_number === "number" &&
      log.week_number >= 1 &&
      log.week_number <= HYBRID_CHALLENGE_DURATION_WEEKS
    ) {
      n++;
    }
  }
  return n * HYBRID_CHALLENGE_POINTS.sessionComplete;
}

export function approvedChallengePoints(submissions: ChallengeSubmissionRow[]): number {
  return submissions
    .filter((s) => s.status === "approved")
    .reduce((sum, s) => sum + (typeof s.points_awarded === "number" ? s.points_awarded : 0), 0);
}

export function provisionalTotalChallengePoints(args: {
  habitLogs: DailyHabitLogRow[];
  todayYmd: string;
  weeklyCheckIns: WeeklyCheckInLike[];
  sessionLogs: SessionLogLike[];
  mySubmissions: ChallengeSubmissionRow[];
}): {
  habitWindowPoints: number;
  habitTodayPoints: number;
  checkInPoints: number;
  sessionPoints: number;
  approvedSubmissionPoints: number;
  total: number;
} {
  const { fromYmd, toYmd } = challengeHabitWindow(args.todayYmd);
  const habitWindowPoints = habitPointsFromLogs(args.habitLogs, fromYmd, toYmd);
  const habitTodayPoints = habitPointsToday(args.habitLogs, args.todayYmd);
  const checkInPoints = weeklyCheckInPointsInChallenge(args.weeklyCheckIns);
  const sessionPoints = sessionCompletionPointsChallengeWindow(args.sessionLogs);
  const approvedSubmissionPoints = approvedChallengePoints(args.mySubmissions);
  const total = habitWindowPoints + checkInPoints + sessionPoints + approvedSubmissionPoints;
  return {
    habitWindowPoints,
    habitTodayPoints,
    checkInPoints,
    sessionPoints,
    approvedSubmissionPoints,
    total,
  };
}

function isRunSession(s: MemberSessionDetail): boolean {
  if (s.category === "Run") return true;
  return s.tags.some((t) => t.toLowerCase().includes("run"));
}

function isLiftSession(s: MemberSessionDetail): boolean {
  if (s.category === "Strength") return true;
  const t = s.tags.join(" ").toLowerCase();
  return t.includes("strength");
}

export function sessionsForProgrammeWeek(weekNumber: number, planJson: unknown): SessionWithKey[] {
  const raw = extractScheduleFromPlanJson(planJson);
  if (!raw?.length) return [];
  return normalizeMemberSchedule(raw).map((session, index) => ({
    ...session,
    sessionKey: buildSessionKey({
      weekNumber,
      day: session.day,
      index,
      title: session.title,
    }),
  }));
}

export type WeeklyTrainingSnapshot = {
  weekNumber: number;
  sessionsTotal: number;
  sessionsCompleted: number;
  runsPlanned: number;
  runsCompleted: number;
  liftsPlanned: number;
  liftsCompleted: number;
  checkInDone: boolean;
};

export function getWeeklyTrainingSnapshot(
  weekNumber: number,
  planJson: unknown | null,
  sessionLogs: SessionLogLike[],
  checkIns: WeeklyCheckInLike[]
): WeeklyTrainingSnapshot {
  const sessions = planJson ? sessionsForProgrammeWeek(weekNumber, planJson) : [];
  const logByKey = new Map(sessionLogs.filter((l) => l.week_number === weekNumber).map((l) => [l.session_key, l]));

  let sessionsCompleted = 0;
  let runsPlanned = 0;
  let runsCompleted = 0;
  let liftsPlanned = 0;
  let liftsCompleted = 0;

  for (const s of sessions) {
    const log = logByKey.get(s.sessionKey);
    const done = Boolean(log?.completed);
    if (done) sessionsCompleted++;
    if (isRunSession(s)) {
      runsPlanned++;
      if (done) runsCompleted++;
    }
    if (isLiftSession(s)) {
      liftsPlanned++;
      if (done) liftsCompleted++;
    }
  }

  const checkInDone = checkIns.some((c) => c.week_number === weekNumber && Boolean(c.submitted_at));

  return {
    weekNumber,
    sessionsTotal: sessions.length,
    sessionsCompleted,
    runsPlanned,
    runsCompleted,
    liftsPlanned,
    liftsCompleted,
    checkInDone,
  };
}

export type { HybridBaselineChecklist } from "./benchmarkCoreAreas";

/** Challenge baseline checklist — four hybrid areas + optional photos handled in UI. */
export function baselineChecklist(tests: { test_type: string | null }[]): HybridBaselineChecklist {
  return coreBaselineAreaFlags(tests);
}

export type LeaderboardAggregate = {
  rank: number;
  userId: string;
  displayLabel: string;
  totalPoints: number;
  entries: ChallengeSubmissionRow[];
};

/** Shown when no safe public name is available (never UUID fragments or full email). */
export const HYBRID_LEADERBOARD_FALLBACK_DISPLAY = "Hybrid Athlete";

/**
 * Local part of email only (never the domain). For use on the leaderboard for the signed-in viewer’s own row only.
 */
export function leaderboardEmailLocalPart(email: string | null | undefined): string | null {
  if (!email || typeof email !== "string") return null;
  const at = email.indexOf("@");
  if (at <= 0) return null;
  const local = email.slice(0, at).trim();
  if (!local) return null;
  return local.length > 48 ? `${local.slice(0, 48)}…` : local;
}

/**
 * Public leaderboard label. Order: profiles.full_name → athlete_assessments.first_name →
 * email local-part for the viewer’s own row only → {@link HYBRID_LEADERBOARD_FALLBACK_DISPLAY}.
 */
export function leaderboardPublicDisplayName(params: {
  subjectUserId: string;
  viewerUserId: string;
  profileFullName: string | null | undefined;
  assessmentFirstName: string | null | undefined;
  viewerEmail: string | null | undefined;
}): string {
  const full = params.profileFullName?.trim();
  if (full) return full;
  const first = params.assessmentFirstName?.trim();
  if (first) return first;
  if (params.subjectUserId === params.viewerUserId) {
    const local = leaderboardEmailLocalPart(params.viewerEmail);
    if (local) return local;
  }
  return HYBRID_LEADERBOARD_FALLBACK_DISPLAY;
}

export function buildLeaderboard(
  approvedRows: ChallengeSubmissionRow[],
  displayLabelForUserId: (userId: string) => string
): LeaderboardAggregate[] {
  const map = new Map<string, ChallengeSubmissionRow[]>();
  for (const row of approvedRows) {
    if (row.status !== "approved") continue;
    const list = map.get(row.user_id) ?? [];
    list.push(row);
    map.set(row.user_id, list);
  }
  const aggregates: LeaderboardAggregate[] = [];
  for (const [userId, entries] of map) {
    const totalPoints = entries.reduce((s, e) => s + (e.points_awarded || 0), 0);
    aggregates.push({
      rank: 0,
      userId,
      displayLabel: displayLabelForUserId(userId),
      totalPoints,
      entries: entries.sort((a, b) => (b.submitted_at ?? "").localeCompare(a.submitted_at ?? "")),
    });
  }
  aggregates.sort((a, b) => b.totalPoints - a.totalPoints || a.userId.localeCompare(b.userId));
  aggregates.forEach((row, i) => {
    row.rank = i + 1;
  });
  return aggregates;
}

export function userRankInLeaderboard(board: LeaderboardAggregate[], userId: string): number | null {
  const row = board.find((b) => b.userId === userId);
  return row ? row.rank : null;
}
