/**
 * Deterministic SessionFamily link retain / unlink rules (slice 2).
 */

import type { CoachSessionEditConfig } from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  fingerprintsEqual,
  structuralFingerprintFromEditConfig,
  structuralFingerprintFromWorkout,
  type FamilyCoachSessionEditConfig,
} from "@/app/lib/hyroxSessionFamilyBuilderAdapter";
import type { SessionFamilyDraftAttachment } from "@/app/lib/hyroxSessionFamilyDraftTypes";

export type SessionFamilyLinkDecision = {
  retain: boolean;
  reason: string;
  /** Present when retain is false. */
  unlinkReason?:
    | "kind_changed"
    | "reps_changed"
    | "work_duration_changed"
    | "recovery_structure_changed"
    | "structured_recoveries_missing"
    | "cannot_fingerprint_edit"
    | "cannot_fingerprint_attachment";
};

const NON_STRUCTURAL_NOTE =
  "Non-structural fields (notes, wording, pace override, RPE/HR labels) do not affect the family link.";

/**
 * Retain familyId/stageId when structural threshold shape matches the attachment snapshot.
 *
 * STRUCTURAL (unlink):
 * - kind change
 * - reps change
 * - work duration (repDurationMinutes) change
 * - structured recovery list change (duration/type/compound)
 * - structuredRecoveries removed (cannot prove structure)
 *
 * NON-STRUCTURAL (retain):
 * - sessionName, objective, coachNote, coachPacingNote
 * - warmUpLines / coolDownLines / mainSetLines wording
 * - targetPace / targetPaceLoad / coach prescription override
 * - rpeTarget / hrGuide / whatToRecord
 */
export function shouldRetainSessionFamilyLink(args: {
  attachment: SessionFamilyDraftAttachment;
  nextEditConfig: CoachSessionEditConfig;
}): SessionFamilyLinkDecision {
  const { attachment, nextEditConfig } = args;
  const baseline = structuralFingerprintFromWorkout(attachment.structuredWorkout, "threshold_run");
  if (!baseline) {
    return {
      retain: false,
      reason: "Attachment structured workout has no repeat fingerprint.",
      unlinkReason: "cannot_fingerprint_attachment",
    };
  }

  const next = structuralFingerprintFromEditConfig(nextEditConfig as FamilyCoachSessionEditConfig);
  if (!next) {
    const hasStructured = Array.isArray(
      (nextEditConfig as FamilyCoachSessionEditConfig).structuredRecoveries
    );
    return {
      retain: false,
      reason: hasStructured
        ? "Edit config cannot be fingerprinted."
        : "structuredRecoveries missing after edit — family structure no longer provable.",
      unlinkReason: hasStructured ? "cannot_fingerprint_edit" : "structured_recoveries_missing",
    };
  }

  if (next.kind !== baseline.kind) {
    return {
      retain: false,
      reason: `Kind changed (${baseline.kind} → ${next.kind}).`,
      unlinkReason: "kind_changed",
    };
  }
  if (next.reps !== baseline.reps) {
    return {
      retain: false,
      reason: `Reps changed (${baseline.reps} → ${next.reps}).`,
      unlinkReason: "reps_changed",
    };
  }
  if (next.repDurationMinutes !== baseline.repDurationMinutes) {
    return {
      retain: false,
      reason: `Work duration changed (${baseline.repDurationMinutes} → ${next.repDurationMinutes} min).`,
      unlinkReason: "work_duration_changed",
    };
  }
  if (!fingerprintsEqual({ ...baseline, kind: next.kind }, next)) {
    return {
      retain: false,
      reason: "Recovery structure changed (duration and/or type).",
      unlinkReason: "recovery_structure_changed",
    };
  }

  return {
    retain: true,
    reason: `Structure matches family stage ${attachment.stageId}. ${NON_STRUCTURAL_NOTE}`,
  };
}

/** Apply unlink decision: clear sessionFamily when not retained. */
export function applySessionFamilyLinkDecision<T extends { sessionFamily?: SessionFamilyDraftAttachment | null }>(
  session: T,
  decision: SessionFamilyLinkDecision
): T {
  if (decision.retain) return session;
  return { ...session, sessionFamily: null };
}
