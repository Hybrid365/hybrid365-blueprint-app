/**
 * Adaptation recommendation + coach decision types (1-1 recommend-only).
 * Session Family stage verbs and remaining-week verbs share one verb enum.
 */

import type { SessionExecutionSummary } from "@/app/lib/hyroxSessionExecutionTypes";

export const ADAPTATION_VERBS = [
  "KEEP",
  "PROGRESS",
  "REPEAT",
  "REDUCE",
  "DELOAD",
  "CHANGE_TARGET",
  "MOVE",
  "REPLACE",
  "REMOVE",
  "SKIP_TO",
  "COACH_REVIEW",
] as const;

export type AdaptationVerb = (typeof ADAPTATION_VERBS)[number];

export const ADAPTATION_CONFIDENCE = ["low", "medium", "high"] as const;
export type AdaptationConfidence = (typeof ADAPTATION_CONFIDENCE)[number];

export const AUTOMATION_CLASSES = [
  "SAFE_FAMILY_PROGRESSION",
  "SAFE_REPEAT",
  "SAFE_DELOAD",
  "SAFE_EASY_VOLUME_ADJUSTMENT",
  "REQUIRES_COACH",
  "BLOCKED_PAIN",
  "BLOCKED_LOW_CONFIDENCE",
  "BLOCKED_CONFLICTING_SIGNALS",
  "BLOCKED_INVALID_TRANSITION",
  "BLOCKED_MISSING_ANCHOR",
  "BLOCKED_RACE_WEEK",
  "BLOCKED_UNSAFE_VERB",
] as const;

export type AutomationClass = (typeof AUTOMATION_CLASSES)[number];

export type AutomationEligibility = {
  allowed: boolean;
  class: AutomationClass;
  reasons: string[];
};

export type AdaptationAthleteExplanation = {
  title: string;
  summary: string;
  change: string | null;
};

export type AdaptationSuggestedNext = {
  familyId: string | null;
  fromStageId: string | null;
  toStageId: string | null;
  toStageLabel: string | null;
  toStageKey: string | null;
};

export type AdaptationRecommendation = {
  sessionId: string;
  verb: AdaptationVerb;
  confidence: AdaptationConfidence;
  reasons: string[];
  suggestedNext: AdaptationSuggestedNext | null;
  coachOptions: AdaptationVerb[];
  autoApplyForbidden: true;
  escalateToCoach: boolean;
  familyId: string | null;
  fromStageId: string | null;
  evidenceSessionIds: string[];
  /** Fitness penalty applied? Missed life/illness → false */
  fitnessPenalty: boolean;
  executionSummary: SessionExecutionSummary | null;
  /**
   * Policy assessment for future Track automation.
   * Does not apply anything. 1-1 still requires coach decision.
   */
  automationEligibility: AutomationEligibility;
  /** Clean athlete-facing copy object — not auto-displayed */
  athleteExplanation: AdaptationAthleteExplanation;
};

export type AdaptationCoachDecision = {
  id: string;
  sessionId: string;
  recommendedVerb: AdaptationVerb;
  recommendedConfidence: AdaptationConfidence;
  recommendedReasons: string[];
  coachVerb: AdaptationVerb;
  finalToStageId: string | null;
  finalToStageLabel: string | null;
  decidedAt: string;
  decidedByUserId: string | null;
  note: string | null;
  /** Always false unless a separate programme edit ran */
  programmeModified: false;
};

export function isAdaptationVerb(v: unknown): v is AdaptationVerb {
  return typeof v === "string" && (ADAPTATION_VERBS as readonly string[]).includes(v);
}
