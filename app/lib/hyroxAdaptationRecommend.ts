/**
 * Deterministic adaptation recommendations. No LLM. Never mutates programmes.
 */

import { buildAdaptationAthleteExplanation } from "@/app/lib/hyroxAdaptationAthleteExplanation";
import {
  assessAutomationEligibility,
  type AutomationPolicyContext,
} from "@/app/lib/hyroxAdaptationAutomationPolicy";
import type {
  AdaptationConfidence,
  AdaptationRecommendation,
  AdaptationSuggestedNext,
  AdaptationVerb,
} from "@/app/lib/hyroxAdaptationTypes";
import { listManualStageOptions } from "@/app/lib/hyroxSessionFamilyApply";
import { getSessionFamily } from "@/app/lib/hyroxSessionFamilyRegistry";
import type { SessionFamilyTransitionAction } from "@/app/lib/hyroxSessionFamilyTypes";
import type { SessionExecutionSummary } from "@/app/lib/hyroxSessionExecutionTypes";

export type AdaptationSessionContext = {
  sessionId: string;
  sessionName: string;
  category?: string | null;
  isKeySession?: boolean;
  familyId?: string | null;
  stageId?: string | null;
  stageLabel?: string | null;
  execution: SessionExecutionSummary | null;
  policyContext?: AutomationPolicyContext;
};

export type AdaptationHistoryExposure = {
  sessionId: string;
  familyId: string | null;
  stageId: string | null;
  execution: SessionExecutionSummary | null;
};

const FAMILY_VERBS: AdaptationVerb[] = [
  "PROGRESS",
  "REPEAT",
  "REDUCE",
  "DELOAD",
  "SKIP_TO",
  "COACH_REVIEW",
  "KEEP",
];

const GENERIC_VERBS: AdaptationVerb[] = ["KEEP", "REPEAT", "REDUCE", "COACH_REVIEW", "CHANGE_TARGET"];

function controlledOk(control: SessionExecutionSummary["control"]): boolean {
  return control === "very_controlled" || control === "controlled";
}

function hardFeel(control: SessionExecutionSummary["control"]): boolean {
  return control === "appropriate" || control === "hard" || control === "maximal";
}

function resolveFamilyTransition(
  familyId: string,
  fromStageId: string,
  action: SessionFamilyTransitionAction
): AdaptationSuggestedNext | null {
  const family = getSessionFamily(familyId);
  if (!family) return null;
  const options = listManualStageOptions(family, fromStageId).filter((o) => o.action === action);
  if (!options.length) return null;
  const pick = options[0];
  return {
    familyId,
    fromStageId,
    toStageId: pick.toStageId,
    toStageLabel: pick.toStageLabel,
    toStageKey: pick.toStageKey,
  };
}

function allowedFamilyAction(
  familyId: string,
  fromStageId: string,
  action: SessionFamilyTransitionAction
): boolean {
  return resolveFamilyTransition(familyId, fromStageId, action) != null;
}

/**
 * Clamp a desired family verb onto a legal edge. Invalid transitions become KEEP or COACH_REVIEW.
 */
export function mapVerbToAllowedFamilyTransition(args: {
  familyId: string;
  fromStageId: string;
  desired: AdaptationVerb;
}): { verb: AdaptationVerb; suggestedNext: AdaptationSuggestedNext | null; reasons: string[] } {
  const { familyId, fromStageId, desired } = args;
  if (desired === "KEEP" || desired === "COACH_REVIEW") {
    return { verb: desired, suggestedNext: null, reasons: [] };
  }
  if (desired === "SKIP_TO") {
    return {
      verb: "SKIP_TO",
      suggestedNext: null,
      reasons: ["SKIP_TO requires explicit coach stage selection"],
    };
  }
  const familyActions: SessionFamilyTransitionAction[] = [
    "PROGRESS",
    "REPEAT",
    "REDUCE",
    "DELOAD",
  ];
  if (!(familyActions as string[]).includes(desired)) {
    return {
      verb: "KEEP",
      suggestedNext: null,
      reasons: [`${desired} is not a session-family stage transition`],
    };
  }
  const action = desired as SessionFamilyTransitionAction;
  if (!allowedFamilyAction(familyId, fromStageId, action)) {
    return {
      verb: "COACH_REVIEW",
      suggestedNext: null,
      reasons: [`${action} is not an allowed transition from the current stage`],
    };
  }
  return {
    verb: desired,
    suggestedNext: resolveFamilyTransition(familyId, fromStageId, action),
    reasons: [],
  };
}

function baseConfidence(
  execution: SessionExecutionSummary | null,
  agreeingExposures: number
): AdaptationConfidence {
  if (!execution || execution.source === "legacy_inferred") return "low";
  if (execution.completion === "missed") return "medium";
  if (execution.execution == null || execution.rpe == null || execution.control == null) {
    return "low";
  }
  if (agreeingExposures >= 2) return "high";
  return "medium";
}

function countAgreeingProgress(history: AdaptationHistoryExposure[], familyId: string | null): number {
  if (!familyId) return 0;
  let n = 0;
  for (const h of history) {
    if (h.familyId !== familyId || !h.execution) continue;
    const e = h.execution;
    if (
      e.completion === "complete" &&
      e.execution === "all" &&
      e.rpe != null &&
      e.rpe <= 7 &&
      controlledOk(e.control) &&
      (e.pain === "none" || e.pain == null)
    ) {
      n += 1;
    }
  }
  return n;
}

/**
 * Recommend adaptation for one session given optional same-family history.
 * Never modifies programmes. autoApplyForbidden always true.
 */
export function recommendAdaptation(args: {
  session: AdaptationSessionContext;
  /** Prior comparable exposures (same family preferred), newest last — exclude current */
  history?: AdaptationHistoryExposure[];
}): AdaptationRecommendation {
  const { session } = args;
  const history = args.history ?? [];
  const execution = session.execution;
  const familyId = session.familyId ?? null;
  const fromStageId = session.stageId ?? null;
  const evidenceSessionIds = [session.sessionId, ...history.map((h) => h.sessionId)].slice(0, 4);

  const finish = (partial: {
    verb: AdaptationVerb;
    confidence: AdaptationConfidence;
    reasons: string[];
    escalateToCoach?: boolean;
    fitnessPenalty?: boolean;
    suggestedNext?: AdaptationSuggestedNext | null;
    coachOptions?: AdaptationVerb[];
  }): AdaptationRecommendation => {
    let verb = partial.verb;
    let suggestedNext = partial.suggestedNext ?? null;
    const reasons = [...partial.reasons];

    if (familyId && fromStageId && verb !== "KEEP" && verb !== "COACH_REVIEW" && verb !== "SKIP_TO") {
      const mapped = mapVerbToAllowedFamilyTransition({
        familyId,
        fromStageId,
        desired: verb,
      });
      verb = mapped.verb;
      suggestedNext = mapped.suggestedNext;
      reasons.push(...mapped.reasons);
    } else if (familyId && fromStageId && verb === "PROGRESS") {
      const mapped = mapVerbToAllowedFamilyTransition({
        familyId,
        fromStageId,
        desired: "PROGRESS",
      });
      verb = mapped.verb;
      suggestedNext = mapped.suggestedNext;
      reasons.push(...mapped.reasons);
    }

    const coachOptions = familyId ? FAMILY_VERBS : GENERIC_VERBS;
    const fitnessPenalty = partial.fitnessPenalty ?? true;
    const base = {
      sessionId: session.sessionId,
      verb,
      confidence: partial.confidence,
      reasons,
      suggestedNext,
      coachOptions,
      autoApplyForbidden: true as const,
      escalateToCoach: Boolean(partial.escalateToCoach) || verb === "COACH_REVIEW",
      familyId,
      fromStageId,
      evidenceSessionIds,
      fitnessPenalty,
      executionSummary: execution,
    };
    const automationEligibility = assessAutomationEligibility({
      verb,
      confidence: partial.confidence,
      execution,
      suggestedNextStageId: suggestedNext?.toStageId ?? null,
      familyId,
      fitnessPenalty,
      context: session.policyContext,
    });
    const athleteExplanation = buildAdaptationAthleteExplanation(base);
    return { ...base, automationEligibility, athleteExplanation };
  };

  // Missing feedback — no aggressive progression
  if (!execution) {
    return finish({
      verb: "KEEP",
      confidence: "low",
      reasons: ["No session execution feedback yet", "Do not progress without evidence"],
      fitnessPenalty: false,
    });
  }

  // Pain safety interrupt
  if (execution.pain === "meaningful") {
    return finish({
      verb: "COACH_REVIEW",
      confidence: "high",
      reasons: [
        "Athlete reported meaningful pain/discomfort",
        "Do not diagnose — coach review required",
        "Hold progression until coach decides",
      ],
      escalateToCoach: true,
      fitnessPenalty: false,
    });
  }

  // Missed — reason-aware
  if (execution.completion === "missed") {
    const reason = execution.missedReason;
    const lifeMiss =
      reason === "illness" || reason === "life" || reason === "schedule" || reason == null;
    if (lifeMiss) {
      return finish({
        verb: "KEEP",
        confidence: baseConfidence(execution, 0),
        reasons: [
          `Session missed${reason ? ` (${reason})` : ""}`,
          "Not interpreted as fitness failure",
          "No progression penalty from this miss alone",
        ],
        fitnessPenalty: false,
      });
    }
    if (reason === "pain_injury") {
      return finish({
        verb: "COACH_REVIEW",
        confidence: "high",
        reasons: ["Missed due to pain/injury report", "Coach review — no diagnosis"],
        escalateToCoach: true,
        fitnessPenalty: false,
      });
    }
    // fatigue
    return finish({
      verb: familyId ? "REPEAT" : "REDUCE",
      confidence: "medium",
      reasons: ["Missed due to fatigue", "Prefer consolidate rather than progress"],
      fitnessPenalty: true,
    });
  }

  const agreeing = countAgreeingProgress(
    [...history, { sessionId: session.sessionId, familyId, stageId: fromStageId, execution }],
    familyId
  );

  // Incomplete structured evidence
  if (execution.source === "legacy_inferred" || execution.execution == null || execution.rpe == null) {
    return finish({
      verb: "KEEP",
      confidence: "low",
      reasons: [
        `Session ${execution.completion}`,
        "Missing structured execution chips (target hit / control)",
        "Low confidence — no aggressive progression",
      ],
      fitnessPenalty: false,
    });
  }

  const rpe = execution.rpe;
  const allTargets = execution.execution === "all";
  const weakTargets =
    execution.execution === "some" ||
    execution.execution === "missed_target" ||
    execution.completion === "partial";

  // Partial / missed targets + hard
  if (weakTargets && rpe >= 8) {
    return finish({
      verb: familyId ? "REDUCE" : "REDUCE",
      confidence: baseConfidence(execution, 0),
      reasons: [
        execution.completion === "partial" ? "Session partial" : `Targets: ${execution.execution}`,
        `RPE ${rpe}`,
        hardFeel(execution.control) || execution.control == null
          ? "Session felt hard or control not fully easy"
          : `Control: ${execution.control}`,
        "Prefer reduce or repeat before progressing",
      ],
    });
  }

  if (weakTargets) {
    return finish({
      verb: "REPEAT",
      confidence: baseConfidence(execution, 0),
      reasons: [
        execution.completion === "partial" ? "Session partial" : `Targets: ${execution.execution}`,
        rpe != null ? `RPE ${rpe}` : "RPE missing",
        "Repeat stage / dose before progressing",
      ],
    });
  }

  // Complete + all targets
  if (execution.completion === "complete" && allTargets) {
    if (rpe <= 7 && controlledOk(execution.control) && (execution.pain === "none" || execution.pain == null)) {
      const confidence = agreeing >= 2 ? "high" : baseConfidence(execution, agreeing);
      const reasons = [
        "Completed session",
        "All pace/target chips achieved",
        `RPE ${rpe}`,
        `Control: ${execution.control}`,
        execution.pain === "none" ? "No pain reported" : "No meaningful pain",
      ];
      if (agreeing >= 2) {
        reasons.push("Previous comparable family exposure also completed well");
      }
      return finish({
        verb: familyId ? "PROGRESS" : "KEEP",
        confidence,
        reasons,
        suggestedNext: null,
      });
    }

    if (rpe >= 8 && hardFeel(execution.control)) {
      return finish({
        verb: "REPEAT",
        confidence: baseConfidence(execution, 0),
        reasons: [
          "Completed with all targets",
          `RPE ${rpe}`,
          `Control: ${execution.control ?? "hard"}`,
          "Absorb the dose — repeat before progressing",
        ],
      });
    }

    if (rpe === 8) {
      return finish({
        verb: "REPEAT",
        confidence: baseConfidence(execution, 0),
        reasons: [
          "Completed with all targets",
          `RPE ${rpe}`,
          execution.control ? `Control: ${execution.control}` : "Control not marked easy",
          "KEEP / REPEAT candidate — do not auto-progress",
        ],
      });
    }
  }

  return finish({
    verb: "KEEP",
    confidence: "low",
    reasons: ["Insufficient clear signal for progression change", "Default KEEP"],
    fitnessPenalty: false,
  });
}

/** Pure helper: applying a coach decision never mutates programme state in this module. */
export function applyCoachDecisionOverride(args: {
  recommendation: AdaptationRecommendation;
  coachVerb: AdaptationVerb;
  finalToStageId?: string | null;
  finalToStageLabel?: string | null;
  decidedAt: string;
  decidedByUserId?: string | null;
  note?: string | null;
}): {
  decision: import("@/app/lib/hyroxAdaptationTypes").AdaptationCoachDecision;
  programmeModified: false;
} {
  const { recommendation, coachVerb } = args;
  return {
    programmeModified: false,
    decision: {
      id: `decision:${recommendation.sessionId}:${args.decidedAt}`,
      sessionId: recommendation.sessionId,
      recommendedVerb: recommendation.verb,
      recommendedConfidence: recommendation.confidence,
      recommendedReasons: recommendation.reasons,
      coachVerb,
      finalToStageId: args.finalToStageId ?? recommendation.suggestedNext?.toStageId ?? null,
      finalToStageLabel:
        args.finalToStageLabel ?? recommendation.suggestedNext?.toStageLabel ?? null,
      decidedAt: args.decidedAt,
      decidedByUserId: args.decidedByUserId ?? null,
      note: args.note ?? null,
      programmeModified: false,
    },
  };
}
