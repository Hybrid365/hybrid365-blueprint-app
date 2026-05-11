/**
 * Pure helpers for /dashboard/programme (12-week journey view).
 */

import {
  buildSessionKey,
  extractPlanInsights,
  extractScheduleFromPlanJson,
  normalizeMemberSchedule,
} from "./memberDashboardSchedule";
import { buildTwelveProgrammeWeeks, clampWeekNumber, type ProgrammeWeekLike } from "./progressMetrics";

export type { ProgrammeWeekLike };
export { buildTwelveProgrammeWeeks, clampWeekNumber };

export const PROGRAMME_BLOCKS = [
  { id: 1 as const, title: "Foundation / Base", subtitle: "Build the Base", weeks: [1, 2, 3, 4] as const },
  { id: 2 as const, title: "Engine / Build", subtitle: "Build the Engine", weeks: [5, 6, 7, 8] as const },
  { id: 3 as const, title: "Performance / Peak", subtitle: "Build Performance", weeks: [9, 10, 11, 12] as const },
];

function humanizeSnake(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getUnlockedWeekNumbers(weeks: ProgrammeWeekLike[]): number[] {
  return weeks.filter((w) => w.is_unlocked).map((w) => w.week_number);
}

/** Prefer current_week when that week is unlocked; else first unlocked; else 1. */
export function getDefaultSelectedWeek(
  instanceCurrentWeek: number | null | undefined,
  weeks: ProgrammeWeekLike[]
): number {
  const cw = clampWeekNumber(instanceCurrentWeek ?? null);
  const unlocked = new Set(getUnlockedWeekNumbers(weeks));
  if (unlocked.has(cw)) return cw;
  const sorted = [...unlocked].sort((a, b) => a - b);
  if (sorted.length > 0) return sorted[0]!;
  return 1;
}

export function getSelectedProgrammeWeek(
  weeks: ProgrammeWeekLike[],
  weekNumber: number
): ProgrammeWeekLike | null {
  const w = weeks.find((x) => x.week_number === weekNumber);
  return w ?? null;
}

export type WeekOverviewFromPlan = {
  weekFocus: string | null;
  weeklyLoadDisplay: string | null;
  hardSessions: number | null;
  estimatedHours: number | null;
  blockFocusLabel: string | null;
  safetyLevel: string | null;
  safetyNotes: string[];
};

export function extractWeekOverviewFromPlan(planJson: unknown): WeekOverviewFromPlan {
  const base = extractPlanInsights(planJson);
  let hardSessions: number | null = null;
  let estimatedHours: number | null = null;
  let blockFocusLabel: string | null = null;
  let safetyLevel: string | null = null;
  const safetyNotes: string[] = [];

  if (planJson && typeof planJson === "object") {
    const o = planJson as Record<string, unknown>;
    const ws = o.weekly_stress;
    if (ws && typeof ws === "object") {
      const m = ws as Record<string, unknown>;
      if (typeof m.hard_sessions === "number") hardSessions = m.hard_sessions;
      if (typeof m.estimated_hours === "number") estimatedHours = m.estimated_hours;
    }
    const wc = o.week_context;
    if (wc && typeof wc === "object") {
      const bf = (wc as Record<string, unknown>).block_focus;
      if (typeof bf === "string" && bf.trim()) blockFocusLabel = humanizeSnake(bf.trim());
    }
    const sf = o.safety_flags;
    if (sf && typeof sf === "object") {
      const m = sf as Record<string, unknown>;
      if (typeof m.level === "string") safetyLevel = m.level;
      if (Array.isArray(m.notes)) safetyNotes.push(...m.notes.map(String));
    }
  }

  return {
    weekFocus: base.weekFocus,
    weeklyLoadDisplay: base.weeklyLoadDisplay,
    hardSessions,
    estimatedHours,
    blockFocusLabel,
    safetyLevel,
    safetyNotes,
  };
}

export type SessionWithKey = ReturnType<typeof normalizeProgrammeScheduleForWeek>[number];

/** Only call for unlocked weeks with a schedule (caller gates). */
export function normalizeProgrammeScheduleForWeek(weekNumber: number, planJson: unknown) {
  const raw = extractScheduleFromPlanJson(planJson);
  if (!raw?.length) return [];
  const normalized = normalizeMemberSchedule(raw);
  return normalized.map((session, index) => ({
    ...session,
    weekNumber,
    scheduleIndex: index,
    sessionKey: buildSessionKey({
      weekNumber,
      day: session.day,
      index,
      title: session.title,
    }),
  }));
}
