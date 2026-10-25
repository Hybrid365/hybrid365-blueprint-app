/**
 * Pure SessionFamily stage resolution — no publish, no athlete mutation.
 */

import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import { resolveHyroxPrescription } from "@/app/lib/hyroxPrescriptionEngine";
import type { PrescriptionBasis } from "@/app/lib/hyroxPrescriptionTypes";
import {
  formatRecoveriesWithSuffix,
  formatRepeatBlock,
  formatStructuredWorkoutSummary,
} from "@/app/lib/hyroxSessionFamilyFormat";
import type {
  SessionFamily,
  SessionFamilyCoachSlotOverride,
  SessionFamilySlotResolution,
  SessionFamilyStage,
  SessionFamilyStageResolution,
} from "@/app/lib/hyroxSessionFamilyTypes";
import { SessionFamilyValidationError } from "@/app/lib/hyroxSessionFamilyValidate";

export type ResolveSessionFamilyStageInput = {
  family: SessionFamily;
  stageId: string;
  profile: HyroxAthletePerformanceProfile;
  resolvedAt: string;
  overrides?: SessionFamilyCoachSlotOverride[];
};

function cloneStructuredWorkout(stage: SessionFamilyStage): SessionFamilyStage["structuredWorkout"] {
  return structuredClone(stage.structuredWorkout);
}

function formatPaceSecondsPerKm(seconds: number | null): string | null {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  const whole = Math.round(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${String(secs).padStart(2, "0")}/km`;
}

function buildHumanSummary(
  stage: SessionFamilyStage,
  slots: SessionFamilySlotResolution[]
): string {
  const structure = formatStructuredWorkoutSummary(stage.structuredWorkout);
  const run = slots.find((s) => s.slot === "run");
  if (!run) return structure;
  if (run.missingAnchor && run.source === "formula") {
    return `${structure} · ${run.expression} (missing anchor — not publishable)`;
  }
  if (run.resolvedValue != null && run.resolvedUnit === "s/km") {
    const pace = formatPaceSecondsPerKm(run.resolvedValue);
    const via = run.source === "coach_override" ? "coach override" : run.expression;
    return `${structure} · target ${pace} (${via})`;
  }
  if (run.resolvedValue != null) {
    return `${structure} · ${run.expression} → ${run.resolvedValue} ${run.resolvedUnit ?? ""}`.trim();
  }
  return `${structure} · ${run.expression}`;
}

/**
 * Resolve a family stage against an athlete Performance Profile.
 * Deterministic. Does not mutate family or profile.
 */
export function resolveSessionFamilyStage(
  input: ResolveSessionFamilyStageInput
): SessionFamilyStageResolution {
  const { family, stageId, profile, resolvedAt, overrides } = input;
  if (!family?.stages?.length) {
    throw new SessionFamilyValidationError(["family has no stages"]);
  }
  const stage = family.stages.find((s) => s.id === stageId);
  if (!stage) {
    throw new SessionFamilyValidationError([
      `stage ${stageId} not found in family ${family.id}`,
    ]);
  }
  if (typeof resolvedAt !== "string" || resolvedAt.length === 0) {
    throw new SessionFamilyValidationError(["resolvedAt is required"]);
  }

  const overrideBySlot = new Map(
    (overrides ?? []).map((o) => [o.slot, { value: o.value, unit: o.unit }] as const)
  );

  const slots: SessionFamilySlotResolution[] = stage.prescriptionSlots.map((slotDef) => {
    const override = overrideBySlot.get(slotDef.slot);
    const snapshot = resolveHyroxPrescription({
      rule: slotDef.rule,
      profile,
      override,
      resolvedAt,
    });

    const publishable =
      snapshot.source === "coach_override"
        ? snapshot.resolvedValue != null
        : !snapshot.missingAnchor && snapshot.resolvedValue != null;

    let publishBlockReason: string | null = null;
    if (!publishable) {
      publishBlockReason = snapshot.missingAnchor
        ? `Missing active ${snapshot.anchorType} anchor; do not estimate. Provide coach override or activate profile anchor.`
        : "Prescription unresolved.";
    }

    return {
      slot: slotDef.slot,
      rule: slotDef.rule,
      expression: snapshot.expression,
      resolvedValue: snapshot.resolvedValue,
      resolvedUnit: snapshot.resolvedUnit,
      missingAnchor: snapshot.missingAnchor,
      source: snapshot.source,
      anchorValue: snapshot.anchorValue,
      publishable,
      publishBlockReason,
    };
  });

  const missingAnchors = [
    ...new Set(
      slots
        .filter((s) => s.missingAnchor)
        .map((s) => s.rule.basis as PrescriptionBasis)
    ),
  ];

  return {
    familyId: family.id,
    familyName: family.name,
    stageId: stage.id,
    stageKey: stage.key,
    stageLabel: stage.label,
    intents: [...stage.intents],
    structuredWorkout: cloneStructuredWorkout(stage),
    qualityVolume: stage.qualityVolume ? { ...stage.qualityVolume } : undefined,
    slots,
    publishable: slots.every((s) => s.publishable),
    missingAnchors,
    humanSummary: buildHumanSummary(stage, slots),
    resolvedAt,
    provenance: {
      engine: "hyroxPrescriptionEngine",
      familyDefinition: "code",
      stageIndependentOfCalendarWeek: true,
    },
  };
}

/** Convenience: main-set display lines for a stage (no athlete). */
export function describeSessionFamilyStageStructure(stage: SessionFamilyStage): {
  mainSet: string[];
  recoveryLine: string | null;
} {
  const mainSet = stage.structuredWorkout.blocks.map((block) => {
    if (block.type === "repeat") {
      return `${formatRepeatBlock(block)}; ${formatRecoveriesWithSuffix(block.recoveries)}`;
    }
    return formatStructuredWorkoutSummary({
      warmup: [],
      blocks: [block],
      cooldown: [],
      guidance: [],
    });
  });
  const firstRepeat = stage.structuredWorkout.blocks.find((b) => b.type === "repeat");
  const recoveryLine =
    firstRepeat && firstRepeat.type === "repeat"
      ? formatRecoveriesWithSuffix(firstRepeat.recoveries)
      : null;
  return { mainSet, recoveryLine };
}
