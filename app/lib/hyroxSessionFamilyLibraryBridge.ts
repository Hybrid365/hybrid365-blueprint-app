/**
 * Bridge coach library cards → SessionFamily stages (pilot).
 * Uses read-only legacy map; does not mutate library records.
 */

import type { CoachLibraryEntry } from "@/app/lib/hyroxCoachSessionLibraryTypes";
import {
  findLegacyMap,
  type LegacySessionFamilyMapEntry,
} from "@/app/lib/hyroxSessionFamilyLegacyMap";
import { getSessionFamily } from "@/app/lib/hyroxSessionFamilyRegistry";
import type { SessionFamily, SessionFamilyStage } from "@/app/lib/hyroxSessionFamilyTypes";

export type LibrarySessionFamilyLink = {
  map: LegacySessionFamilyMapEntry;
  family: SessionFamily;
  stage: SessionFamilyStage;
};

/** High/medium confidence maps are actionable in builder; low is advisory only. */
export function resolveLibrarySessionFamilyLink(
  entry: Pick<CoachLibraryEntry, "id"> &
    Partial<Pick<CoachLibraryEntry, "sessionLibraryId">>
): LibrarySessionFamilyLink | null {
  const candidates = [entry.id, entry.sessionLibraryId].filter(
    (x): x is string => Boolean(x)
  );
  for (const id of candidates) {
    const map = findLegacyMap(id);
    if (!map) continue;
    if (map.confidence === "low") continue;
    const family = getSessionFamily(map.familyId);
    if (!family) continue;
    const stage = family.stages.find((s) => s.id === map.stageId);
    if (!stage) continue;
    return { map, family, stage };
  }
  return null;
}

export function isLibrarySessionFamilyEligible(
  entry: Pick<CoachLibraryEntry, "id"> &
    Partial<Pick<CoachLibraryEntry, "sessionLibraryId">>
): boolean {
  return resolveLibrarySessionFamilyLink(entry) != null;
}
