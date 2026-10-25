/**
 * Copy a HYROX 1-1 coach programme week into another week.
 * Operates on coach draft JSON only — never copies athlete history.
 */

import {
  countCoachDraftSessions,
  type CoachDraftSession,
  type CoachDraftWeek,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  blockNumberForGlobalWeek,
  cycleInBlockForGlobalWeek,
  weekDateRangeFromProgrammeStart,
} from "@/app/lib/hyroxProgrammeDates";

const ATHLETE_HISTORY_KEYS = [
  "athlete_feedback",
  "athleteFeedback",
  "completed_at",
  "completedAt",
  "loggedAt",
  "metrics",
] as const;

export const COPY_WEEK_ERROR = {
  SAME_WEEK: "Source and target week must be different.",
  SOURCE_EMPTY: "Source week has no programmed sessions to copy.",
  SOURCE_MISSING: "No programme draft found for the source week.",
  TARGET_PUBLISHED:
    "This week already contains published sessions and cannot be replaced.",
  TARGET_ATHLETE_ACTIVITY:
    "This week contains athlete activity and cannot be replaced.",
  TARGET_HAS_PROGRAMMING:
    "TARGET WEEK ALREADY CONTAINS PROGRAMMING. Confirm replace to continue.",
} as const;

export type CopyWeekErrorCode = keyof typeof COPY_WEEK_ERROR;

export type CopyWeekTargetState = {
  hasProgramming: boolean;
  published: boolean;
  athleteHistory: boolean;
};

export type CopyWeekDecision =
  | { ok: true; action: "copy" | "replace" }
  | { ok: false; code: CopyWeekErrorCode; message: string };

export function resolveCopyWeekDecision(
  target: CopyWeekTargetState,
  replace: boolean
): CopyWeekDecision {
  if (target.athleteHistory) {
    return {
      ok: false,
      code: "TARGET_ATHLETE_ACTIVITY",
      message: COPY_WEEK_ERROR.TARGET_ATHLETE_ACTIVITY,
    };
  }
  if (target.published) {
    return {
      ok: false,
      code: "TARGET_PUBLISHED",
      message: COPY_WEEK_ERROR.TARGET_PUBLISHED,
    };
  }
  if (target.hasProgramming && !replace) {
    return {
      ok: false,
      code: "TARGET_HAS_PROGRAMMING",
      message: COPY_WEEK_ERROR.TARGET_HAS_PROGRAMMING,
    };
  }
  return { ok: true, action: target.hasProgramming ? "replace" : "copy" };
}

function stripAthleteHistoryFromSession(session: CoachDraftSession): CoachDraftSession {
  const cloned = JSON.parse(JSON.stringify(session)) as CoachDraftSession &
    Record<string, unknown>;
  for (const key of ATHLETE_HISTORY_KEYS) {
    delete cloned[key];
  }
  cloned.draftId = `copy-${crypto.randomUUID()}`;

  // Family-linked: preserve family/stage/structure/rules; clear live preview for re-resolve.
  // Never auto-progress stage on Copy Week / Auto-Carry.
  if (cloned.sessionFamily) {
    cloned.sessionFamily = {
      ...cloned.sessionFamily,
      structuredWorkout: structuredClone(cloned.sessionFamily.structuredWorkout),
      prescriptionSlots: structuredClone(cloned.sessionFamily.prescriptionSlots),
      prescriptionPreview: null,
    };
    if (cloned.editConfig) {
      cloned.editConfig = {
        ...cloned.editConfig,
        targetPace: undefined,
        targetPaceLoad: undefined,
      };
    }
  }

  return cloned;
}

export function cloneCoachDraftWeekForTarget(
  source: CoachDraftWeek,
  params: { athleteId: string; targetWeek: number }
): CoachDraftWeek {
  const targetBlock = blockNumberForGlobalWeek(params.targetWeek);
  return {
    ...source,
    athleteId: params.athleteId,
    block: targetBlock,
    week: params.targetWeek,
    generatedAt: new Date().toISOString(),
    days: source.days.map((day) => ({
      ...day,
      sessions: day.sessions.map(stripAthleteHistoryFromSession),
    })),
  };
}

export function countDraftProgrammingSessions(draft: CoachDraftWeek | null | undefined): number {
  if (!draft) return 0;
  return countCoachDraftSessions(draft).total;
}

export type CopyWeekDestination = {
  week: number;
  block: number;
  cycle: 1 | 2 | 3 | 4;
  startYmd: string | null;
  endYmd: string | null;
  hasProgramming: boolean;
  published: boolean;
  athleteHistory: boolean;
  copyAllowed: boolean;
  replaceAllowed: boolean;
};

export const AUTO_CARRY_COPY = {
  copiedTitle: (fromWeek: number, toWeek: number) =>
    `WEEK ${toWeek} STARTED FROM WEEK ${fromWeek}`,
  copiedDetail:
    "Previous programming has been copied forward. Review and progress the sessions before publishing.",
  preservedTitle: (toWeek: number) => `WEEK ${toWeek} ALREADY CONTAINS PROGRAMMING`,
  preservedDetail: "Existing programming has been preserved.",
  sourceUnavailable: "No previous programme was available to copy.",
} as const;

/** Consecutive +1 week only. Jumps and backwards changes never auto-copy. */
export function shouldAutoCarryProgrammeWeek(fromWeek: number, toWeek: number): boolean {
  if (!Number.isInteger(fromWeek) || !Number.isInteger(toWeek)) return false;
  if (fromWeek < 1 || toWeek < 1) return false;
  return toWeek === fromWeek + 1;
}

export type AutoCarryForwardDecision =
  | { action: "copy" }
  | { action: "preserve"; reason: "has_programming" | "published" | "athlete_activity" }
  | { action: "skip"; reason: "not_consecutive" | "source_unavailable" };

/**
 * Decide whether consecutive week navigation may seed an empty target from the previous week.
 * Never overwrites; never fails the week change.
 */
export function resolveAutoCarryForward(params: {
  fromWeek: number;
  toWeek: number;
  target: CopyWeekTargetState;
  sourceHasProgramming: boolean;
}): AutoCarryForwardDecision {
  if (!shouldAutoCarryProgrammeWeek(params.fromWeek, params.toWeek)) {
    return { action: "skip", reason: "not_consecutive" };
  }
  if (params.target.athleteHistory) {
    return { action: "preserve", reason: "athlete_activity" };
  }
  if (params.target.published) {
    return { action: "preserve", reason: "published" };
  }
  if (params.target.hasProgramming) {
    return { action: "preserve", reason: "has_programming" };
  }
  if (!params.sourceHasProgramming) {
    return { action: "skip", reason: "source_unavailable" };
  }
  return { action: "copy" };
}

export function destinationMetaForWeek(params: {
  week: number;
  programmeStartYmd: string | null;
  state: CopyWeekTargetState;
}): CopyWeekDestination {
  const decision = resolveCopyWeekDecision(params.state, false);
  const replaceDecision = resolveCopyWeekDecision(params.state, true);
  const dates = params.programmeStartYmd
    ? weekDateRangeFromProgrammeStart(params.programmeStartYmd, params.week)
    : null;
  return {
    week: params.week,
    block: blockNumberForGlobalWeek(params.week),
    cycle: cycleInBlockForGlobalWeek(params.week),
    startYmd: dates?.startYmd ?? null,
    endYmd: dates?.endYmd ?? null,
    hasProgramming: params.state.hasProgramming,
    published: params.state.published,
    athleteHistory: params.state.athleteHistory,
    copyAllowed: decision.ok,
    replaceAllowed: replaceDecision.ok && params.state.hasProgramming,
  };
}
