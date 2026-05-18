import type { PaidProgrammeInput } from "./generate12WeekProgramme";
import type { GoalFocus, WeeklyHoursBand } from "./sessionLibrary";
import type { RationaleContext } from "./programmeRationale";
import { buildBenchmarkSignals } from "./paidProgrammeIntelligence";

const WEEKLY_HOURS_BANDS = new Set<string>(["2-3", "3-5", "5-7", "7-10", "10+"]);

const DAY_KEY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Normalise DB / UI labels to PlanJson DayKey (Mon–Sun) for double-session matching. */
export function normalizeDoubleSessionDays(
  days: string[] | null | undefined
): string[] {
  if (!days?.length) return [];
  const prefixes = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of days) {
    const t = String(raw).trim().toLowerCase();
    if (!t) continue;
    const prefix = t.slice(0, 3);
    const idx = prefixes.indexOf(prefix);
    if (idx < 0) continue;
    const key = DAY_KEY_ORDER[idx];
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

export type AthleteAssessmentRowForProgramme = {
  first_name?: string | null;
  goal_focus: string | null;
  event_type: string | null;
  event_date: string | null;
  target_time: string | null;
  training_days_per_week: number | null;
  weekly_hours_band: string | null;
  preferred_training_days: string[] | null;
  double_session_days: string[] | null;
  recent_5k_time: string | null;
  max_heart_rate?: number | null;
  strength_experience: string | null;
  hyrox_experience: string | null;
  equipment: string[] | null;
  injury_flags: string[] | null;
  movements_to_avoid: string[] | null;
  biggest_limiter: string | null;
  notes: string | null;
  hyrox_pb: string | null;
  current_run_volume_band?: string | null;
  completed_at?: string | null;
};

export type BenchmarkTestRowForProgramme = {
  test_type: string | null;
  test_label: string | null;
  test_time: string | null;
  test_value: number | null;
  test_unit: string | null;
  tested_at: string | null;
};

export type ProfileRowForProgramme = {
  full_name: string | null;
};

/** UI session-length pills (v0 assessment) → engine bands */
const SESSION_LENGTH_TO_BAND: Record<string, WeeklyHoursBand> = {
  "30-45 min": "3-5",
  "45-60 min": "5-7",
  "60-90 min": "7-10",
  "90+ min": "10+",
};

function normalizeWeeklyHoursBand(v: string | null | undefined): WeeklyHoursBand {
  const t = (v ?? "").trim();
  if (SESSION_LENGTH_TO_BAND[t]) return SESSION_LENGTH_TO_BAND[t];
  return WEEKLY_HOURS_BANDS.has(t) ? (t as WeeklyHoursBand) : "5-7";
}

/** Parse "MM:SS", "M:SS", or "H:MM:SS" to total seconds, or null. */
export function parseTimeToSeconds(raw: string | null | undefined): number | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  const parts = t.split(":").map((p) => p.trim());
  if (parts.some((p) => p === "" || Number.isNaN(Number(p)))) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return null;
  if (nums.length === 2) return nums[0] * 60 + nums[1];
  if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2];
  return null;
}

function fiveKAdvancedSignal(seconds: number | null): boolean {
  if (seconds == null) return false;
  return seconds <= 21 * 60;
}

export function deriveAbilityLevel(args: {
  strength_experience: string | null;
  hyrox_experience: string | null;
  five_k_time_raw: string;
}): "beginner" | "intermediate" | "advanced" {
  const s = (args.strength_experience ?? "").toLowerCase();
  const h = (args.hyrox_experience ?? "").toLowerCase();
  const sNorm = s.replace(/\belite\b/g, "advanced");
  const sec = parseTimeToSeconds(args.five_k_time_raw);

  if (sNorm.includes("advanced") || h.includes("competitive") || fiveKAdvancedSignal(sec)) {
    return "advanced";
  }
  if (
    sNorm.includes("intermediate") ||
    (h.includes("some") && h.includes("experience")) ||
    h.includes("some experience") ||
    (sec != null && sec <= 25 * 60)
  ) {
    return "intermediate";
  }
  return "beginner";
}

export function mapAssessmentGoalFocus(
  goalFocus: string | null,
  eventType: string | null
): GoalFocus {
  const g = `${goalFocus ?? ""} ${eventType ?? ""}`.toLowerCase();
  if (/(muscle|strength|body composition|body comp|body fat|\bbulk\b|\bcut\b)/.test(g)) return "muscle";
  if (/(running|\brun\b|engine|marathon|\b10k\b|half marathon|marathon prep|aerobic only)/.test(g)) return "running";
  return "hybrid";
}

function normalizeEquipment(list: string[] | null | undefined): string[] {
  if (!list?.length) return ["Full gym"];
  return list.map((item) => {
    const t = item.trim();
    if (/^full gym$/i.test(t)) return "Full gym";
    return t;
  });
}

function firstNameFromProfile(fullName: string | null | undefined): string | null {
  if (!fullName?.trim()) return null;
  const part = fullName.trim().split(/\s+/)[0];
  return part || null;
}

function fiveKTimeFromBenchmarks(tests: BenchmarkTestRowForProgramme[]): string {
  const fiveKTypes = ["5km time trial", "5km tt", "5k time trial", "5k tt"];
  const sorted = [...tests].sort((a, b) => {
    const da = a.tested_at ?? "";
    const db = b.tested_at ?? "";
    return db.localeCompare(da);
  });
  for (const row of sorted) {
    const type = (row.test_type ?? "").toLowerCase().trim();
    if (!fiveKTypes.includes(type)) continue;
    const time = row.test_time?.trim();
    if (time) return time;
  }
  for (const row of sorted) {
    const blob = `${row.test_type ?? ""} ${row.test_label ?? ""}`.toLowerCase();
    if (!/\b5\s*k|5km\b/.test(blob)) continue;
    const time = row.test_time?.trim();
    if (time) return time;
  }
  return "";
}

function buildNotes(args: {
  assessment: AthleteAssessmentRowForProgramme;
  tests: BenchmarkTestRowForProgramme[];
}): string {
  const parts: string[] = [];
  const a = args.assessment;
  const push = (label: string, v: string | null | undefined) => {
    const s = typeof v === "string" ? v.trim() : v == null ? "" : "";
    if (s) parts.push(`${label}: ${s}`);
  };
  push("Event", a.event_type);
  push("Event date", a.event_date ?? undefined);
  push("Target time", a.target_time ?? undefined);
  push("Hyrox PB", a.hyrox_pb ?? undefined);
  push("Biggest limiter", a.biggest_limiter ?? undefined);
  if (a.injury_flags?.length)
    push("Injury flags", a.injury_flags.join(", "));
  if (a.movements_to_avoid?.length)
    push("Avoid movements", a.movements_to_avoid.join(", "));
  push("Athlete notes", a.notes ?? undefined);

  const lines = args.tests
    .filter((t) => t.tested_at || t.test_time || t.test_value != null)
    .slice(0, 12)
    .map((t) => {
      const name = t.test_type ?? t.test_label ?? "Test";
      const val =
        t.test_time ??
        (t.test_value != null ? `${t.test_value}${t.test_unit ? ` ${t.test_unit}` : ""}` : "");
      const d = t.tested_at ?? "";
      return val ? `${name} ${val} (${d})` : null;
    })
    .filter(Boolean) as string[];
  if (lines.length) parts.push(`Recent benchmarks — ${lines.join("; ")}`);
  return parts.join(" | ") || "";
}

export function mapAssessmentToProgrammeInput(params: {
  assessment: AthleteAssessmentRowForProgramme;
  benchmarkTests: BenchmarkTestRowForProgramme[];
  email: string | null | undefined;
  profile: ProfileRowForProgramme | null;
}): PaidProgrammeInput {
  const email = params.email?.trim() || "";
  const prefix = email.includes("@") ? email.split("@")[0]!.trim() : email;
  const first =
    params.assessment.first_name?.trim() ||
    firstNameFromProfile(params.profile?.full_name ?? undefined) ||
    prefix ||
    "Athlete";

  const five_from_assessment = params.assessment.recent_5k_time?.trim() ?? "";
  const five_from_bench =
    fiveKTimeFromBenchmarks(params.benchmarkTests) || "";
  const five_k_time = five_from_assessment || five_from_bench;

  const days =
    typeof params.assessment.training_days_per_week === "number" &&
    Number.isFinite(params.assessment.training_days_per_week)
      ? Math.min(7, Math.max(2, Math.round(params.assessment.training_days_per_week)))
      : 5;

  const weekly_hours_band = normalizeWeeklyHoursBand(params.assessment.weekly_hours_band ?? undefined);

  const goal_focus = mapAssessmentGoalFocus(
    params.assessment.goal_focus,
    params.assessment.event_type
  );

  const ability_level = deriveAbilityLevel({
    strength_experience: params.assessment.strength_experience,
    hyrox_experience: params.assessment.hyrox_experience,
    five_k_time_raw: five_k_time,
  });

  const preferred_days = params.assessment.preferred_training_days?.length
    ? [...params.assessment.preferred_training_days]
    : [];

  const double_session_days = normalizeDoubleSessionDays(params.assessment.double_session_days);
  const double_sessions = double_session_days.length > 0;

  const has_injury = Boolean(
    params.assessment.injury_flags?.length ||
    params.assessment.movements_to_avoid?.length
  );

  const hasBaseline5k = Boolean(
    params.assessment.recent_5k_time?.trim() ||
    fiveKTimeFromBenchmarks(params.benchmarkTests) ||
    params.benchmarkTests.some(
      (t) =>
        (t.test_type ?? "").trim() === "3km time trial" && Boolean((t.test_time ?? "").trim())
    )
  );
  const hasBenchmarkTests = params.benchmarkTests.length > 0;

  const rationale_context: Omit<RationaleContext, "input"> = {
    assessment: {
      event_type: params.assessment.event_type,
      event_date: params.assessment.event_date,
      target_time: params.assessment.target_time,
      biggest_limiter: params.assessment.biggest_limiter,
      injury_flags: params.assessment.injury_flags,
      movements_to_avoid: params.assessment.movements_to_avoid,
      hyrox_pb: params.assessment.hyrox_pb,
      hyrox_experience: params.assessment.hyrox_experience,
      strength_experience: params.assessment.strength_experience,
      goal_focus_raw: params.assessment.goal_focus,
      current_run_volume_band: params.assessment.current_run_volume_band ?? null,
    },
    hasBaseline5k,
    hasBenchmarkTests,
    double_session_days,
    benchmark_signals: buildBenchmarkSignals(params.benchmarkTests),
  };

  return {
    first_name: first,
    email: email || undefined,
    goal_focus,
    ability_level,
    days_per_week: days,
    weekly_hours_band,
    preferred_days,
    double_sessions,
    double_session_days,
    equipment: normalizeEquipment(params.assessment.equipment ?? undefined),
    five_k_time,
    max_heart_rate:
      typeof params.assessment.max_heart_rate === "number" &&
      Number.isFinite(params.assessment.max_heart_rate)
        ? Math.round(params.assessment.max_heart_rate)
        : null,
    notes: buildNotes({ assessment: params.assessment, tests: params.benchmarkTests }),
    has_injury,
    current_run_volume_band: params.assessment.current_run_volume_band?.trim() || null,
    rationale_context,
  };
}
