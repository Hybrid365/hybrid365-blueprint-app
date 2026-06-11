import { hasMeaningfulPlanJson } from "@/app/lib/programmePlan";
import {
  normalizeProgrammeScheduleForWeek,
  type SessionWithKey,
} from "@/app/lib/programmePageMetrics";
import { daySortIndex, normalizeProgrammeDay } from "@/app/lib/hyroxAthleteProgrammeSort";
import { isSessionLogComplete } from "@/app/lib/sessionLogTypes";

export type MemberWeekPayload = {
  week_number: number;
  is_unlocked: boolean | null;
  plan_json: unknown | null;
};

export type TodayOrNextSessionResult = {
  session: SessionWithKey | null;
  isTodayMatch: boolean;
  isRestDay: boolean;
  noSessionToday: boolean;
};

function todayWeekdayName(): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(new Date());
}

function sessionMatchesToday(sessionDay: string, today: string): boolean {
  return normalizeProgrammeDay(sessionDay) === normalizeProgrammeDay(today);
}

function isSessionComplete(
  sessionLogs: Record<string, { completed?: boolean; session_status?: string | null } | undefined>,
  sessionKey: string
): boolean {
  return isSessionLogComplete(sessionLogs[sessionKey]);
}

function sessionsForWeek(week: MemberWeekPayload): SessionWithKey[] {
  return normalizeProgrammeScheduleForWeek(week.week_number, week.plan_json);
}

/** First incomplete session from `startWeek` onward, then earlier unlocked weeks. */
export function findNextMemberSession(args: {
  weeks: MemberWeekPayload[];
  sessionLogs: Record<string, { completed?: boolean; session_status?: string | null } | undefined>;
  startWeek: number;
}): SessionWithKey | null {
  const unlocked = args.weeks
    .filter((w) => w.is_unlocked && hasMeaningfulPlanJson(w.plan_json))
    .sort((a, b) => a.week_number - b.week_number);
  if (!unlocked.length) return null;

  const fromStart = unlocked.filter((w) => w.week_number >= args.startWeek);
  const beforeStart = unlocked.filter((w) => w.week_number < args.startWeek);
  const ordered = [...fromStart, ...beforeStart];

  for (const week of ordered) {
    const sessions = sessionsForWeek(week);
    const next = sessions.find((s) => !isSessionComplete(args.sessionLogs, s.sessionKey));
    if (next) return next;
  }
  return null;
}

/**
 * Prefer today's session in the effective unlocked week; if complete, next incomplete;
 * fallback to findNextMemberSession.
 */
export function findTodayOrNextSession(args: {
  weeks: MemberWeekPayload[];
  sessionLogs: Record<string, { completed?: boolean; session_status?: string | null } | undefined>;
  effectiveWeek: number;
}): TodayOrNextSessionResult {
  const today = todayWeekdayName();
  const weekRow = args.weeks.find(
    (w) => w.week_number === args.effectiveWeek && w.is_unlocked && hasMeaningfulPlanJson(w.plan_json)
  );

  if (!weekRow) {
    const fallback = findNextMemberSession({
      weeks: args.weeks,
      sessionLogs: args.sessionLogs,
      startWeek: args.effectiveWeek,
    });
    return {
      session: fallback,
      isTodayMatch: false,
      isRestDay: false,
      noSessionToday: true,
    };
  }

  const sessions = sessionsForWeek(weekRow);
  const todaySessions = sessions.filter((s) => sessionMatchesToday(s.day, today));
  const todayIdx = daySortIndex(today);

  if (todaySessions.length === 0) {
    const fallback =
      findNextMemberSession({
        weeks: args.weeks,
        sessionLogs: args.sessionLogs,
        startWeek: args.effectiveWeek,
      }) ??
      sessions.find((s) => !isSessionComplete(args.sessionLogs, s.sessionKey)) ??
      null;
    return {
      session: fallback,
      isTodayMatch: false,
      isRestDay: true,
      noSessionToday: true,
    };
  }

  const incompleteToday = todaySessions.find((s) => !isSessionComplete(args.sessionLogs, s.sessionKey));
  if (incompleteToday) {
    return {
      session: incompleteToday,
      isTodayMatch: true,
      isRestDay: false,
      noSessionToday: false,
    };
  }

  const laterThisWeek = sessions.filter(
    (s) =>
      daySortIndex(s.day) > todayIdx && !isSessionComplete(args.sessionLogs, s.sessionKey)
  );
  if (laterThisWeek.length > 0) {
    return {
      session: laterThisWeek[0]!,
      isTodayMatch: false,
      isRestDay: false,
      noSessionToday: false,
    };
  }

  const fallback = findNextMemberSession({
    weeks: args.weeks,
    sessionLogs: args.sessionLogs,
    startWeek: args.effectiveWeek,
  });

  return {
    session: fallback,
    isTodayMatch: false,
    isRestDay: false,
    noSessionToday: false,
  };
}
