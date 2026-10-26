/**
 * Week Composer contracts — propose only; coach applies to draft.
 * Shared shape for 1-1 (decisionAuthority: coach) and future Track.
 */

import type {
  AdaptationConfidence,
  AdaptationRecommendation,
  AdaptationVerb,
  AutomationEligibility,
} from "@/app/lib/hyroxAdaptationTypes";
import type { SessionExecutionSummary } from "@/app/lib/hyroxSessionExecutionTypes";

export const WEEK_COMPOSER_MODES = ["next_week", "remaining_week"] as const;
export type WeekComposerMode = (typeof WEEK_COMPOSER_MODES)[number];

export const COMPOSER_ACTIONS = [
  "KEEP",
  "PROGRESS",
  "REPEAT",
  "REDUCE",
  "CHANGE_TARGET",
  "MOVE",
  "REPLACE",
  "REMOVE",
  "ADD",
] as const;
export type ComposerAction = (typeof COMPOSER_ACTIONS)[number];

export type DecisionAuthority = "coach" | "system";

export type WeekComposerWeekday =
  | "Mon"
  | "Tue"
  | "Wed"
  | "Thu"
  | "Fri"
  | "Sat"
  | "Sun";

/** Structured coach constraints — preferred MVP input (not NLP theatre). */
export type WeekComposerStructuredInstruction = {
  runVolumeKmMin?: number | null;
  runVolumeKmMax?: number | null;
  longRunMinutes?: number | null;
  keepSessionIds?: string[];
  keepDays?: WeekComposerWeekday[];
  progressSessionIds?: string[];
  progressDays?: WeekComposerWeekday[];
  reduceSessionIds?: string[];
  reduceDays?: WeekComposerWeekday[];
  restDays?: WeekComposerWeekday[];
  movePairs?: Array<{ fromDay: WeekComposerWeekday; toDay: WeekComposerWeekday; sessionId?: string }>;
  notes?: string | null;
};

export type WeekComposerInstruction = {
  freeText: string;
  structured: WeekComposerStructuredInstruction;
};

export type WeekComposerAnchorSnapshot = {
  key: string;
  label: string;
  displayValue: string | null;
  present: boolean;
};

export type WeekComposerSessionSlot = {
  sessionId: string;
  draftId?: string | null;
  day: WeekComposerWeekday;
  dateYmd: string | null;
  slot: string;
  title: string;
  category: string;
  libraryEntryId: string | null;
  familyId: string | null;
  stageId: string | null;
  stageLabel: string | null;
  structureLine: string | null;
  targetPreview: string | null;
  status: string;
  completed: boolean;
  isPast: boolean;
  isKeySession: boolean;
  plannedRunKm: number | null;
  plannedMinutes: number | null;
  execution: SessionExecutionSummary | null;
  coachTargetOverride: boolean;
};

export type WeekComposerProgrammeWeek = {
  weekNumber: number;
  weekStartYmd: string | null;
  weekEndYmd: string | null;
  published: boolean;
  sessions: WeekComposerSessionSlot[];
};

export type WeekComposerContext = {
  mode: WeekComposerMode;
  athlete: {
    id: string;
    name: string | null;
    coachingProduct: string | null;
    blockNumber: number | null;
    blockWeek: number | null;
    globalWeek: number;
    targetWeek: number;
    raceName: string | null;
    raceDate: string | null;
    raceWeek: boolean;
  };
  anchors: WeekComposerAnchorSnapshot[];
  /** Source week for structure (previous for next_week; current for remaining_week) */
  sourceWeek: WeekComposerProgrammeWeek;
  recentWeeks: WeekComposerProgrammeWeek[];
  recommendations: AdaptationRecommendation[];
  weekly: {
    plannedRunKm: number | null;
    actualRunKm: number | null;
    plannedSessions: number;
    qualityPlanned: number;
    painFlags: Array<{ sessionId: string; sessionName: string; pain: string }>;
    readinessNote: string | null;
  };
  instruction: WeekComposerInstruction;
  /** Always coach for 1-1 MVP */
  decisionAuthority: DecisionAuthority;
};

export type ComposerLibraryGap = {
  code:
    | "no_family"
    | "no_valid_transition"
    | "no_canonical_library"
    | "no_reduced_variant"
    | "missing_anchor"
    | "other";
  message: string;
  day: WeekComposerWeekday | null;
  sessionId: string | null;
  familyId: string | null;
  desiredAction: ComposerAction | null;
};

export type ComposerDifference = {
  kind: "unchanged" | "progressed" | "reduced" | "target_change" | "moved" | "replaced" | "removed" | "added";
  before: string | null;
  after: string | null;
};

export type ComposerAthleteChangeMessage = {
  title: string;
  message: string;
};

export type ProposedComposerSession = {
  proposalId: string;
  day: WeekComposerWeekday;
  dateYmd: string | null;
  slot: string;
  action: ComposerAction;
  title: string;
  libraryEntryId: string | null;
  familyId: string | null;
  fromStageId: string | null;
  fromStageLabel: string | null;
  toStageId: string | null;
  toStageLabel: string | null;
  structureLine: string | null;
  targetPreview: string | null;
  /** Missing pace when anchor absent — never invent */
  targetMissingReason: string | null;
  sourceSessionId: string | null;
  reasons: string[];
  difference: ComposerDifference;
  confidence: AdaptationConfidence | null;
  automationEligibility: AutomationEligibility | null;
  requiresCoachJudgement: boolean;
  acceptedByDefault: boolean;
  locked: boolean;
  lockReason: string | null;
  libraryGap: ComposerLibraryGap | null;
  athleteChangeMessage: ComposerAthleteChangeMessage | null;
  /** Coach may reject / keep original independently */
  coachState: "proposed" | "accepted" | "rejected" | "edited";
};

export type WeekProposal = {
  mode: WeekComposerMode;
  athleteId: string;
  sourceWeekNumber: number;
  targetWeekNumber: number;
  decisionAuthority: DecisionAuthority;
  autoApplyForbidden: true;
  sessions: ProposedComposerSession[];
  proposedRunVolumeKm: number | null;
  previousRunVolumeKm: number | null;
  runVolumeDeltaKm: number | null;
  qualitySessionCount: number;
  notableChanges: string[];
  unresolvedWarnings: string[];
  sessionsRequiringCoachJudgement: string[];
  libraryGaps: ComposerLibraryGap[];
  rationale: string[];
};

export type WeekComposerApplyRequest = {
  proposal: WeekProposal;
  /** proposalIds to apply; omitted = all acceptedByDefault / accepted */
  acceptedProposalIds?: string[];
  rejectedProposalIds?: string[];
};

export type WeekComposerApplyResult = {
  ok: true;
  draftWeek: import("@/app/lib/hyroxCoachProgrammeDraft").CoachDraftWeek;
  appliedProposalIds: string[];
  skippedProposalIds: string[];
  published: false;
  autoApplyForbidden: true;
};

export function isComposerAction(v: unknown): v is ComposerAction {
  return typeof v === "string" && (COMPOSER_ACTIONS as readonly string[]).includes(v);
}

export function verbToComposerAction(verb: AdaptationVerb): ComposerAction {
  if ((COMPOSER_ACTIONS as readonly string[]).includes(verb)) {
    return verb as ComposerAction;
  }
  if (verb === "DELOAD") return "REDUCE";
  if (verb === "SKIP_TO") return "PROGRESS";
  if (verb === "COACH_REVIEW") return "KEEP";
  return "KEEP";
}
