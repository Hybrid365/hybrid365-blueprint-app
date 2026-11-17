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
 * Tuesday is the threshold anchor, Sunday the long run, Saturday the HYROX key.
 * Thursday lower work is required, and its exact template can vary.
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
  if (args.day === "Tue" && args.role === "run_quality") {
    return { class: "HARD_ANCHOR", kind: "threshold_run", day: "Tue" };
  }
  if (args.day === "Sun" && args.role === "run_long") {
    return { class: "HARD_ANCHOR", kind: "long_run", day: "Sun" };
  }
  if (args.day === "Sat" && (args.role === "hybrid_primary" || args.role === "hybrid_density")) {
    return { class: "HARD_ANCHOR", kind: "hyrox_key", day: "Sat" };
  }
  if (args.day === "Thu" && (args.role === "lower_primary" || args.role === "lower_full")) {
    return { class: "REQUIRED_STIMULUS", kind: "lower_strength", day: "Thu" };
  }
  if (args.day === "Mon") return { class: "REQUIRED_STIMULUS", kind: "recovery", day: "Mon" };
  if (args.day === "Wed" || args.day === "Fri") return { class: "SUPPORTING", kind: "aerobic", day: args.day };
  return { class: "OPTIONAL", kind: "flexible", day: args.day };
}

export function immovableHardAnchorDays(
  input: BlueprintInput,
  weekNumber: number,
  weekFocus?: string | null
): DayKey[] {
  if (!shouldUseHyroxProWeeklySkeleton(input)) return [];
  if (isDoctrineDeloadWeek(weekNumber, weekFocus)) return [];
  return ["Tue", "Sat", "Sun"];
}
