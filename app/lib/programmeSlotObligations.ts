/**
 * Where a week already names a fixed key session, that session is an anchor.
 * Random choice stays inside the sessions that satisfy the anchor.
 * Repair may change flexible days. It may not remove the anchor.
 */

import type { BlueprintInput } from "./buildWeekBlueprint";
import { shouldUseHyroxProWeeklySkeleton } from "./hyroxProWeeklySkeleton";
import type { DayKey, SessionTemplate, StructureRole } from "./sessionLibrary";

export type ProgrammeSlotClass = "HARD_ANCHOR" | "REQUIRED_STIMULUS" | "SUPPORTING" | "OPTIONAL";

export type HardAnchorKind = "threshold_run" | "long_run" | "hyrox_key";

export type SlotObligation = {
  class: ProgrammeSlotClass;
  kind: HardAnchorKind | "lower_strength" | "recovery" | "aerobic" | "flexible";
  day: DayKey;
};

export function isDoctrineDeloadWeek(weekNumber: number, weekFocus?: string | null): boolean {
  if (weekFocus?.includes("deload")) return true;
  return weekNumber % 4 === 0;
}

export function sessionMeetsHardAnchor(session: SessionTemplate, kind: HardAnchorKind): boolean {
  if (kind === "threshold_run") return session.type === "threshold_run";
  if (kind === "long_run") return session.type === "long_run";
  const blob = `${session.name} ${session.type}`;
  return (
    session.type === "hybrid_compromised" ||
    session.type === "hybrid_density" ||
    (/hyrox|station|compromised/i.test(blob) && session.type !== "long_run")
  );
}

/**
 * HYROX Pro skeleton, outside a deload.
 * The anchors are the stimuli. Tuesday, Saturday and Sunday are only the
 * preferred days when the athlete can train then.
 */
export function hyroxProSlotObligation(args: {
  input: BlueprintInput;
  day: DayKey;
  role: StructureRole;
  weekNumber: number;
  weekFocus?: string | null;
}): SlotObligation | null {
  if (!shouldUseHyroxProWeeklySkeleton(args.input)) return null;
  if (isDoctrineDeloadWeek(args.weekNumber, args.weekFocus)) return null;
  if (args.role === "run_quality" || args.role === "run_quality_beginner") {
    return { class: "HARD_ANCHOR", kind: "threshold_run", day: args.day };
  }
  if (args.role === "run_long") {
    return { class: "HARD_ANCHOR", kind: "long_run", day: args.day };
  }
  if (args.role === "hybrid_primary" || args.role === "hybrid_density") {
    return { class: "HARD_ANCHOR", kind: "hyrox_key", day: args.day };
  }
  if (args.role === "lower_primary" || args.role === "lower_full") {
    return { class: "REQUIRED_STIMULUS", kind: "lower_strength", day: args.day };
  }
  if (args.role === "recovery") return { class: "REQUIRED_STIMULUS", kind: "recovery", day: args.day };
  if (args.role === "aerobic_support" || args.role === "run_aerobic") {
    return { class: "SUPPORTING", kind: "aerobic", day: args.day };
  }
  return { class: "OPTIONAL", kind: "flexible", day: args.day };
}

export function immovableHardAnchorDays(
  input: BlueprintInput,
  weekNumber: number,
  weekFocus?: string | null,
  roleByDay?: Map<DayKey, StructureRole>
): DayKey[] {
  if (!shouldUseHyroxProWeeklySkeleton(input)) return [];
  if (isDoctrineDeloadWeek(weekNumber, weekFocus)) return [];
  if (roleByDay) {
    return [...roleByDay.entries()]
      .filter(([, role]) => role === "run_quality" || role === "run_long" || role === "hybrid_primary" || role === "hybrid_density")
      .map(([day]) => day);
  }
  return ["Tue", "Sat", "Sun"];
}
