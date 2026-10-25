/**
 * Draft / preview / publish snapshot types for SessionFamily (slice 2).
 * Additive to CoachDraftSession — legacy drafts omit sessionFamily.
 */

import type { PrescriptionRule, PrescriptionSnapshot } from "@/app/lib/hyroxPrescriptionTypes";
import type {
  PrescriptionSlotId,
  SessionFamilyPrescriptionSlot,
  SessionFamilySlotResolution,
  StructuredWorkout,
} from "@/app/lib/hyroxSessionFamilyTypes";

/** Live draft preview for one slot — re-resolvable before publish; not history. */
export type SessionFamilyDraftSlotPreview = SessionFamilySlotResolution & {
  /** Anchor pace/watts from profile at preview time (may be null). */
  anchorLabel?: string | null;
};

export type SessionFamilyDraftPrescriptionPreview = {
  slots: SessionFamilyDraftSlotPreview[];
  resolvedAt: string;
};

/**
 * Attached to CoachDraftSession.sessionFamily when generated from a family stage.
 * Stores generation provenance + canonical structure/rules.
 * Does not make the code family definition mutable through the draft.
 */
export type SessionFamilyDraftAttachment = {
  familyId: string;
  stageId: string;
  familyDefinitionVersion: number;
  familyName: string;
  stageKey: string;
  stageLabel: string;
  /** Snapshot of structured workout at generation / last family re-sync. */
  structuredWorkout: StructuredWorkout;
  /** Rules at generation — not athlete-resolved numbers. */
  prescriptionSlots: SessionFamilyPrescriptionSlot[];
  /** Live preview; may refresh when profile changes. Cleared on copy into new draft before re-resolve. */
  prescriptionPreview: SessionFamilyDraftPrescriptionPreview | null;
};

export type SessionFamilyPublishabilityStatus =
  | "PUBLISHABLE"
  | "BLOCKED"
  | "PUBLISHABLE_WITH_COACH_OVERRIDE";

export type SessionFamilyPublishability = {
  status: SessionFamilyPublishabilityStatus;
  reasons: string[];
  missingAnchors: string[];
};

/** Frozen at publish — immutable history even if family/benchmark later change. */
export type SessionFamilyPublishedSlot = {
  slot: PrescriptionSlotId;
  rule: PrescriptionRule;
  /** Full engine snapshot (source formula | coach_override). */
  snapshot: PrescriptionSnapshot;
  /**
   * Formula-only resolved value at publish time (even when coach overrode).
   * Null when anchor missing and formula could not resolve.
   */
  formulaResolvedValue: number | null;
  formulaResolvedUnit: string | null;
  /** Final athlete-facing target (override value if present, else formula). */
  finalResolvedValue: number | null;
  finalResolvedUnit: string | null;
};

export type SessionFamilyPublishSnapshot = {
  familyId: string;
  stageId: string;
  familyDefinitionVersion: number;
  familyName: string;
  stageKey: string;
  stageLabel: string;
  structuredWorkout: StructuredWorkout;
  slots: SessionFamilyPublishedSlot[];
  publishedAt: string;
  publishability: SessionFamilyPublishability;
};

/** Nested under published `prescription` jsonb when family-linked. */
export const SESSION_FAMILY_PUBLISH_JSON_KEY = "sessionFamily" as const;
