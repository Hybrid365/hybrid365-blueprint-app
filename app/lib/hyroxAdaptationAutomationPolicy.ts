/**
 * Automation-policy assessment for adaptation recommendations.
 * Does NOT apply changes. 1-1 ignores eligibility (coach mandatory).
 * Future Track may inspect this field.
 */

import type {
  AdaptationConfidence,
  AdaptationRecommendation,
  AdaptationVerb,
  AutomationClass,
  AutomationEligibility,
} from "@/app/lib/hyroxAdaptationTypes";
import type { SessionExecutionSummary } from "@/app/lib/hyroxSessionExecutionTypes";

export type { AutomationClass, AutomationEligibility };

export type AutomationPolicyContext = {
  raceWeek?: boolean;
  missingAnchor?: boolean;
  conflictingSignals?: boolean;
  unusualCoachOverride?: boolean;
};

const UNSAFE_AUTO_VERBS: AdaptationVerb[] = [
  "REMOVE",
  "REPLACE",
  "CHANGE_TARGET",
  "MOVE",
  "SKIP_TO",
  "COACH_REVIEW",
];

function classForSafeVerb(verb: AdaptationVerb): AutomationClass | null {
  if (verb === "PROGRESS") return "SAFE_FAMILY_PROGRESSION";
  if (verb === "REPEAT") return "SAFE_REPEAT";
  if (verb === "DELOAD") return "SAFE_DELOAD";
  if (verb === "REDUCE") return "SAFE_EASY_VOLUME_ADJUSTMENT";
  if (verb === "KEEP") return "SAFE_REPEAT";
  return null;
}

/**
 * Assess whether a recommendation could ever be auto-applied by Track later.
 * Always separate from coach decision. Default requires_coach.
 */
export function assessAutomationEligibility(args: {
  verb: AdaptationVerb;
  confidence: AdaptationConfidence;
  execution: SessionExecutionSummary | null;
  suggestedNextStageId: string | null;
  familyId: string | null;
  fitnessPenalty: boolean;
  context?: AutomationPolicyContext;
}): AutomationEligibility {
  const reasons: string[] = [];
  const ctx = args.context ?? {};

  if (args.execution?.pain === "meaningful") {
    return {
      allowed: false,
      class: "BLOCKED_PAIN",
      reasons: ["Meaningful pain reported — automation blocked"],
    };
  }

  if (args.confidence === "low") {
    return {
      allowed: false,
      class: "BLOCKED_LOW_CONFIDENCE",
      reasons: ["Low confidence evidence — requires coach"],
    };
  }

  if (ctx.conflictingSignals) {
    return {
      allowed: false,
      class: "BLOCKED_CONFLICTING_SIGNALS",
      reasons: ["Recent comparable sessions disagree"],
    };
  }

  if (ctx.missingAnchor) {
    return {
      allowed: false,
      class: "BLOCKED_MISSING_ANCHOR",
      reasons: ["Required programming anchor missing"],
    };
  }

  if (ctx.raceWeek) {
    return {
      allowed: false,
      class: "BLOCKED_RACE_WEEK",
      reasons: ["Race/taper week — automation disallowed by policy"],
    };
  }

  if (ctx.unusualCoachOverride) {
    return {
      allowed: false,
      class: "REQUIRES_COACH",
      reasons: ["Unusual coach override context"],
    };
  }

  if (UNSAFE_AUTO_VERBS.includes(args.verb)) {
    return {
      allowed: false,
      class: "BLOCKED_UNSAFE_VERB",
      reasons: [`${args.verb} is never automation-eligible in foundation policy`],
    };
  }

  if (
    (args.verb === "PROGRESS" || args.verb === "REDUCE" || args.verb === "DELOAD") &&
    args.familyId &&
    !args.suggestedNextStageId
  ) {
    return {
      allowed: false,
      class: "BLOCKED_INVALID_TRANSITION",
      reasons: ["No valid Session Family stage target"],
    };
  }

  if (args.verb === "PROGRESS" && args.confidence !== "high") {
    return {
      allowed: false,
      class: "BLOCKED_LOW_CONFIDENCE",
      reasons: ["PROGRESS only automation-eligible at high confidence"],
    };
  }

  const safeClass = classForSafeVerb(args.verb);
  if (!safeClass) {
    return {
      allowed: false,
      class: "REQUIRES_COACH",
      reasons: ["No safe automation class for this verb"],
    };
  }

  if (args.verb === "PROGRESS") {
    reasons.push("High-confidence structured feedback");
    reasons.push("Valid family PROGRESS edge");
    reasons.push("No pain / race-week / conflict gates fired");
  } else {
    reasons.push(`Verb ${args.verb} mapped to ${safeClass}`);
  }

  return { allowed: true, class: safeClass, reasons };
}

export function withAutomationEligibility(
  recommendation: Omit<AdaptationRecommendation, "automationEligibility" | "athleteExplanation"> &
    Partial<Pick<AdaptationRecommendation, "automationEligibility" | "athleteExplanation">>,
  context?: AutomationPolicyContext
): AutomationEligibility {
  return assessAutomationEligibility({
    verb: recommendation.verb,
    confidence: recommendation.confidence,
    execution: recommendation.executionSummary,
    suggestedNextStageId: recommendation.suggestedNext?.toStageId ?? null,
    familyId: recommendation.familyId,
    fitnessPenalty: recommendation.fitnessPenalty,
    context,
  });
}
