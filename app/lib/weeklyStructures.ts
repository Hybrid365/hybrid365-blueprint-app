// app/lib/weeklyStructures.ts

import type { AbilityLevel, GoalFocus, StructureRole, WeeklyHoursBand } from "./sessionLibrary";

export type WeeklyStructure = {
  id: string;
  days_per_week: number;
  label: string;
  primary_bias: "hybrid" | "running" | "strength";
  minimum_level?: AbilityLevel;
  double_session_friendly?: boolean;
  roles: StructureRole[];
};

export const WEEKLY_STRUCTURES: WeeklyStructure[] = [
  // 3 DAYS
  {
    id: "3D-A",
    days_per_week: 3,
    label: "3-Day Hybrid Default",
    primary_bias: "hybrid",
    roles: ["lower_full", "run_quality", "hybrid_primary"],
  },
  {
    id: "3D-B",
    days_per_week: 3,
    label: "3-Day Running Priority",
    primary_bias: "running",
    roles: ["run_quality", "lower_full", "run_long"],
  },
  {
    id: "3D-C",
    days_per_week: 3,
    label: "3-Day Strength Priority",
    primary_bias: "strength",
    roles: ["lower_full", "upper_full", "hybrid_density"],
  },
  {
    id: "3D-D",
    days_per_week: 3,
    label: "3-Day Short Time",
    primary_bias: "hybrid",
    roles: ["full_body_strength", "run_quality_beginner", "hybrid_density"],
  },
  {
    id: "3D-E",
    days_per_week: 3,
    label: "3-Day Beginner Hybrid",
    primary_bias: "hybrid",
    minimum_level: "beginner",
    roles: ["lower_full", "run_quality_beginner", "hybrid_density"],
  },

  // 4 DAYS
  {
    id: "4D-A",
    days_per_week: 4,
    label: "4-Day Hybrid Default",
    primary_bias: "hybrid",
    roles: ["lower_primary", "run_quality", "upper_full", "hybrid_primary"],
  },
  {
    id: "4D-B",
    days_per_week: 4,
    label: "4-Day Running Priority",
    primary_bias: "running",
    roles: ["run_quality", "lower_full", "upper_full", "run_long"],
  },
  {
    id: "4D-C",
    days_per_week: 4,
    label: "4-Day Strength Priority",
    primary_bias: "strength",
    roles: ["lower_primary", "upper_full", "run_quality_beginner", "hybrid_density"],
  },
  {
    id: "4D-D",
    days_per_week: 4,
    label: "4-Day Hyrox Priority",
    primary_bias: "hybrid",
    roles: ["lower_primary", "run_quality", "upper_full", "hybrid_primary"],
  },
  {
    id: "4D-E",
    days_per_week: 4,
    label: "4-Day Short Time",
    primary_bias: "hybrid",
    roles: ["full_body_strength", "run_quality_beginner", "upper_full", "hybrid_density"],
  },

  // 5 DAYS
  {
    id: "5D-A",
    days_per_week: 5,
    label: "5-Day Hybrid Default",
    primary_bias: "hybrid",
    roles: ["lower_primary", "run_quality", "upper_primary", "hybrid_primary", "run_long"],
  },
  {
    id: "5D-B",
    days_per_week: 5,
    label: "5-Day Running Priority",
    primary_bias: "running",
    roles: ["run_quality", "lower_full", "upper_full", "run_quality", "run_long"],
  },
  {
    id: "5D-C",
    days_per_week: 5,
    label: "5-Day Strength Priority",
    primary_bias: "strength",
    roles: ["lower_primary", "upper_primary", "run_quality_beginner", "full_body_strength", "aerobic_support"],
  },
  {
    id: "5D-D",
    days_per_week: 5,
    label: "5-Day Hyrox Priority",
    primary_bias: "hybrid",
    roles: ["lower_primary", "run_quality", "upper_primary", "hybrid_primary", "run_long"],
  },
  {
    id: "5D-E",
    days_per_week: 5,
    label: "5-Day Beginner",
    primary_bias: "hybrid",
    minimum_level: "beginner",
    roles: ["lower_full", "run_quality_beginner", "upper_full", "aerobic_support", "hybrid_density"],
  },

  // 6 DAYS
  {
    id: "6D-A",
    days_per_week: 6,
    label: "6-Day Hybrid Default",
    primary_bias: "hybrid",
    roles: ["lower_primary", "run_quality", "upper_primary", "aerobic_support", "hybrid_primary", "run_long"],
  },
  {
    id: "6D-B",
    days_per_week: 6,
    label: "6-Day Running Priority",
    primary_bias: "running",
    roles: ["run_quality", "lower_full", "upper_full", "run_quality", "aerobic_support", "run_long"],
  },
  {
    id: "6D-C",
    days_per_week: 6,
    label: "6-Day Hyrox Priority",
    primary_bias: "hybrid",
    roles: ["lower_primary", "run_quality", "upper_primary", "hybrid_density", "hybrid_primary", "run_long"],
  },
  {
    id: "6D-D",
    days_per_week: 6,
    label: "6-Day Strength Priority",
    primary_bias: "strength",
    roles: ["lower_primary", "upper_primary", "run_quality_beginner", "full_body_strength", "hybrid_density", "aerobic_support"],
  },
  {
    id: "6D-E",
    days_per_week: 6,
    label: "6-Day Advanced Double Session",
    primary_bias: "hybrid",
    minimum_level: "advanced",
    double_session_friendly: true,
    roles: ["lower_primary", "run_quality", "upper_primary", "hybrid_primary", "run_aerobic", "run_long"],
  },

  // 7 DAYS
  {
    id: "7D-A",
    days_per_week: 7,
    label: "7-Day Hybrid Advanced",
    primary_bias: "hybrid",
    roles: ["lower_primary", "run_quality", "upper_primary", "aerobic_support", "hybrid_primary", "run_long", "recovery"],
  },
  {
    id: "7D-B",
    days_per_week: 7,
    label: "7-Day Running Advanced",
    primary_bias: "running",
    roles: ["run_quality", "lower_full", "upper_full", "run_quality", "aerobic_support", "run_long", "recovery"],
  },
  {
    id: "7D-C",
    days_per_week: 7,
    label: "7-Day Hyrox Advanced",
    primary_bias: "hybrid",
    roles: ["lower_primary", "run_quality", "upper_primary", "hybrid_density", "hybrid_primary", "run_long", "recovery"],
  },
];

export function mapGoalToBias(goal: GoalFocus): "hybrid" | "running" | "strength" {
  if (goal === "running") return "running";
  if (goal === "muscle") return "strength";
  return "hybrid";
}

function scoreStructureForHours(structure: WeeklyStructure, hours: WeeklyHoursBand): number {
  const roles = structure.roles;

  const count = (role: StructureRole) => roles.filter((r) => r === role).length;
  const has = (role: StructureRole) => roles.includes(role);

  const fullBodyCount = count("full_body_strength");
  const beginnerRunCount = count("run_quality_beginner");
  const primaryRunQualityCount = count("run_quality");
  const longRunCount = count("run_long");
  const runAerobicCount = count("run_aerobic");
  const aerobicSupportCount = count("aerobic_support");
  const hybridPrimaryCount = count("hybrid_primary");
  const hybridDensityCount = count("hybrid_density");
  const lowerPrimaryCount = count("lower_primary");
  const upperPrimaryCount = count("upper_primary");
  const lowerFullCount = count("lower_full");
  const upperFullCount = count("upper_full");

  // Approximate complexity from role makeup only.
  const complexityScore =
    lowerPrimaryCount +
    upperPrimaryCount +
    hybridPrimaryCount +
    hybridDensityCount +
    longRunCount +
    Math.max(0, primaryRunQualityCount - 1);

  let score = 0;

  // weekly_hours_band is used as a soft preference/tie-breaker only, not a hard filter.
  if (hours === "2-3" || hours === "3-5") {
    score += fullBodyCount * 2;
    score += beginnerRunCount * 2;
    score += (lowerFullCount + upperFullCount) * 1;
    score += count("recovery");
    score += count("aerobic_support");
    score -= complexityScore;
    score -= longRunCount;
  } else if (hours === "5-7") {
    // Keep close to current behaviour while slightly preferring balanced plans.
    if (has("run_quality")) score += 1;
    if (has("lower_primary") || has("lower_full")) score += 1;
    if (has("upper_primary") || has("upper_full")) score += 1;
    if (has("hybrid_primary") || has("hybrid_density")) score += 1;
    if (has("aerobic_support")) score += 1;
  } else if (hours === "7-10" || hours === "10+") {
    score += longRunCount * 2;
    score += runAerobicCount * 2;
    score += aerobicSupportCount * 2;
    score += hybridPrimaryCount;
    score += primaryRunQualityCount;
    if (lowerPrimaryCount > 0 && upperPrimaryCount > 0) score += 1;
    if (hours === "10+" && structure.double_session_friendly) score += 2;
  }

  return score;
}

export function pickWeeklyStructure(input: {
  days_per_week: number;
  goal_focus: GoalFocus;
  ability_level: AbilityLevel;
  double_sessions?: boolean;
  weekly_hours_band: WeeklyHoursBand;
}) {
  const bias = mapGoalToBias(input.goal_focus);

  const candidates = WEEKLY_STRUCTURES.filter(
    (s) =>
      s.days_per_week === input.days_per_week &&
      s.primary_bias === bias &&
      (!s.minimum_level || s.minimum_level === input.ability_level || input.ability_level !== "beginner") &&
      (!s.double_session_friendly || !!input.double_sessions)
  );

  if (candidates.length > 0) {
    const ranked = candidates
      .map((structure, index) => ({
        structure,
        index,
        score: scoreStructureForHours(structure, input.weekly_hours_band),
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index);

    return ranked[0].structure;
  }

  return (
    WEEKLY_STRUCTURES.find((s) => s.days_per_week === input.days_per_week && s.primary_bias === bias) ||
    WEEKLY_STRUCTURES.find((s) => s.days_per_week === input.days_per_week) ||
    WEEKLY_STRUCTURES.find((s) => s.id === "4D-A")!
  );
}