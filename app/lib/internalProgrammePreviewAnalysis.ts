/**
 * QA summary + warnings for internal programme preview (no DB).
 */

import type { GeneratedProgrammeWeek } from "./generate12WeekProgramme";
import type { PaidProgrammeInput } from "./generate12WeekProgramme";
import { countRunExposuresInSchedule, planWeeklyRunVolume } from "./runVolumePlanner";
import { summariseWeekMarkers } from "./progressionFamilies";
import type { DayPlan } from "./sessionLibrary";
import {
  analyzeWeeklyRhythm,
  classifyDayPlan,
  hasVagueStrengthPrescription,
} from "./sessionStressClassification";
import { summariseThresholdVolume } from "./thresholdVolumeTracking";

export type WeekPreviewMetrics = {
  week_number: number;
  block_number: number;
  title: string;
  week_focus: string;
  run_exposures: number;
  threshold_sessions: number;
  total_threshold_minutes: number;
  run_threshold_minutes: number;
  erg_threshold_minutes: number;
  threshold_modality_breakdown: { run: number; ski: number; row: number; bike: number };
  hard_day_count: number;
  max_consecutive_hard: number;
  hard_days: string[];
  long_run_present: boolean;
  long_run_minutes: number | null;
  estimated_run_km: number | null;
  compromised_sessions: number;
  hyrox_titles: string[];
  station_focus_hint: string | null;
};

export type ProgrammePreviewAnalysis = {
  preview_mode: true;
  hyrox_track: boolean;
  ability_level: string;
  goal_focus: string;
  weeks: WeekPreviewMetrics[];
  warnings: string[];
};

function thresholdSessions(schedule: DayPlan[]) {
  return schedule.filter((d) => {
    const t0 = d.tags?.[0] ?? "";
    return t0 === "threshold_run" || /threshold/i.test(d.title);
  });
}

function longRunPresent(schedule: DayPlan[]) {
  return schedule.some((d) => {
    const t0 = d.tags?.[0] ?? "";
    return t0 === "long_run" || /long run/i.test(d.title);
  });
}

function longRunMinutes(schedule: DayPlan[]): number | null {
  let max = 0;
  for (const d of schedule) {
    const m = d.progression_marker?.long_run_minutes;
    if (m && m > max) max = m;
  }
  return max > 0 ? max : null;
}

function compromisedSessions(schedule: DayPlan[]) {
  return schedule.filter((d) => {
    const t0 = d.tags?.[0] ?? "";
    return (
      t0 === "hybrid_compromised" ||
      t0 === "hybrid_density" ||
      /compromised|hyrox/i.test(d.title)
    );
  });
}

function sessionImpactScore(day: DayPlan): number {
  const c = classifyDayPlan(day);
  if (c.session_stress === "high") return 3;
  if (c.session_stress === "moderate") return 2;
  return 0;
}

function easyRunPaceTooAggressive(day: DayPlan): boolean {
  const t0 = day.tags?.[0] ?? "";
  if (t0 !== "long_run" && t0 !== "aerobic_run") return false;
  const note = day.run_prescription?.coach_note ?? "";
  const pace = day.run_prescription?.pace_range ?? "";
  if (/steady|tempo|moderate.?hard/i.test(note)) return true;
  if (t0 === "long_run" && /steady/i.test(pace)) return true;
  return false;
}

function prescribesUnavailableKit(day: DayPlan, input: PaidProgrammeInput): boolean {
  if (!input.hyrox_track?.equipment_limited) return false;
  const main = (day.session?.main ?? []).join(" ").toLowerCase();
  const notes = (day.session?.notes ?? []).join(" ").toLowerCase();
  if (/substitut|bike|row|low.?impact|alternative|no sled|march/i.test(notes)) return false;
  if (!input.hyrox_track.equipment.hasSled && /sled push|sled pull/.test(main)) return true;
  if (!input.hyrox_track.equipment.hasWallBall && /wall ball/.test(main)) return true;
  return false;
}

export function analyseProgrammePreview(
  weeks: GeneratedProgrammeWeek[],
  input: PaidProgrammeInput
): ProgrammePreviewAnalysis {
  const warnings: string[] = [];
  const weekMetrics: WeekPreviewMetrics[] = [];

  for (const week of weeks) {
    const schedule = week.plan_json.schedule;
    const runPlan = planWeeklyRunVolume(input, week.week_number, week.plan_json.week_context?.week_focus);
    const marker = summariseWeekMarkers(schedule);
    const thrVol = summariseThresholdVolume(schedule);
    const rhythm = analyzeWeeklyRhythm(schedule);
    const km =
      marker.estimated_run_volume_km ??
      (runPlan ? Math.round((runPlan.targetKmMin + runPlan.targetKmMax) / 2) : null);

    weekMetrics.push({
      week_number: week.week_number,
      block_number: week.block_number,
      title: week.title,
      week_focus: week.plan_json.week_context?.week_focus ?? "—",
      run_exposures: countRunExposuresInSchedule(schedule),
      threshold_sessions: thresholdSessions(schedule).length,
      total_threshold_minutes: thrVol.total_threshold_minutes,
      run_threshold_minutes: thrVol.run_threshold_minutes,
      erg_threshold_minutes: thrVol.erg_threshold_minutes,
      threshold_modality_breakdown: thrVol.threshold_modality_breakdown,
      hard_day_count: rhythm.hard_day_count,
      max_consecutive_hard: rhythm.max_consecutive_hard,
      hard_days: rhythm.hard_days,
      long_run_present: longRunPresent(schedule),
      long_run_minutes: longRunMinutes(schedule),
      estimated_run_km: km,
      compromised_sessions: compromisedSessions(schedule).length,
      hyrox_titles: compromisedSessions(schedule).map((d) => d.title),
      station_focus_hint: input.hyrox_track?.station_focus_this_week?.[0] ?? null,
    });

    for (const w of rhythm.warnings) {
      warnings.push(`Week ${week.week_number}: ${w}`);
    }

    for (const day of schedule) {
      if (hasVagueStrengthPrescription(day)) {
        warnings.push(
          `Week ${week.week_number} (${day.day}): vague strength prescription — "${day.title}" uses pattern labels instead of named movements.`
        );
      }
      if (easyRunPaceTooAggressive(day)) {
        warnings.push(
          `Week ${week.week_number} (${day.day}): easy/long run pace guidance may be too aggressive — check RPE and easy zone.`
        );
      }
    }
  }

  const hyrox_track = Boolean(input.hyrox_track?.active);
  const isAdvanced = input.ability_level === "advanced";
  const wantsRunHybrid =
    input.goal_focus === "running" ||
    input.goal_focus === "hybrid" ||
    hyrox_track;

  for (const w of weekMetrics) {
    if (isAdvanced && w.run_exposures < 4) {
      warnings.push(
        `Week ${w.week_number}: advanced profile has only ${w.run_exposures} run exposures (expected ≥4).`
      );
    }
    if (wantsRunHybrid && !w.long_run_present && w.week_number <= 8) {
      warnings.push(`Week ${w.week_number}: no long run scheduled (running/hybrid profile).`);
    }
    if (hyrox_track && w.week_number <= 8) {
      const sun = weeks
        .find((wk) => wk.week_number === w.week_number)
        ?.plan_json.schedule.find((d) => d.day === "Sun");
      const mon = weeks
        .find((wk) => wk.week_number === w.week_number)
        ?.plan_json.schedule.find((d) => d.day === "Mon");
      if (sun && classifyDayPlan(sun).session_stress === "high" && sun.tags?.[0] !== "run_long") {
        warnings.push(`Week ${w.week_number}: Sunday is high stress but not a long aerobic anchor.`);
      }
      if (mon && classifyDayPlan(mon).session_stress === "high" && input.hyrox_track?.hyrox_event_type === "open") {
        warnings.push(`Week ${w.week_number}: Monday is high stress — HYROX Open prefers recovery/easier Monday.`);
      }
    }
  }

  if (hyrox_track) {
    const totalCompromised = weekMetrics.reduce((s, w) => s + w.compromised_sessions, 0);
    if (totalCompromised === 0) {
      warnings.push("HYROX track active but no compromised / HYROX-specific sessions in 12-week preview.");
    }
    const w1Thr = weekMetrics[0]?.total_threshold_minutes ?? 0;
    const w3Thr = weekMetrics[2]?.total_threshold_minutes ?? 0;
    if (w1Thr > 0 && w3Thr > 0 && w3Thr < w1Thr) {
      warnings.push(
        `Threshold volume may regress: week 1 ${w1Thr} min vs week 3 ${w3Thr} min total — check progression.`
      );
    }
    if (weekMetrics.every((w) => w.erg_threshold_minutes === 0) && isAdvanced) {
      warnings.push("HYROX advanced: no erg threshold minutes detected — consider ski/row/bike engine support.");
    }
  }

  const w1Thr = thresholdSessions(weeks[0]?.plan_json.schedule ?? [])[0];
  const w2Thr = thresholdSessions(weeks[1]?.plan_json.schedule ?? [])[0];
  if (w1Thr && w2Thr) {
    const fp1 = `${w1Thr.template_id ?? ""}::${w1Thr.title}`;
    const fp2 = `${w2Thr.template_id ?? ""}::${w2Thr.title}`;
    if (fp1 === fp2) {
      warnings.push(
        `Week 1 and Week 2 threshold sessions appear identical (${w1Thr.title}).`
      );
    }
  }

  if (input.hyrox_track?.equipment_limited) {
    for (const week of weeks) {
      for (const day of week.plan_json.schedule) {
        if (prescribesUnavailableKit(day, input)) {
          warnings.push(
            `Week ${week.week_number} (${day.day}): may prescribe unavailable kit — ${day.title}.`
          );
        }
      }
    }
  }

  const injuryBlob = [
    input.has_injury ? "injury" : "",
    input.notes ?? "",
    input.rationale_context?.assessment?.injury_flags?.join(" ") ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (/knee|calf|injury|low impact|pain/.test(injuryBlob)) {
    let highImpactDays = 0;
    for (const week of weeks.slice(0, 4)) {
      for (const day of week.plan_json.schedule) {
        if (sessionImpactScore(day) >= 3) highImpactDays += 1;
      }
    }
    if (highImpactDays >= 6) {
      warnings.push(
        `Injury/low-impact profile: ${highImpactDays} high-impact sessions in weeks 1–4 (review substitutions).`
      );
    }
    const ergMins = weekMetrics.slice(0, 4).reduce((s, w) => s + w.erg_threshold_minutes, 0);
    if (ergMins === 0) {
      warnings.push(
        "Low-impact profile: weeks 1–4 have no erg threshold — consider bike/ski/row engine work."
      );
    }
  }

  if (input.goal_focus === "muscle") {
    let strengthDays = 0;
    for (const day of weeks[0]?.plan_json.schedule ?? []) {
      const t0 = day.tags?.[0] ?? "";
      if (t0.startsWith("strength") || /strength|circuit|hypertrophy/i.test(day.title)) {
        strengthDays += 1;
      }
    }
    if (strengthDays < 2) {
      warnings.push(
        `Muscle-building profile: week 1 has only ${strengthDays} strength-focused days — may under-dose hypertrophy.`
      );
    }
  }

  const dupTitles = new Map<string, number>();
  for (const week of weeks) {
    for (const day of week.plan_json.schedule) {
      const key = day.title.trim().toLowerCase();
      if (!key) continue;
      dupTitles.set(key, (dupTitles.get(key) ?? 0) + 1);
    }
  }
  for (const [title, count] of dupTitles) {
    if (count >= 4) {
      warnings.push(`Session "${title}" repeats ${count} times across 12 weeks — check variety.`);
    }
  }

  return {
    preview_mode: true,
    hyrox_track,
    ability_level: input.ability_level,
    goal_focus: input.goal_focus,
    weeks: weekMetrics,
    warnings: [...new Set(warnings)],
  };
}
