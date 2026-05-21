import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";

export type ProgrammeTimeOfDay = "AM" | "Main" | "PM" | "Optional";

const DAY_ORDER: Record<string, number> = {
  Monday: 0,
  Mon: 0,
  Tuesday: 1,
  Tue: 1,
  Wednesday: 2,
  Wed: 2,
  Thursday: 3,
  Thu: 3,
  Friday: 4,
  Fri: 4,
  Saturday: 5,
  Sat: 5,
  Sunday: 6,
  Sun: 6,
};

const DAY_FULL: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

const SLOT_ORDER: Record<ProgrammeTimeOfDay, number> = {
  AM: 0,
  Main: 1,
  PM: 2,
  Optional: 3,
};

export function normalizeProgrammeDay(day: string): string {
  return DAY_FULL[day] ?? day;
}

export function daySortIndex(day: string): number {
  return DAY_ORDER[day] ?? DAY_ORDER[normalizeProgrammeDay(day)] ?? 99;
}

export function slotSortIndex(slot?: ProgrammeTimeOfDay | string): number {
  if (!slot) return 1;
  return SLOT_ORDER[slot as ProgrammeTimeOfDay] ?? 1;
}

export function formatProgrammeDayLabel(day: string, slot?: ProgrammeTimeOfDay | string): string {
  const full = normalizeProgrammeDay(day);
  if (!slot || slot === "Main") return full;
  return `${full} · ${slot}`;
}

export function sortProgrammeSessions(sessions: HyroxSession[]): HyroxSession[] {
  return [...sessions].sort((a, b) => {
    const dayDiff = daySortIndex(a.day) - daySortIndex(b.day);
    if (dayDiff !== 0) return dayDiff;
    return slotSortIndex(a.timeOfDay) - slotSortIndex(b.timeOfDay);
  });
}

function todayDayName(): string {
  return new Date().toLocaleDateString("en-GB", { weekday: "long" });
}

function sessionPriorityRank(session: HyroxSession): number {
  if (session.priority === "Optional" || session.timeOfDay === "Optional") return 2;
  if (session.priority === "Supporting") return 1;
  return 0;
}

export type ResolvedNextSession = {
  sessionId: string;
  name: string;
  day: string;
  dateLabel: string;
  type: HyroxSession["type"];
  duration: string;
  rpeTarget: string;
  objective: string;
  coachNote: string;
  priority: HyroxSession["priority"];
};

/**
 * @deprecated Use `resolveProgrammeNextSession` from `hyroxAthleteProgrammeCalendar` with
 * programme_start_date and programmeWeeks[]. Kept for legacy callers only.
 */
export function resolveNextSession(sessions: HyroxSession[]): ResolvedNextSession | null {
  const sorted = sortProgrammeSessions(sessions);
  const incomplete = sorted.filter((s) => s.status !== "complete");
  if (!incomplete.length) return null;

  const today = todayDayName();

  const pick = (list: HyroxSession[]) => {
    const ordered = [...list].sort((a, b) => {
      const pr = sessionPriorityRank(a) - sessionPriorityRank(b);
      if (pr !== 0) return pr;
      const dayDiff = daySortIndex(a.day) - daySortIndex(b.day);
      if (dayDiff !== 0) return dayDiff;
      return slotSortIndex(a.timeOfDay) - slotSortIndex(b.timeOfDay);
    });
    const s = ordered[0];
    if (!s) return null;
    return {
      sessionId: s.id,
      name: s.name,
      day: normalizeProgrammeDay(s.day),
      dateLabel: formatProgrammeDayLabel(s.day, s.timeOfDay),
      type: s.type,
      duration: s.duration,
      rpeTarget: s.rpeTarget,
      objective: s.intent,
      coachNote: s.coachNote ?? "",
      priority: s.priority,
    };
  };

  const todaySessions = incomplete.filter((s) => normalizeProgrammeDay(s.day) === today);
  const fromToday = pick(todaySessions);
  if (fromToday) return fromToday;

  const todayIdx = daySortIndex(today);
  const laterThisWeek = incomplete.filter((s) => daySortIndex(s.day) > todayIdx);
  const fromLater = pick(laterThisWeek);
  if (fromLater) return fromLater;

  return pick(incomplete);
}

export function upcomingSessionsAfterNext(
  sessions: HyroxSession[],
  next: ResolvedNextSession | null,
  limit = 3
): HyroxSession[] {
  const sorted = sortProgrammeSessions(sessions);
  const incomplete = sorted.filter((s) => s.status !== "complete");
  const filtered = next ? incomplete.filter((s) => s.id !== next.sessionId) : incomplete;
  return filtered.slice(0, limit);
}
