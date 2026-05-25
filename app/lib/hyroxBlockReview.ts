/** Hyrox 4-week block review — coach admin only. */

import { getProgrammeRoadmap, type ProgrammeLengthWeeks } from "@/app/lib/hyroxProgrammeDates";

export type HyroxBlockReviewNextRecommendation =
  | "progress_as_planned"
  | "increase_load"
  | "hold_load"
  | "reduce_load"
  | "shift_focus"
  | "race_specific_build"
  | "retest_recalibrate";

export const BLOCK_REVIEW_RECOMMENDATION_OPTIONS: {
  value: HyroxBlockReviewNextRecommendation;
  label: string;
}[] = [
  { value: "progress_as_planned", label: "Progress as planned" },
  { value: "increase_load", label: "Increase load" },
  { value: "hold_load", label: "Hold load" },
  { value: "reduce_load", label: "Reduce load / recovery block" },
  { value: "shift_focus", label: "Shift focus" },
  { value: "race_specific_build", label: "Race-specific build" },
  { value: "retest_recalibrate", label: "Retest / recalibrate" },
];

export type HyroxBlockReviewCoachNotes = {
  whatWentWell?: string;
  whatNeedsAdjusting?: string;
  currentPriorityFocus?: string;
  stationWeaknessFocus?: string;
  runningProgressionNotes?: string;
  strengthLegEnduranceNotes?: string;
  recoveryInjuryConsiderations?: string;
  nextBlockGoal?: string;
};

export type BlockReviewSessionRow = {
  id: string;
  programmeWeekId: string;
  weekNumber: number;
  dayOfWeek: string;
  sessionSlot: string;
  sessionName: string;
  status: string;
  isKeySession: boolean;
  rpeLogged: number | null;
  hasNotes: boolean;
  hasModifications: boolean;
  completedAt: string | null;
};

export type BlockReviewCheckInSummary = {
  count: number;
  submittedCount: number;
  avgBodyweight: number | null;
  avgSleep: number | null;
  avgEnergy: number | null;
  avgStress: number | null;
  avgSoreness: number | null;
  painNiggles: string[];
  biggestStruggles: string[];
};

export type BlockReviewTestingSummary = {
  testType: string;
  testDate: string | null;
  resultSummary: string;
  rpe: number | null;
  notes: string | null;
  createdAt: string;
};

export type BlockReviewAthleteContext = {
  mainLimiter: string | null;
  secondaryLimiter: string | null;
  firstBlockFocus: string | null;
  recoveryRisk: string | null;
  stationWeaknesses: string[];
  assessmentBodyweight: number | null;
};

export type BlockReviewCompletionSummary = {
  blockNumber: number;
  weeksStart: number;
  weeksEnd: number;
  blockTitle: string;
  weekLabels: string[];
  sessionsCompleted: number;
  sessionsTotal: number;
  keySessionsCompleted: number;
  keySessionsTotal: number;
  averageRpe: number | null;
  rpeSampleCount: number;
  missedSessions: number;
  sessionsWithNotes: number;
  sessionsWithModifications: number;
  highRpeSessionCount: number;
  skippedKeyMissed: string[];
  highRpeSessions: { sessionName: string; weekNumber: number; dayOfWeek: string; rpe: number }[];
  sessionsWithNotesList: { sessionName: string; weekNumber: number; notePreview: string }[];
  weekBreakdown: {
    weekNumber: number;
    completed: number;
    total: number;
    published: boolean;
  }[];
  checkIn: BlockReviewCheckInSummary;
  testing: BlockReviewTestingSummary[];
  athleteContext: BlockReviewAthleteContext;
  computedAt: string;
};

export type HyroxBlockReviewRecord = {
  id: string;
  athleteId: string;
  blockNumber: number;
  weeksStart: number;
  weeksEnd: number;
  completionSummary: BlockReviewCompletionSummary;
  coachNotes: HyroxBlockReviewCoachNotes;
  nextBlockRecommendation: HyroxBlockReviewNextRecommendation | null;
  nextBlockFocus: string | null;
  createdAt: string;
  updatedAt: string;
};

export function blockWeekRange(blockNumber: number): { weeksStart: number; weeksEnd: number } {
  const weeksStart = (blockNumber - 1) * 4 + 1;
  const weeksEnd = blockNumber * 4;
  return { weeksStart, weeksEnd };
}

export function maxReviewBlocks(programmeLengthWeeks: ProgrammeLengthWeeks = 12): number {
  return programmeLengthWeeks === 16 ? 4 : 3;
}

export function blockMetaForReview(
  blockNumber: number,
  programmeLengthWeeks: ProgrammeLengthWeeks = 12
): { weeksStart: number; weeksEnd: number; blockTitle: string; weekLabels: string[] } {
  const { weeksStart, weeksEnd } = blockWeekRange(blockNumber);
  const phase = getProgrammeRoadmap(programmeLengthWeeks).find((p) => p.blockNumber === blockNumber);
  const blockTitle = phase?.name ?? `Block ${blockNumber}`;
  const weekLabels =
    phase?.weekRoles.map((role, i) => `W${weeksStart + i} · ${role}`) ??
    Array.from({ length: 4 }, (_, i) => `W${weeksStart + i}`);
  return { weeksStart, weeksEnd, blockTitle, weekLabels };
}

/** Parse athlete-logged RPE to a number for averages / high-RPE flags. */
export function parseLoggedRpe(raw: string | null | undefined): number | null {
  if (!raw?.trim()) return null;
  const nums = raw.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
  if (!nums.length) return null;
  return Math.max(...nums);
}

export function isHighLoggedRpe(rpe: number | null): boolean {
  return rpe != null && rpe >= 8;
}

export function isKeyProgrammeSession(params: {
  metadata: Record<string, unknown> | null;
  sessionSlot: string;
  category: string;
}): boolean {
  const meta = params.metadata ?? {};
  if (meta.isKeySession === true) return true;
  if (params.sessionSlot === "Optional") return false;
  const cat = params.category.toLowerCase();
  if (cat.includes("recovery")) return false;
  return true;
}

export function emptyCoachNotes(): HyroxBlockReviewCoachNotes {
  return {};
}

export function parseCoachNotesJson(raw: unknown): HyroxBlockReviewCoachNotes {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === "string" ? o[k] : undefined);
  return {
    whatWentWell: str("whatWentWell"),
    whatNeedsAdjusting: str("whatNeedsAdjusting"),
    currentPriorityFocus: str("currentPriorityFocus"),
    stationWeaknessFocus: str("stationWeaknessFocus"),
    runningProgressionNotes: str("runningProgressionNotes"),
    strengthLegEnduranceNotes: str("strengthLegEnduranceNotes"),
    recoveryInjuryConsiderations: str("recoveryInjuryConsiderations"),
    nextBlockGoal: str("nextBlockGoal"),
  };
}
