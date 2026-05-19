/**
 * QA summary + warnings for internal programme preview (no DB).
 */

import type { GeneratedProgrammeWeek } from "./generate12WeekProgramme";
import type { PaidProgrammeInput } from "./generate12WeekProgramme";
import {
  countRunExposuresInSchedule,
  estimatePlannedRunKmFromSchedule,
  planWeeklyRunVolume,
} from "./runVolumePlanner";
import { summariseWeekMarkers } from "./progressionFamilies";
import type { DayPlan } from "./sessionLibrary";
import {
  analyzeWeeklyRhythm,
  classifyDayPlan,
  hasVagueStrengthPrescription,
} from "./sessionStressClassification";
import { ergThresholdReplacedRunAnchor } from "./ergThresholdSupport";
import {
  hasRunThresholdAnchor,
  isRunThresholdAnchorDay,
  summariseThresholdVolume,
} from "./thresholdVolumeTracking";
import {
  resolveHyroxDoublePhase,
  resolveHyroxDoubleWeekPlan,
  shouldUseHyroxProDoubleProgression,
  summariseDoubleSessionsFromSchedule,
} from "./hyroxDoubleSessionProgression";
import type { HyroxDoublePhase } from "./hyroxDoubleSessionProgression";

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
  planned_run_km: number | null;
  run_volume_target_km_min: number | null;
  run_volume_target_km_max: number | null;
  run_volume_band_compliant: boolean | null;
  day_stress_sequence: string;
  non_run_with_run_prescription: number;
  bike_sessions_missing_duration: number;
  hyrox_lower_has_calf_iso: boolean | null;
  compromised_sessions: number;
  hyrox_titles: string[];
  station_focus_hint: string | null;
  run_anchor_present: boolean;
  run_anchor_title: string | null;
  erg_support_present: boolean;
  double_session_phase: HyroxDoublePhase | null;
  selected_double_days: string[];
  double_count: number;
  aerobic_double_count: number;
  threshold_plus_aerobic_count: number;
  double_threshold_count: number;
};

function isDeloadWeekNumber(weekNumber: number, weekFocus?: string): boolean {
  if (weekFocus?.includes("deload")) return true;
  return weekNumber % 4 === 0;
}

function runAnchorTitle(schedule: DayPlan[]): string | null {
  const day = schedule.find(isRunThresholdAnchorDay);
  return day?.title ?? null;
}

function hasErgThresholdSupport(schedule: DayPlan[]): boolean {
  return schedule.some(
    (d) =>
      d.double_session?.threshold_support ||
      (d.progression_family?.startsWith("erg_threshold_") && !isRunThresholdAnchorDay(d))
  );
}

function hasCalfIsoAccessory(schedule: DayPlan[]): boolean {
  for (const day of schedule) {
    const blob = [
      day.title,
      ...(day.session?.main ?? []),
      ...(day.session?.notes ?? []),
      day.progression_family ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (
      /lower_strength_hyrox|hyrox lower/i.test(blob) &&
      /calf iso|soleus iso|wall-lean calf|standing calf iso/i.test(blob)
    ) {
      return true;
    }
  }
  return false;
}

export type ProgrammePreviewAnalysis = {
  preview_mode: true;
  hyrox_track: boolean;
  ability_level: string;
  goal_focus: string;
  athlete_double_days: string[];
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
  const hyrox_track = Boolean(input.hyrox_track?.active);
  const isAdvanced = input.ability_level === "advanced";
  const usesRepairDiagnostics = weeks.some(
    (w) => w.plan_json.schedule_remaining_issues !== undefined
  );

  for (const week of weeks) {
    const schedule = week.plan_json.schedule;
    const runPlan = planWeeklyRunVolume(input, week.week_number, week.plan_json.week_context?.week_focus);
    const marker = summariseWeekMarkers(schedule);
    const thrVol = summariseThresholdVolume(schedule);
    const rhythm = analyzeWeeklyRhythm(schedule);
    const plannedKm = estimatePlannedRunKmFromSchedule(schedule);
    const km =
      plannedKm > 0
        ? plannedKm
        : marker.estimated_run_volume_km ??
          (runPlan ? Math.round((runPlan.targetKmMin + runPlan.targetKmMax) / 2) : null);

    const stressSeq = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      .map((d) => {
        const day = schedule.find((x) => x.day === d);
        if (!day) return `${d}:—`;
        const c = classifyDayPlan(day);
        const abbrev =
          c.session_stress === "high" ? "H" : c.session_stress === "moderate" ? "M" : "L";
        return `${d}:${abbrev}`;
      })
      .join(" ");

    let nonRunRx = 0;
    let bikeMissingDuration = 0;
    for (const day of schedule) {
      if (
        day.run_prescription &&
        /hyrox lower|lower_strength_hyrox|strength_lower/i.test(
          `${day.title} ${day.progression_family ?? ""} ${day.tags?.[0] ?? ""}`
        )
      ) {
        nonRunRx += 1;
      }
      if (
        /bike|flush|aerobic support/i.test(`${day.title} ${(day.session?.main ?? []).join(" ")}`) &&
        !/(\d{2}–\d{2}|\d{2}-\d{2})\s*min/i.test(
          `${day.title} ${(day.session?.main ?? []).join(" ")} ${(day.session?.notes ?? []).join(" ")}`
        )
      ) {
        bikeMissingDuration += 1;
      }
    }

    const hasHyroxLower = schedule.some((d) =>
      /hyrox lower|lower_strength_hyrox/i.test(`${d.progression_family ?? ""} ${d.title}`.toLowerCase())
    );
    const calfOk = hasHyroxLower ? hasCalfIsoAccessory(schedule) : null;
    const bandCompliant =
      runPlan && !isDeloadWeekNumber(week.week_number, week.plan_json.week_context?.week_focus)
        ? plannedKm >= runPlan.targetKmMin - 4
        : null;

    const doublePlan = shouldUseHyroxProDoubleProgression(input)
      ? resolveHyroxDoubleWeekPlan({
          input,
          weekNumber: week.week_number,
          weekFocus: week.plan_json.week_context?.week_focus,
        })
      : null;
    const doubleSummary =
      week.plan_json.double_session_summary ??
      (doublePlan ? summariseDoubleSessionsFromSchedule(schedule, doublePlan) : null);

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
      planned_run_km: plannedKm > 0 ? plannedKm : null,
      run_volume_target_km_min: runPlan?.targetKmMin ?? null,
      run_volume_target_km_max: runPlan?.targetKmMax ?? null,
      run_volume_band_compliant: bandCompliant,
      day_stress_sequence: stressSeq,
      non_run_with_run_prescription: nonRunRx,
      bike_sessions_missing_duration: bikeMissingDuration,
      hyrox_lower_has_calf_iso: calfOk,
      compromised_sessions: compromisedSessions(schedule).length,
      hyrox_titles: compromisedSessions(schedule).map((d) => d.title),
      station_focus_hint: input.hyrox_track?.station_focus_this_week?.[0] ?? null,
      run_anchor_present: hasRunThresholdAnchor(schedule),
      run_anchor_title: runAnchorTitle(schedule),
      erg_support_present: hasErgThresholdSupport(schedule),
      double_session_phase: doubleSummary?.phase ?? null,
      selected_double_days: doubleSummary?.selected_double_days ?? input.double_session_days ?? [],
      double_count: doubleSummary?.double_count ?? 0,
      aerobic_double_count: doubleSummary?.aerobic_double_count ?? 0,
      threshold_plus_aerobic_count: doubleSummary?.threshold_plus_aerobic_count ?? 0,
      double_threshold_count: doubleSummary?.double_threshold_count ?? 0,
    });

    const remaining = week.plan_json.schedule_remaining_issues ?? [];
    if (usesRepairDiagnostics && remaining.length > 0) {
      for (const issue of remaining) {
        warnings.push(`Week ${week.week_number}: ${issue}`);
      }
    }

    if (hyrox_track && isAdvanced && !isDeloadWeekNumber(week.week_number, week.plan_json.week_context?.week_focus)) {
      if (!usesRepairDiagnostics && !hasRunThresholdAnchor(schedule)) {
        warnings.push(
          `Week ${week.week_number}: HYROX advanced profile missing weekly run threshold anchor.`
        );
      }
      if (ergThresholdReplacedRunAnchor(schedule)) {
        warnings.push(
          `Week ${week.week_number}: run threshold was replaced by erg threshold — run anchor should remain weekly.`
        );
      }
    }

    if (hyrox_track && !hasCalfIsoAccessory(schedule)) {
      const hasHyroxLower = schedule.some((d) =>
        /hyrox lower|lower_strength_hyrox/i.test(
          `${d.progression_family ?? ""} ${d.title}`.toLowerCase()
        )
      );
      if (hasHyroxLower) {
        warnings.push(
          `Week ${week.week_number}: HYROX lower strength missing calf isometric/durability accessory.`
        );
      }
    }

    if (!usesRepairDiagnostics) {
      const sun = schedule.find((d) => d.day === "Sun");
      const mon = schedule.find((d) => d.day === "Mon");
      if (
        sun &&
        (sun.tags?.[0] === "long_run" || /long run|long zone/i.test(sun.title)) &&
        mon &&
        classifyDayPlan(mon).session_stress === "high"
      ) {
        warnings.push(
          `Week ${week.week_number}: Monday is hard after Sunday long/hard — prefer recovery/easier Monday.`
        );
      }

      for (const w of rhythm.warnings) {
        warnings.push(`Week ${week.week_number}: ${w}`);
      }
    }

    if (runPlan && bandCompliant === false && !isDeloadWeekNumber(week.week_number, week.plan_json.week_context?.week_focus)) {
      warnings.push(
        `Week ${week.week_number}: planned run ~${plannedKm}km below target ${runPlan.targetKmMin}–${runPlan.targetKmMax}km for ${input.current_run_volume_band ?? "profile"}.`
      );
    }
    if (nonRunRx > 0) {
      warnings.push(
        `Week ${week.week_number}: ${nonRunRx} non-run session(s) still show run prescription.`
      );
    }
    if (bikeMissingDuration > 0) {
      warnings.push(
        `Week ${week.week_number}: ${bikeMissingDuration} bike/aerobic session(s) missing explicit duration window.`
      );
    }
    if (calfOk === false) {
      warnings.push(`Week ${week.week_number}: HYROX lower strength missing calf isometric accessory.`);
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

  const wantsRunHybrid =
    input.goal_focus === "running" ||
    input.goal_focus === "hybrid" ||
    hyrox_track;

  const minRunExposuresAdvanced =
    hyrox_track && input.days_per_week >= 7 && isAdvanced ? 5 : 4;

  for (const w of weekMetrics) {
    if (!usesRepairDiagnostics && isAdvanced && w.run_exposures < minRunExposuresAdvanced) {
      warnings.push(
        `Week ${w.week_number}: advanced profile has only ${w.run_exposures} run exposures (expected ≥${minRunExposuresAdvanced}).`
      );
    }
    if (wantsRunHybrid && !w.long_run_present && w.week_number <= 8) {
      warnings.push(`Week ${w.week_number}: no long run scheduled (running/hybrid profile).`);
    }
    if (!usesRepairDiagnostics && hyrox_track && w.week_number <= 8) {
      const sun = weeks
        .find((wk) => wk.week_number === w.week_number)
        ?.plan_json.schedule.find((d) => d.day === "Sun");
      const mon = weeks
        .find((wk) => wk.week_number === w.week_number)
        ?.plan_json.schedule.find((d) => d.day === "Mon");
      if (sun && classifyDayPlan(sun).session_stress === "high" && sun.tags?.[0] !== "long_run") {
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
    if (
      !usesRepairDiagnostics &&
      weekMetrics.every((w) => w.erg_threshold_minutes === 0) &&
      isAdvanced
    ) {
      warnings.push("HYROX advanced: no erg threshold minutes detected — consider ski/row/bike engine support.");
    }
  }

  const w1Sched = weeks[0]?.plan_json.schedule ?? [];
  const w2Sched = weeks[1]?.plan_json.schedule ?? [];
  const w1Anchor = runAnchorTitle(w1Sched);
  const w2Anchor = runAnchorTitle(w2Sched);
  if (hyrox_track && isAdvanced) {
    if (!w1Anchor) {
      warnings.push("Week 1: no run threshold anchor detected for HYROX advanced profile.");
    }
    if (w1Anchor && !w2Anchor) {
      warnings.push(
        `Week 2: run threshold anchor missing (week 1 had "${w1Anchor}") — likely replaced by erg; should progress run anchor instead.`
      );
    }
    if (w1Anchor && w2Anchor && w1Anchor === w2Anchor) {
      const w1m = weeks[0]!.plan_json.schedule.find(isRunThresholdAnchorDay)?.progression_marker
        ?.threshold_total_minutes;
      const w2m = weeks[1]!.plan_json.schedule.find(isRunThresholdAnchorDay)?.progression_marker
        ?.threshold_total_minutes;
      if (w1m && w2m && w2m <= w1m) {
        warnings.push(
          `Week 2 run threshold minutes (${w2m}) did not progress vs week 1 (${w1m}).`
        );
      }
    }
  }

  const buildWeeks = weekMetrics.filter((w) => !isDeloadWeekNumber(w.week_number));
  for (let i = 1; i < buildWeeks.length; i++) {
    const prev = buildWeeks[i - 1]!;
    const cur = buildWeeks[i]!;
    if (
      prev.block_number === cur.block_number &&
      prev.total_threshold_minutes > 0 &&
      cur.total_threshold_minutes > 0 &&
      cur.total_threshold_minutes < prev.total_threshold_minutes - 2
    ) {
      warnings.push(
        `Week ${cur.week_number}: total threshold minutes dropped vs week ${prev.week_number} without clear deload/taper reason.`
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

  if (shouldUseHyroxProDoubleProgression(input) && input.hyrox_track?.hyrox_event_type === "pro") {
    const preferred = (input.double_session_days ?? []).map((d) => d.trim()).filter(Boolean);

    for (const w of weekMetrics) {
      const schedule = weeks.find((wk) => wk.week_number === w.week_number)?.plan_json.schedule ?? [];
      const phase = resolveHyroxDoublePhase(
        w.week_number,
        w.week_focus,
        input.hyrox_track!.hyrox_event_type
      );

      if (w.week_number <= 3 && w.double_threshold_count > 0) {
        warnings.push(
          `Week ${w.week_number}: double-threshold appears too early for HYROX Pro (weeks 1–3 should be aerobic doubles only).`
        );
      }
      if (w.week_number >= 9 && w.week_number <= 11 && w.double_threshold_count === 0 && phase === "late_double_threshold") {
        warnings.push(
          `Week ${w.week_number}: expected a controlled double-threshold day in the performance block.`
        );
      }
      if (w.double_threshold_count > 1) {
        warnings.push(
          `Week ${w.week_number}: ${w.double_threshold_count} double-threshold days — keep to one per week.`
        );
      }

      if (ergThresholdReplacedRunAnchor(schedule)) {
        warnings.push(
          `Week ${w.week_number}: double-threshold or erg support may be replacing the run anchor instead of supporting it.`
        );
      }

      const sun = schedule.find((d) => d.day === "Sun");
      const mon = schedule.find((d) => d.day === "Mon");
      if (
        sun &&
        (sun.tags?.[0] === "long_run" || /long run/i.test(sun.title)) &&
        mon?.double_session?.enabled &&
        (mon.double_session?.double_session_intent === "double_threshold" ||
          mon.double_session?.session_stress === "high")
      ) {
        warnings.push(
          `Week ${w.week_number}: Monday double/hard work after Sunday long — not allowed for HYROX Pro.`
        );
      }

      if (preferred.length > 0 && w.double_count > 0) {
        const usedDays = schedule
          .filter((d) => d.double_session?.enabled)
          .map((d) => d.day);
        const ignored = preferred.filter(
          (p) => !usedDays.some((u) => u.toLowerCase().startsWith(p.toLowerCase().slice(0, 3)))
        );
        if (ignored.length === preferred.length && w.double_count > 0) {
          warnings.push(
            `Week ${w.week_number}: athlete-selected double days (${preferred.join(", ")}) were not used for doubles.`
          );
        }
      }
    }

    if (
      (input.has_injury || input.hyrox_track.impact_risk === "high") &&
      input.double_sessions
    ) {
      const aggressiveDoubles = weekMetrics.some((w) => w.double_threshold_count > 0);
      if (aggressiveDoubles) {
        warnings.push(
          "Injury/low-impact profile: double-threshold days present — should use conservative aerobic doubles only."
        );
      }
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
    athlete_double_days: input.double_session_days ?? [],
    weeks: weekMetrics,
    warnings: [...new Set(warnings)],
  };
}
