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
  coachFamilySessionSubtitle,
  coachFamilySessionTitle,
  sanitizeAthleteSessionTitle,
} from "../app/lib/hyroxSessionFamilyAthleteCopy";
import { resolveLibrarySessionFamilyLink } from "../app/lib/hyroxSessionFamilyLibraryBridge";
import {
  proposeContinueProgressionStages,
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

// Library → family bridge + continue proposals (discoverability entry)
const link6x5 = resolveLibrarySessionFamilyLink({ id: "th-6x5", sessionLibraryId: "coach_th-6x5" });
assert(link6x5?.stage.id === ids.s2, "th-6x5 maps to Stage 2");
assert(link6x5?.family.id === family.id, "th-6x5 family");
const linkNoise = resolveLibrarySessionFamilyLink({ id: "unrelated-session" });
assert(linkNoise === null, "unmapped library → no family choice");
ok("Case A/B bridge: eligible library maps Stage 2; non-family null");

const assign4 = proposeDefaultProgressionStages({
  family,
  entryStageId: ids.s2,
  blockLength: 4,
});
assert(assign4[0]?.stageId === ids.s2, "assign starts at Stage 2");
assert(assign4.length === 4, "assign 4 weeks");

const continue4 = proposeContinueProgressionStages({
  family,
  currentStageId: ids.s2,
  blockLength: 4,
});
assert(continue4.every((p) => p.stageId !== ids.s2) || continue4[0]?.stageId === ids.s3, "continue skips duplicating Stage 2 as first apply");
assert(continue4.length === 3, `continue 4-week path → 3 future (got ${continue4.length})`);
assert(continue4[0]?.stageId === ids.s3, "first future is Stage 3");
ok("Case C continue: current Stage 2 not duplicated; future proposed");

assert(coachFamilySessionTitle(family.name) === family.name, "coach title is family name");
assert(
  coachFamilySessionSubtitle({
    stageKey: "stage_2",
    structureLine: "6 × 5 min · 2 min walk recovery",
  }).startsWith("Stage 2"),
  "coach subtitle has stage + structure"
);
assert(
  sanitizeAthleteSessionTitle(`${family.name} · Stage 2`) === "Threshold Intervals",
  "athlete title still sanitised"
);
ok("Case F coach hierarchy vs athlete-safe title");

console.log(`\nqa-hyrox-session-family-ux: ${passed} checks passed`);
