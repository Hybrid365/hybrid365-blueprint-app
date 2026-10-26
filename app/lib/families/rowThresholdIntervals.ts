/**
 * Row threshold / quality intervals — mirror of Ski family with row anchors.
 */

import {
  buildStandardFamilyTransitions,
  ROW_SPLIT_RULE,
} from "@/app/lib/families/familyGraphHelpers";
import type {
  SessionFamily,
  SessionFamilyStage,
  StructuredWorkout,
} from "@/app/lib/hyroxSessionFamilyTypes";

export const ROW_THRESHOLD_FAMILY_ID = "row_threshold_intervals";

function rowRepeats(reps: number, workSec: number, recoverySec: number): StructuredWorkout {
  return {
    warmup: ["6–8 min easy row", "2 openers"],
    blocks: [
      {
        type: "repeat",
        reps,
        work: { kind: "time", value: workSec, unit: "sec" },
        recoveries: [{ durationSeconds: recoverySec, type: "easy_move" }],
      },
    ],
    cooldown: ["5–8 min easy row"],
    guidance: [
      "Even splits — do not spike rep 1.",
      "Split is a target from 2k anchor; back off if form collapses.",
    ],
  };
}

function rowSlot() {
  return [{ slot: "row" as const, rule: ROW_SPLIT_RULE }];
}

const STAGE_1: SessionFamilyStage = {
  id: "row_threshold_stage_1",
  key: "stage_1",
  label: "5 × 3 min row · 90 sec easy",
  intents: ["VOLUME"],
  structuredWorkout: rowRepeats(5, 180, 90),
  qualityVolume: { reps: 5, totalWorkSeconds: 15 * 60 },
  prescriptionSlots: rowSlot(),
  athleteFacingNotes: "Controlled row intervals.",
  mapsFromLibraryEntryIds: ["row-5x3", "hxspec-row-engine"],
};

const STAGE_2: SessionFamilyStage = {
  id: "row_threshold_stage_2",
  key: "stage_2",
  label: "6 × 3 min row · 90 sec easy",
  intents: ["VOLUME"],
  structuredWorkout: rowRepeats(6, 180, 90),
  qualityVolume: { reps: 6, totalWorkSeconds: 18 * 60 },
  prescriptionSlots: rowSlot(),
  athleteFacingNotes: "One extra row interval.",
};

const STAGE_3: SessionFamilyStage = {
  id: "row_threshold_stage_3",
  key: "stage_3",
  label: "6 × 3 min row · 60 sec easy",
  intents: ["DENSITY"],
  structuredWorkout: rowRepeats(6, 180, 60),
  qualityVolume: { reps: 6, totalWorkSeconds: 18 * 60 },
  prescriptionSlots: rowSlot(),
  athleteFacingNotes: "Same work — shorter recovery.",
};

const STAGE_4: SessionFamilyStage = {
  id: "row_threshold_stage_4",
  key: "stage_4",
  label: "5 × 4 min row · 75 sec easy",
  intents: ["VOLUME", "SPECIFICITY"],
  structuredWorkout: rowRepeats(5, 240, 75),
  qualityVolume: { reps: 5, totalWorkSeconds: 20 * 60 },
  prescriptionSlots: rowSlot(),
  athleteFacingNotes: "Slightly longer row reps.",
};

const CONSOLIDATION: SessionFamilyStage = {
  id: "row_threshold_consolidation",
  key: "consolidation",
  label: "Consolidation · 6 × 3 min · 60 sec",
  intents: ["CONSOLIDATION"],
  structuredWorkout: rowRepeats(6, 180, 60),
  qualityVolume: { reps: 6, totalWorkSeconds: 18 * 60 },
  prescriptionSlots: rowSlot(),
  athleteFacingNotes: "Hold row quality dose.",
};

const DELOAD: SessionFamilyStage = {
  id: "row_threshold_deload",
  key: "deload_a",
  label: "Deload · 4 × 3 min row · 90 sec",
  intents: ["DELOAD"],
  structuredWorkout: rowRepeats(4, 180, 90),
  qualityVolume: { reps: 4, totalWorkSeconds: 12 * 60 },
  prescriptionSlots: rowSlot(),
  athleteFacingNotes: "Shorter row quality.",
};

export const ROW_THRESHOLD_STAGE_IDS = {
  s1: STAGE_1.id,
  s2: STAGE_2.id,
  s3: STAGE_3.id,
  s4: STAGE_4.id,
  consol: CONSOLIDATION.id,
  deload: DELOAD.id,
} as const;

export const ROW_THRESHOLD_INTERVALS_FAMILY: SessionFamily = {
  id: ROW_THRESHOLD_FAMILY_ID,
  name: "Row — Threshold Intervals",
  modality: "row",
  objective: "Row threshold durability and split control",
  tags: ["row", "erg", "threshold", "intervals"],
  description: "Row interval ladder: volume then density then longer reps.",
  definitionVersion: 1,
  eligibility: {
    suitableLevels: ["intermediate", "advanced", "pro"],
    requiresAnchors: ["row_2k_split"],
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
  athleteFacingBlurb: "Controlled row intervals — even splits.",
  sourceLibraryIds: ["row-5x3", "hxspec-row-engine", "row_engine"],
};
