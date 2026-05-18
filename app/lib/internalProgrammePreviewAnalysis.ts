/**
 * QA summary + warnings for internal programme preview (no DB).
 */

import type { GeneratedProgrammeWeek } from "./generate12WeekProgramme";
import type { PaidProgrammeInput } from "./generate12WeekProgramme";
import { countRunExposuresInSchedule, planWeeklyRunVolume } from "./runVolumePlanner";
import { summariseWeekMarkers } from "./progressionFamilies";
import type { DayPlan } from "./sessionLibrary";

export type WeekPreviewMetrics = {
  week_number: number;
  block_number: number;
  title: string;
  week_focus: string;
  run_exposures: number;
  threshold_sessions: number;
  long_run_present: boolean;
  estimated_run_km: number | null;
  compromised_sessions: number;
  hyrox_titles: string[];
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
  const t0 = day.tags?.[0] ?? "";
  const main = (day.session?.main ?? []).join(" ").toLowerCase();
  let score = 0;
  if (t0 === "interval_run" || t0 === "threshold_run") score += 2;
  if (t0 === "long_run") score += 2;
  if (t0 === "hybrid_compromised") score += 2;
  if (/\bburpee|jump|sled push|wall ball/i.test(main)) score += 1;
  return score;
}

function prescribesUnavailableKit(day: DayPlan, input: PaidProgrammeInput): boolean {
  if (!input.hyrox_track?.equipment_limited) return false;
  const main = (day.session?.main ?? []).join(" ").toLowerCase();
  const notes = (day.session?.notes ?? []).join(" ").toLowerCase();
  if (/substitut|bike|row|low.?impact|alternative/.test(notes)) return false;
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
      long_run_present: longRunPresent(schedule),
      estimated_run_km: km,
      compromised_sessions: compromisedSessions(schedule).length,
      hyrox_titles: compromisedSessions(schedule).map((d) => d.title),
    });
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
  }

  if (hyrox_track) {
    const totalCompromised = weekMetrics.reduce((s, w) => s + w.compromised_sessions, 0);
    if (totalCompromised === 0) {
      warnings.push("HYROX track active but no compromised / HYROX-specific sessions in 12-week preview.");
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
    warnings,
  };
}
