/**
 * Hard/easy weekly rhythm — preferred day slots and schedule balancing.
 */

import type { BlueprintInput } from "./buildWeekBlueprint";
import type { DayKey, DayPlan, StructureRole } from "./sessionLibrary";
import type { ParsedConstraints } from "./parseConstraints";
import {
  analyzeWeeklyRhythm,
  classifyDayPlan,
  type SessionStressLevel,
} from "./sessionStressClassification";

const ALL_DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Preferred day order per structure role (first = best). */
const ROLE_DAY_PREFERENCE: Record<StructureRole, DayKey[]> = {
  run_long: ["Sun", "Sat", "Fri"],
  recovery: ["Mon", "Wed", "Sun"],
  run_aerobic: ["Mon", "Wed", "Fri", "Thu", "Tue"],
  upper_full: ["Mon", "Wed", "Thu"],
  upper_primary: ["Mon", "Wed", "Thu", "Tue"],
  aerobic_support: ["Wed", "Thu", "Sat"],
  run_quality: ["Thu", "Wed", "Tue", "Fri"],
  run_quality_beginner: ["Thu", "Wed", "Tue"],
  lower_primary: ["Fri", "Thu", "Tue"],
  lower_full: ["Fri", "Thu", "Tue"],
  full_body_strength: ["Tue", "Sat", "Thu"],
  hybrid_primary: ["Sat", "Thu", "Fri"],
  hybrid_density: ["Wed", "Sat", "Fri"],
};

function parsePreferredSet(preferred?: string[]): Set<DayKey> {
  const out = new Set<DayKey>();
  if (!preferred?.length) return out;
  const labels: Record<string, DayKey> = {
    mon: "Mon",
    monday: "Mon",
    tue: "Tue",
    tuesday: "Tue",
    wed: "Wed",
    wednesday: "Wed",
    thu: "Thu",
    thursday: "Thu",
    fri: "Fri",
    friday: "Fri",
    sat: "Sat",
    saturday: "Sat",
    sun: "Sun",
    sunday: "Sun",
  };
  for (const raw of preferred) {
    const d = labels[raw.trim().toLowerCase()];
    if (d) out.add(d);
  }
  return out;
}

function isHardRole(role: StructureRole): boolean {
  return (
    role === "run_quality" ||
    role === "hybrid_primary" ||
    role === "hybrid_density" ||
    role === "lower_primary" ||
    role === "lower_full" ||
    role === "full_body_strength"
  );
}

function hyroxRhythmScheduling(input: BlueprintInput): boolean {
  return Boolean(input.hyrox_track?.active);
}

function generalRhythmScheduling(input: BlueprintInput): boolean {
  return !input.hyrox_track?.active;
}

const MONDAY_EASY_ROLES = new Set<StructureRole>([
  "run_aerobic",
  "upper_primary",
  "upper_full",
  "recovery",
]);

const MONDAY_BLOCKED_HARD_ROLES = new Set<StructureRole>([
  "run_quality",
  "run_quality_beginner",
  "hybrid_primary",
  "hybrid_density",
  "lower_primary",
  "lower_full",
  "full_body_strength",
]);

/**
 * Pick calendar day for a structure role — Sunday long / Monday easier for HYROX Open.
 */
export function pickDayForRole(args: {
  role: StructureRole;
  fallbackDay: DayKey;
  assignedDays: Set<DayKey>;
  parsedConstraints: ParsedConstraints;
  input: BlueprintInput;
  isRunSession: boolean;
}): DayKey {
  const { role, fallbackDay, assignedDays, parsedConstraints, input, isRunSession } = args;
  const preferredUser = parsePreferredSet(input.preferred_days);
  const userKeyDays = preferredUser.size > 0 ? preferredUser : null;

  let candidates = [...(ROLE_DAY_PREFERENCE[role] ?? ALL_DAYS)];

  if (hyroxRhythmScheduling(input)) {
    if (role === "run_long") {
      candidates = ["Sun", "Sat", "Fri", ...candidates.filter((d) => d !== "Sun")];
    }
    if (MONDAY_EASY_ROLES.has(role)) {
      candidates = ["Mon", "Wed", "Thu", ...candidates.filter((d) => d !== "Mon")];
    }
    if (role === "run_aerobic" && input.ability_level !== "beginner") {
      candidates = ["Mon", "Wed", "Fri", ...candidates.filter((d) => d !== "Mon")];
    }
    if (MONDAY_BLOCKED_HARD_ROLES.has(role) && !userKeyDays?.has("Mon")) {
      candidates = candidates.filter((d) => d !== "Mon");
    }
    if (role === "run_quality" && !userKeyDays?.has("Mon")) {
      candidates = candidates.filter((d) => d !== "Mon");
    }
  } else if (generalRhythmScheduling(input)) {
    if (role === "run_long") {
      candidates = ["Sun", "Sat", "Fri", ...candidates.filter((d) => d !== "Sun")];
    }
    if (role === "run_quality" || role === "run_quality_beginner") {
      candidates = ["Tue", "Thu", "Sat", ...candidates.filter((d) => d !== "Mon")];
      if (!userKeyDays?.has("Mon")) {
        candidates = candidates.filter((d) => d !== "Mon");
      }
    }
    if (role === "upper_primary" || role === "upper_full") {
      candidates = ["Mon", "Wed", "Thu", "Fri", ...candidates.filter((d) => !["Tue", "Sat"].includes(d))];
    }
    if (role === "aerobic_support") {
      candidates = ["Wed", "Mon", "Fri", "Thu", ...candidates];
    }
    if (role === "lower_primary" || role === "lower_full") {
      candidates = ["Fri", "Thu", "Tue", ...candidates.filter((d) => d !== "Sun")];
    }
    if (MONDAY_EASY_ROLES.has(role) || role === "recovery") {
      candidates = ["Mon", "Wed", ...candidates.filter((d) => d !== "Mon")];
    }
    if (MONDAY_BLOCKED_HARD_ROLES.has(role) && !userKeyDays?.has("Mon")) {
      candidates = candidates.filter((d) => d !== "Mon");
    }
    if (input.goal_focus === "muscle" && (role === "hybrid_primary" || role === "hybrid_density")) {
      candidates = ["Sat", "Thu", "Wed", ...candidates];
    }
    if (input.goal_focus === "running" && role === "hybrid_primary") {
      candidates = ["Sat", "Thu", ...candidates.filter((d) => d !== "Sun")];
    }
  }

  if (userKeyDays) {
    const boosted = [
      ...candidates.filter((d) => userKeyDays.has(d)),
      ...candidates.filter((d) => !userKeyDays.has(d)),
    ];
    candidates = boosted;
  }

  for (const day of candidates) {
    if (assignedDays.has(day)) continue;
    if (isRunSession && parsedConstraints.no_running_days.includes(day)) continue;
    return day;
  }

  for (const day of ALL_DAYS) {
    if (assignedDays.has(day)) continue;
    if (isRunSession && parsedConstraints.no_running_days.includes(day)) continue;
    return day;
  }

  return fallbackDay;
}

function stressRank(s: SessionStressLevel): number {
  if (s === "high") return 3;
  if (s === "moderate") return 2;
  return 1;
}

/**
 * Swap two non-filler sessions between days if it reduces consecutive hard days.
 */
function isLongAerobicAnchorDay(day: DayPlan): boolean {
  const t0 = day.tags?.[0] ?? "";
  return t0 === "long_run" || /long run|long zone|endurance long/i.test(day.title);
}

function sundayLongProtectsMonday(schedule: DayPlan[]): boolean {
  const sun = schedule.find((d) => d.day === "Sun");
  if (!sun) return false;
  if (sun.tags?.[0] === "long_run") return true;
  return /long run|long zone|long aerobic|long endurance/i.test(sun.title);
}

function mondayWouldBeHardAfterSwap(
  swapped: DayPlan[],
  protectMon: boolean
): boolean {
  if (!protectMon) return false;
  const mon = swapped.find((d) => d.day === "Mon");
  return mon ? classifyDayPlan(mon).session_stress === "high" : false;
}

export function balanceScheduleHardEasy(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>
): DayPlan[] {
  const days = [...schedule];
  const maxPasses = 16;
  const protectMon = sundayLongProtectsMonday(days);

  for (let pass = 0; pass < maxPasses; pass++) {
    const before = analyzeWeeklyRhythm(days, roleByDay);
    if (before.max_consecutive_hard < 3) break;

    let improved = false;
    for (let i = 0; i < ALL_DAYS.length; i++) {
      for (let j = i + 1; j < ALL_DAYS.length; j++) {
        const dayA = ALL_DAYS[i]!;
        const dayB = ALL_DAYS[j]!;
        const a = days.find((d) => d.day === dayA);
        const b = days.find((d) => d.day === dayB);
        if (!a || !b) continue;
        if (
          a.template_id?.startsWith("FILLER") ||
          b.template_id?.startsWith("FILLER") ||
          a.title === "Recovery / Mobility" ||
          b.title === "Recovery / Mobility"
        ) {
          continue;
        }

        const swapped = days.map((d) => {
          if (d.day === a.day) return { ...b, day: a.day };
          if (d.day === b.day) return { ...a, day: b.day };
          return d;
        });

        if (mondayWouldBeHardAfterSwap(swapped, protectMon)) continue;
        if (
          protectMon &&
          ((dayA === "Sun" && isLongAerobicAnchorDay(a)) ||
            (dayB === "Sun" && isLongAerobicAnchorDay(b)))
        ) {
          continue;
        }

        const ra = roleByDay.get(a.day);
        const rb = roleByDay.get(b.day);
        const newRoles = new Map(roleByDay);
        if (ra) {
          newRoles.delete(a.day);
          newRoles.set(b.day, ra);
        }
        if (rb) {
          newRoles.delete(b.day);
          newRoles.set(a.day, rb);
        }

        const after = analyzeWeeklyRhythm(swapped, newRoles);
        if (after.max_consecutive_hard < before.max_consecutive_hard) {
          days.splice(0, days.length, ...swapped);
          if (ra) roleByDay.set(b.day, ra);
          if (rb) roleByDay.set(a.day, rb);
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
    if (!improved) break;
  }

  return days;
}

export function appendRhythmCoachingNotes(
  schedule: DayPlan[],
  rhythm: ReturnType<typeof analyzeWeeklyRhythm>
): void {
  if (rhythm.coaching_notes.length === 0) return;
  const keyDay = schedule.find(
    (d) =>
      classifyDayPlan(d).session_role === "key" &&
      !d.template_id?.startsWith("FILLER")
  );
  const target = keyDay ?? schedule.find((d) => !d.template_id?.startsWith("FILLER"));
  if (!target?.session.notes) return;
  for (const note of rhythm.coaching_notes) {
    if (!target.session.notes!.some((n) => n.includes(note.slice(0, 40)))) {
      target.session.notes!.push(note);
    }
  }
}
