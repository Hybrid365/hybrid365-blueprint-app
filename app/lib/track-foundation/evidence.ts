import { ageInDays, parseClockToSeconds } from "./dates";
import { SOURCE_LABEL, SOURCE_RANK, policyFor, sourceCanAnchor } from "./policies";
import { getTest } from "./testLibrary";
import type {
  BenchmarkResultInput,
  ClassifiedEvidence,
  EvidenceDisposition,
  FamilyResolution,
  KnowledgeState,
} from "./types";

function completeness(result: BenchmarkResultInput, testIdKnown: boolean): ClassifiedEvidence["completeness"] {
  if (!testIdKnown || !result.resultValue.trim() || !result.unit.trim() || !result.date || !result.source) {
    return "incomplete";
  }
  const test = getTest(result.testId);
  if (!test) return "incomplete";
  if (test.resultUnit === "mm:ss" && parseClockToSeconds(result.resultValue) == null) return "incomplete";
  if ((test.resultUnit === "W" || test.resultUnit === "kg" || test.resultUnit === "reps" || test.resultUnit === "m") && result.resultValue.trim() === "") {
    return "incomplete";
  }
  if (result.testId === "hyrox_race" && !result.details?.division && !result.details?.splits) return "partial";
  return "complete";
}

function classifyOne(
  result: BenchmarkResultInput,
  asOf: string,
  excluded: Map<string, string>
): ClassifiedEvidence {
  const test = getTest(result.testId);
  const policy = test ? policyFor(test.policyId) : null;
  const complete = completeness(result, Boolean(test && policy));
  const age = ageInDays(asOf, result.date);
  const reasons: string[] = [];
  const exclusionReason = excluded.get(result.id) ?? null;

  let disposition: EvidenceDisposition = "INVALID_INCOMPLETE";
  let canAnchor = false;

  if (!test || !policy || complete === "incomplete" || age == null) {
    reasons.push("Result is missing a test, value, unit, date or a readable time.");
  } else if (age < 0) {
    reasons.push("Result date is in the future.");
  } else if (!sourceCanAnchor(result.source)) {
    if (age <= policy.currentDays) {
      disposition = "RECENT_SUPPORTING_EVIDENCE";
      reasons.push(`${SOURCE_LABEL[result.source]} is kept as context. It does not set a training anchor.`);
    } else if (age <= policy.supportingDays) {
      disposition = "RETEST_RECOMMENDED";
      reasons.push(`${SOURCE_LABEL[result.source]} is outside the current window and cannot anchor training.`);
    } else {
      disposition = "HISTORICAL_ONLY";
      reasons.push(`${SOURCE_LABEL[result.source]} is historical context only.`);
    }
  } else if (age <= policy.currentDays) {
    disposition = "CURRENT_ANCHOR";
    canAnchor = complete !== "incomplete";
    reasons.push(
      `${SOURCE_LABEL[result.source]} is inside the ${policy.currentDays}-day current window for ${policy.label}.`
    );
  } else if (age <= policy.supportingDays) {
    disposition = "RECENT_SUPPORTING_EVIDENCE";
    canAnchor = true;
    reasons.push(
      `${policy.label} is past ${policy.currentDays} days and inside the ${policy.supportingDays}-day supporting window. Reassessment is due. The result is not discarded.`
    );
  } else {
    disposition = "HISTORICAL_ONLY";
    reasons.push(
      `${policy.label} is older than ${policy.supportingDays} days, so it stays in history and is not used as a current anchor.`
    );
  }

  if (exclusionReason) {
    canAnchor = false;
    reasons.push(exclusionReason);
  }

  return {
    ...result,
    disposition,
    canAnchor: canAnchor && !exclusionReason,
    excludedFromAnchor: Boolean(exclusionReason),
    exclusionReason,
    ageDays: age,
    policyId: policy?.id ?? "unknown",
    reasons,
    completeness: complete,
    sourceRank: SOURCE_RANK[result.source] ?? 0,
  };
}

/**
 * A correction removes the earlier row only when the new source is at least as strong.
 * A weaker "correction" does not erase a better result.
 */
export function supersededResultIds(results: BenchmarkResultInput[]): Map<string, string> {
  const byId = new Map(results.map((result) => [result.id, result]));
  const excluded = new Map<string, string>();
  for (const result of results) {
    if (!result.correctsResultId) continue;
    const original = byId.get(result.correctsResultId);
    if (!original) continue;
    if (SOURCE_RANK[result.source] >= SOURCE_RANK[original.source]) {
      excluded.set(original.id, "Corrected by a later entry of equal or stronger source. Kept in history.");
    }
  }
  return excluded;
}

export function classifyEvidence(results: BenchmarkResultInput[], asOf: string): ClassifiedEvidence[] {
  const excluded = supersededResultIds(results);
  return results.map((result) => classifyOne(result, asOf, excluded));
}

function byQuality(a: ClassifiedEvidence, b: ClassifiedEvidence): number {
  if (b.sourceRank !== a.sourceRank) return b.sourceRank - a.sourceRank;
  return (a.ageDays ?? 9999) - (b.ageDays ?? 9999);
}

function knowledgeFor(status: FamilyResolution["anchorStatus"], hasAny: boolean): KnowledgeState {
  if (status === "active") return "VALID_RECENT_RESULT";
  if (status === "reassessment_due") return "TEST_REQUIRED";
  if (hasAny) return "HISTORICAL_ONLY";
  return "MISSING";
}

export function resolveFamily(
  familyId: string,
  label: string,
  rows: ClassifiedEvidence[]
): FamilyResolution {
  const usable = rows.filter((row) => row.disposition !== "INVALID_INCOMPLETE" && !row.excludedFromAnchor);
  const invalid = rows.filter((row) => row.disposition === "INVALID_INCOMPLETE");
  const currentPool = usable.filter((row) => row.disposition === "CURRENT_ANCHOR" && row.canAnchor);
  const gracePool = usable.filter(
    (row) => row.canAnchor && row.disposition === "RECENT_SUPPORTING_EVIDENCE" && sourceCanAnchor(row.source)
  );
  const historical = usable.filter((row) => row.disposition === "HISTORICAL_ONLY" || row.disposition === "RETEST_RECOMMENDED");

  const contextOnly = usable.filter((row) => !row.canAnchor);

  if (currentPool.length > 0) {
    const ranked = [...currentPool].sort(byQuality);
    const current = ranked[0]!;
    const others = ranked.slice(1);
    return {
      familyId,
      label,
      current,
      held: null,
      contenders: ranked,
      supporting: [...others, ...gracePool, ...contextOnly],
      historical,
      winnerReason: `${SOURCE_LABEL[current.source]} ${current.resultValue} from ${current.date} is preferred on source quality, then recency.`,
      retestRecommended: false,
      knowledge: "VALID_RECENT_RESULT",
      anchorStatus: "active",
    };
  }

  if (gracePool.length > 0) {
    const ranked = [...gracePool].sort(byQuality);
    const held = ranked[0]!;
    return {
      familyId,
      label,
      current: null,
      held,
      contenders: ranked,
      supporting: [...ranked.slice(1), ...contextOnly],
      historical,
      winnerReason: `${SOURCE_LABEL[held.source]} ${held.resultValue} from ${held.date} is the best result still inside the supporting window. Reassessment is due. It is not replaced by a weaker estimate, and it is not treated as a fresh anchor.`,
      retestRecommended: true,
      knowledge: knowledgeFor("reassessment_due", true),
      anchorStatus: "reassessment_due",
    };
  }

  const context = usable.filter((row) => !row.canAnchor);
  return {
    familyId,
    label,
    current: null,
    held: null,
    contenders: [],
    supporting: context,
    historical,
    winnerReason:
      usable.length === 0 && invalid.length > 0
        ? "Entries were incomplete, so nothing was anchored."
        : context.length > 0
          ? "The only recent entry cannot anchor training. A proper test is still required."
          : historical.length > 0
            ? "Older results stay in history and are not used as the current anchor."
            : "No result on file.",
    retestRecommended: usable.length > 0 || historical.length > 0,
    knowledge: knowledgeFor("unavailable", historical.length > 0 || context.length > 0),
    anchorStatus: "unavailable",
  };
}

export type EvidenceBook = {
  classified: ClassifiedEvidence[];
  running: FamilyResolution;
  ski: FamilyResolution;
  row: FamilyResolution;
  bike: FamilyResolution;
  strength: FamilyResolution;
  hyrox: FamilyResolution;
  stations: Record<string, FamilyResolution>;
};

const STATION_FAMILIES: Array<{ familyId: string; label: string; testId: string }> = [
  { familyId: "wall_ball", label: "Wall balls", testId: "wall_ball" },
  { familyId: "sled_push", label: "Sled push", testId: "sled_push" },
  { familyId: "sled_pull", label: "Sled pull", testId: "sled_pull" },
  { familyId: "farmers", label: "Farmers", testId: "farmers" },
  { familyId: "lunges", label: "Lunges", testId: "lunges" },
  { familyId: "bbj", label: "Burpee broad jump", testId: "bbj" },
];

function rowsFor(classified: ClassifiedEvidence[], testIds: string[]): ClassifiedEvidence[] {
  const ids = new Set(testIds);
  return classified.filter((row) => ids.has(row.testId));
}

export function buildEvidenceBook(results: BenchmarkResultInput[], asOf: string): EvidenceBook {
  const classified = classifyEvidence(results, asOf);
  const stations: Record<string, FamilyResolution> = {};
  for (const station of STATION_FAMILIES) {
    stations[station.familyId] = resolveFamily(
      station.familyId,
      station.label,
      rowsFor(classified, [station.testId])
    );
  }
  return {
    classified,
    running: resolveFamily("running", "Running", rowsFor(classified, ["run_5k", "run_10k", "run_half", "run_threshold", "run_lab_threshold"])),
    ski: resolveFamily("ski", "SkiErg", rowsFor(classified, ["ski_2k"])),
    row: resolveFamily("row", "RowErg", rowsFor(classified, ["row_2k"])),
    bike: resolveFamily("bike", "Bike", rowsFor(classified, ["bike_20min", "bike_ftp"])),
    strength: resolveFamily("strength", "Strength", rowsFor(classified, ["strength_lower"])),
    hyrox: resolveFamily("hyrox", "HYROX", rowsFor(classified, ["hyrox_race"])),
    stations,
  };
}

export function bestRunningResult(family: FamilyResolution, testIds: string[]): ClassifiedEvidence | null {
  const pool = [family.current, family.held].filter((row): row is ClassifiedEvidence => Boolean(row));
  const matches = pool.filter((row) => testIds.includes(row.testId)).sort(byQuality);
  return matches[0] ?? null;
}

export { SOURCE_LABEL };
