/**
 * Fixture-only application of an accepted reflow.
 * Production Track mutation does not call this.
 * The original week is not mutated. History is a new record.
 */

import type { ReadinessDecisionRecord, ReflowProposal, WeekSession } from "@/app/lib/daily-readiness/types";
import type { DailyReadinessState } from "@/app/lib/daily-readiness/types";

export function applyReflowFixture(input: {
  sessions: WeekSession[];
  proposal: ReflowProposal;
  state: DailyReadinessState;
  decision: "accepted" | "declined";
  recordedAt: string;
}): { sessions: WeekSession[]; record: ReadinessDecisionRecord; explanation: string } {
  const original = input.sessions.map((session) => ({ ...session, load: session.load.map((item) => ({ ...item })) }));
  const record: ReadinessDecisionRecord = {
    source: "daily_readiness",
    athleteId: input.state.athleteId,
    localDate: input.state.localDate,
    decision: input.decision,
    state: input.state,
    proposal: input.proposal,
    recordedAt: input.recordedAt,
  };
  if (input.decision === "declined" || input.proposal.status !== "proposed") {
    return { sessions: original, record, explanation: "Original plan kept." };
  }
  const ids = input.proposal.after.map((session) => session.id);
  if (new Set(ids).size !== ids.length) throw new Error("Reflow duplicated a session.");
  return {
    sessions: input.proposal.after.map((session) => ({ ...session, load: session.load.map((item) => ({ ...item })) })),
    record,
    explanation: input.proposal.athleteExplanation,
  };
}
