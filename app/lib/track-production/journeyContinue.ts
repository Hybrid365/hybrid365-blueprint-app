export const JOURNEY_STEP_ORDER = [
  "welcome",
  "goal",
  "event",
  "availability",
  "background",
  "equipment",
  "pain",
  "evidence",
  "decisions",
  "summary",
  "week",
  "profile",
  "ready",
  "progress",
  "home",
] as const;

export type JourneyContinueReason = "next" | "assessment-open" | "last-screen" | "backward-blocked";

export type JourneyContinueTarget = {
  step: string;
  action: "advance" | "stay";
  reason: JourneyContinueReason;
};

/**
 * One setup order for the wizard, the saved step, and resume.
 * Continue never returns an earlier step. An open assessment week is the
 * milestone: later preview screens are not a forward move, and they are not
 * a backward jump either.
 */
export function journeyContinueTarget(args: {
  step: string;
  steps: readonly string[];
  needsAssessment: boolean;
}): JourneyContinueTarget {
  const current = args.steps.indexOf(args.step);
  const here = current >= 0 ? current : 0;
  const currentStep = args.steps[here] ?? args.step;
  const week = args.steps.indexOf("week");
  if (args.needsAssessment && week >= 0 && here >= week) {
    return {
      step: currentStep,
      action: "stay",
      reason: here === week ? "assessment-open" : "backward-blocked",
    };
  }
  const next = args.steps[here + 1];
  if (!next || args.steps.indexOf(next) < here) {
    return { step: currentStep, action: "stay", reason: next ? "backward-blocked" : "last-screen" };
  }
  return { step: next, action: "advance", reason: "next" };
}

export function journeyResumeStep(args: {
  step: string;
  steps: readonly string[];
  needsAssessment: boolean;
}): { step: string; reason: "stored" | "assessment-still-required" } {
  const current = args.steps.indexOf(args.step);
  const week = args.steps.indexOf("week");
  if (args.needsAssessment && week >= 0 && current > week) {
    return { step: args.steps[week] ?? "week", reason: "assessment-still-required" };
  }
  if (current < 0) return { step: args.steps[0] ?? "welcome", reason: "stored" };
  return { step: args.step, reason: "stored" };
}
