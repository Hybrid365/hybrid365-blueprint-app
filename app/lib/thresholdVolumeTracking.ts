/**
 * Weekly threshold volume by modality (run / ski / row / bike).
 */

import type { DayPlan } from "./sessionLibrary";
import type { ProgressionMarker } from "./progressionFamilies";

export type ThresholdModalityBreakdown = {
  run: number;
  ski: number;
  row: number;
  bike: number;
};

export type ThresholdVolumeSummary = {
  run_threshold_minutes: number;
  erg_threshold_minutes: number;
  total_threshold_minutes: number;
  threshold_modality_breakdown: ThresholdModalityBreakdown;
};

function detectModalityFromDay(day: DayPlan): keyof ThresholdModalityBreakdown | null {
  const blob = [day.title, ...(day.session?.main ?? []), day.progression_family ?? ""]
    .join(" ")
    .toLowerCase();
  if (/skierg|ski erg|ski threshold/i.test(blob)) return "ski";
  if (/row erg|rower|row threshold|rowing threshold/i.test(blob)) return "row";
  if (/bike threshold|assault bike|spin.*threshold|bike tempo/i.test(blob)) return "bike";
  const t0 = day.tags?.[0] ?? "";
  if (t0 === "threshold_run" || /run threshold|threshold run/i.test(blob)) return "run";
  if (/threshold/i.test(day.title) && day.tags?.[1] === "aerobic") return "bike";
  return null;
}

function minutesFromMarker(day: DayPlan): number {
  const m = day.progression_marker;
  if (m?.threshold_total_minutes) return m.threshold_total_minutes;
  if (m?.erg_threshold_minutes) return m.erg_threshold_minutes;
  return 0;
}

export function isRunThresholdAnchorDay(day: DayPlan): boolean {
  const fam = day.progression_family ?? "";
  if (fam === "threshold_volume_a" || fam === "threshold_volume_beginner_a") return true;
  const t0 = day.tags?.[0] ?? "";
  if (t0 !== "threshold_run") return false;
  if (fam.startsWith("erg_threshold_")) return false;
  return !/skierg|row\s*erg|bike/i.test(day.title);
}

export function hasRunThresholdAnchor(schedule: DayPlan[]): boolean {
  return schedule.some(isRunThresholdAnchorDay);
}

function addMarkerMinutes(
  breakdown: ThresholdModalityBreakdown,
  m: import("./progressionFamilies").ProgressionMarker,
  isRunAnchor: boolean
): number {
  const mins = m.threshold_total_minutes ?? m.erg_threshold_minutes ?? 0;
  if (mins <= 0) return 0;
  const mod = m.threshold_modality ?? (isRunAnchor ? "run" : "ski");
  if (mod === "run") breakdown.run += mins;
  else if (mod === "bike") breakdown.bike += mins;
  else if (mod === "row") breakdown.row += mins;
  else breakdown.ski += mins;
  return mins;
}

export function summariseThresholdVolume(schedule: DayPlan[]): ThresholdVolumeSummary {
  const breakdown: ThresholdModalityBreakdown = { run: 0, ski: 0, row: 0, bike: 0 };

  for (const day of schedule) {
    if (isRunThresholdAnchorDay(day) && day.progression_marker) {
      addMarkerMinutes(breakdown, day.progression_marker, true);
    } else if (day.progression_family?.startsWith("erg_threshold_") && day.progression_marker) {
      addMarkerMinutes(breakdown, day.progression_marker, false);
    } else {
      const mins = minutesFromMarker(day);
      if (mins <= 0) continue;
      const mod =
        day.progression_marker?.threshold_modality ??
        detectModalityFromDay(day) ??
        "run";
      breakdown[mod] += mins;
    }

    const ts = (
      day.double_session as { threshold_support?: { progression_marker?: import("./progressionFamilies").ProgressionMarker } } | undefined
    )?.threshold_support?.progression_marker;
    if (ts) addMarkerMinutes(breakdown, ts, false);
  }

  const erg = breakdown.ski + breakdown.row + breakdown.bike;
  return {
    run_threshold_minutes: breakdown.run,
    erg_threshold_minutes: erg,
    total_threshold_minutes: breakdown.run + erg,
    threshold_modality_breakdown: breakdown,
  };
}

export function mergeThresholdIntoMarker(
  agg: ProgressionMarker,
  summary: ThresholdVolumeSummary
): ProgressionMarker {
  return {
    ...agg,
    run_threshold_minutes: summary.run_threshold_minutes || undefined,
    erg_threshold_minutes: summary.erg_threshold_minutes || undefined,
    total_threshold_minutes: summary.total_threshold_minutes || agg.threshold_total_minutes,
    threshold_modality_breakdown: summary.threshold_modality_breakdown,
  };
}

export function formatThresholdVolumeLine(summary: ThresholdVolumeSummary): string | null {
  if (summary.total_threshold_minutes <= 0) return null;
  const parts: string[] = [`${summary.total_threshold_minutes} min total threshold`];
  const b = summary.threshold_modality_breakdown;
  const mods: string[] = [];
  if (b.run) mods.push(`run ${b.run}`);
  if (b.ski) mods.push(`ski ${b.ski}`);
  if (b.row) mods.push(`row ${b.row}`);
  if (b.bike) mods.push(`bike ${b.bike}`);
  if (mods.length > 1) parts.push(`(${mods.join(", ")})`);
  return parts.join(" ");
}

/** True when erg threshold support may be added (not replace run anchor). */
export function shouldAddErgThresholdSupport(
  input: {
    hyrox_track?: { active: boolean; current_run_volume_band: string | null; impact_risk: string } | null;
    has_injury?: boolean;
    goal_focus: string;
    ability_level: string;
    double_sessions?: boolean;
    weekly_hours_band?: string;
  },
  weekNumber: number,
  weekFocus?: string | null
): boolean {
  if (input.ability_level === "beginner") return false;
  const bw = ((weekNumber - 1) % 4) + 1;
  const isDeload = weekFocus?.includes("deload") || bw === 4;
  if (isDeload) return false;

  const band = (input.weekly_hours_band ?? "").toLowerCase();
  const highAvailability = band === "7-10" || band === "10+";
  const hyrox = Boolean(input.hyrox_track?.active);

  if (hyrox && input.ability_level === "advanced" && highAvailability) return true;
  if (hyrox && input.double_sessions) return true;

  if (input.has_injury) return true;

  const runBand = (input.hyrox_track?.current_run_volume_band ?? "").toLowerCase();
  if (/low|under|20|25|30/.test(runBand) && !/70|50-70|high/.test(runBand)) return true;
  if (input.hyrox_track?.impact_risk === "high") return true;

  return false;
}

/** @deprecated use shouldAddErgThresholdSupport */
export function shouldBlendErgThreshold(input: {
  hyrox_track?: { active: boolean; current_run_volume_band: string | null; impact_risk: string } | null;
  has_injury?: boolean;
  goal_focus: string;
  ability_level: string;
}): boolean {
  return shouldAddErgThresholdSupport({ ...input, double_sessions: true, weekly_hours_band: "10+" }, 2);
}

/** Only replace run threshold with erg when athlete cannot tolerate run threshold work. */
export function shouldReplaceRunThresholdWithErg(
  input: {
    has_injury?: boolean;
    hyrox_track?: { impact_risk: string } | null;
  },
  lowImpact: boolean
): boolean {
  if (!lowImpact && !input.has_injury) return false;
  if (input.hyrox_track?.impact_risk === "high") return true;
  return Boolean(input.has_injury && lowImpact);
}

export function ergThresholdModalityForWeek(weekNumber: number): "ski" | "row" | "bike" {
  const bw = ((weekNumber - 1) % 4) + 1;
  if (bw === 2) return "ski";
  if (bw === 3) return "row";
  if (bw === 4) return "bike";
  return "ski";
}

export const ERG_ENGINE_COACHING_NOTE =
  "Run threshold remains the anchor. Extra threshold volume is added through ergs/bike to build the engine without unnecessary impact.";
