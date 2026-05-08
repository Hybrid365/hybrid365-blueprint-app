import type { GoalFocus, SessionTemplate, StructureRole } from "./sessionLibrary";

export type SessionPriorityRank = 1 | 2 | 3;
export type SessionPriorityLabel = "priority_1" | "priority_2" | "priority_3";

export type SessionPriority = {
  rank: SessionPriorityRank;
  label: SessionPriorityLabel;
  display_label: "Priority 1" | "Priority 2" | "Priority 3";
  category_label: "Key Session" | "Support Session" | "Optional / Flexible";
  reason: string;
};

function toPriority(rank: SessionPriorityRank, reason: string): SessionPriority {
  if (rank === 1) {
    return {
      rank,
      label: "priority_1",
      display_label: "Priority 1",
      category_label: "Key Session",
      reason,
    };
  }
  if (rank === 2) {
    return {
      rank,
      label: "priority_2",
      display_label: "Priority 2",
      category_label: "Support Session",
      reason,
    };
  }
  return {
    rank,
    label: "priority_3",
    display_label: "Priority 3",
    category_label: "Optional / Flexible",
    reason,
  };
}

export function computeSessionPriority({
  goalFocus,
  role,
  session,
}: {
  goalFocus: GoalFocus;
  role: StructureRole;
  session: SessionTemplate;
}): SessionPriority {
  const isGoalRun = goalFocus === "running";
  const isGoalHybrid = goalFocus === "hybrid";
  const isGoalMuscle = goalFocus === "muscle";

  // Priority 1: explicit key-session rules
  if (isGoalRun && (role === "run_quality" || role === "run_long")) {
    return toPriority(1, "This is one of the main goal-driving sessions for the week.");
  }
  if (isGoalRun && (session.type === "threshold_run" || session.type === "interval_run")) {
    return toPriority(1, "This is one of the main goal-driving sessions for the week.");
  }
  if (isGoalHybrid && role === "hybrid_primary") {
    return toPriority(1, "This is one of the main goal-driving sessions for the week.");
  }
  if (isGoalHybrid && session.type === "hybrid_compromised") {
    return toPriority(1, "This is one of the main goal-driving sessions for the week.");
  }
  if (isGoalHybrid && role === "run_quality") {
    return toPriority(1, "This is one of the main goal-driving sessions for the week.");
  }
  if (
    isGoalMuscle &&
    (role === "lower_primary" || role === "lower_full" || role === "upper_primary" || role === "full_body_strength")
  ) {
    return toPriority(1, "This is one of the main goal-driving sessions for the week.");
  }

  // High-fatigue sessions that directly match the goal can be Priority 1
  if (session.fatigue === "high") {
    const goalMatch =
      (isGoalRun && session.category === "run") ||
      (isGoalHybrid && session.category === "hybrid") ||
      (isGoalMuscle && session.category === "strength");
    if (goalMatch) {
      return toPriority(1, "This is one of the main goal-driving sessions for the week.");
    }
  }

  // Priority 3: explicit flexible rules
  if (session.category === "recovery" || session.type === "recovery") {
    return toPriority(3, "This is useful support work, but it is the easiest to flex if life gets busy.");
  }
  if (session.category === "aerobic" && session.fatigue === "low") {
    return toPriority(3, "This is useful support work, but it is the easiest to flex if life gets busy.");
  }
  if (session.category !== "run" && session.category !== "hybrid" && session.fatigue === "low") {
    return toPriority(3, "This is useful support work, but it is the easiest to flex if life gets busy.");
  }

  // Priority 2: support work defaults + requested mappings
  if (session.type === "tempo_run" || session.type === "aerobic_run" || session.type === "hybrid_density") {
    return toPriority(2, "This supports the key work without carrying the same priority.");
  }
  if (role === "aerobic_support" && session.type === "aerobic_support") {
    return toPriority(2, "This supports the key work without carrying the same priority.");
  }
  if ((goalFocus === "running" || goalFocus === "hybrid") && (role === "upper_full" || role === "upper_primary")) {
    return toPriority(2, "This supports the key work without carrying the same priority.");
  }
  if ((goalFocus === "running" || goalFocus === "hybrid") && session.type === "strength_lower") {
    return toPriority(2, "This supports the key work without carrying the same priority.");
  }
  if (session.category === "strength" || session.category === "run" || session.category === "hybrid") {
    return toPriority(2, "This supports the key work without carrying the same priority.");
  }

  return toPriority(3, "This is useful support work, but it is the easiest to flex if life gets busy.");
}

export function createFillerPriority(kind: "recovery" | "aerobic_support"): SessionPriority {
  if (kind === "recovery") {
    return toPriority(3, "This supports recovery and can be kept easy.");
  }
  return toPriority(3, "This adds low-cost aerobic support and can be adjusted if needed.");
}
