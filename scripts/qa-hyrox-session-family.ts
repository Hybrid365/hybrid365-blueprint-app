/**
 * QA: SessionFamily domain + Threshold 5-min pilot (progressive programming slice 1).
 * Run: npx tsx scripts/qa-hyrox-session-family.ts
 * Deterministic. No DB. No builder wiring.
 */

import type { HyroxAthletePerformanceProfile } from "../app/lib/hyroxBenchmarkProfile";
import {
  THRESHOLD_5MIN_FAMILY_ID,
  THRESHOLD_5MIN_PRESCRIPTION_RULE,
  THRESHOLD_5MIN_REPEATS_FAMILY,
  THRESHOLD_5MIN_STAGE_IDS,
} from "../app/lib/families/threshold5MinRepeats";
import {
  formatRecoveries,
  formatRecoveriesWithSuffix,
  formatRepeatBlock,
  formatStructuredWorkoutSummary,
} from "../app/lib/hyroxSessionFamilyFormat";
import {
  findLegacyMap,
  listLegacyMapsForFamily,
  THRESHOLD_5MIN_LEGACY_MAP,
} from "../app/lib/hyroxSessionFamilyLegacyMap";
import {
  getSessionFamily,
  getThreshold5MinRepeatsFamily,
  listSessionFamilies,
} from "../app/lib/hyroxSessionFamilyRegistry";
import { resolveSessionFamilyStage } from "../app/lib/hyroxSessionFamilyResolve";
import {
  assertValidSessionFamily,
  assignStagesToWeeks,
  collectSessionFamilyIssues,
  SessionFamilyValidationError,
} from "../app/lib/hyroxSessionFamilyValidate";
import type { SessionFamily } from "../app/lib/hyroxSessionFamilyTypes";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}
function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function emptyProfile(
  overrides: Partial<HyroxAthletePerformanceProfile> = {}
): HyroxAthletePerformanceProfile {
  return {
    run5k: null,
    run10k: null,
    run30min: null,
    threshold: null,
    hyroxRun: null,
    ski2k: null,
    ski1k: null,
    row2k: null,
    ftp: null,
    hyroxRace: null,
    readiness: [],
    ...overrides,
  };
}

function thresholdProfile(paceSecondsPerKm: number): HyroxAthletePerformanceProfile {
  return emptyProfile({
    threshold: {
      benchmarkId: "b-th",
      paceSecondsPerKm,
      thresholdHr: null,
      resultDate: "2026-10-01",
      source: "coach_entered",
    },
  });
}

const RESOLVED_AT = "2026-10-25T14:00:00.000Z";
const family = THRESHOLD_5MIN_REPEATS_FAMILY;
const ids = THRESHOLD_5MIN_STAGE_IDS;

// ---------------------------------------------------------------------------
// Family structure
// ---------------------------------------------------------------------------

assertValidSessionFamily(family);
ok("pilot family validates");

assert(family.id === THRESHOLD_5MIN_FAMILY_ID, "family id");
assert(family.name === "Threshold — 5 Minute Repeats", "family name");
assert(family.stages.length === 6, "six stages including consolidation + deload");
assert(new Set(family.stages.map((s) => s.id)).size === 6, "unique stage ids");
ok("unique stages present");

const stageIds = new Set(family.stages.map((s) => s.id));
for (const t of family.transitions) {
  assert(stageIds.has(t.fromStageId) && stageIds.has(t.toStageId), `edge ${t.action}`);
}
assert(
  family.transitions.some(
    (t) => t.fromStageId === ids.s2 && t.action === "PROGRESS" && t.toStageId === ids.s3
  ),
  "PROGRESS S2→S3"
);
assert(
  family.transitions.some(
    (t) => t.fromStageId === ids.s2 && t.action === "REPEAT" && t.toStageId === ids.s2
  ),
  "REPEAT S2"
);
assert(
  family.transitions.some(
    (t) => t.fromStageId === ids.s2 && t.action === "REDUCE" && t.toStageId === ids.s1
  ),
  "REDUCE S2→S1"
);
assert(
  family.transitions.some(
    (t) => t.fromStageId === ids.s3 && t.action === "DELOAD" && t.toStageId === ids.deload
  ),
  "DELOAD edge"
);
assert(
  family.transitions.some(
    (t) => t.fromStageId === ids.s1 && t.action === "SKIP_TO" && t.toStageId === ids.s3
  ),
  "SKIP_TO edge"
);
ok("valid transitions including reduce/deload/skip");

assert(getThreshold5MinRepeatsFamily().id === family.id, "registry get");
assert(listSessionFamilies().length >= 1, "registry list");
assert(getSessionFamily("nope") === null, "unknown family null");
ok("registry resolves pilot family");

// ---------------------------------------------------------------------------
// Stage ≠ week
// ---------------------------------------------------------------------------

const plan = assignStagesToWeeks(
  [1, 2, 3, 4, 5],
  [ids.s1, ids.s2, ids.s2, ids.deload, ids.s3]
);
assert(plan[0].week === 1 && plan[0].stageId === ids.s1, "W1 S1");
assert(plan[1].week === 2 && plan[1].stageId === ids.s2, "W2 S2");
assert(plan[2].week === 3 && plan[2].stageId === ids.s2, "W3 S2 repeat");
assert(plan[3].week === 4 && plan[3].stageId === ids.deload, "W4 deload explicit");
assert(plan[4].week === 5 && plan[4].stageId === ids.s3, "W5 S3");
assert(
  plan[3].stageId !== ids.s4,
  "week 4 is not forced to a harder stage — deload is coach-chosen stage id"
);
ok("stage ≠ week: W1 S1, W2 S2, W3 S2, W4 Deload, W5 S3 is valid");

// ---------------------------------------------------------------------------
// Stage structures + formatters
// ---------------------------------------------------------------------------

const s1 = family.stages.find((s) => s.id === ids.s1)!;
const s2 = family.stages.find((s) => s.id === ids.s2)!;
const s3 = family.stages.find((s) => s.id === ids.s3)!;
const s4 = family.stages.find((s) => s.id === ids.s4)!;
const deload = family.stages.find((s) => s.id === ids.deload)!;

const b1 = s1.structuredWorkout.blocks[0];
assert(b1.type === "repeat" && b1.reps === 5 && b1.work.value === 300, "S1 5×5min");
assert(b1.type === "repeat" && b1.recoveries[0].type === "walk" && b1.recoveries[0].durationSeconds === 120, "S1 walk 120");

const b2 = s2.structuredWorkout.blocks[0];
assert(b2.type === "repeat" && b2.reps === 6, "S2 volume +1 rep");

const b3 = s3.structuredWorkout.blocks[0];
assert(b3.type === "repeat" && b3.reps === 6, "S3 same volume");
assert(
  b3.type === "repeat" &&
    b3.recoveries.length === 2 &&
    b3.recoveries[0].type === "walk" &&
    b3.recoveries[1].type === "jog",
  "S3 compound recovery"
);

const b4 = s4.structuredWorkout.blocks[0];
assert(b4.type === "repeat" && b4.reps === 6, "S4 no volume jump");
assert(
  b4.type === "repeat" &&
    b4.recoveries.length === 1 &&
    b4.recoveries[0].type === "jog" &&
    b4.recoveries[0].durationSeconds === 90,
  "S4 90s jog"
);

assert(deload.qualityVolume?.thresholdMinutes === 20, "deload reduced volume");
assert(s1.intents.includes("VOLUME") && s3.intents.includes("RECOVERY_QUALITY"), "dimensions");
ok("pilot stage structures and dimensions");

assert(formatRepeatBlock(b2 as Extract<typeof b2, { type: "repeat" }>) === "6 × 5 min", "format reps");
assert(
  formatRecoveries((b3 as Extract<typeof b3, { type: "repeat" }>).recoveries) ===
    "60 sec walk + 60 sec jog",
  "compound recovery display"
);
assert(
  formatRecoveriesWithSuffix((b1 as Extract<typeof b1, { type: "repeat" }>).recoveries) ===
    "2 min walk recovery",
  "single recovery display"
);
assert(
  formatStructuredWorkoutSummary(s3.structuredWorkout).includes("60 sec walk + 60 sec jog"),
  "summary includes compound recovery"
);
ok("formatters: compound recovery displays correctly");

// ---------------------------------------------------------------------------
// Prescription — multiple athletes
// ---------------------------------------------------------------------------

assert(
  THRESHOLD_5MIN_PRESCRIPTION_RULE.basis === "threshold_pace" &&
    THRESHOLD_5MIN_PRESCRIPTION_RULE.adjustment.type === "seconds_per_km" &&
    THRESHOLD_5MIN_PRESCRIPTION_RULE.adjustment.value === 5,
  "shared @THRESHOLD +5s/km rule"
);

const fast = resolveSessionFamilyStage({
  family,
  stageId: ids.s2,
  profile: thresholdProfile(205), // 3:25/km
  resolvedAt: RESOLVED_AT,
});
const slow = resolveSessionFamilyStage({
  family,
  stageId: ids.s2,
  profile: thresholdProfile(250), // 4:10/km
  resolvedAt: RESOLVED_AT,
});

assert(fast.publishable && slow.publishable, "both publishable with anchors");
assert(fast.slots[0].resolvedValue === 210, `fast expected 210 got ${fast.slots[0].resolvedValue}`); // 3:30
assert(slow.slots[0].resolvedValue === 255, `slow expected 255 got ${slow.slots[0].resolvedValue}`); // 4:15
assert(fast.slots[0].expression === "@THRESHOLD +5s/km", "expression");
assert(fast.stageId === slow.stageId, "same stage");
assert(fast.humanSummary.includes("3:30/km"), `fast summary ${fast.humanSummary}`);
assert(slow.humanSummary.includes("4:15/km"), `slow summary ${slow.humanSummary}`);
ok("same stage resolves different athlete paces (3:25→3:30, 4:10→4:15)");

// ---------------------------------------------------------------------------
// Missing anchor
// ---------------------------------------------------------------------------

const missing = resolveSessionFamilyStage({
  family,
  stageId: ids.s1,
  profile: emptyProfile(),
  resolvedAt: RESOLVED_AT,
});
assert(missing.publishable === false, "not publishable");
assert(missing.slots[0].missingAnchor === true, "missingAnchor");
assert(missing.slots[0].resolvedValue === null, "no estimated pace");
assert(missing.missingAnchors.includes("threshold_pace"), "lists threshold_pace");
assert(missing.slots[0].publishBlockReason != null, "block reason present");
assert(missing.humanSummary.includes("missing anchor"), "honest summary");
ok("missing threshold anchor unresolved honestly");

// ---------------------------------------------------------------------------
// Coach override
// ---------------------------------------------------------------------------

const overridden = resolveSessionFamilyStage({
  family,
  stageId: ids.s1,
  profile: emptyProfile(),
  resolvedAt: RESOLVED_AT,
  overrides: [{ slot: "run", value: 240, unit: "s/km" }],
});
assert(overridden.slots[0].source === "coach_override", "override source");
assert(overridden.slots[0].resolvedValue === 240, "override value");
assert(overridden.slots[0].missingAnchor === true, "missingAnchor retained");
assert(overridden.slots[0].expression === "@THRESHOLD +5s/km", "formula kept as context");
assert(overridden.publishable === true, "override makes publishable");
ok("coach override preserves formula + missing-anchor provenance");

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

const frozenProfile = thresholdProfile(205);
const originalReps = (s2.structuredWorkout.blocks[0] as { reps: number }).reps;
const resolution = resolveSessionFamilyStage({
  family,
  stageId: ids.s2,
  profile: frozenProfile,
  resolvedAt: RESOLVED_AT,
});
(resolution.structuredWorkout.blocks[0] as { reps: number }).reps = 99;
assert(
  (s2.structuredWorkout.blocks[0] as { reps: number }).reps === originalReps,
  "family stage not mutated"
);
assert(frozenProfile.threshold?.paceSecondsPerKm === 205, "profile not mutated");
ok("resolution does not mutate family/profile inputs");

// ---------------------------------------------------------------------------
// Validation failures
// ---------------------------------------------------------------------------

const bad: SessionFamily = {
  ...family,
  id: "bad_family",
  stages: [
    {
      ...family.stages[0],
      id: "dup",
    },
    {
      ...family.stages[1],
      id: "dup",
    },
  ],
  defaultEntryStageId: "dup",
  transitions: [],
};
const issues = collectSessionFamilyIssues(bad);
assert(issues.some((i) => i.includes("duplicate")), `expected duplicate: ${issues.join("; ")}`);

let threw = false;
try {
  assertValidSessionFamily({
    ...family,
    id: "broken_edge",
    transitions: [
      {
        fromStageId: ids.s1,
        action: "PROGRESS",
        toStageId: "does_not_exist",
      },
    ],
  });
} catch (e) {
  threw = e instanceof SessionFamilyValidationError;
}
assert(threw, "invalid transition throws");
ok("validators catch duplicate ids and illegal transitions");

// ---------------------------------------------------------------------------
// Legacy map (read-only sample)
// ---------------------------------------------------------------------------

assert(THRESHOLD_5MIN_LEGACY_MAP.length >= 3 && THRESHOLD_5MIN_LEGACY_MAP.length <= 10, "3–10 maps");
assert(findLegacyMap("th-5x5")?.stageId === ids.s1, "th-5x5 → S1");
assert(findLegacyMap("th-6x5")?.stageId === ids.s2, "th-6x5 → S2");
assert(
  listLegacyMapsForFamily(THRESHOLD_5MIN_FAMILY_ID).every((m) => m.familyId === THRESHOLD_5MIN_FAMILY_ID),
  "family filter"
);
ok("legacy mapping prototype (read-only) present");

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

assert(resolution.provenance.stageIndependentOfCalendarWeek === true, "provenance week independence");
assert(resolution.provenance.engine === "hyroxPrescriptionEngine", "engine provenance");
ok("resolution provenance recorded");

console.log(`\nqa-hyrox-session-family: ${passed} checks passed`);
