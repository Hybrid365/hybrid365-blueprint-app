/**
 * Pure helpers for the paid dashboard “This week” tracking summary.
 * No Supabase / React — safe for server pages and client display.
 */

import {
  buildSessionKey,
  extractScheduleFromPlanJson,
  extractWeekRationale,
  normalizeMemberSchedule,
  type MemberSessionDetail,
  type SessionCategoryLabel,
} from "./memberDashboardSchedule";
import { isSessionLogComplete } from "./sessionLogTypes";
import {
  calculateSessionAdherence,
  deriveEffectiveCurrentWeek,
  groupBenchmarkTests,
  type BenchmarkTestLike,
  type ProgrammeWeekLike,
  type SessionLogLike,
  type WeeklyCheckInLike,
} from "./progressMetrics";
import { isStrengthBenchmarkType } from "./benchmarkCoreAreas";
import type { DailyHabitLogRow } from "./dailyHabitLogs";
import {
  countHabitsHit,
  habitStreakFromLogs,
  HABIT_TOTAL,
  habitScorePercent,
  localDateKey,
  shiftLocalDateKey,
} from "./dailyHabitLogs";
import {
  approvedChallengePoints,
  habitPointsFromLogs,
  provisionalTotalChallengePoints,
  sessionCompletionPointsChallengeWindow,
  weeklyCheckInPointsInChallenge,
  type ChallengeSubmissionRow,
} from "./hybridChallengeMetrics";

export type WeekSessionSlot = {
  sessionKey: string;
  title: string;
  category: SessionCategoryLabel;
  day: string;
  completed: boolean;
  sessionStatus: string | null;
};

export type RunVolumeTracking = {
  /** True when week plan or rationale exposes a km band we can parse */
  hasPlannedKmEstimate: boolean;
  plannedKmMin: number | null;
  plannedKmMax: number | null;
  /** Per-session km not stored yet — see hasPerSessionKmMetadata */
  hasPerSessionKmMetadata: boolean;
  completedRunKm: number | null;
  plannedRunKmFromWeekTarget: number | null;
};

export type HabitWeekSummary = {
  todayDone: number;
  todayPct: number;
  weekHabitHits: number;
  weekMaxHits: number;
  weekPct: number;
  streak: number;
};

export type ChallengeTrackingSummary = {
  provisionalPoints: number;
  approvedSubmissionPoints: number;
  sessionPoints: number;
  checkInPoints: number;
  habitWindowPoints: number;
};

export type BenchmarkSnapshotItem = {
  label: string;
  latest: string;
  change: string | null;
  logged: boolean;
};

export type WeeklyProgressNarrative = {
  headline: string;
  body: string;
  completedCount: number;
  plannedCount: number;
  remainingCount: number;
  completionPct: number | null;
};

export type DashboardWeekTrackingSummary = {
  programmeWeek: number;
  hasProgrammePlan: boolean;
  /** All unlocked slots in current programme week */
  sessions: { completed: number; planned: number };
  runs: { completed: number; planned: number };
  strength: { completed: number; planned: number };
  hybrid: { completed: number; planned: number };
  aerobicRecovery: { completed: number; planned: number };
  partialCount: number;
  skippedCount: number;
  consistencyPct: number | null;
  consistencyLabel: string;
  weeklyNarrative: WeeklyProgressNarrative;
  weeklyCheckInComplete: boolean;
  runVolume: RunVolumeTracking;
  habit: HabitWeekSummary | null;
  challenge: ChallengeTrackingSummary | null;
  benchmarks: BenchmarkSnapshotItem[];
  hasAnyTrackingActivity: boolean;
};

function classifyCategory(session: MemberSessionDetail): SessionCategoryLabel {
  return session.category;
}

function isRunCategory(cat: SessionCategoryLabel): boolean {
  return cat === "Run";
}

function isStrengthCategory(cat: SessionCategoryLabel): boolean {
  return cat === "Strength";
}

function isHybridCategory(cat: SessionCategoryLabel): boolean {
  return cat === "Hybrid";
}

function isAerobicOrRecovery(cat: SessionCategoryLabel): boolean {
  return cat === "Aerobic" || cat === "Recovery";
}

export function listWeekSessionSlots(
  week: ProgrammeWeekLike,
  logs: SessionLogLike[]
): WeekSessionSlot[] {
  if (!week.is_unlocked) return [];
  const raw = extractScheduleFromPlanJson(week.plan_json);
  if (!raw?.length) return [];
  const normalized = normalizeMemberSchedule(raw);
  const logMap = new Map<string, SessionLogLike>();
  for (const log of logs) {
    if (log.week_number !== week.week_number) continue;
    logMap.set(log.session_key, log);
  }
  return normalized.map((session, index) => {
    const sessionKey = buildSessionKey({
      weekNumber: week.week_number,
      day: session.day,
      index,
      title: session.title,
    });
    const category = classifyCategory(session);
    const hit = logMap.get(sessionKey);
    return {
      sessionKey,
      title: session.title,
      category,
      day: session.day,
      completed: isSessionLogComplete(hit),
      sessionStatus: hit?.session_status ?? (hit?.completed ? "completed" : null),
    };
  });
}

/** Parse “35–45 km” / “45-60 km” from week rationale key_marker text when present. */
export function parsePlannedKmBandFromPlanJson(planJson: unknown): {
  min: number | null;
  max: number | null;
} {
  const rationale = extractWeekRationale(planJson);
  const text = rationale?.key_marker_this_week ?? "";
  const range = text.match(/(\d+)\s*[–-]\s*(\d+)\s*km/i);
  if (range) {
    return { min: Number(range[1]), max: Number(range[2]) };
  }
  const single = text.match(/(\d+)\s*km/i);
  if (single) {
    const n = Number(single[1]);
    return { min: n, max: n };
  }
  return { min: null, max: null };
}

/**
 * Programme generation does not yet persist per-session `estimated_run_km` on schedule rows.
 * TODO(programme-generation): add estimated_run_km (or run_distance_km) per run session so we can
 * sum planned/completed km accurately. Until then we only parse week-level km bands from rationale text.
 * Week-level targets may appear in week_rationale.key_marker_this_week after progression families run.
 */
export function buildRunVolumeTracking(
  week: ProgrammeWeekLike,
  slots: WeekSessionSlot[]
): RunVolumeTracking {
  const band = parsePlannedKmBandFromPlanJson(week.plan_json);
  const hasPlannedKmEstimate = band.min != null && band.max != null;

  const schedule = extractScheduleFromPlanJson(week.plan_json);
  let hasPerSessionKmMetadata = false;
  if (Array.isArray(schedule)) {
    for (const row of schedule) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      if (
        r.estimated_run_km != null ||
        r.run_km != null ||
        r.run_distance_km != null
      ) {
        hasPerSessionKmMetadata = true;
        break;
      }
    }
  }

  const plannedRunKmFromWeekTarget =
    hasPlannedKmEstimate && band.min != null && band.max != null
      ? Math.round((band.min + band.max) / 2)
      : null;

  return {
    hasPlannedKmEstimate,
    plannedKmMin: band.min,
    plannedKmMax: band.max,
    hasPerSessionKmMetadata,
    completedRunKm: null,
    plannedRunKmFromWeekTarget,
  };
}

export function summarizeHabitsForDashboard(
  habitLogs: DailyHabitLogRow[],
  todayYmd: string
): HabitWeekSummary {
  const from = shiftLocalDateKey(todayYmd, -6);
  let weekHabitHits = 0;
  let weekMaxHits = 0;
  for (const row of habitLogs) {
    if (row.log_date < from || row.log_date > todayYmd) continue;
    const hits = countHabitsHit(row);
    weekHabitHits += hits;
    weekMaxHits += HABIT_TOTAL;
  }
  const todayRow = habitLogs.find((r) => r.log_date === todayYmd);
  const todayDone = countHabitsHit(todayRow ?? null);
  const weekPct =
    weekMaxHits > 0 ? Math.round((100 * weekHabitHits) / weekMaxHits) : 0;
  const streak = habitStreakFromLogs(habitLogs, todayYmd);

  return {
    todayDone,
    todayPct: habitScorePercent(todayDone),
    weekHabitHits,
    weekMaxHits,
    weekPct,
    streak,
  };
}

export function buildChallengeTrackingSummary(args: {
  habitLogs: DailyHabitLogRow[];
  todayYmd: string;
  weeklyCheckIns: WeeklyCheckInLike[];
  sessionLogs: SessionLogLike[];
  submissions: ChallengeSubmissionRow[];
}): ChallengeTrackingSummary {
  const { fromYmd, toYmd } = { fromYmd: shiftLocalDateKey(args.todayYmd, -41), toYmd: args.todayYmd };
  const habitWindowPoints = habitPointsFromLogs(args.habitLogs, fromYmd, toYmd);
  const checkInPoints = weeklyCheckInPointsInChallenge(args.weeklyCheckIns);
  const sessionPoints = sessionCompletionPointsChallengeWindow(args.sessionLogs);
  const approvedSubmissionPoints = approvedChallengePoints(args.submissions);
  const provisional = provisionalTotalChallengePoints({
    habitLogs: args.habitLogs,
    todayYmd: args.todayYmd,
    weeklyCheckIns: args.weeklyCheckIns,
    sessionLogs: args.sessionLogs,
    mySubmissions: args.submissions,
  });
  return {
    provisionalPoints: provisional.total,
    approvedSubmissionPoints,
    sessionPoints,
    checkInPoints,
    habitWindowPoints,
  };
}

export function buildBenchmarkSnapshot(tests: BenchmarkTestLike[]): BenchmarkSnapshotItem[] {
  const grouped = groupBenchmarkTests(tests);
  const pick = ["5km time trial", "Bodyweight", "1km SkiErg", "1km Row"] as const;
  const strength = grouped.find((g) => g.logged && isStrengthBenchmarkType(g.type));
  const items: BenchmarkSnapshotItem[] = pick.map((type) => {
    const g = grouped.find((x) => x.type === type);
    if (!g || !g.logged) {
      return { label: type, latest: "—", change: null, logged: false };
    }
    return {
      label: type,
      latest: g.latestDisplay,
      change: g.changeLabel !== "—" ? g.changeLabel : null,
      logged: true,
    };
  });
  if (strength) {
    items.push({
      label: "Strength marker",
      latest: strength.latestDisplay,
      change: strength.changeLabel !== "—" ? strength.changeLabel : null,
      logged: true,
    });
  } else {
    items.push({
      label: "Strength marker",
      latest: "Not logged",
      change: null,
      logged: false,
    });
  }
  return items;
}

export function buildDashboardWeekTrackingSummary(args: {
  weeks: ProgrammeWeekLike[];
  sessionLogs: SessionLogLike[];
  weeklyCheckIns: WeeklyCheckInLike[];
  effectiveWeek: number;
  habitLogs?: DailyHabitLogRow[];
  challenge?: ChallengeTrackingSummary | null;
  benchmarkTests?: BenchmarkTestLike[];
}): DashboardWeekTrackingSummary {
  const programmeWeek = Math.min(12, Math.max(1, Math.floor(args.effectiveWeek)));
  const weekRow =
    args.weeks.find((w) => w.week_number === programmeWeek) ??
    args.weeks.find((w) => w.is_unlocked) ??
    null;

  const slots = weekRow ? listWeekSessionSlots(weekRow, args.sessionLogs) : [];
  const hasProgrammePlan = slots.length > 0;

  const countBy = (pred: (c: SessionCategoryLabel) => boolean) => {
    const planned = slots.filter((s) => pred(s.category)).length;
    const completed = slots.filter((s) => pred(s.category) && s.completed).length;
    return { completed, planned };
  };

  const sessions = {
    completed: slots.filter((s) => s.completed).length,
    planned: slots.length,
  };
  const partialCount = slots.filter((s) => s.sessionStatus === "partial").length;
  const skippedCount = slots.filter((s) => s.sessionStatus === "skipped").length;
  const runs = countBy(isRunCategory);
  const strength = countBy(isStrengthCategory);
  const hybrid = countBy(isHybridCategory);
  const aerobicRecovery = countBy(isAerobicOrRecovery);

  const adherence = calculateSessionAdherence(args.sessionLogs, args.weeks, programmeWeek);
  const consistencyPct =
    adherence.currentWeekTotal > 0 ? adherence.currentWeekPercentage : null;
  const remainingCount = Math.max(0, sessions.planned - sessions.completed);

  let consistencyLabel =
    consistencyPct == null
      ? "Start logging sessions to build your consistency score."
      : consistencyPct === 0
        ? "Start logging sessions to build your consistency score."
        : `Weekly consistency: ${consistencyPct}%`;

  const weeklyNarrative = buildWeeklyProgressNarrative({
    completed: sessions.completed,
    planned: sessions.planned,
    remaining: remainingCount,
    completionPct: consistencyPct,
    isHyrox: false,
  });

  const weeklyCheckInComplete = Boolean(
    args.weeklyCheckIns.find((c) => c.week_number === programmeWeek && c.submitted_at)
  );

  const runVolume = weekRow
    ? buildRunVolumeTracking(weekRow, slots)
    : {
        hasPlannedKmEstimate: false,
        plannedKmMin: null,
        plannedKmMax: null,
        hasPerSessionKmMetadata: false,
        completedRunKm: null,
        plannedRunKmFromWeekTarget: null,
      };

  const todayYmd = localDateKey(new Date());
  const habit =
    args.habitLogs != null ? summarizeHabitsForDashboard(args.habitLogs, todayYmd) : null;

  const benchmarks = buildBenchmarkSnapshot(args.benchmarkTests ?? []);

  const hasAnyTrackingActivity =
    sessions.completed > 0 ||
    (habit != null && habit.weekHabitHits > 0) ||
    weeklyCheckInComplete ||
    benchmarks.some((b) => b.logged);

  return {
    programmeWeek,
    hasProgrammePlan,
    sessions,
    runs,
    strength,
    hybrid,
    aerobicRecovery,
    partialCount,
    skippedCount,
    consistencyPct,
    consistencyLabel,
    weeklyNarrative,
    weeklyCheckInComplete,
    runVolume,
    habit,
    challenge: args.challenge ?? null,
    benchmarks,
    hasAnyTrackingActivity,
  };
}

export function buildWeeklyProgressNarrative(args: {
  completed: number;
  planned: number;
  remaining: number;
  completionPct: number | null;
  isHyrox?: boolean;
}): WeeklyProgressNarrative {
  const { completed, planned, remaining, completionPct } = args;
  const headline =
    planned === 0
      ? "This week so far"
      : `${completed} of ${planned} sessions complete`;

  let body: string;
  if (planned === 0) {
    body = "Your programme week will show progress here once sessions are available.";
  } else if (completed === 0) {
    body = args.isHyrox
      ? "Log your first session to start tracking threshold work, stations and hybrid performance."
      : "Log your first session this week — consistency starts with one completed training day.";
  } else if (remaining === 0) {
    body = args.isHyrox
      ? "Week complete. Recover well and stay ready for the next block of race-specific work."
      : "Week complete. Recover well and carry momentum into next week.";
  } else {
    body = args.isHyrox
      ? `${remaining} session${remaining === 1 ? "" : "s"} remaining. Keep the easy work easy and prioritise your next key session.`
      : `${remaining} session${remaining === 1 ? "" : "s"} remaining. Training consistency building — complete your next run or lift.`;
  }

  return {
    headline,
    body,
    completedCount: completed,
    plannedCount: planned,
    remainingCount: remaining,
    completionPct,
  };
}
