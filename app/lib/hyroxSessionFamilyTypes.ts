/**
 * Session family / structured workout domain types (progressive programming slice 1).
 * Code-first. No DB tables. Not wired to programme builder yet.
 *
 * Reuses PrescriptionRule from hyroxPrescriptionTypes — do not fork a second rule shape.
 */

import type { PrescriptionBasis, PrescriptionRule } from "@/app/lib/hyroxPrescriptionTypes";

// ---------------------------------------------------------------------------
// Modality / objective / dimensions
// ---------------------------------------------------------------------------

export const SESSION_FAMILY_MODALITIES = [
  "run",
  "ski",
  "row",
  "bike",
  "strength",
  "hyrox",
  "mixed",
  "recovery",
] as const;

export type SessionFamilyModality = (typeof SESSION_FAMILY_MODALITIES)[number];

/** Canonical progression dimensions — never collapse to a single difficulty int. */
export const PROGRESSION_DIMENSIONS = [
  "VOLUME",
  "DENSITY",
  "INTENSITY",
  "SPECIFICITY",
  "COMPLEXITY",
  "RECOVERY_QUALITY",
  "CONSOLIDATION",
  "DELOAD",
] as const;

export type ProgressionDimension = (typeof PROGRESSION_DIMENSIONS)[number];

export const SESSION_FAMILY_TRANSITION_ACTIONS = [
  "PROGRESS",
  "REPEAT",
  "REDUCE",
  "DELOAD",
  "SKIP_TO",
] as const;

export type SessionFamilyTransitionAction = (typeof SESSION_FAMILY_TRANSITION_ACTIONS)[number];

export const SESSION_FAMILY_TRANSITION_WHENS = [
  "coach_default_block",
  "feedback_suggest",
  "manual_only",
] as const;

export type SessionFamilyTransitionWhen = (typeof SESSION_FAMILY_TRANSITION_WHENS)[number];

/** Decided canonical recovery types (architecture product constraint #4). */
export const RECOVERY_TYPES = ["walk", "jog", "easy_move", "passive"] as const;

export type RecoveryType = (typeof RECOVERY_TYPES)[number];

/**
 * Prescription slot ids for multi-target sessions.
 * Pilot uses `run` only. Architecture draft used `primary_run`; slice 1 canonicalizes to `run`.
 */
export const PRESCRIPTION_SLOT_IDS = [
  "run",
  "ski",
  "row",
  "bike",
  "strength",
  "other",
] as const;

export type PrescriptionSlotId = (typeof PRESCRIPTION_SLOT_IDS)[number];

// ---------------------------------------------------------------------------
// Structured workout AST (minimal, extensible)
// ---------------------------------------------------------------------------

export type WorkSpec =
  | { kind: "time"; value: number; unit: "sec" }
  | { kind: "distance"; value: number; unit: "m" | "km" };

/**
 * Duration is separate from type. Compound recovery = ordered array
 * (e.g. 60s walk + 60s jog) — never collapsed to prose as SoT.
 */
export type RecoverySpec = {
  durationSeconds: number;
  type: RecoveryType;
  note?: string;
};

/** Minimal station stub for future HYROX blocks — unused by threshold pilot. */
export type StationSpec = {
  name: string;
  note?: string;
};

/** Minimal strength stub — loads stay coach-selected in progression v1. */
export type StrengthExerciseSpec = {
  name: string;
  sets?: number;
  reps?: number;
  loadNote?: string;
  rpe?: string;
};

export type IntervalBlock =
  | {
      type: "repeat";
      reps: number;
      work: WorkSpec;
      /** One or more recoveries between reps (compound supported). */
      recoveries: RecoverySpec[];
    }
  | {
      type: "continuous";
      work: WorkSpec;
    }
  | {
      type: "station_round";
      rounds: number;
      run?: WorkSpec;
      station: StationSpec;
      recoveries?: RecoverySpec[];
    }
  | {
      type: "strength";
      exercises: StrengthExerciseSpec[];
    };

/**
 * Canonical structured workout for family stages.
 * Warmup / cooldown / guidance remain short prose lines (display OK; not progression SoT).
 * Blocks are structured — prefer typed fields over parsing free text.
 */
export type StructuredWorkout = {
  warmup: string[];
  blocks: IntervalBlock[];
  cooldown: string[];
  guidance: string[];
};

// ---------------------------------------------------------------------------
// Prescription slots (reuse PrescriptionRule)
// ---------------------------------------------------------------------------

export type SessionFamilyPrescriptionSlot = {
  slot: PrescriptionSlotId;
  rule: PrescriptionRule;
};

// ---------------------------------------------------------------------------
// Stages / transitions / family
// ---------------------------------------------------------------------------

export type SessionFamilyStage = {
  /** Stable id — NEVER a calendar week number. */
  id: string;
  /** Human/coach key e.g. stage_1 | consolidation | deload_a */
  key: string;
  label: string;
  /** Primary dimension(s) this stage emphasizes vs the previous default step. */
  intents: ProgressionDimension[];
  structuredWorkout: StructuredWorkout;
  qualityVolume?: {
    thresholdMinutes?: number;
    reps?: number;
    totalWorkSeconds?: number;
  };
  prescriptionSlots: SessionFamilyPrescriptionSlot[];
  athleteFacingNotes?: string;
  internalCoachNotes?: string;
  prerequisites?: string[];
  /** Soft legacy library entry ids that inspired this stage (read-only map). */
  mapsFromLibraryEntryIds?: string[];
};

export type SessionFamilyTransition = {
  fromStageId: string;
  action: SessionFamilyTransitionAction;
  toStageId: string;
  when?: SessionFamilyTransitionWhen;
};

export type SessionFamilyEligibility = {
  suitableLevels?: string[];
  avoidIf?: string[];
  requiresAnchors?: PrescriptionBasis[];
};

export type SessionFamily = {
  id: string;
  name: string;
  modality: SessionFamilyModality;
  objective: string;
  tags: string[];
  description: string;
  /**
   * Monotonic code definition version. Bump when stage structure/rules change.
   * Drafts/publishes store this value; published structured snapshots remain SoT for history.
   */
  definitionVersion: number;
  eligibility: SessionFamilyEligibility;
  /** Single default entry stage. */
  defaultEntryStageId: string;
  consolidationStageId?: string;
  deloadStageId?: string;
  stages: SessionFamilyStage[];
  transitions: SessionFamilyTransition[];
  athleteFacingBlurb?: string;
  internalCoachNotes?: string;
  /** Legacy library ids conceptually related — not mutated. */
  sourceLibraryIds?: string[];
};

// ---------------------------------------------------------------------------
// Resolution (pure) — see hyroxSessionFamilyResolve.ts
// ---------------------------------------------------------------------------

export type SessionFamilyCoachSlotOverride = {
  slot: PrescriptionSlotId;
  value: number;
  unit: string;
};

export type SessionFamilySlotResolution = {
  slot: PrescriptionSlotId;
  rule: PrescriptionRule;
  /** Snapshot fields from resolveHyroxPrescription */
  expression: string;
  resolvedValue: number | null;
  resolvedUnit: string | null;
  missingAnchor: boolean;
  source: "formula" | "coach_override";
  anchorValue: number | null;
  publishable: boolean;
  publishBlockReason: string | null;
};

export type SessionFamilyStageResolution = {
  familyId: string;
  familyName: string;
  stageId: string;
  stageKey: string;
  stageLabel: string;
  intents: ProgressionDimension[];
  structuredWorkout: StructuredWorkout;
  qualityVolume: SessionFamilyStage["qualityVolume"];
  slots: SessionFamilySlotResolution[];
  /** True when every slot is publishable (formula resolved or coach override). */
  publishable: boolean;
  missingAnchors: PrescriptionBasis[];
  humanSummary: string;
  resolvedAt: string;
  provenance: {
    engine: "hyroxPrescriptionEngine";
    familyDefinition: "code";
    stageIndependentOfCalendarWeek: true;
  };
};
