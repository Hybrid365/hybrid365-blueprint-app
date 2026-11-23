import type { AssessmentRequirement, TrackIntake } from "@/app/lib/track-foundation/types";

export const CORE_JOURNEY_STEPS = [
  "welcome",
  "goal",
  "event",
  "availability",
  "background",
  "equipment",
  "pain",
  "evidence",
  "decisions",
  "summary",
] as const;

const KEY_RESULT_IDS = ["running", "ski", "row", "strength", "stations"] as const;

const KEY_LABELS: Record<(typeof KEY_RESULT_IDS)[number], string> = {
  running: "5K",
  ski: "SkiErg",
  row: "RowErg",
  strength: "Lower-body strength",
  stations: "Station assessment",
};

export type JourneyMorning = {
  sleep: number;
  energy: number;
  recovery: number;
  soreness: number;
  readiness: number;
  pain: boolean;
};

export type SetupItem = {
  id: string;
  label: string;
  complete: boolean;
};

/**
 * Enough to enter Track. Programming evidence is a separate, later state.
 */
export function accessReady(intake: TrackIntake): boolean {
  if (!intake.goal) return false;
  if (intake.event.hasEvent && (!intake.event.eventName || !intake.event.eventDate)) return false;
  const daysKnown = intake.availability.availableDays.length > 0 || (intake.availability.daysPerWeek ?? 0) > 0;
  if (!daysKnown || !intake.availability.sessionLength) return false;
  if (!intake.equipmentConfirmed || intake.equipment.length === 0) return false;
  if (!intake.pain.severity) return false;
  if (!intake.background.trainingAge && intake.background.runDaysPerWeek == null) return false;
  return true;
}

function openRequirement(status: AssessmentRequirement["status"]): boolean {
  return status === "test_required" || status === "reassessment_due" || status === "manual_review";
}

export function performanceSetup(requirements: AssessmentRequirement[]): {
  complete: number;
  total: number;
  items: SetupItem[];
  nextTestId: string | null;
  nextLabel: string | null;
} {
  const items = KEY_RESULT_IDS.flatMap((id) => {
    const requirement = requirements.find((item) => item.id === id);
    if (!requirement || requirement.status === "skipped_not_needed" || requirement.status === "equipment_blocked") return [];
    return [{ id, label: KEY_LABELS[id], complete: requirement.status === "satisfied" }];
  });
  const next = KEY_RESULT_IDS.flatMap((id) => {
    const requirement = requirements.find((item) => item.id === id);
    if (!requirement || !openRequirement(requirement.status) || requirement.status === "manual_review" || !requirement.testId) return [];
    return [{ testId: requirement.testId, label: KEY_LABELS[id] }];
  })[0];
  return {
    complete: items.filter((item) => item.complete).length,
    total: items.length,
    items,
    nextTestId: next?.testId ?? null,
    nextLabel: next?.label ?? null,
  };
}
