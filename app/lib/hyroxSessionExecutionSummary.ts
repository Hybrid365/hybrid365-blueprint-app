/**
 * Build canonical SessionExecutionSummary from programme session status + feedback.
 * Never invents RPE / execution / pain.
 */

import { parseHyroxAthleteSessionFeedback } from "@/app/lib/hyroxAthleteSessionFeedback";
import type { HyroxJson } from "@/app/lib/hyroxDatabaseTypes";
import {
  isSessionCompletion,
  isSessionControl,
  isSessionEnergyLevel,
  isSessionExecutionTarget,
  isSessionLegsLevel,
  isSessionMissedReason,
  isSessionPainLevel,
  parseRpeInteger,
  type SessionCompletion,
  type SessionExecutionChips,
  type SessionExecutionSummary,
} from "@/app/lib/hyroxSessionExecutionTypes";

function parseChips(raw: unknown): SessionExecutionChips | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (!isSessionCompletion(o.completion)) return null;
  const chips: SessionExecutionChips = { completion: o.completion };
  if (isSessionExecutionTarget(o.execution)) chips.execution = o.execution;
  const rpe = parseRpeInteger(o.rpe);
  if (rpe != null) chips.rpe = rpe;
  if (isSessionControl(o.control)) chips.control = o.control;
  if (isSessionPainLevel(o.pain)) chips.pain = o.pain;
  if (isSessionEnergyLevel(o.energy)) chips.energy = o.energy;
  if (isSessionLegsLevel(o.legs)) chips.legs = o.legs;
  if (typeof o.athleteNote === "string") chips.athleteNote = o.athleteNote;
  if (isSessionMissedReason(o.missedReason)) chips.missedReason = o.missedReason;
  if (o.actuals && typeof o.actuals === "object" && !Array.isArray(o.actuals)) {
    chips.actuals = o.actuals as Record<string, string | number | null>;
  }
  return chips;
}

function completionFromStatus(status: string | null | undefined): SessionCompletion | null {
  if (status === "completed") return "complete";
  if (status === "missed") return "missed";
  if (status === "modified") return "partial";
  return null;
}

/**
 * Prefer structured chips; fall back to legacy status + RPE without inventing execution/control/pain.
 */
export function buildSessionExecutionSummary(input: {
  status: string | null | undefined;
  athleteFeedback: HyroxJson | null | undefined;
}): SessionExecutionSummary | null {
  const feedback = parseHyroxAthleteSessionFeedback(input.athleteFeedback);
  const raw =
    input.athleteFeedback &&
    typeof input.athleteFeedback === "object" &&
    !Array.isArray(input.athleteFeedback)
      ? (input.athleteFeedback as Record<string, unknown>)
      : {};
  const chips = parseChips(raw.execution);

  if (chips) {
    const missed = chips.completion === "missed";
    return {
      completion: chips.completion,
      execution: missed ? null : chips.execution ?? null,
      rpe: missed ? null : chips.rpe ?? parseRpeInteger(feedback.rpe) ?? null,
      control: missed ? null : chips.control ?? null,
      pain: missed ? null : chips.pain ?? null,
      energy: missed ? null : chips.energy ?? null,
      legs: missed ? null : chips.legs ?? null,
      athleteNote: chips.athleteNote ?? feedback.notes ?? null,
      missedReason: missed ? chips.missedReason ?? null : null,
      actuals: missed ? null : chips.actuals ?? null,
      source: "structured",
    };
  }

  const completion = completionFromStatus(input.status);
  if (!completion) return null;

  const missed = completion === "missed";
  return {
    completion,
    execution: null,
    rpe: missed ? null : parseRpeInteger(feedback.rpe),
    control: null,
    pain: null,
    energy: null,
    legs: null,
    athleteNote: feedback.notes ?? null,
    missedReason: null,
    actuals: null,
    source: "legacy_inferred",
  };
}

/** Map product completion → DB status until a partial migration exists. */
export function programmeStatusForCompletion(completion: SessionCompletion): "completed" | "missed" | "modified" {
  if (completion === "complete") return "completed";
  if (completion === "missed") return "missed";
  return "modified";
}
