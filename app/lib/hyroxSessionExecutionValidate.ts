/**
 * Validate structured execution chips for allow-listed athletes.
 * Outside the flag, zero-feedback completion remains allowed.
 */

import type { FeedbackProfile } from "@/app/lib/hyroxSessionExecutionFeedbackConfig";
import type { SessionExecutionFeedbackChips } from "@/app/lib/hyrox-team/modules/sessionLogging/types";
import {
  isSessionCompletion,
  isSessionControl,
  isSessionExecutionTarget,
  isSessionMissedReason,
  isSessionPainLevel,
  parseRpeInteger,
} from "@/app/lib/hyroxSessionExecutionTypes";

export type ExecutionValidationResult =
  | { ok: true }
  | { ok: false; error: string; missing: string[] };

function hasActual(chips: SessionExecutionFeedbackChips, key: string): boolean {
  const v = chips.actuals?.[key];
  if (v == null) return false;
  return String(v).trim().length > 0;
}

/**
 * Minimum useful feedback for complete/partial when chips feature is enabled.
 */
export function validateExecutionChipsForSubmit(args: {
  chips: SessionExecutionFeedbackChips | null | undefined;
  profile: FeedbackProfile;
}): ExecutionValidationResult {
  const chips = args.chips;
  if (!chips || !isSessionCompletion(chips.completion)) {
    return {
      ok: false,
      error: "Choose Complete, Partial, or Missed.",
      missing: ["completion"],
    };
  }

  if (chips.completion === "missed") {
    if (!isSessionMissedReason(chips.missedReason)) {
      return {
        ok: false,
        error: "Choose why the session was missed.",
        missing: ["missedReason"],
      };
    }
    return { ok: true };
  }

  const missing: string[] = [];
  for (const field of args.profile.required) {
    switch (field) {
      case "rpe":
        if (parseRpeInteger(chips.rpe) == null) missing.push("RPE");
        break;
      case "pain":
        if (!isSessionPainLevel(chips.pain)) missing.push("pain");
        break;
      case "execution":
        if (!isSessionExecutionTarget(chips.execution)) missing.push("targets");
        break;
      case "control":
        if (!isSessionControl(chips.control)) missing.push("control");
        break;
      case "primaryResult":
        if (!hasActual(chips, "primaryResult") && !hasActual(chips, "result")) {
          missing.push("test result");
        }
        break;
      default:
        break;
    }
  }

  if (missing.length) {
    return {
      ok: false,
      error: `Add ${missing.join(", ")} before saving.`,
      missing,
    };
  }
  return { ok: true };
}

/** True when complete/partial has at least RPE + pain (minimum meaningful feedback). */
export function hasMeaningfulCompletePartialFeedback(
  chips: SessionExecutionFeedbackChips | null | undefined
): boolean {
  if (!chips) return false;
  if (chips.completion !== "complete" && chips.completion !== "partial") return false;
  return parseRpeInteger(chips.rpe) != null && isSessionPainLevel(chips.pain);
}
