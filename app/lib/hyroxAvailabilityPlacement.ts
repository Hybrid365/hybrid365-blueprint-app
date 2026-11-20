/**
 * Availability placement for the HYROX Pro week.
 *
 * Precedence, highest first:
 * 1. Pain / safety. A blocked or painful pattern is not given a session.
 * 2. Athlete availability. An unavailable day stays empty.
 * 3. Required weekly stimuli: one threshold, one HYROX key, one long run.
 * 4. Recovery spacing. Hard stimuli are not placed on adjacent days.
 * 5. Preferred calendar days. Tuesday, Saturday and Sunday are preferences.
 * 6. Supporting sessions, including lower strength, fill days that remain.
 *
 * A preferred Sunday long run does not override "Sunday unavailable".
 * Stimulus anchors are not calendar-day anchors.
 */

import type { DayKey, StructureRole } from "./sessionLibrary";
import type { HyroxSkeletonDayRole } from "./hyroxProWeeklySkeleton";

export const PROGRAMME_CONFIGURATION_REQUIRED = "PROGRAMME_CONFIGURATION_REQUIRED";

const ORDER: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const THRESHOLD_DAYS: DayKey[] = ["Tue", "Thu", "Wed", "Fri", "Sat", "Mon", "Sun"];
const HYROX_DAYS: DayKey[] = ["Sat", "Thu", "Fri", "Wed", "Tue", "Mon", "Sun"];
const LONG_DAYS: DayKey[] = ["Sun", "Sat", "Fri", "Thu", "Wed", "Tue", "Mon"];
const LOWER_DAYS: DayKey[] = ["Thu", "Wed", "Fri", "Mon", "Sat", "Tue", "Sun"];
const RECOVERY_DAYS: DayKey[] = ["Mon", "Wed", "Fri", "Thu", "Tue", "Sat", "Sun"];

export type WeekStimulus = "threshold" | "hyrox" | "long" | "lower" | "recovery" | "aerobic";

export type StimulusPlacement = {
  day: DayKey;
  stimulus: WeekStimulus;
  role: StructureRole;
  skeleton: HyroxSkeletonDayRole;
};

type PlacementResult =
  | { ok: true; days: StimulusPlacement[]; dropped: WeekStimulus[] }
  | { ok: false; code: typeof PROGRAMME_CONFIGURATION_REQUIRED; reason: string };

function index(day: DayKey): number {
  return ORDER.indexOf(day);
}

function adjacent(a: DayKey, b: DayKey): boolean {
  return Math.abs(index(a) - index(b)) === 1;
}

function preference(day: DayKey, order: DayKey[]): number {
  const at = order.indexOf(day);
  return at < 0 ? 0 : (order.length - at) * 10;
}

function roleFor(stimulus: WeekStimulus): { role: StructureRole; skeleton: HyroxSkeletonDayRole } {
  if (stimulus === "threshold") return { role: "run_quality", skeleton: "hard" };
  if (stimulus === "hyrox") return { role: "hybrid_primary", skeleton: "hard" };
  if (stimulus === "long") return { role: "run_long", skeleton: "long_aerobic" };
  if (stimulus === "lower") return { role: "lower_primary", skeleton: "hard" };
  if (stimulus === "recovery") return { role: "recovery", skeleton: "recovery" };
  return { role: "aerobic_support", skeleton: "easy" };
}

export function placeHyroxWeek(args: {
  availableDays: DayKey[];
  locked?: Partial<Record<DayKey, WeekStimulus>>;
}): PlacementResult {
  const available = ORDER.filter((day) => args.availableDays.includes(day));
  const locked = args.locked ?? {};
  for (const [day, stimulus] of Object.entries(locked) as Array<[DayKey, WeekStimulus]>) {
    if (!available.includes(day)) {
      return {
        ok: false,
        code: PROGRAMME_CONFIGURATION_REQUIRED,
        reason: `${stimulus} is locked to ${day}, and ${day} is unavailable.`,
      };
    }
  }

  const open = (day: DayKey, stimulus: WeekStimulus) => locked[day] == null || locked[day] === stimulus;
  const lockedHard = (Object.entries(locked) as Array<[DayKey, WeekStimulus]>)
    .filter(([, stimulus]) => stimulus === "lower" || stimulus === "threshold" || stimulus === "hyrox")
    .map(([day]) => day);
  let best: { score: number; key: string; threshold: DayKey; hyrox: DayKey; long: DayKey } | null = null;

  for (const threshold of available) {
    if (!open(threshold, "threshold")) continue;
    for (const hyrox of available) {
      if (hyrox === threshold || !open(hyrox, "hyrox")) continue;
      if (adjacent(threshold, hyrox)) continue;
      if (lockedHard.some((day) => day !== threshold && day !== hyrox && (adjacent(day, threshold) || adjacent(day, hyrox)))) continue;
      for (const long of available) {
        if (long === threshold || long === hyrox || !open(long, "long")) continue;
        const hard = [threshold, hyrox, ...Object.entries(locked).filter(([, stimulus]) => stimulus === "lower").map(([day]) => day as DayKey)];
        const touches = hard.filter((day) => adjacent(long, day)).length;
        if (touches >= 2) continue;
        const score =
          preference(threshold, THRESHOLD_DAYS) +
          preference(hyrox, HYROX_DAYS) +
          preference(long, LONG_DAYS) -
          touches * 25;
        const key = `${threshold}|${hyrox}|${long}`;
        if (!best || score > best.score || (score === best.score && key < best.key)) {
          best = { score, key, threshold, hyrox, long };
        }
      }
    }
  }

  if (!best) {
    return {
      ok: false,
      code: PROGRAMME_CONFIGURATION_REQUIRED,
      reason: "Threshold, HYROX and the long run do not fit these days without stacking hard sessions.",
    };
  }

  const used = new Map<DayKey, WeekStimulus>([
    [best.threshold, "threshold"],
    [best.hyrox, "hyrox"],
    [best.long, "long"],
  ]);
  for (const [day, stimulus] of Object.entries(locked) as Array<[DayKey, WeekStimulus]>) {
    if (!used.has(day)) used.set(day, stimulus);
  }

  const dropped: WeekStimulus[] = [];
  const lowerDay = LOWER_DAYS.find((day) => available.includes(day) && !used.has(day) && ![...used.entries()].some(([placed, stimulus]) => (stimulus === "threshold" || stimulus === "hyrox" || stimulus === "lower") && adjacent(day, placed)));
  if (lowerDay && locked[lowerDay] == null) used.set(lowerDay, "lower");
  else if (![...used.values()].includes("lower")) dropped.push("lower");

  const recoveryDay = RECOVERY_DAYS.find((day) => available.includes(day) && !used.has(day));
  if (recoveryDay) used.set(recoveryDay, "recovery");

  for (const day of available) {
    if (!used.has(day)) used.set(day, "aerobic");
  }

  const days = [...used.entries()]
    .sort((a, b) => index(a[0]) - index(b[0]))
    .map(([day, stimulus]) => ({ day, stimulus, ...roleFor(stimulus) }));

  return { ok: true, days, dropped };
}
