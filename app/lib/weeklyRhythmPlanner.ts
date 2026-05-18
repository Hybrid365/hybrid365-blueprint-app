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
  run_aerobic: ["Mon", "Wed", "Fri", "Thu"],
  upper_full: ["Mon", "Wed", "Thu"],
  upper_primary: ["Mon", "Wed", "Thu", "Tue"],
  aerobic_support: ["Wed", "Thu", "Sat"],
  run_quality: ["Thu", "Tue", "Wed", "Fri"],
  run_quality_beginner: ["Thu", "Wed", "Tue"],
  lower_primary: ["Tue", "Fri", "Thu"],
  lower_full: ["Tue", "Fri", "Wed"],
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

function hyroxOpenScheduling(input: BlueprintInput): boolean {
  const ctx = input.hyrox_track;
  if (!ctx?.active) return false;
  return ctx.hyrox_event_type === "open" || ctx.hyrox_event_type === "unknown";
}

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

  if (hyroxOpenScheduling(input)) {
    if (role === "run_long") candidates = ["Sun", "Sat", ...candidates.filter((d) => d !== "Sun")];
    if (role === "run_aerobic" || role === "upper_primary" || role === "upper_full") {
      candidates = ["Mon", "Wed", ...candidates.filter((d) => d !== "Mon")];
    }
    if (role === "run_quality" && !userKeyDays?.has("Mon")) {
      candidates = candidates.filter((d) => d !== "Mon");
    }
    if (isHardRole(role) && !userKeyDays?.has("Mon")) {
      candidates = candidates.filter((d) => d !== "Mon");
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
export function balanceScheduleHardEasy(
  schedule: DayPlan[],
  roleByDay: Map<DayKey, StructureRole>
): DayPlan[] {
  const days = [...schedule];
  const maxPasses = 4;

  for (let pass = 0; pass < maxPasses; pass++) {
    const before = analyzeWeeklyRhythm(days, roleByDay);
    if (before.max_consecutive_hard < 3) break;

    let improved = false;
    for (let i = 0; i < days.length; i++) {
      for (let j = i + 1; j < days.length; j++) {
        const a = days[i]!;
        const b = days[j]!;
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
        if (
          after.max_consecutive_hard < before.max_consecutive_hard ||
          (after.max_consecutive_hard === before.max_consecutive_hard &&
            after.hard_day_count < before.hard_day_count)
        ) {
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
