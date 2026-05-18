/**
 * HYROX Pro / advanced double-session progression ladder.
 * Run threshold stays the weekly anchor; PM work progresses aerobic → threshold+aerobic → double-threshold.
 */

import type { BlueprintInput } from "./buildWeekBlueprint";
import type {
  DoubleSessionDetail,
  DayPlanWithDouble,
  HyroxDoubleSessionIntent,
} from "./doubleSessionPlanner";
import { applyProgressionFamily, getProgressionFamily } from "./progressionFamilies";
import { RUN_THRESHOLD_ANCHOR_COACHING_NOTE } from "./ergThresholdSupport";
import type { DayKey, DayPlan, WeeklyHoursBand } from "./sessionLibrary";
import type { HyroxEventType } from "./hyroxTrackContext";
import {
  ergThresholdModalityForWeek,
  isRunThresholdAnchorDay,
} from "./thresholdVolumeTracking";
import type { SessionStressLevel } from "./sessionStressClassification";

export type HyroxDoublePhase =
  | "early_aerobic"
  | "deload"
  | "threshold_plus_aerobic"
  | "late_double_threshold"
  | "taper";

export type { HyroxDoubleSessionIntent } from "./doubleSessionPlanner";

export type HyroxDoubleWeekPlan = {
  phase: HyroxDoublePhase;
  week_coaching_note: string;
  max_doubles: number;
  allow_double_threshold: boolean;
  allow_sunday_strength_addon: boolean;
  allow_light_erg_threshold: boolean;
  double_days: DayKey[];
  selected_double_days: string[];
};

export type DoubleSessionWeekSummary = {
  phase: HyroxDoublePhase;
  selected_double_days: string[];
  double_count: number;
  aerobic_double_count: number;
  threshold_plus_aerobic_count: number;
  double_threshold_count: number;
  strength_endurance_addon_count: number;
  recovery_support_count: number;
  week_coaching_note: string;
};

const DAY_ORDER: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_DOUBLE_DAYS: DayKey[] = ["Tue", "Thu", "Sat"];

const BLOCKED_DOUBLE_DAYS: Set<DayKey> = new Set(["Mon"]);

function normalizeDayKey(raw: string): DayKey | null {
  const s = raw.trim().toLowerCase().slice(0, 3);
  const map: Record<string, DayKey> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };
  return map[s] ?? null;
}

function isDeloadWeek(weekNumber: number, weekFocus?: string | null): boolean {
  if (weekFocus?.includes("deload")) return true;
  return weekNumber % 4 === 0;
}

export function isHighVolumeAdvancedHyrox(input: BlueprintInput): boolean {
  const band = (input.hyrox_track?.current_run_volume_band ?? "").toLowerCase();
  return (
    input.weekly_hours_band === "10+" &&
    (/50-70|70km|70\+|high/.test(band) || band.includes("50"))
  );
}

export function shouldUseHyroxProDoubleProgression(input: BlueprintInput): boolean {
  if (!input.double_sessions || !input.hyrox_track?.active) return false;
  if (input.ability_level !== "advanced") return false;
  if (input.has_injury || input.hyrox_track.impact_risk === "high") return false;
  const event = input.hyrox_track.hyrox_event_type;
  return event === "pro" || event === "open" || event === "doubles";
}

export function resolveHyroxDoublePhase(
  weekNumber: number,
  weekFocus: string | null | undefined,
  eventType: HyroxEventType
): HyroxDoublePhase {
  if (weekNumber === 12 || /test_or_taper/i.test(weekFocus ?? "")) {
    return "taper";
  }
  if (isDeloadWeek(weekNumber, weekFocus)) return "deload";
  if (weekNumber <= 3) return "early_aerobic";
  if (weekNumber <= 7) return "threshold_plus_aerobic";
  if (weekNumber === 8) return "deload";
  if (eventType === "pro") return "late_double_threshold";
  return "threshold_plus_aerobic";
}

function phaseCoachingNote(phase: HyroxDoublePhase): string {
  switch (phase) {
    case "early_aerobic":
      return "Double days are aerobic only at this stage. The goal is to build durability and total engine volume before adding more threshold stress.";
    case "deload":
      return "Double sessions are reduced or kept easy so you absorb the previous build.";
    case "threshold_plus_aerobic":
      return "The run threshold remains the key session. The second session adds low-impact aerobic volume so fitness builds without extra run impact.";
    case "late_double_threshold":
      return "This block introduces a double-threshold day: run threshold plus Ski/Row threshold. This progresses engine volume while controlling impact.";
    case "taper":
      return "Double sessions stay easy or are removed — priority is freshness for test/race readiness.";
    default:
      return "";
  }
}

function maxDoublesForBand(band: WeeklyHoursBand): number {
  if (band === "2-3" || band === "3-5") return 0;
  if (band === "5-7") return 2;
  if (band === "7-10") return 3;
  return 3;
}

function pickErgModality(
  weekNumber: number,
  equipment: BlueprintInput["hyrox_track"] extends null ? never : NonNullable<BlueprintInput["hyrox_track"]>["equipment"]
): "ski" | "row" | "bike" {
  if (equipment.hasSkiErg) return ergThresholdModalityForWeek(weekNumber);
  if (equipment.hasRowErg) return "row";
  if (equipment.hasBike) return "bike";
  return "bike";
}

function pickAerobicModality(
  equipment: NonNullable<BlueprintInput["hyrox_track"]>["equipment"]
): "ski" | "row" | "bike" {
  if (equipment.hasBike) return "bike";
  if (equipment.hasRowErg) return "row";
  if (equipment.hasSkiErg) return "ski";
  return "bike";
}

export function resolveHyroxDoubleWeekPlan(args: {
  input: BlueprintInput;
  weekNumber: number;
  weekFocus?: string | null;
}): HyroxDoubleWeekPlan | null {
  if (!shouldUseHyroxProDoubleProgression(args.input)) return null;

  const eventType = args.input.hyrox_track!.hyrox_event_type;
  const phase = resolveHyroxDoublePhase(args.weekNumber, args.weekFocus, eventType);
  const preferred = (args.input.double_session_days ?? [])
    .map(normalizeDayKey)
    .filter((d): d is DayKey => d !== null && !BLOCKED_DOUBLE_DAYS.has(d));

  const double_days =
    preferred.length > 0
      ? [...new Set(preferred)].slice(0, maxDoublesForBand(args.input.weekly_hours_band))
      : DEFAULT_DOUBLE_DAYS.filter((d) => !BLOCKED_DOUBLE_DAYS.has(d)).slice(
          0,
          maxDoublesForBand(args.input.weekly_hours_band)
        );

  return {
    phase,
    week_coaching_note: phaseCoachingNote(phase),
    max_doubles: maxDoublesForBand(args.input.weekly_hours_band),
    allow_double_threshold:
      phase === "late_double_threshold" && eventType === "pro",
    allow_sunday_strength_addon:
      phase === "early_aerobic" || phase === "threshold_plus_aerobic",
    allow_light_erg_threshold:
      phase === "threshold_plus_aerobic" &&
      args.weekNumber === 7 &&
      isHighVolumeAdvancedHyrox(args.input) &&
      eventType === "pro",
    double_days,
    selected_double_days: double_days,
  };
}

function isLongRunDay(day: DayPlan): boolean {
  return day.tags?.[0] === "long_run" || /long run|long zone|long aerobic|long endurance/i.test(day.title);
}

function isEasyRunDay(day: DayPlan): boolean {
  const t0 = day.tags?.[0] ?? "";
  return t0 === "aerobic_run" || /easy run|z2 run|aerobic run/i.test(day.title);
}

function isHighFatigueMain(day: DayPlan): boolean {
  const t = day.title.toLowerCase();
  return (
    t.includes("threshold") ||
    t.includes("interval") ||
    t.includes("compromised") ||
    /race.?density|heavy lower/i.test(t)
  );
}

type DoubleMeta = {
  double_session_intent: HyroxDoubleSessionIntent;
  session_stress: SessionStressLevel;
  modality: "run" | "ski" | "row" | "bike" | "strength" | "recovery";
  threshold_minutes?: number;
  is_optional: boolean;
};

function withMeta(detail: DoubleSessionDetail, meta: DoubleMeta): DoubleSessionDetail {
  return { ...detail, ...meta };
}

function buildAerobicSupportDouble(
  modality: "ski" | "row" | "bike",
  dayLabel: string
): DoubleSessionDetail {
  const titles: Record<typeof modality, string> = {
    bike: "Easy Z2 Bike Flush",
    row: "Easy RowErg Z2",
    ski: "Easy SkiErg Z2",
  };
  const mains: Record<typeof modality, string[]> = {
    bike: [
      "25–30 min easy bike at Z2 (conversational, nose-breathe)",
      "HR stays controlled — this is engine volume, not a second key session",
    ],
    row: [
      "25 min continuous easy RowErg at Z2 pace",
      "Relaxed stroke rate — quality over split",
    ],
    ski: [
      "25 min continuous easy SkiErg at Z2 pace",
      "Hips and lats relaxed — build capacity without impact",
    ],
  };
  return withMeta(
    {
      enabled: true,
      label: "Optional Support",
      secondary: {
        title: titles[modality],
        intent: "Low-impact aerobic support — extends engine volume without adding threshold stress.",
        time_cap_minutes: 30,
        category: "aerobic",
        session: {
          main: mains[modality],
          notes: [
            "Optional support — skip if the AM session was demanding or legs feel heavy.",
            "Double days at this stage are aerobic only — durability before more threshold load.",
          ],
        },
        priority: {
          rank: 3,
          label: "P3",
          display_label: "Aerobic Support",
          category_label: "Double aerobic",
          reason: `PM ${modality} Z2 on ${dayLabel} builds total engine volume without competing with your main session.`,
        },
      },
    },
    {
      double_session_intent: "aerobic_support",
      session_stress: "low",
      modality,
      threshold_minutes: 0,
      is_optional: true,
    }
  );
}

function buildThresholdPlusAerobicDouble(
  modality: "ski" | "row" | "bike",
  dayLabel: string
): DoubleSessionDetail {
  const aerobic = buildAerobicSupportDouble(modality, dayLabel);
  return withMeta(aerobic, {
    double_session_intent: "threshold_plus_aerobic",
    session_stress: "low",
    modality,
    threshold_minutes: 0,
    is_optional: true,
  });
}

function buildRecoverySupportDouble(dayLabel: string): DoubleSessionDetail {
  return withMeta(
    {
      enabled: true,
      label: "Optional Support",
      secondary: {
        title: "Mobility & Easy Flush",
        intent: "Recovery-focused second session — absorb the block without adding stress.",
        time_cap_minutes: 20,
        category: "recovery",
        session: {
          main: [
            "15–20 min easy walk or very light bike",
            "Hip flexor + thoracic mobility flow",
            "Optional calf and ankle mobility",
          ],
          notes: ["Deload week — keep doubles easy or skip entirely."],
        },
        priority: {
          rank: 3,
          label: "P3",
          display_label: "Recovery Support",
          category_label: "Recovery",
          reason: `Easy PM support on ${dayLabel} during a control week.`,
        },
      },
    },
    {
      double_session_intent: "recovery_support",
      session_stress: "low",
      modality: "recovery",
      is_optional: true,
    }
  );
}

function buildStrengthEnduranceAddon(dayLabel: string): DoubleSessionDetail {
  return withMeta(
    {
      enabled: true,
      label: "Optional Support",
      secondary: {
        title: "HYROX Strength Endurance — PM (Optional)",
        intent: "Low-impact strength endurance after long aerobic — station durability without extra run stress.",
        time_cap_minutes: 35,
        category: "strength",
        session: {
          main: [
            "Goblet squat 3×10 @ controlled tempo",
            "Walking lunges 2×12/leg",
            "Wall sit 2×45s + standing calf iso hold 2×45s/side",
          ],
          notes: [
            "PM optional after long run — skip if legs are trashed.",
            "Sunday long + optional strength endurance — Monday stays easy.",
          ],
        },
        priority: {
          rank: 3,
          label: "P3",
          display_label: "Strength Endurance",
          category_label: "Optional add-on",
          reason: `Optional PM durability on ${dayLabel} after the long aerobic anchor.`,
        },
      },
    },
    {
      double_session_intent: "strength_endurance_addon",
      session_stress: "moderate",
      modality: "strength",
      is_optional: true,
    }
  );
}

function buildDoubleThresholdDouble(
  weekNumber: number,
  weekFocus: string | null | undefined,
  modality: "ski" | "row" | "bike",
  dayLabel: string
): DoubleSessionDetail | null {
  const family = getProgressionFamily(`erg_threshold_${modality}_a`);
  if (!family) return null;
  const applied = applyProgressionFamily(family, weekNumber, weekFocus);
  const mins =
    applied.variant.marker.erg_threshold_minutes ??
    applied.variant.marker.threshold_total_minutes ??
    0;

  return withMeta(
    {
      enabled: true,
      label: "AM/PM",
      threshold_support: {
        progression_family: applied.family_id,
        progression_marker: applied.variant.marker,
      },
      secondary: {
        title: applied.variant.title,
        intent: "Erg threshold support — progresses total threshold volume without replacing your run threshold anchor.",
        time_cap_minutes: 45,
        category: "aerobic",
        session: {
          main: [...applied.variant.main],
          notes: [
            applied.variant.coach_snippet,
            RUN_THRESHOLD_ANCHOR_COACHING_NOTE,
            "This is a controlled double-threshold day — skip PM erg if AM run threshold felt unusually hard.",
          ],
        },
        priority: {
          rank: 2,
          label: "P2",
          display_label: "Erg Threshold (PM)",
          category_label: "Double threshold",
          reason: `PM ${modality} threshold on ${dayLabel} after the run threshold anchor — engine volume with controlled impact.`,
        },
      },
    },
    {
      double_session_intent: "double_threshold",
      session_stress: "high",
      modality,
      threshold_minutes: mins,
      is_optional: false,
    }
  );
}

export function summariseDoubleSessionsFromSchedule(
  schedule: DayPlan[],
  weekPlan: HyroxDoubleWeekPlan | null
): DoubleSessionWeekSummary | null {
  if (!weekPlan) return null;

  let aerobic = 0;
  let thrPlusAerobic = 0;
  let doubleThr = 0;
  let strengthAddon = 0;
  let recovery = 0;
  let doubleCount = 0;

  for (const d of schedule) {
    const ds = d.double_session;
    if (!ds?.enabled) continue;
    doubleCount += 1;
    const intent = ds.double_session_intent;
    if (intent === "aerobic_support") aerobic += 1;
    else if (intent === "threshold_plus_aerobic") thrPlusAerobic += 1;
    else if (intent === "double_threshold") doubleThr += 1;
    else if (intent === "strength_endurance_addon") strengthAddon += 1;
    else if (intent === "recovery_support") recovery += 1;
    else if (ds.threshold_support) doubleThr += 1;
    else aerobic += 1;
  }

  return {
    phase: weekPlan.phase,
    selected_double_days: weekPlan.selected_double_days,
    double_count: doubleCount,
    aerobic_double_count: aerobic,
    threshold_plus_aerobic_count: thrPlusAerobic,
    double_threshold_count: doubleThr,
    strength_endurance_addon_count: strengthAddon,
    recovery_support_count: recovery,
    week_coaching_note: weekPlan.week_coaching_note,
  };
}

export type HyroxDoublePlannerInput = {
  schedule: DayPlan[];
  input: BlueprintInput;
  weekNumber: number;
  weekFocus?: string | null;
};

/** Apply HYROX Pro double-session ladder to a week schedule. */
export function applyHyroxProDoubleSessions(
  args: HyroxDoublePlannerInput
): { schedule: DayPlanWithDouble[]; weekPlan: HyroxDoubleWeekPlan; summary: DoubleSessionWeekSummary } {
  const weekPlan = resolveHyroxDoubleWeekPlan({
    input: args.input,
    weekNumber: args.weekNumber,
    weekFocus: args.weekFocus,
  })!;

  const result: DayPlanWithDouble[] = args.schedule.map((d) => ({ ...d }));
  const equipment = args.input.hyrox_track!.equipment;
  const { phase, double_days, max_doubles } = weekPlan;

  const runAnchorIdx = result.findIndex(isRunThresholdAnchorDay);
  const runAnchorDay = runAnchorIdx >= 0 ? result[runAnchorIdx]!.day : null;

  let doublesApplied = 0;
  let doubleThresholdApplied = false;
  let lightErgApplied = false;

  const dayLabel = (day: DayKey) => day;

  if (weekPlan.allow_sunday_strength_addon) {
    const sunIdx = result.findIndex((d) => d.day === "Sun" && isLongRunDay(d));
    if (sunIdx >= 0 && !result[sunIdx]!.double_session?.enabled) {
      result[sunIdx] = {
        ...result[sunIdx]!,
        double_session: buildStrengthEnduranceAddon(dayLabel("Sun")),
      };
    }
  }

  const attachToDay = (dayKey: DayKey, detail: DoubleSessionDetail | null) => {
    if (!detail || doublesApplied >= max_doubles) return false;
    const idx = result.findIndex((d) => d.day === dayKey);
    if (idx < 0 || result[idx]!.double_session?.enabled) return false;
    result[idx] = { ...result[idx]!, double_session: detail };
    doublesApplied += 1;
    return true;
  };

  const aerobicMod = pickAerobicModality(equipment);
  const ergMod = pickErgModality(args.weekNumber, equipment);

  if (phase === "deload" || phase === "taper") {
    for (const dayKey of double_days) {
      if (BLOCKED_DOUBLE_DAYS.has(dayKey)) continue;
      attachToDay(dayKey, buildRecoverySupportDouble(dayLabel(dayKey)));
    }
  } else if (phase === "early_aerobic") {
    for (const dayKey of double_days) {
      if (BLOCKED_DOUBLE_DAYS.has(dayKey)) continue;
      const idx = result.findIndex((d) => d.day === dayKey);
      if (idx < 0) continue;
      const day = result[idx]!;
      if (runAnchorDay === dayKey && isHighFatigueMain(day)) {
        attachToDay(dayKey, buildRecoverySupportDouble(dayLabel(dayKey)));
      } else if (isEasyRunDay(day)) {
        attachToDay(dayKey, buildAerobicSupportDouble(aerobicMod, dayLabel(dayKey)));
      } else {
        attachToDay(dayKey, buildAerobicSupportDouble(aerobicMod, dayLabel(dayKey)));
      }
    }
  } else if (phase === "threshold_plus_aerobic") {
    if (runAnchorDay) {
      attachToDay(
        runAnchorDay,
        buildThresholdPlusAerobicDouble(ergMod, dayLabel(runAnchorDay))
      );
    }
    for (const dayKey of double_days) {
      if (dayKey === runAnchorDay || BLOCKED_DOUBLE_DAYS.has(dayKey)) continue;
      attachToDay(dayKey, buildAerobicSupportDouble(aerobicMod, dayLabel(dayKey)));
    }
    if (
      weekPlan.allow_light_erg_threshold &&
      !lightErgApplied &&
      !doubleThresholdApplied
    ) {
      const secondaryDay = double_days.find((d) => d !== runAnchorDay && d !== "Mon");
      if (secondaryDay) {
        const light = buildDoubleThresholdDouble(
          args.weekNumber,
          args.weekFocus,
          ergMod,
          dayLabel(secondaryDay)
        );
        if (light) {
          const idx = result.findIndex((d) => d.day === secondaryDay);
          if (idx >= 0 && result[idx]!.double_session?.enabled) {
            result[idx] = { ...result[idx]!, double_session: light };
            lightErgApplied = true;
          }
        }
      }
    }
  } else if (phase === "late_double_threshold") {
    if (runAnchorDay) {
      const dt = buildDoubleThresholdDouble(
        args.weekNumber,
        args.weekFocus,
        ergMod,
        dayLabel(runAnchorDay)
      );
      if (dt && attachToDay(runAnchorDay, dt)) {
        doubleThresholdApplied = true;
      }
    }
    for (const dayKey of double_days) {
      if (dayKey === runAnchorDay || BLOCKED_DOUBLE_DAYS.has(dayKey)) continue;
      attachToDay(dayKey, buildAerobicSupportDouble(aerobicMod, dayLabel(dayKey)));
    }
  }

  const summary = summariseDoubleSessionsFromSchedule(result, weekPlan)!;

  return { schedule: result, weekPlan, summary };
}

export function scheduleHasHyroxManagedErgSupport(schedule: DayPlan[]): boolean {
  return schedule.some(
    (d) =>
      d.double_session?.double_session_intent === "double_threshold" ||
      (d.double_session?.threshold_support &&
        d.double_session?.double_session_intent !== "threshold_plus_aerobic")
  );
}
