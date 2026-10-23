/**
 * Pure Command Centre assemblers. Session counts and logged RPE means only.
 * Does not compute run distance, duration, session-RPE load, rolling 4, or modality.
 */

import type { CoachAttentionSession } from "@/app/lib/hyroxCoachAttention";
import type { HyroxAthleteAnalytics } from "@/app/lib/hyroxCommandCentreAnalyticsTypes";
import type { CommandCentreThisWeek } from "@/app/lib/hyroxCommandCentreTypes";

export type PublishedWeekFacts = {
  plannedSessions: number;
  completedSessions: number;
  completionPct: number | null;
  averageRpe: number | null;
  keySessionsCompleted: number;
  keySessionsPlanned: number;
};

export function averageLoggedRpe(sessions: CoachAttentionSession[]): number | null {
  const values = sessions
    .map((session) => session.loggedRpe)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!values.length) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

export function summarizePublishedWeek(sessions: CoachAttentionSession[]): PublishedWeekFacts {
  const plannedSessions = sessions.length;
  const completedSessions = sessions.filter((session) => session.completed).length;
  const keySessions = sessions.filter((session) => session.isKey);
  return {
    plannedSessions,
    completedSessions,
    completionPct: plannedSessions > 0 ? Math.round((completedSessions / plannedSessions) * 100) : null,
    averageRpe: averageLoggedRpe(sessions),
    keySessionsCompleted: keySessions.filter((session) => session.completed).length,
    keySessionsPlanned: keySessions.length,
  };
}

export function pickUpcomingKeySession(
  sessions: CoachAttentionSession[],
  todayYmd: string
): CoachAttentionSession | null {
  return (
    sessions
      .filter((session) => session.isKey && !session.completed && session.dateYmd != null && session.dateYmd > todayYmd)
      .sort((a, b) => (a.dateYmd ?? "").localeCompare(b.dateYmd ?? ""))[0] ?? null
  );
}

export function overlayAnalyticsOnThisWeek(
  week: CommandCentreThisWeek,
  analytics: HyroxAthleteAnalytics | null
): CommandCentreThisWeek {
  if (!analytics) return week;
  const current = analytics.currentWeek;
  if (!current) return week;
  return {
    ...week,
    runDistanceKm: current.runDistanceKm,
    trainingDurationMinutes: current.trainingDurationMinutes,
    sessionRpeLoad: current.sessionRpeLoad,
    averageRpe: current.averageRpe ?? week.averageRpe,
    plannedSessions: week.published ? (week.plannedSessions ?? current.plannedSessions) : null,
    completedSessions: week.published ? (week.completedSessions ?? current.completedSessions) : null,
    completionPct: week.published ? (week.completionPct ?? current.completionPct) : null,
    keySessionsCompleted: week.published ? (week.keySessionsCompleted ?? current.keySessionsCompleted) : null,
    keySessionsPlanned: week.published ? week.keySessionsPlanned : null,
  };
}
