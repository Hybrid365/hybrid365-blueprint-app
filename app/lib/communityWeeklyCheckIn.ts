/**
 * Paid community weekly check-in types and analytics (not Hyrox / Hybrid 75).
 */

import type { DailyHabitLogRow } from "@/app/lib/dailyHabitLogs";
import { countHabitsHit, HABIT_TOTAL, habitScorePercent, localDateKey } from "@/app/lib/dailyHabitLogs";
import type { RecoveryTrendRow, TrendDir } from "@/app/lib/progressMetrics";
import { buildRecoveryTrends } from "@/app/lib/progressMetrics";

export type CommunityWeeklyCheckInRecord = {
  id: string;
  week_number: number;
  bodyweight_kg: number | null;
  sleep_hours: number | null;
  energy_score: number | null;
  recovery_score: number | null;
  stress_score: number | null;
  motivation_score: number | null;
  adherence_score: number | null;
  biggest_win: string | null;
  biggest_struggle: string | null;
  pain_or_injury: string | null;
  notes: string | null;
  submitted_at: string | null;
  hyrox_checkin_details?: unknown;
};

export type ScoreTrendCard = {
  key: string;
  label: string;
  value: string;
  sub?: string;
  trend: TrendDir;
  trendLabel: string;
  /** 0–10 for bar display */
  score: number | null;
  maxScore: number;
};

export type HabitTrendRow = {
  key: "hydration" | "nutrition" | "mobility" | "overall";
  label: string;
  pct: number;
  sub: string;
};

export type SessionWeekSnapshot = {
  week: number;
  completed: number;
  total: number;
  pct: number;
};

function trendLabel(trend: TrendDir, higherIsBetter: boolean): string {
  if (trend === "none") return "First entry";
  if (trend === "flat") return "Same as last week";
  if (trend === "up") return higherIsBetter ? "Up vs last week" : "Up vs last week";
  return higherIsBetter ? "Down vs last week" : "Down vs last week";
}

function compareScores(
  current: number | null,
  previous: number | null,
  higherIsBetter: boolean
): TrendDir {
  if (current == null) return "none";
  if (previous == null) return "none";
  const delta = current - previous;
  if (Math.abs(delta) < 0.05) return "flat";
  if (higherIsBetter) return delta > 0 ? "up" : "down";
  return delta < 0 ? "up" : "down";
}

export function getCheckInForWeek(
  checkIns: readonly CommunityWeeklyCheckInRecord[],
  week: number
): CommunityWeeklyCheckInRecord | null {
  return checkIns.find((c) => c.week_number === week) ?? null;
}

export function getPreviousCheckIn(
  checkIns: readonly CommunityWeeklyCheckInRecord[],
  week: number
): CommunityWeeklyCheckInRecord | null {
  const sorted = [...checkIns]
    .filter((c) => c.week_number < week)
    .sort((a, b) => b.week_number - a.week_number);
  return sorted[0] ?? null;
}

export function buildCheckInScoreCards(
  current: CommunityWeeklyCheckInRecord | null,
  previous: CommunityWeeklyCheckInRecord | null
): ScoreTrendCard[] {
  const defs: {
    key: keyof CommunityWeeklyCheckInRecord;
    label: string;
    higherIsBetter: boolean;
    maxScore: number;
    format: (v: number) => string;
  }[] = [
    { key: "energy_score", label: "Energy", higherIsBetter: true, maxScore: 10, format: (v) => `${v}/10` },
    { key: "motivation_score", label: "Motivation", higherIsBetter: true, maxScore: 10, format: (v) => `${v}/10` },
    { key: "recovery_score", label: "Recovery", higherIsBetter: true, maxScore: 10, format: (v) => `${v}/10` },
    { key: "stress_score", label: "Fatigue / stress", higherIsBetter: false, maxScore: 10, format: (v) => `${v}/10` },
    { key: "sleep_hours", label: "Sleep", higherIsBetter: true, maxScore: 10, format: (v) => `${v}h` },
  ];

  return defs.map((d) => {
    const cur = current?.[d.key];
    const prev = previous?.[d.key];
    const curNum = typeof cur === "number" && Number.isFinite(cur) ? cur : null;
    const prevNum = typeof prev === "number" && Number.isFinite(prev) ? prev : null;
    const trend = compareScores(curNum, prevNum, d.higherIsBetter);
    return {
      key: d.key,
      label: d.label,
      value: curNum != null ? d.format(curNum) : "—",
      sub: prevNum != null ? `Last week: ${d.format(prevNum)}` : undefined,
      trend,
      trendLabel: trendLabel(trend, d.higherIsBetter),
      score: curNum,
      maxScore: d.maxScore,
    };
  });
}

export function computeConsistencyScore(
  checkIn: CommunityWeeklyCheckInRecord | null,
  sessionPct: number | null
): number | null {
  if (!checkIn) return null;
  const parts: number[] = [];
  for (const key of ["energy_score", "recovery_score", "motivation_score"] as const) {
    const v = checkIn[key];
    if (v != null && Number.isFinite(v)) parts.push((v / 10) * 100);
  }
  if (checkIn.adherence_score != null && Number.isFinite(checkIn.adherence_score)) {
    parts.push(Math.min(100, Math.max(0, checkIn.adherence_score)));
  }
  if (sessionPct != null) parts.push(sessionPct);
  if (!parts.length) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

export function buildCheckInCoachInsight(input: {
  checkIn: CommunityWeeklyCheckInRecord | null;
  sessionsCompleted: number;
  sessionsTotal: number;
  habitWeekPct: number | null;
}): string {
  const { checkIn, sessionsCompleted, sessionsTotal, habitWeekPct } = input;
  if (!checkIn) {
    return "Submit your check-in to capture how the week felt — it helps you and your coach spot patterns early.";
  }

  const recovery = checkIn.recovery_score ?? 0;
  const energy = checkIn.energy_score ?? 0;
  const motivation = checkIn.motivation_score ?? 0;
  const stress = checkIn.stress_score ?? 5;
  const sorenessNote = (checkIn.pain_or_injury ?? "").trim().length > 0;
  const completionPct =
    sessionsTotal > 0 ? Math.round((sessionsCompleted / sessionsTotal) * 100) : null;

  if (recovery <= 4 && (stress >= 7 || sorenessNote)) {
    return "Consider prioritising recovery and keeping easy sessions easy. Back off intensity until soreness and stress settle.";
  }
  if (energy >= 7 && motivation >= 7 && completionPct != null && completionPct >= 70) {
    return "Strong week — keep building consistency. Repeat what worked: sleep, fuel and showing up for key sessions.";
  }
  if (motivation <= 4) {
    return "Focus on completing the next session, not the whole week. One honest session often resets momentum.";
  }
  if (habitWeekPct != null && habitWeekPct < 50) {
    return "Training habits were light this week. Stack hydration, sleep and mobility — they protect the sessions that matter.";
  }
  if (completionPct != null && completionPct < 50 && sessionsTotal > 0) {
    return "Sessions were partial this week. Prioritise the highest-value runs and strength work in your plan before adding extras.";
  }
  return "Solid check-in. Use your scores to guide effort next week — protect recovery on hard days and push when energy is high.";
}

/** Habit pillar consistency over the last 7 calendar days. */
export function buildRecentHabitTrends(habitLogs: readonly DailyHabitLogRow[]): HabitTrendRow[] {
  const today = localDateKey(new Date());
  const from = new Date();
  from.setDate(from.getDate() - 6);
  const fromYmd = localDateKey(from);
  const inWindow = habitLogs.filter((l) => l.log_date >= fromYmd && l.log_date <= today);
  const days = inWindow.length || 1;

  const pctFor = (getter: (l: DailyHabitLogRow) => boolean) =>
    Math.round((inWindow.filter(getter).length / days) * 100);

  const overall =
    inWindow.length > 0
      ? Math.round(
          inWindow.reduce((sum, l) => sum + habitScorePercent(countHabitsHit(l)), 0) / inWindow.length
        )
      : 0;

  return [
    {
      key: "hydration",
      label: "Hydration",
      pct: pctFor((l) => l.water_hit),
      sub: "Last 7 days",
    },
    {
      key: "nutrition",
      label: "Nutrition",
      pct: pctFor((l) => l.protein_hit),
      sub: "Last 7 days",
    },
    {
      key: "mobility",
      label: "Mobility / recovery",
      pct: pctFor((l) => l.mobility_hit || l.sleep_hit),
      sub: "Sleep or mobility",
    },
    {
      key: "overall",
      label: "Overall habit score",
      pct: overall,
      sub: inWindow.length ? `${inWindow.length} days logged` : "Log habits daily",
    },
  ];
}

export function buildSessionTrendByWeek(
  completedByWeek: Record<number, { completed: number; total: number }>
): SessionWeekSnapshot[] {
  return Array.from({ length: 12 }, (_, i) => {
    const week = i + 1;
    const stats = completedByWeek[week];
    const completed = stats?.completed ?? 0;
    const total = stats?.total ?? 0;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { week, completed, total, pct };
  }).filter((w) => w.total > 0 || w.completed > 0);
}

export function buildCheckInAnalytics(
  checkIns: readonly CommunityWeeklyCheckInRecord[],
  selectedWeek: number,
  completedByWeek: Record<number, { completed: number; total: number }>,
  habitLogs: readonly DailyHabitLogRow[]
) {
  const current = getCheckInForWeek(checkIns, selectedWeek);
  const previous = getPreviousCheckIn(checkIns, selectedWeek);
  const weekStats = completedByWeek[selectedWeek];
  const sessionsCompleted = weekStats?.completed ?? 0;
  const sessionsTotal = weekStats?.total ?? 0;
  const sessionPct =
    sessionsTotal > 0 ? Math.round((sessionsCompleted / sessionsTotal) * 100) : null;
  const habitTrends = buildRecentHabitTrends(habitLogs);
  const habitWeekPct = habitTrends.find((h) => h.key === "overall")?.pct ?? null;

  return {
    current,
    previous,
    submitted: Boolean(current?.submitted_at),
    scoreCards: buildCheckInScoreCards(current, previous),
    recoveryTrends: buildRecoveryTrends([...checkIns]),
    sessionTrends: buildSessionTrendByWeek(completedByWeek),
    habitTrends,
    consistencyScore: computeConsistencyScore(current, sessionPct),
    coachInsight: buildCheckInCoachInsight({
      checkIn: current,
      sessionsCompleted,
      sessionsTotal,
      habitWeekPct,
    }),
    sessionsCompleted,
    sessionsTotal,
    sessionPct,
  };
}

export type { RecoveryTrendRow };
