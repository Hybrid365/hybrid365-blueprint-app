/**
 * Clean athlete-facing explanation object for coach copy / future Track / Progress UI.
 * Not auto-displayed. Never diagnoses. Never leaks internal coach notes.
 */

import type {
  AdaptationAthleteExplanation,
  AdaptationRecommendation,
  AdaptationVerb,
} from "@/app/lib/hyroxAdaptationTypes";
import type { SessionExecutionSummary } from "@/app/lib/hyroxSessionExecutionTypes";

export type { AdaptationAthleteExplanation };

function verbTitle(verb: AdaptationVerb, stageLabel: string | null): string {
  switch (verb) {
    case "PROGRESS":
      return stageLabel ? "Session progressed" : "Session progressed";
    case "REPEAT":
      return "Same stimulus next time";
    case "REDUCE":
      return "Dose reduced";
    case "DELOAD":
      return "Deload recommended";
    case "KEEP":
      return "No change";
    case "COACH_REVIEW":
      return "Coach will review";
    default:
      return "Coach decision needed";
  }
}

function buildSummary(execution: SessionExecutionSummary | null, verb: AdaptationVerb): string {
  if (!execution) return "Not enough session feedback yet to explain a change.";
  if (execution.completion === "missed") {
    const reason = execution.missedReason ? ` (${execution.missedReason})` : "";
    return `This session was missed${reason}. That is not treated as a fitness failure by itself.`;
  }
  if (execution.pain === "meaningful") {
    return "You flagged meaningful discomfort. Your coach will review before any progression.";
  }
  const bits: string[] = [];
  if (execution.completion === "complete") bits.push("You completed the session");
  if (execution.completion === "partial") bits.push("You partially completed the session");
  if (execution.execution === "all") bits.push("hit all prescribed targets");
  else if (execution.execution) bits.push(`targets: ${execution.execution.replace("_", " ")}`);
  if (execution.rpe != null) bits.push(`RPE ${execution.rpe}`);
  if (execution.control) bits.push(`${execution.control.replace(/_/g, " ")} feel`);
  if (execution.pain === "none") bits.push("no pain");
  const core = bits.join(", ");
  if (verb === "PROGRESS") return `${core}.`;
  if (verb === "REPEAT") return `${core}. Next exposure stays at the same dose to absorb the work.`;
  if (verb === "REDUCE") return `${core}. Next exposure should be an easier dose.`;
  return `${core}.`;
}

function buildChange(rec: {
  verb: AdaptationVerb;
  suggestedNext: AdaptationRecommendation["suggestedNext"];
  fromStageId: string | null;
}): string | null {
  if (rec.verb === "PROGRESS" && rec.suggestedNext?.toStageLabel) {
    return `Next exposure: ${rec.suggestedNext.toStageLabel}.`;
  }
  if (rec.verb === "REPEAT" && rec.fromStageId) {
    return "Next exposure repeats the same stage.";
  }
  if (rec.verb === "REDUCE" && rec.suggestedNext?.toStageLabel) {
    return `Next exposure steps back to ${rec.suggestedNext.toStageLabel}.`;
  }
  if (rec.verb === "DELOAD" && rec.suggestedNext?.toStageLabel) {
    return `Next exposure uses ${rec.suggestedNext.toStageLabel}.`;
  }
  if (rec.verb === "KEEP") return "No programmed change from this session alone.";
  if (rec.verb === "COACH_REVIEW") return "No automatic change — coach review first.";
  return null;
}

export function buildAdaptationAthleteExplanation(
  recommendation: Omit<AdaptationRecommendation, "automationEligibility" | "athleteExplanation"> &
    Partial<Pick<AdaptationRecommendation, "automationEligibility" | "athleteExplanation">>
): AdaptationAthleteExplanation {
  const titleBase = verbTitle(
    recommendation.verb,
    recommendation.suggestedNext?.toStageLabel ?? null
  );
  const title =
    recommendation.verb === "PROGRESS" && recommendation.suggestedNext?.toStageLabel
      ? "Threshold progressed"
      : titleBase;
  return {
    title,
    summary: buildSummary(recommendation.executionSummary, recommendation.verb),
    change: buildChange(recommendation),
  };
}
