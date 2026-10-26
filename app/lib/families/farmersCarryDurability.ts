/**
 * Farmers carry / grip durability. Load coach-authoritative.
 */

import { buildStandardFamilyTransitions } from "@/app/lib/families/familyGraphHelpers";
import type { SessionFamily, SessionFamilyStage, StructuredWorkout } from "@/app/lib/hyroxSessionFamilyTypes";

export const FARMERS_CARRY_DURABILITY_FAMILY_ID = "farmers_carry_durability";

function carryRounds(rounds: number, distanceM: number, recoverySec: number): StructuredWorkout {
  return {
    warmup: ["5 min easy", "Grip / shoulder prep", "1 light carry feeler"],
    blocks: [
      {
        type: "station_round",
        rounds,
        station: {
          name: `${distanceM}m farmers carry`,
          note: "Load coach-prescribed — do not auto-increase",
        },
        recoveries: [{ durationSeconds: recoverySec, type: "easy_move" }],
      },
    ],
    cooldown: ["Easy walk", "Forearm stretch"],
    guidance: ["Tall posture. Soft knees. Set down deliberately.", "Load stays coach-set."],
  };
}

const STAGE_1: SessionFamilyStage = {
  id: "farmers_carry_stage_1",
  key: "stage_1",
  label: "5 × 30m farmers · 60 sec",
  intents: ["VOLUME"],
  structuredWorkout: carryRounds(5, 30, 60),
  prescriptionSlots: [],
  mapsFromLibraryEntryIds: ["hxspec-farmers", "vol-farmers-l1"],
  athleteFacingNotes: "Farmers carry capacity.",
};

const STAGE_2: SessionFamilyStage = {
  id: "farmers_carry_stage_2",
  key: "stage_2",
  label: "6 × 40m farmers · 60 sec",
  intents: ["VOLUME"],
  structuredWorkout: carryRounds(6, 40, 60),
  prescriptionSlots: [],
  athleteFacingNotes: "More farmers volume.",
};

const STAGE_3: SessionFamilyStage = {
  id: "farmers_carry_stage_3",
  key: "stage_3",
  label: "6 × 50m farmers · 45 sec",
  intents: ["VOLUME", "DENSITY"],
  structuredWorkout: carryRounds(6, 50, 45),
  prescriptionSlots: [],
  athleteFacingNotes: "Longer carries, less rest.",
};

const STAGE_4: SessionFamilyStage = {
  id: "farmers_carry_stage_4",
  key: "stage_4",
  label: "8 × 40m farmers · 40 sec",
  intents: ["DENSITY"],
  structuredWorkout: carryRounds(8, 40, 40),
  prescriptionSlots: [],
  athleteFacingNotes: "Dense farmers durability.",
};

const CONSOLIDATION: SessionFamilyStage = {
  id: "farmers_carry_consolidation",
  key: "consolidation",
  label: "Hold · 6 × 50m · 45 sec",
  intents: ["CONSOLIDATION"],
  structuredWorkout: carryRounds(6, 50, 45),
  prescriptionSlots: [],
  athleteFacingNotes: "Same farmers dose.",
};

const DELOAD: SessionFamilyStage = {
  id: "farmers_carry_deload",
  key: "deload_a",
  label: "Deload · 4 × 30m · 60 sec",
  intents: ["DELOAD"],
  structuredWorkout: carryRounds(4, 30, 60),
  prescriptionSlots: [],
  athleteFacingNotes: "Lighter farmers volume.",
};

export const FARMERS_CARRY_DURABILITY_STAGE_IDS = {
  s1: STAGE_1.id,
  s2: STAGE_2.id,
  s3: STAGE_3.id,
  s4: STAGE_4.id,
  consol: CONSOLIDATION.id,
  deload: DELOAD.id,
} as const;

export const FARMERS_CARRY_DURABILITY_FAMILY: SessionFamily = {
  id: FARMERS_CARRY_DURABILITY_FAMILY_ID,
  name: "Farmers Carry — Durability",
  modality: "hyrox",
  objective: "Grip and carry durability with coach-controlled load",
  tags: ["farmers", "carry", "grip", "hyrox"],
  description: "Progress distance/rounds/density. Load remains coach-prescribed.",
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
  athleteFacingBlurb: "Farmers carries — tall and durable.",
  sourceLibraryIds: ["hxspec-farmers", "vol-farmers-l1"],
};
