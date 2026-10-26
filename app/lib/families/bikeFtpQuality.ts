/**
 * Bike / FTP quality intervals.
 * Prescription: ftp_watts % — never invent FTP when missing.
 */

import { buildStandardFamilyTransitions } from "@/app/lib/families/familyGraphHelpers";
import type { SessionFamily, SessionFamilyStage, StructuredWorkout } from "@/app/lib/hyroxSessionFamilyTypes";

export const BIKE_FTP_QUALITY_FAMILY_ID = "bike_ftp_quality";

const FTP_RULE = {
  basis: "ftp_watts" as const,
  adjustment: { type: "percent" as const, value: 90 },
};

function bikeRepeats(reps: number, workSec: number, recoverySec: number): StructuredWorkout {
  return {
    warmup: ["8–10 min easy spin", "2 openers"],
    blocks: [
      {
        type: "repeat",
        reps,
        work: { kind: "time", value: workSec, unit: "sec" },
        recoveries: [{ durationSeconds: recoverySec, type: "easy_move" }],
      },
    ],
    cooldown: ["8 min easy spin"],
    guidance: [
      "Target ~90% FTP when anchor present — do not invent watts.",
      "Even power; cadence comfortable.",
    ],
  };
}

function bikeSlot() {
  return [{ slot: "bike" as const, rule: FTP_RULE }];
}

const STAGE_1: SessionFamilyStage = {
  id: "bike_ftp_stage_1",
  key: "stage_1",
  label: "4 × 5 min @ ~90% FTP · 2 min easy",
  intents: ["VOLUME"],
  structuredWorkout: bikeRepeats(4, 300, 120),
  qualityVolume: { reps: 4, totalWorkSeconds: 20 * 60 },
  prescriptionSlots: bikeSlot(),
  athleteFacingNotes: "Controlled bike intervals.",
  mapsFromLibraryEntryIds: ["bike-ftp-4x5", "erg-bike-threshold"],
};

const STAGE_2: SessionFamilyStage = {
  id: "bike_ftp_stage_2",
  key: "stage_2",
  label: "5 × 5 min @ ~90% FTP · 2 min easy",
  intents: ["VOLUME"],
  structuredWorkout: bikeRepeats(5, 300, 120),
  qualityVolume: { reps: 5, totalWorkSeconds: 25 * 60 },
  prescriptionSlots: bikeSlot(),
  athleteFacingNotes: "One more bike interval.",
};

const STAGE_3: SessionFamilyStage = {
  id: "bike_ftp_stage_3",
  key: "stage_3",
  label: "5 × 5 min @ ~90% FTP · 90 sec easy",
  intents: ["DENSITY"],
  structuredWorkout: bikeRepeats(5, 300, 90),
  qualityVolume: { reps: 5, totalWorkSeconds: 25 * 60 },
  prescriptionSlots: bikeSlot(),
  athleteFacingNotes: "Same work — shorter recovery.",
};

const STAGE_4: SessionFamilyStage = {
  id: "bike_ftp_stage_4",
  key: "stage_4",
  label: "4 × 8 min @ ~90% FTP · 2 min easy",
  intents: ["VOLUME", "SPECIFICITY"],
  structuredWorkout: bikeRepeats(4, 480, 120),
  qualityVolume: { reps: 4, totalWorkSeconds: 32 * 60 },
  prescriptionSlots: bikeSlot(),
  athleteFacingNotes: "Longer bike quality blocks.",
};

const CONSOLIDATION: SessionFamilyStage = {
  id: "bike_ftp_consolidation",
  key: "consolidation",
  label: "Hold · 5 × 5 min · 90 sec",
  intents: ["CONSOLIDATION"],
  structuredWorkout: bikeRepeats(5, 300, 90),
  qualityVolume: { reps: 5, totalWorkSeconds: 25 * 60 },
  prescriptionSlots: bikeSlot(),
  athleteFacingNotes: "Hold bike quality dose.",
};

const DELOAD: SessionFamilyStage = {
  id: "bike_ftp_deload",
  key: "deload_a",
  label: "Deload · 3 × 5 min · 2 min",
  intents: ["DELOAD"],
  structuredWorkout: bikeRepeats(3, 300, 120),
  qualityVolume: { reps: 3, totalWorkSeconds: 15 * 60 },
  prescriptionSlots: bikeSlot(),
  athleteFacingNotes: "Shorter bike quality.",
};

export const BIKE_FTP_QUALITY_STAGE_IDS = {
  s1: STAGE_1.id,
  s2: STAGE_2.id,
  s3: STAGE_3.id,
  s4: STAGE_4.id,
  consol: CONSOLIDATION.id,
  deload: DELOAD.id,
} as const;

export const BIKE_FTP_QUALITY_FAMILY: SessionFamily = {
  id: BIKE_FTP_QUALITY_FAMILY_ID,
  name: "Bike — FTP Quality",
  modality: "bike",
  objective: "Bike threshold / FTP durability",
  tags: ["bike", "ftp", "erg", "intervals"],
  description: "FTP-anchored bike intervals. Missing FTP stays unresolved — never invented.",
  definitionVersion: 1,
  eligibility: {
    suitableLevels: ["intermediate", "advanced", "pro"],
    requiresAnchors: ["ftp_watts"],
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
  athleteFacingBlurb: "Controlled bike intervals — steady power.",
  sourceLibraryIds: ["bike-ftp-4x5", "erg-bike-threshold"],
};
