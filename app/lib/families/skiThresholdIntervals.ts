/**
 * Ski threshold / quality intervals.
 * Progress: reps → work duration hold with denser recovery.
 * Prescription: ski_2k_split + offset. Missing anchor stays missing.
 */

import {
  buildStandardFamilyTransitions,
  SKI_SPLIT_RULE,
} from "@/app/lib/families/familyGraphHelpers";
import type {
  SessionFamily,
  SessionFamilyStage,
  StructuredWorkout,
} from "@/app/lib/hyroxSessionFamilyTypes";

export const SKI_THRESHOLD_FAMILY_ID = "ski_threshold_intervals";

function skiRepeats(reps: number, workSec: number, recoverySec: number): StructuredWorkout {
  return {
    warmup: ["6–8 min easy ski", "2 openers"],
    blocks: [
      {
        type: "repeat",
        reps,
        work: { kind: "time", value: workSec, unit: "sec" },
        recoveries: [{ durationSeconds: recoverySec, type: "easy_move" }],
      },
    ],
    cooldown: ["5–8 min easy ski"],
    guidance: [
      "Even splits — do not spike rep 1.",
      "Split is a target from 2k anchor; back off if form collapses.",
    ],
  };
}

function skiSlot() {
  return [{ slot: "ski" as const, rule: SKI_SPLIT_RULE }];
}

const STAGE_1: SessionFamilyStage = {
  id: "ski_threshold_stage_1",
  key: "stage_1",
  label: "5 × 3 min ski · 90 sec easy",
  intents: ["VOLUME"],
  structuredWorkout: skiRepeats(5, 180, 90),
  qualityVolume: { reps: 5, totalWorkSeconds: 15 * 60 },
  prescriptionSlots: skiSlot(),
  athleteFacingNotes: "Controlled ski intervals.",
  internalCoachNotes: "Entry ski quality.",
  mapsFromLibraryEntryIds: ["ski-5x3", "hxspec-ski-engine"],
};

const STAGE_2: SessionFamilyStage = {
  id: "ski_threshold_stage_2",
  key: "stage_2",
  label: "6 × 3 min ski · 90 sec easy",
  intents: ["VOLUME"],
  structuredWorkout: skiRepeats(6, 180, 90),
  qualityVolume: { reps: 6, totalWorkSeconds: 18 * 60 },
  prescriptionSlots: skiSlot(),
  athleteFacingNotes: "One extra ski interval.",
  internalCoachNotes: "+1 rep only.",
};

const STAGE_3: SessionFamilyStage = {
  id: "ski_threshold_stage_3",
  key: "stage_3",
  label: "6 × 3 min ski · 60 sec easy",
  intents: ["DENSITY"],
  structuredWorkout: skiRepeats(6, 180, 60),
  qualityVolume: { reps: 6, totalWorkSeconds: 18 * 60 },
  prescriptionSlots: skiSlot(),
  athleteFacingNotes: "Same work — shorter recovery.",
  internalCoachNotes: "Density only.",
};

const STAGE_4: SessionFamilyStage = {
  id: "ski_threshold_stage_4",
  key: "stage_4",
  label: "5 × 4 min ski · 75 sec easy",
  intents: ["VOLUME", "SPECIFICITY"],
  structuredWorkout: skiRepeats(5, 240, 75),
  qualityVolume: { reps: 5, totalWorkSeconds: 20 * 60 },
  prescriptionSlots: skiSlot(),
  athleteFacingNotes: "Slightly longer ski reps.",
  internalCoachNotes: "Work duration up; modest total work increase.",
};

const CONSOLIDATION: SessionFamilyStage = {
  id: "ski_threshold_consolidation",
  key: "consolidation",
  label: "Consolidation · 6 × 3 min · 60 sec",
  intents: ["CONSOLIDATION"],
  structuredWorkout: skiRepeats(6, 180, 60),
  qualityVolume: { reps: 6, totalWorkSeconds: 18 * 60 },
  prescriptionSlots: skiSlot(),
  athleteFacingNotes: "Hold ski quality dose.",
  internalCoachNotes: "Hold Stage 3.",
};

const DELOAD: SessionFamilyStage = {
  id: "ski_threshold_deload",
  key: "deload_a",
  label: "Deload · 4 × 3 min ski · 90 sec",
  intents: ["DELOAD"],
  structuredWorkout: skiRepeats(4, 180, 90),
  qualityVolume: { reps: 4, totalWorkSeconds: 12 * 60 },
  prescriptionSlots: skiSlot(),
  athleteFacingNotes: "Shorter ski quality.",
  internalCoachNotes: "Volume deload.",
};

export const SKI_THRESHOLD_STAGE_IDS = {
  s1: STAGE_1.id,
  s2: STAGE_2.id,
  s3: STAGE_3.id,
  s4: STAGE_4.id,
  consol: CONSOLIDATION.id,
  deload: DELOAD.id,
} as const;

export const SKI_THRESHOLD_INTERVALS_FAMILY: SessionFamily = {
  id: SKI_THRESHOLD_FAMILY_ID,
  name: "Ski — Threshold Intervals",
  modality: "ski",
  objective: "Ski threshold durability and split control",
  tags: ["ski", "erg", "threshold", "intervals"],
  description: "Ski interval ladder: volume then density then longer reps.",
  definitionVersion: 1,
  eligibility: {
    suitableLevels: ["intermediate", "advanced", "pro"],
    requiresAnchors: ["ski_2k_split"],
  },
  defaultEntryStageId: STAGE_1.id,
  consolidationStageId: CONSOLIDATION.id,
  deloadStageId: DELOAD.id,
  stages: [STAGE_1, STAGE_2, STAGE_3, STAGE_4, CONSOLIDATION, DELOAD],
  transitions: buildStandardFamilyTransitions({
    workingIds: [STAGE_1.id, STAGE_2.id, STAGE_3.id, STAGE_4.id],
    consolidationId: CONSOLIDATION.id,
    deloadId: DELOAD.id,
  }),
  athleteFacingBlurb: "Controlled ski intervals — even splits.",
  sourceLibraryIds: ["ski-5x3", "hxspec-ski-engine", "ski_engine"],
};
