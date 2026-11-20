import type { DailyReadinessState, ReflowProposal } from "@/app/lib/daily-readiness/types";

export function coachAttention(name: string, state: DailyReadinessState, proposal: ReflowProposal | null): string | null {
  if (state.freshness === "MISSING" || state.interpretation === "NORMAL" || state.interpretation === "SLIGHTLY_REDUCED" || state.interpretation === "POOR_SLEEP") return null;
  if (state.interpretation === "PAIN_REVIEW_REQUIRED") return `${name} reported pain. Today's plan needs a coach.`;
  if (state.interpretation === "FATIGUED" || state.interpretation === "MULTIPLE_STRESSORS" || proposal?.status === "proposed" || proposal?.status === "NO_SAFE_REFLOW") {
    return `${name}'s recovery is lower than their normal. Today's session may need review.`;
  }
  return null;
}
