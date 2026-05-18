import type { BlueprintInput } from "./buildWeekBlueprint";
import type { DayPlan } from "./sessionLibrary";
import {
  blockPhaseLabel,
  summariseWeekMarkers,
  type ProgressionMarker,
} from "./progressionFamilies";
import type { WeekRationale } from "./programmeRationale";
import type { RunVolumePlan } from "./runVolumePlanner";
import { buildHyroxWeekCoachingParagraph } from "./hyroxTrackContext";

export type EnhancedWeekRationale = WeekRationale & {
  progression_focus: string;
  what_progressed_from_last_week: string;
  key_marker_this_week: string;
};

function blockRoleSentence(weekNumber: number, weekFocus?: string | null): string {
  const phase = blockPhaseLabel(weekNumber, weekFocus);
  if (phase === "deload_control") {
    return "This is a control week. Volume drops slightly so you absorb the previous three weeks and prepare for the next build.";
  }
  if (phase === "build_foundation") {
    return "Weeks 1–3 in this block build foundation, consistency, and tolerance before a control week.";
  }
  if (phase === "extend_quality") {
    return "This week extends quality work — more structure, not more chaos.";
  }
  if (phase === "peak_density") {
    return "This is the densest week of the block — execute Priority 1 sessions with intent.";
  }
  if (phase === "specificity_sharpen") {
    return "Block 3 sharpens race-relevant fitness — sessions should feel more specific.";
  }
  if (phase === "taper_test") {
    return "Final week — taper, test, or race readiness depending on your goal.";
  }
  return "This week continues the planned progression for your block.";
}

function goalScaledFocus(input: BlueprintInput, weekNumber: number, weekFocus?: string | null): string {
  if (input.ability_level === "beginner") {
    return "The goal is not to chase intensity yet — this week builds confidence, tolerance, and repeatable execution.";
  }
  if (input.goal_focus === "muscle") {
    return "This week keeps conditioning controlled so the main lifts can progress without accumulating too much fatigue.";
  }
  if (input.has_injury) {
    return "Progression stays conservative — low-impact options and substitution-first guidance protect recovery.";
  }
  return blockRoleSentence(weekNumber, weekFocus);
}

function formatMarkerLine(marker: ProgressionMarker, input: BlueprintInput): string {
  const parts: string[] = [];
  if (marker.total_threshold_minutes || marker.threshold_total_minutes) {
    const total = marker.total_threshold_minutes ?? marker.threshold_total_minutes!;
    const b = marker.threshold_modality_breakdown;
    if (b && (b.ski || b.row || b.bike)) {
      const mods: string[] = [];
      if (b.run) mods.push(`run ${b.run}`);
      if (b.ski) mods.push(`ski ${b.ski}`);
      if (b.row) mods.push(`row ${b.row}`);
      if (b.bike) mods.push(`bike ${b.bike}`);
      parts.push(`${total} min threshold (${mods.join(", ")})`);
    } else {
      parts.push(`${total} min total threshold volume`);
    }
  }
  if (marker.long_run_minutes) {
    parts.push(`${marker.long_run_minutes} min long-run target`);
  }
  if (marker.interval_total_reps) {
    parts.push(`${marker.interval_total_reps} interval reps`);
  }
  if (marker.strength_main_lift_sets && marker.strength_main_lift_reps) {
    parts.push(
      `Main lifts ~${marker.strength_main_lift_sets}×${marker.strength_main_lift_reps} progression`
    );
  }
  if (marker.hyrox_station_density) {
    parts.push(`Station density focus (${marker.hyrox_station_density} total reps target)`);
  }
  if (marker.low_impact_aerobic_minutes) {
    parts.push(`${marker.low_impact_aerobic_minutes} min low-impact aerobic`);
  }
  if (marker.weekly_run_exposures) {
    parts.push(`${marker.weekly_run_exposures} coached run exposures`);
  }
  if (parts.length === 0) {
    if (input.goal_focus === "running") return "Running quality and aerobic support across the week.";
    if (input.goal_focus === "muscle") return "Strength emphasis with supporting conditioning.";
    return "Balanced hybrid sessions with clear Priority 1 work.";
  }
  return parts.join(" · ");
}

function whatProgressedLine(
  current: ProgressionMarker,
  previous: ProgressionMarker | null,
  schedule: DayPlan[]
): string {
  const comparisons = schedule
    .map((d) => d.progression_marker?.previous_week_comparison)
    .filter(Boolean) as string[];
  if (comparisons.length > 0) {
    return comparisons[0]!;
  }
  if (current.previous_week_comparison) return current.previous_week_comparison;
  if (!previous) return "First week of this block — establishes your baseline for the next three weeks.";
  if (
    current.threshold_total_minutes &&
    previous.threshold_total_minutes &&
    current.threshold_total_minutes > previous.threshold_total_minutes
  ) {
    return `Threshold volume up from ${previous.threshold_total_minutes} to ${current.threshold_total_minutes} minutes.`;
  }
  if (
    current.long_run_minutes &&
    previous.long_run_minutes &&
    current.long_run_minutes > previous.long_run_minutes
  ) {
    return `Long run builds from ${previous.long_run_minutes} to ${current.long_run_minutes} minutes.`;
  }
  return "Session structure progresses from last week — details are in each key session.";
}

export function buildEnhancedWeekRationale(args: {
  base: WeekRationale;
  weekNumber: number;
  weekFocus?: string | null;
  input: BlueprintInput;
  schedule: DayPlan[];
  previousSchedule?: DayPlan[];
  runVolumePlan?: RunVolumePlan | null;
}): EnhancedWeekRationale {
  const { base, weekNumber, weekFocus, input, schedule, previousSchedule, runVolumePlan } = args;

  const currentMarker = summariseWeekMarkers(schedule);
  if (runVolumePlan) {
    currentMarker.estimated_run_volume_km = Math.round(
      (runVolumePlan.targetKmMin + runVolumePlan.targetKmMax) / 2
    );
  }

  const previousMarker = previousSchedule ? summariseWeekMarkers(previousSchedule) : null;

  const familySnippets = schedule
    .map((d) => {
      const fam = d.progression_family;
      if (!fam) return null;
      const note = d.session?.notes?.find((n) => n.includes("Week focus:"));
      return note ?? null;
    })
    .filter(Boolean);

  let progression_focus =
    goalScaledFocus(input, weekNumber, weekFocus) +
    (familySnippets[0] ? ` ${String(familySnippets[0]).replace(/^Week focus:\s*/i, "")}` : "");

  let coach_note = base.coach_note;

  if (input.hyrox_track?.active) {
    const hyroxParagraph = buildHyroxWeekCoachingParagraph({
      ctx: input.hyrox_track,
      weekNumber,
      weekFocus,
      schedule,
    });
    coach_note = `${hyroxParagraph} ${coach_note}`.trim();
    if (input.hyrox_track.hyrox_timeline === "race_specific" || weekNumber >= 9) {
      progression_focus = `${input.hyrox_track.phase_emphasis} ${progression_focus}`;
    }
  }

  return {
    ...base,
    progression_focus,
    what_progressed_from_last_week: whatProgressedLine(currentMarker, previousMarker, schedule),
    key_marker_this_week: formatMarkerLine(currentMarker, input),
    coach_note,
  };
}
