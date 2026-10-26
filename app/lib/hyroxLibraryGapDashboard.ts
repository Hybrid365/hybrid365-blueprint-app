/**
 * Coach + development library / Composer gap aggregation.
 * Coach-facing: useful programming gaps only (no development-noise codes).
 */

import type { ComposerLibraryGap, WeekProposal } from "@/app/lib/hyroxWeekComposerTypes";

export type CoachFacingGapKind =
  | "no_valid_family_progression"
  | "missing_anchor"
  | "no_canonical_reduced_variant"
  | "no_suitable_library_session"
  | "other_programming";

export type CoachFacingGap = {
  kind: CoachFacingGapKind;
  title: string;
  detail: string;
  day: string | null;
  familyId: string | null;
  sessionId: string | null;
};

export type DevGapAggregate = {
  code: ComposerLibraryGap["code"];
  count: number;
  familyIds: string[];
  sampleMessages: string[];
};

export type LibraryGapDashboard = {
  coachGaps: CoachFacingGap[];
  /** Aggregated for normalisation / library work — not shown as raw codes to coach */
  development: {
    byCode: DevGapAggregate[];
    byFamily: Array<{ familyId: string; count: number; codes: string[] }>;
    total: number;
  };
};

const COACH_TITLES: Record<CoachFacingGapKind, string> = {
  no_valid_family_progression: "No valid family progression",
  missing_anchor: "Missing programming anchor",
  no_canonical_reduced_variant: "No canonical reduced variant",
  no_suitable_library_session: "No suitable library session",
  other_programming: "Programming gap",
};

function toCoachKind(code: ComposerLibraryGap["code"]): CoachFacingGapKind {
  switch (code) {
    case "no_family":
    case "no_valid_transition":
      return "no_valid_family_progression";
    case "missing_anchor":
      return "missing_anchor";
    case "no_reduced_variant":
      return "no_canonical_reduced_variant";
    case "no_canonical_library":
      return "no_suitable_library_session";
    default:
      return "other_programming";
  }
}

/** Map raw Composer gaps → coach-readable rows (deduped by kind+day+family). */
export function coachFacingGapsFromLibraryGaps(
  gaps: ComposerLibraryGap[]
): CoachFacingGap[] {
  const seen = new Set<string>();
  const out: CoachFacingGap[] = [];
  for (const g of gaps) {
    const kind = toCoachKind(g.code);
    const key = `${kind}|${g.day ?? ""}|${g.familyId ?? ""}|${g.sessionId ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      kind,
      title: COACH_TITLES[kind],
      detail: g.message,
      day: g.day,
      familyId: g.familyId,
      sessionId: g.sessionId,
    });
  }
  return out;
}

export function aggregateDevGaps(gaps: ComposerLibraryGap[]): LibraryGapDashboard["development"] {
  const byCodeMap = new Map<ComposerLibraryGap["code"], DevGapAggregate>();
  const byFamilyMap = new Map<string, { count: number; codes: Set<string> }>();

  for (const g of gaps) {
    const agg = byCodeMap.get(g.code) ?? {
      code: g.code,
      count: 0,
      familyIds: [],
      sampleMessages: [],
    };
    agg.count += 1;
    if (g.familyId && !agg.familyIds.includes(g.familyId)) agg.familyIds.push(g.familyId);
    if (agg.sampleMessages.length < 3 && g.message) agg.sampleMessages.push(g.message);
    byCodeMap.set(g.code, agg);

    if (g.familyId) {
      const f = byFamilyMap.get(g.familyId) ?? { count: 0, codes: new Set<string>() };
      f.count += 1;
      f.codes.add(g.code);
      byFamilyMap.set(g.familyId, f);
    }
  }

  return {
    byCode: [...byCodeMap.values()].sort((a, b) => b.count - a.count),
    byFamily: [...byFamilyMap.entries()]
      .map(([familyId, v]) => ({
        familyId,
        count: v.count,
        codes: [...v.codes],
      }))
      .sort((a, b) => b.count - a.count),
    total: gaps.length,
  };
}

export function buildLibraryGapDashboard(proposal: WeekProposal | null): LibraryGapDashboard {
  const gaps = proposal?.libraryGaps ?? [];
  return {
    coachGaps: coachFacingGapsFromLibraryGaps(gaps),
    development: aggregateDevGaps(gaps),
  };
}
