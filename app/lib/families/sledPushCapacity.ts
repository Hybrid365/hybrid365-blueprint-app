/**
 * Sled push capacity — volume then density. Loads coach-prescribed (no auto escalation).
 */

import { buildStandardFamilyTransitions } from "@/app/lib/families/familyGraphHelpers";
import type { SessionFamily, SessionFamilyStage, StructuredWorkout } from "@/app/lib/hyroxSessionFamilyTypes";

export const SLED_PUSH_CAPACITY_FAMILY_ID = "sled_push_capacity";

function sledRounds(rounds: number, distanceM: number, recoverySec: number, note: string): StructuredWorkout {
  return {
    warmup: ["5 min easy", "2 light sled feelers"],
    blocks: [
      {
        type: "station_round",
        rounds,
        station: { name: `${distanceM}m sled push`, note },
        recoveries: [{ durationSeconds: recoverySec, type: "easy_move" }],
      },
    ],
    cooldown: ["Easy walk / mobility"],
    guidance: ["Load is coach-prescribed. Drive posture before speed.", "Do not auto-add plates."],
  };
}

const STAGE_1: SessionFamilyStage = {
  id: "sled_push_stage_1",
  key: "stage_1",
  label: "6 × 20m sled push · 90 sec",
  intents: ["VOLUME"],
  structuredWorkout: sledRounds(6, 20, 90, "Coach load — technique first"),
  prescriptionSlots: [],
  mapsFromLibraryEntryIds: ["hxspec-sled-capacity", "vol-sled-l1"],
  athleteFacingNotes: "Sled push repeats — strong posture.",
};

const STAGE_2: SessionFamilyStage = {
  id: "sled_push_stage_2",
  key: "stage_2",
  label: "8 × 20m sled push · 90 sec",
  intents: ["VOLUME"],
  structuredWorkout: sledRounds(8, 20, 90, "Same load as Stage 1 unless coach changes"),
  prescriptionSlots: [],
  athleteFacingNotes: "More sled push repeats.",
};

const STAGE_3: SessionFamilyStage = {
  id: "sled_push_stage_3",
  key: "stage_3",
  label: "8 × 25m sled push · 75 sec",
  intents: ["VOLUME", "DENSITY"],
  structuredWorkout: sledRounds(8, 25, 75, "Coach load — slight density increase"),
  prescriptionSlots: [],
  athleteFacingNotes: "Slightly longer pushes, less rest.",
};

const STAGE_4: SessionFamilyStage = {
  id: "sled_push_stage_4",
  key: "stage_4",
  label: "10 × 25m sled push · 60 sec",
  intents: ["DENSITY"],
  structuredWorkout: sledRounds(10, 25, 60, "Race-density feel — load still coach-set"),
  prescriptionSlots: [],
  athleteFacingNotes: "Dense sled push capacity.",
};

const CONSOLIDATION: SessionFamilyStage = {
  id: "sled_push_consolidation",
  key: "consolidation",
  label: "Hold · 8 × 25m · 75 sec",
  intents: ["CONSOLIDATION"],
  structuredWorkout: sledRounds(8, 25, 75, "Hold Stage 3"),
  prescriptionSlots: [],
  athleteFacingNotes: "Same sled dose — absorb.",
};

const DELOAD: SessionFamilyStage = {
  id: "sled_push_deload",
  key: "deload_a",
  label: "Deload · 5 × 20m · 90 sec",
  intents: ["DELOAD"],
  structuredWorkout: sledRounds(5, 20, 90, "Light technique volume"),
  prescriptionSlots: [],
  athleteFacingNotes: "Lighter sled session.",
};

export const SLED_PUSH_CAPACITY_STAGE_IDS = {
  s1: STAGE_1.id,
  s2: STAGE_2.id,
  s3: STAGE_3.id,
  s4: STAGE_4.id,
  consol: CONSOLIDATION.id,
  deload: DELOAD.id,
} as const;

export const SLED_PUSH_CAPACITY_FAMILY: SessionFamily = {
  id: SLED_PUSH_CAPACITY_FAMILY_ID,
  name: "Sled Push — Capacity",
  modality: "hyrox",
  objective: "Sled push volume and density with coach-controlled load",
  tags: ["sled", "sled_push", "hyrox", "capacity"],
  description: "Progress reps/distance/density. Never auto-escalate load.",
  definitionVersion: 1,
  eligibility: { suitableLevels: ["intermediate", "advanced", "pro"], requiresAnchors: [] },
  defaultEntryStageId: STAGE_1.id,
  consolidationStageId: CONSOLIDATION.id,
  deloadStageId: DELOAD.id,
  stages: [STAGE_1, STAGE_2, STAGE_3, STAGE_4, CONSOLIDATION, DELOAD],
  transitions: buildStandardFamilyTransitions({
    workingIds: [STAGE_1.id, STAGE_2.id, STAGE_3.id, STAGE_4.id],
    consolidationId: CONSOLIDATION.id,
    deloadId: DELOAD.id,
  }),
  athleteFacingBlurb: "Sled push capacity — strong and controlled.",
  sourceLibraryIds: ["hxspec-sled-capacity", "sled_capacity_builder"],
};
