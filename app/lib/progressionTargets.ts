import type { GoalFocus } from "./sessionLibrary";

export type ProgramType = "free_week" | "community_12_week";

export type LoadBand = "low" | "moderate" | "high";
export type StrengthFocus = "movement_quality" | "strength_foundations" | "strength_progression" | "maintenance";
export type IntensityBand = "low_moderate" | "moderate" | "moderate_high" | "high";

export type TrainingEmphasis = {
  aerobic_base: LoadBand;
  threshold_volume: LoadBand;
  strength_focus: StrengthFocus;
  hybrid_specificity: LoadBand;
  intensity: IntensityBand;
};

export type ProgressionTarget = {
  program_type: ProgramType;
  block_number: number | null;
  week_number: number | null;
  block_focus:
    | "sample_week"
    | "build_the_base"
    | "build_the_engine"
    | "build_performance";
  week_focus:
    | "balanced_intro"
    | "base_intro"
    | "base_progression"
    | "base_peak"
    | "base_deload"
    | "engine_intro"
    | "threshold_build"
    | "engine_peak"
    | "engine_deload"
    | "performance_intro"
    | "specificity_peak"
    | "sharpen_and_test"
    | "test_or_taper";
  target_relative_load: number | null;
  target_load_range: { min: number; max: number } | null;
  training_emphasis: TrainingEmphasis | null;
};

export type StressAlignment = {
  status: "below_target" | "on_target" | "above_target";
  message: string;
};

type CommunityWeekTarget = {
  block_number: 1 | 2 | 3;
  block_focus: "build_the_base" | "build_the_engine" | "build_performance";
  week_focus:
    | "base_intro"
    | "base_progression"
    | "base_peak"
    | "base_deload"
    | "engine_intro"
    | "threshold_build"
    | "engine_peak"
    | "engine_deload"
    | "performance_intro"
    | "specificity_peak"
    | "sharpen_and_test"
    | "test_or_taper";
  target_relative_load: number;
  target_load_range: { min: number; max: number };
};

const FREE_WEEK_TARGET: ProgressionTarget = {
  program_type: "free_week",
  block_number: null,
  week_number: null,
  block_focus: "sample_week",
  week_focus: "balanced_intro",
  target_relative_load: null,
  target_load_range: null,
  training_emphasis: null,
};

const COMMUNITY_12_WEEK_TARGETS: Record<number, CommunityWeekTarget> = {
  1: {
    block_number: 1,
    block_focus: "build_the_base",
    week_focus: "base_intro",
    target_relative_load: 0.85,
    target_load_range: { min: 0.8, max: 0.9 },
  },
  2: {
    block_number: 1,
    block_focus: "build_the_base",
    week_focus: "base_progression",
    target_relative_load: 0.95,
    target_load_range: { min: 0.9, max: 1.0 },
  },
  3: {
    block_number: 1,
    block_focus: "build_the_base",
    week_focus: "base_peak",
    target_relative_load: 1.1,
    target_load_range: { min: 1.05, max: 1.2 },
  },
  4: {
    block_number: 1,
    block_focus: "build_the_base",
    week_focus: "base_deload",
    target_relative_load: 0.7,
    target_load_range: { min: 0.65, max: 0.8 },
  },
  5: {
    block_number: 2,
    block_focus: "build_the_engine",
    week_focus: "engine_intro",
    target_relative_load: 0.9,
    target_load_range: { min: 0.85, max: 0.95 },
  },
  6: {
    block_number: 2,
    block_focus: "build_the_engine",
    week_focus: "threshold_build",
    target_relative_load: 1.05,
    target_load_range: { min: 1.0, max: 1.1 },
  },
  7: {
    block_number: 2,
    block_focus: "build_the_engine",
    week_focus: "engine_peak",
    target_relative_load: 1.18,
    target_load_range: { min: 1.1, max: 1.25 },
  },
  8: {
    block_number: 2,
    block_focus: "build_the_engine",
    week_focus: "engine_deload",
    target_relative_load: 0.75,
    target_load_range: { min: 0.7, max: 0.85 },
  },
  9: {
    block_number: 3,
    block_focus: "build_performance",
    week_focus: "performance_intro",
    target_relative_load: 1.0,
    target_load_range: { min: 0.95, max: 1.1 },
  },
  10: {
    block_number: 3,
    block_focus: "build_performance",
    week_focus: "specificity_peak",
    target_relative_load: 1.15,
    target_load_range: { min: 1.08, max: 1.22 },
  },
  11: {
    block_number: 3,
    block_focus: "build_performance",
    week_focus: "sharpen_and_test",
    target_relative_load: 1.1,
    target_load_range: { min: 1.0, max: 1.18 },
  },
  12: {
    block_number: 3,
    block_focus: "build_performance",
    week_focus: "test_or_taper",
    target_relative_load: 0.8,
    target_load_range: { min: 0.7, max: 0.9 },
  },
};

function buildEmphasis(blockNumber: 1 | 2 | 3, goalFocus: GoalFocus): TrainingEmphasis {
  if (blockNumber === 1) {
    return {
      aerobic_base: "high",
      threshold_volume: "low",
      strength_focus: "movement_quality",
      hybrid_specificity: goalFocus === "hybrid" ? "moderate" : "low",
      intensity: "low_moderate",
    };
  }
  if (blockNumber === 2) {
    return {
      aerobic_base: "moderate",
      threshold_volume: "high",
      strength_focus: "strength_progression",
      hybrid_specificity: goalFocus === "hybrid" ? "high" : "moderate",
      intensity: "moderate_high",
    };
  }
  return {
    aerobic_base: "moderate",
    threshold_volume: "moderate",
    strength_focus: "maintenance",
    hybrid_specificity: goalFocus === "hybrid" ? "high" : "moderate",
    intensity: "high",
  };
}

function resolveBlockFromWeek(weekNumber: number): 1 | 2 | 3 | null {
  if (weekNumber >= 1 && weekNumber <= 4) return 1;
  if (weekNumber >= 5 && weekNumber <= 8) return 2;
  if (weekNumber >= 9 && weekNumber <= 12) return 3;
  return null;
}

export function getProgressionTarget(
  programType: ProgramType,
  blockNumber: number | null,
  weekNumber: number | null,
  goalFocus: GoalFocus
): ProgressionTarget | null {
  if (programType === "free_week") {
    return FREE_WEEK_TARGET;
  }

  if (weekNumber === null || !Number.isInteger(weekNumber)) {
    return null;
  }

  const target = COMMUNITY_12_WEEK_TARGETS[weekNumber];
  if (!target) return null;

  const resolvedBlock = resolveBlockFromWeek(weekNumber);
  if (!resolvedBlock) return null;
  if (blockNumber !== null && blockNumber !== resolvedBlock) return null;

  return {
    program_type: "community_12_week",
    block_number: resolvedBlock,
    week_number: weekNumber,
    block_focus: target.block_focus,
    week_focus: target.week_focus,
    target_relative_load: target.target_relative_load,
    target_load_range: target.target_load_range,
    training_emphasis: buildEmphasis(resolvedBlock, goalFocus),
  };
}

export function getStressAlignment(
  actualRelativeLoad: number,
  target: Pick<ProgressionTarget, "target_load_range" | "target_relative_load" | "program_type"> | null
): StressAlignment | null {
  if (!target || target.target_relative_load === null || target.target_load_range === null) {
    return null;
  }

  const roundedActual = Math.round(actualRelativeLoad * 1000) / 1000;
  const { min, max } = target.target_load_range;

  if (roundedActual < min) {
    return {
      status: "below_target",
      message: `Current load (${roundedActual}) is below target range (${min}-${max}) for this week.`,
    };
  }
  if (roundedActual > max) {
    return {
      status: "above_target",
      message: `Current load (${roundedActual}) is above target range (${min}-${max}) for this week.`,
    };
  }
  return {
    status: "on_target",
    message: `Current load (${roundedActual}) is on target for this week (${min}-${max}).`,
  };
}
