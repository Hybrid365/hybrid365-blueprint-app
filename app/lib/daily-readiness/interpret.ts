/**
 * A reading of this morning.
 * One poor input does not become a week change.
 * Pain stays separate from fatigue. No score is produced.
 */

import { compareWithBaseline, baselineMaturity } from "@/app/lib/daily-readiness/baseline";
import type { DailyReadinessState, ReadinessInterpretation, ReadinessSubmission } from "@/app/lib/daily-readiness/types";

const EMPTY_ANSWERS = {
  sleep: null, energy: null, recovery: null, soreness: null, trainingReadiness: null,
  pain: false, painArea: null, painSeverity: null, painCourse: null, painProvokes: null, painNote: null, painFreeModalities: [],
};

export function activeSubmission(rows: ReadinessSubmission[], localDate: string): ReadinessSubmission | null {
  return rows
    .filter((row) => row.localDate === localDate)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0] ?? null;
}

export function interpretReadiness(input: {
  athleteId: string;
  localDate: string;
  submissions: ReadinessSubmission[];
  coachOverride?: boolean;
  sessionAlreadyDone?: boolean;
}): DailyReadinessState {
  const history = input.submissions.filter((row) => row.localDate < input.localDate);
  const today = activeSubmission(input.submissions, input.localDate);
  const comparisons = compareWithBaseline(history, today);
  const baseline = baselineMaturity(history.length);
  if (input.coachOverride) {
    return state(input, "COACH_OVERRIDDEN", today, baseline, comparisons, history.length, "MISSING", "A coach has set today's plan aside from this check-in.");
  }
  if (!today) {
    return state(input, "MISSING", null, baseline, comparisons, history.length, "MISSING", "No morning check-in. The programme stays as planned.");
  }
  if (input.sessionAlreadyDone) {
    return state(input, "STALE", today, baseline, comparisons, history.length, "NORMAL", "Today's session is already underway. This check-in does not rewrite it.");
  }
  if (today.pain) {
    return state(input, "KNOWN", today, baseline, comparisons, history.length, "PAIN_REVIEW_REQUIRED", "You reported pain. A coach needs to see that before training changes.");
  }
  if (baseline === "INSUFFICIENT") {
    return state(input, "KNOWN", today, baseline, comparisons, history.length, "NORMAL", "We don't have your normal yet. Today's plan stays as written.");
  }
  const worse = comparisons.filter((item) => item.worse);
  const interpretation = classify(worse.map((item) => item.field), baseline);
  return state(input, "KNOWN", today, baseline, comparisons, history.length, interpretation, sentence(interpretation, baseline, worse.length));
}

function classify(fields: string[], baseline: DailyReadinessState["baseline"]): ReadinessInterpretation {
  if (baseline === "INSUFFICIENT" || fields.length === 0) return fields.length ? "SLIGHTLY_REDUCED" : "NORMAL";
  if (fields.length >= 2) return fields.length >= 3 ? "FATIGUED" : "MULTIPLE_STRESSORS";
  if (fields[0] === "sleep") return "POOR_SLEEP";
  if (fields[0] === "energy") return "LOW_ENERGY";
  if (fields[0] === "soreness") return "HIGH_SORENESS";
  return "SLIGHTLY_REDUCED";
}

function sentence(interpretation: ReadinessInterpretation, baseline: DailyReadinessState["baseline"], worse: number): string {
  if (baseline === "INSUFFICIENT") return "We don't have your normal yet. Today's plan stays as written.";
  if (interpretation === "NORMAL") return "You're tracking close to your normal.";
  if (interpretation === "POOR_SLEEP" && worse === 1) return "Sleep is below your normal. Energy and readiness still look like you, so today stays planned.";
  if (interpretation === "MULTIPLE_STRESSORS" || interpretation === "FATIGUED") return "Recovery is lower than your normal today.";
  if (interpretation === "HIGH_SORENESS") return "Soreness is higher than your normal today.";
  if (interpretation === "LOW_ENERGY") return "Energy is lower than your normal today.";
  return "Today is a little below your normal.";
}

function state(
  input: { athleteId: string; localDate: string },
  freshness: DailyReadinessState["freshness"],
  today: ReadinessSubmission | null,
  baseline: DailyReadinessState["baseline"],
  comparisons: DailyReadinessState["comparisons"],
  historyCount: number,
  interpretation: DailyReadinessState["interpretation"],
  athleteSentence: string,
): DailyReadinessState {
  return {
    athleteId: input.athleteId,
    localDate: input.localDate,
    freshness,
    submittedAt: today?.submittedAt ?? null,
    answers: today ? { ...today } : freshness === "MISSING" ? null : { ...EMPTY_ANSWERS },
    baseline,
    comparisons,
    interpretation,
    athleteSentence,
    historyCount,
  };
}
