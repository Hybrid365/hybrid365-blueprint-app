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

export function summariseThresholdVolume(schedule: DayPlan[]): ThresholdVolumeSummary {
  const breakdown: ThresholdModalityBreakdown = { run: 0, ski: 0, row: 0, bike: 0 };

  for (const day of schedule) {
    const mins = minutesFromMarker(day);
    if (mins <= 0) continue;
    const mod =
      day.progression_marker?.threshold_modality ??
      detectModalityFromDay(day) ??
      "run";
    breakdown[mod] += mins;
  }

  const erg = breakdown.ski + breakdown.row + breakdown.bike;
  const run = breakdown.run;

  return {
    run_threshold_minutes: run,
    erg_threshold_minutes: erg,
    total_threshold_minutes: run + erg,
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

export function shouldBlendErgThreshold(input: {
  hyrox_track?: { active: boolean; current_run_volume_band: string | null; impact_risk: string } | null;
  has_injury?: boolean;
  goal_focus: string;
  ability_level: string;
}): boolean {
  if (input.has_injury) return true;
  const band = (input.hyrox_track?.current_run_volume_band ?? "").toLowerCase();
  if (/low|under|20|25|30|moderate/.test(band) && !/70|high|50/.test(band)) return true;
  if (input.hyrox_track?.impact_risk === "high") return true;
  if (input.hyrox_track?.active && input.ability_level !== "beginner") return true;
  if (input.goal_focus === "hybrid" && /injury|impact|knee|calf/.test(band)) return true;
  return false;
}

export function ergThresholdModalityForWeek(weekNumber: number): "ski" | "row" | "bike" {
  const bw = ((weekNumber - 1) % 4) + 1;
  if (bw === 2) return "ski";
  if (bw === 3) return "row";
  if (bw === 4) return "bike";
  return "ski";
}

export const ERG_ENGINE_COACHING_NOTE =
  "Threshold volume is built through running and ergs this week so your engine progresses without unnecessary impact load.";
