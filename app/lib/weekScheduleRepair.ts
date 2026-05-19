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
import { balanceScheduleHardEasy } from "./weeklyRhythmPlanner";
import {
  countRunExposuresInSchedule,
  estimatePlannedRunKmFromSchedule,
  type RunVolumePlan,
} from "./runVolumePlanner";
import { bikeAerobicDurationGuidance } from "./aerobicSessionGuidance";
import { CALF_ISO_COACHING_NOTE } from "./ergThresholdSupport";
import {
  hasRunThresholdAnchor,
  isRunThresholdAnchorDay,
  shouldAddErgThresholdSupport,
} from "./thresholdVolumeTracking";
import type { DayKey, DayPlan, StructureRole } from "./sessionLibrary";
import {
  scheduleHasHyroxManagedErgSupport,
  shouldUseHyroxProDoubleProgression,
} from "./hyroxDoubleSessionProgression";

const DAY_ORDER: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

let weekSwapOptions:
  | { protect_sunday_long?: boolean; allow_filler_swap?: boolean }
  | undefined;

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

function isModerateOrHardDay(day: DayPlan, role?: StructureRole): boolean {
  if (isFiller(day)) return false;
  const s = dayStress(day, role);
  return s === "high" || s === "moderate";
}

function isLegsRole(role?: StructureRole): boolean {
  return role === "lower_primary" || role === "lower_full" || role === "full_body_strength";
}

function isThresholdRole(role?: StructureRole, day?: DayPlan): boolean {
  if (role === "run_quality" || role === "run_quality_beginner") return true;
  const t0 = day?.tags?.[0] ?? "";
  return t0 === "threshold_run" || t0 === "interval_run";
}

function sundayLongOrHardProtectsMonday(schedule: DayPlan[]): boolean {
  const sun = schedule.find((d) => d.day === "Sun");
  return Boolean(sun && isSundayLongOrHard(sun));
}

function isEasyActiveDay(day: DayPlan, role?: StructureRole): boolean {
  if (isFiller(day)) return day.title === "Recovery / Mobility";
  const s = dayStress(day, role);
  if (s === "low") return true;
  if (role === "run_aerobic" || role === "upper_primary" || role === "upper_full") return true;
  const t0 = day.tags?.[0] ?? "";
  return t0 === "recovery" || t0 === "aerobic_run" || t0 === "aerobic_support";
}

function isLongAerobicAnchorDay(day: DayPlan): boolean {
  const t0 = day.tags?.[0] ?? "";
  return t0 === "long_run" || /long run|long zone|endurance long/i.test(day.title);
}

function swapScheduleDays(
  schedule: DayPlan[],
  dayA: DayKey,
  dayB: DayKey,
  roleByDay: Map<DayKey, StructureRole>,
  options?: { protect_sunday_long?: boolean; allow_filler_swap?: boolean }
): boolean {
  const opts = options ?? weekSwapOptions;
  const ia = schedule.findIndex((d) => d.day === dayA);
  const ib = schedule.findIndex((d) => d.day === dayB);
  if (ia < 0 || ib < 0) return false;
  const planA = schedule[ia]!;
  const planB = schedule[ib]!;
  if (!opts?.allow_filler_swap && (isFiller(planA) || isFiller(planB))) return false;
  if (
    opts?.protect_sunday_long &&
    ((dayA === "Sun" && isLongAerobicAnchorDay(planA)) ||
      (dayB === "Sun" && isLongAerobicAnchorDay(planB)))
  ) {
    return false;
  }

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

/** HYROX / hybrid weeks should anchor longer aerobic work on Sunday when possible. */
function repairSundayLongAnchor(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>,
  ctx: WeekRepairContext
): string | null {
  if (!ctx.input.hyrox_track?.active || isDeloadWeek(ctx.weekNumber, ctx.weekFocus)) {
    return null;
  }
  const sun = schedule.find((d) => d.day === "Sun");
  if (!sun) return null;
  if (sun.tags?.[0] === "long_run" || /long run|long zone|long aerobic|endurance long/i.test(sun.title)) {
    return null;
  }

  const longElsewhere = schedule.find(
    (d) =>
      d.day !== "Sun" &&
      !isFiller(d) &&
      (d.tags?.[0] === "long_run" || /long run|long zone|endurance long/i.test(d.title))
  );
  if (!longElsewhere) return null;

  if (swapScheduleDays(schedule, "Sun", longElsewhere.day, roleByDay)) {
    return `Moved long aerobic (${longElsewhere.title}) to Sunday anchor.`;
  }
  return null;
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

  const swapCandidates: DayKey[] = ["Wed", "Fri", "Thu", "Tue", "Sat"];
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

  const protectMon = sundayLongOrHardProtectsMonday(schedule);
  const easyTargets = (
    protectMon ? ["Wed", "Tue", "Thu", "Fri"] : ["Wed", "Tue", "Thu", "Mon", "Fri"]
  ) as DayKey[];

  for (const hardDay of [...hardDays].reverse()) {
    if (hardDay === "Sun" || hardDay === "Sat") continue;
    if (protectMon && hardDay === "Mon") continue;
    for (const easyDay of easyTargets) {
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

/** Remove erroneous run prescription from strength / HYROX lower sessions. */
function repairStripRunPrescription(schedule: DayPlan[]): string | null {
  let fixed = 0;
  for (const d of schedule) {
    if (!d.run_prescription) continue;
    const blob = `${d.title} ${d.progression_family ?? ""} ${(d.tags ?? []).join(" ")}`.toLowerCase();
    const t0 = d.tags?.[0] ?? "";
    const isStrength =
      t0.startsWith("strength") ||
      /hyrox lower|lower_strength_hyrox/i.test(blob) ||
      d.progression_family?.startsWith("lower_strength");
    const isTrueRun =
      t0 === "threshold_run" ||
      t0 === "interval_run" ||
      t0 === "long_run" ||
      t0 === "aerobic_run" ||
      t0 === "tempo_run" ||
      t0 === "hybrid_compromised";
    if (isStrength && !isTrueRun) {
      const { run_prescription: _, ...rest } = d;
      Object.assign(d, rest);
      fixed += 1;
    }
  }
  return fixed > 0 ? `Removed run prescription from ${fixed} non-run session(s).` : null;
}

/** Avoid heavy lower directly before threshold / hard run. */
function repairLegsBeforeThreshold(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>
): string | null {
  for (let i = 0; i < DAY_ORDER.length - 1; i++) {
    const d0 = DAY_ORDER[i]!;
    const d1 = DAY_ORDER[i + 1]!;
    const day0 = schedule.find((d) => d.day === d0);
    const day1 = schedule.find((d) => d.day === d1);
    if (!day0 || !day1) continue;
    const r0 = roleByDay.get(d0);
    const r1 = roleByDay.get(d1);
    if (!isLegsRole(r0) || !isThresholdRole(r1, day1)) continue;
    if (isModerateOrHardDay(day0, r0) && isHardActiveDay(day1, r1)) {
      for (const swapKey of ["Fri", "Mon", "Thu", "Sat"] as DayKey[]) {
        if (swapKey === d0 || swapKey === d1) continue;
        const other = schedule.find((d) => d.day === swapKey);
        if (!other || !isEasyActiveDay(other, roleByDay.get(swapKey))) continue;
        if (swapScheduleDays(schedule, d0, swapKey, roleByDay)) {
          return `Moved ${d0} leg strength away from day before threshold (${d1}).`;
        }
      }
    }
  }
  return null;
}

/** Reduce 3+ moderate/high days in a row. */
function repairModerateStressChains(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>
): string | null {
  const protectMon = sundayLongOrHardProtectsMonday(schedule);
  const easySwapDays = (protectMon ? ["Wed", "Fri", "Thu", "Tue"] : ["Mon", "Wed", "Fri", "Thu"]) as DayKey[];

  for (let pass = 0; pass < 3; pass++) {
    let chain = 0;
    let chainStart = 0;
    for (let i = 0; i < DAY_ORDER.length; i++) {
      const day = DAY_ORDER[i]!;
      const d = schedule.find((x) => x.day === day);
      if (d && !isFiller(d) && isModerateOrHardDay(d, roleByDay.get(day))) {
        if (chain === 0) chainStart = i;
        chain += 1;
      } else {
        if (chain >= 3) {
          const hardDay = DAY_ORDER[chainStart + 1]!;
          if (!(protectMon && hardDay === "Mon")) {
            for (const easyDay of easySwapDays) {
              const dEasy = schedule.find((d) => d.day === easyDay);
              if (!dEasy || !isEasyActiveDay(dEasy, roleByDay.get(easyDay))) continue;
              if (swapScheduleDays(schedule, hardDay, easyDay, roleByDay)) {
                return `Swapped ${hardDay} to reduce ${chain}-day moderate/high stress chain.`;
              }
            }
          }
        }
        chain = 0;
      }
    }
  }
  return null;
}

function repairCalfIsoOnHyroxLower(schedule: DayPlan[]): string | null {
  if (
    schedule.some((d) => {
      const blob = `${d.title} ${(d.session?.main ?? []).join(" ")}`.toLowerCase();
      return /hyrox lower|lower_strength_hyrox/i.test(blob) && /calf iso|soleus iso/i.test(blob);
    })
  ) {
    return null;
  }
  for (const d of schedule) {
    if (!/hyrox lower|lower_strength_hyrox/i.test(`${d.progression_family ?? ""} ${d.title}`)) {
      continue;
    }
    d.session.main = [
      ...(d.session.main ?? []),
      "Standing calf iso hold 3×30–45s/side",
      "Bent-knee soleus iso hold 3×30–45s/side",
    ];
    if (!d.session.notes) d.session.notes = [];
    if (!d.session.notes.some((n) => /calf iso/i.test(n))) {
      d.session.notes.push(CALF_ISO_COACHING_NOTE);
    }
    return "Added calf isometric accessory to HYROX lower strength session.";
  }
  return null;
}

function repairRunVolumeBandCompliance(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>,
  ctx: WeekRepairContext
): string | null {
  const plan = ctx.runVolumePlan;
  if (!plan || isDeloadWeek(ctx.weekNumber, ctx.weekFocus)) return null;
  if (ctx.input.has_injury) return null;

  let planned = estimatePlannedRunKmFromSchedule(schedule);
  if (planned >= plan.targetKmMin) return null;

  const longRun = schedule.find(
    (d) => d.tags?.[0] === "long_run" || /long run|long zone/i.test(d.title)
  );
  if (longRun) {
    const deficit = plan.targetKmMin - planned;
    const extraMins = Math.min(35, Math.ceil(deficit * 5.8) + 5);
    if (extraMins > 0) {
      if (longRun.progression_marker?.long_run_minutes != null) {
        longRun.progression_marker.long_run_minutes += extraMins;
      } else {
        longRun.time_cap_minutes = (longRun.time_cap_minutes ?? 70) + extraMins;
      }
      planned = estimatePlannedRunKmFromSchedule(schedule);
      if (planned >= plan.targetKmMin) {
        return `Extended long-run cap toward ${plan.targetKmMin}–${plan.targetKmMax}km weekly run target.`;
      }
    }
  }

  if (planned < plan.targetKmMin) {
    for (const day of ["Thu", "Wed", "Fri", "Sat"] as DayKey[]) {
      const filler = schedule.find((d) => d.day === day && d.title === "Aerobic Support");
      const donor = schedule.find(
        (x) =>
          !isFiller(x) &&
          x.tags?.[0] === "aerobic_run" &&
          x.day !== "Mon" &&
          x.day !== "Sun"
      );
      if (filler && donor && swapScheduleDays(schedule, day, donor.day, roleByDay)) {
        planned = estimatePlannedRunKmFromSchedule(schedule);
        if (planned >= plan.targetKmMin - 4) {
          return `Promoted easy run over aerobic filler to meet run volume band (~${plan.targetKmMin}km).`;
        }
      }
    }
  }

  return null;
}

function repairBikeDurationGuidance(
  schedule: DayPlan[],
  ctx: WeekRepairContext
): string | null {
  let fixed = 0;
  for (const d of schedule) {
    const blob = `${d.title} ${(d.session?.main ?? []).join(" ")} ${(d.session?.notes ?? []).join(" ")}`;
    const isBikeAerobic =
      d.title === "Aerobic Support" ||
      d.tags?.includes("aerobic_support") ||
      d.tags?.includes("bike_z2_support") ||
      /easy z2 bike|bike flush|recovery bike/i.test(d.title);
    if (!isBikeAerobic) continue;
    if (/(\d{2}–\d{2}|\d{2}-\d{2})\s*min/i.test(blob)) continue;

    const kind = /recovery/i.test(d.title) ? "recovery" : "support";
    const g = bikeAerobicDurationGuidance(ctx.input, kind);
    d.session.main = [
      `${g.duration} easy bike / aerobic (guided window)`,
      ...(d.session.main ?? []).filter((m) => !/easy bike|aerobic support/i.test(m)),
    ];
    if (!d.session.notes) d.session.notes = [];
    d.session.notes.push(`${g.rpe} — conversational. ${g.note}`);
    fixed += 1;
  }
  return fixed > 0 ? `Added bike/aerobic duration guidance to ${fixed} session(s).` : null;
}

/** Break 3+ consecutive high-stress days by swapping a mid-chain hard day with an easy day. */
function repairBreakHardChains(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>
): string | null {
  const protectMon = sundayLongOrHardProtectsMonday(schedule);
  const easySwapDays = (
    protectMon ? ["Tue", "Wed", "Fri"] : ["Mon", "Tue", "Wed", "Fri"]
  ) as DayKey[];

  for (let attempt = 0; attempt < 5; attempt++) {
    const rhythm = analyzeWeeklyRhythm(schedule, roleByDay);
    if (rhythm.max_consecutive_hard < 3) {
      return attempt > 0 ? "Broke consecutive hard-day chain(s)." : null;
    }

    let run = 0;
    let runStart = 0;
    let longest = { length: 0, start: 0 };
    for (let i = 0; i < DAY_ORDER.length; i++) {
      const dayKey = DAY_ORDER[i]!;
      const d = schedule.find((x) => x.day === dayKey);
      const stress = d
        ? classifyDayPlan(d, roleByDay.get(dayKey)).session_stress
        : "low";
      if (d && !isFiller(d) && stress === "high") {
        if (run === 0) runStart = i;
        run += 1;
      } else {
        if (run > longest.length) longest = { length: run, start: runStart };
        run = 0;
      }
    }
    if (run > longest.length) longest = { length: run, start: runStart };
    if (longest.length < 3) return attempt > 0 ? "Broke consecutive hard-day chain(s)." : null;

    const mid = DAY_ORDER[longest.start + Math.floor(longest.length / 2)]!;
    if (protectMon && mid === "Mon") return null;

    let swapped = false;
    for (const hardIdx of Array.from({ length: longest.length }, (_, k) => longest.start + k)) {
      const hardDay = DAY_ORDER[hardIdx]!;
      if (protectMon && hardDay === "Mon") continue;
      for (const easyDay of easySwapDays) {
        if (easyDay === hardDay) continue;
        const dEasy = schedule.find((d) => d.day === easyDay);
        if (!dEasy || !isEasyActiveDay(dEasy, roleByDay.get(easyDay))) continue;
        if (swapScheduleDays(schedule, hardDay, easyDay, roleByDay)) {
          swapped = true;
          break;
        }
      }
      if (swapped) break;
    }
    if (!swapped) break;
  }

  return null;
}

function repairConsecutiveHard(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>
): string | null {
  const before = analyzeWeeklyRhythm(schedule, roleByDay);
  if (before.max_consecutive_hard < 3) return null;

  repairBreakHardChains(schedule, roleByDay);

  const balanced = balanceScheduleHardEasy(schedule, roleByDay);
  schedule.splice(0, schedule.length, ...balanced);

  repairBreakHardChains(schedule, roleByDay);

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
    const plan = ctx.runVolumePlan;
    if (plan) {
      const plannedKm = estimatePlannedRunKmFromSchedule(schedule);
      if (plannedKm < plan.targetKmMin - 4) {
        issues.push(
          `Planned run volume ~${plannedKm}km below target ${plan.targetKmMin}–${plan.targetKmMax}km for current band.`
        );
      }
    }
  }

  for (const d of schedule) {
    if (d.run_prescription && /hyrox lower|lower_strength_hyrox/i.test(`${d.title} ${d.progression_family ?? ""}`)) {
      issues.push(`Non-run session "${d.title}" still has run prescription — structure constraint.`);
    }
    if (
      /bike|flush/i.test(d.title) &&
      !/(\d{2}–\d{2}|\d{2}-\d{2})\s*min/i.test(`${d.title} ${(d.session?.main ?? []).join(" ")}`)
    ) {
      issues.push(`"${d.title}" may lack explicit bike/aerobic duration guidance.`);
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
  weekSwapOptions = ctx.input.hyrox_track?.active
    ? { protect_sunday_long: true, allow_filler_swap: true }
    : undefined;

  const passes: Array<() => string | null> = [
    () => repairStripRunPrescription(schedule),
    () => repairLegsBeforeThreshold(schedule, roleByDay),
    () => repairModerateStressChains(schedule, roleByDay),
    () => repairConsecutiveHard(schedule, roleByDay),
    () => repairHardDayCap(schedule, roleByDay, ctx.input),
    () => repairRunExposureMinimum(schedule, roleByDay, ctx),
    () => repairRunVolumeBandCompliance(schedule, roleByDay, ctx),
    () => repairBikeDurationGuidance(schedule, ctx),
    () => repairCalfIsoOnHyroxLower(schedule),
    () => repairErgThresholdSupport(schedule as DayPlanWithDouble[], ctx),
    () => repairLegsBeforeThreshold(schedule, roleByDay),
    () => repairModerateStressChains(schedule, roleByDay),
    () => repairRunVolumeBandCompliance(schedule, roleByDay, ctx),
    () => repairConsecutiveHard(schedule, roleByDay),
    () => repairStripRunPrescription(schedule),
    () => repairBreakHardChains(schedule, roleByDay),
    () => repairConsecutiveHard(schedule, roleByDay),
    () => repairBreakHardChains(schedule, roleByDay),
    () => {
      const before = analyzeWeeklyRhythm(schedule, roleByDay).max_consecutive_hard;
      if (before < 3) return null;
      const balanced = balanceScheduleHardEasy(schedule, roleByDay);
      schedule.splice(0, schedule.length, ...balanced);
      const after = analyzeWeeklyRhythm(schedule, roleByDay).max_consecutive_hard;
      return after < before ? "Final hard/easy rebalance for weekly rhythm." : null;
    },
    () => repairSundayLongAnchor(schedule, roleByDay, ctx),
    () => repairMondayAfterSunday(schedule, roleByDay),
    () => repairBreakHardChains(schedule, roleByDay),
  ];

  for (const pass of passes) {
    const msg = pass();
    if (msg) repairsApplied.push(msg);
  }

  weekSwapOptions = undefined;

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
