/**
 * QA: SessionFamily builder adapters + draft/publish/copy domain (slice 2).
 * Run: npx tsx scripts/qa-hyrox-session-family-builder.ts
 */

import type { HyroxAthletePerformanceProfile } from "../app/lib/hyroxBenchmarkProfile";
import type { CoachDraftSession } from "../app/lib/hyroxCoachProgrammeDraft";
import {
  THRESHOLD_5MIN_REPEATS_FAMILY,
  THRESHOLD_5MIN_STAGE_IDS,
} from "../app/lib/families/threshold5MinRepeats";
import {
  coachEditConfigToStructuredWorkout,
  structuredWorkoutToCoachEditConfig,
} from "../app/lib/hyroxSessionFamilyBuilderAdapter";
import {
  assertSameStageNotProgressed,
  autoCarryFamilyLinkedDraftSession,
  copyFamilyLinkedDraftSession,
} from "../app/lib/hyroxSessionFamilyCopyCarry";
import {
  applyEditConfigWithFamilyLink,
  createCoachDraftSessionFromFamilyStage,
  refreshFamilyLinkedDraftPreview,
} from "../app/lib/hyroxSessionFamilyDraft";
import {
  buildSessionFamilyPublishSnapshot,
  embedSessionFamilyPublishInPrescription,
  getSessionPublishability,
  readSessionFamilyPublishFromPrescription,
} from "../app/lib/hyroxSessionFamilyPublish";
import { shouldRetainSessionFamilyLink } from "../app/lib/hyroxSessionFamilyUnlink";
import { assertValidSessionFamily } from "../app/lib/hyroxSessionFamilyValidate";

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

const family = THRESHOLD_5MIN_REPEATS_FAMILY;
const ids = THRESHOLD_5MIN_STAGE_IDS;
const T0 = "2026-10-25T15:00:00.000Z";
const T1 = "2026-10-25T16:00:00.000Z";

assertValidSessionFamily(family);

function baseFields(title: string) {
  return {
    timeOfDay: "AM" as const,
    badges: ["Main" as const],
    title,
    sessionType: "run_development" as const,
    duration: "60 min",
    intensity: "RPE 7–8",
    rpeHr: "RPE 7–8",
    isKeySession: true,
    isOptional: false,
    rationale: "threshold",
    sessionId: "family-threshold",
    prescription: null,
    sessionDetail: null,
  };
}

function draftFromStage(stageId: string, pace: number, draftId: string): CoachDraftSession {
  return createCoachDraftSessionFromFamilyStage({
    family,
    stageId,
    profile: thresholdProfile(pace),
    resolvedAt: T0,
    draftId,
    base: baseFields("Threshold"),
  });
}

// ---------------------------------------------------------------------------
// Adapter S1/S2/S3
// ---------------------------------------------------------------------------

for (const stageId of [ids.s1, ids.s2, ids.s3]) {
  const stage = family.stages.find((s) => s.id === stageId)!;
  const adapted = structuredWorkoutToCoachEditConfig(stage.structuredWorkout, {
    sessionName: stage.label,
    kind: "threshold_run",
    thresholdMinutes: stage.qualityVolume?.thresholdMinutes,
  });
  const repeat = stage.structuredWorkout.blocks[0];
  assert(repeat.type === "repeat", "repeat");
  assert(adapted.editConfig.reps === repeat.reps, `${stageId} reps`);
  assert(adapted.editConfig.repDurationMinutes === 5, `${stageId} duration`);
  assert(
    adapted.editConfig.structuredRecoveries?.length === repeat.recoveries.length,
    `${stageId} recoveries length`
  );
  assert(
    adapted.editConfig.structuredRecoveries?.[0].type === repeat.recoveries[0].type,
    `${stageId} recovery type`
  );
  const roundTrip = coachEditConfigToStructuredWorkout(adapted.editConfig);
  assert(roundTrip != null, `${stageId} round-trip`);
  assert(roundTrip!.blocks[0].type === "repeat", `${stageId} rt block`);
  assert(
    (roundTrip!.blocks[0] as { reps: number }).reps === repeat.reps,
    `${stageId} rt reps`
  );
}
ok("adapter: Stage 1/2/3 StructuredWorkout → editConfig → round-trip");

const s3 = family.stages.find((s) => s.id === ids.s3)!;
const s3Adapted = structuredWorkoutToCoachEditConfig(s3.structuredWorkout, {
  sessionName: s3.label,
});
assert(
  s3Adapted.editConfig.structuredRecoveries?.length === 2 &&
    s3Adapted.editConfig.structuredRecoveries[0].durationSeconds === 60 &&
    s3Adapted.editConfig.structuredRecoveries[0].type === "walk" &&
    s3Adapted.editConfig.structuredRecoveries[1].type === "jog",
  "compound recovery structured"
);
assert(
  s3Adapted.derivedRecoveryLabel?.includes("60 sec walk") &&
    s3Adapted.derivedRecoveryLabel?.includes("60 sec jog"),
  "compound recovery label"
);
ok("compound recovery 60 walk + 60 jog remains structured");

// ---------------------------------------------------------------------------
// Draft family metadata
// ---------------------------------------------------------------------------

const draft = draftFromStage(ids.s2, 205, "d-s2");
assert(draft.sessionFamily?.familyId === family.id, "familyId");
assert(draft.sessionFamily?.stageId === ids.s2, "stageId");
assert(draft.sessionFamily?.familyDefinitionVersion === 1, "definitionVersion");
assert(draft.sessionFamily?.prescriptionPreview?.slots[0].resolvedValue === 210, "preview 3:30");
assert(draft.editConfig.reps === 6, "draft reps");
assert(draft.editConfig.structuredRecoveries?.[0].durationSeconds === 120, "draft recovery");
ok("draft retains familyId/stageId and live preview");

// ---------------------------------------------------------------------------
// Non-structural vs structural unlink
// ---------------------------------------------------------------------------

const noteEdit = {
  ...draft.editConfig,
  coachNote: "Hold even splits",
  sessionName: "Threshold AM",
  warmUpLines: ["12 min easy"],
};
const noteDecision = shouldRetainSessionFamilyLink({
  attachment: draft.sessionFamily!,
  nextEditConfig: noteEdit,
});
assert(noteDecision.retain === true, `note retain: ${noteDecision.reason}`);
const afterNote = applyEditConfigWithFamilyLink(draft, noteEdit);
assert(afterNote.sessionFamily?.stageId === ids.s2, "link retained after note edit");
ok("non-structural edit retains family link");

const structuralEdit = {
  ...draft.editConfig,
  reps: 8,
  repDurationMinutes: 3,
};
const structuralDecision = shouldRetainSessionFamilyLink({
  attachment: draft.sessionFamily!,
  nextEditConfig: structuralEdit,
});
assert(structuralDecision.retain === false, "structural should unlink");
const afterStructural = applyEditConfigWithFamilyLink(draft, structuralEdit);
assert(afterStructural.sessionFamily == null, "link removed");
ok("structural edit removes family link");

const recoveryEdit = {
  ...draft.editConfig,
  structuredRecoveries: [
    { durationSeconds: 60, type: "walk" as const },
    { durationSeconds: 60, type: "jog" as const },
  ],
};
assert(
  shouldRetainSessionFamilyLink({
    attachment: draft.sessionFamily!,
    nextEditConfig: recoveryEdit,
  }).retain === false,
  "recovery change unlinks"
);
ok("recovery structure change unlinks");

// ---------------------------------------------------------------------------
// Preview updates when benchmark changes; publish freezes
// ---------------------------------------------------------------------------

assert(draft.sessionFamily!.prescriptionPreview!.slots[0].resolvedValue === 210, "initial 210");
const refreshed = refreshFamilyLinkedDraftPreview(
  draft,
  family,
  thresholdProfile(200), // 3:20
  T1
);
assert(
  refreshed.sessionFamily!.prescriptionPreview!.slots[0].resolvedValue === 205,
  `preview after benchmark change expected 205 got ${refreshed.sessionFamily!.prescriptionPreview!.slots[0].resolvedValue}`
);
ok("draft preview updates when threshold moves 3:25→3:20 (+5 → 3:25)");

const pub = buildSessionFamilyPublishSnapshot({
  attachment: draft.sessionFamily!,
  family,
  profile: thresholdProfile(205),
  publishedAt: T0,
});
assert(pub.slots[0].finalResolvedValue === 210, "publish 210");
assert(pub.slots[0].formulaResolvedValue === 210, "formula 210");
assert(pub.stageId === ids.s2, "publish stage");

const embedded = embedSessionFamilyPublishInPrescription(
  { editConfig: draft.editConfig, objective: "x" },
  pub
);
const readBack = readSessionFamilyPublishFromPrescription(embedded);
assert(readBack?.slots[0].finalResolvedValue === 210, "embedded snapshot");

// Simulate benchmark change after publish — frozen snapshot unchanged
const laterPreview = refreshFamilyLinkedDraftPreview(
  draft,
  family,
  thresholdProfile(200),
  T1
);
assert(readBack!.slots[0].finalResolvedValue === 210, "published immutable vs later profile");
assert(
  laterPreview.sessionFamily!.prescriptionPreview!.slots[0].resolvedValue === 205,
  "draft may update independently"
);
ok("publish snapshot immutable when benchmark later changes");

// ---------------------------------------------------------------------------
// Coach override provenance
// ---------------------------------------------------------------------------

const overridePub = buildSessionFamilyPublishSnapshot({
  attachment: draft.sessionFamily!,
  family,
  profile: thresholdProfile(205),
  overrides: [{ slot: "run", value: 207, unit: "s/km" }], // 3:27
  publishedAt: T0,
});
assert(overridePub.slots[0].formulaResolvedValue === 210, "formula stays 3:30");
assert(overridePub.slots[0].finalResolvedValue === 207, "final 3:27");
assert(overridePub.slots[0].snapshot.source === "coach_override", "source override");
assert(overridePub.slots[0].snapshot.expression === "@THRESHOLD +5s/km", "rule expression kept");
assert(overridePub.publishability.status === "PUBLISHABLE_WITH_COACH_OVERRIDE", "status");
ok("coach override preserves formula 3:30 + final 3:27");

// ---------------------------------------------------------------------------
// Missing anchor
// ---------------------------------------------------------------------------

const blocked = getSessionPublishability({
  session: draft,
  family,
  profile: emptyProfile(),
  resolvedAt: T0,
});
assert(blocked.status === "BLOCKED", "blocked");
assert(blocked.missingAnchors.includes("threshold_pace"), "missing anchor listed");
ok("missing anchor blocked honestly");

const overrideMissing = getSessionPublishability({
  session: draft,
  family,
  profile: emptyProfile(),
  overrides: [{ slot: "run", value: 220, unit: "s/km" }],
  resolvedAt: T0,
});
assert(
  overrideMissing.status === "PUBLISHABLE_WITH_COACH_OVERRIDE",
  `override missing status ${overrideMissing.status}`
);
ok("missing anchor + override → PUBLISHABLE_WITH_COACH_OVERRIDE");

// ---------------------------------------------------------------------------
// Copy / Auto-Carry — same stage, re-resolve
// ---------------------------------------------------------------------------

const copied = copyFamilyLinkedDraftSession({
  source: draft,
  newDraftId: "d-copy",
  family,
  profile: thresholdProfile(250), // 4:10 → 4:15
  resolvedAt: T1,
});
assertSameStageNotProgressed(draft, copied);
assert(copied.sessionFamily?.stageId === ids.s2, "copy stage 2");
assert(copied.draftId === "d-copy", "new draft id");
assert(
  copied.sessionFamily?.prescriptionPreview?.slots[0].resolvedValue === 255,
  "copy re-resolved to 255"
);
assert(
  draft.sessionFamily?.prescriptionPreview?.slots[0].resolvedValue === 210,
  "source preview unchanged"
);
ok("Copy Week helper: Stage 2 → Stage 2, re-resolves, no auto-progress");

const carried = autoCarryFamilyLinkedDraftSession({
  source: draft,
  newDraftId: "d-carry",
  family,
  profile: thresholdProfile(205),
  resolvedAt: T1,
});
assertSameStageNotProgressed(draft, carried);
assert(carried.sessionFamily?.stageId === ids.s2, "carry same stage");
ok("Auto-Carry helper: same-stage behaviour");

// ---------------------------------------------------------------------------
// Legacy draft without family remains valid
// ---------------------------------------------------------------------------

const legacy: CoachDraftSession = {
  ...baseFields("Easy Run"),
  draftId: "legacy-1",
  coachNote: "",
  editConfig: {
    kind: "easy_aerobic",
    sessionName: "Easy Run",
    durationMinutes: 45,
  },
  sessionFamily: null,
};
assert(legacy.sessionFamily == null, "legacy has no family");
const legacyPub = getSessionPublishability({
  session: legacy,
  profile: emptyProfile(),
  resolvedAt: T0,
});
assert(legacyPub.status === "PUBLISHABLE", "legacy publishable without family");
ok("legacy draft without family fields remains valid");

console.log(`\nqa-hyrox-session-family-builder: ${passed} checks passed`);
