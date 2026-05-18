/**
 * Post-generation validation + repair for weekly schedules.
 * Converts preview methodology rules into fixes where possible.
 */

import type { BlueprintInput } from "./buildWeekBlueprint";
import { applyErgThresholdSupportDoubles } from "./ergThresholdSupport";
import type { DayPlanWithDouble } from "./doubleSessionPlanner";
import {
  analyzeWeeklyRhythm,
  classifyDayPlan,
  FATIGUE_MONITORING_NOTE,
  type SessionStressLevel,
} from "./sessionStressClassification";
import { countRunExposuresInSchedule, type RunVolumePlan } from "./runVolumePlanner";
import {
  hasRunThresholdAnchor,
  isRunThresholdAnchorDay,
  shouldAddErgThresholdSupport,
} from "./thresholdVolumeTracking";
import type { DayKey, DayPlan, StructureRole } from "./sessionLibrary";
import { balanceScheduleHardEasy } from "./weeklyRhythmPlanner";
import {
  scheduleHasHyroxManagedErgSupport,
  shouldUseHyroxProDoubleProgression,
} from "./hyroxDoubleSessionProgression";

const DAY_ORDER: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const HARD_ROLES = new Set<StructureRole>([
  "run_quality",
  "run_quality_beginner",
  "hybrid_primary",
  "hybrid_density",
  "lower_primary",
  "lower_full",
  "full_body_strength",
]);

export type WeekRepairContext = {
  input: BlueprintInput;
  weekNumber: number;
  weekFocus?: string | null;
  roleByDay: Map<DayKey, StructureRole>;
  runVolumePlan?: RunVolumePlan | null;
};

export type WeekRepairResult = {
  schedule: DayPlan[];
  roleByDay: Map<DayKey, StructureRole>;
  repairsApplied: string[];
  remainingIssues: string[];
};

function isDeloadWeek(weekNumber: number, weekFocus?: string | null): boolean {
  if (weekFocus?.includes("deload")) return true;
  return weekNumber % 4 === 0;
}

function isFiller(day: DayPlan): boolean {
  return (
    day.template_id === "FILLER-RECOVERY" ||
    day.template_id === "FILLER-AEROBIC" ||
    day.title === "Recovery / Mobility" ||
    day.title === "Aerobic Support"
  );
}

function isSundayLongOrHard(day: DayPlan | undefined): boolean {
  if (!day) return false;
  if (day.tags?.[0] === "long_run") return true;
  if (/long run|long zone|long aerobic|long endurance/i.test(day.title)) return true;
  return classifyDayPlan(day).session_stress === "high" && day.day === "Sun";
}

function dayStress(day: DayPlan, role?: StructureRole): SessionStressLevel {
  return classifyDayPlan(day, role).session_stress;
}

function isHardActiveDay(day: DayPlan, role?: StructureRole): boolean {
  if (isFiller(day)) return false;
  if (dayStress(day, role) === "high") return true;
  if (role && HARD_ROLES.has(role)) return true;
  const t0 = day.tags?.[0] ?? "";
  return (
    t0 === "threshold_run" ||
    t0 === "interval_run" ||
    t0 === "hybrid_compromised" ||
    (t0 === "hybrid_density" && dayStress(day, role) !== "low")
  );
}

function isEasyActiveDay(day: DayPlan, role?: StructureRole): boolean {
  if (isFiller(day)) return day.title === "Recovery / Mobility";
  const s = dayStress(day, role);
  if (s === "low") return true;
  if (role === "run_aerobic" || role === "upper_primary" || role === "upper_full") return true;
  const t0 = day.tags?.[0] ?? "";
  return t0 === "recovery" || t0 === "aerobic_run" || t0 === "aerobic_support";
}

function swapScheduleDays(
  schedule: DayPlan[],
  dayA: DayKey,
  dayB: DayKey,
  roleByDay: Map<DayKey, StructureRole>
): boolean {
  const ia = schedule.findIndex((d) => d.day === dayA);
  const ib = schedule.findIndex((d) => d.day === dayB);
  if (ia < 0 || ib < 0) return false;
  const planA = schedule[ia]!;
  const planB = schedule[ib]!;
  if (isFiller(planA) || isFiller(planB)) return false;

  schedule[ia] = { ...planB, day: dayA };
  schedule[ib] = { ...planA, day: dayB };

  const ra = roleByDay.get(dayA);
  const rb = roleByDay.get(dayB);
  if (ra) {
    roleByDay.delete(dayA);
    roleByDay.set(dayB, ra);
  }
  if (rb) {
    roleByDay.delete(dayB);
    roleByDay.set(dayA, rb);
  }
  return true;
}

function appendCoachingNote(day: DayPlan, note: string) {
  if (!day.session.notes) day.session.notes = [];
  if (!day.session.notes.some((n) => n.includes(note.slice(0, 35)))) {
    day.session.notes.push(note);
  }
}

/** Monday must not follow Sunday long/hard with another hard session. */
function repairMondayAfterSunday(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>
): string | null {
  const sun = schedule.find((d) => d.day === "Sun");
  const mon = schedule.find((d) => d.day === "Mon");
  if (!sun || !mon) return null;
  if (!isSundayLongOrHard(sun)) return null;

  const monRole = roleByDay.get("Mon");
  if (!isHardActiveDay(mon, monRole)) return null;

  const swapCandidates: DayKey[] = ["Wed", "Tue", "Thu", "Fri", "Sat"];
  for (const key of swapCandidates) {
    const other = schedule.find((d) => d.day === key);
    const otherRole = roleByDay.get(key);
    if (!other || !isEasyActiveDay(other, otherRole)) continue;
    if (swapScheduleDays(schedule, "Mon", key, roleByDay)) {
      appendCoachingNote(
        schedule.find((d) => d.day === "Mon")!,
        "Monday stays easier after Sunday's long session — quality work moved to mid-week."
      );
      return `Swapped Monday (${mon.title}) with ${key} (${other.title}) for Sun→Mon recovery rhythm.`;
    }
  }

  appendCoachingNote(mon, `${FATIGUE_MONITORING_NOTE} Monday follows Sunday long — treat as optional if legs are heavy.`);
  return null;
}

function countHardDays(schedule: DayPlan[], roleByDay: Map<DayKey, StructureRole>): number {
  let n = 0;
  for (const d of schedule) {
    if (isFiller(d)) continue;
    if (isHardActiveDay(d, roleByDay.get(d.day))) n += 1;
  }
  return n;
}

function hasLowImpactThresholdSupport(schedule: DayPlan[]): boolean {
  return schedule.some(
    (d) =>
      d.double_session?.threshold_support ||
      /skierg|row\s*erg|bike.*threshold/i.test(d.double_session?.secondary.title ?? "")
  );
}

function maxHardDaysAllowed(input: BlueprintInput, schedule: DayPlan[]): number {
  if (
    input.hyrox_track?.active &&
    input.ability_level === "advanced" &&
    hasLowImpactThresholdSupport(schedule)
  ) {
    return 4;
  }
  if (input.ability_level === "advanced") return 4;
  return 3;
}

/** Reduce hard-day count by swapping hard with easier mid-week days. */
function repairHardDayCap(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>,
  input: BlueprintInput
): string | null {
  const maxHard = maxHardDaysAllowed(input, schedule);
  if (countHardDays(schedule, roleByDay) <= maxHard) return null;

  const hardDays = DAY_ORDER.filter((day) => {
    const d = schedule.find((x) => x.day === day);
    return d && !isFiller(d) && isHardActiveDay(d, roleByDay.get(day));
  });

  for (const hardDay of [...hardDays].reverse()) {
    if (hardDay === "Sun" || hardDay === "Sat") continue;
    for (const easyDay of ["Wed", "Tue", "Thu", "Mon", "Fri"] as DayKey[]) {
      const dEasy = schedule.find((d) => d.day === easyDay);
      if (!dEasy || !isEasyActiveDay(dEasy, roleByDay.get(easyDay))) continue;
      if (isHardActiveDay(dEasy, roleByDay.get(easyDay))) continue;
      if (swapScheduleDays(schedule, hardDay, easyDay, roleByDay)) {
        return `Swapped ${hardDay} hard session with ${easyDay} to respect hard-day cap (${maxHard}).`;
      }
    }
  }
  return null;
}

function repairConsecutiveHard(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>
): string | null {
  const before = analyzeWeeklyRhythm(schedule, roleByDay);
  if (before.max_consecutive_hard < 3) return null;

  const balanced = balanceScheduleHardEasy(schedule, roleByDay);
  schedule.splice(0, schedule.length, ...balanced);

  const after = analyzeWeeklyRhythm(schedule, roleByDay);
  if (after.max_consecutive_hard < before.max_consecutive_hard) {
    return "Rebalanced schedule to reduce consecutive hard days.";
  }
  return null;
}

function minRunExposuresTarget(ctx: WeekRepairContext): number {
  const { input, runVolumePlan } = ctx;
  if (runVolumePlan) return runVolumePlan.minRunSessionsPerWeek;
  if (input.hyrox_track?.active && input.ability_level === "advanced") {
    return input.days_per_week >= 7 ? 5 : 4;
  }
  if (input.ability_level === "advanced") return 4;
  return 3;
}

/** Swap aerobic filler with an easy-run day from mid-week if run count is low. */
function repairRunExposureMinimum(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>,
  ctx: WeekRepairContext
): string | null {
  if (isDeloadWeek(ctx.weekNumber, ctx.weekFocus)) return null;
  const target = minRunExposuresTarget(ctx);
  const count = countRunExposuresInSchedule(schedule);
  if (count >= target) return null;

  for (const day of ["Thu", "Wed", "Sat", "Fri"] as DayKey[]) {
    const d = schedule.find((x) => x.day === day);
    if (!d || d.title !== "Aerobic Support") continue;
    const donor = schedule.find(
      (x) =>
        !isFiller(x) &&
        x.tags?.[0] === "aerobic_run" &&
        x.day !== "Mon" &&
        x.day !== "Sun"
    );
    if (donor && swapScheduleDays(schedule, day, donor.day, roleByDay)) {
      return `Swapped Aerobic Support (${day}) with easy run (${donor.day}) to meet run exposure minimum.`;
    }
  }

  return null;
}

function hasErgSupport(schedule: DayPlan[]): boolean {
  return schedule.some(
    (d) =>
      d.double_session?.threshold_support ||
      /skierg|row\s*erg|bike.*threshold/i.test(
        `${d.double_session?.secondary.title ?? ""} ${d.progression_family ?? ""}`
      )
  );
}

function repairErgThresholdSupport(
  schedule: DayPlanWithDouble[],
  ctx: WeekRepairContext
): string | null {
  if (shouldUseHyroxProDoubleProgression(ctx.input)) return null;
  if (scheduleHasHyroxManagedErgSupport(schedule)) return null;
  if (isDeloadWeek(ctx.weekNumber, ctx.weekFocus)) return null;
  if (!shouldAddErgThresholdSupport(ctx.input, ctx.weekNumber, ctx.weekFocus)) return null;
  if (!hasRunThresholdAnchor(schedule)) return null;
  if (hasErgSupport(schedule)) return null;

  const after = applyErgThresholdSupportDoubles({
    schedule,
    input: ctx.input,
    weekNumber: ctx.weekNumber,
    weekFocus: ctx.weekFocus,
  });
  schedule.splice(0, schedule.length, ...after);

  if (hasErgSupport(schedule)) {
    return "Added erg threshold support session (PM double).";
  }
  return null;
}

function collectRemainingIssues(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>,
  ctx: WeekRepairContext
): string[] {
  const issues: string[] = [];
  const maxHard = maxHardDaysAllowed(ctx.input, schedule);
  const rhythm = analyzeWeeklyRhythm(schedule, roleByDay, { hard_day_cap: maxHard });

  const sun = schedule.find((d) => d.day === "Sun");
  const mon = schedule.find((d) => d.day === "Mon");
  if (sun && mon && isSundayLongOrHard(sun) && isHardActiveDay(mon, roleByDay.get("Mon"))) {
    issues.push("Monday remains hard after Sunday long/hard — could not fully swap (day constraints).");
  }

  if (rhythm.max_consecutive_hard >= 3) {
    issues.push(`${rhythm.max_consecutive_hard} consecutive hard days — spacing limited by structure.`);
  }

  const hardCount = countHardDays(schedule, roleByDay);
  if (hardCount > maxHard) {
    issues.push(`${hardCount} hard days (cap ${maxHard}) — reduce optional work if fatigue is high.`);
  }

  if (!isDeloadWeek(ctx.weekNumber, ctx.weekFocus)) {
    const target = minRunExposuresTarget(ctx);
    const runs = countRunExposuresInSchedule(schedule);
    if (runs < target) {
      issues.push(`Only ${runs} run exposures (target ≥${target}) — limited by days/structure.`);
    }
  }

  if (
    ctx.input.hyrox_track?.active &&
    ctx.input.ability_level === "advanced" &&
    !isDeloadWeek(ctx.weekNumber, ctx.weekFocus) &&
    !hasRunThresholdAnchor(schedule)
  ) {
    issues.push("Missing weekly run threshold anchor.");
  }

  if (
    shouldAddErgThresholdSupport(ctx.input, ctx.weekNumber, ctx.weekFocus) &&
    !isDeloadWeek(ctx.weekNumber, ctx.weekFocus) &&
    hasRunThresholdAnchor(schedule) &&
    !hasErgSupport(schedule)
  ) {
    issues.push("No erg threshold support added — no suitable double slot.");
  }

  for (const w of rhythm.warnings) {
    const duplicate = issues.some(
      (i) =>
        /consecutive hard|hard days/i.test(i) &&
        /consecutive hard|hard days/i.test(w)
    );
    if (!duplicate) issues.push(w);
  }

  return [...new Set(issues)];
}

/**
 * Run repair passes on a generated week schedule (mutates schedule in place).
 */
export function repairWeekSchedule(
  schedule: DayPlan[],
  ctx: WeekRepairContext
): WeekRepairResult {
  const roleByDay = new Map(ctx.roleByDay);
  const repairsApplied: string[] = [];

  const passes: Array<() => string | null> = [
    () => repairMondayAfterSunday(schedule, roleByDay),
    () => repairConsecutiveHard(schedule, roleByDay),
    () => repairHardDayCap(schedule, roleByDay, ctx.input),
    () => repairRunExposureMinimum(schedule, roleByDay, ctx),
    () => repairRunExposureMinimum(schedule, roleByDay, ctx),
    () => repairErgThresholdSupport(schedule as DayPlanWithDouble[], ctx),
    () => repairMondayAfterSunday(schedule, roleByDay),
    () => repairConsecutiveHard(schedule, roleByDay),
    () => repairHardDayCap(schedule, roleByDay, ctx.input),
  ];

  for (const pass of passes) {
    const msg = pass();
    if (msg) repairsApplied.push(msg);
  }

  const remainingIssues = collectRemainingIssues(schedule, roleByDay, ctx);

  return { schedule, roleByDay, repairsApplied, remainingIssues };
}

export function buildRoleByDayFromSchedule(
  schedule: DayPlan[],
  fallback?: Map<DayKey, StructureRole>
): Map<DayKey, StructureRole> {
  const map = new Map<DayKey, StructureRole>(fallback ?? []);
  for (const d of schedule) {
    if (!map.has(d.day) && d.tags?.[0]) {
      const t0 = d.tags[0];
      if (t0 === "threshold_run" || t0 === "interval_run") map.set(d.day, "run_quality");
      else if (t0 === "long_run") map.set(d.day, "run_long");
      else if (t0 === "aerobic_run") map.set(d.day, "run_aerobic");
      else if (t0 === "hybrid_compromised" || t0 === "hybrid_density")
        map.set(d.day, "hybrid_primary");
      else if (t0 === "strength_lower") map.set(d.day, "lower_primary");
      else if (t0 === "strength_upper") map.set(d.day, "upper_primary");
    }
  }
  return map;
}
