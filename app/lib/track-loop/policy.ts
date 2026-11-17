import type { ReadinessSubmission } from "@/app/lib/daily-readiness/types";
import { interpretReadiness } from "@/app/lib/daily-readiness/interpret";
import { resolveRemainingWeek } from "@/app/lib/daily-readiness/reflow";
import type { WeekSession } from "@/app/lib/daily-readiness/types";
import type { CalendarSession, SessionFeedback, TrackAthleteRecord, WeeklyCheckIn } from "./store";

export const TRACK_POLICY_VERSION = "track-loop-v1" as const;

export function fingerprint(action: string, day: string, sessions: WeekSession[]): string {
  return `${action}|${day}|${sessions.map((session) => `${session.id}:${session.day}:${session.status}`).join(",")}`;
}

export function morningState(input: {
  athleteId: string;
  localDate: string;
  history: ReadinessSubmission[];
  today: ReadinessSubmission;
}) {
  return interpretReadiness({
    athleteId: input.athleteId,
    localDate: input.localDate,
    submissions: [...input.history, input.today],
  });
}

export function decideToday(input: {
  record: TrackAthleteRecord;
  state: ReturnType<typeof interpretReadiness>;
  today: WeekSession["day"];
  unavailableDays?: WeekSession["day"][];
  raceDaysOut?: number | null;
}) {
  if (input.record.product !== "active") {
    return {
      offer: false,
      reason: `Training automation is paused because the product is ${input.record.product}.`,
      proposal: null,
    };
  }
  const proposal = resolveRemainingWeek({
    state: input.state,
    sessions: input.record.sessions,
    today: input.today,
    unavailableDays: input.unavailableDays,
    raceDaysOut: input.raceDaysOut,
    product: "track",
  });
  const key = fingerprint(proposal.action, input.state.localDate, input.record.sessions);
  const alreadyDeclined = input.record.adaptations.some(
    (row) => row.decision === "declined" && row.fingerprint === key
  );
  return {
    offer: proposal.status === "proposed" && proposal.trackClass === "ATHLETE_CHOICE" && !alreadyDeclined,
    reason: alreadyDeclined ? "This recommendation was already declined." : proposal.athleteExplanation,
    proposal,
  };
}

export function actualWorkload(input: {
  planned: { label: string; value: number; unit: string }[];
  feedback: Pick<SessionFeedback, "completion" | "actuals">;
}): { label: string; value: number | null; unit: string; source: "actual" | "calculated" | "withheld" }[] {
  if (input.feedback.completion === "skipped" || input.feedback.completion === "modified") {
    return Object.entries(input.feedback.actuals).map(([label, value]) => ({
      label,
      value,
      unit: "",
      source: "actual" as const,
    }));
  }
  if (input.feedback.completion === "partial") {
    const explicit = Object.keys(input.feedback.actuals);
    if (explicit.length === 0) {
      return input.planned.map((item) => ({ label: item.label, unit: item.unit, value: null, source: "withheld" as const }));
    }
    return explicit.map((label) => ({
      label,
      value: input.feedback.actuals[label] ?? 0,
      unit: input.planned.find((item) => item.label === label)?.unit ?? "",
      source: "actual" as const,
    }));
  }
  return input.planned.map((item) => {
    if (input.feedback.actuals[item.label] != null) {
      return { ...item, value: input.feedback.actuals[item.label]!, source: "actual" as const };
    }
    return { ...item, source: "calculated" as const };
  });
}

export function missedKeyPolicy(missesThisWeek: number): "defer_once" | "review" {
  return missesThisWeek >= 2 ? "review" : "defer_once";
}

export type NextWeekDecision = {
  decision: "PROGRESS" | "KEEP" | "REPEAT" | "REDUCE" | "DELOAD" | "COACH_REQUIRED";
  changes: Array<{ label: string; from: string; to: string }>;
  explanation: string;
};

export function weeklyCheckInTone(checkIn: WeeklyCheckIn | null): "good" | "strained" | "missing" {
  if (!checkIn) return "missing";
  if (checkIn.persistentSoreness || checkIn.lifeStress >= 8 || checkIn.manageable <= 4 || checkIn.recovery <= 4) {
    return "strained";
  }
  return "good";
}

export function notificationsFor(events: string[]): string[] {
  const allowed = new Set([
    "morning_check_in",
    "meaningful_recommendation",
    "schedule_change_accepted",
    "reassessment_due",
    "next_week_ready",
  ]);
  return events.filter((event) => allowed.has(event));
}

export function sessionInstructions(session: CalendarSession): string[] {
  return session.instructions;
}
