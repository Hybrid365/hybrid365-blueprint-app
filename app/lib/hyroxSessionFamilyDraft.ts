/**
 * Create / refresh family-linked coach drafts (slice 2). Pure domain — no live builder UI.
 */

import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import type { CoachDraftSession, CoachSessionEditConfig } from "@/app/lib/hyroxCoachProgrammeDraft";
import { applyEditConfigToSession } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { PrescriptionCoachOverride } from "@/app/lib/hyroxPrescriptionTypes";
import { structuredWorkoutToCoachEditConfig } from "@/app/lib/hyroxSessionFamilyBuilderAdapter";
import type {
  SessionFamilyDraftAttachment,
  SessionFamilyDraftPrescriptionPreview,
  SessionFamilyDraftSlotPreview,
} from "@/app/lib/hyroxSessionFamilyDraftTypes";
import { resolveSessionFamilyStage } from "@/app/lib/hyroxSessionFamilyResolve";
import type {
  PrescriptionSlotId,
  SessionFamily,
  SessionFamilyStage,
} from "@/app/lib/hyroxSessionFamilyTypes";
import { applySessionFamilyLinkDecision, shouldRetainSessionFamilyLink } from "@/app/lib/hyroxSessionFamilyUnlink";

function formatPaceLabel(secondsPerKm: number | null | undefined): string | null {
  if (secondsPerKm == null || !Number.isFinite(secondsPerKm)) return null;
  const whole = Math.round(secondsPerKm);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${String(secs).padStart(2, "0")}/km`;
}

function cloneWorkout(stage: SessionFamilyStage) {
  return structuredClone(stage.structuredWorkout);
}

function cloneSlots(stage: SessionFamilyStage) {
  return structuredClone(stage.prescriptionSlots);
}

export function buildSessionFamilyDraftAttachment(args: {
  family: SessionFamily;
  stage: SessionFamilyStage;
  prescriptionPreview?: SessionFamilyDraftPrescriptionPreview | null;
}): SessionFamilyDraftAttachment {
  return {
    familyId: args.family.id,
    stageId: args.stage.id,
    familyDefinitionVersion: args.family.definitionVersion,
    familyName: args.family.name,
    stageKey: args.stage.key,
    stageLabel: args.stage.label,
    structuredWorkout: cloneWorkout(args.stage),
    prescriptionSlots: cloneSlots(args.stage),
    prescriptionPreview: args.prescriptionPreview ?? null,
  };
}

export function refreshSessionFamilyPrescriptionPreview(args: {
  attachment: SessionFamilyDraftAttachment;
  family: SessionFamily;
  profile: HyroxAthletePerformanceProfile;
  resolvedAt: string;
  overrides?: Array<{ slot: PrescriptionSlotId; value: number; unit: string }>;
}): SessionFamilyDraftPrescriptionPreview {
  const resolution = resolveSessionFamilyStage({
    family: args.family,
    stageId: args.attachment.stageId,
    profile: args.profile,
    resolvedAt: args.resolvedAt,
    overrides: args.overrides,
  });

  const slots: SessionFamilyDraftSlotPreview[] = resolution.slots.map((slot) => ({
    ...slot,
    anchorLabel:
      slot.anchorValue != null && slot.resolvedUnit === "s/km"
        ? formatPaceLabel(slot.anchorValue)
        : slot.anchorValue != null
          ? `${slot.anchorValue} ${slot.resolvedUnit ?? ""}`.trim()
          : null,
  }));

  return { slots, resolvedAt: args.resolvedAt };
}

export type CreateFamilyDraftSessionInput = {
  family: SessionFamily;
  stageId: string;
  profile: HyroxAthletePerformanceProfile;
  resolvedAt: string;
  draftId: string;
  /** Base sandbox fields required by CoachDraftSession */
  base: Omit<CoachDraftSession, "draftId" | "coachNote" | "editConfig" | "sessionFamily" | "title"> & {
    title?: string;
  };
  overrides?: Array<{ slot: PrescriptionSlotId; value: number; unit: string }>;
};

/**
 * Build a family-linked CoachDraftSession with editConfig + live prescription preview.
 */
export function createCoachDraftSessionFromFamilyStage(
  input: CreateFamilyDraftSessionInput
): CoachDraftSession {
  const stage = input.family.stages.find((s) => s.id === input.stageId);
  if (!stage) {
    throw new Error(`Stage ${input.stageId} not found in family ${input.family.id}`);
  }

  const adapted = structuredWorkoutToCoachEditConfig(stage.structuredWorkout, {
    sessionName: input.base.title ?? stage.label,
    kind: "threshold_run",
    objective: input.family.objective,
    coachNote: stage.internalCoachNotes,
    rpeTarget: "7–8",
    thresholdMinutes: stage.qualityVolume?.thresholdMinutes,
  });

  const runSlot = stage.prescriptionSlots.find((s) => s.slot === "run");
  let editConfig: CoachSessionEditConfig = { ...adapted.editConfig };

  const attachmentBase = buildSessionFamilyDraftAttachment({ family: input.family, stage });
  const preview = refreshSessionFamilyPrescriptionPreview({
    attachment: attachmentBase,
    family: input.family,
    profile: input.profile,
    resolvedAt: input.resolvedAt,
    overrides: input.overrides,
  });

  const runPreview = preview.slots.find((s) => s.slot === "run");
  if (runPreview?.resolvedValue != null && runPreview.resolvedUnit === "s/km") {
    const pace = formatPaceLabel(runPreview.resolvedValue);
    if (pace) {
      editConfig = {
        ...editConfig,
        targetPace: pace,
        targetPaceLoad: pace,
      };
    }
  }

  const attachment: SessionFamilyDraftAttachment = {
    ...attachmentBase,
    prescriptionPreview: preview,
  };

  const draft: CoachDraftSession = {
    ...input.base,
    title: input.base.title ?? stage.label,
    draftId: input.draftId,
    coachNote: stage.internalCoachNotes ?? "",
    editConfig,
    sessionFamily: attachment,
    prescription: {
      objective: input.family.objective,
      warmup: stage.structuredWorkout.warmup,
      mainSet: adapted.editConfig.mainSetLines ?? [],
      cooldown: stage.structuredWorkout.cooldown,
      targetPace: editConfig.targetPace ?? null,
      targetRPE: editConfig.rpeTarget ?? null,
      coachNote: stage.internalCoachNotes ?? null,
    },
  };

  // Silence unused — runSlot documents multi-slot readiness
  void runSlot;

  return applyEditConfigToSession(draft);
}

/**
 * Re-resolve live preview on an existing family-linked draft (e.g. after benchmark change).
 * Does not mutate published history. Does not change familyId/stageId.
 */
export function refreshFamilyLinkedDraftPreview(
  session: CoachDraftSession,
  family: SessionFamily,
  profile: HyroxAthletePerformanceProfile,
  resolvedAt: string,
  overrides?: Array<{ slot: PrescriptionSlotId; value: number; unit: string }>
): CoachDraftSession {
  if (!session.sessionFamily) return session;
  const preview = refreshSessionFamilyPrescriptionPreview({
    attachment: session.sessionFamily,
    family,
    profile,
    resolvedAt,
    overrides,
  });
  const runPreview = preview.slots.find((s) => s.slot === "run");
  let editConfig = { ...session.editConfig };
  if (runPreview?.resolvedValue != null && runPreview.resolvedUnit === "s/km") {
    const pace = formatPaceLabel(runPreview.resolvedValue);
    if (pace && runPreview.source === "formula") {
      editConfig = { ...editConfig, targetPace: pace, targetPaceLoad: pace };
    }
  }
  return applyEditConfigToSession({
    ...session,
    editConfig,
    sessionFamily: { ...session.sessionFamily, prescriptionPreview: preview },
  });
}

/**
 * After coach saves editConfig: retain or clear family link using structural rules.
 */
export function applyEditConfigWithFamilyLink(
  session: CoachDraftSession,
  nextEditConfig: CoachSessionEditConfig
): CoachDraftSession {
  const updated = applyEditConfigToSession({ ...session, editConfig: nextEditConfig });
  if (!session.sessionFamily) return updated;
  const decision = shouldRetainSessionFamilyLink({
    attachment: session.sessionFamily,
    nextEditConfig,
  });
  return applySessionFamilyLinkDecision(updated, decision);
}

export function overridesFromDraftPreview(
  attachment: SessionFamilyDraftAttachment
): Array<{ slot: PrescriptionSlotId; value: number; unit: string }> {
  const out: Array<{ slot: PrescriptionSlotId; value: number; unit: string }> = [];
  for (const slot of attachment.prescriptionPreview?.slots ?? []) {
    if (slot.source === "coach_override" && slot.resolvedValue != null && slot.resolvedUnit) {
      out.push({ slot: slot.slot, value: slot.resolvedValue, unit: slot.resolvedUnit });
    }
  }
  return out;
}

export type { PrescriptionCoachOverride };
