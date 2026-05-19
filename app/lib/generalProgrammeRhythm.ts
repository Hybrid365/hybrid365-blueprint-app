/**
 * Non-HYROX programme rhythm — hard/easy alternation, run caps, strength balance.
 * HYROX Pro uses hyroxProWeeklySkeleton; this module covers running / hybrid / muscle paths.
 */

import type { BlueprintInput } from "./buildWeekBlueprint";
import { bikeAerobicDurationGuidance } from "./aerobicSessionGuidance";
import {
  countHardRunExposures,
  isFloatOrIntervalQuality,
  isHardRunExposure,
  listHardRunExposureDays,
} from "./hyroxRunIntensityPolicy";
import type { DayKey, DayPlan, StructureRole } from "./sessionLibrary";
import {
  analyzeWeeklyRhythm,
  classifyDayPlan,
} from "./sessionStressClassification";
import { hasRunThresholdAnchor, isRunThresholdAnchorDay } from "./thresholdVolumeTracking";

const DAY_ORDER: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const LOW_IMPACT_AEROBIC_NOTE =
  "Low-impact aerobic work helps build the engine without stealing recovery from your key runs or strength sessions.";

export const FITNESS_TEST_COACHING_NOTE =
  "Test piece — controlled hard. Record your time and repeat later to measure fitness progress.";

export function isNonHyroxProgramme(input: BlueprintInput): boolean {
  return !input.hyrox_track?.active;
}

export function isLowImpactProfile(input: BlueprintInput): boolean {
  return Boolean(
    input.has_injury ||
    /low.?impact|knee|avoid running|minimal running|injury/i.test(input.notes ?? "")
  );
}

export function shouldPreferLowImpactEngine(input: BlueprintInput): boolean {
  if (!isNonHyroxProgramme(input)) return false;
  return (
    isLowImpactProfile(input) ||
    input.goal_focus === "muscle" ||
    (input.goal_focus === "hybrid" && input.ability_level === "beginner")
  );
}

/** Hard run exposure cap by goal + level (non-HYROX). */
export function maxHardRunExposuresForGoal(
  input: BlueprintInput,
  weekNumber: number,
  weekFocus?: string | null
): number {
  if (weekFocus?.includes("deload")) return 1;
  const level = input.ability_level;

  if (input.goal_focus === "muscle") {
    if (level === "beginner") return 0;
    return 1;
  }

  if (input.goal_focus === "running") {
    if (level === "beginner") return 1;
    if (level === "intermediate") return 2;
    if (weekNumber <= 3) return 2;
    if (weekNumber >= 8 && level === "advanced") return 3;
    return 2;
  }

  // general hybrid
  if (level === "beginner") return 1;
  if (level === "intermediate") return 2;
  if (level === "advanced" && weekNumber >= 9) return 3;
  return 2;
}

export function hasBackToBackHardRuns(
  schedule: DayPlan[],
  roleByDay?: Map<DayKey, StructureRole>
): boolean {
  for (let i = 0; i < DAY_ORDER.length - 1; i++) {
    const d0 = schedule.find((d) => d.day === DAY_ORDER[i]);
    const d1 = schedule.find((d) => d.day === DAY_ORDER[i + 1]);
    if (!d0 || !d1) continue;
    if (
      isHardRunExposure(d0, roleByDay?.get(d0.day)) &&
      isHardRunExposure(d1, roleByDay?.get(d1.day))
    ) {
      return true;
    }
  }
  return false;
}

export function listBackToBackHardRunPairs(
  schedule: DayPlan[],
  roleByDay?: Map<DayKey, StructureRole>
): Array<{ dayA: DayKey; dayB: DayKey }> {
  const out: Array<{ dayA: DayKey; dayB: DayKey }> = [];
  for (let i = 0; i < DAY_ORDER.length - 1; i++) {
    const dayA = DAY_ORDER[i]!;
    const dayB = DAY_ORDER[i + 1]!;
    const d0 = schedule.find((d) => d.day === dayA);
    const d1 = schedule.find((d) => d.day === dayB);
    if (!d0 || !d1) continue;
    if (
      isHardRunExposure(d0, roleByDay?.get(dayA)) &&
      isHardRunExposure(d1, roleByDay?.get(dayB))
    ) {
      out.push({ dayA, dayB });
    }
  }
  return out;
}

function sessionBlob(day: DayPlan): string {
  return [
    day.title,
    day.template_id ?? "",
    ...(day.tags ?? []),
    ...(day.session?.main ?? []),
    ...(day.session?.notes ?? []),
    day.progression_family ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export function isHeavyLowerDay(day: DayPlan, role?: StructureRole): boolean {
  const t0 = day.tags?.[0] ?? "";
  if (role === "lower_primary" || role === "lower_full" || role === "full_body_strength") {
    const stress = classifyDayPlan(day, role).session_stress;
    if (stress !== "low") return true;
  }
  if (t0 === "strength_lower" && classifyDayPlan(day, role).session_stress !== "low") {
    return true;
  }
  return /lower strength|leg strength|hyrox lower|full.?body strength/i.test(sessionBlob(day));
}

export function isUpperBodyStrengthDay(day: DayPlan, role?: StructureRole): boolean {
  const t0 = day.tags?.[0] ?? "";
  if (role === "upper_primary" || role === "upper_full") return true;
  if (t0 === "strength_upper") return true;
  return /upper strength|upper hypertrophy|upper pull|upper push|pull.?day|push.?day/i.test(
    sessionBlob(day)
  );
}

export function isFitnessBenchmarkSession(day: DayPlan): boolean {
  const blob = sessionBlob(day);
  if (/test piece|fitness test|benchmark test|record your time/i.test(blob)) return true;
  if (/for time:/i.test(blob) && /1\s*km\s*row|1\s*km\s*ski|20\s*push/i.test(blob)) {
    return true;
  }
  return false;
}

export function isShortFinisherSession(day: DayPlan): boolean {
  const blob = sessionBlob(day);
  return (
    /\b(emom|amrap)\b/i.test(blob) ||
    /finisher|pump circuit|carry.*plank/i.test(blob) ||
    (day.session?.finish?.length ?? 0) > 0
  );
}

export function finisherTooIntenseBeforeKeyDay(
  day: DayPlan,
  nextDay: DayPlan | undefined,
  role?: StructureRole,
  nextRole?: StructureRole
): boolean {
  if (!isShortFinisherSession(day)) return false;
  if (!nextDay) return false;
  const stress = classifyDayPlan(day, role).session_stress;
  if (stress === "low") return false;
  if (
    isHardRunExposure(nextDay, nextRole) ||
    isHeavyLowerDay(nextDay, nextRole) ||
    isRunThresholdAnchorDay(nextDay)
  ) {
    return stress === "high" || (stress === "moderate" && isHeavyLowerDay(day, role));
  }
  return false;
}

export function sessionViolatesEasySlot(day: DayPlan, role?: StructureRole): boolean {
  if (isHardRunExposure(day, role)) return true;
  if (isFloatOrIntervalQuality(day)) return true;
  if (isHeavyLowerDay(day, role)) return true;
  if (isFitnessBenchmarkSession(day)) return true;
  const stress = classifyDayPlan(day, role).session_stress;
  if (stress === "high") return true;
  const blob = sessionBlob(day);
  if (/stride|pickup|on\s*\/\s*off|float/i.test(blob) && role === "run_aerobic") return true;
  return false;
}

export function countStrengthExposures(schedule: DayPlan[]): number {
  let n = 0;
  for (const d of schedule) {
    const t0 = d.tags?.[0] ?? "";
    if (
      t0.startsWith("strength") ||
      t0 === "hybrid_compromised" ||
      /strength|circuit|hypertrophy|functional/i.test(d.title)
    ) {
      n += 1;
    }
  }
  return n;
}

export function countUpperBodySessions(schedule: DayPlan[]): number {
  let n = 0;
  for (const d of schedule) {
    if (isUpperBodyStrengthDay(d)) n += 1;
  }
  return n;
}

export function hasLowImpactAerobicSupport(schedule: DayPlan[]): boolean {
  return schedule.some((d) => {
    const blob = sessionBlob(d);
    return (
      d.tags?.includes("aerobic_support") ||
      d.tags?.includes("bike_z2_support") ||
      /easy z2 bike|bike flush|row.*z2|ski.*z2|aerobic support|low-impact/i.test(blob)
    );
  });
}

export function hasBackToBackImpactDays(
  schedule: DayPlan[],
  roleByDay?: Map<DayKey, StructureRole>
): boolean {
  for (let i = 0; i < DAY_ORDER.length - 1; i++) {
    const d0 = schedule.find((d) => d.day === DAY_ORDER[i]);
    const d1 = schedule.find((d) => d.day === DAY_ORDER[i + 1]);
    if (!d0 || !d1) continue;
    const impact0 =
      isHardRunExposure(d0, roleByDay?.get(d0.day)) ||
      (d0.tags?.[0] === "long_run") ||
      (d0.tags?.[0] === "aerobic_run" && classifyDayPlan(d0).session_stress !== "low");
    const impact1 =
      isHardRunExposure(d1, roleByDay?.get(d1.day)) ||
      (d1.tags?.[0] === "long_run") ||
      (d1.tags?.[0] === "aerobic_run" && classifyDayPlan(d1).session_stress !== "low");
    if (impact0 && impact1) return true;
  }
  return false;
}

export function benchmarkPlacedBeforeKeySession(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>
): string | null {
  for (let i = 0; i < DAY_ORDER.length - 1; i++) {
    const dayA = DAY_ORDER[i]!;
    const dayB = DAY_ORDER[i + 1]!;
    const a = schedule.find((d) => d.day === dayA);
    const b = schedule.find((d) => d.day === dayB);
    if (!a || !b) continue;
    if (!isFitnessBenchmarkSession(a)) continue;
    if (
      isHardRunExposure(b, roleByDay.get(dayB)) ||
      isHeavyLowerDay(b, roleByDay.get(dayB)) ||
      isRunThresholdAnchorDay(b)
    ) {
      return `${dayA} test/benchmark before ${dayB} key session`;
    }
  }
  return null;
}

export function downgradeDayToEasyBikeGeneral(
  day: DayPlan,
  input: BlueprintInput,
  roleByDay: Map<DayKey, StructureRole>
): void {
  const g = bikeAerobicDurationGuidance(input, "support");
  day.template_id = "FILLER-AEROBIC";
  day.title = "Aerobic Support";
  day.intent = "Easy aerobic support — intensity reduced to protect weekly rhythm.";
  day.tags = ["aerobic_support", "aerobic", "bike_z2_support"];
  day.progression_family = undefined;
  day.progression_marker = undefined;
  day.run_prescription = undefined;
  day.double_session = undefined;
  day.session = {
    main: [`${g.duration} easy Z2 bike, row, or ski`],
    notes: [g.rpe + " — conversational.", g.note, LOW_IMPACT_AEROBIC_NOTE],
  };
  day.time_cap_minutes = 50;
  roleByDay.set(day.day, "run_aerobic");
}

export function appendLowImpactCoachingNotes(
  schedule: DayPlan[],
  input: BlueprintInput
): number {
  if (!shouldPreferLowImpactEngine(input)) return 0;
  let n = 0;
  for (const d of schedule) {
    const blob = sessionBlob(d);
    if (!/bike|row|ski|erg|aerobic support|low-impact/i.test(blob)) continue;
    if (!d.session.notes) d.session.notes = [];
    if (!d.session.notes.some((note) => note.includes(LOW_IMPACT_AEROBIC_NOTE.slice(0, 40)))) {
      d.session.notes.push(LOW_IMPACT_AEROBIC_NOTE);
      n += 1;
    }
  }
  return n;
}

export function appendFitnessTestNote(day: DayPlan): void {
  if (!isFitnessBenchmarkSession(day)) return;
  if (!day.session.notes) day.session.notes = [];
  if (!day.session.notes.some((n) => n.includes("Test piece"))) {
    day.session.notes.push(FITNESS_TEST_COACHING_NOTE);
  }
}

export type GeneralRhythmRepairResult = {
  message: string | null;
  hardRunPairsFixed: number;
  hardRunsDowngraded: number;
};

/** Post-generation repair for non-HYROX hard/easy rhythm. */
export function repairGeneralProgrammeRhythm(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>,
  input: BlueprintInput,
  weekNumber: number,
  weekFocus?: string | null
): GeneralRhythmRepairResult {
  if (!isNonHyroxProgramme(input)) {
    return { message: null, hardRunPairsFixed: 0, hardRunsDowngraded: 0 };
  }

  const repairs: string[] = [];
  let pairsFixed = 0;
  let downgraded = 0;
  const maxHard = maxHardRunExposuresForGoal(input, weekNumber, weekFocus);

  const pairs = listBackToBackHardRunPairs(schedule, roleByDay);
  for (const { dayB } of pairs) {
    const d = schedule.find((x) => x.day === dayB);
    if (!d || isRunThresholdAnchorDay(d)) continue;
    const prev = d.title;
    downgradeDayToEasyBikeGeneral(d, input, roleByDay);
    repairs.push(`eased back-to-back hard runs (${prev} on ${dayB})`);
    pairsFixed += 1;
    downgraded += 1;
  }

  if (input.goal_focus === "running" && weekNumber <= 3) {
    const qualityDays = schedule.filter(
      (d) => isHardRunExposure(d, roleByDay.get(d.day)) && !isRunThresholdAnchorDay(d)
    );
    if (qualityDays.length >= 2 && hasRunThresholdAnchor(schedule)) {
      for (const d of qualityDays) {
        if (isRunThresholdAnchorDay(d)) continue;
        if (!isFloatOrIntervalQuality(d) && d.tags?.[0] !== "interval_run") continue;
        const prev = d.title;
        downgradeDayToEasyBikeGeneral(d, input, roleByDay);
        repairs.push(`early running block: eased extra quality (${prev})`);
        downgraded += 1;
      }
    }
  }

  let guard = 0;
  while (countHardRunExposures(schedule, roleByDay) > maxHard && guard < 6) {
    guard += 1;
    const victims = listHardRunExposureDays(schedule, roleByDay, input)
      .filter((v) => v.priority < 10_000);
    const victim = victims[0];
    if (!victim) break;
    const prev = victim.dayPlan.title;
    downgradeDayToEasyBikeGeneral(victim.dayPlan, input, roleByDay);
    repairs.push(`hard run cap: downgraded ${prev} on ${victim.day}`);
    downgraded += 1;
  }

  const mon = schedule.find((d) => d.day === "Mon");
  const sun = schedule.find((d) => d.day === "Sun");
  if (mon && sun) {
    const sunLong =
      sun.tags?.[0] === "long_run" || /long run|long zone|long aerobic/i.test(sun.title);
    if (sunLong && sessionViolatesEasySlot(mon, roleByDay.get("Mon"))) {
      const prev = mon.title;
      downgradeDayToEasyBikeGeneral(mon, input, roleByDay);
      repairs.push(`Monday recovery after Sunday long (${prev})`);
      downgraded += 1;
    }
  }

  for (const day of ["Wed", "Fri", "Mon"] as DayKey[]) {
    const d = schedule.find((x) => x.day === day);
    if (!d) continue;
    const role = roleByDay.get(day);
    const isEasyRole =
      role === "run_aerobic" ||
      role === "aerobic_support" ||
      role === "recovery" ||
      role === "upper_primary" ||
      role === "upper_full";
    if (!isEasyRole) continue;
    if (!sessionViolatesEasySlot(d, role)) continue;
    const prev = d.title;
    if (isHeavyLowerDay(d, role)) continue;
    downgradeDayToEasyBikeGeneral(d, input, roleByDay);
    repairs.push(`${day} easy slot: eased ${prev}`);
    downgraded += 1;
  }

  const notesAdded = appendLowImpactCoachingNotes(schedule, input);
  if (notesAdded > 0) {
    repairs.push(`added low-impact coaching notes (${notesAdded} sessions)`);
  }

  for (const d of schedule) {
    appendFitnessTestNote(d);
  }

  const rhythm = analyzeWeeklyRhythm(schedule, roleByDay);
  if (rhythm.max_consecutive_hard >= 3) {
    repairs.push(`${rhythm.max_consecutive_hard} consecutive hard days — check spacing`);
  }

  return {
    message: repairs.length > 0 ? `General rhythm: ${repairs.join("; ")}.` : null,
    hardRunPairsFixed: pairsFixed,
    hardRunsDowngraded: downgraded,
  };
}
