import { computeDailyReadinessScore, type DailyReadinessInputs } from "@/app/lib/hyrox-team/modules/today/readinessScore";
import type { AnchorBundle } from "./anchors";
import { holdProgrammeDecision, type TrackProgrammeDecision } from "./productionBoundary";
import type { TrackIntake } from "./types";

/**
 * Future Track decisions read this bag.
 * Readiness is the existing scorer. A recommendation is held, not applied.
 */
export type TrackAutomationContext = {
  athleteId: string;
  goal: TrackIntake["goal"];
  equipment: TrackIntake["equipment"];
  availableDays: TrackIntake["availability"]["availableDays"];
  sessionLength: TrackIntake["availability"]["sessionLength"];
  anchorKeys: string[];
  reassessmentDue: string[];
  readinessScore: number | null;
  readinessCategory: string | null;
  decision: TrackProgrammeDecision;
};

export function buildAutomationContext(args: {
  intake: TrackIntake;
  anchors: AnchorBundle;
  readiness?: DailyReadinessInputs | null;
}): TrackAutomationContext {
  const score = args.readiness ? computeDailyReadinessScore(args.readiness) : null;
  const decision: TrackProgrammeDecision = holdProgrammeDecision(
    score?.category === "red"
      ? "Readiness is in recovery priority. Offer a change. Do not rewrite the week."
      : "No silent programme change."
  );
  const keys = [
    args.anchors.running.threshold?.key,
    args.anchors.running.easy?.key,
    args.anchors.ski?.key,
    args.anchors.row?.key,
    args.anchors.bike?.key,
    args.anchors.strength?.key,
    args.anchors.hyrox.anchor?.key,
    ...args.anchors.stations.map((anchor) => anchor.key),
  ].filter((key): key is string => Boolean(key));

  return {
    athleteId: args.intake.athleteId,
    goal: args.intake.goal,
    equipment: args.intake.equipment,
    availableDays: args.intake.availability.availableDays,
    sessionLength: args.intake.availability.sessionLength,
    anchorKeys: keys,
    reassessmentDue: args.anchors.reassessmentDue,
    readinessScore: score?.score ?? null,
    readinessCategory: score?.category ?? null,
    decision,
  };
}
