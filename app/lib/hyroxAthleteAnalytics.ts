/**
 * Deterministic analytics calculations. React must not re-implement this arithmetic.
 * Frozen contract: docs/contracts/athlete-analytics.md
 */
import { isKeyProgrammeSession } from "@/app/lib/hyroxBlockReview";
import { parseYmd, toYmd } from "@/app/lib/hyroxProgrammeDates";
import { inferSessionActivityType } from "@/app/lib/hyrox-team/modules/sessionLogging/inferActivityType";
import {
  parseDurationToMinutes,
  parseSessionFeedback,
} from "@/app/lib/hyrox-team/modules/sessionLogging/aggregates";
import { localDateYmdInTimeZone } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import type { SessionActivityType } from "@/app/lib/hyrox-team/modules/sessionLogging/types";

export type HyroxAnalyticsModality = "run" | "bike" | "skierg" | "rowerg" | "strength" | "hyrox_specific" | "other";
export type HyroxModalityBucket = HyroxAnalyticsModality;
export type HyroxModality = HyroxModalityBucket;
export type HyroxAnalyticsWeek = HyroxAnalyticsWeekSummary;
export type HyroxAnalyticsDistribution = HyroxAnalyticsDistributionRow;
export type HyroxModalitySlice = HyroxAnalyticsDistribution;
export type HyroxBenchmarkPoint = HyroxAnalyticsBenchmarkPoint;

export type HyroxAnalyticsWeekSummary = {
  startDate: string;
  endDate: string;
  complete: boolean;
  plannedSessions: number;
  completedSessions: number;
  completionPct: number | null;
  runDistanceKm: number | null;
  trainingDurationMinutes: number | null;
  averageRpe: number | null;
  sessionRpeLoad: number | null;
  keySessionsCompleted: number;
  keySessionsPlanned: number;
};

export type HyroxAnalyticsDistributionRow = {
  modality: HyroxAnalyticsModality;
  durationMinutes: number | null;
  sessionCount: number;
};

export type HyroxAnalyticsBenchmarkPoint = {
  date: string;
  display: string;
  normalizedValue: number;
  source: string;
  status: string;
};

export type HyroxAnalyticsBenchmarkSeries = {
  type: string;
  label: string;
  points: HyroxAnalyticsBenchmarkPoint[];
};

export type HyroxAthleteAnalytics = {
  athleteId: string;
  asOf: string;
  currentWeek: HyroxAnalyticsWeekSummary;
  previousWeek: HyroxAnalyticsWeekSummary | null;
  rolling4: {
    runDistanceKm: number | null;
    trainingDurationMinutes: number | null;
    completionPct: number | null;
    averageRpe: number | null;
  };
  distribution: HyroxAnalyticsDistributionRow[];
  benchmarks: HyroxAnalyticsBenchmarkSeries[];
  unsupported: string[];
};

export type HyroxAnalyticsSessionInput = {
  calendarYmd?: string | null;
  dateYmd?: string | null;
  status: string;
  sessionSlot?: string | null;
  category: string;
  sessionName: string;
  metadata?: Record<string, unknown> | null;
  activityType?: string | null;
  durationMinutes?: number | null;
  runDistanceKm?: number | null;
  rpe?: number | null;
  athleteFeedback?: unknown;
};

export type HyroxAnalyticsBenchmarkInput = {
  type: string;
  label: string;
  date: string;
  display: string;
  normalizedValue: number;
  unit?: string;
  source?: string;
  status: string;
};

export type ComputeHyroxAthleteAnalyticsInput = {
  athleteId: string;
  now?: Date;
  asOf?: Date;
  timeZone?: string;
  sessions: HyroxAnalyticsSessionInput[];
  benchmarks?: HyroxAnalyticsBenchmarkInput[];
  extraUnsupported?: string[];
};

const MODALITY_ORDER: HyroxAnalyticsModality[] = [
  "run",
  "bike",
  "skierg",
  "rowerg",
  "strength",
  "hyrox_specific",
  "other",
];

export const ATHLETE_ANALYTICS_UNSUPPORTED = [
  "heart_rate_load",
  "threshold_easy_minutes",
  "ctl_atl_tsb",
  "check_in_wellness",
  "bodyweight_trend",
  "daily_readiness",
  "strength_logged_duration",
  "inferred_ftp_threshold_hyrox_pace",
  "interpolated_benchmarks",
  "population_percentiles",
  "strava_wearable_volume",
  "race_split_limiters",
] as const;

export const ANALYTICS_UNSUPPORTED_METRICS = ATHLETE_ANALYTICS_UNSUPPORTED;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parseOptionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseRpe(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const matches = String(value).match(/\d+(?:\.\d+)?/g);
  if (!matches?.length) return null;
  const nums = matches.map(Number).filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  return Math.max(...nums);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function addDaysYmd(ymd: string, days: number): string {
  const d = parseYmd(ymd);
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

export function analyticsWeekContaining(
  now: Date,
  timeZone = "UTC"
): { startDate: string; endDate: string } {
  const ymd = localDateYmdInTimeZone(now, timeZone);
  const d = parseYmd(ymd);
  const dow = d.getDay();
  const back = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - back);
  const startDate = toYmd(d);
  return { startDate, endDate: addDaysYmd(startDate, 6) };
}

export function shiftAnalyticsWeek(
  week: { startDate: string; endDate: string },
  weekDelta: number
): { startDate: string; endDate: string } {
  return {
    startDate: addDaysYmd(week.startDate, weekDelta * 7),
    endDate: addDaysYmd(week.endDate, weekDelta * 7),
  };
}

function sessionDate(session: HyroxAnalyticsSessionInput): string | null {
  const ymd = session.calendarYmd ?? session.dateYmd ?? null;
  return ymd && /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : null;
}

export function mapActivityToModality(
  activityType: SessionActivityType | string | null | undefined,
  category: string,
  sessionName: string
): HyroxAnalyticsModality {
  const type = (activityType ??
    inferSessionActivityType({
      category,
      sessionName,
    })) as SessionActivityType | string;
  if (type === "run") return "run";
  if (type === "bike") return "bike";
  if (type === "ski" || type === "skierg") return "skierg";
  if (type === "row" || type === "rowerg") return "rowerg";
  if (type === "strength") return "strength";
  if (type === "hyrox" || type === "hyrox_specific") return "hyrox_specific";
  return "other";
}

export function readLoggedAnalyticsMetrics(feedback: unknown) {
  const parsed = parseSessionFeedback(feedback);
  const type = parsed.activityType ?? null;
  const metrics = asRecord(parsed.metrics);
  const durationMinutes =
    type === "hyrox"
      ? parseDurationToMinutes(metrics.totalDuration) ?? parseDurationToMinutes(metrics.duration)
      : parseDurationToMinutes(metrics.duration);
  const rpe = parseRpe(metrics.sessionRpe) ?? parseRpe(metrics.rpe) ?? parseRpe(parsed.rpe);
  return {
    activityType: type,
    durationMinutes,
    distanceKm: parseOptionalNumber(metrics.distanceKm),
    rpe,
  };
}

export function modalityFromSession(session: HyroxAnalyticsSessionInput): HyroxAnalyticsModality {
  const fromFeedback = session.athleteFeedback
    ? parseSessionFeedback(session.athleteFeedback).activityType
    : null;
  return mapActivityToModality(
    session.activityType ?? fromFeedback,
    session.category,
    session.sessionName
  );
}

type Measured = {
  dateYmd: string;
  completed: boolean;
  key: boolean;
  modality: HyroxAnalyticsModality;
  durationMinutes: number | null;
  runDistanceKm: number | null;
  rpe: number | null;
  sessionRpeLoad: number | null;
};

function measure(session: HyroxAnalyticsSessionInput): Measured | null {
  const dateYmd = sessionDate(session);
  if (!dateYmd) return null;
  const logged = session.athleteFeedback ? readLoggedAnalyticsMetrics(session.athleteFeedback) : null;
  const modality = modalityFromSession(session);
  const durationMinutes = session.durationMinutes ?? logged?.durationMinutes ?? null;
  const rpe = session.rpe ?? logged?.rpe ?? null;
  const runDistanceKm =
    session.runDistanceKm ?? (modality === "run" ? logged?.distanceKm ?? logged?.runDistanceKm ?? null : null);
  return {
    dateYmd,
    completed: session.status === "completed",
    key: isKeyProgrammeSession({
      metadata: session.metadata ?? null,
      sessionSlot: session.sessionSlot ?? "Main",
      category: session.category,
    }),
    modality,
    durationMinutes,
    runDistanceKm,
    rpe,
    sessionRpeLoad: durationMinutes != null && rpe != null ? durationMinutes * rpe : null,
  };
}

function sumKnown(values: Array<number | null>): number | null {
  const xs = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0);
}

function meanKnown(values: Array<number | null>): number | null {
  const xs = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function completionPct(completed: number, planned: number): number | null {
  if (planned <= 0) return null;
  return Math.round((100 * completed) / planned);
}

function inWindow(session: Measured, start: string, end: string, asOfYmd: string): boolean {
  return session.dateYmd >= start && session.dateYmd <= end && session.dateYmd <= asOfYmd;
}

function summarizeWeek(
  startDate: string,
  endDate: string,
  sessions: Measured[],
  asOfYmd: string,
  cutAtAsOf: boolean
): HyroxAnalyticsWeekSummary {
  const inWeek = sessions.filter((session) => {
    if (session.dateYmd < startDate || session.dateYmd > endDate) return false;
    if (cutAtAsOf && session.dateYmd > asOfYmd) return false;
    return true;
  });
  const completed = inWeek.filter((session) => session.completed);
  const keyPlanned = inWeek.filter((session) => session.key);
  return {
    startDate,
    endDate,
    complete: asOfYmd > endDate,
    plannedSessions: inWeek.length,
    completedSessions: completed.length,
    completionPct: completionPct(completed.length, inWeek.length),
    runDistanceKm: (() => {
      const sum = sumKnown(inWeek.map((s) => s.runDistanceKm));
      return sum == null ? null : round2(sum);
    })(),
    trainingDurationMinutes: (() => {
      const sum = sumKnown(inWeek.map((s) => s.durationMinutes));
      return sum == null ? null : round1(sum);
    })(),
    averageRpe: (() => {
      const mean = meanKnown(inWeek.map((s) => s.rpe));
      return mean == null ? null : round1(mean);
    })(),
    sessionRpeLoad: (() => {
      const sum = sumKnown(inWeek.map((s) => s.sessionRpeLoad));
      return sum == null ? null : round1(sum);
    })(),
    keySessionsCompleted: completed.filter((session) => session.key).length,
    keySessionsPlanned: keyPlanned.length,
  };
}

function buildDistribution(sessions: Measured[]): HyroxAnalyticsDistributionRow[] {
  const buckets = new Map<
    HyroxAnalyticsModality,
    { duration: number; durationCount: number; sessionCount: number }
  >();
  for (const modality of MODALITY_ORDER) {
    buckets.set(modality, { duration: 0, durationCount: 0, sessionCount: 0 });
  }
  for (const session of sessions) {
    const bucket = buckets.get(session.modality)!;
    bucket.sessionCount += 1;
    if (session.durationMinutes != null) {
      bucket.duration += session.durationMinutes;
      bucket.durationCount += 1;
    }
  }
  return MODALITY_ORDER.map((modality) => {
    const bucket = buckets.get(modality)!;
    if (bucket.sessionCount === 0) return null;
    return {
      modality,
      durationMinutes: bucket.durationCount > 0 ? round1(bucket.duration) : null,
      sessionCount: bucket.sessionCount,
    };
  }).filter((row): row is HyroxAnalyticsDistributionRow => Boolean(row));
}

function buildBenchmarkSeries(rows: HyroxAnalyticsBenchmarkInput[]): HyroxAnalyticsBenchmarkSeries[] {
  const byType = new Map<string, HyroxAnalyticsBenchmarkInput[]>();
  for (const row of rows) {
    if (row.status === "rejected") continue;
    if (!Number.isFinite(row.normalizedValue) || !row.display.trim()) continue;
    const list = byType.get(row.type) ?? [];
    list.push(row);
    byType.set(row.type, list);
  }
  return [...byType.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, points]) => {
      const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
      return {
        type,
        label: sorted[0]?.label || type,
        points: sorted.map((point) => ({
          date: point.date,
          display: point.display,
          normalizedValue: point.normalizedValue,
          source: point.source ?? "",
          status: point.status,
        })),
      };
    })
    .filter((series) => series.points.length > 0);
}

export function computeHyroxAthleteAnalytics(
  input: ComputeHyroxAthleteAnalyticsInput
): HyroxAthleteAnalytics {
  const asOf = input.asOf ?? input.now ?? new Date();
  const timeZone = input.timeZone?.trim() || "UTC";
  const asOfYmd = localDateYmdInTimeZone(asOf, timeZone);
  const current = analyticsWeekContaining(asOf, timeZone);
  const previous = shiftAnalyticsWeek(current, -1);
  const rollingStart = addDaysYmd(current.startDate, -21);

  const measured = input.sessions
    .map((session) => measure(session))
    .filter((session): session is Measured => Boolean(session));

  const currentWeek = summarizeWeek(current.startDate, current.endDate, measured, asOfYmd, false);
  const previousWeek = summarizeWeek(previous.startDate, previous.endDate, measured, asOfYmd, false);

  const rollingSessions = measured.filter((session) =>
    inWindow(session, rollingStart, current.endDate, asOfYmd)
  );
  const rollingCompleted = rollingSessions.filter((session) => session.completed);
  const currentElapsed = measured.filter((session) =>
    session.dateYmd >= current.startDate && session.dateYmd <= current.endDate
  );

  const extra = [...ATHLETE_ANALYTICS_UNSUPPORTED, ...(input.extraUnsupported ?? [])];
  const undated = input.sessions.filter((session) => !sessionDate(session)).length;
  if (undated > 0) extra.push("undated_programme_sessions");

  return {
    athleteId: input.athleteId ?? "",
    asOf: asOf.toISOString(),
    currentWeek,
    previousWeek,
    rolling4: {
      runDistanceKm: (() => {
        const sum = sumKnown(rollingSessions.map((s) => s.runDistanceKm));
        return sum == null ? null : round2(sum);
      })(),
      trainingDurationMinutes: (() => {
        const sum = sumKnown(rollingSessions.map((s) => s.durationMinutes));
        return sum == null ? null : round1(sum);
      })(),
      completionPct: completionPct(rollingCompleted.length, rollingSessions.length),
      averageRpe: (() => {
        const mean = meanKnown(rollingSessions.map((s) => s.rpe));
        return mean == null ? null : round1(mean);
      })(),
    },
    distribution: buildDistribution(currentElapsed),
    benchmarks: buildBenchmarkSeries(input.benchmarks ?? []),
    unsupported: [...new Set(extra)],
  };
}

/**
 * Public analytics engine. Calculations live in hyroxAthleteAnalyticsCompute.
 * Contract: docs/contracts/athlete-analytics.md
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { listAthleteBenchmarks } from "@/app/lib/hyroxAthleteBenchmarkServer";
import { benchmarkLabel, isBenchmarkType } from "@/app/lib/hyroxBenchmarkTypes";
import type {
  HyroxAthleteRow,
  HyroxProgrammeSessionRow,
  HyroxProgrammeWeekRow,
} from "@/app/lib/hyroxDatabaseTypes";
import { sessionDateYmdFromProgrammeStart } from "@/app/lib/hyroxAthleteProgrammeSort";



function resolveAthleteId(athlete: string | { id: string }): string {
  return typeof athlete === "string" ? athlete : athlete.id;
}

function sessionYmd(params: {
  programmeStartYmd: string | null;
  week: Pick<HyroxProgrammeWeekRow, "week_number" | "week_start_date">;
  dayOfWeek: string;
}): string | null {
  const start = params.programmeStartYmd?.trim() || null;
  if (start) {
    try {
      return sessionDateYmdFromProgrammeStart(start, params.week.week_number, params.dayOfWeek);
    } catch {
      /* fall through */
    }
  }
  const weekStart = params.week.week_start_date?.trim() || null;
  if (weekStart) {
    try {
      return sessionDateYmdFromProgrammeStart(weekStart, 1, params.dayOfWeek);
    } catch {
      return null;
    }
  }
  return null;
}

function sessionToInput(
  row: HyroxProgrammeSessionRow,
  calendarYmd: string | null
): HyroxAnalyticsSessionInput {
  const logged = readLoggedAnalyticsMetrics(row.athlete_feedback);
  const modality = mapActivityToModality(logged.activityType, row.category, row.session_name);
  return {
    calendarYmd,
    status: row.status,
    sessionSlot: row.session_slot,
    category: row.category,
    sessionName: row.session_name,
    metadata: asRecord(row.metadata),
    activityType: logged.activityType,
    durationMinutes: logged.durationMinutes,
    runDistanceKm: modality === "run" ? logged.distanceKm : null,
    rpe: logged.rpe,
    athleteFeedback: row.athlete_feedback,
  };
}

export async function getHyroxAthleteAnalytics(
  client: SupabaseClient,
  athlete: string | { id: string },
  options?: { now?: Date; asOf?: Date }
): Promise<HyroxAthleteAnalytics> {
  const athleteId = resolveAthleteId(athlete);
  const now = options?.asOf ?? options?.now ?? new Date();
  const extraUnsupported: string[] = [];

  const { data: athleteRow } = await client
    .from("hyrox_athletes")
    .select("id, programme_start_date")
    .eq("id", athleteId)
    .maybeSingle();
  const programmeStart =
    (athleteRow as Pick<HyroxAthleteRow, "programme_start_date"> | null)?.programme_start_date?.trim() ||
    null;

  const { data: weeks, error: weekError } = await client
    .from("hyrox_programme_weeks")
    .select("id, athlete_id, week_number, week_start_date, week_end_date, status")
    .eq("athlete_id", athleteId)
    .eq("status", "published")
    .order("week_number", { ascending: true });
  if (weekError) extraUnsupported.push(`programme weeks unread: ${weekError.message}`);

  const weekRows = (weeks as HyroxProgrammeWeekRow[] | null) ?? [];
  const sessions: HyroxAnalyticsSessionInput[] = [];
  if (weekRows.length) {
    const { data: sessionRows, error: sessionError } = await client
      .from("hyrox_programme_sessions")
      .select(
        "id, programme_week_id, athlete_id, day_of_week, session_slot, session_name, category, metadata, status, completed_at, athlete_feedback"
      )
      .eq("athlete_id", athleteId)
      .in(
        "programme_week_id",
        weekRows.map((week) => week.id)
      );
    if (sessionError) extraUnsupported.push(`programme sessions unread: ${sessionError.message}`);
    const byWeek = new Map(weekRows.map((week) => [week.id, week]));
    for (const row of (sessionRows as HyroxProgrammeSessionRow[] | null) ?? []) {
      const week = byWeek.get(row.programme_week_id);
      if (!week) continue;
      sessions.push(
        sessionToInput(
          row,
          sessionYmd({
            programmeStartYmd: programmeStart,
            week,
            dayOfWeek: row.day_of_week,
          })
        )
      );
    }
  }

  const listed = await listAthleteBenchmarks(client, athleteId);
  let benchmarks: HyroxAnalyticsBenchmarkInput[] = [];
  if (listed.unavailable) {
    extraUnsupported.push(
      "append-only benchmark history unavailable (hyrox_athlete_benchmarks not present)"
    );
  } else if (listed.error) {
    extraUnsupported.push(`benchmark history unread: ${listed.error}`);
  } else {
    benchmarks = listed.rows
      .filter((row) => row.status !== "rejected" && Number.isFinite(row.normalized_value) && row.result_value.trim())
      .map((row) => ({
        type: row.benchmark_type,
        label: isBenchmarkType(row.benchmark_type)
          ? benchmarkLabel(row.benchmark_type)
          : row.benchmark_type,
        date: row.result_date.slice(0, 10),
        display: row.result_value,
        normalizedValue: row.normalized_value,
        source: row.source,
        status: row.status,
      }));
  }

  return computeHyroxAthleteAnalytics({
    athleteId,
    asOf: now,
    sessions,
    benchmarks,
    extraUnsupported,
  });
}
