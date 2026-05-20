/**
 * Coach action queue — derived from mock athlete roster (local state).
 */

import { COACH_ATHLETES, type CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";

export type CoachActionType =
  | "programme_needs_review"
  | "check_in_submitted"
  | "recovery_warning"
  | "testing_overdue"
  | "race_week_approaching"
  | "programme_not_published"
  | "video_feedback_pending";

export type CoachActionPriority = "urgent" | "high" | "normal";

export type CoachActionItem = {
  id: string;
  type: CoachActionType;
  priority: CoachActionPriority;
  athleteId: string;
  athleteName: string;
  athleteInitials: string;
  title: string;
  detail: string;
  href: string;
  /** Optional tab hash for athlete dashboard */
  tab?: string;
};

const ACTION_LABELS: Record<CoachActionType, string> = {
  programme_needs_review: "Programme needs review",
  check_in_submitted: "Check-in submitted",
  recovery_warning: "Recovery warning",
  testing_overdue: "Testing overdue",
  race_week_approaching: "Race week approaching",
  programme_not_published: "Programme not published",
  video_feedback_pending: "Video feedback pending",
};

const PRIORITY_ORDER: Record<CoachActionPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
};

export function actionTypeLabel(type: CoachActionType): string {
  return ACTION_LABELS[type];
}

function athleteHref(athleteId: string, tab?: string): string {
  const base = `/admin/hyrox-athletes/${athleteId}`;
  return tab ? `${base}?tab=${encodeURIComponent(tab)}` : base;
}

function pushAction(
  items: CoachActionItem[],
  athlete: CoachAthlete,
  type: CoachActionType,
  priority: CoachActionPriority,
  detail: string,
  tab?: string
): void {
  items.push({
    id: `${athlete.id}-${type}`,
    type,
    priority,
    athleteId: athlete.id,
    athleteName: athlete.name,
    athleteInitials: athlete.initials,
    title: ACTION_LABELS[type],
    detail,
    href: athleteHref(athlete.id, tab),
    tab,
  });
}

export function buildCoachActionQueue(athletes: CoachAthlete[] = COACH_ATHLETES): CoachActionItem[] {
  const items: CoachActionItem[] = [];

  for (const a of athletes) {
    const wf = a.coachWorkflow;

    if (
      a.listStatus === "needs_coach_review" ||
      a.listStatus === "draft_generated" ||
      a.programmeStatus === "generated_draft" ||
      a.programmeStatus === "coach_reviewing" ||
      a.programmeStatus === "edited_draft"
    ) {
      pushAction(
        items,
        a,
        "programme_needs_review",
        a.listStatus === "needs_coach_review" ? "urgent" : "high",
        a.nextCoachAction || `Block ${a.programmeBlock} Week ${a.blockWeek} draft ready`,
        "Programme Builder"
      );
    }

    if (
      wf?.checkInSubmitted ||
      a.listStatus === "check_in_requires_adjustment" ||
      a.checkInStatus === "due"
    ) {
      pushAction(
        items,
        a,
        "check_in_submitted",
        a.checkInStatus === "overdue" ? "urgent" : "high",
        wf?.checkInDetail ?? "Weekly check-in ready for coach review",
        "Check-Ins"
      );
    }

    if (a.recoveryRisk === "high" || a.recoveryStatus === "poor" || wf?.recoveryWarning) {
      pushAction(
        items,
        a,
        "recovery_warning",
        a.recoveryRisk === "high" ? "urgent" : "high",
        wf?.recoveryDetail ??
          `Recovery ${a.recoveryStatus} · ${a.assessment.recoveryProfile.slice(0, 60)}…`,
        "Check-Ins"
      );
    }

    if (wf?.testingOverdue === true) {
      pushAction(
        items,
        a,
        "testing_overdue",
        "high",
        wf.testingDetail ?? "Benchmark retest due — update pace zones",
        "Testing"
      );
    }

    if (a.weeksToRace <= 4 || a.programmeInputs.raceTimeline === "race_week" || wf?.raceWeekApproaching) {
      pushAction(
        items,
        a,
        "race_week_approaching",
        a.weeksToRace <= 2 ? "urgent" : "high",
        `${a.weeksToRace} weeks to race · ${a.raceDate}`,
        "Programme Builder"
      );
    }

    if (a.programmeStatus !== "published" && a.listStatus !== "published_to_athlete") {
      if (
        a.programmeStatus === "approved" ||
        a.listStatus === "approved" ||
        wf?.awaitingPublish
      ) {
        pushAction(
          items,
          a,
          "programme_not_published",
          "high",
          "Week approved — publish to athlete dashboard",
          "Programme Builder"
        );
      } else if (
        !items.some((i) => i.athleteId === a.id && i.type === "programme_needs_review")
      ) {
        pushAction(
          items,
          a,
          "programme_not_published",
          "normal",
          "Current week not yet published to athlete",
          "Programme Builder"
        );
      }
    }

    if (wf?.videoFeedbackPending) {
      pushAction(
        items,
        a,
        "video_feedback_pending",
        "normal",
        wf.videoDetail ?? "Session video uploaded — review technique",
        "Programme Builder"
      );
    }
  }

  return items.sort((a, b) => {
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (p !== 0) return p;
    return a.athleteName.localeCompare(b.athleteName);
  });
}
