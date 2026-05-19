/**
 * Session stress + role classification by actual training stress (not title alone).
 */

import type { DayKey, DayPlan, SessionCategory, SessionType, StructureRole } from "./sessionLibrary";
import type { SessionStressInput } from "./stressBudget";

export type SessionStressLevel = "low" | "moderate" | "high";
export type SessionRoleType = "key" | "support" | "recovery" | "optional";

export type ClassifiedSession = {
  session_stress: SessionStressLevel;
  session_role: SessionRoleType;
};

function sessionText(day: Pick<DayPlan, "title" | "tags" | "session">): string {
  const s = day.session;
  return [day.title, ...(day.tags ?? []), ...(s?.main ?? []), ...(s?.notes ?? [])]
    .join(" ")
    .toLowerCase();
}

function isFillerDay(day: DayPlan): boolean {
  return (
    day.template_id === "FILLER-RECOVERY" ||
    day.template_id === "FILLER-AEROBIC" ||
    day.title === "Recovery / Mobility" ||
    day.title === "Aerobic Support"
  );
}

/** Classify from library template fields + session type. */
export function classifySessionFromTemplate(args: {
  type: SessionType;
  category: SessionCategory;
  intensity: "low" | "medium" | "high";
  fatigue: "low" | "medium" | "high";
  title: string;
  mainLines: string[];
  structureRole?: StructureRole;
  isDoubleSupport?: boolean;
}): ClassifiedSession {
  const blob = [args.title, ...args.mainLines].join(" ").toLowerCase();
  const { type, category, intensity, fatigue, structureRole } = args;

  if (args.isDoubleSupport) {
    return { session_stress: "low", session_role: "optional" };
  }

  if (category === "recovery" || type === "recovery") {
    return { session_stress: "low", session_role: "recovery" };
  }

  if (
    type === "aerobic_support" ||
    (category === "aerobic" && intensity === "low" && fatigue === "low")
  ) {
    return { session_stress: "low", session_role: "support" };
  }

  if (
    /z2|easy aerobic|easy bike|easy row|easy ski|mobility|recovery walk|technical station/i.test(
      blob
    ) &&
    intensity !== "high"
  ) {
    return { session_stress: "low", session_role: "support" };
  }

  if (
    type === "threshold_run" ||
    type === "interval_run" ||
    type === "hybrid_compromised" ||
    (type === "hybrid_density" && fatigue === "high")
  ) {
    return { session_stress: "high", session_role: "key" };
  }

  if (
    /threshold|interval|compromised|race.?density|heavy lower|sled push|wall ball.*\d|erg.*threshold/i.test(
      blob
    )
  ) {
    return { session_stress: "high", session_role: "key" };
  }

  if (type === "long_run") {
    if (/steady finish|progression finish|tempo|moderate.?hard/i.test(blob)) {
      return { session_stress: "high", session_role: "key" };
    }
    return { session_stress: "moderate", session_role: "key" };
  }

  if (type === "strength_lower" && (intensity === "high" || fatigue === "high")) {
    return { session_stress: "high", session_role: "key" };
  }

  if (type === "strength_lower" || type === "strength_full") {
    return {
      session_stress: intensity === "high" ? "high" : "moderate",
      session_role: "key",
    };
  }

  if (type === "strength_upper") {
    return {
      session_stress: fatigue === "high" ? "moderate" : "low",
      session_role: structureRole === "upper_primary" ? "key" : "support",
    };
  }

  if (type === "tempo_run") {
    if (
      /400\s*m|float|on\s*\/\s*off|broken threshold/i.test(blob) ||
      args.title.includes("400m On")
    ) {
      return { session_stress: "high", session_role: "key" };
    }
    return { session_stress: "moderate", session_role: "key" };
  }

  if (type === "aerobic_run") {
    return { session_stress: "low", session_role: "support" };
  }

  if (category === "hybrid" && intensity === "medium") {
    return { session_stress: "moderate", session_role: "key" };
  }

  if (intensity === "high" || fatigue === "high") {
    return { session_stress: "high", session_role: "key" };
  }
  if (intensity === "medium" || fatigue === "medium") {
    return { session_stress: "moderate", session_role: "support" };
  }
  return { session_stress: "low", session_role: "support" };
}

export function classifyDayPlan(day: DayPlan, structureRole?: StructureRole): ClassifiedSession {
  if (isFillerDay(day)) {
    if (day.title === "Recovery / Mobility") {
      return { session_stress: "low", session_role: "recovery" };
    }
    return { session_stress: "low", session_role: "support" };
  }

  const t0 = (day.tags?.[0] ?? "") as SessionType;
  const t1 = day.tags?.[1] as SessionCategory | undefined;
  const blob = sessionText(day);

  if (day.double_session?.enabled) {
    const base = classifyDayPlan({ ...day, double_session: undefined }, structureRole);
    if (base.session_stress === "high") return base;
  }

  const inferred = baseIntensityFromStress(blob, t0);
  const intensity: "low" | "medium" | "high" =
    inferred ?? (day.tags?.includes("high") ? "high" : "medium");
  const fatigue: "low" | "medium" | "high" =
    intensity === "high" ? "high" : intensity === "low" ? "low" : "medium";

  return classifySessionFromTemplate({
    type: t0 || "aerobic_support",
    category: t1 || "aerobic",
    intensity,
    fatigue,
    title: day.title,
    mainLines: day.session?.main ?? [],
    structureRole,
  });
}

function baseIntensityFromStress(
  blob: string,
  type: SessionType
): "low" | "medium" | "high" | null {
  if (type === "recovery" || type === "aerobic_support") return "low";
  if (
    type === "threshold_run" ||
    type === "interval_run" ||
    type === "hybrid_compromised"
  ) {
    return "high";
  }
  if (/ @ rpe [89]|@ threshold|compromised|heavy/i.test(blob)) return "high";
  if (type === "aerobic_run" || /easy|z2|conversational/i.test(blob)) return "low";
  if (type === "tempo_run" && /400\s*m|float|on\s*\/\s*off/i.test(blob)) return "high";
  return null;
}

/** Map classification to stress budget inputs (intensity/fatigue aligned with stress). */
export function stressInputFromClassification(
  base: SessionStressInput,
  classified: ClassifiedSession
): SessionStressInput {
  const intensity =
    classified.session_stress === "high"
      ? "high"
      : classified.session_stress === "moderate"
        ? "medium"
        : "low";
  const fatigue =
    classified.session_stress === "high"
      ? "high"
      : classified.session_stress === "moderate"
        ? "medium"
        : "low";
  return { ...base, intensity, fatigue };
}

const DAY_ORDER: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type WeeklyRhythmAnalysis = {
  hard_days: DayKey[];
  consecutive_hard_runs: number;
  max_consecutive_hard: number;
  hard_day_count: number;
  sunday_stress: SessionStressLevel | null;
  monday_stress: SessionStressLevel | null;
  coaching_notes: string[];
  warnings: string[];
};

export function analyzeWeeklyRhythm(
  schedule: DayPlan[],
  roleByDay?: Map<DayKey, StructureRole>,
  options?: { hard_day_cap?: number }
): WeeklyRhythmAnalysis {
  const hardDayCap = options?.hard_day_cap ?? 3;
  const byDay = new Map<DayKey, ClassifiedSession & { title: string }>();
  for (const d of schedule) {
    byDay.set(d.day, {
      ...classifyDayPlan(d, roleByDay?.get(d.day)),
      title: d.title,
    });
  }

  const hardDays = DAY_ORDER.filter((day) => byDay.get(day)?.session_stress === "high");
  let maxConsec = 0;
  let cur = 0;
  let consecRuns = 0;
  for (const day of DAY_ORDER) {
    const c = byDay.get(day);
    if (c?.session_stress === "high") {
      cur += 1;
      maxConsec = Math.max(maxConsec, cur);
    } else {
      if (cur >= 3) consecRuns += 1;
      cur = 0;
    }
  }
  if (cur >= 3) consecRuns += 1;

  const hardCount = hardDays.length;
  const sun = byDay.get("Sun")?.session_stress ?? null;
  const mon = byDay.get("Mon")?.session_stress ?? null;

  const warnings: string[] = [];
  const coaching_notes: string[] = [];

  if (maxConsec >= 3) {
    warnings.push(
      `${maxConsec} consecutive hard days (${hardDays.join(" → ")}) — monitor fatigue and trim optional work.`
    );
    coaching_notes.push(
      "Assess how the body feels. If fatigue is high, keep optional support aerobic only or remove it."
    );
  }
  if (hardCount > hardDayCap) {
    warnings.push(`${hardCount} hard days this week — high cumulative stress for the profile.`);
  }
  if (sun === "high" && mon === "high") {
    warnings.push("Sunday and Monday are both high stress — prefer easier Monday after a hard Sunday.");
  }

  return {
    hard_days: hardDays,
    consecutive_hard_runs: consecRuns,
    max_consecutive_hard: maxConsec,
    hard_day_count: hardCount,
    sunday_stress: sun,
    monday_stress: mon,
    coaching_notes,
    warnings,
  };
}

export const FATIGUE_MONITORING_NOTE =
  "Assess how the body feels. If fatigue is high, keep optional support aerobic only or remove it.";

export const VAGUE_STRENGTH_PATTERN_RE =
  /\b(squat pattern|hinge pattern|push pattern|pull pattern|upper push|lower pattern)\b/i;

export function hasVagueStrengthPrescription(day: DayPlan): boolean {
  const main = (day.session?.main ?? []).join(" ");
  return VAGUE_STRENGTH_PATTERN_RE.test(main);
}
