/**
 * Lower-body strength endurance foundation.
 * Structure progresses (sets/reps/complexity). Loads stay coach-controlled — no %1RM automation.
 */

import { buildStandardFamilyTransitions } from "@/app/lib/families/familyGraphHelpers";
import type { SessionFamily, SessionFamilyStage, StructuredWorkout } from "@/app/lib/hyroxSessionFamilyTypes";

export const STRENGTH_LOWER_FOUNDATION_FAMILY_ID = "strength_lower_foundation";

function strengthWorkout(
  exercises: Array<{ name: string; sets: number; reps: number; loadNote: string; rpe?: string }>
): StructuredWorkout {
  return {
    warmup: ["5–8 min easy bike/row", "Hip / ankle prep", "2 light build-up sets"],
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
      "Loads are coach-prescribed — do not auto-increase from feedback alone.",
      "Completed at appropriate RPE may later suggest a load bump for coach review.",
    ],
  };
}

const STAGE_1: SessionFamilyStage = {
  id: "strength_lower_stage_1",
  key: "stage_1",
  label: "Squat 3×8 · RDL 3×8 · Split squat 2×8/leg",
  intents: ["VOLUME"],
  structuredWorkout: strengthWorkout([
    { name: "Back squat or goblet squat", sets: 3, reps: 8, loadNote: "Coach load", rpe: "7" },
    { name: "Romanian deadlift", sets: 3, reps: 8, loadNote: "Coach load", rpe: "7" },
    { name: "Split squat", sets: 2, reps: 8, loadNote: "Per leg · coach load", rpe: "7" },
  ]),
  prescriptionSlots: [],
  mapsFromLibraryEntryIds: ["strength-lower", "heavy-legs"],
  athleteFacingNotes: "Lower-body strength session.",
  internalCoachNotes: "Entry structure — bilateral emphasis.",
};

const STAGE_2: SessionFamilyStage = {
  id: "strength_lower_stage_2",
  key: "stage_2",
  label: "Squat 4×6 · RDL 3×8 · Split squat 3×8/leg",
  intents: ["VOLUME", "COMPLEXITY"],
  structuredWorkout: strengthWorkout([
    { name: "Back squat or goblet squat", sets: 4, reps: 6, loadNote: "Coach load", rpe: "7–8" },
    { name: "Romanian deadlift", sets: 3, reps: 8, loadNote: "Coach load", rpe: "7" },
    { name: "Split squat", sets: 3, reps: 8, loadNote: "Per leg · coach load", rpe: "7–8" },
  ]),
  prescriptionSlots: [],
  athleteFacingNotes: "Lower-body strength session.",
  internalCoachNotes: "+1 squat set, more unilateral volume. Loads still coach-set.",
};

const STAGE_3: SessionFamilyStage = {
  id: "strength_lower_stage_3",
  key: "stage_3",
  label: "Squat 4×5 · RDL 4×6 · Walking lunge 3×10/leg",
  intents: ["COMPLEXITY"],
  structuredWorkout: strengthWorkout([
    { name: "Back squat", sets: 4, reps: 5, loadNote: "Coach load", rpe: "8" },
    { name: "Romanian deadlift", sets: 4, reps: 6, loadNote: "Coach load", rpe: "7–8" },
    { name: "Walking lunge", sets: 3, reps: 10, loadNote: "Per leg · coach load", rpe: "7–8" },
  ]),
  prescriptionSlots: [],
  athleteFacingNotes: "Lower-body strength session.",
  internalCoachNotes: "Slightly heavier structure + walking lunge complexity.",
};

const CONSOLIDATION: SessionFamilyStage = {
  id: "strength_lower_consolidation",
  key: "consolidation",
  label: "Hold · Squat 4×6 · RDL 3×8 · Split squat 3×8",
  intents: ["CONSOLIDATION"],
  structuredWorkout: strengthWorkout([
    { name: "Back squat or goblet squat", sets: 4, reps: 6, loadNote: "Coach load", rpe: "7–8" },
    { name: "Romanian deadlift", sets: 3, reps: 8, loadNote: "Coach load", rpe: "7" },
    { name: "Split squat", sets: 3, reps: 8, loadNote: "Per leg · coach load", rpe: "7–8" },
  ]),
  prescriptionSlots: [],
  athleteFacingNotes: "Lower-body strength session.",
};

const DELOAD: SessionFamilyStage = {
  id: "strength_lower_deload",
  key: "deload_a",
  label: "Deload · Squat 3×6 · RDL 2×8 · Split squat 2×6",
  intents: ["DELOAD"],
  structuredWorkout: strengthWorkout([
    { name: "Back squat or goblet squat", sets: 3, reps: 6, loadNote: "Reduced coach load", rpe: "6" },
    { name: "Romanian deadlift", sets: 2, reps: 8, loadNote: "Reduced coach load", rpe: "6" },
    { name: "Split squat", sets: 2, reps: 6, loadNote: "Per leg · light", rpe: "6" },
  ]),
  prescriptionSlots: [],
  athleteFacingNotes: "Lighter lower-body strength.",
};

export const STRENGTH_LOWER_FOUNDATION_STAGE_IDS = {
  s1: STAGE_1.id,
  s2: STAGE_2.id,
  s3: STAGE_3.id,
  consol: CONSOLIDATION.id,
  deload: DELOAD.id,
} as const;

export const STRENGTH_LOWER_FOUNDATION_FAMILY: SessionFamily = {
  id: STRENGTH_LOWER_FOUNDATION_FAMILY_ID,
  name: "Strength — Lower Foundation",
  modality: "strength",
  objective: "Repeatable lower-body strength endurance structure",
  tags: ["strength", "lower", "foundation"],
  description:
    "Structure ladder only. Loads remain coach-controlled. Future: completed@RPE may recommend load bump for coach review — never auto-apply.",
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
  athleteFacingBlurb: "Lower-body strength — controlled and solid.",
  sourceLibraryIds: ["strength-lower", "heavy-legs"],
};
