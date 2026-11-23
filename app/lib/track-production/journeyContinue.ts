const ASSESSMENT_HANDOFF_STEPS = new Set(["profile", "ready", "progress", "home"]);

export type JourneyContinueTarget = {
  step: string;
  action: "advance" | "assessment";
};

/**
 * The setup wizard's last screens are a preview. Outstanding tests hand back
 * to the assessment week instead of staying on a fake Home.
 */
export function journeyContinueTarget(args: {
  step: string;
  steps: readonly string[];
  needsAssessment: boolean;
}): JourneyContinueTarget {
  if (args.needsAssessment && args.steps.includes("week") && ASSESSMENT_HANDOFF_STEPS.has(args.step)) {
    return { step: "week", action: "assessment" };
  }
  const index = Math.max(0, args.steps.indexOf(args.step));
  const next = args.steps[Math.min(args.steps.length - 1, index + 1)] ?? args.step;
  return { step: next, action: "advance" };
}
