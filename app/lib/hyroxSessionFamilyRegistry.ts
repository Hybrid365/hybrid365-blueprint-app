/**
 * Code-first SessionFamily registry. Slice 1: threshold pilot only.
 * Not wired to programme builder.
 */

import {
  THRESHOLD_5MIN_FAMILY_ID,
  THRESHOLD_5MIN_REPEATS_FAMILY,
} from "@/app/lib/families/threshold5MinRepeats";
import type { SessionFamily } from "@/app/lib/hyroxSessionFamilyTypes";
import { assertValidSessionFamily } from "@/app/lib/hyroxSessionFamilyValidate";

const FAMILIES: SessionFamily[] = [THRESHOLD_5MIN_REPEATS_FAMILY];

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

export { THRESHOLD_5MIN_FAMILY_ID };
