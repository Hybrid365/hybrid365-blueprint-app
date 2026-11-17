import type { WeekSession } from "@/app/lib/daily-readiness/types";
import type { BenchmarkResultInput, TrackIntake } from "@/app/lib/track-foundation/types";

export type ProductStatus = "active" | "paused" | "cancelled" | "expired";

export type SessionFeedback = {
  id: string;
  sessionId: string;
  completion: "completed" | "partial" | "modified" | "skipped";
  rpe: number | null;
  feel: "easier" | "expected" | "harder" | null;
  pain: boolean;
  actuals: Record<string, number>;
  recordedAt: string;
};

export type WeeklyCheckIn = {
  id: string;
  weekOf: string;
  recovery: number;
  motivation: number;
  lifeStress: number;
  manageable: number;
  persistentSoreness: boolean;
  availabilityChanged: boolean;
  travel: boolean;
  eventChange: boolean;
  note: string | null;
};

export type EscalationKind =
  | "PAIN_REVIEW"
  | "NO_SAFE_REFLOW"
  | "REPEATED_FATIGUE"
  | "PROGRAMME_CONFIGURATION_REQUIRED"
  | "UNUSUAL_EXECUTION"
  | "DATA_MISSING";

export type AdaptationRecord = {
  id: string;
  source: "daily_readiness" | "session_feedback" | "weekly_review";
  decision: "accepted" | "declined" | "blocked";
  fingerprint: string;
  snapshot: unknown;
  proposal: unknown;
  beforeWeek: WeekSession[];
  afterWeek: WeekSession[];
  recordedAt: string;
  policyVersion: "track-loop-v1";
};

export type CalendarSession = WeekSession & {
  date: string;
  kind: "training" | "assessment" | "recovery";
  testId: string | null;
  instructions: string[];
  version: number;
};

export type TrackAthleteRecord = {
  athleteId: string;
  intake: TrackIntake;
  results: BenchmarkResultInput[];
  product: ProductStatus;
  sessions: CalendarSession[];
  versions: CalendarSession[][];
  feedback: SessionFeedback[];
  checkIns: WeeklyCheckIn[];
  adaptations: AdaptationRecord[];
  escalations: Array<{ id: string; kind: EscalationKind; summary: string; status: "open" }>;
  priorFamilyCompletions: Array<{ familyId: string; title: string; rpe: number; completion: SessionFeedback["completion"] }>;
};

export function createAthleteRecord(intake: TrackIntake, results: BenchmarkResultInput[] = []): TrackAthleteRecord {
  return {
    athleteId: intake.athleteId,
    intake,
    results: [...results],
    product: "active",
    sessions: [],
    versions: [],
    feedback: [],
    checkIns: [],
    adaptations: [],
    escalations: [],
    priorFamilyCompletions: [],
  };
}

export const TRACK_STORAGE_TABLES = {
  foundation: [
    "track_athlete_intake",
    "track_benchmark_results",
    "track_training_anchors",
    "track_performance_profiles",
    "track_assessment_plans",
  ],
  loop: [
    "track_programme_proposals",
    "track_calendar_sessions",
    "track_session_feedback",
    "track_weekly_checkins",
    "track_adaptation_log",
    "track_escalations",
    "track_product_membership",
  ],
} as const;
