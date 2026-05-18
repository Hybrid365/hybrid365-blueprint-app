/**
 * Erg threshold as support volume — never replaces the weekly run threshold anchor.
 */

import type { BlueprintInput } from "./buildWeekBlueprint";
import type { DoubleSessionDetail, DayPlanWithDouble } from "./doubleSessionPlanner";
import { applyProgressionFamily, getProgressionFamily } from "./progressionFamilies";
import type { DayKey, DayPlan } from "./sessionLibrary";
import {
  ergThresholdModalityForWeek,
  hasRunThresholdAnchor,
  isRunThresholdAnchorDay,
  shouldAddErgThresholdSupport,
} from "./thresholdVolumeTracking";

export const RUN_THRESHOLD_ANCHOR_COACHING_NOTE =
  "Run threshold remains the anchor. Extra threshold volume is added through ergs/bike to build the engine without unnecessary impact.";

export const CALF_ISO_COACHING_NOTE =
  "Calf isometrics are included to support lower-leg durability for running, sleds and lunges.";

export { hasRunThresholdAnchor, isRunThresholdAnchorDay } from "./thresholdVolumeTracking";

export function ergThresholdReplacedRunAnchor(schedule: DayPlan[]): boolean {
  const quality = schedule.filter(
    (d) =>
      d.tags?.[0] === "threshold_run" ||
      d.progression_family?.includes("threshold") ||
      /threshold/i.test(d.title)
  );
  if (quality.length === 0) return false;
  return (
    !hasRunThresholdAnchor(schedule) &&
    quality.some((d) => d.progression_family?.startsWith("erg_threshold_"))
  );
}

function isRecoveryLikeDay(day: DayPlan): boolean {
  const t0 = day.tags?.[0] ?? "";
  const t = day.title.toLowerCase();
  return t0 === "recovery" || t.includes("recovery") || t.includes("mobility");
}

function isLongRunDay(day: DayPlan): boolean {
  return day.tags?.[0] === "long_run" || /long run|long zone|long aerobic/i.test(day.title);
}

function buildErgSupportDouble(
  applied: ReturnType<typeof applyProgressionFamily>
): DoubleSessionDetail {
  return {
    enabled: true,
    label: "Optional Support",
    threshold_support: {
      progression_family: applied.family_id,
      progression_marker: applied.variant.marker,
    },
    secondary: {
      title: applied.variant.title,
      intent: "Erg threshold support — adds engine volume without replacing your run threshold anchor.",
      time_cap_minutes: 45,
      category: "aerobic",
      session: {
        main: [...applied.variant.main],
        notes: [
          applied.variant.coach_snippet,
          RUN_THRESHOLD_ANCHOR_COACHING_NOTE,
          "Optional support — skip if fatigue is high from the AM session.",
        ],
      },
      priority: {
        rank: 3,
        label: "P3",
        display_label: "Optional Support",
        category_label: "Threshold support",
        reason: "Erg threshold adds controlled engine work alongside the weekly run threshold anchor.",
      },
    },
  };
}

const ERG_SUPPORT_DAY_ORDER: DayKey[] = ["Wed", "Thu", "Fri", "Tue", "Sat"];

/** Attach erg threshold as PM/support double on a non-run-threshold day. */
export function applyErgThresholdSupportDoubles(args: {
  schedule: DayPlanWithDouble[];
  input: BlueprintInput;
  weekNumber: number;
  weekFocus?: string | null;
}): DayPlanWithDouble[] {
  const { input, weekNumber, weekFocus } = args;
  if (!shouldAddErgThresholdSupport(input, weekNumber)) return args.schedule;
  if (!hasRunThresholdAnchor(args.schedule)) return args.schedule;

  const alreadyHasErgSupport = args.schedule.some(
    (d) =>
      d.double_session?.threshold_support ||
      d.progression_family?.startsWith("erg_threshold_") ||
      /skierg|row\s*erg|bike.*threshold/i.test(d.double_session?.secondary.title ?? "")
  );
  if (alreadyHasErgSupport) return args.schedule;

  const mod = ergThresholdModalityForWeek(weekNumber);
  const family = getProgressionFamily(`erg_threshold_${mod}_a`);
  if (!family) return args.schedule;

  const applied = applyProgressionFamily(family, weekNumber, weekFocus);
  const runThrDay = args.schedule.find(isRunThresholdAnchorDay)?.day;
  const result = args.schedule.map((d) => ({ ...d }));

  for (const dayKey of ERG_SUPPORT_DAY_ORDER) {
    const idx = result.findIndex((d) => d.day === dayKey);
    if (idx < 0) continue;
    const day = result[idx]!;
    if (day.day === runThrDay) continue;
    if (isRecoveryLikeDay(day) || isLongRunDay(day)) continue;
    if (day.double_session?.enabled) continue;

    result[idx] = {
      ...day,
      double_session: buildErgSupportDouble(applied),
    };
    return result;
  }

  return result;
}
