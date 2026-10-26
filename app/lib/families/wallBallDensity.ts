/**
 * Wall ball density — reps/rounds then denser recovery. Ball weight coach-set.
 */

import { buildStandardFamilyTransitions } from "@/app/lib/families/familyGraphHelpers";
import type { SessionFamily, SessionFamilyStage, StructuredWorkout } from "@/app/lib/hyroxSessionFamilyTypes";

export const WALL_BALL_DENSITY_FAMILY_ID = "wall_ball_density";

function wbRounds(rounds: number, reps: number, recoverySec: number): StructuredWorkout {
  return {
    warmup: ["5 min easy", "Light squat / shoulder prep", "10 easy wall balls"],
    blocks: [
      {
        type: "station_round",
        rounds,
        station: {
          name: `${reps} wall balls`,
          note: "Ball weight coach-prescribed — do not auto-increase",
        },
        recoveries: [{ durationSeconds: recoverySec, type: "easy_move" }],
      },
    ],
    cooldown: ["Easy mobility"],
    guidance: ["Break early if needed — unbroken is not the goal at entry.", "Log breaks and RPE."],
  };
}

const STAGE_1: SessionFamilyStage = {
  id: "wall_ball_stage_1",
  key: "stage_1",
  label: "5 × 20 wall balls · 60 sec",
  intents: ["VOLUME"],
  structuredWorkout: wbRounds(5, 20, 60),
  prescriptionSlots: [],
  mapsFromLibraryEntryIds: ["hxspec-wb-density", "vol-wb-l1"],
  athleteFacingNotes: "Wall ball capacity sets.",
};

const STAGE_2: SessionFamilyStage = {
  id: "wall_ball_stage_2",
  key: "stage_2",
  label: "6 × 25 wall balls · 60 sec",
  intents: ["VOLUME"],
  structuredWorkout: wbRounds(6, 25, 60),
  prescriptionSlots: [],
  athleteFacingNotes: "More wall ball volume.",
};

const STAGE_3: SessionFamilyStage = {
  id: "wall_ball_stage_3",
  key: "stage_3",
  label: "6 × 30 wall balls · 45 sec",
  intents: ["VOLUME", "DENSITY"],
  structuredWorkout: wbRounds(6, 30, 45),
  prescriptionSlots: [],
  athleteFacingNotes: "Higher reps, less rest.",
};

const STAGE_4: SessionFamilyStage = {
  id: "wall_ball_stage_4",
  key: "stage_4",
  label: "8 × 25 wall balls · 40 sec",
  intents: ["DENSITY"],
  structuredWorkout: wbRounds(8, 25, 40),
  prescriptionSlots: [],
  athleteFacingNotes: "Dense wall ball work.",
};

const CONSOLIDATION: SessionFamilyStage = {
  id: "wall_ball_consolidation",
  key: "consolidation",
  label: "Hold · 6 × 30 · 45 sec",
  intents: ["CONSOLIDATION"],
  structuredWorkout: wbRounds(6, 30, 45),
  prescriptionSlots: [],
  athleteFacingNotes: "Same wall ball dose.",
};

const DELOAD: SessionFamilyStage = {
  id: "wall_ball_deload",
  key: "deload_a",
  label: "Deload · 4 × 20 · 60 sec",
  intents: ["DELOAD"],
  structuredWorkout: wbRounds(4, 20, 60),
  prescriptionSlots: [],
  athleteFacingNotes: "Lighter wall ball volume.",
};

export const WALL_BALL_DENSITY_STAGE_IDS = {
  s1: STAGE_1.id,
  s2: STAGE_2.id,
  s3: STAGE_3.id,
  s4: STAGE_4.id,
  consol: CONSOLIDATION.id,
  deload: DELOAD.id,
} as const;

export const WALL_BALL_DENSITY_FAMILY: SessionFamily = {
  id: WALL_BALL_DENSITY_FAMILY_ID,
  name: "Wall Balls — Density",
  modality: "hyrox",
  objective: "Wall ball volume and density with coach-controlled ball weight",
  tags: ["wall_ball", "hyrox", "density"],
  description: "Progress rounds/reps/density. Ball weight stays coach-set.",
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
  athleteFacingBlurb: "Wall ball density — controlled breaks.",
  sourceLibraryIds: ["hxspec-wb-density", "wall_ball_density_builder"],
};
