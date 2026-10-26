/**
 * Code-first SessionFamily registry.
 * Prefer ~30–50 strong families over time — quality over raw count.
 */

import { BIKE_FTP_QUALITY_FAMILY } from "@/app/lib/families/bikeFtpQuality";
import { BURPEE_ECONOMY_FAMILY } from "@/app/lib/families/burpeeEconomy";
import { EASY_LONG_RUN_VOLUME_FAMILY } from "@/app/lib/families/easyLongRunVolume";
import { FARMERS_CARRY_DURABILITY_FAMILY } from "@/app/lib/families/farmersCarryDurability";
import { HYROX_COMPROMISED_RUN_FAMILY } from "@/app/lib/families/hyroxCompromisedRun";
import { LUNGE_DURABILITY_FAMILY } from "@/app/lib/families/lungeDurability";
import { ROW_THRESHOLD_INTERVALS_FAMILY } from "@/app/lib/families/rowThresholdIntervals";
import { SKI_THRESHOLD_INTERVALS_FAMILY } from "@/app/lib/families/skiThresholdIntervals";
import { SLED_PUSH_CAPACITY_FAMILY } from "@/app/lib/families/sledPushCapacity";
import { STRENGTH_LOWER_FOUNDATION_FAMILY } from "@/app/lib/families/strengthLowerFoundation";
import { STRENGTH_UPPER_FOUNDATION_FAMILY } from "@/app/lib/families/strengthUpperFoundation";
import { TEMPO_AEROBIC_QUALITY_FAMILY } from "@/app/lib/families/tempoAerobicQuality";
import {
  THRESHOLD_5MIN_FAMILY_ID,
  THRESHOLD_5MIN_REPEATS_FAMILY,
} from "@/app/lib/families/threshold5MinRepeats";
import { WALL_BALL_DENSITY_FAMILY } from "@/app/lib/families/wallBallDensity";
import type { SessionFamily } from "@/app/lib/hyroxSessionFamilyTypes";
import { assertValidSessionFamily } from "@/app/lib/hyroxSessionFamilyValidate";

const FAMILIES: SessionFamily[] = [
  THRESHOLD_5MIN_REPEATS_FAMILY,
  HYROX_COMPROMISED_RUN_FAMILY,
  TEMPO_AEROBIC_QUALITY_FAMILY,
  EASY_LONG_RUN_VOLUME_FAMILY,
  SKI_THRESHOLD_INTERVALS_FAMILY,
  ROW_THRESHOLD_INTERVALS_FAMILY,
  BIKE_FTP_QUALITY_FAMILY,
  SLED_PUSH_CAPACITY_FAMILY,
  WALL_BALL_DENSITY_FAMILY,
  BURPEE_ECONOMY_FAMILY,
  LUNGE_DURABILITY_FAMILY,
  FARMERS_CARRY_DURABILITY_FAMILY,
  STRENGTH_LOWER_FOUNDATION_FAMILY,
  STRENGTH_UPPER_FOUNDATION_FAMILY,
];

let validated = false;

function ensureValidated(): void {
  if (validated) return;
  for (const family of FAMILIES) {
    assertValidSessionFamily(family);
  }
  validated = true;
}

export function listSessionFamilies(): readonly SessionFamily[] {
  ensureValidated();
  return FAMILIES;
}

export function getSessionFamily(familyId: string): SessionFamily | null {
  ensureValidated();
  return FAMILIES.find((f) => f.id === familyId) ?? null;
}

export function getSessionFamilyOrThrow(familyId: string): SessionFamily {
  const family = getSessionFamily(familyId);
  if (!family) {
    throw new Error(`Unknown SessionFamily: ${familyId}`);
  }
  return family;
}

export function getThreshold5MinRepeatsFamily(): SessionFamily {
  return getSessionFamilyOrThrow(THRESHOLD_5MIN_FAMILY_ID);
}

/** Families eligible for Progression Ready coach filter. */
export function listProgressionReadyFamilies(): readonly SessionFamily[] {
  return listSessionFamilies();
}

export { THRESHOLD_5MIN_FAMILY_ID };
