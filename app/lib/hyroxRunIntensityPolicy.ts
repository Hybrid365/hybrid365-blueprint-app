/**
 * HYROX Pro run-intensity caps — protect quality over raw run volume in early build weeks.
 */

import type { BlueprintInput } from "./buildWeekBlueprint";
import { bikeAerobicDurationGuidance } from "./aerobicSessionGuidance";
import type { DayKey, DayPlan, StructureRole } from "./sessionLibrary";
import { classifyDayPlan } from "./sessionStressClassification";
import { isRunThresholdAnchorDay } from "./thresholdVolumeTracking";

export const HYROX_RUN_QUALITY_PROTECTED_NOTE =
  "Run quality is protected this week. Extra aerobic work is placed on bike/ergs so your engine progresses without excessive leg impact.";

export function isHyroxProAdvancedProfile(input: BlueprintInput): boolean {
  return Boolean(
    input.hyrox_track?.active &&
    input.hyrox_track.hyrox_event_type === "pro" &&
    input.ability_level === "advanced"
  );
}

export function isHyroxEarlyBuildWeek(weekNumber: number, weekFocus?: string | null): boolean {
  if (weekFocus?.includes("deload")) return false;
  return weekNumber <= 3;
}

function sessionBlob(day: DayPlan): string {
  return [day.title, day.template_id ?? "", ...(day.tags ?? []), ...(day.session?.main ?? [])]
    .join(" ")
    .toLowerCase();
}

/** 400 on/off, broken threshold floats, and interval runs are quality — not easy aerobic. */
export function isFloatOrIntervalQuality(day: DayPlan): boolean {
  const t0 = day.tags?.[0] ?? "";
  const blob = sessionBlob(day);
  if (t0 === "interval_run") return true;
  if (day.template_id === "TMP-400-400" || day.template_id === "TMP-300-300") return true;
  if (day.template_id === "INT-12X400" || day.template_id === "INT-SHORT-6X400") return true;
  if (t0 === "tempo_run" && /400\s*m|float|on\s*\/\s*off|broken threshold/i.test(blob)) {
    return true;
  }
  if (/400m on|400m float|broken threshold/i.test(blob)) return true;
  return false;
}

export function isCompromisedRunExposure(day: DayPlan): boolean {
  const t0 = day.tags?.[0] ?? "";
  if (t0 === "hybrid_compromised") return true;
  const blob = sessionBlob(day);
  return /compromised run|short compromised|hyrox.*compromised/i.test(blob);
}

/** Hard run exposures for HYROX intensity budgeting (excludes easy long run). */
export function isHardRunExposure(day: DayPlan, role?: StructureRole): boolean {
  if (
    day.template_id === "FILLER-RECOVERY" ||
    day.template_id === "FILLER-AEROBIC" ||
    day.title === "Recovery / Mobility" ||
    day.title === "Aerobic Support"
  ) {
    return false;
  }

  const t0 = day.tags?.[0] ?? "";
  if (t0 === "threshold_run") return true;
  if (t0 === "interval_run") return true;
  if (isCompromisedRunExposure(day)) return true;
  if (isFloatOrIntervalQuality(day)) return true;

  if (t0 === "tempo_run") {
    const stress = classifyDayPlan(day, role).session_stress;
    return stress === "high" || stress === "moderate";
  }

  if (t0 === "long_run") return false;

  const blob = sessionBlob(day);
  if (/broken threshold|400m float|12\s*x\s*400|6\s*x\s*400/i.test(blob)) return true;

  return false;
}

export function countHardRunExposures(
  schedule: DayPlan[],
  roleByDay?: Map<DayKey, StructureRole>
): number {
  let n = 0;
  for (const d of schedule) {
    if (isHardRunExposure(d, roleByDay?.get(d.day))) n += 1;
  }
  return n;
}

export function maxHardRunExposuresForHyroxPro(weekNumber: number, weekFocus?: string | null): number {
  if (weekFocus?.includes("deload")) return 2;
  if (weekNumber <= 3) return 2;
  if (weekNumber <= 7) return 3;
  return 4;
}

/** Lower = downgrade first. */
export function hardRunDowngradePriority(day: DayPlan, role?: StructureRole): number {
  if (isRunThresholdAnchorDay(day)) return 10_000;
  if (day.day === "Sun" && (day.tags?.[0] === "long_run" || /long run|long zone|long aerobic/i.test(day.title))) {
    return 10_000;
  }
  if (isFloatOrIntervalQuality(day) || day.tags?.[0] === "interval_run") return 10;
  if (isCompromisedRunExposure(day)) return 40;
  if (day.tags?.[0] === "threshold_run") return 80;
  return 50;
}

export function downgradeDayToEasyBike(
  day: DayPlan,
  input: BlueprintInput,
  roleByDay: Map<DayKey, StructureRole>
): void {
  const g = bikeAerobicDurationGuidance(input, "support");
  day.template_id = "FILLER-AEROBIC";
  day.title = "Aerobic Support";
  day.intent = "Easy aerobic support — run quality protected.";
  day.tags = ["aerobic_support", "aerobic", "bike_z2_support"];
  day.progression_family = undefined;
  day.progression_marker = undefined;
  day.run_prescription = undefined;
  day.double_session = undefined;
  day.session = {
    main: [`${g.duration} easy Z2 bike or easy row/ski`],
    notes: [
      `${g.rpe} — conversational. ${g.note}`,
      HYROX_RUN_QUALITY_PROTECTED_NOTE,
    ],
  };
  day.time_cap_minutes = 50;
  roleByDay.set(day.day, "run_aerobic");
}

/** Downgrade a hard run to easy running (keeps run exposure, lowers intensity). */
export function downgradeDayToEasyRun(
  day: DayPlan,
  input: BlueprintInput,
  roleByDay: Map<DayKey, StructureRole>
): void {
  const mins = input.ability_level === "advanced" ? "30–45 min" : "25–40 min";
  day.template_id = "FILLER-AEROBIC";
  day.title = "Easy Aerobic Run";
  day.intent = "Easy aerobic support — intensity reduced, run exposure kept.";
  day.tags = ["aerobic_run", "aerobic"];
  day.progression_family = undefined;
  day.progression_marker = undefined;
  day.run_prescription = undefined;
  day.double_session = undefined;
  day.session = {
    main: [`${mins} easy run @ conversational pace (RPE 3–4/10)`],
    notes: [
      "Keep this genuinely easy — no strides or pickups unless prescribed elsewhere.",
      HYROX_RUN_QUALITY_PROTECTED_NOTE,
    ],
  };
  day.time_cap_minutes = 50;
  roleByDay.set(day.day, "run_aerobic");
}

export function hasBikeOrErgAerobicSupport(schedule: DayPlan[]): boolean {
  return schedule.some((d) => {
    const blob = `${d.title} ${(d.session?.main ?? []).join(" ")} ${(d.tags ?? []).join(" ")}`;
    return (
      d.title === "Aerobic Support" ||
      d.tags?.includes("aerobic_support") ||
      d.tags?.includes("bike_z2_support") ||
      /easy z2 bike|bike flush|easy row|easy ski|recovery bike/i.test(blob)
    );
  });
}

export function sundayIsLongAerobic(sun: DayPlan | undefined): boolean {
  if (!sun) return false;
  if (sun.tags?.[0] === "long_run") return true;
  return /long run|long zone|long aerobic|long endurance/i.test(sun.title);
}

export function mondayViolatesSundayRecovery(
  mon: DayPlan,
  role?: StructureRole
): boolean {
  if (isHardRunExposure(mon, role)) return true;
  if (isFloatOrIntervalQuality(mon)) return true;

  const stress = classifyDayPlan(mon, role).session_stress;
  if (stress === "high" || stress === "moderate") return true;

  const blob = sessionBlob(mon);
  if (/hyrox lower|lower strength|strength endurance|compromised/i.test(blob)) return true;
  if (role === "lower_primary" || role === "lower_full" || role === "hybrid_primary") {
    if (stress !== "low") return true;
  }

  return false;
}

export function listHardRunExposureDays(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>
): { day: DayKey; dayPlan: DayPlan; priority: number }[] {
  return schedule
    .filter((d) => isHardRunExposure(d, roleByDay.get(d.day)))
    .map((d) => ({
      day: d.day,
      dayPlan: d,
      priority: hardRunDowngradePriority(d, roleByDay.get(d.day)),
    }))
    .sort((a, b) => a.priority - b.priority);
}

export function weekHasThresholdAndCompromised(schedule: DayPlan[]): boolean {
  let threshold = false;
  let compromised = false;
  for (const d of schedule) {
    if (isRunThresholdAnchorDay(d) || d.tags?.[0] === "threshold_run") threshold = true;
    if (isCompromisedRunExposure(d)) compromised = true;
  }
  return threshold && compromised;
}

export function appendWeekRunQualityNote(schedule: DayPlan[]): void {
  const anchor = schedule.find((d) => d.day === "Sun") ?? schedule[0];
  if (!anchor) return;
  if (!anchor.session.notes) anchor.session.notes = [];
  if (!anchor.session.notes.some((n) => n.includes(HYROX_RUN_QUALITY_PROTECTED_NOTE.slice(0, 40)))) {
    anchor.session.notes.push(HYROX_RUN_QUALITY_PROTECTED_NOTE);
  }
}
