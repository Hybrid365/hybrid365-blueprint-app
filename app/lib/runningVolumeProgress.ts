import { normalizeProgrammeDay } from "@/app/lib/hyroxAthleteProgrammeSort";

export type RunningVolumeView = "week" | "4weeks" | "12weeks";

export const RUNNING_VOLUME_LOG_SELECT =
  "id, user_id, programme_instance_id, week_number, session_day, session_title, session_status, completed, distance_km, average_pace, average_hr, completed_at, created_at, updated_at";

export type RunningVolumeLog = {
  id?: string;
  user_id?: string;
  programme_instance_id?: string | null;
  week_number: number;
  session_day: string | null;
  session_title?: string | null;
  session_status?: string | null;
  completed?: boolean;
  distance_km?: number | null;
  average_pace?: string | null;
  average_hr?: number | null;
  completed_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type RunningVolumeBar = {
  label: string;
  km: number;
};

export type RunningVolumeProgress = {
  activeView: RunningVolumeView;
  totalKm: number;
  runsLogged: number;
  longestRunKm: number;
  averageWeeklyKm?: number;
  highestWeekKm?: number;
  averagePace?: string;
  dailyKm?: RunningVolumeBar[];
  weeklyKm?: RunningVolumeBar[];
  /** True when the active tab has at least one countable log in its date window. */
  hasData: boolean;
  /** Monday–Sunday range label for the current calendar week tab. */
  calendarWeekLabel?: string;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function roundKm(n: number): number {
  return Math.round(n * 10) / 10;
}

function parseDistanceKm(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function isTruthyCompleted(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function isCountableRunningVolumeLog(log: RunningVolumeLog): boolean {
  const dist = parseDistanceKm(log.distance_km);
  if (dist == null) return false;

  const status =
    typeof log.session_status === "string" ? log.session_status.toLowerCase() : log.session_status;
  if (status === "skipped" || status === "moved") return false;
  if (status === "completed" || status === "partial") return true;
  if (!status && isTruthyCompleted(log.completed)) return true;
  return false;
}

function startOfMondayWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const js = d.getDay();
  const offset = js === 0 ? -6 : 1 - js;
  d.setDate(d.getDate() + offset);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Log timestamp: completed_at → updated_at → created_at */
export function logActivityDate(log: RunningVolumeLog): Date | null {
  for (const raw of [log.completed_at, log.updated_at, log.created_at]) {
    if (!raw) continue;
    const t = Date.parse(raw);
    if (Number.isFinite(t)) return new Date(t);
  }
  return null;
}

function logActivityMs(log: RunningVolumeLog): number | null {
  const d = logActivityDate(log);
  return d ? d.getTime() : null;
}

function isInHalfOpenWindow(ms: number, start: Date, endExclusive: Date): boolean {
  return ms >= start.getTime() && ms < endExclusive.getTime();
}

function mondayIndexFromDate(d: Date): number {
  const js = d.getDay();
  return js === 0 ? 6 : js - 1;
}

const SESSION_DAY_INDEX: Record<string, number> = {
  mon: 0,
  monday: 0,
  tue: 1,
  tuesday: 1,
  wed: 2,
  wednesday: 2,
  thu: 3,
  thursday: 3,
  fri: 4,
  friday: 4,
  sat: 5,
  saturday: 5,
  sun: 6,
  sunday: 6,
};

/** Map session_day to Mon=0 … Sun=6, or null when unrecognised. */
export function getSessionDayIndex(sessionDay: string | null | undefined): number | null {
  if (!sessionDay?.trim()) return null;
  const trimmed = sessionDay.trim().toLowerCase();
  if (SESSION_DAY_INDEX[trimmed] != null) return SESSION_DAY_INDEX[trimmed]!;
  const normalized = normalizeProgrammeDay(sessionDay.trim()).toLowerCase();
  if (SESSION_DAY_INDEX[normalized] != null) return SESSION_DAY_INDEX[normalized]!;
  const short = normalized.slice(0, 3);
  if (SESSION_DAY_INDEX[short] != null) return SESSION_DAY_INDEX[short]!;
  return null;
}

/**
 * Daily bar bucket for the “This week” view.
 * session_day first; activity date (completed_at → updated_at → created_at) as fallback.
 */
export function resolveDailyBucketIndex(log: RunningVolumeLog): number | null {
  const sessionIdx = getSessionDayIndex(log.session_day);
  if (sessionIdx != null) return sessionIdx;

  const activity = logActivityDate(log);
  if (activity) return mondayIndexFromDate(activity);

  return null;
}

function formatWeekStartLabel(start: Date): string {
  return start.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatCalendarWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const startStr = weekStart.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const endStr = weekEnd.toLocaleDateString("en-GB", {
    day: "numeric",
    month: sameMonth ? undefined : "short",
  });
  return `${startStr} – ${endStr}`;
}

function buildRollingMondayWeekStarts(now: Date, count: number): Date[] {
  const currentStart = startOfMondayWeek(now);
  const starts: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    starts.push(addDays(currentStart, -7 * i));
  }
  return starts;
}

function weekStartKey(d: Date): string {
  return startOfMondayWeek(d).toISOString().slice(0, 10);
}

function summarizePace(logs: RunningVolumeLog[]): string | undefined {
  const sorted = [...logs].sort((a, b) => (logActivityMs(b) ?? 0) - (logActivityMs(a) ?? 0));
  const paces = sorted
    .map((l) => l.average_pace?.trim())
    .filter((p): p is string => Boolean(p));
  if (!paces.length) return undefined;
  return paces[0];
}

function aggregateStats(logs: RunningVolumeLog[]) {
  const distances = logs
    .map((l) => parseDistanceKm(l.distance_km))
    .filter((d): d is number => d != null);
  const totalKm = roundKm(distances.reduce((a, b) => a + b, 0));
  const runsLogged = logs.length;
  const longestRunKm = distances.length ? roundKm(Math.max(...distances)) : 0;
  const averagePace = summarizePace(logs);
  return { totalKm, runsLogged, longestRunKm, averagePace };
}

function matchesWeekViewFallback(
  log: RunningVolumeLog,
  effectiveWeek: number
): boolean {
  if (logActivityDate(log)) return false;
  if (log.week_number !== effectiveWeek) return false;
  return Boolean(log.session_day?.trim());
}

function filterLogsForWeekView(
  logs: RunningVolumeLog[],
  weekStart: Date,
  weekEndExclusive: Date,
  effectiveWeek: number
): RunningVolumeLog[] {
  return logs.filter((log) => {
    const activity = logActivityDate(log);
    if (activity) {
      return isInHalfOpenWindow(activity.getTime(), weekStart, weekEndExclusive);
    }
    return matchesWeekViewFallback(log, effectiveWeek);
  });
}

function filterLogsForRollingWeeks(
  logs: RunningVolumeLog[],
  weekStarts: Date[]
): RunningVolumeLog[] {
  if (!weekStarts.length) return [];
  const rangeStart = weekStarts[0]!;
  const rangeEndExclusive = addDays(weekStarts[weekStarts.length - 1]!, 7);
  return logs.filter((log) => {
    const activity = logActivityDate(log);
    if (!activity) return false;
    return isInHalfOpenWindow(activity.getTime(), rangeStart, rangeEndExclusive);
  });
}

export function buildRunningVolumeProgress(
  logs: RunningVolumeLog[],
  options: {
    view: RunningVolumeView;
    /** Used only when a log has no activity date (legacy fallback). */
    effectiveWeek?: number;
    now?: Date;
  }
): RunningVolumeProgress {
  const countable = logs.filter(isCountableRunningVolumeLog);
  const now = options.now ?? new Date();
  const effectiveWeek = Math.min(12, Math.max(1, Math.floor(options.effectiveWeek ?? 1)));
  const currentWeekStart = startOfMondayWeek(now);
  const currentWeekEndExclusive = addDays(currentWeekStart, 7);

  if (options.view === "week") {
    const weekLogs = filterLogsForWeekView(
      countable,
      currentWeekStart,
      currentWeekEndExclusive,
      effectiveWeek
    );
    const stats = aggregateStats(weekLogs);

    const dailyKm: RunningVolumeBar[] = DAY_LABELS.map((label) => ({ label, km: 0 }));
    for (const log of weekLogs) {
      const dist = parseDistanceKm(log.distance_km);
      if (dist == null) continue;
      const idx = resolveDailyBucketIndex(log);
      if (idx == null || idx < 0) continue;
      dailyKm[idx]!.km = roundKm(dailyKm[idx]!.km + dist);
    }

    return {
      activeView: "week",
      ...stats,
      dailyKm,
      hasData: stats.runsLogged > 0,
      calendarWeekLabel: formatCalendarWeekRange(currentWeekStart),
    };
  }

  const weekCount = options.view === "4weeks" ? 4 : 12;
  const weekStarts = buildRollingMondayWeekStarts(now, weekCount);
  const inRange = filterLogsForRollingWeeks(countable, weekStarts);

  const weeklyKm: RunningVolumeBar[] = weekStarts.map((start) => ({
    label: formatWeekStartLabel(start),
    km: 0,
  }));

  const kmByWeekStart = new Map<string, number>();
  for (const log of inRange) {
    const dist = parseDistanceKm(log.distance_km);
    const activity = logActivityDate(log);
    if (dist == null || !activity) continue;
    const key = weekStartKey(activity);
    kmByWeekStart.set(key, roundKm((kmByWeekStart.get(key) ?? 0) + dist));
  }

  for (let i = 0; i < weeklyKm.length; i++) {
    const key = weekStarts[i]!.toISOString().slice(0, 10);
    weeklyKm[i]!.km = kmByWeekStart.get(key) ?? 0;
  }

  const stats = aggregateStats(inRange);
  const weekTotals = weeklyKm.map((w) => w.km);
  const weeksWithKm = weekTotals.filter((k) => k > 0);
  const averageWeeklyKm =
    weekStarts.length > 0 ? roundKm(stats.totalKm / weekStarts.length) : undefined;
  const highestWeekKm = weeksWithKm.length ? roundKm(Math.max(...weekTotals)) : undefined;

  return {
    activeView: options.view,
    ...stats,
    weeklyKm,
    averageWeeklyKm,
    highestWeekKm,
    hasData: stats.runsLogged > 0,
  };
}
