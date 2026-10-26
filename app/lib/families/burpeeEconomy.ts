/**
 * Burpee broad jump economy — volume then density. No auto distance escalation beyond stages.
 */

import { buildStandardFamilyTransitions } from "@/app/lib/families/familyGraphHelpers";
import type { SessionFamily, SessionFamilyStage, StructuredWorkout } from "@/app/lib/hyroxSessionFamilyTypes";

export const BURPEE_ECONOMY_FAMILY_ID = "burpee_economy";

function bbjRounds(rounds: number, distanceM: number, recoverySec: number): StructuredWorkout {
  return {
    warmup: ["5 min easy", "Hip openers", "4 easy burpees"],
    blocks: [
      {
        type: "station_round",
        rounds,
        station: {
          name: `${distanceM}m burpee broad jumps`,
          note: "Smooth rhythm — not max jump every rep",
        },
        recoveries: [{ durationSeconds: recoverySec, type: "easy_move" }],
      },
    ],
    cooldown: ["Easy walk"],
    guidance: ["Economy over spectacle.", "Log how the last round felt."],
  };
}

const STAGE_1: SessionFamilyStage = {
  id: "burpee_economy_stage_1",
  key: "stage_1",
  label: "5 × 20m BBJ · 75 sec",
  intents: ["VOLUME"],
  structuredWorkout: bbjRounds(5, 20, 75),
  prescriptionSlots: [],
  mapsFromLibraryEntryIds: ["hxspec-bbj-economy", "vol-bbj-l1"],
  athleteFacingNotes: "Burpee broad jump repeats.",
};

const STAGE_2: SessionFamilyStage = {
  id: "burpee_economy_stage_2",
  key: "stage_2",
  label: "6 × 20m BBJ · 75 sec",
  intents: ["VOLUME"],
  structuredWorkout: bbjRounds(6, 20, 75),
  prescriptionSlots: [],
  athleteFacingNotes: "One more BBJ set.",
};

const STAGE_3: SessionFamilyStage = {
  id: "burpee_economy_stage_3",
  key: "stage_3",
  label: "6 × 30m BBJ · 60 sec",
  intents: ["VOLUME", "DENSITY"],
  structuredWorkout: bbjRounds(6, 30, 60),
  prescriptionSlots: [],
  athleteFacingNotes: "Longer BBJ sets, less rest.",
};

const STAGE_4: SessionFamilyStage = {
  id: "burpee_economy_stage_4",
  key: "stage_4",
  label: "8 × 25m BBJ · 45 sec",
  intents: ["DENSITY"],
  structuredWorkout: bbjRounds(8, 25, 45),
  prescriptionSlots: [],
  athleteFacingNotes: "Dense BBJ capacity.",
};

const CONSOLIDATION: SessionFamilyStage = {
  id: "burpee_economy_consolidation",
  key: "consolidation",
  label: "Hold · 6 × 30m · 60 sec",
  intents: ["CONSOLIDATION"],
  structuredWorkout: bbjRounds(6, 30, 60),
  prescriptionSlots: [],
  athleteFacingNotes: "Same BBJ dose.",
};

const DELOAD: SessionFamilyStage = {
  id: "burpee_economy_deload",
  key: "deload_a",
  label: "Deload · 4 × 20m · 75 sec",
  intents: ["DELOAD"],
  structuredWorkout: bbjRounds(4, 20, 75),
  prescriptionSlots: [],
  athleteFacingNotes: "Lighter BBJ volume.",
};

export const BURPEE_ECONOMY_STAGE_IDS = {
  s1: STAGE_1.id,
  s2: STAGE_2.id,
  s3: STAGE_3.id,
  s4: STAGE_4.id,
  consol: CONSOLIDATION.id,
  deload: DELOAD.id,
} as const;

export const BURPEE_ECONOMY_FAMILY: SessionFamily = {
  id: BURPEE_ECONOMY_FAMILY_ID,
  name: "Burpee Broad Jump — Economy",
  modality: "hyrox",
  objective: "BBJ economy under controlled density",
  tags: ["burpee", "bbj", "hyrox"],
  description: "Progress sets/distance/density for burpee broad jump economy.",
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
  athleteFacingBlurb: "Burpee broad jumps — smooth and economical.",
  sourceLibraryIds: ["hxspec-bbj-economy", "burpee_economy_builder"],
};
