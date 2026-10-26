/**
 * Upper-body strength foundation. Loads coach-controlled — no %1RM automation.
 */

import { buildStandardFamilyTransitions } from "@/app/lib/families/familyGraphHelpers";
import type { SessionFamily, SessionFamilyStage, StructuredWorkout } from "@/app/lib/hyroxSessionFamilyTypes";

export const STRENGTH_UPPER_FOUNDATION_FAMILY_ID = "strength_upper_foundation";

function strengthWorkout(
  exercises: Array<{ name: string; sets: number; reps: number; loadNote: string; rpe?: string }>
): StructuredWorkout {
  return {
    warmup: ["5 min easy", "Shoulder / scap prep", "2 light build-up sets"],
    blocks: [
      {
        type: "strength",
        exercises: exercises.map((e) => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          loadNote: e.loadNote,
          rpe: e.rpe,
        })),
      },
    ],
    cooldown: ["Easy mobility"],
    guidance: [
      "Loads are coach-prescribed — do not auto-increase.",
      "Completed at appropriate RPE may later suggest a load bump for coach review only.",
    ],
  };
}

const STAGE_1: SessionFamilyStage = {
  id: "strength_upper_stage_1",
  key: "stage_1",
  label: "Pull-up 3×6 · Press 3×8 · Row 3×10",
  intents: ["VOLUME"],
  structuredWorkout: strengthWorkout([
    { name: "Pull-up or lat pulldown", sets: 3, reps: 6, loadNote: "Coach load", rpe: "7" },
    { name: "DB / barbell press", sets: 3, reps: 8, loadNote: "Coach load", rpe: "7" },
    { name: "DB row", sets: 3, reps: 10, loadNote: "Coach load", rpe: "7" },
  ]),
  prescriptionSlots: [],
  mapsFromLibraryEntryIds: ["strength-upper", "upper-emom"],
  athleteFacingNotes: "Upper-body strength session.",
};

const STAGE_2: SessionFamilyStage = {
  id: "strength_upper_stage_2",
  key: "stage_2",
  label: "Pull-up 4×6 · Press 3×8 · Row 3×10 · Carry 2×40m",
  intents: ["VOLUME", "COMPLEXITY"],
  structuredWorkout: strengthWorkout([
    { name: "Pull-up or lat pulldown", sets: 4, reps: 6, loadNote: "Coach load", rpe: "7–8" },
    { name: "DB / barbell press", sets: 3, reps: 8, loadNote: "Coach load", rpe: "7" },
    { name: "DB row", sets: 3, reps: 10, loadNote: "Coach load", rpe: "7" },
    { name: "Farmers carry", sets: 2, reps: 40, loadNote: "Metres · coach load", rpe: "7" },
  ]),
  prescriptionSlots: [],
  athleteFacingNotes: "Upper-body strength session.",
};

const STAGE_3: SessionFamilyStage = {
  id: "strength_upper_stage_3",
  key: "stage_3",
  label: "Pull-up 4×5 · Press 4×6 · Row 4×8 · Grip holds 3×40s",
  intents: ["COMPLEXITY"],
  structuredWorkout: strengthWorkout([
    { name: "Pull-up", sets: 4, reps: 5, loadNote: "Coach load", rpe: "8" },
    { name: "DB / barbell press", sets: 4, reps: 6, loadNote: "Coach load", rpe: "7–8" },
    { name: "DB row", sets: 4, reps: 8, loadNote: "Coach load", rpe: "7–8" },
    { name: "Heavy DB grip hold", sets: 3, reps: 40, loadNote: "Seconds · coach load", rpe: "7" },
  ]),
  prescriptionSlots: [],
  athleteFacingNotes: "Upper-body strength session.",
};

const CONSOLIDATION: SessionFamilyStage = {
  id: "strength_upper_consolidation",
  key: "consolidation",
  label: "Hold · Pull-up 4×6 · Press 3×8 · Row 3×10",
  intents: ["CONSOLIDATION"],
  structuredWorkout: strengthWorkout([
    { name: "Pull-up or lat pulldown", sets: 4, reps: 6, loadNote: "Coach load", rpe: "7–8" },
    { name: "DB / barbell press", sets: 3, reps: 8, loadNote: "Coach load", rpe: "7" },
    { name: "DB row", sets: 3, reps: 10, loadNote: "Coach load", rpe: "7" },
  ]),
  prescriptionSlots: [],
  athleteFacingNotes: "Upper-body strength session.",
};

const DELOAD: SessionFamilyStage = {
  id: "strength_upper_deload",
  key: "deload_a",
  label: "Deload · Pull-up 3×5 · Press 2×8 · Row 2×8",
  intents: ["DELOAD"],
  structuredWorkout: strengthWorkout([
    { name: "Pull-up or lat pulldown", sets: 3, reps: 5, loadNote: "Reduced coach load", rpe: "6" },
    { name: "DB / barbell press", sets: 2, reps: 8, loadNote: "Reduced coach load", rpe: "6" },
    { name: "DB row", sets: 2, reps: 8, loadNote: "Reduced coach load", rpe: "6" },
  ]),
  prescriptionSlots: [],
  athleteFacingNotes: "Lighter upper-body strength.",
};

export const STRENGTH_UPPER_FOUNDATION_STAGE_IDS = {
  s1: STAGE_1.id,
  s2: STAGE_2.id,
  s3: STAGE_3.id,
  consol: CONSOLIDATION.id,
  deload: DELOAD.id,
} as const;

export const STRENGTH_UPPER_FOUNDATION_FAMILY: SessionFamily = {
  id: STRENGTH_UPPER_FOUNDATION_FAMILY_ID,
  name: "Strength — Upper Foundation",
  modality: "strength",
  objective: "Repeatable upper-body strength structure with coach-controlled loads",
  tags: ["strength", "upper", "foundation", "grip"],
  description: "Structure ladder only. Loads remain coach-controlled.",
  definitionVersion: 1,
  eligibility: {
    suitableLevels: ["beginner", "intermediate", "advanced", "pro"],
    requiresAnchors: [],
  },
  defaultEntryStageId: STAGE_1.id,
  consolidationStageId: CONSOLIDATION.id,
  deloadStageId: DELOAD.id,
  stages: [STAGE_1, STAGE_2, STAGE_3, CONSOLIDATION, DELOAD],
  transitions: buildStandardFamilyTransitions({
    workingIds: [STAGE_1.id, STAGE_2.id, STAGE_3.id],
    consolidationId: CONSOLIDATION.id,
    deloadId: DELOAD.id,
  }),
  athleteFacingBlurb: "Upper-body strength — controlled and solid.",
  sourceLibraryIds: ["strength-upper", "upper-emom"],
};
