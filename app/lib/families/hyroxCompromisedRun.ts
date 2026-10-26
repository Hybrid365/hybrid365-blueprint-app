/**
 * Canonical family: HYROX Compromised Running
 *
 * Progression philosophy — change 1–2 variables per PROGRESS step:
 *   S1→S2: rounds (volume)
 *   S2→S3: run distance per round (compromise load)
 *   S3→S4: recovery shortening (density) + race-order station note
 * Deload / consolidation explicit. Loads stay coach-prescribed.
 */

import {
  buildStandardFamilyTransitions,
  HYROX_RUN_RULE,
} from "@/app/lib/families/familyGraphHelpers";
import type {
  SessionFamily,
  SessionFamilyStage,
  StructuredWorkout,
} from "@/app/lib/hyroxSessionFamilyTypes";

export const HYROX_COMPROMISED_RUN_FAMILY_ID = "hyrox_compromised_run";

const WARMUP = ["8–10 min easy run", "2 light station feelers", "2 strides"];
const COOLDOWN = ["6–8 min easy jog", "Light mobility"];
const GUIDANCE = [
  "The run after the station is the point — reclaim posture in the first 200m.",
  "Station load is coach-prescribed. Do not invent heavier loads.",
  "If you cannot run well, you overcooked the station.",
];

function compromisedWorkout(args: {
  rounds: number;
  runMeters: number;
  stationName: string;
  stationNote: string;
  recoverySec: number;
}): StructuredWorkout {
  return {
    warmup: [...WARMUP],
    blocks: [
      {
        type: "station_round",
        rounds: args.rounds,
        run: { kind: "distance", value: args.runMeters, unit: "m" },
        station: { name: args.stationName, note: args.stationNote },
        recoveries: [{ durationSeconds: args.recoverySec, type: "easy_move" }],
      },
    ],
    cooldown: [...COOLDOWN],
    guidance: [...GUIDANCE],
  };
}

function runSlot() {
  return [{ slot: "run" as const, rule: HYROX_RUN_RULE }];
}

const STAGE_1: SessionFamilyStage = {
  id: "hyrox_compromised_run_stage_1",
  key: "stage_1",
  label: "4 × (station + 400m) · 2:30 recovery",
  intents: ["VOLUME"],
  structuredWorkout: compromisedWorkout({
    rounds: 4,
    runMeters: 400,
    stationName: "Mixed station (coach pick)",
    stationNote: "Lower station volume — e.g. 20 wall balls or 20m sled @ controlled load",
    recoverySec: 150,
  }),
  qualityVolume: { reps: 4, totalWorkSeconds: 4 * 90 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Station into short run repeats — stay smooth off the station.",
  internalCoachNotes: "Entry: establish compromised run quality before volume.",
  mapsFromLibraryEntryIds: ["hxspec-wb-to-run", "mini-compromised-wb"],
};

const STAGE_2: SessionFamilyStage = {
  id: "hyrox_compromised_run_stage_2",
  key: "stage_2",
  label: "5 × (station + 400m) · 2:30 recovery",
  intents: ["VOLUME"],
  structuredWorkout: compromisedWorkout({
    rounds: 5,
    runMeters: 400,
    stationName: "Mixed station (coach pick)",
    stationNote: "Same station dose as Stage 1 — one extra round only",
    recoverySec: 150,
  }),
  qualityVolume: { reps: 5, totalWorkSeconds: 5 * 90 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "One more round — keep run quality identical.",
  internalCoachNotes: "PROGRESS = +1 round only. Do not also increase station or run distance.",
  mapsFromLibraryEntryIds: ["hxspec-sled-to-run"],
};

const STAGE_3: SessionFamilyStage = {
  id: "hyrox_compromised_run_stage_3",
  key: "stage_3",
  label: "5 × (station + 800m) · 2:00 recovery",
  intents: ["VOLUME", "SPECIFICITY"],
  structuredWorkout: compromisedWorkout({
    rounds: 5,
    runMeters: 800,
    stationName: "Mixed station (coach pick)",
    stationNote: "Race-relevant station volume — e.g. 30–40 WB or 25m sled @ race load",
    recoverySec: 120,
  }),
  qualityVolume: { reps: 5, totalWorkSeconds: 5 * 180 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Longer run off the station — first 200m posture is everything.",
  internalCoachNotes: "PROGRESS = run distance up; slight recovery trim. Station dose coach-set.",
  mapsFromLibraryEntryIds: ["hxspec-sled-to-run", "hxspec-wb-to-run"],
};

const STAGE_4: SessionFamilyStage = {
  id: "hyrox_compromised_run_stage_4",
  key: "stage_4",
  label: "6 × (station + 800m) · 90 sec recovery",
  intents: ["DENSITY", "SPECIFICITY"],
  structuredWorkout: compromisedWorkout({
    rounds: 6,
    runMeters: 800,
    stationName: "Race-order station (coach pick)",
    stationNote: "Prefer race station order / denser transition — load still coach-prescribed",
    recoverySec: 90,
  }),
  qualityVolume: { reps: 6, totalWorkSeconds: 6 * 180 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Denser transitions — stay patient on the run.",
  internalCoachNotes:
    "PROGRESS = +1 round + denser recovery. Not a simultaneous load jump.",
};

const CONSOLIDATION: SessionFamilyStage = {
  id: "hyrox_compromised_run_consolidation",
  key: "consolidation",
  label: "Consolidation · 5 × (station + 800m) · 2:00",
  intents: ["CONSOLIDATION"],
  structuredWorkout: compromisedWorkout({
    rounds: 5,
    runMeters: 800,
    stationName: "Mixed station (coach pick)",
    stationNote: "Hold Stage 3 stimulus — intentional non-progress",
    recoverySec: 120,
  }),
  qualityVolume: { reps: 5, totalWorkSeconds: 5 * 180 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Same session as last quality exposure — absorb the work.",
  internalCoachNotes: "Use when feedback supports REPEAT/hold rather than PROGRESS.",
};

const DELOAD: SessionFamilyStage = {
  id: "hyrox_compromised_run_deload",
  key: "deload_a",
  label: "Deload · 3 × (station + 400m) · 2:30",
  intents: ["DELOAD"],
  structuredWorkout: compromisedWorkout({
    rounds: 3,
    runMeters: 400,
    stationName: "Light station (coach pick)",
    stationNote: "Reduced station volume — technique emphasis",
    recoverySec: 150,
  }),
  qualityVolume: { reps: 3, totalWorkSeconds: 3 * 90 },
  prescriptionSlots: runSlot(),
  athleteFacingNotes: "Lighter compromised session — keep quality high.",
  internalCoachNotes: "Explicit deload — not implied by calendar week.",
};

export const HYROX_COMPROMISED_RUN_STAGE_IDS = {
  s1: STAGE_1.id,
  s2: STAGE_2.id,
  s3: STAGE_3.id,
  s4: STAGE_4.id,
  consol: CONSOLIDATION.id,
  deload: DELOAD.id,
} as const;

export const HYROX_COMPROMISED_RUN_FAMILY: SessionFamily = {
  id: HYROX_COMPROMISED_RUN_FAMILY_ID,
  name: "HYROX — Compromised Running",
  modality: "hyrox",
  objective: "Rebuild efficient running immediately after station fatigue",
  tags: ["hyrox", "compromised", "run", "stations", "race-specific"],
  description:
    "Station → run repeats. Progress rounds, then run distance, then density — not all at once. Station loads remain coach-prescribed.",
  definitionVersion: 1,
  eligibility: {
    suitableLevels: ["intermediate", "advanced", "pro"],
    avoidIf: ["acute_injury", "race_week_full_volume"],
    requiresAnchors: ["hyrox_run_pace"],
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
  athleteFacingBlurb: "Stations into runs — reclaim your stride after each station.",
  internalCoachNotes:
    "Primary HYROX family for Week Composer. Prefer same-day continuity (typically Saturday).",
  sourceLibraryIds: [
    "hxspec-sled-to-run",
    "hxspec-wb-to-run",
    "hxspec-sled-race-execution",
    "hxspec-wb-race-execution",
  ],
};
