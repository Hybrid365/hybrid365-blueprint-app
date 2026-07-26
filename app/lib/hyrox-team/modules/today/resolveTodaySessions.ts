/**
 * Resolve today's programme sessions for the HYROX Team Today experience.
 * Preserves individual session IDs — never merges logs.
 */

import { toYmd, startOfLocalDay } from "@/app/lib/hyroxProgrammeDates";
import { sessionDateYmdFromProgrammeStart } from "@/app/lib/hyroxAthleteProgrammeSort";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";

const SLOT_ORDER: Record<string, number> = {
  AM: 0,
  Main: 1,
  PM: 2,
  Optional: 3,
};

export function localDateYmd(today: Date = new Date()): string {
  return toYmd(startOfLocalDay(today));
}

export function resolveTodaysSessions(params: {
  programmeStartDate: string | null | undefined;
  globalWeekNumber: number;
  sessions: HyroxSession[];
  today?: Date;
  /** When set, used instead of browser-local calendar day (admin preview TZ). */
  todayYmd?: string;
}): HyroxSession[] {
  const { programmeStartDate, globalWeekNumber, sessions } = params;
  if (!programmeStartDate || !sessions.length) return [];

  const todayYmd = params.todayYmd?.trim() || localDateYmd(params.today ?? new Date());
  const todays = sessions.filter((s) => {
    const ymd = sessionDateYmdFromProgrammeStart(
      programmeStartDate,
      globalWeekNumber,
      s.day
    );
    return ymd === todayYmd;
  });

  return [...todays].sort((a, b) => {
    const sa = SLOT_ORDER[a.timeOfDay ?? "Main"] ?? 1;
    const sb = SLOT_ORDER[b.timeOfDay ?? "Main"] ?? 1;
    if (sa !== sb) return sa - sb;
    return a.name.localeCompare(b.name);
  });
}

export function resolveNextScheduledSession(params: {
  programmeStartDate: string | null | undefined;
  sessionsByWeek: Array<{ weekNumber: number; sessions: HyroxSession[] }>;
  today?: Date;
  todayYmd?: string;
}): HyroxSession | null {
  const start = params.programmeStartDate;
  if (!start) return null;
  const todayYmd = params.todayYmd?.trim() || localDateYmd(params.today ?? new Date());

  for (const week of params.sessionsByWeek) {
    const dated = week.sessions
      .map((s) => ({
        session: s,
        ymd: sessionDateYmdFromProgrammeStart(start, week.weekNumber, s.day),
      }))
      .filter((x) => x.ymd > todayYmd)
      .sort((a, b) => a.ymd.localeCompare(b.ymd));
    if (dated[0]) return dated[0].session;
  }
  return null;
}

export type SessionCtaState =
  | "start"
  | "continue_logging"
  | "view_result"
  | "session_complete"
  | "log_partial";

export function resolveSessionCtaState(session: HyroxSession): SessionCtaState {
  const hasLog = Boolean(
    session.loggedRpe ||
      session.logNotes ||
      session.logScore ||
      session.logModifications ||
      session.activityMetrics
  );
  const complete = session.status === "complete";
  const missed = session.status === "missed";
  const modified = session.status === "modified";

  if (complete && hasLog) return "view_result";
  if (complete) return "session_complete";
  if (missed || modified) return hasLog ? "continue_logging" : "log_partial";
  if (hasLog) return "continue_logging";
  return "start";
}

export function sessionCtaLabel(state: SessionCtaState): string {
  switch (state) {
    case "continue_logging":
      return "Continue logging";
    case "view_result":
      return "View result";
    case "session_complete":
      return "Session complete";
    case "log_partial":
      return "Log partial session";
    default:
      return "Start session";
  }
}

export function hasPainTightnessFlag(session: HyroxSession): boolean {
  const metrics = session.activityMetrics as { painOrTightness?: string | null } | null | undefined;
  const pain = metrics?.painOrTightness?.trim();
  return Boolean(pain);
}

export function isMobilityOrRecoverySession(session: HyroxSession): boolean {
  const blob = `${session.type} ${session.name} ${session.focus}`.toLowerCase();
  return /recovery|mobility|rest day|easy aerobic/.test(blob) || session.type === "Recovery";
}
