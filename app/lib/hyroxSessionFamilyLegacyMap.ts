/**
 * READ-ONLY legacy → SessionFamily stage mapping prototype.
 * Does not mutate library records. Small high-confidence sample only.
 */

import {
  THRESHOLD_5MIN_FAMILY_ID,
  THRESHOLD_5MIN_STAGE_IDS,
} from "@/app/lib/families/threshold5MinRepeats";

export type LegacySessionFamilyMapConfidence = "high" | "medium" | "low";

export type LegacySessionFamilyMapEntry = {
  legacySessionId: string;
  legacySource: "coach_library" | "foundation_library" | "threshold_block_progression";
  familyId: string;
  stageId: string;
  confidence: LegacySessionFamilyMapConfidence;
  reason: string;
};

/**
 * Obvious near-equivalents for the Threshold 5-min pilot.
 * Recovery/prescription differences are noted — mapping is advisory only.
 */
export const THRESHOLD_5MIN_LEGACY_MAP: readonly LegacySessionFamilyMapEntry[] = [
  {
    legacySessionId: "th-5x5",
    legacySource: "coach_library",
    familyId: THRESHOLD_5MIN_FAMILY_ID,
    stageId: THRESHOLD_5MIN_STAGE_IDS.s1,
    confidence: "high",
    reason:
      "Coach library 5×5 min @ threshold. Legacy recovery was 90s easy jog; pilot Stage 1 uses 120s walk (structure volume match).",
  },
  {
    legacySessionId: "th-6x5",
    legacySource: "coach_library",
    familyId: THRESHOLD_5MIN_FAMILY_ID,
    stageId: THRESHOLD_5MIN_STAGE_IDS.s2,
    confidence: "high",
    reason:
      "Coach library 6×5 min @ threshold. Legacy recovery 75–90s easy; pilot Stage 2 uses 120s walk (rep/volume match).",
  },
  {
    legacySessionId: "coach_th-6x5",
    legacySource: "coach_library",
    familyId: THRESHOLD_5MIN_FAMILY_ID,
    stageId: THRESHOLD_5MIN_STAGE_IDS.s2,
    confidence: "medium",
    reason: "sessionLibraryId alias used by th-6x5 card — same volume intent as Stage 2.",
  },
  {
    legacySessionId: "hyrox_run_threshold_6x6",
    legacySource: "foundation_library",
    familyId: THRESHOLD_5MIN_FAMILY_ID,
    stageId: THRESHOLD_5MIN_STAGE_IDS.s2,
    confidence: "medium",
    reason:
      "Foundation template; intermediateVersion is 5×5 and advanced is 6×6 — related but not identical to 6×5 Stage 2. Map as related threshold family seed only.",
  },
  {
    legacySessionId: "th-6x6",
    legacySource: "coach_library",
    familyId: THRESHOLD_5MIN_FAMILY_ID,
    stageId: THRESHOLD_5MIN_STAGE_IDS.s4,
    confidence: "low",
    reason:
      "6×6 min is a different work duration (not 5-min repeats). Listed as near-family only — do not auto-convert without coach review.",
  },
  {
    legacySessionId: "thresholdBlockProgression.block1.week1",
    legacySource: "threshold_block_progression",
    familyId: THRESHOLD_5MIN_FAMILY_ID,
    stageId: THRESHOLD_5MIN_STAGE_IDS.s1,
    confidence: "medium",
    reason:
      "Block1 W1 is 5×5 with 90s recovery — volume matches Stage 1; week index must NOT be treated as stage id.",
  },
  {
    legacySessionId: "thresholdBlockProgression.block1.week2",
    legacySource: "threshold_block_progression",
    familyId: THRESHOLD_5MIN_FAMILY_ID,
    stageId: THRESHOLD_5MIN_STAGE_IDS.s2,
    confidence: "medium",
    reason: "Block1 W2 is 6×5 — volume matches Stage 2; calendar week remains independent.",
  },
  {
    legacySessionId: "thresholdBlockProgression.block1.week4",
    legacySource: "threshold_block_progression",
    familyId: THRESHOLD_5MIN_FAMILY_ID,
    stageId: THRESHOLD_5MIN_STAGE_IDS.deload,
    confidence: "medium",
    reason:
      "Block1 W4 is 4×5 deload volume — maps to explicit deload stage, not 'because week 4'.",
  },
] as const;

export function listLegacyMapsForFamily(familyId: string): LegacySessionFamilyMapEntry[] {
  return THRESHOLD_5MIN_LEGACY_MAP.filter((m) => m.familyId === familyId);
}

export function findLegacyMap(legacySessionId: string): LegacySessionFamilyMapEntry | null {
  return THRESHOLD_5MIN_LEGACY_MAP.find((m) => m.legacySessionId === legacySessionId) ?? null;
}
