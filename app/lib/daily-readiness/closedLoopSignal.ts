import type { DailyReadinessState } from "@/app/lib/daily-readiness/types";

/** Extra signal for the existing closed loop. It does not choose or publish a programme change. */
export function readinessClosedLoopSignal(state: DailyReadinessState | null): {
  freshness: DailyReadinessState["freshness"];
  interpretation: DailyReadinessState["interpretation"];
  sentence: string;
  mutates: false;
} | null {
  if (!state || state.freshness === "MISSING") return null;
  return {
    freshness: state.freshness,
    interpretation: state.interpretation,
    sentence: state.athleteSentence,
    mutates: false,
  };
}
