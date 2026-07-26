/**
 * Today checklist — only items with real supporting data.
 */

import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import {
  hasPainTightnessFlag,
  isMobilityOrRecoverySession,
  resolveSessionCtaState,
} from "@/app/lib/hyrox-team/modules/today/resolveTodaySessions";
import type { ReadinessCategory } from "@/app/lib/hyrox-team/modules/today/readinessScore";

export type TodayChecklistItemId =
  | "morning_readiness"
  | "main_session"
  | "session_log"
  | "mobility_recovery"
  | "coach_note";

export type TodayChecklistItem = {
  id: TodayChecklistItemId;
  label: string;
  done: boolean;
  /** When false, item is hidden (no supporting session/data). */
  applicable: boolean;
};

export function buildTodayChecklist(params: {
  readinessSubmitted: boolean;
  todaysSessions: HyroxSession[];
  coachNoteReviewed: boolean;
  hasCoachNote: boolean;
}): TodayChecklistItem[] {
  const sessions = params.todaysSessions;
  const mainSessions = sessions.filter((s) => !isMobilityOrRecoverySession(s));
  const mobilitySessions = sessions.filter((s) => isMobilityOrRecoverySession(s));
  const focusSessions = mainSessions.length ? mainSessions : sessions;

  const mainDone =
    focusSessions.length > 0 &&
    focusSessions.every((s) => s.status === "complete");

  const logDone =
    focusSessions.length > 0 &&
    focusSessions.every((s) => {
      const state = resolveSessionCtaState(s);
      return (
        state === "view_result" ||
        state === "session_complete" ||
        Boolean(s.loggedRpe || s.logNotes || s.activityMetrics)
      );
    });

  const mobilityApplicable = mobilitySessions.length > 0;
  const mobilityDone =
    mobilityApplicable && mobilitySessions.every((s) => s.status === "complete");

  return (
    [
      {
        id: "morning_readiness" as const,
        label: "Morning readiness submitted",
        done: params.readinessSubmitted,
        applicable: true,
      },
      {
        id: "main_session" as const,
        label: focusSessions.length > 1 ? "Main sessions completed" : "Main session completed",
        done: mainDone,
        applicable: focusSessions.length > 0,
      },
      {
        id: "session_log" as const,
        label: "Session log submitted",
        done: logDone,
        applicable: focusSessions.length > 0,
      },
      {
        id: "mobility_recovery" as const,
        label: "Mobility / recovery completed",
        done: mobilityDone,
        applicable: mobilityApplicable,
      },
      {
        id: "coach_note" as const,
        label: "Coach note reviewed",
        done: params.coachNoteReviewed,
        applicable: params.hasCoachNote,
      },
    ] satisfies TodayChecklistItem[]
  ).filter((i) => i.applicable);
}

export type TodayCoachSnapshot = {
  localDate: string;
  readinessSubmitted: boolean;
  readinessCategory: ReadinessCategory | null;
  readinessExplanation: string | null;
  readinessScore: number | null;
  feelingUnwell: boolean;
  highSoreness: boolean;
  muscleSoreness: number | null;
  sessionStatuses: Array<{
    id: string;
    name: string;
    status: string;
    logSubmitted: boolean;
    painTightness: boolean;
    plannedPace: string | null;
    completedSummary: string | null;
  }>;
};

export function buildCoachTodaySessionRows(sessions: HyroxSession[]): TodayCoachSnapshot["sessionStatuses"] {
  return sessions.map((s) => {
    const logSubmitted = Boolean(
      s.loggedRpe || s.logNotes || s.logScore || s.activityMetrics
    );
    const plannedPace = s.plannedTargets?.targetPace ?? null;
    const metrics = s.activityMetrics as Record<string, unknown> | null | undefined;
    const completedSummary =
      s.logScore ||
      (metrics &&
        [metrics.duration, metrics.averagePace, metrics.totalDuration, metrics.distanceKm]
          .filter(Boolean)
          .join(" · ")) ||
      (s.loggedRpe ? `RPE ${s.loggedRpe}` : null);

    return {
      id: s.id,
      name: s.name,
      status: s.status,
      logSubmitted,
      painTightness: hasPainTightnessFlag(s),
      plannedPace,
      completedSummary: completedSummary ? String(completedSummary) : null,
    };
  });
}
