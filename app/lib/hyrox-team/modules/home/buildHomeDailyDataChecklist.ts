/**
 * Home V2 — Today's Data checklist. Only items with reliable underlying data.
 */

import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import type { HyroxDailyReadinessRow } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import {
  hasPainTightnessFlag,
  isMobilityOrRecoverySession,
  resolveSessionCtaState,
} from "@/app/lib/hyrox-team/modules/today/resolveTodaySessions";
import { readOptionalReadinessFields } from "./optionalReadinessFields";

export type HomeDailyDataAction =
  | "readiness"
  | "session"
  | "checkin"
  | "coach_ack"
  | "none";

export type HomeDailyDataItem = {
  id: string;
  label: string;
  done: boolean;
  applicable: boolean;
  /** When false, item may display but does not count toward daily completion. */
  required: boolean;
  ctaLabel?: string;
  action: HomeDailyDataAction;
};

export function buildHomePainAlert(params: {
  readiness: HyroxDailyReadinessRow | null;
  todaysSessions: HyroxSession[];
}): boolean {
  const mainSessions = params.todaysSessions.filter((s) => !isMobilityOrRecoverySession(s));
  const focusSessions = mainSessions.length ? mainSessions : params.todaysSessions;
  return (
    Boolean(params.readiness?.feeling_unwell) ||
    focusSessions.some((s) => hasPainTightnessFlag(s))
  );
}

export function buildHomeDailyDataChecklist(params: {
  todayV2Enabled: boolean;
  readiness: HyroxDailyReadinessRow | null;
  todaysSessions: HyroxSession[];
  coachNoteReviewed: boolean;
  hasCoachNote: boolean;
  checkInDue: boolean;
  checkInComplete: boolean;
}): HomeDailyDataItem[] {
  const readinessSubmitted = Boolean(params.readiness?.submitted_at);
  const optional = readOptionalReadinessFields(params.readiness);

  const mainSessions = params.todaysSessions.filter((s) => !isMobilityOrRecoverySession(s));
  const focusSessions = mainSessions.length ? mainSessions : params.todaysSessions;

  const sessionCompleted =
    focusSessions.length > 0 &&
    focusSessions.every((s) => s.status === "complete");

  const sessionLogged =
    focusSessions.length > 0 &&
    focusSessions.every((s) => {
      const state = resolveSessionCtaState(s);
      return (
        state === "view_result" ||
        state === "session_complete" ||
        Boolean(s.loggedRpe || s.logNotes || s.activityMetrics)
      );
    });

  const items: HomeDailyDataItem[] = [];

  if (params.todayV2Enabled) {
    items.push({
      id: "morning_readiness",
      label: "Morning readiness submitted",
      done: readinessSubmitted,
      applicable: true,
      required: true,
      ctaLabel: readinessSubmitted ? undefined : "Complete readiness",
      action: "readiness",
    });

    items.push({
      id: "bodyweight",
      label: "Bodyweight logged (optional)",
      done: params.readiness?.bodyweight != null,
      applicable: readinessSubmitted,
      required: false,
      ctaLabel: params.readiness?.bodyweight == null ? "Log bodyweight" : undefined,
      action: "readiness",
    });

    items.push({
      id: "resting_hr",
      label: "Resting HR logged (optional)",
      done: params.readiness?.resting_hr != null,
      applicable: readinessSubmitted,
      required: false,
      ctaLabel: params.readiness?.resting_hr == null ? "Log resting HR" : undefined,
      action: "readiness",
    });

    items.push({
      id: "hrv",
      label: "HRV logged (optional)",
      done: optional.hrv != null,
      applicable: readinessSubmitted,
      required: false,
      ctaLabel: optional.hrv == null ? "Log HRV" : undefined,
      action: "readiness",
    });
  }

  if (focusSessions.length > 0) {
    items.push({
      id: "session_completed",
      label: focusSessions.length > 1 ? "Sessions completed" : "Session completed",
      done: sessionCompleted,
      applicable: true,
      required: true,
      ctaLabel: sessionCompleted ? undefined : "View session",
      action: "session",
    });

    items.push({
      id: "session_logged",
      label: "Session result logged",
      done: sessionLogged,
      applicable: true,
      required: true,
      ctaLabel: sessionLogged ? undefined : "Log session",
      action: "session",
    });
  }

  if (params.hasCoachNote) {
    items.push({
      id: "coach_note",
      label: "Coach note reviewed",
      done: params.coachNoteReviewed,
      applicable: true,
      required: true,
      ctaLabel: params.coachNoteReviewed ? undefined : "Mark reviewed",
      action: "coach_ack",
    });
  }

  if (params.checkInDue || params.checkInComplete) {
    items.push({
      id: "weekly_checkin",
      label: "Weekly check-in submitted",
      done: params.checkInComplete,
      applicable: true,
      required: true,
      ctaLabel: params.checkInComplete ? undefined : "Complete check-in",
      action: "checkin",
    });
  }

  return items.filter((i) => i.applicable);
}

export function homeDailyDataProgress(items: HomeDailyDataItem[]): {
  complete: number;
  total: number;
} {
  const required = items.filter((i) => i.applicable && i.required);
  const complete = required.filter((i) => i.done).length;
  return { complete, total: required.length };
}
