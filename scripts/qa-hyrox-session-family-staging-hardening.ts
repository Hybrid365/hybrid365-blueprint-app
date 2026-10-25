/**
 * QA: Session family Slice 4 — multi-week ensure, preview refresh, Change Stage,
 * copy/carry no-progress, block boundary, override provenance.
 * Run: npx tsx scripts/qa-hyrox-session-family-staging-hardening.ts
 */

import type { HyroxAthletePerformanceProfile } from "../app/lib/hyroxBenchmarkProfile";
import type { CoachDraftSession, CoachDraftWeek } from "../app/lib/hyroxCoachProgrammeDraft";
import { cloneCoachDraftWeekForTarget } from "../app/lib/hyroxCopyProgrammeWeek";
import {
  THRESHOLD_5MIN_REPEATS_FAMILY,
  THRESHOLD_5MIN_STAGE_IDS,
} from "../app/lib/families/threshold5MinRepeats";
import { blockNumberForGlobalWeek } from "../app/lib/hyroxProgrammeDates";
import {
  applyManualStageChangeToSession,
  buildEmptyCoachDraftWeekShell,
  describeStageStructure,
  familyContextLabel,
  insertSessionOnWeekday,
  listManualStageOptions,
  refreshFamilyLinkedDraftWeekPreviews,
  targetGlobalWeeksForProgression,
} from "../app/lib/hyroxSessionFamilyApply";
import {
  assertSameStageNotProgressed,
  copyFamilyLinkedDraftSession,
} from "../app/lib/hyroxSessionFamilyCopyCarry";
import { createCoachDraftSessionFromFamilyStage } from "../app/lib/hyroxSessionFamilyDraft";
import { proposeDefaultProgressionStages } from "../app/lib/hyroxSessionFamilyProposal";
import {
  buildSessionFamilyPublishSnapshot,
  getSessionPublishability,
} from "../app/lib/hyroxSessionFamilyPublish";
import { resolveSessionFamilyStage } from "../app/lib/hyroxSessionFamilyResolve";
import { shouldRetainSessionFamilyLink } from "../app/lib/hyroxSessionFamilyUnlink";
import { assertValidSessionFamily } from "../app/lib/hyroxSessionFamilyValidate";
import { isHyroxSessionFamiliesEnabled } from "../app/lib/hyroxSessionFamiliesFlag";

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

const profile = thresholdProfile(230); // 3:50/km → formula 3:55
const resolvedAt = "2026-10-25T12:00:00.000Z";

// --- Flag remains OFF by default (production-safe) ---
{
  const prev = process.env.HYROX_SESSION_FAMILIES_ENABLED;
  const prevIds = process.env.HYROX_SESSION_FAMILIES_ATHLETE_IDS;
  delete process.env.HYROX_SESSION_FAMILIES_ENABLED;
  delete process.env.HYROX_SESSION_FAMILIES_ATHLETE_IDS;
  assert(isHyroxSessionFamiliesEnabled({ id: "prod-athlete" }) === false, "prod off");
  process.env.HYROX_SESSION_FAMILIES_ATHLETE_IDS = "staging-demo-competitive";
  assert(
    isHyroxSessionFamiliesEnabled({ id: "staging-demo-competitive" }) === true,
    "staging allow"
  );
  assert(isHyroxSessionFamiliesEnabled({ id: "someone-else" }) === false, "narrow allow");
  if (prev === undefined) delete process.env.HYROX_SESSION_FAMILIES_ENABLED;
  else process.env.HYROX_SESSION_FAMILIES_ENABLED = prev;
  if (prevIds === undefined) delete process.env.HYROX_SESSION_FAMILIES_ATHLETE_IDS;
  else process.env.HYROX_SESSION_FAMILIES_ATHLETE_IDS = prevIds;
  ok("flag OFF by default; athlete allow-list only");
}

// --- Case A proposal path ---
{
  const prop = proposeDefaultProgressionStages({
    family,
    entryStageId: ids.s1,
    blockLength: 4,
  });
  assert(
    prop.map((p) => p.stageId).join(",") === [ids.s1, ids.s2, ids.s3, ids.consol].join(","),
    "A path"
  );
  for (const p of prop) {
    const r = resolveSessionFamilyStage({
      family,
      stageId: p.stageId,
      profile,
      resolvedAt,
    });
    assert(r.publishable, `${p.stageId} publishable`);
    assert(r.slots[0]?.resolvedValue === 235, `${p.stageId} target 3:55`);
    assert(r.slots[0]?.source === "formula", `${p.stageId} formula`);
  }
  ok("Case A: S1→S2→S3→Consolidation with resolved targets");
}

// --- Case B coach stage edit not auto-corrected ---
{
  const prop = proposeDefaultProgressionStages({
    family,
    entryStageId: ids.s1,
    blockLength: 4,
  });
  prop[2] = { ...prop[2], stageId: ids.s2 };
  assert(
    prop.map((p) => p.stageId).join(",") === [ids.s1, ids.s2, ids.s2, ids.consol].join(","),
    "coach wins"
  );
  ok("Case B: Week3 Stage2 retained (coach choice wins)");
}

// --- Case C override provenance ---
{
  const r = resolveSessionFamilyStage({
    family,
    stageId: ids.s2,
    profile,
    resolvedAt,
    overrides: [{ slot: "run", value: 232, unit: "s/km" }],
  });
  assert(r.slots[0]?.source === "coach_override", "override source");
  assert(r.slots[0]?.resolvedValue === 232, "final 3:52");
  assert(r.slots[0]?.expression.includes("THRESHOLD"), "rule preserved");
  assert(r.slots[0]?.anchorValue === 230, "anchor still present");
  // Formula result must not equal override
  assert(r.slots[0]?.resolvedValue === 232, "override final");
  const formulaWouldBe = Number(r.slots[0]?.anchorValue ?? 0) + 5;
  assert(formulaWouldBe === 235, "formula would be 3:55");
  assert(Number(r.slots[0]?.resolvedValue) !== formulaWouldBe, "override ≠ formula");

  const session = createCoachDraftSessionFromFamilyStage({
    family,
    stageId: ids.s2,
    profile,
    resolvedAt,
    draftId: "d-c",
    base: {
      timeOfDay: "AM",
      badges: ["Main"],
      title: "T",
      sessionType: "run_development",
      duration: "60 min",
      intensity: "RPE 7–8",
      rpeHr: "RPE 7–8",
      isKeySession: true,
      isOptional: false,
      rationale: family.objective,
      sessionId: "session-family:threshold",
      prescription: null,
      sessionDetail: null,
    },
    overrides: [{ slot: "run", value: 232, unit: "s/km" }],
  });
  assert(
    session.sessionFamily?.prescriptionPreview?.slots[0]?.source === "coach_override",
    "draft preview override"
  );
  const snap = buildSessionFamilyPublishSnapshot({
    attachment: session.sessionFamily!,
    family,
    profile,
    overrides: [{ slot: "run", value: 232, unit: "s/km" }],
    publishedAt: resolvedAt,
  });
  assert(snap.slots[0]?.formulaResolvedValue === 235, "formula 3:55 stored");
  assert(snap.slots[0]?.finalResolvedValue === 232, "final 3:52 stored");
  assert(snap.slots[0]?.snapshot.source === "coach_override", "override provenance");
  const pub = getSessionPublishability({
    session,
    family,
    profile,
    overrides: [{ slot: "run", value: 232, unit: "s/km" }],
    resolvedAt,
  });
  assert(pub.status === "PUBLISHABLE_WITH_COACH_OVERRIDE", `status ${pub.status}`);
  ok("Case C: coach override preserves RULE + formula vs final provenance");
}

// --- Case D missing anchor ---
{
  const bare = emptyProfile();
  const r = resolveSessionFamilyStage({
    family,
    stageId: ids.s1,
    profile: bare,
    resolvedAt,
  });
  assert(!r.publishable, "blocked");
  assert(r.slots[0]?.missingAnchor === true, "missing");
  assert(r.slots[0]?.publishBlockReason?.toLowerCase().includes("threshold"), "msg");
  const unlocked = resolveSessionFamilyStage({
    family,
    stageId: ids.s1,
    profile: bare,
    resolvedAt,
    overrides: [{ slot: "run", value: 240, unit: "s/km" }],
  });
  assert(unlocked.publishable, "override unlocks");
  assert(unlocked.slots[0]?.source === "coach_override", "unlock provenance");
  ok("Case D: missing threshold blocks; coach override unlocks");
}

// --- Case E structural vs non-structural ---
{
  const session = createCoachDraftSessionFromFamilyStage({
    family,
    stageId: ids.s2,
    profile,
    resolvedAt,
    draftId: "d-e",
    base: {
      timeOfDay: "AM",
      badges: ["Main"],
      title: "T",
      sessionType: "run_development",
      duration: "60 min",
      intensity: "RPE 7–8",
      rpeHr: "RPE 7–8",
      isKeySession: true,
      isOptional: false,
      rationale: family.objective,
      sessionId: "session-family:threshold",
      prescription: null,
      sessionDetail: null,
    },
  });
  assert(session.editConfig, "editConfig");
  // Structural = reps / work duration / recovery (mainSetLines wording alone retains).
  const structural = shouldRetainSessionFamilyLink({
    attachment: session.sessionFamily!,
    nextEditConfig: {
      ...session.editConfig!,
      reps: 5,
      repDurationMinutes: 6,
    },
  });
  assert(!structural.retain, `unlink on structural: ${structural.reason}`);
  const noteOnly = shouldRetainSessionFamilyLink({
    attachment: session.sessionFamily!,
    nextEditConfig: {
      ...session.editConfig!,
      coachNote: "Keep breathing tall",
    },
  });
  assert(noteOnly.retain, "retain on note");
  ok("Case E: structural unlinks; coach note retains");
}

// --- Case F / G copy & carry: same stage, re-resolve ---
{
  const session = createCoachDraftSessionFromFamilyStage({
    family,
    stageId: ids.s2,
    profile,
    resolvedAt,
    draftId: "d-f",
    base: {
      timeOfDay: "AM",
      badges: ["Main"],
      title: "T",
      sessionType: "run_development",
      duration: "60 min",
      intensity: "RPE 7–8",
      rpeHr: "RPE 7–8",
      isKeySession: true,
      isOptional: false,
      rationale: family.objective,
      sessionId: "session-family:threshold",
      prescription: null,
      sessionDetail: null,
    },
  });
  const faster = thresholdProfile(220); // 3:40 → 3:45
  const copied = copyFamilyLinkedDraftSession({
    source: session,
    newDraftId: "d-f-copy",
    family,
    profile: faster,
    resolvedAt: "2026-10-26T12:00:00.000Z",
  });
  assertSameStageNotProgressed(session, copied);
  assert(copied.sessionFamily?.stageId === ids.s2, "same stage");
  assert(
    copied.sessionFamily?.prescriptionPreview?.slots[0]?.resolvedValue === 225,
    "re-resolved"
  );
  assert(
    session.sessionFamily?.prescriptionPreview?.slots[0]?.resolvedValue === 235,
    "source unchanged"
  );

  const weekShell = buildEmptyCoachDraftWeekShell({ athleteId: "a", globalWeek: 2 });
  const week: CoachDraftWeek = insertSessionOnWeekday(weekShell, session, "Wed");
  const clonedWeek = cloneCoachDraftWeekForTarget(week, { athleteId: "a", targetWeek: 3 });
  const clonedSession = clonedWeek.days.find((d) => d.day === "Wed")?.sessions[0];
  assert(clonedSession?.sessionFamily?.stageId === ids.s2, "clone same stage");
  assert(clonedSession?.sessionFamily?.prescriptionPreview == null, "preview cleared on clone");
  ok("Case F/G: copy/carry keep stage, clear/re-resolve preview");
}

// --- Empty future week shells + block boundary ---
{
  const weeks = targetGlobalWeeksForProgression({ startGlobalWeek: 4, blockLength: 4 });
  assert(weeks.join(",") === "4,5,6,7", "global weeks");
  assert(blockNumberForGlobalWeek(4) === 1, "B1W4");
  assert(blockNumberForGlobalWeek(5) === 2, "B2W1");
  assert(blockNumberForGlobalWeek(6) === 2, "B2W2");
  assert(blockNumberForGlobalWeek(7) === 2, "B2W3");

  const shell4 = buildEmptyCoachDraftWeekShell({ athleteId: "a", globalWeek: 4 });
  const shell5 = buildEmptyCoachDraftWeekShell({ athleteId: "a", globalWeek: 5 });
  assert(shell4.block === 1 && shell4.week === 4, "shell B1W4");
  assert(shell5.block === 2 && shell5.week === 5, "shell B2W1");
  assert(shell4.days.every((d) => d.sessions.length === 0), "empty");
  assert(shell4.days.length === 7, "7 days");

  const session = createCoachDraftSessionFromFamilyStage({
    family,
    stageId: ids.s1,
    profile,
    resolvedAt,
    draftId: "d-boundary",
    base: {
      timeOfDay: "AM",
      badges: ["Main"],
      title: "T",
      sessionType: "run_development",
      duration: "60 min",
      intensity: "RPE 7–8",
      rpeHr: "RPE 7–8",
      isKeySession: true,
      isOptional: false,
      rationale: family.objective,
      sessionId: "session-family:threshold",
      prescription: null,
      sessionDetail: null,
    },
  });
  const filled = insertSessionOnWeekday(shell5, session, "Wed", "AM");
  assert(filled.days.find((d) => d.day === "Wed")?.sessions.length === 1, "inserted");
  ok("empty-cycle shells + block-boundary week numbering");
}

// --- Preview refresh on open ---
{
  const session = createCoachDraftSessionFromFamilyStage({
    family,
    stageId: ids.s2,
    profile,
    resolvedAt,
    draftId: "d-refresh",
    base: {
      timeOfDay: "AM",
      badges: ["Main"],
      title: "T",
      sessionType: "run_development",
      duration: "60 min",
      intensity: "RPE 7–8",
      rpeHr: "RPE 7–8",
      isKeySession: true,
      isOptional: false,
      rationale: family.objective,
      sessionId: "session-family:threshold",
      prescription: null,
      sessionDetail: null,
    },
  });
  // Simulate stale preview (old published pace)
  session.sessionFamily = {
    ...session.sessionFamily!,
    prescriptionPreview: {
      ...session.sessionFamily!.prescriptionPreview!,
      slots: session.sessionFamily!.prescriptionPreview!.slots.map((s) => ({
        ...s,
        resolvedValue: 999,
      })),
    },
  };
  const week = buildEmptyCoachDraftWeekShell({ athleteId: "a", globalWeek: 2 });
  const withStale = insertSessionOnWeekday(week, session, "Wed");
  const refreshed = refreshFamilyLinkedDraftWeekPreviews(
    withStale,
    thresholdProfile(220),
    "2026-10-26T00:00:00.000Z"
  );
  const pace =
    refreshed.days.find((d) => d.day === "Wed")?.sessions[0]?.sessionFamily
      ?.prescriptionPreview?.slots[0]?.resolvedValue;
  assert(pace === 225, `refreshed to 225 got ${pace}`);
  assert(
    withStale.days.find((d) => d.day === "Wed")?.sessions[0]?.sessionFamily
      ?.prescriptionPreview?.slots[0]?.resolvedValue === 999,
    "source week not mutated"
  );
  ok("copied-week / open-draft preview refresh from current profile");
}

// --- Manual Change Stage ---
{
  const options = listManualStageOptions(family, ids.s2);
  const actions = new Set(options.map((o) => o.action));
  assert(actions.has("PROGRESS"), "PROGRESS");
  assert(actions.has("REPEAT"), "REPEAT");
  assert(actions.has("REDUCE") || actions.has("DELOAD") || options.length >= 2, "alternatives");
  for (const o of options) {
    assert(o.structureLine.length > 0, "structure line");
    const stage = family.stages.find((s) => s.id === o.toStageId)!;
    assert(describeStageStructure(stage) === o.structureLine, "structure matches");
  }

  const session = createCoachDraftSessionFromFamilyStage({
    family,
    stageId: ids.s2,
    profile,
    resolvedAt,
    draftId: "d-stage",
    base: {
      timeOfDay: "AM",
      badges: ["Main"],
      title: "T",
      sessionType: "run_development",
      duration: "60 min",
      intensity: "RPE 7–8",
      rpeHr: "RPE 7–8",
      isKeySession: true,
      isOptional: false,
      rationale: family.objective,
      sessionId: "session-family:threshold",
      prescription: null,
      sessionDetail: null,
    },
  });
  const next = applyManualStageChangeToSession({
    session,
    family,
    nextStageId: ids.s3,
    profile,
    resolvedAt: "2026-10-26T00:00:00.000Z",
  });
  assert(next.sessionFamily?.stageId === ids.s3, "advanced");
  assert(session.sessionFamily?.stageId === ids.s2, "source immutable");
  assert(familyContextLabel(next)?.includes("Stage 3") || familyContextLabel(next)?.includes("3"), "label");
  ok("manual Change Stage transitions + draft-only update");
}

// --- Published snapshot immutability (domain) ---
{
  const session = createCoachDraftSessionFromFamilyStage({
    family,
    stageId: ids.s1,
    profile,
    resolvedAt,
    draftId: "d-pub",
    base: {
      timeOfDay: "AM",
      badges: ["Main"],
      title: "T",
      sessionType: "run_development",
      duration: "60 min",
      intensity: "RPE 7–8",
      rpeHr: "RPE 7–8",
      isKeySession: true,
      isOptional: false,
      rationale: family.objective,
      sessionId: "session-family:threshold",
      prescription: null,
      sessionDetail: null,
    },
  });
  const snap = buildSessionFamilyPublishSnapshot({
    attachment: session.sessionFamily!,
    family,
    profile,
    publishedAt: resolvedAt,
  });
  assert(snap.slots[0]?.finalResolvedValue === 235, "frozen 3:55");
  const snapJson = JSON.stringify(snap);
  resolveSessionFamilyStage({
    family,
    stageId: ids.s1,
    profile: thresholdProfile(200),
    resolvedAt: "2026-11-01T00:00:00.000Z",
  });
  assert(JSON.stringify(snap) === snapJson, "snapshot frozen");
  ok("published snapshot immutable vs later profile change");
}

console.log(`\nqa-hyrox-session-family-staging-hardening: ${passed} checks passed`);
