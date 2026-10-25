/**
 * SessionFamily publish snapshot + publishability (slice 2). Pure — no DB writes.
 */

import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import type { CoachDraftSession } from "@/app/lib/hyroxCoachProgrammeDraft";
import { resolveHyroxPrescription } from "@/app/lib/hyroxPrescriptionEngine";
import type { PrescriptionCoachOverride } from "@/app/lib/hyroxPrescriptionTypes";
import type {
  SessionFamilyDraftAttachment,
  SessionFamilyPublishSnapshot,
  SessionFamilyPublishability,
  SessionFamilyPublishedSlot,
} from "@/app/lib/hyroxSessionFamilyDraftTypes";
import { SESSION_FAMILY_PUBLISH_JSON_KEY as PUBLISH_KEY } from "@/app/lib/hyroxSessionFamilyDraftTypes";
import { getSessionFamily } from "@/app/lib/hyroxSessionFamilyRegistry";
import { collectSessionFamilyIssues } from "@/app/lib/hyroxSessionFamilyValidate";
import type { PrescriptionSlotId, SessionFamily } from "@/app/lib/hyroxSessionFamilyTypes";

export { PUBLISH_KEY as SESSION_FAMILY_PUBLISH_JSON_KEY };

export type SessionFamilySlotOverride = {
  slot: PrescriptionSlotId;
  value: number;
  unit: string;
};

function collectAttachmentIssues(attachment: SessionFamilyDraftAttachment): string[] {
  const issues: string[] = [];
  if (!attachment.familyId) issues.push("familyId missing");
  if (!attachment.stageId) issues.push("stageId missing");
  if (!attachment.structuredWorkout?.blocks?.length) {
    issues.push("structuredWorkout missing or empty");
  }
  if (!attachment.prescriptionSlots?.length) {
    issues.push("prescriptionSlots missing");
  }
  return issues;
}

/**
 * Pure publishability for a family-linked draft (or attachment + profile).
 */
export function getSessionFamilyPublishability(args: {
  attachment: SessionFamilyDraftAttachment | null | undefined;
  family?: SessionFamily | null;
  profile: HyroxAthletePerformanceProfile;
  overrides?: SessionFamilySlotOverride[];
  resolvedAt: string;
}): SessionFamilyPublishability {
  const reasons: string[] = [];
  const missingAnchors: string[] = [];

  if (!args.attachment) {
    return {
      status: "PUBLISHABLE",
      reasons: ["No sessionFamily attachment — legacy/custom session path."],
      missingAnchors: [],
    };
  }

  reasons.push(...collectAttachmentIssues(args.attachment));

  const family =
    args.family ?? getSessionFamily(args.attachment.familyId) ?? null;
  if (!family) {
    reasons.push(`Unknown familyId ${args.attachment.familyId} in registry`);
  } else {
    const familyIssues = collectSessionFamilyIssues(family);
    if (familyIssues.length) {
      reasons.push(...familyIssues.map((i) => `family invalid: ${i}`));
    }
    if (!family.stages.some((s) => s.id === args.attachment!.stageId)) {
      reasons.push(`stageId ${args.attachment.stageId} not in family`);
    }
  }

  const overrideBySlot = new Map(
    (args.overrides ?? []).map((o) => [o.slot, o] as const)
  );

  let anyOverride = false;
  let anyBlockedFormula = false;

  for (const slotDef of args.attachment.prescriptionSlots) {
    const override = overrideBySlot.get(slotDef.slot);
    if (override) {
      if (!Number.isFinite(override.value) || !override.unit) {
        reasons.push(`Invalid override for slot ${slotDef.slot}`);
        anyBlockedFormula = true;
        continue;
      }
      anyOverride = true;
    }

    const snapshot = resolveHyroxPrescription({
      rule: slotDef.rule,
      profile: args.profile,
      override: override
        ? { value: override.value, unit: override.unit }
        : undefined,
      resolvedAt: args.resolvedAt,
    });

    if (snapshot.missingAnchor) {
      missingAnchors.push(slotDef.rule.basis);
      if (!override) {
        reasons.push(
          `Missing active ${slotDef.rule.basis} anchor for slot ${slotDef.slot}; do not estimate.`
        );
        anyBlockedFormula = true;
      } else {
        reasons.push(
          `Slot ${slotDef.slot}: missing anchor but coach override present (${override.value} ${override.unit}).`
        );
      }
    } else if (snapshot.resolvedValue == null && !override) {
      reasons.push(`Slot ${slotDef.slot}: unresolved prescription`);
      anyBlockedFormula = true;
    }
  }

  const structuralBlocked = reasons.some(
    (r) =>
      r.includes("structuredWorkout") ||
      r.includes("prescriptionSlots") ||
      r.includes("familyId") ||
      r.includes("stageId") ||
      r.includes("Unknown family") ||
      r.includes("family invalid") ||
      r.includes("not in family") ||
      r.includes("Invalid override")
  );

  if (structuralBlocked || (anyBlockedFormula && !anyOverride)) {
    return { status: "BLOCKED", reasons, missingAnchors: [...new Set(missingAnchors)] };
  }
  if (anyBlockedFormula && anyOverride) {
    // override covers missing anchor but structural ok
  }
  if (missingAnchors.length && anyOverride && !structuralBlocked) {
    const stillBlocked = args.attachment.prescriptionSlots.some((slotDef) => {
      const override = overrideBySlot.get(slotDef.slot);
      const snap = resolveHyroxPrescription({
        rule: slotDef.rule,
        profile: args.profile,
        override: override
          ? { value: override.value, unit: override.unit }
          : undefined,
        resolvedAt: args.resolvedAt,
      });
      return snap.resolvedValue == null;
    });
    if (stillBlocked) {
      return { status: "BLOCKED", reasons, missingAnchors: [...new Set(missingAnchors)] };
    }
    return {
      status: "PUBLISHABLE_WITH_COACH_OVERRIDE",
      reasons,
      missingAnchors: [...new Set(missingAnchors)],
    };
  }

  if (anyOverride) {
    return {
      status: "PUBLISHABLE_WITH_COACH_OVERRIDE",
      reasons: reasons.length ? reasons : ["Coach override applied on one or more slots."],
      missingAnchors: [...new Set(missingAnchors)],
    };
  }

  return {
    status: "PUBLISHABLE",
    reasons: reasons.length ? reasons : ["All prescription slots resolved from active anchors."],
    missingAnchors: [],
  };
}

export function getSessionPublishability(args: {
  session: CoachDraftSession;
  family?: SessionFamily | null;
  profile: HyroxAthletePerformanceProfile;
  overrides?: SessionFamilySlotOverride[];
  resolvedAt: string;
}): SessionFamilyPublishability {
  return getSessionFamilyPublishability({
    attachment: args.session.sessionFamily,
    family: args.family,
    profile: args.profile,
    overrides: args.overrides,
    resolvedAt: args.resolvedAt,
  });
}

/**
 * Freeze family + prescriptions for publish. Does not write DB.
 * Always stores formula-only values alongside final (override) values for provenance.
 */
export function buildSessionFamilyPublishSnapshot(args: {
  attachment: SessionFamilyDraftAttachment;
  family?: SessionFamily | null;
  profile: HyroxAthletePerformanceProfile;
  overrides?: SessionFamilySlotOverride[];
  publishedAt: string;
}): SessionFamilyPublishSnapshot {
  const publishability = getSessionFamilyPublishability({
    attachment: args.attachment,
    family: args.family,
    profile: args.profile,
    overrides: args.overrides,
    resolvedAt: args.publishedAt,
  });

  if (publishability.status === "BLOCKED") {
    throw new Error(
      `Cannot build publish snapshot: ${publishability.reasons.join("; ")}`
    );
  }

  const overrideBySlot = new Map(
    (args.overrides ?? []).map((o) => [o.slot, o] as const)
  );

  const slots: SessionFamilyPublishedSlot[] = args.attachment.prescriptionSlots.map(
    (slotDef) => {
      const override = overrideBySlot.get(slotDef.slot);
      const formulaSnap = resolveHyroxPrescription({
        rule: slotDef.rule,
        profile: args.profile,
        resolvedAt: args.publishedAt,
      });
      const finalSnap = resolveHyroxPrescription({
        rule: slotDef.rule,
        profile: args.profile,
        override: override
          ? ({ value: override.value, unit: override.unit } satisfies PrescriptionCoachOverride)
          : undefined,
        resolvedAt: args.publishedAt,
      });

      return {
        slot: slotDef.slot,
        rule: slotDef.rule,
        snapshot: finalSnap,
        formulaResolvedValue: formulaSnap.resolvedValue,
        formulaResolvedUnit: formulaSnap.resolvedUnit,
        finalResolvedValue: finalSnap.resolvedValue,
        finalResolvedUnit: finalSnap.resolvedUnit,
      };
    }
  );

  return {
    familyId: args.attachment.familyId,
    stageId: args.attachment.stageId,
    familyDefinitionVersion: args.attachment.familyDefinitionVersion,
    familyName: args.attachment.familyName,
    stageKey: args.attachment.stageKey,
    stageLabel: args.attachment.stageLabel,
    structuredWorkout: structuredClone(args.attachment.structuredWorkout),
    slots,
    publishedAt: args.publishedAt,
    publishability,
  };
}

/**
 * Embed publish snapshot under prescription jsonb without dropping existing fields.
 * Additive — legacy readers ignore `sessionFamily`.
 */
export function embedSessionFamilyPublishInPrescription(
  prescription: Record<string, unknown> | null | undefined,
  snapshot: SessionFamilyPublishSnapshot
): Record<string, unknown> {
  return {
    ...(prescription ?? {}),
    [PUBLISH_KEY]: snapshot,
  };
}

export function readSessionFamilyPublishFromPrescription(
  prescription: unknown
): SessionFamilyPublishSnapshot | null {
  if (!prescription || typeof prescription !== "object" || Array.isArray(prescription)) {
    return null;
  }
  const raw = (prescription as Record<string, unknown>)[PUBLISH_KEY];
  if (!raw || typeof raw !== "object") return null;
  return raw as SessionFamilyPublishSnapshot;
}
