import type { DailyReadinessState } from "@/app/lib/daily-readiness/types";
import type { TrackFoundationState } from "@/app/lib/track-foundation/pipeline";
import type { TrackAthleteRecord } from "./store";

export type TrackAthleteState = {
  athleteId: string;
  product: TrackAthleteRecord["product"];
  readiness: string;
  programmingReadiness: string;
  anchors: { running: string | null; ski: string | null; row: string | null };
  availability: string[];
  equipment: string[];
  executions: number;
  rpe: Array<number | null>;
  weeklyCheckIn: TrackAthleteRecord["checkIns"][number] | null;
  pain: boolean;
  decisions: string[];
  missing: string[];
};

export function buildAthleteState(input: {
  record: TrackAthleteRecord;
  foundation: TrackFoundationState;
  readiness: DailyReadinessState | null;
}): TrackAthleteState {
  const missing: string[] = [];
  if (!input.readiness || input.readiness.freshness === "MISSING") missing.push("This morning");
  if (input.record.checkIns.length === 0) missing.push("Weekly check-in");
  if (!input.foundation.anchors.ski) missing.push("Ski anchor");
  if (!input.foundation.anchors.row) missing.push("Row anchor");
  return {
    athleteId: input.record.athleteId,
    product: input.record.product,
    readiness: input.readiness?.interpretation ?? "MISSING",
    programmingReadiness: input.foundation.profile.programmingReadiness,
    anchors: {
      running: input.foundation.anchors.running.threshold?.display ?? null,
      ski: input.foundation.anchors.ski?.display ?? null,
      row: input.foundation.anchors.row?.display ?? null,
    },
    availability: input.record.intake.availability.availableDays,
    equipment: input.record.intake.equipment,
    executions: input.record.feedback.length,
    rpe: input.record.feedback.map((row) => row.rpe),
    weeklyCheckIn: input.record.checkIns.at(-1) ?? null,
    pain: input.record.intake.pain.hasConcern || input.record.feedback.some((row) => row.pain) || Boolean(input.readiness?.answers?.pain),
    decisions: input.record.adaptations.map((row) => row.decision),
    missing,
  };
}
