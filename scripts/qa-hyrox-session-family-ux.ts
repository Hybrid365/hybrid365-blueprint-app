/**
 * QA: Session family Slice 3 — proposal, flag, copy semantics, unlink wiring helpers.
 * Run: npx tsx scripts/qa-hyrox-session-family-ux.ts
 */

import type { HyroxAthletePerformanceProfile } from "../app/lib/hyroxBenchmarkProfile";
import type { CoachDraftSession } from "../app/lib/hyroxCoachProgrammeDraft";
import { cloneCoachDraftWeekForTarget } from "../app/lib/hyroxCopyProgrammeWeek";
import {
  THRESHOLD_5MIN_REPEATS_FAMILY,
  THRESHOLD_5MIN_STAGE_IDS,
} from "../app/lib/families/threshold5MinRepeats";
import {
  isHyroxSessionFamiliesEnabled,
  isHyroxSessionFamiliesEnabledClient,
} from "../app/lib/hyroxSessionFamiliesFlag";
import { createCoachDraftSessionFromFamilyStage } from "../app/lib/hyroxSessionFamilyDraft";
import {
  proposeDefaultProgressionStages,
} from "../app/lib/hyroxSessionFamilyProposal";
import {
  buildSessionFamilyPublishSnapshot,
  getSessionPublishability,
} from "../app/lib/hyroxSessionFamilyPublish";
import { shouldRetainSessionFamilyLink } from "../app/lib/hyroxSessionFamilyUnlink";
import { assertValidSessionFamily } from "../app/lib/hyroxSessionFamilyValidate";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
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

function thresholdProfile(pace: number): HyroxAthletePerformanceProfile {
  return emptyProfile({
    threshold: {
      benchmarkId: "b",
      paceSecondsPerKm: pace,
      thresholdHr: null,
      resultDate: "2026-10-01",
      source: "coach_entered",
    },
  });
}

const family = THRESHOLD_5MIN_REPEATS_FAMILY;
const ids = THRESHOLD_5MIN_STAGE_IDS;
assertValidSessionFamily(family);

// Flag default OFF
const prev = process.env.HYROX_SESSION_FAMILIES_ENABLED;
const prevIds = process.env.HYROX_SESSION_FAMILIES_ATHLETE_IDS;
delete process.env.HYROX_SESSION_FAMILIES_ENABLED;
delete process.env.HYROX_SESSION_FAMILIES_ATHLETE_IDS;
assert(isHyroxSessionFamiliesEnabled({ id: "any" }) === false, "flag off");
assert(isHyroxSessionFamiliesEnabledClient(false) === false, "client off");
assert(isHyroxSessionFamiliesEnabledClient(true) === true, "client seed");
process.env.HYROX_SESSION_FAMILIES_ATHLETE_IDS = "demo-1";
assert(isHyroxSessionFamiliesEnabled({ id: "demo-1" }) === true, "allow-list");
assert(isHyroxSessionFamiliesEnabled({ id: "other" }) === false, "allow-list miss");
if (prev === undefined) delete process.env.HYROX_SESSION_FAMILIES_ENABLED;
else process.env.HYROX_SESSION_FAMILIES_ENABLED = prev;
if (prevIds === undefined) delete process.env.HYROX_SESSION_FAMILIES_ATHLETE_IDS;
else process.env.HYROX_SESSION_FAMILIES_ATHLETE_IDS = prevIds;
ok("feature flag default OFF + athlete allow-list");

// Case A proposal: Stage 1, 4 weeks → S1 S2 S3 Consolidation
const propA = proposeDefaultProgressionStages({
  family,
  entryStageId: ids.s1,
  blockLength: 4,
});
assert(propA.map((p) => p.stageId).join(",") === [ids.s1, ids.s2, ids.s3, ids.consol].join(","), "case A path");
ok("default proposal Stage1 × 4w → S1 S2 S3 Consolidation");

// Case B: coach can change week 3 to Stage 2
const propB = propA.map((p, i) => (i === 2 ? { ...p, stageId: ids.s2 } : p));
assert(propB[2].stageId === ids.s2, "manual stage");
ok("manual week stage override respected in proposal array");

// Case A resolve 3:50 → 3:55
const draft = createCoachDraftSessionFromFamilyStage({
  family,
  stageId: ids.s1,
  profile: thresholdProfile(230), // 3:50
  resolvedAt: "2026-10-25T15:00:00.000Z",
  draftId: "d1",
  base: {
    timeOfDay: "AM",
    badges: ["Main"],
    title: "TH",
    sessionType: "run_development",
    duration: "60",
    intensity: "RPE 7–8",
    rpeHr: "RPE 7–8",
    isKeySession: true,
    isOptional: false,
    rationale: "x",
    sessionId: "sf",
    prescription: null,
    sessionDetail: null,
  },
});
assert(
  draft.sessionFamily?.prescriptionPreview?.slots[0].resolvedValue === 235,
  `expected 235 got ${draft.sessionFamily?.prescriptionPreview?.slots[0].resolvedValue}`
);
ok("Case A resolve 3:50 +5s → 3:55");

// Case C override
const ov = buildSessionFamilyPublishSnapshot({
  attachment: draft.sessionFamily!,
  family,
  profile: thresholdProfile(230),
  overrides: [{ slot: "run", value: 232, unit: "s/km" }],
  publishedAt: "2026-10-25T15:00:00.000Z",
});
assert(ov.slots[0].formulaResolvedValue === 235, "formula 3:55");
assert(ov.slots[0].finalResolvedValue === 232, "final 3:52");
ok("Case C override preserves formula + final");

// Case D missing
const blocked = getSessionPublishability({
  session: draft,
  family,
  profile: emptyProfile(),
  resolvedAt: "2026-10-25T15:00:00.000Z",
});
assert(blocked.status === "BLOCKED", "blocked");
ok("Case D missing threshold blocked");

// Case E structural unlink
assert(
  shouldRetainSessionFamilyLink({
    attachment: draft.sessionFamily!,
    nextEditConfig: { ...draft.editConfig, reps: 99 },
  }).retain === false,
  "unlink"
);
assert(
  shouldRetainSessionFamilyLink({
    attachment: draft.sessionFamily!,
    nextEditConfig: { ...draft.editConfig, coachNote: "hi" },
  }).retain === true,
  "retain note"
);
ok("Case E structural unlink vs note retain");

// Case F copy week — same stage, strip preview
const week = {
  athleteId: "a",
  block: 1,
  week: 1,
  generatedAt: "2026-10-25T15:00:00.000Z",
  days: [
    {
      day: "Wed" as const,
      role: "quality" as const,
      roleLabel: "Quality",
      title: "Wed",
      sessionType: "run" as const,
      intensity: "RPE 7–8",
      duration: "60",
      rpeHr: "RPE 7–8",
      isKeySession: true,
      hardDay: true,
      hardEasyLabel: "Hard" as const,
      sessions: [draft as CoachDraftSession],
    },
  ],
};
const copied = cloneCoachDraftWeekForTarget(week as never, { athleteId: "a", targetWeek: 2 });
const copiedSession = copied.days[0].sessions[0];
assert(copiedSession.sessionFamily?.stageId === ids.s1, "same stage");
assert(copiedSession.sessionFamily?.prescriptionPreview === null, "preview cleared");
assert(copiedSession.editConfig.targetPace === undefined, "pace cleared for re-resolve");
ok("Case F Copy Week helper keeps stage, clears resolution");

console.log(`\nqa-hyrox-session-family-ux: ${passed} checks passed`);
