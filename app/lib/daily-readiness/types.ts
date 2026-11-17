/**
 * Daily readiness and the remaining week.
 * Pure types. No programme write.
 */

import type { PainCourse } from "@/app/lib/daily-readiness/questions";

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export type ReadinessFreshness = "KNOWN" | "MISSING" | "STALE" | "COACH_OVERRIDDEN";
export type BaselineMaturity = "INSUFFICIENT" | "EMERGING" | "ESTABLISHED";
export type ReadinessInterpretation =
  | "NORMAL"
  | "SLIGHTLY_REDUCED"
  | "FATIGUED"
  | "HIGH_SORENESS"
  | "LOW_ENERGY"
  | "POOR_SLEEP"
  | "MULTIPLE_STRESSORS"
  | "PAIN_REVIEW_REQUIRED";

export type TodayAction =
  | "KEEP_TODAY"
  | "REMOVE_OPTIONAL"
  | "REDUCE_TODAY_VOLUME"
  | "MOVE_KEY_SESSION"
  | "REPLACE_WITH_EASY_RUN"
  | "REPLACE_WITH_EASY_BIKE"
  | "REST_TODAY"
  | "COACH_REVIEW_REQUIRED"
  | "BLOCKED_PAIN";

export type ReflowOperationName =
  | "KEEP"
  | "MOVE_SESSION"
  | "REMOVE_OPTIONAL"
  | "REDUCE_VOLUME"
  | "REPLACE_SESSION"
  | "DEFER_SESSION";

export type TrackClass = "SAFE_DEFAULT" | "ATHLETE_CHOICE" | "COACH_REQUIRED" | "BLOCKED";

export type ReadinessAnswers = {
  sleep: number | null;
  energy: number | null;
  recovery: number | null;
  soreness: number | null;
  trainingReadiness: number | null;
  pain: boolean;
  painArea: string | null;
  painSeverity: number | null;
  painCourse: PainCourse | null;
  painProvokes: string | null;
  painNote: string | null;
  painFreeModalities: string[];
};

export type ReadinessSubmission = ReadinessAnswers & {
  id: string;
  athleteId: string;
  localDate: string;
  timezone: string;
  submittedAt: string;
};

export type MetricComparison = {
  field: "sleep" | "energy" | "recovery" | "soreness" | "trainingReadiness";
  today: number | null;
  normal: number | null;
  delta: number | null;
  worse: boolean;
};

export type DailyReadinessState = {
  athleteId: string;
  localDate: string;
  freshness: ReadinessFreshness;
  submittedAt: string | null;
  answers: ReadinessAnswers | null;
  baseline: BaselineMaturity;
  comparisons: MetricComparison[];
  interpretation: ReadinessInterpretation | "MISSING";
  athleteSentence: string;
  historyCount: number;
};

export type WeekSession = {
  id: string;
  day: WeekDay;
  title: string;
  priority: "key" | "supporting" | "optional";
  stimulus: string;
  hard: boolean;
  lowerBody: boolean;
  modality: "run" | "bike" | "erg" | "strength" | "hyrox" | "rest";
  status: "planned" | "completed" | "started";
  anchor: boolean;
  load: { metricId: string; label: string; value: number; unit: string }[];
};

export type ReflowOperation = {
  name: ReflowOperationName;
  sessionId: string | null;
  fromDay: WeekDay | null;
  toDay: WeekDay | null;
  reason: string;
};

export type LoadLine = {
  label: string;
  unit: string;
  before: number;
  after: number;
};

export type ReflowProposal = {
  status: "unchanged" | "proposed" | "NO_SAFE_REFLOW";
  action: TodayAction;
  trackClass: TrackClass;
  mutates: false;
  requiresCoach: boolean;
  operations: ReflowOperation[];
  before: WeekSession[];
  after: WeekSession[];
  conflicts: string[];
  load: LoadLine[];
  hardDaysBefore: number;
  hardDaysAfter: number;
  athleteExplanation: string;
  coachExplanation: string;
};

export type ReadinessDecisionRecord = {
  source: "daily_readiness";
  athleteId: string;
  localDate: string;
  decision: "accepted" | "declined";
  state: DailyReadinessState;
  proposal: ReflowProposal;
  recordedAt: string;
};
