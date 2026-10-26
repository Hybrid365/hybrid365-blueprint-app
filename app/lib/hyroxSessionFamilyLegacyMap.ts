/**
 * READ-ONLY legacy → SessionFamily stage mapping.
 * Does not mutate library records. Preserves legacy ids.
 */

import { BURPEE_ECONOMY_FAMILY_ID, BURPEE_ECONOMY_STAGE_IDS } from "@/app/lib/families/burpeeEconomy";
import {
  EASY_LONG_RUN_FAMILY_ID,
  EASY_LONG_RUN_STAGE_IDS,
} from "@/app/lib/families/easyLongRunVolume";
import {
  HYROX_COMPROMISED_RUN_FAMILY_ID,
  HYROX_COMPROMISED_RUN_STAGE_IDS,
} from "@/app/lib/families/hyroxCompromisedRun";
import {
  LUNGE_DURABILITY_FAMILY_ID,
  LUNGE_DURABILITY_STAGE_IDS,
} from "@/app/lib/families/lungeDurability";
import {
  ROW_THRESHOLD_FAMILY_ID,
  ROW_THRESHOLD_STAGE_IDS,
} from "@/app/lib/families/rowThresholdIntervals";
import {
  SKI_THRESHOLD_FAMILY_ID,
  SKI_THRESHOLD_STAGE_IDS,
} from "@/app/lib/families/skiThresholdIntervals";
import {
  SLED_PUSH_CAPACITY_FAMILY_ID,
  SLED_PUSH_CAPACITY_STAGE_IDS,
} from "@/app/lib/families/sledPushCapacity";
import {
  BIKE_FTP_QUALITY_FAMILY_ID,
  BIKE_FTP_QUALITY_STAGE_IDS,
} from "@/app/lib/families/bikeFtpQuality";
import {
  FARMERS_CARRY_DURABILITY_FAMILY_ID,
  FARMERS_CARRY_DURABILITY_STAGE_IDS,
} from "@/app/lib/families/farmersCarryDurability";
import {
  STRENGTH_LOWER_FOUNDATION_FAMILY_ID,
  STRENGTH_LOWER_FOUNDATION_STAGE_IDS,
} from "@/app/lib/families/strengthLowerFoundation";
import {
  STRENGTH_UPPER_FOUNDATION_FAMILY_ID,
  STRENGTH_UPPER_FOUNDATION_STAGE_IDS,
} from "@/app/lib/families/strengthUpperFoundation";
import {
  TEMPO_AEROBIC_FAMILY_ID,
  TEMPO_AEROBIC_STAGE_IDS,
} from "@/app/lib/families/tempoAerobicQuality";
import {
  THRESHOLD_5MIN_FAMILY_ID,
  THRESHOLD_5MIN_STAGE_IDS,
} from "@/app/lib/families/threshold5MinRepeats";
import {
  WALL_BALL_DENSITY_FAMILY_ID,
  WALL_BALL_DENSITY_STAGE_IDS,
} from "@/app/lib/families/wallBallDensity";

export type LegacySessionFamilyMapConfidence = "high" | "medium" | "low";

export type LegacySessionFamilyMapEntry = {
  legacySessionId: string;
  legacySource: "coach_library" | "foundation_library" | "threshold_block_progression";
  familyId: string;
  stageId: string;
  confidence: LegacySessionFamilyMapConfidence;
  reason: string;
};

function m(
  legacySessionId: string,
  familyId: string,
  stageId: string,
  confidence: LegacySessionFamilyMapConfidence,
  reason: string,
  legacySource: LegacySessionFamilyMapEntry["legacySource"] = "coach_library"
): LegacySessionFamilyMapEntry {
  return { legacySessionId, legacySource, familyId, stageId, confidence, reason };
}

export const THRESHOLD_5MIN_LEGACY_MAP: readonly LegacySessionFamilyMapEntry[] = [
  m("th-5x5", THRESHOLD_5MIN_FAMILY_ID, THRESHOLD_5MIN_STAGE_IDS.s1, "high", "5×5 threshold volume match Stage 1"),
  m("th-6x5", THRESHOLD_5MIN_FAMILY_ID, THRESHOLD_5MIN_STAGE_IDS.s2, "high", "6×5 threshold volume match Stage 2"),
  m("coach_th-6x5", THRESHOLD_5MIN_FAMILY_ID, THRESHOLD_5MIN_STAGE_IDS.s2, "medium", "Alias of th-6x5"),
  m(
    "hyrox_run_threshold_6x6",
    THRESHOLD_5MIN_FAMILY_ID,
    THRESHOLD_5MIN_STAGE_IDS.s2,
    "medium",
    "Foundation related threshold seed",
    "foundation_library"
  ),
  m("th-6x6", THRESHOLD_5MIN_FAMILY_ID, THRESHOLD_5MIN_STAGE_IDS.s4, "low", "6×6 different work duration — review only"),
];

export const EXPANSION_LEGACY_MAP: readonly LegacySessionFamilyMapEntry[] = [
  // HYROX compromised
  m(
    "hxspec-sled-to-run",
    HYROX_COMPROMISED_RUN_FAMILY_ID,
    HYROX_COMPROMISED_RUN_STAGE_IDS.s3,
    "high",
    "Sled→800m compromised pattern maps to Stage 3 volume"
  ),
  m(
    "hxspec-wb-to-run",
    HYROX_COMPROMISED_RUN_FAMILY_ID,
    HYROX_COMPROMISED_RUN_STAGE_IDS.s2,
    "high",
    "WB→run compromised entry/mid volume"
  ),
  m(
    "hxspec-sled-race-execution",
    HYROX_COMPROMISED_RUN_FAMILY_ID,
    HYROX_COMPROMISED_RUN_STAGE_IDS.s4,
    "medium",
    "Race-execution density — Stage 4 adjacent"
  ),
  m(
    "hxspec-wb-race-execution",
    HYROX_COMPROMISED_RUN_FAMILY_ID,
    HYROX_COMPROMISED_RUN_STAGE_IDS.s4,
    "medium",
    "Race-execution density — Stage 4 adjacent"
  ),

  // Tempo
  m("tempo-2x10", TEMPO_AEROBIC_FAMILY_ID, TEMPO_AEROBIC_STAGE_IDS.s1, "medium", "2×10 tempo entry"),
  m("tempo-30", TEMPO_AEROBIC_FAMILY_ID, TEMPO_AEROBIC_STAGE_IDS.s3, "medium", "Continuous tempo ~30"),

  // Easy / long
  m("easy-run", EASY_LONG_RUN_FAMILY_ID, EASY_LONG_RUN_STAGE_IDS.s1, "high", "Easy run entry"),
  m("easy_z2", EASY_LONG_RUN_FAMILY_ID, EASY_LONG_RUN_STAGE_IDS.s2, "medium", "Z2 easy ~60"),
  m("long-easy", EASY_LONG_RUN_FAMILY_ID, EASY_LONG_RUN_STAGE_IDS.s3, "high", "Long easy ~75"),
  m("long_run", EASY_LONG_RUN_FAMILY_ID, EASY_LONG_RUN_STAGE_IDS.s4, "medium", "Long run ~90"),

  // Ski / Row
  m("ski-5x3", SKI_THRESHOLD_FAMILY_ID, SKI_THRESHOLD_STAGE_IDS.s1, "medium", "Ski 5×3 entry"),
  m("hxspec-ski-engine", SKI_THRESHOLD_FAMILY_ID, SKI_THRESHOLD_STAGE_IDS.s2, "medium", "Ski engine mid"),
  m("row-5x3", ROW_THRESHOLD_FAMILY_ID, ROW_THRESHOLD_STAGE_IDS.s1, "medium", "Row 5×3 entry"),
  m("hxspec-row-engine", ROW_THRESHOLD_FAMILY_ID, ROW_THRESHOLD_STAGE_IDS.s2, "medium", "Row engine mid"),

  // Stations
  m("hxspec-sled-capacity", SLED_PUSH_CAPACITY_FAMILY_ID, SLED_PUSH_CAPACITY_STAGE_IDS.s1, "high", "Sled capacity L1"),
  m("hxspec-wb-density", WALL_BALL_DENSITY_FAMILY_ID, WALL_BALL_DENSITY_STAGE_IDS.s1, "high", "WB density L1"),
  m("hxspec-bbj-economy", BURPEE_ECONOMY_FAMILY_ID, BURPEE_ECONOMY_STAGE_IDS.s1, "high", "BBJ economy L1"),
  m(
    "hxspec-lunge-durability",
    LUNGE_DURABILITY_FAMILY_ID,
    LUNGE_DURABILITY_STAGE_IDS.s1,
    "high",
    "Lunge durability L1"
  ),

  // Strength
  m(
    "strength-lower",
    STRENGTH_LOWER_FOUNDATION_FAMILY_ID,
    STRENGTH_LOWER_FOUNDATION_STAGE_IDS.s1,
    "medium",
    "Lower strength foundation"
  ),
  m(
    "heavy-legs",
    STRENGTH_LOWER_FOUNDATION_FAMILY_ID,
    STRENGTH_LOWER_FOUNDATION_STAGE_IDS.s2,
    "low",
    "Related lower strength — coach review for exact map"
  ),
  m(
    "strength-upper",
    STRENGTH_UPPER_FOUNDATION_FAMILY_ID,
    STRENGTH_UPPER_FOUNDATION_STAGE_IDS.s1,
    "medium",
    "Upper strength foundation"
  ),
  m(
    "upper-emom",
    STRENGTH_UPPER_FOUNDATION_FAMILY_ID,
    STRENGTH_UPPER_FOUNDATION_STAGE_IDS.s2,
    "low",
    "Related upper strength — coach review"
  ),

  // Bike FTP
  m(
    "bike-ftp-4x5",
    BIKE_FTP_QUALITY_FAMILY_ID,
    BIKE_FTP_QUALITY_STAGE_IDS.s1,
    "high",
    "Bike FTP 4×5 match Stage 1"
  ),
  m(
    "erg-bike-threshold",
    BIKE_FTP_QUALITY_FAMILY_ID,
    BIKE_FTP_QUALITY_STAGE_IDS.s2,
    "medium",
    "Bike threshold erg — review stage"
  ),

  // Farmers
  m(
    "hxspec-farmers",
    FARMERS_CARRY_DURABILITY_FAMILY_ID,
    FARMERS_CARRY_DURABILITY_STAGE_IDS.s2,
    "high",
    "Farmers specificity"
  ),
  m(
    "vol-farmers-l1",
    FARMERS_CARRY_DURABILITY_FAMILY_ID,
    FARMERS_CARRY_DURABILITY_STAGE_IDS.s1,
    "high",
    "Farmers volume L1"
  ),
];

export const ALL_LEGACY_SESSION_FAMILY_MAPS: readonly LegacySessionFamilyMapEntry[] = [
  ...THRESHOLD_5MIN_LEGACY_MAP,
  ...EXPANSION_LEGACY_MAP,
];

export function listLegacyMapsForFamily(familyId: string): LegacySessionFamilyMapEntry[] {
  return ALL_LEGACY_SESSION_FAMILY_MAPS.filter((entry) => entry.familyId === familyId);
}

export function findLegacyMap(legacySessionId: string): LegacySessionFamilyMapEntry | null {
  return ALL_LEGACY_SESSION_FAMILY_MAPS.find((m) => m.legacySessionId === legacySessionId) ?? null;
}
