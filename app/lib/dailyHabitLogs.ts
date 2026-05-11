/**
 * Daily habit tracker — pure helpers for scoring / streaks (Milestone 13B).
 * Safe for future challenge point rules; no scoring wired yet.
 */

export const HABIT_FIELD_KEYS = [
  "water_hit",
  "protein_hit",
  "steps_hit",
  "sleep_hit",
  "mobility_hit",
  "proof_posted",
] as const;

export type HabitFieldKey = (typeof HABIT_FIELD_KEYS)[number];

export const HABIT_TOTAL = HABIT_FIELD_KEYS.length;

export type DailyHabitLogRow = {
  id: string;
  user_id: string;
  programme_instance_id: string | null;
  log_date: string;
  water_hit: boolean;
  protein_hit: boolean;
  steps_hit: boolean;
  sleep_hit: boolean;
  mobility_hit: boolean;
  proof_posted: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyHabitLogUpsertBody = {
  log_date: string;
  programme_instance_id?: string | null;
  water_hit: boolean;
  protein_hit: boolean;
  steps_hit: boolean;
  sleep_hit: boolean;
  mobility_hit: boolean;
  proof_posted: boolean;
  notes?: string | null;
};

export function countHabitsHit(
  log: Partial<Pick<DailyHabitLogRow, HabitFieldKey>> | null | undefined
): number {
  if (!log) return 0;
  return HABIT_FIELD_KEYS.reduce((n, k) => n + (log[k] ? 1 : 0), 0);
}

export function habitScorePercent(done: number): number {
  return Math.round((done / HABIT_TOTAL) * 100);
}

export function coachingNoteForHabits(done: number): string {
  if (done >= HABIT_TOTAL) {
    return "Full house — every pillar checked. That consistency compounds.";
  }
  if (done >= 4) {
    return "Strong day. A few more boxes and you’ve backed the full recovery stack.";
  }
  if (done >= 2) {
    return "Good momentum. Small wins today make next week’s training feel easier.";
  }
  if (done >= 1) {
    return "You’ve started — stack one more habit before bed if you can.";
  }
  return "Tick what’s true today; even one habit protects your training week.";
}

/** YYYY-MM-DD in local calendar for the given Date. */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDateKey(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

function addDaysKey(ymd: string, delta: number): string {
  const x = parseLocalDateKey(ymd);
  x.setDate(x.getDate() + delta);
  return localDateKey(x);
}

/** Shift a local calendar date key by `delta` days (e.g. fetch windows). */
export function shiftLocalDateKey(ymd: string, delta: number): string {
  return addDaysKey(ymd, delta);
}

/**
 * Consecutive local calendar days (ending today) with at least one habit checked.
 * If today has no hits yet, streak is counted from yesterday backwards.
 */
export function habitStreakFromLogs(logs: Pick<DailyHabitLogRow, "log_date" | HabitFieldKey>[], todayYmd: string): number {
  const byDate = new Map<string, number>();
  for (const row of logs) {
    byDate.set(row.log_date, countHabitsHit(row));
  }

  let cursor = todayYmd;
  const todayHits = byDate.get(todayYmd) ?? 0;
  if (todayHits < 1) {
    cursor = addDaysKey(todayYmd, -1);
  }

  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const n = byDate.get(cursor);
    if (n == null || n < 1) break;
    streak++;
    cursor = addDaysKey(cursor, -1);
  }
  return streak;
}

export function emptyHabitPayload(
  logDate: string,
  programmeInstanceId: string | null
): DailyHabitLogUpsertBody {
  return {
    log_date: logDate,
    programme_instance_id: programmeInstanceId,
    water_hit: false,
    protein_hit: false,
    steps_hit: false,
    sleep_hit: false,
    mobility_hit: false,
    proof_posted: false,
    notes: null,
  };
}
