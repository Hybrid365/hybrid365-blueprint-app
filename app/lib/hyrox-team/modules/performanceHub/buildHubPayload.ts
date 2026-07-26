/**
 * Assemble Performance Hub payload from programme sessions, logs, readiness, benchmarks.
 * Read-only — never mutates source records.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HyroxAthleteRow,
  HyroxProgrammeSessionRow,
  HyroxProgrammeWeekRow,
} from "@/app/lib/hyroxDatabaseTypes";
import { mapPublishedSessionsToAthleteUi } from "@/app/lib/hyroxProgrammeServer";
import { sessionDateYmdFromProgrammeStart } from "@/app/lib/hyroxAthleteProgrammeSort";
import {
  parseDurationToMinutes,
  parseSessionFeedback,
  toSessionLogAnalyticsRow,
} from "@/app/lib/hyrox-team/modules/sessionLogging/aggregates";
import {
  classifySessionForHub,
  DISTRIBUTION_LABELS,
  type TrainingDistributionBucket,
} from "@/app/lib/hyrox-team/modules/performanceHub/classification";
import {
  addDaysYmd,
  eachWeekStarts,
  resolveHubDateRange,
  ymdInRange,
} from "@/app/lib/hyrox-team/modules/performanceHub/dateRange";
import { buildHyroxExposureRows } from "@/app/lib/hyrox-team/modules/performanceHub/hyroxExposure";
import { buildHubInsights } from "@/app/lib/hyrox-team/modules/performanceHub/insights";
import {
  executionState,
  formatMetricNumber,
  pctOf,
  type CoachHubFlag,
  type DistributionSlice,
  type HubBenchmarkPreview,
  type HubMetricValue,
  type HubRangeKey,
  type HubReadinessSummary,
  type PerformanceHubPayload,
  type PlannedVsCompletedCard,
  type WeeklyTrendPoint,
} from "@/app/lib/hyrox-team/modules/performanceHub/types";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import { localDateYmdInTimeZone } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";

type DatedSession = {
  ui: HyroxSession;
  row: HyroxProgrammeSessionRow;
  ymd: string;
  weekNumber: number;
};

const EMPTY = "Not enough structured data yet";

function sum(nums: Array<number | null | undefined>): number | null {
  const xs = nums.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0);
}

function avg(nums: Array<number | null | undefined>): number | null {
  const xs = nums.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function plannedDurationMinutes(ui: HyroxSession, row: HyroxProgrammeSessionRow): number | null {
  if (ui.plannedTargets?.estimatedDurationMinutes != null) {
    return ui.plannedTargets.estimatedDurationMinutes;
  }
  const fromDetail = ui.detail?.durationMin;
  if (typeof fromDetail === "number" && fromDetail > 0) return fromDetail;
  const prescription = (row.prescription ?? {}) as Record<string, unknown>;
  const edit = (prescription.editConfig ?? {}) as Record<string, unknown>;
  if (typeof edit.durationMinutes === "number") return edit.durationMinutes;
  return parseDurationToMinutes(prescription.duration ?? ui.duration);
}

function plannedRunDistanceKm(ui: HyroxSession, row: HyroxProgrammeSessionRow): number | null {
  const prescription = (row.prescription ?? {}) as Record<string, unknown>;
  const edit = (prescription.editConfig ?? {}) as Record<string, unknown>;
  const raw =
    edit.distanceKm ??
    edit.targetDistanceKm ??
    prescription.distanceKm ??
    prescription.targetDistanceKm;
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function hasPain(ui: HyroxSession): boolean {
  const m = ui.activityMetrics as { painOrTightness?: string | null } | null | undefined;
  return Boolean(m?.painOrTightness?.trim());
}

function prescriptionText(row: HyroxProgrammeSessionRow): string {
  const p = (row.prescription ?? {}) as Record<string, unknown>;
  const edit = (p.editConfig ?? {}) as Record<string, unknown>;
  return [
    p.fullPrescription,
    p.objective,
    edit.mainSet,
    Array.isArray(edit.mainSetLines) ? edit.mainSetLines.join(" ") : "",
  ]
    .filter(Boolean)
    .join(" ");
}

async function loadDatedSessions(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow
): Promise<DatedSession[]> {
  const programmeStart = athlete.programme_start_date?.trim() || null;
  if (!programmeStart) return [];

  const { data: weeks } = await supabase
    .from("hyrox_programme_weeks")
    .select(
      "id, athlete_id, week_number, week_start_date, week_end_date, status, block_number, weekly_focus, coach_note, athlete_facing_note"
    )
    .eq("athlete_id", athlete.id)
    .eq("status", "published")
    .order("week_number", { ascending: true });

  const weekRows = (weeks as HyroxProgrammeWeekRow[] | null) ?? [];
  if (!weekRows.length) return [];

  const weekIds = weekRows.map((w) => w.id);
  const { data: sessions } = await supabase
    .from("hyrox_programme_sessions")
    .select(
      "id, programme_week_id, athlete_id, created_at, updated_at, day_of_week, session_slot, session_name, category, prescription, metadata, status, completed_at, athlete_feedback"
    )
    .in("programme_week_id", weekIds);

  const sessionRows = (sessions as HyroxProgrammeSessionRow[] | null) ?? [];
  const dated: DatedSession[] = [];

  for (const week of weekRows) {
    const weekSessions = sessionRows.filter((s) => s.programme_week_id === week.id);
    const uiList = mapPublishedSessionsToAthleteUi(weekSessions, {
      programmeStartYmd: programmeStart,
      globalWeekNumber: week.week_number,
    });
    for (const ui of uiList) {
      const row = weekSessions.find((s) => s.id === ui.id);
      if (!row) continue;
      const ymd = sessionDateYmdFromProgrammeStart(
        programmeStart,
        week.week_number,
        row.day_of_week
      );
      dated.push({ ui, row, ymd, weekNumber: week.week_number });
    }
  }

  return dated;
}

async function loadReadinessRange(
  supabase: SupabaseClient,
  athleteId: string,
  startYmd: string,
  endYmd: string
) {
  const { data } = await supabase
    .from("hyrox_daily_readiness")
    .select(
      "local_date, score, category, feeling_unwell, muscle_soreness, bodyweight, submitted_at"
    )
    .eq("athlete_id", athleteId)
    .gte("local_date", startYmd)
    .lte("local_date", endYmd)
    .order("local_date", { ascending: true });
  return (data ?? []) as Array<{
    local_date: string;
    score: number | null;
    category: string | null;
    feeling_unwell: boolean;
    muscle_soreness: number | null;
    bodyweight: number | null;
    submitted_at: string | null;
  }>;
}

async function loadCheckInForLiveWeek(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow
): Promise<boolean | null> {
  const { data } = await supabase
    .from("hyrox_check_ins")
    .select("id, status, week_number, submitted_at")
    .eq("athlete_id", athlete.id)
    .eq("status", "submitted")
    .order("week_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return false;
  return true;
}

async function loadBenchmarkPreview(
  supabase: SupabaseClient,
  athleteId: string
): Promise<HubBenchmarkPreview[]> {
  const { data } = await supabase
    .from("hyrox_testing_results")
    .select("id, test_type, result_json, submitted_at, created_at, status")
    .eq("athlete_id", athleteId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(40);

  const rows = (data ?? []) as Array<{
    test_type: string;
    result_json: Record<string, unknown> | null;
    submitted_at: string | null;
  }>;

  const labels: Record<string, string> = {
    five_k_run: "5K",
    one_k_ski: "1km Ski",
    two_k_row: "2km Row",
    mini_compromised: "Mini compromised",
    farmer_hold: "Farmer hold",
    sandbag_lunge_capacity: "Sandbag lunge",
    wall_ball_capacity: "Wall ball",
  };

  const byType = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byType.get(r.test_type) ?? [];
    list.push(r);
    byType.set(r.test_type, list);
  }

  const preview: HubBenchmarkPreview[] = [];
  for (const [type, list] of byType) {
    const latest = list[0];
    const previous = list[1];
    const valueOf = (r: (typeof rows)[0] | undefined) => {
      if (!r?.result_json) return null;
      const j = r.result_json;
      return (
        (typeof j.totalTime === "string" && j.totalTime) ||
        (typeof j.time === "string" && j.time) ||
        (typeof j.result === "string" && j.result) ||
        null
      );
    };
    preview.push({
      id: type,
      label: labels[type] ?? type,
      latest: valueOf(latest),
      previous: valueOf(previous),
      change: latest && previous ? "See testing history" : null,
      date: latest?.submitted_at?.slice(0, 10) ?? null,
    });
  }

  return preview.slice(0, 8);
}

function buildReadinessSummary(
  rows: Awaited<ReturnType<typeof loadReadinessRange>>,
  endYmd: string
): HubReadinessSummary {
  const submitted = rows.filter((r) => r.submitted_at);
  if (!submitted.length) {
    return {
      currentScore: null,
      currentCategory: null,
      avg7d: null,
      trend: "unknown",
      missingDays: 7,
      illnessDays: 0,
      highSorenessDays: 0,
      emptyReason: EMPTY,
    };
  }

  const last7Start = addDaysYmd(endYmd, -6);
  const last7 = submitted.filter((r) => ymdInRange(r.local_date, last7Start, endYmd));
  const scores = last7.map((r) => r.score).filter((s): s is number => s != null);
  const avg7d = avg(scores);
  const current = [...submitted].sort((a, b) => b.local_date.localeCompare(a.local_date))[0];

  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  let trend: HubReadinessSummary["trend"] = "unknown";
  if (firstHalf.length && secondHalf.length) {
    const a = avg(firstHalf)!;
    const b = avg(secondHalf)!;
    if (b - a > 3) trend = "up";
    else if (a - b > 3) trend = "down";
    else trend = "flat";
  }

  let missingDays = 0;
  for (let i = 0; i < 7; i++) {
    const y = addDaysYmd(endYmd, -i);
    if (!last7.some((r) => r.local_date === y)) missingDays += 1;
  }

  return {
    currentScore: current?.score ?? null,
    currentCategory: current?.category ?? null,
    avg7d: avg7d != null ? Math.round(avg7d) : null,
    trend,
    missingDays,
    illnessDays: last7.filter((r) => r.feeling_unwell).length,
    highSorenessDays: last7.filter((r) => (r.muscle_soreness ?? 0) >= 8).length,
  };
}

function buildCoachFlags(params: {
  completionPct: number | null;
  missingLogs: number;
  abovePlanCount: number;
  avgRpe: number | null;
  readiness: HubReadinessSummary;
  painFlags: number;
  structuredSparse: boolean;
  benchmarkCount: number;
}): CoachHubFlag[] {
  const flags: CoachHubFlag[] = [];
  if (params.completionPct != null && params.completionPct < 60) {
    flags.push({
      id: "low-completion",
      label: "Low completion",
      severity: "alert",
      detail: `Session completion ${Math.round(params.completionPct)}% in selected range.`,
    });
  }
  if (params.missingLogs > 0) {
    flags.push({
      id: "missing-logs",
      label: "Missing logs",
      severity: "watch",
      detail: `${params.missingLogs} scheduled session(s) without a log.`,
    });
  }
  if (params.abovePlanCount >= 2) {
    flags.push({
      id: "above-plan",
      label: "Repeated above-plan volume",
      severity: "watch",
      detail: `${params.abovePlanCount} planned-vs-completed metrics above plan.`,
    });
  }
  if (params.avgRpe != null && params.avgRpe >= 8) {
    flags.push({
      id: "high-rpe",
      label: "High average RPE",
      severity: "watch",
      detail: `Average logged RPE ${params.avgRpe.toFixed(1)}.`,
    });
  }
  if (params.readiness.trend === "down") {
    flags.push({
      id: "readiness-down",
      label: "Readiness deterioration",
      severity: "watch",
      detail: "7-day readiness indicator trending down.",
    });
  }
  if (params.readiness.illnessDays > 0) {
    flags.push({
      id: "illness",
      label: "Illness flagged",
      severity: "alert",
      detail: `${params.readiness.illnessDays} day(s) with illness/unwell flag.`,
    });
  }
  if (params.readiness.highSorenessDays > 0) {
    flags.push({
      id: "soreness",
      label: "High soreness",
      severity: "watch",
      detail: `${params.readiness.highSorenessDays} day(s) with soreness ≥ 8.`,
    });
  }
  if (params.painFlags > 0) {
    flags.push({
      id: "pain",
      label: "Pain / tightness",
      severity: "watch",
      detail: `${params.painFlags} logged session(s) with pain/tightness notes.`,
    });
  }
  if (params.structuredSparse) {
    flags.push({
      id: "sparse",
      label: "Lack of structured data",
      severity: "info",
      detail: "Many sessions lack V2 metrics — volume comparisons may be partial.",
    });
  }
  if (params.benchmarkCount > 0) {
    flags.push({
      id: "benchmarks",
      label: "Benchmark history present",
      severity: "info",
      detail: `${params.benchmarkCount} benchmark type(s) with submitted results.`,
    });
  }
  return flags;
}

export async function buildPerformanceHubPayload(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  opts: { rangeKey: HubRangeKey; timezone?: string; today?: Date }
): Promise<PerformanceHubPayload> {
  const tz = opts.timezone?.trim() || "UTC";
  const today = opts.today ?? new Date();
  const localTodayYmd = localDateYmdInTimeZone(today, tz);
  const range = resolveHubDateRange(opts.rangeKey, today);
  if (opts.rangeKey === "this_week") {
    // Re-anchor week to athlete-local calendar day
    const localToday = new Date(`${localTodayYmd}T12:00:00`);
    const anchored = resolveHubDateRange("this_week", localToday);
    range.startYmd = anchored.startYmd;
    range.endYmd = anchored.endYmd;
  } else {
    range.endYmd = localTodayYmd;
    const days = opts.rangeKey === "last_4" ? 27 : 83;
    range.startYmd = addDaysYmd(localTodayYmd, -days);
  }

  const [datedAll, readinessRows, checkInComplete, benchmarks] = await Promise.all([
    loadDatedSessions(supabase, athlete),
    loadReadinessRange(supabase, athlete.id, addDaysYmd(range.endYmd, -90), range.endYmd),
    loadCheckInForLiveWeek(supabase, athlete),
    loadBenchmarkPreview(supabase, athlete.id),
  ]);

  const inRange = datedAll.filter((s) => ymdInRange(s.ymd, range.startYmd, range.endYmd));
  const dataNotes: string[] = [];

  const enriched = inRange.map((s) => {
    const feedback = parseSessionFeedback(s.row.athlete_feedback);
    const analytics = toSessionLogAnalyticsRow(s.row.athlete_feedback);
    const classification = classifySessionForHub({
      category: s.row.category,
      sessionName: s.row.session_name,
      prescription: s.row.prescription,
      loggedActivityType: feedback.activityType,
    });
    const plannedMin = plannedDurationMinutes(s.ui, s.row);
    const completedMin = analytics.durationMinutes;
    const plannedRun = plannedRunDistanceKm(s.ui, s.row);
    const completedRun = analytics.isRunExposure ? analytics.distanceKm : null;
    const complete = s.ui.status === "complete";
    const missed = s.ui.status === "missed";
    return {
      ...s,
      feedback,
      analytics,
      classification,
      plannedMin,
      completedMin,
      plannedRun,
      completedRun,
      complete,
      missed,
      hasLog: analytics.hasLog,
      structuredVolume: analytics.durationMinutes != null || analytics.distanceKm != null,
    };
  });

  const completedCount = enriched.filter((s) => s.complete).length;
  const loggedCount = enriched.filter((s) => s.hasLog).length;
  const plannedCount = enriched.length;
  const completionPct =
    plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : null;

  const plannedHours = sum(enriched.map((s) => s.plannedMin));
  const completedHoursRaw = sum(enriched.map((s) => s.completedMin));
  const structuredDurationCount = enriched.filter((s) => s.completedMin != null).length;
  const plannedHoursVal = plannedHours != null ? plannedHours / 60 : null;
  const completedHoursVal =
    structuredDurationCount > 0 && completedHoursRaw != null ? completedHoursRaw / 60 : null;
  if (loggedCount > structuredDurationCount) {
    dataNotes.push(
      "Some logged sessions lack structured duration — training hours use available metrics only."
    );
  }

  const plannedRun = sum(enriched.map((s) => s.plannedRun));
  const completedRun = sum(enriched.map((s) => s.completedRun));
  const runDuration = sum(
    enriched.filter((s) => s.analytics.isRunExposure).map((s) => s.completedMin)
  );

  const thresholdCompleted = sum(
    enriched
      .filter((s) => s.classification.isThresholdQuality)
      .map((s) => s.completedMin ?? (s.complete ? s.plannedMin : null))
  );
  const thresholdPlanned = sum(
    enriched.filter((s) => s.classification.isThresholdQuality).map((s) => s.plannedMin)
  );
  const easyCompleted = sum(
    enriched
      .filter((s) => s.classification.isEasyAerobic)
      .map((s) => s.completedMin ?? (s.complete ? s.plannedMin : null))
  );

  const strengthPlanned = enriched.filter((s) => s.classification.bucket === "strength").length;
  const strengthDone = enriched.filter(
    (s) => s.classification.bucket === "strength" && (s.complete || s.analytics.isStrengthExposure)
  ).length;
  const hyroxPlanned = enriched.filter((s) => s.classification.bucket === "hyrox_station").length;
  const hyroxDone = enriched.filter(
    (s) => s.classification.bucket === "hyrox_station" && (s.complete || s.analytics.isHyroxExposure)
  ).length;

  const skiVol = sum(
    enriched
      .filter((s) => s.analytics.activityType === "ski")
      .map((s) => s.analytics.distanceKm)
  );
  const rowVol = sum(
    enriched
      .filter((s) => s.analytics.activityType === "row")
      .map((s) => s.analytics.distanceKm)
  );
  const bikeVol = sum(
    enriched
      .filter((s) => s.analytics.activityType === "bike")
      .map((s) => s.analytics.distanceKm)
  );

  const avgRpe = avg(enriched.map((s) => s.analytics.rpe));
  const readinessInRange = readinessRows.filter(
    (r) => r.submitted_at && ymdInRange(r.local_date, range.startYmd, range.endYmd)
  );
  const readinessAvg = avg(readinessInRange.map((r) => r.score));
  const painFlags = enriched.filter((s) => hasPain(s.ui)).length;

  const metric = (
    key: string,
    label: string,
    value: number | null,
    unit: string,
    tooltip: string,
    digits = 1
  ): HubMetricValue => ({
    key,
    label,
    value,
    unit,
    display: value == null ? "—" : `${formatMetricNumber(value, digits)}${unit ? ` ${unit}` : ""}`,
    emptyReason: value == null ? EMPTY : null,
    tooltip,
  });

  const summary: HubMetricValue[] = [
    metric(
      "hours",
      "Total training hours",
      completedHoursVal,
      "h",
      "Sum of structured logged durations in range ÷ 60. Legacy logs without duration are omitted."
    ),
    metric(
      "run_km",
      "Running distance",
      completedRun,
      "km",
      "Sum of run activity distanceKm metrics in range."
    ),
    metric(
      "run_min",
      "Running duration",
      runDuration,
      "min",
      "Sum of run activity duration metrics in range."
    ),
    metric(
      "threshold",
      "Threshold / quality minutes",
      thresholdCompleted,
      "min",
      "Logged (or planned if completed without duration) minutes for sessions classified as threshold/quality."
    ),
    metric(
      "easy",
      "Easy aerobic time",
      easyCompleted,
      "min",
      "Minutes for sessions classified as easy aerobic."
    ),
    metric("strength", "Strength sessions", strengthDone, "", "Completed/logged strength classifications.", 0),
    metric("hyrox", "HYROX / mixed sessions", hyroxDone, "", "Completed/logged HYROX/station classifications.", 0),
    metric("ski", "Ski volume", skiVol, "km", "SkiErg distance from V2 metrics (m→km if >50)."),
    metric("row", "Row volume", rowVol, "km", "RowErg distance from V2 metrics."),
    metric("bike", "Bike volume", bikeVol, "km", "Bike distance from V2 metrics."),
    metric(
      "completion",
      "Session completion",
      completionPct,
      "%",
      "Completed status ÷ scheduled sessions in range.",
      0
    ),
    metric("avg_rpe", "Average RPE", avgRpe != null ? Math.round(avgRpe * 10) / 10 : null, "", "Mean of logged RPE values."),
    metric(
      "readiness_avg",
      "Readiness average",
      readinessAvg != null ? Math.round(readinessAvg) : null,
      "",
      "Mean daily readiness indicator scores submitted in range.",
      0
    ),
    metric(
      "pain",
      "Pain / tightness flags",
      painFlags > 0 ? painFlags : null,
      "",
      "Count of logs with painOrTightness notes.",
      0
    ),
  ].filter((m) => m.value != null || m.key === "completion" || m.key === "hours" || m.key === "run_km");

  // Always surface check-in as separate note
  if (checkInComplete != null) {
    summary.push({
      key: "checkin",
      label: "Weekly check-in",
      value: checkInComplete ? 1 : 0,
      unit: "",
      display: checkInComplete ? "Submitted" : "Missing",
      tooltip: "Latest submitted weekly check-in for this athlete (not race readiness).",
      emptyReason: null,
    });
  }

  const pvcCard = (
    key: string,
    label: string,
    planned: number | null,
    completed: number | null,
    unit: string,
    tooltip: string
  ): PlannedVsCompletedCard => ({
    key,
    label,
    planned,
    completed,
    unit,
    pct: pctOf(planned, completed),
    state: executionState(planned, completed),
    tooltip,
    emptyReason:
      planned == null && completed == null
        ? EMPTY
        : planned == null || completed == null
          ? "Partial Data"
          : null,
  });

  const plannedVsCompleted: PlannedVsCompletedCard[] = [
    pvcCard(
      "training_time",
      "Total training time",
      plannedHoursVal,
      completedHoursVal,
      "h",
      "Planned: sum of prescription durations. Completed: structured logged durations only."
    ),
    pvcCard(
      "run_distance",
      "Running distance",
      plannedRun,
      completedRun,
      "km",
      "Planned only when prescription includes explicit distance. Completed from run metrics."
    ),
    pvcCard(
      "threshold",
      "Quality / threshold minutes",
      thresholdPlanned != null ? thresholdPlanned : null,
      thresholdCompleted,
      "min",
      "Sessions classified as threshold/quality via intensity band or name heuristics."
    ),
    pvcCard(
      "strength",
      "Strength exposures",
      strengthPlanned,
      strengthDone,
      "",
      "Count of strength-classified sessions planned vs completed/logged."
    ),
    pvcCard(
      "hyrox",
      "HYROX sessions",
      hyroxPlanned,
      hyroxDone,
      "",
      "Count of HYROX/station-classified sessions planned vs completed/logged."
    ),
    pvcCard(
      "completion",
      "Session completion",
      plannedCount,
      completedCount,
      "",
      "Scheduled sessions in range vs status=completed."
    ),
  ];

  // Distribution
  const bucketMins = new Map<TrainingDistributionBucket, { minutes: number; count: number; low: number }>();
  for (const s of enriched) {
    const b = s.classification.bucket;
    const cur = bucketMins.get(b) ?? { minutes: 0, count: 0, low: 0 };
    cur.count += 1;
    const mins = s.completedMin ?? (s.complete ? s.plannedMin : null);
    if (mins != null) cur.minutes += mins;
    if (s.classification.confidence === "low") cur.low += 1;
    bucketMins.set(b, cur);
  }
  const totalDistMins = sum([...bucketMins.values()].map((v) => v.minutes)) ?? 0;
  const distribution: DistributionSlice[] = [...bucketMins.entries()]
    .map(([bucket, v]) => ({
      bucket,
      label: DISTRIBUTION_LABELS[bucket],
      sessionCount: v.count,
      minutes: v.minutes > 0 ? Math.round(v.minutes) : null,
      sharePct: totalDistMins > 0 && v.minutes > 0 ? Math.round((v.minutes / totalDistMins) * 100) : null,
      confidenceNote:
        v.low > 0
          ? `${v.low} session(s) low-confidence classification (shown as ${DISTRIBUTION_LABELS[bucket]}).`
          : "Classified from activity type / intensity tags / name heuristics.",
    }))
    .sort((a, b) => (b.minutes ?? 0) - (a.minutes ?? 0));

  // Weekly series
  const weekStarts = eachWeekStarts(range.startYmd, range.endYmd);
  const weeklySeries: WeeklyTrendPoint[] = weekStarts.map((weekStart) => {
    const weekEnd = addDaysYmd(weekStart, 6);
    const weekSessions = enriched.filter((s) => ymdInRange(s.ymd, weekStart, weekEnd));
    const ready = readinessRows.filter(
      (r) => r.submitted_at && ymdInRange(r.local_date, weekStart, weekEnd)
    );
    const dur = sum(weekSessions.map((s) => s.completedMin));
    const runKm = sum(weekSessions.map((s) => s.completedRun));
    const structured = weekSessions.some((s) => s.structuredVolume || s.hasLog);
    const plannedW = weekSessions.length;
    const doneW = weekSessions.filter((s) => s.complete).length;
    return {
      weekStartYmd: weekStart,
      weekLabel: weekStart.slice(5),
      trainingHours: dur != null ? Math.round((dur / 60) * 10) / 10 : null,
      runDistanceKm: runKm != null ? Math.round(runKm * 10) / 10 : null,
      thresholdMinutes: sum(
        weekSessions
          .filter((s) => s.classification.isThresholdQuality)
          .map((s) => s.completedMin ?? (s.complete ? s.plannedMin : null))
      ),
      easyMinutes: sum(
        weekSessions
          .filter((s) => s.classification.isEasyAerobic)
          .map((s) => s.completedMin ?? (s.complete ? s.plannedMin : null))
      ),
      strengthSessions: weekSessions.filter(
        (s) => s.classification.bucket === "strength" && (s.complete || s.hasLog)
      ).length,
      hyroxSessions: weekSessions.filter(
        (s) => s.classification.bucket === "hyrox_station" && (s.complete || s.hasLog)
      ).length,
      averageRpe: avg(weekSessions.map((s) => s.analytics.rpe)),
      readinessAvg: avg(ready.map((r) => r.score)),
      bodyweightKg: avg(ready.map((r) => r.bodyweight)),
      completionPct: plannedW > 0 ? Math.round((doneW / plannedW) * 100) : null,
      structuredData: structured || ready.length > 0,
    };
  });

  const hyroxExposures = buildHyroxExposureRows(
    enriched.map((s) => ({
      ymd: s.ymd,
      name: s.ui.name,
      category: s.row.category,
      prescriptionText: prescriptionText(s.row),
      logNotes: s.ui.logNotes ?? null,
      stationSplits:
        (s.ui.activityMetrics as { stationSplits?: string } | null)?.stationSplits ?? null,
      activityType: s.analytics.activityType,
    }))
  );

  const readiness = buildReadinessSummary(readinessRows, range.endYmd);

  // Prior completion for insight (previous equal-length window)
  const spanDays =
    Math.round(
      (Date.parse(range.endYmd) - Date.parse(range.startYmd)) / (24 * 3600 * 1000)
    ) + 1;
  const priorEnd = addDaysYmd(range.startYmd, -1);
  const priorStart = addDaysYmd(priorEnd, -(spanDays - 1));
  const priorSessions = datedAll.filter((s) => ymdInRange(s.ymd, priorStart, priorEnd));
  const priorCompletion =
    priorSessions.length > 0
      ? Math.round(
          (priorSessions.filter((s) => s.ui.status === "complete").length /
            priorSessions.length) *
            100
        )
      : null;

  const insights = buildHubInsights({
    rangeLabel: range.label,
    weeklySeries,
    pvc: plannedVsCompleted,
    readiness,
    completionPct,
    priorCompletionPct: priorCompletion,
  });

  const structuredSparse =
    enriched.length > 0 &&
    enriched.filter((s) => s.structuredVolume).length / Math.max(1, enriched.length) < 0.35;

  const coachFlags = buildCoachFlags({
    completionPct,
    missingLogs: enriched.filter((s) => !s.hasLog && !s.complete && s.ymd <= range.endYmd).length,
    abovePlanCount: plannedVsCompleted.filter((c) => c.state === "above_plan").length,
    avgRpe,
    readiness,
    painFlags,
    structuredSparse,
    benchmarkCount: benchmarks.filter((b) => b.latest).length,
  });

  return {
    range: { key: opts.rangeKey, ...range },
    summary,
    plannedVsCompleted,
    distribution,
    weeklySeries,
    hyroxExposures,
    insights,
    readiness,
    benchmarks,
    coachFlags,
    checkInComplete,
    dataNotes,
  };
}
