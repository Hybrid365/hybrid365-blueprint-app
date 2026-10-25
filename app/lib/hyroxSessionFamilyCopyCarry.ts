/**
 * Future Copy Week / Auto-Carry semantics for family-linked sessions (slice 2).
 * Pure helpers — NOT wired into live copyProgrammeWeek / autoCarry yet.
 */

import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import type { CoachDraftSession } from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  refreshFamilyLinkedDraftPreview,
} from "@/app/lib/hyroxSessionFamilyDraft";
import type { SessionFamilyDraftAttachment } from "@/app/lib/hyroxSessionFamilyDraftTypes";
import type { SessionFamily } from "@/app/lib/hyroxSessionFamilyTypes";

/**
 * Prepare a family attachment when copying into a future DRAFT week.
 *
 * PRESERVE: familyId, stageId, definitionVersion, structuredWorkout, prescriptionSlots
 * DROP: live prescriptionPreview and any frozen publish numbers (re-resolve later)
 * NEVER: auto-progress stage (Stage 2 → Stage 2)
 */
export function prepareSessionFamilyAttachmentForDraftCopy(
  attachment: SessionFamilyDraftAttachment
): SessionFamilyDraftAttachment {
  return {
    familyId: attachment.familyId,
    stageId: attachment.stageId,
    familyDefinitionVersion: attachment.familyDefinitionVersion,
    familyName: attachment.familyName,
    stageKey: attachment.stageKey,
    stageLabel: attachment.stageLabel,
    structuredWorkout: structuredClone(attachment.structuredWorkout),
    prescriptionSlots: structuredClone(attachment.prescriptionSlots),
    prescriptionPreview: null,
  };
}

/**
 * Clone a family-linked draft session for Copy Week / Auto-Carry domain behaviour.
 * Does not advance stage. Strips old preview; optionally re-resolves against current profile.
 */
export function copyFamilyLinkedDraftSession(args: {
  source: CoachDraftSession;
  newDraftId: string;
  family?: SessionFamily | null;
  profile?: HyroxAthletePerformanceProfile | null;
  resolvedAt?: string;
}): CoachDraftSession {
  const { source } = args;
  const cloned: CoachDraftSession = {
    ...structuredClone(source),
    draftId: args.newDraftId,
  };

  if (!source.sessionFamily) {
    return cloned;
  }

  cloned.sessionFamily = prepareSessionFamilyAttachmentForDraftCopy(source.sessionFamily);

  // Clear display pace that came from an old resolution — will refresh if profile provided
  if (cloned.editConfig) {
    cloned.editConfig = {
      ...cloned.editConfig,
      targetPace: undefined,
      targetPaceLoad: undefined,
    };
  }

  if (args.family && args.profile && args.resolvedAt) {
    return refreshFamilyLinkedDraftPreview(
      cloned,
      args.family,
      args.profile,
      args.resolvedAt
    );
  }

  return cloned;
}

/** Auto-Carry uses the same semantics as Copy: preserve stage, never auto-progress. */
export function autoCarryFamilyLinkedDraftSession(args: {
  source: CoachDraftSession;
  newDraftId: string;
  family?: SessionFamily | null;
  profile?: HyroxAthletePerformanceProfile | null;
  resolvedAt?: string;
}): CoachDraftSession {
  return copyFamilyLinkedDraftSession(args);
}

export function assertSameStageNotProgressed(
  source: CoachDraftSession,
  copied: CoachDraftSession
): void {
  if (!source.sessionFamily && !copied.sessionFamily) return;
  if (source.sessionFamily?.stageId !== copied.sessionFamily?.stageId) {
    throw new Error(
      `Copy/Auto-Carry must not progress stage (${source.sessionFamily?.stageId} → ${copied.sessionFamily?.stageId})`
    );
  }
  if (source.sessionFamily?.familyId !== copied.sessionFamily?.familyId) {
    throw new Error("Copy/Auto-Carry must preserve familyId");
  }
}
