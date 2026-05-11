import {
  buildWeekBlueprint,
  type BlueprintInput,
} from "./buildWeekBlueprint";
import { getProgressionTarget } from "./progressionTargets";
import type { PlanJson } from "./sessionLibrary";

export type PaidProgrammeInput = BlueprintInput & {
  email?: string;
};

export type GeneratedProgrammeWeek = {
  week_number: number;
  block_number: 1 | 2 | 3;
  title: string;
  plan_json: PlanJson;
};

const WEEK_FOCUS_TITLES: Record<string, string> = {
  base_intro: "Base Intro",
  base_progression: "Base Progression",
  base_peak: "Base Peak",
  base_deload: "Base Deload",
  engine_intro: "Engine Intro",
  threshold_build: "Threshold Build",
  engine_peak: "Engine Peak",
  engine_deload: "Engine Deload",
  performance_intro: "Performance Intro",
  specificity_peak: "Specificity Peak",
  sharpen_and_test: "Sharpen & Test",
  test_or_taper: "Test or Taper",
};

function blockForWeek(weekNumber: number): 1 | 2 | 3 {
  if (weekNumber <= 4) return 1;
  if (weekNumber <= 8) return 2;
  return 3;
}

function titleForWeek(weekNumber: number, weekFocus: string): string {
  const focusTitle = WEEK_FOCUS_TITLES[weekFocus] ?? "Programme Week";
  return `Week ${weekNumber}: ${focusTitle}`;
}

export function generate12WeekProgramme(
  input: PaidProgrammeInput
): GeneratedProgrammeWeek[] {
  const weeks: GeneratedProgrammeWeek[] = [];

  for (let weekNumber = 1; weekNumber <= 12; weekNumber += 1) {
    const blockNumber = blockForWeek(weekNumber);
    const progressionTarget = getProgressionTarget(
      "community_12_week",
      blockNumber,
      weekNumber,
      input.goal_focus
    );

    if (!progressionTarget) {
      throw new Error(`Missing progression target for week ${weekNumber}`);
    }

    const generated = buildWeekBlueprint(input, {
      program_type: "community_12_week",
      week_number: weekNumber,
      block_number: blockNumber,
      progression_target: progressionTarget,
    });

    const plan_json: PlanJson = {
      ...generated,
      week_context: progressionTarget,
      stress_alignment:
        generated.stress_alignment ?? null,
    };

    weeks.push({
      week_number: weekNumber,
      block_number: blockNumber,
      title: titleForWeek(weekNumber, progressionTarget.week_focus),
      plan_json,
    });
  }

  return weeks;
}
