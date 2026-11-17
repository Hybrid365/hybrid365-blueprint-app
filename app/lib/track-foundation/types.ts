import type { TRACK_PROGRAMME_ENGINE } from "./productionBoundary";

export type TrackGoal = "hyrox" | "hybrid_performance" | "running_performance";

export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type SessionLength = "under_45" | "45_60" | "60_90" | "90_plus";

export type TrainingAgeLabel = "beginner" | "intermediate" | "experienced";

export type EquipmentId =
  | "gym"
  | "treadmill"
  | "track"
  | "skierg"
  | "rower"
  | "bike"
  | "assault_bike"
  | "sled"
  | "wall_ball"
  | "sandbag"
  | "farmers"
  | "dumbbells";

export type PainSeverity = "none" | "mild_managed" | "meaningful_unresolved";

export type EvidenceSource =
  | "official_race"
  | "lab_test"
  | "coach_test"
  | "training_test"
  | "self_entered_benchmark"
  | "watch_estimate";

/**
 * What one result is worth on its own.
 * Recency windows differ by benchmark family. Watch estimates are never current anchors.
 */
export type EvidenceDisposition =
  | "CURRENT_ANCHOR"
  | "RECENT_SUPPORTING_EVIDENCE"
  | "HISTORICAL_ONLY"
  | "RETEST_RECOMMENDED"
  | "INVALID_INCOMPLETE";

export type KnowledgeState =
  | "KNOWN"
  | "VALID_RECENT_RESULT"
  | "HISTORICAL_ONLY"
  | "MISSING"
  | "TEST_REQUIRED"
  | "MANUAL_REVIEW_REQUIRED";

export type ProgrammingReadiness = "NOT_READY" | "PARTIALLY_READY" | "READY";

export type AnchorStatus = "active" | "reassessment_due" | "unavailable";

export type RequirementStatus =
  | "satisfied"
  | "test_required"
  | "equipment_blocked"
  | "skipped_not_needed"
  | "manual_review"
  | "reassessment_due";

export type RequirementPriority = "critical" | "supporting";

export type TrackIntake = {
  athleteId: string;
  displayName: string;
  goal: TrackGoal | null;
  event: {
    hasEvent: boolean;
    eventType: string | null;
    eventName: string | null;
    eventDate: string | null;
    division: string | null;
  };
  availability: {
    daysPerWeek: number | null;
    availableDays: DayKey[];
    unavailableDays: DayKey[];
    doublesPossible: boolean;
    doubleDays: DayKey[];
    sessionLength: SessionLength | null;
    weekendAvailable: boolean;
  };
  background: {
    runDaysPerWeek: number | null;
    runKmPerWeek: number | null;
    strengthDaysPerWeek: number | null;
    hyroxSessionsPerWeek: number | null;
    bikeOrErgNote: string | null;
    trainingAge: TrainingAgeLabel | null;
  };
  equipment: EquipmentId[];
  /** False until the athlete has confirmed the list, including an empty list. */
  equipmentConfirmed: boolean;
  pain: {
    hasConcern: boolean;
    areas: string[];
    severity: PainSeverity;
    affectsTraining: boolean;
    note: string | null;
  };
};

export type BenchmarkDetails = {
  division?: string | null;
  eventName?: string | null;
  /** Optional split labels, e.g. ski, sled_push, wall_balls. Times or loads as entered. */
  splits?: Record<string, string> | null;
  watts?: number | null;
  reps?: number | null;
  metres?: number | null;
  load?: string | null;
};

/**
 * Append-only athlete evidence. Corrections point at the row they replace.
 * Nothing here is overwritten in place.
 */
export type BenchmarkResultInput = {
  id: string;
  testId: string;
  resultValue: string;
  unit: string;
  date: string;
  source: EvidenceSource;
  notes?: string | null;
  details?: BenchmarkDetails | null;
  /** Set when this row corrects an earlier entry. History keeps both. */
  correctsResultId?: string | null;
};

export type ClassifiedEvidence = BenchmarkResultInput & {
  disposition: EvidenceDisposition;
  /** False for watch estimates, incomplete rows, and superseded corrections. */
  canAnchor: boolean;
  excludedFromAnchor: boolean;
  exclusionReason: string | null;
  ageDays: number | null;
  policyId: string;
  reasons: string[];
  completeness: "complete" | "partial" | "incomplete";
  sourceRank: number;
};

export type FamilyResolution = {
  familyId: string;
  label: string;
  current: ClassifiedEvidence | null;
  /** Best result still inside the supporting window when nothing is a current anchor. */
  held: ClassifiedEvidence | null;
  /** Every row that may inform an anchor: current winners and grace-window results. */
  contenders: ClassifiedEvidence[];
  supporting: ClassifiedEvidence[];
  historical: ClassifiedEvidence[];
  winnerReason: string;
  retestRecommended: boolean;
  knowledge: KnowledgeState;
  anchorStatus: AnchorStatus;
};

export type AssessmentRequirement = {
  id: string;
  testId: string | null;
  label: string;
  priority: RequirementPriority;
  status: RequirementStatus;
  reason: string;
  satisfiedByResultId: string | null;
};

export type AssessmentSessionKind = "test" | "aerobic" | "recovery" | "covered";

export type AssessmentSession = {
  id: string;
  day: DayKey;
  date: string;
  kind: AssessmentSessionKind;
  stress: "none" | "low" | "moderate" | "high";
  title: string;
  testId: string | null;
  summary: string;
  resultLabel: string | null;
  /** Same execution ideas as normal session logging. Not a second logger. */
  loggingFields: Array<"result" | "rpe" | "pain" | "modified" | "notes">;
};

export type AssessmentWeek = {
  headline: string;
  alreadyHave: string[];
  stillNeed: string[];
  sessions: AssessmentSession[];
  /** Tests that did not fit without stacking hard days. */
  overflow: string[];
  testCount: number;
  trainingDayCount: number;
  manualReview: boolean;
};

export type AnchorPrecision = "policy_zones" | "direct" | "estimated_ftp" | "guidance_only" | "coarse_band";

export type AnchorProvenance = {
  resultId: string;
  testId: string;
  testName: string;
  result: string;
  unit: string;
  date: string;
  source: EvidenceSource;
  statement: string;
};

export type TrainingAnchor = {
  key: string;
  domain: "running" | "bike" | "ski" | "row" | "strength" | "hyrox" | "station";
  label: string;
  display: string;
  status: AnchorStatus;
  precision: AnchorPrecision;
  provenance: AnchorProvenance | null;
  reassessmentDue: boolean;
};

export type RunningAnchorSet = {
  easy: TrainingAnchor | null;
  /** Left unset unless a lab result actually reports it. Not estimated from a race. */
  lt1: TrainingAnchor | null;
  threshold: TrainingAnchor | null;
  speed: TrainingAnchor | null;
};

export type StationMetricKey =
  | "sled_push_m"
  | "sled_pull_m"
  | "bbj_m"
  | "lunges_m"
  | "farmers_m"
  | "wall_balls_reps"
  | "ski_m"
  | "row_m";

export type HyroxRaceProfile = {
  overall: string | null;
  division: string | null;
  eventName: string | null;
  eventDate: string | null;
  source: EvidenceSource | null;
  splits: Record<string, string>;
  observation: string | null;
  anchor: TrainingAnchor | null;
};

export type ProfileSection = {
  id: string;
  title: string;
  knowledge: KnowledgeState;
  known: string[];
  missing: string[];
  strengths: string[];
  limiters: string[];
  anchorSource: string | null;
};

export type AthletePerformanceProfile = {
  athleteId: string;
  displayName: string;
  goal: TrackGoal | null;
  sections: ProfileSection[];
  programmingReadiness: ProgrammingReadiness;
  readinessReasons: string[];
  reassessmentDue: string[];
};

export type TrackHandoffPreview = {
  readyToGenerate: boolean;
  blockedReason: string | null;
  goalFocus: "hybrid" | "running";
  goalFocusRaw: string;
  eventType: string | null;
  eventDate: string | null;
  daysPerWeek: number;
  weeklyHoursBand: "2-3" | "3-5" | "5-7" | "7-10" | "10+";
  fiveKTime: string | null;
  equipment: string[];
  constraintNotes: string[];
  abilityLevel: "beginner" | "intermediate" | "advanced";
  abilityNote: string;
  engine: typeof TRACK_PROGRAMME_ENGINE;
  mutationEnabled: false;
  published: false;
  persisted: false;
};

export type BenchmarkSeriesPoint = {
  date: string;
  label: string;
  value: string;
  source: EvidenceSource;
  isCurrentAnchor: boolean;
  corrected: boolean;
};

export type WorkloadCard = {
  key: string;
  label: string;
  planned: number | null;
  completed: number | null;
  unit: string;
};

export type TrainingTargetCard = {
  label: string;
  display: string;
  provenance: string;
};

export type DashboardView = {
  targets: TrainingTargetCard[];
  series: Array<{ id: string; label: string; points: BenchmarkSeriesPoint[] }>;
  workload: WorkloadCard[];
  profileLines: string[];
  limiters: string[];
};

export type HomeDay = {
  day: DayKey;
  date: string;
  isToday: boolean;
  title: string | null;
};

export type HomeView = {
  days: HomeDay[];
  todayTitle: string;
  todayDetail: string;
  readinessPrompt: string;
  weekNote: string | null;
  raceCountdown: string | null;
  progressSignal: string | null;
};
