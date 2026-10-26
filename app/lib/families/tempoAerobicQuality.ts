/**
 * Tempo / Aerobic Quality — distinct from threshold.
 * Progress: duration → continuous length → density (less recovery on intervals).
 * Prescription: threshold_pace + 15s/km (explicit tempo offset). Missing anchor stays missing.
 */

import {
  buildStandardFamilyTransitions,
  TEMPO_PACE_RULE,
} from "@/app/lib/families/familyGraphHelpers";
import type {
  SessionFamily,
  SessionFamilyStage,
  StructuredWorkout,
} from "@/app/lib/hyroxSessionFamilyTypes";

export const TEMPO_AEROBIC_FAMILY_ID = "tempo_aerobic_quality";

const WARMUP = ["10–12 min easy", "2–3 strides"];
const COOLDOWN = ["8–10 min easy"];
const GUIDANCE = [
  "Tempo is controlled hard — finish able to speak short phrases.",
  "Pace is a guide from threshold anchor + offset; RPE/feel can override.",
];

function continuous(minutes: number): StructuredWorkout {
  return {
    warmup: [...WARMUP],
    blocks: [{ type: "continuous", work: { kind: "time", value: minutes * 60, unit: "sec" } }],
    cooldown: [...COOLDOWN],
    guidance: [...GUIDANCE],
  };
}

function intervals(reps: number, workMin: number, recoverySec: number): StructuredWorkout {
  return {
    warmup: [...WARMUP],
    blocks: [
      {
        type: "repeat",
        reps,
        work: { kind: "time", value: workMin * 60, unit: "sec" },
        recoveries: [{ durationSeconds: recoverySec, type: "jog" }],
      },
    ],
    cooldown: [...COOLDOWN],
    guidance: [...GUIDANCE],
  };
}

function runSlot() {
  return [{ slot: "run" as const, rule: TEMPO_PACE_RULE }];
}

const STAGE_1: SessionFamilyStage = {
  id: "tempo_aerobic_stage_1",
  key: "stage_1",
  label: "2 × 10 min tempo · 2 min jog",
  intents: ["VOLUME"],
  structuredWorkout: intervals(2, 10, 120),
  qualityVolume: { reps: 2, totalWorkSeconds: 20 * 60 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Two controlled tempo blocks — even effort.",
  internalCoachNotes: "Entry tempo intervals before continuous.",
  mapsFromLibraryEntryIds: ["tempo-2x10", "tempo_aerobic"],
};

const STAGE_2: SessionFamilyStage = {
  id: "tempo_aerobic_stage_2",
  key: "stage_2",
  label: "3 × 10 min tempo · 90 sec jog",
  intents: ["VOLUME", "DENSITY"],
  structuredWorkout: intervals(3, 10, 90),
  qualityVolume: { reps: 3, totalWorkSeconds: 30 * 60 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Third block — keep the same controlled feel.",
  internalCoachNotes: "+1 rep and slightly denser recovery.",
};

const STAGE_3: SessionFamilyStage = {
  id: "tempo_aerobic_stage_3",
  key: "stage_3",
  label: "Continuous 30 min tempo",
  intents: ["SPECIFICITY"],
  structuredWorkout: continuous(30),
  qualityVolume: { totalWorkSeconds: 30 * 60 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "One continuous tempo block — settle and hold.",
  internalCoachNotes: "Same work minutes as Stage 2; continuous specificity.",
};

const STAGE_4: SessionFamilyStage = {
  id: "tempo_aerobic_stage_4",
  key: "stage_4",
  label: "Continuous 40 min tempo",
  intents: ["VOLUME"],
  structuredWorkout: continuous(40),
  qualityVolume: { totalWorkSeconds: 40 * 60 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Longer continuous tempo — patience early.",
  internalCoachNotes: "Duration only — not a pace jump.",
};

const CONSOLIDATION: SessionFamilyStage = {
  id: "tempo_aerobic_consolidation",
  key: "consolidation",
  label: "Consolidation · Continuous 30 min tempo",
  intents: ["CONSOLIDATION"],
  structuredWorkout: continuous(30),
  qualityVolume: { totalWorkSeconds: 30 * 60 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Hold the 30-minute tempo stimulus.",
  internalCoachNotes: "Intentional non-progress.",
};

const DELOAD: SessionFamilyStage = {
  id: "tempo_aerobic_deload",
  key: "deload_a",
  label: "Deload · 2 × 8 min tempo · 2 min jog",
  intents: ["DELOAD"],
  structuredWorkout: intervals(2, 8, 120),
  qualityVolume: { reps: 2, totalWorkSeconds: 16 * 60 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Shorter tempo — keep quality.",
  internalCoachNotes: "Explicit volume deload.",
};

export const TEMPO_AEROBIC_STAGE_IDS = {
  s1: STAGE_1.id,
  s2: STAGE_2.id,
  s3: STAGE_3.id,
  s4: STAGE_4.id,
  consol: CONSOLIDATION.id,
  deload: DELOAD.id,
} as const;

export const TEMPO_AEROBIC_QUALITY_FAMILY: SessionFamily = {
  id: TEMPO_AEROBIC_FAMILY_ID,
  name: "Tempo — Aerobic Quality",
  modality: "run",
  objective: "Upper-aerobic / tempo durability distinct from threshold repeats",
  tags: ["tempo", "aerobic", "run", "quality"],
  description:
    "Separate from threshold 5-min repeats. Progress interval volume then continuous duration.",
  definitionVersion: 1,
  eligibility: {
    suitableLevels: ["intermediate", "advanced", "pro"],
    avoidIf: ["beginner_without_threshold_anchor"],
    requiresAnchors: ["threshold_pace"],
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
  athleteFacingBlurb: "Controlled tempo — strong but sustainable.",
  internalCoachNotes: "Do not merge with threshold_5min_repeats.",
  sourceLibraryIds: ["tempo-2x10", "tempo-30", "tempo_aerobic"],
};
