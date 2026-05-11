/**
 * Pure helpers for /dashboard/progress — no Supabase, no React.
 */

import {
  STRENGTH_BENCHMARK_TEST_TYPES,
  isStrengthBenchmarkType,
} from "./benchmarkCoreAreas";
import {
  buildSessionKey,
  extractScheduleFromPlanJson,
  normalizeMemberSchedule,
} from "./memberDashboardSchedule";
import { parseTimeToSeconds } from "./mapAssessmentToProgrammeInput";

export type ProgrammeWeekLike = {
  week_number: number;
  is_unlocked: boolean | null;
  plan_json: unknown | null;
};

export function buildTwelveProgrammeWeeks(weeksFromDb: ProgrammeWeekLike[]): ProgrammeWeekLike[] {
  const map = new Map(weeksFromDb.map((w) => [w.week_number, w]));
  return Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    return map.get(n) ?? { week_number: n, is_unlocked: false, plan_json: null };
  });
}

export type SessionLogLike = {
  week_number: number;
  session_key: string;
  completed: boolean;
  rpe: number | null;
};

export type WeeklyCheckInLike = {
  week_number: number;
  bodyweight_kg: number | null;
  sleep_hours: number | null;
  energy_score: number | null;
  recovery_score: number | null;
  stress_score: number | null;
  motivation_score: number | null;
  submitted_at: string | null;
};

export type BenchmarkTestLike = {
  id: string;
  test_type: string | null;
  test_time: string | null;
  test_value: number | null;
  test_unit: string | null;
  tested_at: string | null;
};

/** Types we surface on /dashboard/progress (latest vs baseline + change). */
export const TRACKED_DASHBOARD_BENCHMARK_TYPES = [
  "5km time trial",
  "3km time trial",
  "1km SkiErg",
  "1km Row",
  "Bodyweight",
  ...STRENGTH_BENCHMARK_TEST_TYPES,
  "Wall ball test",
  "Hyrox race",
  "Challenge workout",
  "Other",
] as const;

export type TrackedDashboardBenchmarkType = (typeof TRACKED_DASHBOARD_BENCHMARK_TYPES)[number];

/** Scheduled main sessions (one row in plan_json.schedule = one loggable slot). */
export function countScheduledSlotsForWeek(planJson: unknown): number {
  const raw = extractScheduleFromPlanJson(planJson);
  return raw?.length ?? 0;
}

export function getAvailableProgrammeSessions(weeks: ProgrammeWeekLike[]): {
  totalSlots: number;
  slotsByWeek: Record<number, number>;
} {
  const slotsByWeek: Record<number, number> = {};
  let totalSlots = 0;
  for (const w of weeks) {
    if (!w.is_unlocked) continue;
    const n = countScheduledSlotsForWeek(w.plan_json);
    slotsByWeek[w.week_number] = n;
    totalSlots += n;
  }
  return { totalSlots, slotsByWeek };
}

function expectedSessionKeysForWeek(week: ProgrammeWeekLike): string[] {
  if (!week.is_unlocked) return [];
  const raw = extractScheduleFromPlanJson(week.plan_json);
  if (!raw?.length) return [];
  const normalized = normalizeMemberSchedule(raw);
  return normalized.map((session, index) =>
    buildSessionKey({
      weekNumber: week.week_number,
      day: session.day,
      index,
      title: session.title,
    })
  );
}

export function calculateSessionAdherence(
  logs: SessionLogLike[],
  weeks: ProgrammeWeekLike[],
  currentWeek: number
): {
  completedUnlocked: number;
  totalUnlockedSlots: number;
  unlockedPercentage: number;
  currentWeekCompleted: number;
  currentWeekTotal: number;
  currentWeekPercentage: number;
  completedByWeek: Record<number, { completed: number; total: number }>;
} {
  const logMap = new Map<string, SessionLogLike>();
  for (const log of logs) {
    logMap.set(`${log.week_number}::${log.session_key}`, log);
  }

  let completedUnlocked = 0;
  let totalUnlockedSlots = 0;
  const completedByWeek: Record<number, { completed: number; total: number }> = {};

  const cw = Math.min(12, Math.max(1, Math.floor(currentWeek)));
  let currentWeekCompleted = 0;
  let currentWeekTotal = 0;

  for (const w of weeks) {
    if (!w.is_unlocked) continue;
    const keys = expectedSessionKeysForWeek(w);
    const total = keys.length;
    let done = 0;
    for (const key of keys) {
      const hit = logMap.get(`${w.week_number}::${key}`);
      if (hit?.completed) done += 1;
    }
    completedByWeek[w.week_number] = { completed: done, total };
    completedUnlocked += done;
    totalUnlockedSlots += total;
    if (w.week_number === cw) {
      currentWeekCompleted = done;
      currentWeekTotal = total;
    }
  }

  const unlockedPercentage =
    totalUnlockedSlots > 0 ? Math.round((100 * completedUnlocked) / totalUnlockedSlots) : 0;
  const currentWeekPercentage =
    currentWeekTotal > 0 ? Math.round((100 * currentWeekCompleted) / currentWeekTotal) : 0;

  return {
    completedUnlocked,
    totalUnlockedSlots,
    unlockedPercentage,
    currentWeekCompleted,
    currentWeekTotal,
    currentWeekPercentage,
    completedByWeek,
  };
}

/** Priority 1 (key) sessions completed among unlocked weeks — optional insight. */
export function calculateKeySessionCompletion(
  logs: SessionLogLike[],
  weeks: ProgrammeWeekLike[]
): { completed: number; total: number; percentage: number } {
  const logMap = new Map<string, SessionLogLike>();
  for (const log of logs) {
    logMap.set(`${log.week_number}::${log.session_key}`, log);
  }
  let total = 0;
  let done = 0;
  for (const w of weeks) {
    if (!w.is_unlocked) continue;
    const raw = extractScheduleFromPlanJson(w.plan_json);
    if (!raw?.length) continue;
    const normalized = normalizeMemberSchedule(raw);
    normalized.forEach((session, index) => {
      if (session.priorityRank !== 1) return;
      total += 1;
      const key = buildSessionKey({
        weekNumber: w.week_number,
        day: session.day,
        index,
        title: session.title,
      });
      if (logMap.get(`${w.week_number}::${key}`)?.completed) done += 1;
    });
  }
  return {
    completed: done,
    total,
    percentage: total > 0 ? Math.round((100 * done) / total) : 0,
  };
}

export function clampWeekNumber(n: number | null | undefined): number {
  if (n == null || Number.isNaN(Number(n))) return 1;
  const v = Math.floor(Number(n));
  if (v < 1) return 1;
  if (v > 12) return 12;
  return v;
}

export function deriveEffectiveCurrentWeek(
  instanceCurrentWeek: number | null | undefined,
  weeks: ProgrammeWeekLike[]
): number {
  const fromInstance = clampWeekNumber(instanceCurrentWeek ?? null);
  const firstUnlocked = weeks.find((w) => w.is_unlocked)?.week_number;
  if (firstUnlocked != null) {
    return clampWeekNumber(instanceCurrentWeek ?? firstUnlocked);
  }
  return fromInstance;
}

export function getLatestCheckIn(checkIns: WeeklyCheckInLike[]): WeeklyCheckInLike | null {
  if (!checkIns.length) return null;
  const sorted = [...checkIns].sort((a, b) => {
    const wa = a.week_number ?? 0;
    const wb = b.week_number ?? 0;
    if (wa !== wb) return wb - wa;
    const ta = a.submitted_at ? Date.parse(a.submitted_at) : 0;
    const tb = b.submitted_at ? Date.parse(b.submitted_at) : 0;
    return tb - ta;
  });
  return sorted[0] ?? null;
}

export type BodyweightTrend = {
  entries: number;
  firstKg: number | null;
  latestKg: number | null;
  deltaKg: number | null;
  series: { week: number; kg: number }[];
};

export function calculateBodyweightTrend(checkIns: WeeklyCheckInLike[]): BodyweightTrend {
  const withBw = checkIns
    .filter((c) => c.bodyweight_kg != null && Number.isFinite(Number(c.bodyweight_kg)))
    .map((c) => ({
      week: c.week_number,
      kg: Number(c.bodyweight_kg),
    }))
    .sort((a, b) => a.week - b.week);

  if (!withBw.length) {
    return { entries: 0, firstKg: null, latestKg: null, deltaKg: null, series: [] };
  }

  const firstKg = withBw[0]!.kg;
  const latestKg = withBw[withBw.length - 1]!.kg;
  return {
    entries: withBw.length,
    firstKg,
    latestKg,
    deltaKg: Math.round((latestKg - firstKg) * 10) / 10,
    series: withBw,
  };
}

export type TrendDir = "up" | "down" | "flat" | "none";

export function scoreTrend(
  values: (number | null | undefined)[],
  /** When higher is better (e.g. energy). For stress, lower is often better — invert. */
  higherIsBetter: boolean
): TrendDir {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (nums.length < 2) return "none";
  const a = nums[nums.length - 2]!;
  const b = nums[nums.length - 1]!;
  if (a === b) return "flat";
  const improved = higherIsBetter ? b > a : b < a;
  const worsened = higherIsBetter ? b < a : b > a;
  if (improved) return "up";
  if (worsened) return "down";
  return "flat";
}

export function calculateAverageRpe(logs: SessionLogLike[]): {
  average: number | null;
  latest: number | null;
  count: number;
} {
  const withRpe = logs.filter((l) => l.rpe != null && Number.isFinite(l.rpe) && l.rpe >= 1 && l.rpe <= 10);
  if (!withRpe.length) return { average: null, latest: null, count: 0 };
  const sum = withRpe.reduce((acc, l) => acc + Number(l.rpe), 0);
  const average = Math.round((sum / withRpe.length) * 10) / 10;
  const sorted = [...withRpe].sort((a, b) => {
    if (a.week_number !== b.week_number) return b.week_number - a.week_number;
    return 0;
  });
  const latest = sorted[0] ? Number(sorted[0].rpe) : null;
  return { average, latest, count: withRpe.length };
}

export type GroupedBenchmark = {
  type: string;
  latestDisplay: string;
  baselineDisplay: string;
  /** Numeric delta for bodyweight; seconds delta for times when parseable; null if not comparable */
  numericChange: number | null;
  changeLabel: string;
  logged: boolean;
  entryCount: number;
};

/** Time-based markers where a lower duration is better (used for trend badges on progress). */
export function isTimeLowerIsBetterBenchmark(type: string): boolean {
  return (
    type === "5km time trial" ||
    type === "3km time trial" ||
    type === "1km SkiErg" ||
    type === "1km Row" ||
    type === "Hyrox race" ||
    type === "Farmer carry 40m" ||
    type === "Challenge workout"
  );
}

function displayBenchmarkValue(row: BenchmarkTestLike, type: string): string {
  if (type === "Bodyweight" && row.test_value != null && Number.isFinite(row.test_value)) {
    const u = row.test_unit?.trim();
    return u ? `${row.test_value} ${u}` : `${row.test_value} kg`;
  }
  if (row.test_time?.trim()) return row.test_time.trim();
  if (row.test_value != null && Number.isFinite(row.test_value)) {
    const u = row.test_unit?.trim();
    return u ? `${row.test_value} ${u}` : String(row.test_value);
  }
  return "—";
}

/** Lower seconds = better for time trials. */
export function compareTimeTrials(baselineSec: number | null, latestSec: number | null): number | null {
  if (baselineSec == null || latestSec == null) return null;
  return baselineSec - latestSec;
}

/** Shown on progress in this order. Always includes run/engine/body slots; other types appear once logged. */
const PROGRESS_BENCHMARK_DISPLAY_ORDER = [
  "5km time trial",
  "3km time trial",
  "1km SkiErg",
  "1km Row",
  "Bodyweight",
  "Wall ball test",
  "Hyrox race",
  "Challenge workout",
  ...STRENGTH_BENCHMARK_TEST_TYPES,
  "Other",
] as const;

export function groupBenchmarkTests(tests: BenchmarkTestLike[]): GroupedBenchmark[] {
  const tracked = new Set<string>(TRACKED_DASHBOARD_BENCHMARK_TYPES as unknown as string[]);
  const byType = new Map<string, BenchmarkTestLike[]>();
  for (const t of tests) {
    const ty = (t.test_type ?? "").trim();
    if (!tracked.has(ty)) continue;
    const list = byType.get(ty) ?? [];
    list.push(t);
    byType.set(ty, list);
  }

  const include = new Set<string>([
    "5km time trial",
    "3km time trial",
    "1km SkiErg",
    "1km Row",
    "Bodyweight",
  ]);
  for (const t of tests) {
    const ty = (t.test_type ?? "").trim();
    if (tracked.has(ty)) include.add(ty);
  }

  const ordered = PROGRESS_BENCHMARK_DISPLAY_ORDER.filter((t) => include.has(t));

  return ordered.map((type) => {
    const rows = (byType.get(type) ?? []).sort((a, b) => {
      const da = a.tested_at ? Date.parse(a.tested_at) : 0;
      const db = b.tested_at ? Date.parse(b.tested_at) : 0;
      return da - db;
    });
    if (!rows.length) {
      return {
        type,
        latestDisplay: "Not logged yet",
        baselineDisplay: "—",
        numericChange: null,
        changeLabel: "—",
        logged: false,
        entryCount: 0,
      };
    }
    const earliest = rows[0]!;
    const latest = rows[rows.length - 1]!;
    const latestDisplay = displayBenchmarkValue(latest, type);
    const baselineDisplay = displayBenchmarkValue(earliest, type);

    let numericChange: number | null = null;
    let changeLabel = "—";

    if (type === "Bodyweight" || isStrengthBenchmarkType(type) || type === "Wall ball test" || type === "Other") {
      const a = earliest.test_value;
      const b = latest.test_value;
      if (a != null && b != null && Number.isFinite(a) && Number.isFinite(b) && rows.length >= 2) {
        numericChange = Math.round((b - a) * 10) / 10;
        const u = latest.test_unit?.trim() || (type === "Bodyweight" ? "kg" : "units");
        changeLabel = `${numericChange >= 0 ? "+" : ""}${numericChange} ${u}`;
      }
    } else if (isTimeLowerIsBetterBenchmark(type)) {
      const a = parseTimeToSeconds(earliest.test_time);
      const b = parseTimeToSeconds(latest.test_time);
      const delta = compareTimeTrials(a, b);
      if (delta != null && rows.length >= 2) {
        numericChange = delta;
        if (delta === 0) changeLabel = "Same time";
        else if (delta > 0) changeLabel = `${delta}s faster`;
        else changeLabel = `${Math.abs(delta)}s slower`;
      } else if (rows.length >= 2) {
        changeLabel = "Log comparable times to track";
      }
    }

    return {
      type,
      latestDisplay,
      baselineDisplay,
      numericChange,
      changeLabel,
      logged: true,
      entryCount: rows.length,
    };
  });
}

/** Strength benchmark rows (for progress empty-state / optional grouping). */
export function strengthBenchmarksLogged(tests: BenchmarkTestLike[]): boolean {
  return tests.some((t) => isStrengthBenchmarkType(t.test_type));
}

export type RecoveryTrendRow = {
  key: "sleep_hours" | "energy_score" | "recovery_score" | "stress_score" | "motivation_score";
  label: string;
  latest: number | null;
  previous: number | null;
  trend: TrendDir;
  higherIsBetter: boolean;
};

export function buildRecoveryTrends(checkIns: WeeklyCheckInLike[]): RecoveryTrendRow[] {
  const sorted = [...checkIns].sort((a, b) => a.week_number - b.week_number);
  const pickLastTwo = (getter: (c: WeeklyCheckInLike) => number | null | undefined) => {
    const vals: number[] = [];
    for (const c of sorted) {
      const v = getter(c);
      if (v != null && Number.isFinite(v)) vals.push(Number(v));
    }
    if (vals.length === 0) return { latest: null as number | null, previous: null as number | null };
    if (vals.length === 1) return { latest: vals[0]!, previous: null as number | null };
    return { latest: vals[vals.length - 1]!, previous: vals[vals.length - 2]! };
  };

  const defs: Omit<RecoveryTrendRow, "latest" | "previous" | "trend">[] = [
    { key: "sleep_hours", label: "Sleep (hours)", higherIsBetter: true },
    { key: "energy_score", label: "Energy", higherIsBetter: true },
    { key: "recovery_score", label: "Recovery", higherIsBetter: true },
    { key: "stress_score", label: "Stress", higherIsBetter: false },
    { key: "motivation_score", label: "Motivation", higherIsBetter: true },
  ];

  return defs.map((d) => {
    const getter = (c: WeeklyCheckInLike) => c[d.key];
    const { latest, previous } = pickLastTwo(getter);
    const series =
      previous == null && latest != null
        ? [latest]
        : previous != null && latest != null
          ? [previous, latest]
          : [];
    const trend = scoreTrend(series, d.higherIsBetter);
    return { ...d, latest, previous, trend };
  });
}
