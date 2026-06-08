/** Coach weekly review — admin Hyrox athlete detail. */

import {
  isHighLoggedRpe,
  isKeyProgrammeSession,
  parseLoggedRpe,
} from "@/app/lib/hyroxBlockReview";
import type { ProgrammeWeekCalendarStatus } from "@/app/lib/hyroxProgrammeDates";

export type HyroxWeeklyCoachNotes = {
  coachObservations?: string;
  adjustmentsForNextWeek?: string;
  followUpMessageNeeded?: string;
  sessionChangesRequired?: string;
};

export type WeeklyReviewAlertSeverity = "info" | "warn" | "critical";

export type WeeklyReviewAlert = {
  severity: WeeklyReviewAlertSeverity;
  code: string;
  message: string;
};

export type WeeklyReviewSessionRow = {
  id: string;
  dayOfWeek: string;
  sessionSlot: string;
  sessionName: string;
  category: string;
  sessionType: string;
  plannedDuration: string | null;
  plannedDurationMinutes: number | null;
  status: string;
  completed: boolean;
  completedAt: string | null;
  rpe: string | null;
  rpeNumeric: number | null;
  notes: string | null;
  modifications: string | null;
  score: string | null;
  loggedAt: string | null;
  isKeySession: boolean;
  dateLabel: string | null;
};

export type WeeklyReviewCheckIn = {
  id: string;
  weekNumber: number;
  submittedAt: string | null;
  status: string;
  sleep: number | null;
  energy: number | null;
  stress: number | null;
  soreness: number | null;
  recovery: number | null;
  bodyweight: number | null;
  sessionsCompleted: number | null;
  biggestWin: string | null;
  biggestStruggle: string | null;
  painNiggles: string | null;
  nextWeekAvailability: string | null;
};

export type WeeklyReviewWeekSummary = {
  weekNumber: number;
  programmeWeekId: string | null;
  published: boolean;
  dateRangeLabel: string | null;
  calendarStatus: ProgrammeWeekCalendarStatus | "unpublished";
  weeklyFocus: string | null;
  sessionsCompleted: number;
  sessionsTotal: number;
  completionPercent: number;
  averageRpe: number | null;
  rpeSampleCount: number;
  sessionsWithNotes: number;
  missedOrIncomplete: number;
  checkInStatus: "needs_completing" | "completed" | "not_applicable";
  checkInSubmittedAt: string | null;
};

export type HyroxWeeklyReviewPayload = {
  weekNumber: number;
  availableWeeks: number[];
  programmeLengthWeeks: 12 | 16;
  summary: WeeklyReviewWeekSummary;
  sessions: WeeklyReviewSessionRow[];
  checkIn: WeeklyReviewCheckIn | null;
  alerts: WeeklyReviewAlert[];
  coachNotes: HyroxWeeklyCoachNotes;
  coachReviewUpdatedAt: string | null;
};

const FATIGUE_KEYWORDS =
  /\b(fatigue|fatigued|tired|tightness|tight|sore|soreness|exhausted|heavy legs|wiped|beat up)\b/i;

export function emptyWeeklyCoachNotes(): HyroxWeeklyCoachNotes {
  return {};
}

export function parseWeeklyCoachNotesJson(raw: unknown): HyroxWeeklyCoachNotes {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === "string" ? o[k] : undefined);
  return {
    coachObservations: str("coachObservations"),
    adjustmentsForNextWeek: str("adjustmentsForNextWeek"),
    followUpMessageNeeded: str("followUpMessageNeeded"),
    sessionChangesRequired: str("sessionChangesRequired"),
  };
}

export function computeWeeklyReviewAlerts(input: {
  summary: WeeklyReviewWeekSummary;
  sessions: WeeklyReviewSessionRow[];
  checkIn: WeeklyReviewCheckIn | null;
}): WeeklyReviewAlert[] {
  const alerts: WeeklyReviewAlert[] = [];
  const { summary, sessions, checkIn } = input;

  if (summary.published && summary.checkInStatus === "needs_completing") {
    if (summary.calendarStatus === "past" || summary.calendarStatus === "live") {
      alerts.push({
        severity: "warn",
        code: "check_in_missing",
        message: "Weekly check-in not submitted yet.",
      });
    }
  }

  if (
    summary.published &&
    summary.sessionsTotal > 0 &&
    summary.completionPercent < 70
  ) {
    alerts.push({
      severity: "warn",
      code: "low_completion",
      message: `Completion rate below 70% (${summary.completionPercent}%).`,
    });
  }

  if (summary.averageRpe != null && summary.averageRpe >= 8) {
    alerts.push({
      severity: "warn",
      code: "high_avg_rpe",
      message: `High average session RPE (${summary.averageRpe.toFixed(1)}).`,
    });
  }

  const veryHighRpe = sessions.filter((s) => s.rpeNumeric != null && s.rpeNumeric >= 9);
  if (veryHighRpe.length >= 2) {
    alerts.push({
      severity: "critical",
      code: "multiple_rpe_9_10",
      message: `RPE 9–10 logged on ${veryHighRpe.length} sessions this week.`,
    });
  }

  const missedKey = sessions.filter((s) => s.isKeySession && !s.completed);
  if (missedKey.length > 0) {
    alerts.push({
      severity: "critical",
      code: "missed_key_session",
      message: `Missed or incomplete key session: ${missedKey.map((s) => s.sessionName).join(", ")}.`,
    });
  }

  if (checkIn) {
    if ((checkIn.sleep != null && checkIn.sleep <= 4) || (checkIn.energy != null && checkIn.energy <= 4)) {
      alerts.push({
        severity: "warn",
        code: "low_sleep_energy",
        message: "Low sleep or energy reported in weekly check-in.",
      });
    }
    if (checkIn.painNiggles?.trim()) {
      alerts.push({
        severity: "critical",
        code: "pain_injury_reported",
        message: "Pain or injury notes submitted in check-in.",
      });
    }
  }

  const fatigueNotes = sessions.filter((s) => s.notes && FATIGUE_KEYWORDS.test(s.notes));
  if (fatigueNotes.length >= 2) {
    alerts.push({
      severity: "warn",
      code: "repeated_fatigue_notes",
      message: "Multiple session notes mention fatigue, tightness or soreness.",
    });
  }

  return alerts;
}

export function sessionCompletedStatus(status: string): boolean {
  return status === "completed" || status === "modified";
}

export function buildSessionReviewRow(params: {
  session: {
    id: string;
    day_of_week: string;
    session_slot: string;
    session_name: string;
    category: string;
    status: string;
    completed_at: string | null;
    metadata: Record<string, unknown> | null;
    athlete_feedback: unknown;
  };
  plannedDuration: string | null;
  plannedDurationMinutes: number | null;
  dateLabel: string | null;
  feedback: {
    rpe?: string | null;
    notes?: string | null;
    modifications?: string | null;
    score?: string | null;
    loggedAt?: string | null;
  };
}): WeeklyReviewSessionRow {
  const { session, feedback } = params;
  const rpeNumeric = parseLoggedRpe(feedback.rpe);
  const meta = session.metadata ?? {};
  const isKey = isKeyProgrammeSession({
    metadata: meta,
    sessionSlot: session.session_slot,
    category: session.category,
  });
  const completed = sessionCompletedStatus(session.status);

  return {
    id: session.id,
    dayOfWeek: session.day_of_week,
    sessionSlot: session.session_slot,
    sessionName: session.session_name,
    category: session.category,
    sessionType: inferSessionTypeLabel(session.category, session.session_name),
    plannedDuration: params.plannedDuration,
    plannedDurationMinutes: params.plannedDurationMinutes,
    status: session.status,
    completed,
    completedAt: session.completed_at,
    rpe: feedback.rpe ?? null,
    rpeNumeric,
    notes: feedback.notes ?? null,
    modifications: feedback.modifications ?? null,
    score: feedback.score ?? null,
    loggedAt: feedback.loggedAt ?? null,
    isKeySession: isKey,
    dateLabel: params.dateLabel,
  };
}

function inferSessionTypeLabel(category: string, name: string): string {
  const blob = `${category} ${name}`.toLowerCase();
  if (blob.includes("run")) return "Run";
  if (blob.includes("strength")) return "Strength";
  if (blob.includes("hyrox") || blob.includes("station")) return "HYROX";
  if (blob.includes("erg") || blob.includes("ski") || blob.includes("row")) return "Erg";
  if (blob.includes("recovery")) return "Recovery";
  return category || "Session";
}

export function sortWeeklyReviewSessions(
  sessions: WeeklyReviewSessionRow[]
): WeeklyReviewSessionRow[] {
  const dayOrder: Record<string, number> = {
    Mon: 0,
    Monday: 0,
    Tue: 1,
    Tuesday: 1,
    Wed: 2,
    Wednesday: 2,
    Thu: 3,
    Thursday: 3,
    Fri: 4,
    Friday: 4,
    Sat: 5,
    Saturday: 5,
    Sun: 6,
    Sunday: 6,
  };
  const slotOrder: Record<string, number> = { AM: 0, Main: 1, PM: 2, Optional: 3 };

  return [...sessions].sort((a, b) => {
    const dayDiff =
      (dayOrder[a.dayOfWeek] ?? dayOrder[a.dayOfWeek.slice(0, 3)] ?? 99) -
      (dayOrder[b.dayOfWeek] ?? dayOrder[b.dayOfWeek.slice(0, 3)] ?? 99);
    if (dayDiff !== 0) return dayDiff;
    return (slotOrder[a.sessionSlot] ?? 9) - (slotOrder[b.sessionSlot] ?? 9);
  });
}

export function averageRpeFromSessions(sessions: WeeklyReviewSessionRow[]): {
  average: number | null;
  count: number;
} {
  const values = sessions.map((s) => s.rpeNumeric).filter((v): v is number => v != null);
  if (!values.length) return { average: null, count: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  return { average: Math.round((sum / values.length) * 10) / 10, count: values.length };
}

export function isVeryHighRpe(rpe: number | null): boolean {
  return rpe != null && rpe >= 9;
}

export function isHighRpeForDisplay(rpe: number | null): boolean {
  return isHighLoggedRpe(rpe);
}
