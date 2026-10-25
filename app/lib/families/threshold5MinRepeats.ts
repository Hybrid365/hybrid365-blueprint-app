/**
 * Pilot SessionFamily: Threshold — 5 Minute Repeats
 *
 * Stage sequence is a sensible coaching default, not universal law.
 * Stage ≠ programme week. Deload/consolidation are explicit stages.
 *
 * Stage 4 reasoning:
 * After Stage 3 (same 30 min volume with walk→jog compound recovery), Stage 4
 * keeps 6 × 5 min (no volume jump) and moves to continuous 90 sec jog recovery.
 * That is a modest RECOVERY_QUALITY / DENSITY step — fully active recovery, slightly
 * denser than 60+60 — without stacking intensity or extra reps. Consolidation remains
 * a separate stage for intentional non-progress.
 */

import type { PrescriptionRule } from "@/app/lib/hyroxPrescriptionTypes";
import type {
  RecoverySpec,
  SessionFamily,
  SessionFamilyStage,
  SessionFamilyTransition,
  StructuredWorkout,
} from "@/app/lib/hyroxSessionFamilyTypes";

/** Shared rule for all stages — resolved per athlete via prescription engine. */
export const THRESHOLD_5MIN_PRESCRIPTION_RULE: PrescriptionRule = {
  basis: "threshold_pace",
  adjustment: { type: "seconds_per_km", value: 5 },
};

export const THRESHOLD_5MIN_FAMILY_ID = "threshold_5min_repeats";

const WARMUP = ["10–12 min easy", "2–3 strides / mobility"];
const COOLDOWN = ["8–10 min easy"];
const GUIDANCE = [
  "Pace is a target; HR/RPE controls the session.",
  "If HR drifts above threshold, slow slightly and keep the stimulus correct.",
];

function thresholdRepeatWorkout(reps: number, recoveries: RecoverySpec[]): StructuredWorkout {
  return {
    warmup: [...WARMUP],
    blocks: [
      {
        type: "repeat",
        reps,
        work: { kind: "time", value: 5 * 60, unit: "sec" },
        recoveries,
      },
    ],
    cooldown: [...COOLDOWN],
    guidance: [...GUIDANCE],
  };
}

function runSlot() {
  return [{ slot: "run" as const, rule: THRESHOLD_5MIN_PRESCRIPTION_RULE }];
}

const STAGE_1: SessionFamilyStage = {
  id: "threshold_5min_stage_1",
  key: "stage_1",
  label: "5 × 5 min · 2 min walk",
  intents: ["VOLUME"],
  structuredWorkout: thresholdRepeatWorkout(5, [
    { durationSeconds: 120, type: "walk" },
  ]),
  qualityVolume: { reps: 5, thresholdMinutes: 25, totalWorkSeconds: 25 * 60 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Establish even threshold reps with full walk recovery.",
  internalCoachNotes: "Entry stage — efficiency before density.",
  mapsFromLibraryEntryIds: ["th-5x5"],
};

const STAGE_2: SessionFamilyStage = {
  id: "threshold_5min_stage_2",
  key: "stage_2",
  label: "6 × 5 min · 2 min walk",
  intents: ["VOLUME"],
  structuredWorkout: thresholdRepeatWorkout(6, [
    { durationSeconds: 120, type: "walk" },
  ]),
  qualityVolume: { reps: 6, thresholdMinutes: 30, totalWorkSeconds: 30 * 60 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Add one rep; keep walk recovery and even pacing.",
  internalCoachNotes: "Primary progression from Stage 1 is VOLUME (+5 min quality).",
  mapsFromLibraryEntryIds: ["th-6x5"],
};

const STAGE_3: SessionFamilyStage = {
  id: "threshold_5min_stage_3",
  key: "stage_3",
  label: "6 × 5 min · 60 sec walk + 60 sec jog",
  intents: ["RECOVERY_QUALITY", "DENSITY"],
  structuredWorkout: thresholdRepeatWorkout(6, [
    { durationSeconds: 60, type: "walk" },
    { durationSeconds: 60, type: "jog" },
  ]),
  qualityVolume: { reps: 6, thresholdMinutes: 30, totalWorkSeconds: 30 * 60 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Same work volume; start recovering with light jog after the walk.",
  internalCoachNotes:
    "No volume increase — progression is recovery quality / density toward active recovery.",
};

const STAGE_4: SessionFamilyStage = {
  id: "threshold_5min_stage_4",
  key: "stage_4",
  label: "6 × 5 min · 90 sec jog",
  intents: ["RECOVERY_QUALITY", "DENSITY"],
  structuredWorkout: thresholdRepeatWorkout(6, [
    { durationSeconds: 90, type: "jog" },
  ]),
  qualityVolume: { reps: 6, thresholdMinutes: 30, totalWorkSeconds: 30 * 60 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Full jog recovery between reps — keep threshold controlled.",
  internalCoachNotes:
    "Modest step from Stage 3: continuous active recovery, slightly denser than 60+60. Not a volume or intensity jump.",
};

const CONSOLIDATION: SessionFamilyStage = {
  id: "threshold_5min_consolidation",
  key: "consolidation",
  label: "Consolidation · 6 × 5 min · 60 sec walk + 60 sec jog",
  intents: ["CONSOLIDATION"],
  structuredWorkout: thresholdRepeatWorkout(6, [
    { durationSeconds: 60, type: "walk" },
    { durationSeconds: 60, type: "jog" },
  ]),
  qualityVolume: { reps: 6, thresholdMinutes: 30, totalWorkSeconds: 30 * 60 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Same stimulus as Stage 3 — intentional hold, not a progression.",
  internalCoachNotes: "Use when the athlete should absorb Stage 3 without advancing.",
};

const DELOAD: SessionFamilyStage = {
  id: "threshold_5min_deload",
  key: "deload_a",
  label: "Deload · 4 × 5 min · 2 min walk",
  intents: ["DELOAD"],
  structuredWorkout: thresholdRepeatWorkout(4, [
    { durationSeconds: 120, type: "walk" },
  ]),
  qualityVolume: { reps: 4, thresholdMinutes: 20, totalWorkSeconds: 20 * 60 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Reduced threshold volume — keep rhythm and quality.",
  internalCoachNotes:
    "Explicit deload stage. Not tied to week 4 or any calendar index — coach selects when needed.",
};

function t(
  from: string,
  action: SessionFamilyTransition["action"],
  to: string,
  when?: SessionFamilyTransition["when"]
): SessionFamilyTransition {
  return { fromStageId: from, action, toStageId: to, when };
}

const IDS = {
  s1: STAGE_1.id,
  s2: STAGE_2.id,
  s3: STAGE_3.id,
  s4: STAGE_4.id,
  consol: CONSOLIDATION.id,
  deload: DELOAD.id,
} as const;

/**
 * Hybrid graph: default linear path via coach_default_block, plus REPEAT / REDUCE /
 * DELOAD / SKIP_TO for coach (and later Track) decisions. No auto decision-making here.
 */
const TRANSITIONS: SessionFamilyTransition[] = [
  // Default block path
  t(IDS.s1, "PROGRESS", IDS.s2, "coach_default_block"),
  t(IDS.s2, "PROGRESS", IDS.s3, "coach_default_block"),
  t(IDS.s3, "PROGRESS", IDS.s4, "coach_default_block"),

  // REPEAT (all working + special stages)
  t(IDS.s1, "REPEAT", IDS.s1, "manual_only"),
  t(IDS.s2, "REPEAT", IDS.s2, "manual_only"),
  t(IDS.s3, "REPEAT", IDS.s3, "manual_only"),
  t(IDS.s4, "REPEAT", IDS.s4, "manual_only"),
  t(IDS.consol, "REPEAT", IDS.consol, "manual_only"),
  t(IDS.deload, "REPEAT", IDS.deload, "manual_only"),

  // REDUCE
  t(IDS.s2, "REDUCE", IDS.s1, "feedback_suggest"),
  t(IDS.s3, "REDUCE", IDS.s2, "feedback_suggest"),
  t(IDS.s4, "REDUCE", IDS.s3, "feedback_suggest"),
  t(IDS.consol, "REDUCE", IDS.s2, "feedback_suggest"),
  t(IDS.deload, "REDUCE", IDS.s1, "manual_only"),

  // DELOAD from any working stage
  t(IDS.s1, "DELOAD", IDS.deload, "manual_only"),
  t(IDS.s2, "DELOAD", IDS.deload, "manual_only"),
  t(IDS.s3, "DELOAD", IDS.deload, "manual_only"),
  t(IDS.s4, "DELOAD", IDS.deload, "manual_only"),
  t(IDS.consol, "DELOAD", IDS.deload, "manual_only"),

  // Return from deload / consolidation
  t(IDS.deload, "PROGRESS", IDS.s2, "manual_only"),
  t(IDS.consol, "PROGRESS", IDS.s4, "manual_only"),

  // SKIP_TO examples (coach authority)
  t(IDS.s1, "SKIP_TO", IDS.s3, "manual_only"),
  t(IDS.s2, "SKIP_TO", IDS.s4, "manual_only"),
  t(IDS.s2, "SKIP_TO", IDS.consol, "manual_only"),
  t(IDS.s3, "SKIP_TO", IDS.consol, "manual_only"),
];

export const THRESHOLD_5MIN_REPEATS_FAMILY: SessionFamily = {
  id: THRESHOLD_5MIN_FAMILY_ID,
  name: "Threshold — 5 Minute Repeats",
  modality: "run",
  objective: "Threshold durability / sustainable threshold work",
  tags: ["threshold", "run", "intervals", "pilot"],
  description:
    "Progressive 5-minute threshold repeats. Volume first, then recovery quality/density. Consolidation and deload are explicit stages — never implied by calendar week.",
  eligibility: {
    suitableLevels: ["intermediate", "advanced", "pro"],
    avoidIf: ["beginner_without_threshold_anchor", "acute_injury"],
    requiresAnchors: ["threshold_pace"],
  },
  defaultEntryStageId: STAGE_1.id,
  consolidationStageId: CONSOLIDATION.id,
  deloadStageId: DELOAD.id,
  stages: [STAGE_1, STAGE_2, STAGE_3, STAGE_4, CONSOLIDATION, DELOAD],
  transitions: TRANSITIONS,
  athleteFacingBlurb: "Controlled threshold repeats — finish with one rep spare.",
  internalCoachNotes:
    "Pilot family for progressive programming slice 1. Do not auto-advance on completion in 1-1.",
  sourceLibraryIds: [
    "th-5x5",
    "th-6x5",
    "th-6x6",
    "hyrox_run_threshold_6x6",
    "coach_th-6x5",
  ],
};

export const THRESHOLD_5MIN_STAGE_IDS = IDS;
