import { CORE_JOURNEY_STEPS } from "@/app/lib/track-production/journeyProduct";

export { CORE_JOURNEY_STEPS };

export type JourneyContinueReason = "next" | "enter-track" | "last-screen" | "backward-blocked";

export type JourneyContinueTarget = {
  step: string;
  action: "advance" | "enter" | "stay";
  reason: JourneyContinueReason;
};

/**
 * Core onboarding only. Assessment and the real Track home are not wizard steps.
 * Continue never returns an earlier step.
 */
export function journeyContinueTarget(args: {
  step: string;
  steps: readonly string[];
  needsAssessment?: boolean;
}): JourneyContinueTarget {
  const current = args.steps.indexOf(args.step);
  const here = current >= 0 ? current : 0;
  const currentStep = args.steps[here] ?? args.step;
  const next = args.steps[here + 1];
  if (!next) {
    return { step: "dashboard", action: "enter", reason: "enter-track" };
  }
  if (args.steps.indexOf(next) < here) {
    return { step: currentStep, action: "stay", reason: "backward-blocked" };
  }
  return { step: next, action: "advance", reason: "next" };
}

export function journeyResumeStep(args: {
  step: string;
  steps: readonly string[];
  accessReady: boolean;
}): { step: string; reason: "dashboard" | "stored" } {
  if (args.accessReady) return { step: "dashboard", reason: "dashboard" };
  if (args.steps.includes(args.step)) return { step: args.step, reason: "stored" };
  return { step: args.steps[0] ?? CORE_JOURNEY_STEPS[0], reason: "stored" };
}
