/**
 * Shared Hyrox athlete programme calendar — used by dashboard and programme views.
 * Resolves week status, live week, and next session from programme_start_date + programmeWeeks[].
 */

import type { AthleteProgrammeWeekBundle } from "@/app/lib/hyroxAthleteProgrammeTypes";
import {
  formatSessionCalendarDateLabel,
  normalizeProgrammeDay,
  sessionDateYmdFromProgrammeStart,
  slotSortIndex,
  sortProgrammeSessions,
  type ResolvedNextSession,
} from "@/app/lib/hyroxAthleteProgrammeSort";
import {
  deriveLiveGlobalWeek,
  deriveWeekCalendarStatus,
  parseYmd,
  startOfLocalDay,
  weekDateRangeFromProgrammeStart,
  type ProgrammeLengthWeeks,
} from "@/app/lib/hyroxProgrammeDates";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";

export type ProgrammeNextSessionState =
  | "session"
  | "upcoming"
  | "week_complete"
  | "block_complete";

export type ProgrammeNextSessionResolution = {
  state: ProgrammeNextSessionState;
  session: ResolvedNextSession | null;
  message: string | null;
};

export type HyroxProgrammeCalendarContext = {
  programmeStartDate: string | null;
  programmeLengthWeeks: ProgrammeLengthWeeks;
  liveGlobalWeek: number;
  /** Cycle week within block (1–4) for the active dashboard week */
  blockWeekInCycle: number;
  blockNumber: number;
  beforeProgrammeStart: boolean;
  activeWeekBundle: AthleteProgrammeWeekBundle | null;
  activeWeekCalendarStatus: AthleteProgrammeWeekBundle["calendarStatus"] | null;
  missingStartDate: boolean;
};

function sessionDateInWeek(
  programmeStartYmd: string,
  globalWeekNumber: number,
  day: string
): Date {
  return startOfLocalDay(
    parseYmd(sessionDateYmdFromProgrammeStart(programmeStartYmd, globalWeekNumber, day))
  );
}

function sessionToResolved(
  session: HyroxSession,
  options?: { programmeStartYmd: string; globalWeekNumber: number }
): ResolvedNextSession {
  const dateLabel =
    options?.programmeStartYmd && options.globalWeekNumber
      ? formatSessionCalendarDateLabel(
          session.day,
          sessionDateYmdFromProgrammeStart(
            options.programmeStartYmd,
            options.globalWeekNumber,
            session.day
          ),
          session.timeOfDay
        )
      : session.dateLabel;
  return {
    sessionId: session.id,
    name: session.name,
    day: normalizeProgrammeDay(session.day),
    dateLabel,
    type: session.type,
    duration: session.duration,
    rpeTarget: session.rpeTarget,
    objective: session.intent,
    coachNote: session.coachNote ?? "",
    priority: session.priority,
  };
}

function pickFirstIncompleteSession(
  sessions: HyroxSession[],
  filter?: (s: HyroxSession) => boolean
): HyroxSession | null {
  const sorted = sortProgrammeSessions(sessions);
  const incomplete = sorted.filter((s) => s.status !== "complete");
  const pool = filter ? incomplete.filter(filter) : incomplete;
  return pool[0] ?? null;
}

function resolveWeekStartYmd(
  bundle: AthleteProgrammeWeekBundle,
  programmeStartDate: string | null
): string | null {
  if (bundle.weekStartDate) return bundle.weekStartDate;
  if (programmeStartDate) {
    return weekDateRangeFromProgrammeStart(programmeStartDate, bundle.weekNumber).startYmd;
  }
  return null;
}

/** Mirrors ProgrammePageView default week tab selection. */
export function resolveDefaultProgrammeWeekNumber(
  programmeWeeks: AthleteProgrammeWeekBundle[],
  blockWeekNumbers: number[]
): number {
  const tabs = blockWeekNumbers.map((globalWeek) => {
    const bundle = programmeWeeks.find((b) => b.weekNumber === globalWeek);
    const generated = Boolean(bundle?.generated && (bundle.sessions?.length ?? 0) > 0);
    let mode: "active" | "upcoming" | "past" | "not_generated" | "locked" = "not_generated";
    if (bundle?.calendarStatus) {
      if (bundle.calendarStatus === "live") mode = "active";
      else if (bundle.calendarStatus === "past") mode = "past";
      else if (bundle.calendarStatus === "upcoming") mode = "upcoming";
      else if (bundle.calendarStatus === "locked") mode = "locked";
      else mode = "not_generated";
    } else if (generated) {
      mode = "upcoming";
    }
    return { globalWeek, mode, generated };
  });

  return (
    tabs.find((t) => t.mode === "active")?.globalWeek ??
    tabs.find((t) => t.generated && t.mode === "upcoming")?.globalWeek ??
    tabs.find((t) => t.generated)?.globalWeek ??
    tabs[0]?.globalWeek ??
    1
  );
}

/** Week bundle used for dashboard summary cards (live week, or pre-start Week 1). */
export function resolveActiveDashboardWeekBundle(params: {
  programmeWeeks: AthleteProgrammeWeekBundle[];
  programmeStartDate: string | null;
  liveGlobalWeek: number;
  today?: Date;
}): AthleteProgrammeWeekBundle | null {
  const { programmeWeeks, programmeStartDate, liveGlobalWeek } = params;
  const today = startOfLocalDay(params.today ?? new Date());

  const generated = programmeWeeks.filter((b) => b.generated && b.sessions.length > 0);

  if (programmeStartDate) {
    const start = startOfLocalDay(parseYmd(programmeStartDate));
    if (today < start) {
      return (
        generated.find((b) => b.weekNumber === 1) ??
        generated.sort((a, b) => a.weekNumber - b.weekNumber)[0] ??
        null
      );
    }
  }

  const live =
    generated.find((b) => b.calendarStatus === "live") ??
    generated.find((b) => b.weekNumber === liveGlobalWeek) ??
    null;
  if (live) return live;

  const upcoming = [...generated]
    .filter((b) => b.calendarStatus === "upcoming")
    .sort((a, b) => a.weekNumber - b.weekNumber)[0];
  if (upcoming) return upcoming;

  return generated.sort((a, b) => b.weekNumber - a.weekNumber)[0] ?? null;
}

export function buildHyroxProgrammeCalendarContext(params: {
  programmeStartDate: string | null;
  programmeLengthWeeks?: number;
  programmeWeeks: AthleteProgrammeWeekBundle[];
  currentBlock?: number;
  today?: Date;
}): HyroxProgrammeCalendarContext {
  const programmeLengthWeeks = (params.programmeLengthWeeks === 16 ? 16 : 12) as ProgrammeLengthWeeks;
  const today = startOfLocalDay(params.today ?? new Date());
  const programmeStartDate = params.programmeStartDate?.trim() || null;
  const beforeProgrammeStart = programmeStartDate
    ? today < startOfLocalDay(parseYmd(programmeStartDate))
    : false;

  const liveGlobalWeek = programmeStartDate ? deriveLiveGlobalWeek(programmeStartDate, today) : 1;

  const activeWeekBundle = resolveActiveDashboardWeekBundle({
    programmeWeeks: params.programmeWeeks,
    programmeStartDate,
    liveGlobalWeek,
    today,
  });

  const blockWeekInCycle =
    activeWeekBundle?.blockWeekInCycle ?? (((liveGlobalWeek - 1) % 4) + 1);
  const blockNumber =
    activeWeekBundle?.week?.block_number ?? params.currentBlock ?? Math.ceil(liveGlobalWeek / 4);

  return {
    programmeStartDate,
    programmeLengthWeeks,
    liveGlobalWeek,
    blockWeekInCycle,
    blockNumber,
    beforeProgrammeStart,
    activeWeekBundle,
    activeWeekCalendarStatus: activeWeekBundle?.calendarStatus ?? null,
    missingStartDate: !programmeStartDate,
  };
}

export function resolveProgrammeWeeklyFocusLabel(ctx: HyroxProgrammeCalendarContext): string {
  const role = ctx.activeWeekBundle?.weekRole?.trim();
  if (role) return role;
  return `Block ${ctx.blockNumber} · Week ${ctx.blockWeekInCycle}`;
}

export function resolveProgrammeCheckInSummary(ctx: HyroxProgrammeCalendarContext): {
  status: string;
  sub: string;
  due: boolean;
} {
  if (ctx.beforeProgrammeStart || ctx.blockWeekInCycle <= 1) {
    return {
      status: "After Week 1",
      sub: "Weekly check-ins unlock after your first training week",
      due: false,
    };
  }
  return {
    status: `After Week ${ctx.blockWeekInCycle}`,
    sub: "Complete your weekly check-in when the week ends",
    due: false,
  };
}

export function resolveProgrammeRaceReadiness(ctx: HyroxProgrammeCalendarContext): {
  label: string;
  value: string;
  sub: string;
  awaiting: boolean;
} {
  if (ctx.beforeProgrammeStart || ctx.blockWeekInCycle <= 1) {
    return {
      label: "Race readiness",
      value: "Awaiting data",
      sub: "Starts after first training week",
      awaiting: true,
    };
  }
  return {
    label: "Race readiness",
    value: "Awaiting data",
    sub: "Builds from logged sessions and check-ins",
    awaiting: true,
  };
}

function findNextGeneratedWeekFirstSession(
  programmeWeeks: AthleteProgrammeWeekBundle[],
  afterWeekNumber: number
): HyroxSession | null {
  const nextWeek = [...programmeWeeks]
    .filter((b) => b.generated && b.sessions.length > 0 && b.weekNumber > afterWeekNumber)
    .sort((a, b) => a.weekNumber - b.weekNumber)[0];
  if (!nextWeek) return null;
  return pickFirstIncompleteSession(nextWeek.sessions);
}

/**
 * Calendar-aware next session for Hyrox athlete dashboard / programme hub.
 */
export function resolveProgrammeNextSession(params: {
  programmeStartDate: string | null;
  programmeWeeks: AthleteProgrammeWeekBundle[];
  activeWeekBundle: AthleteProgrammeWeekBundle | null;
  beforeProgrammeStart: boolean;
  today?: Date;
}): ProgrammeNextSessionResolution {
  const today = startOfLocalDay(params.today ?? new Date());
  const { programmeStartDate, programmeWeeks, activeWeekBundle, beforeProgrammeStart } = params;

  if (!activeWeekBundle?.sessions?.length) {
    return {
      state: "block_complete",
      session: null,
      message: "Current block complete — awaiting next block from coach",
    };
  }

  const weekNum = activeWeekBundle.weekNumber;
  const sessions = activeWeekBundle.sessions;

  if (beforeProgrammeStart && programmeStartDate) {
    const first = pickFirstIncompleteSession(sessions);
    if (!first) {
      return { state: "week_complete", session: null, message: "Week complete" };
    }
    return {
      state: "upcoming",
      session: sessionToResolved(first, {
        programmeStartYmd: programmeStartDate,
        globalWeekNumber: weekNum,
      }),
      message: null,
    };
  }

  if (!programmeStartDate) {
    const first = pickFirstIncompleteSession(sessions);
    return first
      ? { state: "session", session: sessionToResolved(first), message: null }
      : {
          state: "block_complete",
          session: null,
          message: "Current block complete — awaiting next block from coach",
        };
  }

  const weekStartYmd = resolveWeekStartYmd(activeWeekBundle, programmeStartDate);
  const isLiveWeek =
    activeWeekBundle.calendarStatus === "live" ||
    (weekStartYmd &&
      deriveWeekCalendarStatus(
        weekStartYmd,
        activeWeekBundle.weekEndDate ??
          weekDateRangeFromProgrammeStart(programmeStartDate, weekNum).endYmd,
        today
      ) === "live");

  if (isLiveWeek) {
    const fromToday = (s: HyroxSession) => {
      const sessionDay = startOfLocalDay(
        sessionDateInWeek(programmeStartDate, weekNum, s.day)
      );
      return sessionDay.getTime() >= today.getTime();
    };

    const next = pickFirstIncompleteSession(sessions, fromToday);
    if (next) {
      return {
        state: "session",
        session: sessionToResolved(next, {
          programmeStartYmd: programmeStartDate,
          globalWeekNumber: weekNum,
        }),
        message: null,
      };
    }

    const anyIncomplete = pickFirstIncompleteSession(sessions);
    if (anyIncomplete) {
      return { state: "week_complete", session: null, message: "Week complete" };
    }

    const nextWeekSession = findNextGeneratedWeekFirstSession(programmeWeeks, weekNum);
    if (nextWeekSession) {
      const nextWeek = programmeWeeks.find(
        (b) => b.sessions.some((s) => s.id === nextWeekSession.id)
      );
      return {
        state: "upcoming",
        session: sessionToResolved(
          nextWeekSession,
          programmeStartDate && nextWeek
            ? {
                programmeStartYmd: programmeStartDate,
                globalWeekNumber: nextWeek.weekNumber,
              }
            : undefined
        ),
        message: null,
      };
    }

    return { state: "week_complete", session: null, message: "Week complete" };
  }

  if (activeWeekBundle.calendarStatus === "upcoming" || activeWeekBundle.calendarStatus === "past") {
    const first = pickFirstIncompleteSession(sessions);
    if (first) {
      return {
        state: activeWeekBundle.calendarStatus === "upcoming" ? "upcoming" : "session",
        session: sessionToResolved(first, {
          programmeStartYmd: programmeStartDate,
          globalWeekNumber: weekNum,
        }),
        message: null,
      };
    }
  }

  const fallback = pickFirstIncompleteSession(sessions);
  if (fallback) {
    return {
      state: "session",
      session: sessionToResolved(fallback, {
        programmeStartYmd: programmeStartDate,
        globalWeekNumber: weekNum,
      }),
      message: null,
    };
  }

  const nextWeekSession = findNextGeneratedWeekFirstSession(programmeWeeks, weekNum);
  if (nextWeekSession) {
    const nextWeek = programmeWeeks.find(
      (b) => b.sessions.some((s) => s.id === nextWeekSession.id)
    );
    return {
      state: "upcoming",
      session: sessionToResolved(
        nextWeekSession,
        programmeStartDate && nextWeek
          ? {
              programmeStartYmd: programmeStartDate,
              globalWeekNumber: nextWeek.weekNumber,
            }
          : undefined
      ),
      message: null,
    };
  }

  const maxPublishedWeek = Math.max(
    ...programmeWeeks.filter((b) => b.generated).map((b) => b.weekNumber),
    0
  );
  const liveWeek = deriveLiveGlobalWeek(programmeStartDate, today);
  if (liveWeek > maxPublishedWeek) {
    return {
      state: "block_complete",
      session: null,
      message: "Current block complete — awaiting next block from coach",
    };
  }

  return { state: "week_complete", session: null, message: "Week complete" };
}

export function upcomingSessionsForCalendarWeek(
  sessions: HyroxSession[],
  next: ResolvedNextSession | null,
  limit = 3
): HyroxSession[] {
  const sorted = sortProgrammeSessions(sessions);
  const incomplete = sorted.filter((s) => s.status !== "complete");
  const filtered = next ? incomplete.filter((s) => s.id !== next.sessionId) : incomplete;
  return filtered.slice(0, limit);
}
