/**
 * Sandbag / walking lunge durability. Load coach-prescribed.
 */

import { buildStandardFamilyTransitions } from "@/app/lib/families/familyGraphHelpers";
import type { SessionFamily, SessionFamilyStage, StructuredWorkout } from "@/app/lib/hyroxSessionFamilyTypes";

export const LUNGE_DURABILITY_FAMILY_ID = "lunge_durability";

function lungeRounds(rounds: number, distanceM: number, recoverySec: number): StructuredWorkout {
  return {
    warmup: ["5 min easy", "Hip / ankle prep", "10 bodyweight lunges"],
    blocks: [
      {
        type: "station_round",
        rounds,
        station: {
          name: `${distanceM}m walking lunges`,
          note: "Sandbag / DB load coach-prescribed",
        },
        recoveries: [{ durationSeconds: recoverySec, type: "easy_move" }],
      },
    ],
    cooldown: ["Easy walk", "Hip flexor stretch"],
    guidance: ["Upright torso. Shorten stride if knees protest.", "Load stays coach-set."],
  };
}

const STAGE_1: SessionFamilyStage = {
  id: "lunge_durability_stage_1",
  key: "stage_1",
  label: "5 × 20m lunges · 60 sec",
  intents: ["VOLUME"],
  structuredWorkout: lungeRounds(5, 20, 60),
  prescriptionSlots: [],
  mapsFromLibraryEntryIds: ["hxspec-lunge-durability", "vol-lunge-l1"],
  athleteFacingNotes: "Walking lunge capacity.",
};

const STAGE_2: SessionFamilyStage = {
  id: "lunge_durability_stage_2",
  key: "stage_2",
  label: "6 × 25m lunges · 60 sec",
  intents: ["VOLUME"],
  structuredWorkout: lungeRounds(6, 25, 60),
  prescriptionSlots: [],
  athleteFacingNotes: "More lunge volume.",
};

const STAGE_3: SessionFamilyStage = {
  id: "lunge_durability_stage_3",
  key: "stage_3",
  label: "6 × 40m lunges · 45 sec",
  intents: ["VOLUME", "DENSITY"],
  structuredWorkout: lungeRounds(6, 40, 45),
  prescriptionSlots: [],
  athleteFacingNotes: "Longer lunge sets.",
};

const STAGE_4: SessionFamilyStage = {
  id: "lunge_durability_stage_4",
  key: "stage_4",
  label: "8 × 30m lunges · 40 sec",
  intents: ["DENSITY"],
  structuredWorkout: lungeRounds(8, 30, 40),
  prescriptionSlots: [],
  athleteFacingNotes: "Dense lunge durability.",
};

const CONSOLIDATION: SessionFamilyStage = {
  id: "lunge_durability_consolidation",
  key: "consolidation",
  label: "Hold · 6 × 40m · 45 sec",
  intents: ["CONSOLIDATION"],
  structuredWorkout: lungeRounds(6, 40, 45),
  prescriptionSlots: [],
  athleteFacingNotes: "Same lunge dose.",
};

const DELOAD: SessionFamilyStage = {
  id: "lunge_durability_deload",
  key: "deload_a",
  label: "Deload · 4 × 20m · 60 sec",
  intents: ["DELOAD"],
  structuredWorkout: lungeRounds(4, 20, 60),
  prescriptionSlots: [],
  athleteFacingNotes: "Lighter lunge volume.",
};

export const LUNGE_DURABILITY_STAGE_IDS = {
  s1: STAGE_1.id,
  s2: STAGE_2.id,
  s3: STAGE_3.id,
  s4: STAGE_4.id,
  consol: CONSOLIDATION.id,
  deload: DELOAD.id,
} as const;

export const LUNGE_DURABILITY_FAMILY: SessionFamily = {
  id: LUNGE_DURABILITY_FAMILY_ID,
  name: "Lunges — Durability",
  modality: "hyrox",
  objective: "Walking lunge durability with coach-controlled load",
  tags: ["lunges", "hyrox", "durability"],
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
  athleteFacingBlurb: "Walking lunges — upright and durable.",
  sourceLibraryIds: ["hxspec-lunge-durability", "lunge_durability_builder"],
};
