export type Hybrid75HabitKey =
  | "hydrate"
  | "eat_clean"
  | "proof"
  | "mobility"
  | "sleep"
  | "steps";

export type Hybrid75HabitDefinition = {
  key: Hybrid75HabitKey;
  label: string;
  optional?: boolean;
};

export const HYBRID75_CORE_HABITS: Hybrid75HabitDefinition[] = [
  { key: "hydrate", label: "Hydrate 3–4L" },
  { key: "eat_clean", label: "Eat clean" },
  { key: "proof", label: "Post proof / accountability" },
  { key: "mobility", label: "Mobility / recovery" },
];

export const HYBRID75_OPTIONAL_HABITS: Hybrid75HabitDefinition[] = [
  { key: "sleep", label: "Sleep 7+ hours", optional: true },
  { key: "steps", label: "Steps / daily movement", optional: true },
];

export const HYBRID75_ALL_HABITS: Hybrid75HabitDefinition[] = [
  ...HYBRID75_CORE_HABITS,
  ...HYBRID75_OPTIONAL_HABITS,
];

export const HYBRID75_HABIT_KEYS = HYBRID75_ALL_HABITS.map((h) => h.key);

export type Hybrid75HabitLog = {
  id: string;
  plan_id: string;
  email: string | null;
  name: string | null;
  habit_key: string;
  habit_label: string;
  log_date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type Hybrid75HabitUpsertPayload = {
  plan_id: string;
  habit_key: Hybrid75HabitKey;
  completed: boolean;
  email?: string;
  name?: string;
};

export type Hybrid75HabitDayState = {
  key: Hybrid75HabitKey;
  label: string;
  optional?: boolean;
  completed: boolean;
};

export type Hybrid75HabitWeekDay = {
  date: string;
  label: string;
  completedCount: number;
  totalCount: number;
  completed: boolean;
};

export type Hybrid75HabitTrendRow = {
  key: Hybrid75HabitKey;
  label: string;
  completedDays: number;
  targetDays: number;
  weekDays: boolean[];
};

export type Hybrid75HabitSummary = {
  today: string;
  weekStart: string;
  weekEnd: string;
  todayHabits: Hybrid75HabitDayState[];
  weeklyTrends: Hybrid75HabitTrendRow[];
  weekDays: Hybrid75HabitWeekDay[];
  overallCompletionPct: number;
  currentStreak: number;
};

export function getHabitDefinition(key: string): Hybrid75HabitDefinition | undefined {
  return HYBRID75_ALL_HABITS.find((h) => h.key === key);
}

/** Local calendar date as YYYY-MM-DD (server uses UTC date for consistency). */
export function formatLogDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Monday-start week containing the given date. */
export function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function getWeekEndDate(weekStart: string): string {
  const d = new Date(`${weekStart}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}

export function getWeekDateRange(weekStart: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function dayLabelForDate(dateStr: string, weekStart: string): string {
  const dates = getWeekDateRange(weekStart);
  const idx = dates.indexOf(dateStr);
  return idx >= 0 ? DAY_LABELS[idx] : dateStr.slice(5);
}

function isCoreHabitCompleted(
  logs: Hybrid75HabitLog[],
  planId: string,
  habitKey: Hybrid75HabitKey,
  date: string
): boolean {
  return logs.some(
    (log) =>
      log.plan_id === planId &&
      log.habit_key === habitKey &&
      log.log_date === date &&
      log.completed
  );
}

export function buildHabitSummary(
  logs: Hybrid75HabitLog[],
  planId: string,
  referenceDate: Date = new Date()
): Hybrid75HabitSummary {
  const today = formatLogDate(referenceDate);
  const weekStart = getWeekStartDate(referenceDate);
  const weekEnd = getWeekEndDate(weekStart);
  const weekDates = getWeekDateRange(weekStart);

  const todayHabits: Hybrid75HabitDayState[] = HYBRID75_ALL_HABITS.map((habit) => ({
    key: habit.key,
    label: habit.label,
    optional: habit.optional,
    completed: isCoreHabitCompleted(logs, planId, habit.key, today),
  }));

  const weeklyTrends: Hybrid75HabitTrendRow[] = HYBRID75_CORE_HABITS.map((habit) => {
    const weekDays = weekDates.map((date) =>
      isCoreHabitCompleted(logs, planId, habit.key, date)
    );
    return {
      key: habit.key,
      label: habit.label,
      completedDays: weekDays.filter(Boolean).length,
      targetDays: 7,
      weekDays,
    };
  });

  const weekDays: Hybrid75HabitWeekDay[] = weekDates.map((date) => {
    const coreCompleted = HYBRID75_CORE_HABITS.filter((h) =>
      isCoreHabitCompleted(logs, planId, h.key, date)
    ).length;
    return {
      date,
      label: dayLabelForDate(date, weekStart),
      completedCount: coreCompleted,
      totalCount: HYBRID75_CORE_HABITS.length,
      completed: coreCompleted === HYBRID75_CORE_HABITS.length,
    };
  });

  const totalSlots = HYBRID75_CORE_HABITS.length * weekDates.length;
  const completedSlots = weeklyTrends.reduce((sum, row) => sum + row.completedDays, 0);
  const overallCompletionPct =
    totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;

  let currentStreak = 0;
  for (let i = weekDates.length - 1; i >= 0; i--) {
    const date = weekDates[i];
    if (date > today) continue;
    const allCore = HYBRID75_CORE_HABITS.every((h) =>
      isCoreHabitCompleted(logs, planId, h.key, date)
    );
    if (allCore) {
      currentStreak += 1;
    } else if (date < today) {
      break;
    } else if (date === today) {
      break;
    }
  }

  return {
    today,
    weekStart,
    weekEnd,
    todayHabits,
    weeklyTrends,
    weekDays,
    overallCompletionPct,
    currentStreak,
  };
}

export function buildHabitUpsertRow(payload: Hybrid75HabitUpsertPayload, logDate: string) {
  const definition = getHabitDefinition(payload.habit_key);
  if (!definition) throw new Error("Invalid habit_key");

  return {
    plan_id: payload.plan_id.trim(),
    email: payload.email?.trim() || null,
    name: payload.name?.trim() || null,
    habit_key: payload.habit_key,
    habit_label: definition.label,
    log_date: logDate,
    completed: payload.completed,
  };
}
