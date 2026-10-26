/**
 * Easy / Long Run volume ladder.
 * Athlete-facing names stay natural (Easy Run / Long Run) — no Stage N in athlete UI.
 * Coach engine gets KEEP / PROGRESS VOLUME / REDUCE / DELOAD edges.
 */

import { buildStandardFamilyTransitions } from "@/app/lib/families/familyGraphHelpers";
import type {
  SessionFamily,
  SessionFamilyStage,
  StructuredWorkout,
} from "@/app/lib/hyroxSessionFamilyTypes";

export const EASY_LONG_RUN_FAMILY_ID = "easy_long_run_volume";

function continuousMinutes(minutes: number, guidance: string[]): StructuredWorkout {
  return {
    warmup: ["Start easy — no hard strides required"],
    blocks: [{ type: "continuous", work: { kind: "time", value: minutes * 60, unit: "sec" } }],
    cooldown: ["Walk / easy finish as needed"],
    guidance,
  };
}

const STAGE_1: SessionFamilyStage = {
  id: "easy_long_run_stage_1",
  key: "stage_1",
  label: "Easy 45 min",
  intents: ["VOLUME"],
  structuredWorkout: continuousMinutes(45, ["Conversational effort throughout."]),
  qualityVolume: { totalWorkSeconds: 45 * 60 },
  prescriptionSlots: [],
  athleteFacingNotes: "Easy aerobic run.",
  internalCoachNotes: "Entry easy volume.",
  mapsFromLibraryEntryIds: ["easy-run", "easy_z2"],
};

const STAGE_2: SessionFamilyStage = {
  id: "easy_long_run_stage_2",
  key: "stage_2",
  label: "Easy 60 min",
  intents: ["VOLUME"],
  structuredWorkout: continuousMinutes(60, ["Conversational effort throughout."]),
  qualityVolume: { totalWorkSeconds: 60 * 60 },
  prescriptionSlots: [],
  athleteFacingNotes: "Easy aerobic run.",
  internalCoachNotes: "+15 min easy volume.",
};

const STAGE_3: SessionFamilyStage = {
  id: "easy_long_run_stage_3",
  key: "stage_3",
  label: "Long run 75 min",
  intents: ["VOLUME"],
  structuredWorkout: continuousMinutes(75, [
    "Mostly easy. Optional final 10–15 min gently stronger if coach notes.",
  ]),
  qualityVolume: { totalWorkSeconds: 75 * 60 },
  prescriptionSlots: [],
  athleteFacingNotes: "Long aerobic run.",
  internalCoachNotes: "Long-run role — still easy overall.",
  mapsFromLibraryEntryIds: ["long-easy", "long_run"],
};

const STAGE_4: SessionFamilyStage = {
  id: "easy_long_run_stage_4",
  key: "stage_4",
  label: "Long run 90 min",
  intents: ["VOLUME"],
  structuredWorkout: continuousMinutes(90, [
    "Patient early. Fuel as needed. Keep it aerobic.",
  ]),
  qualityVolume: { totalWorkSeconds: 90 * 60 },
  prescriptionSlots: [],
  athleteFacingNotes: "Long aerobic run.",
  internalCoachNotes: "90 min long — do not stack with heavy compromised same day.",
};

const CONSOLIDATION: SessionFamilyStage = {
  id: "easy_long_run_consolidation",
  key: "consolidation",
  label: "Hold · Long run 75 min",
  intents: ["CONSOLIDATION"],
  structuredWorkout: continuousMinutes(75, ["Same long-run dose — absorb."]),
  qualityVolume: { totalWorkSeconds: 75 * 60 },
  prescriptionSlots: [],
  athleteFacingNotes: "Long aerobic run.",
  internalCoachNotes: "Hold long-run volume.",
};

const DELOAD: SessionFamilyStage = {
  id: "easy_long_run_deload",
  key: "deload_a",
  label: "Easy 40 min",
  intents: ["DELOAD"],
  structuredWorkout: continuousMinutes(40, ["Shorter easy — recovery priority."]),
  qualityVolume: { totalWorkSeconds: 40 * 60 },
  prescriptionSlots: [],
  athleteFacingNotes: "Easy aerobic run.",
  internalCoachNotes: "Volume deload for easy/long slot.",
};

export const EASY_LONG_RUN_STAGE_IDS = {
  s1: STAGE_1.id,
  s2: STAGE_2.id,
  s3: STAGE_3.id,
  s4: STAGE_4.id,
  consol: CONSOLIDATION.id,
  deload: DELOAD.id,
} as const;

export const EASY_LONG_RUN_VOLUME_FAMILY: SessionFamily = {
  id: EASY_LONG_RUN_FAMILY_ID,
  name: "Easy / Long Run Volume",
  modality: "run",
  objective: "Aerobic volume ladder for easy and long-run days",
  tags: ["easy", "long", "aerobic", "run", "volume"],
  description:
    "Duration ladder for KEEP / PROGRESS VOLUME / REDUCE / DELOAD. Athlete titles stay Easy Run / Long Run.",
  definitionVersion: 1,
  eligibility: {
    suitableLevels: ["beginner", "intermediate", "advanced", "pro"],
    requiresAnchors: [],
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
  athleteFacingBlurb: "Easy or long aerobic running — keep it conversational.",
  internalCoachNotes:
    "Never show Stage N to athletes. Use athleteFacingSessionFamilyTitle mapping.",
  sourceLibraryIds: ["easy-run", "long-easy", "long_run", "easy_z2"],
};
