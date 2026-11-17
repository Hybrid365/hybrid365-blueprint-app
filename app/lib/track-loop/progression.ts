import { getProgressionFamily, PROGRESSION_FAMILIES } from "@/app/lib/progressionFamilies";
import type { NextWeekDecision } from "./policy";
import { weeklyCheckInTone } from "./policy";
import type { TrackAthleteRecord } from "./store";

/**
 * Uses the published family graph. A missing edge is not invented.
 * One successful session does not progress.
 */
export function recommendNextWeek(record: TrackAthleteRecord): NextWeekDecision {
  const checkIn = record.checkIns[record.checkIns.length - 1] ?? null;
  const tone = weeklyCheckInTone(checkIn);
  const keyMisses = record.feedback.filter((row) => row.completion === "skipped" && row.sessionId.startsWith("key-")).length;
  if (record.product !== "active") {
    return {
      decision: "KEEP",
      changes: [],
      explanation: "The product is not active, so next week stays as last planned.",
    };
  }
  if (keyMisses >= 2) {
    record.escalations.push({
      id: `esc-${record.escalations.length + 1}`,
      kind: "REPEATED_FATIGUE",
      summary: "Two key sessions were missed. They were not rebooked again.",
      status: "open",
    });
    return {
      decision: "REDUCE",
      changes: [{ label: "Key sessions", from: "Rebook both", to: "Hold and shorten" }],
      explanation: "Two key sessions were missed. They are not both pushed forward. Next week is shorter and flagged for review.",
    };
  }
  if (tone === "strained" || checkIn?.persistentSoreness) {
    record.escalations.push({
      id: `esc-${record.escalations.length + 1}`,
      kind: checkIn?.persistentSoreness ? "PAIN_REVIEW" : "REPEATED_FATIGUE",
      summary: "Weekly check-in asked for a conservative week.",
      status: "open",
    });
    return {
      decision: "COACH_REQUIRED",
      changes: [],
      explanation: "The week felt strained. Next week is not progressed automatically.",
    };
  }

  const family = getProgressionFamily("threshold_volume_a");
  const current = family?.variants.find((variant) => variant.title === "5 x 5 min Threshold");
  const next = family?.variants.find((variant) => variant.block_week === (current?.block_week ?? 0) + 1);
  const strong = record.priorFamilyCompletions.filter(
    (row) => row.familyId === "threshold_volume_a" && row.completion === "completed" && row.rpe <= 8
  );
  if (!family || !current || !next) {
    return {
      decision: "COACH_REQUIRED",
      changes: [],
      explanation: "There is no published next stage for this session, so it stays as written.",
    };
  }
  if (strong.length < 2) {
    return {
      decision: "KEEP",
      changes: [{ label: "Threshold", from: current.title, to: current.title }, { label: "Sled", from: "Hold", to: "Hold" }],
      explanation: "Threshold stays where it is. One good session is not enough to add work. Sled volume stays unchanged.",
    };
  }
  if (tone !== "good") {
    return {
      decision: "REPEAT",
      changes: [{ label: "Threshold", from: current.title, to: current.title }],
      explanation: "Threshold repeats until the weekly check-in is in.",
    };
  }
  const fromMinutes = current.marker.threshold_total_minutes;
  const toMinutes = next.marker.threshold_total_minutes;
  return {
    decision: "PROGRESS",
    changes: [
      { label: "Threshold", from: fromMinutes != null ? `${fromMinutes} min` : current.title, to: toMinutes != null ? `${toMinutes} min` : next.title },
      { label: "Session", from: current.title, to: next.title },
      { label: "Sled", from: "Hold", to: "Hold" },
    ],
    explanation: "Threshold progressed after repeated successful sessions. Sled volume stays unchanged.",
  };
}

/** Next-week progression stays a proposal. This task does not write it. */
export function progressionWriteContract(decision: NextWeekDecision): {
  persisted: false;
  published: false;
  decision: NextWeekDecision["decision"];
} {
  return { persisted: false, published: false, decision: decision.decision };
}

const STATION_FAMILIES = ["sled_push", "sled_pull", "lunges", "bbj", "farmers", "wall_balls"] as const;

export function stationProgressionCoverage(): Array<{ station: string; graph: string | null; state: "PROGRESS_EDGE" | "HOLD" }> {
  const families = PROGRESSION_FAMILIES.map((family) => family.family_id);
  return STATION_FAMILIES.map((station) => {
    if (station === "wall_balls" && families.includes("wall_ball_durability_a")) {
      return { station, graph: "wall_ball_durability_a", state: "PROGRESS_EDGE" as const };
    }
    return { station, graph: null, state: "HOLD" as const };
  });
}
