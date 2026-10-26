/**
 * Session Family expansion QA — A–T (pure / fixture).
 */
import { BIKE_FTP_QUALITY_FAMILY, BIKE_FTP_QUALITY_FAMILY_ID, BIKE_FTP_QUALITY_STAGE_IDS } from "../app/lib/families/bikeFtpQuality";
import { BURPEE_ECONOMY_FAMILY } from "../app/lib/families/burpeeEconomy";
import { EASY_LONG_RUN_VOLUME_FAMILY, EASY_LONG_RUN_STAGE_IDS } from "../app/lib/families/easyLongRunVolume";
import {
  FARMERS_CARRY_DURABILITY_FAMILY,
  FARMERS_CARRY_DURABILITY_FAMILY_ID,
  FARMERS_CARRY_DURABILITY_STAGE_IDS,
} from "../app/lib/families/farmersCarryDurability";
import {
  HYROX_COMPROMISED_RUN_FAMILY,
  HYROX_COMPROMISED_RUN_FAMILY_ID,
  HYROX_COMPROMISED_RUN_STAGE_IDS,
} from "../app/lib/families/hyroxCompromisedRun";
import { LUNGE_DURABILITY_FAMILY } from "../app/lib/families/lungeDurability";
import { ROW_THRESHOLD_INTERVALS_FAMILY, ROW_THRESHOLD_STAGE_IDS } from "../app/lib/families/rowThresholdIntervals";
import { SKI_THRESHOLD_INTERVALS_FAMILY, SKI_THRESHOLD_STAGE_IDS } from "../app/lib/families/skiThresholdIntervals";
import { SLED_PUSH_CAPACITY_FAMILY } from "../app/lib/families/sledPushCapacity";
import { STRENGTH_LOWER_FOUNDATION_FAMILY } from "../app/lib/families/strengthLowerFoundation";
import { STRENGTH_UPPER_FOUNDATION_FAMILY } from "../app/lib/families/strengthUpperFoundation";
import { TEMPO_AEROBIC_QUALITY_FAMILY, TEMPO_AEROBIC_STAGE_IDS } from "../app/lib/families/tempoAerobicQuality";
import { WALL_BALL_DENSITY_FAMILY } from "../app/lib/families/wallBallDensity";
import { recommendAdaptation } from "../app/lib/hyroxAdaptationRecommend";
import type { HyroxAthletePerformanceProfile } from "../app/lib/hyroxBenchmarkProfile";
import { mapVerbToAllowedFamilyTransition } from "../app/lib/hyroxAdaptationRecommend";
import {
  athleteFacingEasyLongTitle,
  athleteFacingSessionFamilyTitle,
  sanitizeAthleteSessionTitle,
} from "../app/lib/hyroxSessionFamilyAthleteCopy";
import { findLegacyMap } from "../app/lib/hyroxSessionFamilyLegacyMap";
import { isLibrarySessionFamilyEligible } from "../app/lib/hyroxSessionFamilyLibraryBridge";
import { listSessionFamilies, getSessionFamily } from "../app/lib/hyroxSessionFamilyRegistry";
import { resolveSessionFamilyStage } from "../app/lib/hyroxSessionFamilyResolve";
import { assertValidSessionFamily } from "../app/lib/hyroxSessionFamilyValidate";
import { buildFixtureComposerContext } from "../app/lib/hyroxWeekComposerFixtures";
import { proposeWeek } from "../app/lib/hyroxWeekComposerPropose";

let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    console.error(`✗ ${name}`);
    process.exitCode = 1;
    return;
  }
  console.log(`✓ ${name}`);
  passed += 1;
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

const ALL = [
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

for (const f of ALL) {
  assertValidSessionFamily(f);
}
check("all expansion families validate", true);
check("registry includes expansion", listSessionFamilies().length >= 14);

// A–D HYROX compromised edges
{
  const ids = HYROX_COMPROMISED_RUN_STAGE_IDS;
  const progress = mapVerbToAllowedFamilyTransition({
    familyId: HYROX_COMPROMISED_RUN_FAMILY_ID,
    fromStageId: ids.s1,
    desired: "PROGRESS",
  });
  check("A HYROX PROGRESS s1→s2", progress.suggestedNext?.toStageId === ids.s2);

  const repeat = mapVerbToAllowedFamilyTransition({
    familyId: HYROX_COMPROMISED_RUN_FAMILY_ID,
    fromStageId: ids.s2,
    desired: "REPEAT",
  });
  check("B HYROX REPEAT keeps s2", repeat.suggestedNext?.toStageId === ids.s2);

  const reduce = mapVerbToAllowedFamilyTransition({
    familyId: HYROX_COMPROMISED_RUN_FAMILY_ID,
    fromStageId: ids.s3,
    desired: "REDUCE",
  });
  check("C HYROX REDUCE s3→s2", reduce.suggestedNext?.toStageId === ids.s2);

  const deload = mapVerbToAllowedFamilyTransition({
    familyId: HYROX_COMPROMISED_RUN_FAMILY_ID,
    fromStageId: ids.s3,
    desired: "DELOAD",
  });
  check("D HYROX DELOAD", deload.suggestedNext?.toStageId === ids.deload);
}

// E station volume / F density
{
  const s2 = HYROX_COMPROMISED_RUN_FAMILY.stages.find((s) => s.id === HYROX_COMPROMISED_RUN_STAGE_IDS.s2)!;
  const s3 = HYROX_COMPROMISED_RUN_FAMILY.stages.find((s) => s.id === HYROX_COMPROMISED_RUN_STAGE_IDS.s3)!;
  const s4 = HYROX_COMPROMISED_RUN_FAMILY.stages.find((s) => s.id === HYROX_COMPROMISED_RUN_STAGE_IDS.s4)!;
  const b2 = s2.structuredWorkout.blocks[0];
  const b3 = s3.structuredWorkout.blocks[0];
  const b4 = s4.structuredWorkout.blocks[0];
  check(
    "E station/run volume change",
    b2.type === "station_round" &&
      b3.type === "station_round" &&
      b2.rounds === 5 &&
      b3.rounds === 5 &&
      b2.run?.kind === "distance" &&
      b3.run?.kind === "distance" &&
      b2.run.value === 400 &&
      b3.run.value === 800
  );
  check(
    "F density progression",
    b3.type === "station_round" &&
      b4.type === "station_round" &&
      (b3.recoveries?.[0]?.durationSeconds ?? 0) > (b4.recoveries?.[0]?.durationSeconds ?? 0) &&
      b4.rounds === 6
  );
}

// G tempo
{
  const p = mapVerbToAllowedFamilyTransition({
    familyId: TEMPO_AEROBIC_QUALITY_FAMILY.id,
    fromStageId: TEMPO_AEROBIC_STAGE_IDS.s1,
    desired: "PROGRESS",
  });
  check("G tempo PROGRESS", p.suggestedNext?.toStageId === TEMPO_AEROBIC_STAGE_IDS.s2);
}

// H easy volume / I long reduce
{
  const progress = mapVerbToAllowedFamilyTransition({
    familyId: EASY_LONG_RUN_VOLUME_FAMILY.id,
    fromStageId: EASY_LONG_RUN_STAGE_IDS.s1,
    desired: "PROGRESS",
  });
  check("H easy volume PROGRESS", progress.suggestedNext?.toStageId === EASY_LONG_RUN_STAGE_IDS.s2);
  const reduce = mapVerbToAllowedFamilyTransition({
    familyId: EASY_LONG_RUN_VOLUME_FAMILY.id,
    fromStageId: EASY_LONG_RUN_STAGE_IDS.s4,
    desired: "REDUCE",
  });
  check("I long-run REDUCE", reduce.suggestedNext?.toStageId === EASY_LONG_RUN_STAGE_IDS.s3);
}

// J Ski / K Row
{
  const ski = mapVerbToAllowedFamilyTransition({
    familyId: SKI_THRESHOLD_INTERVALS_FAMILY.id,
    fromStageId: SKI_THRESHOLD_STAGE_IDS.s1,
    desired: "PROGRESS",
  });
  check("J Ski PROGRESS", ski.suggestedNext?.toStageId === SKI_THRESHOLD_STAGE_IDS.s2);
  const row = mapVerbToAllowedFamilyTransition({
    familyId: ROW_THRESHOLD_INTERVALS_FAMILY.id,
    fromStageId: ROW_THRESHOLD_STAGE_IDS.s1,
    desired: "PROGRESS",
  });
  check("K Row PROGRESS", row.suggestedNext?.toStageId === ROW_THRESHOLD_STAGE_IDS.s2);
}

// L strength coach load authority
{
  const s1 = STRENGTH_LOWER_FOUNDATION_FAMILY.stages[0];
  const block = s1.structuredWorkout.blocks[0];
  check(
    "L strength coach load authority",
    block.type === "strength" &&
      block.exercises.every((e) => /coach/i.test(e.loadNote ?? "")) &&
      s1.prescriptionSlots.length === 0
  );
}

// M / N prescription anchors
{
  const profile = emptyProfile({
    hyroxRun: {
      benchmarkId: "b-hr",
      paceSecondsPerKm: 250,
      thresholdHr: null,
      resultDate: "2026-10-01",
      source: "coach_entered",
    },
  });
  const resolved = resolveSessionFamilyStage({
    family: HYROX_COMPROMISED_RUN_FAMILY,
    stageId: HYROX_COMPROMISED_RUN_STAGE_IDS.s2,
    profile,
    resolvedAt: "2026-10-25T12:00:00.000Z",
  });
  check("M prescription resolves with anchor", resolved.slots[0]?.missingAnchor === false);

  const missing = resolveSessionFamilyStage({
    family: HYROX_COMPROMISED_RUN_FAMILY,
    stageId: HYROX_COMPROMISED_RUN_STAGE_IDS.s2,
    profile: emptyProfile(),
    resolvedAt: "2026-10-25T12:00:00.000Z",
  });
  check(
    "N missing anchor does not invent",
    missing.slots[0]?.missingAnchor === true && missing.slots[0]?.resolvedValue == null
  );
}

// O athlete-safe titles
{
  check(
    "O athlete-safe HYROX title",
    athleteFacingSessionFamilyTitle(HYROX_COMPROMISED_RUN_FAMILY) === "Compromised Running"
  );
  check("O easy title", athleteFacingEasyLongTitle("stage_1") === "Easy Run");
  check("O long title", athleteFacingEasyLongTitle("stage_4") === "Long Run");
  check(
    "O strips Beginner/Advanced",
    !/Beginner|Advanced|Level 1/i.test(
      sanitizeAthleteSessionTitle("Beginner Intermediate Advanced Level 1 Compromised")
    )
  );
}

// P legacy library still usable
{
  check("P legacy map th-5x5", findLegacyMap("th-5x5")?.confidence === "high");
  check(
    "P hxspec-sled-to-run linked",
    isLibrarySessionFamilyEligible({ id: "hxspec-sled-to-run" })
  );
}

// Q same-day continuity (composer preserves day)
{
  const ctx = buildFixtureComposerContext({ reduceSat: true });
  const proposal = proposeWeek(ctx);
  const sat = proposal.sessions.find((s) => s.sourceSessionId === "s-sat");
  check("Q Saturday continuity", sat?.day === "Sat");
}

// R Week Composer selects valid HYROX family
{
  const ctx = buildFixtureComposerContext({ reduceSat: true });
  const proposal = proposeWeek(ctx);
  const sat = proposal.sessions.find((s) => s.sourceSessionId === "s-sat");
  check(
    "R Composer HYROX REDUCE uses family edge",
    sat?.action === "REDUCE" &&
      sat.familyId === HYROX_COMPROMISED_RUN_FAMILY_ID &&
      sat.toStageId === HYROX_COMPROMISED_RUN_STAGE_IDS.s1
  );
}

// S remaining gaps reported (Thu still unlinked)
{
  const ctx = buildFixtureComposerContext();
  ctx.instruction.structured.reduceDays = ["Thu"];
  ctx.instruction.structured.progressDays = [];
  const proposal = proposeWeek(ctx);
  check(
    "S Composer reports remaining gaps",
    proposal.libraryGaps.some((g) => g.code === "no_family")
  );
}

// T adaptation maps to valid family edges
{
  const rec = recommendAdaptation({
    session: {
      sessionId: "hx-1",
      sessionName: "Compromised",
      isKeySession: true,
      familyId: HYROX_COMPROMISED_RUN_FAMILY_ID,
      stageId: HYROX_COMPROMISED_RUN_STAGE_IDS.s2,
      stageLabel: "stage 2",
      execution: {
        completion: "complete",
        execution: "all",
        rpe: 6,
        control: "controlled",
        pain: "none",
        energy: null,
        legs: null,
        missedReason: null,
        athleteNote: null,
        actuals: null,
        source: "structured",
      },
    },
  });
  check(
    "T adaptation PROGRESS maps valid edge",
    rec.verb === "PROGRESS" &&
      rec.suggestedNext?.toStageId === HYROX_COMPROMISED_RUN_STAGE_IDS.s3
  );
}

check("registry getSessionFamily hyrox", getSessionFamily(HYROX_COMPROMISED_RUN_FAMILY_ID)?.id === HYROX_COMPROMISED_RUN_FAMILY_ID);

// U–W productionisation families
{
  const bikeProgress = mapVerbToAllowedFamilyTransition({
    familyId: BIKE_FTP_QUALITY_FAMILY_ID,
    fromStageId: BIKE_FTP_QUALITY_STAGE_IDS.s1,
    desired: "PROGRESS",
  });
  check("U bike PROGRESS s1→s2", bikeProgress.suggestedNext?.toStageId === BIKE_FTP_QUALITY_STAGE_IDS.s2);
  check(
    "U bike FTP prescription present",
    BIKE_FTP_QUALITY_FAMILY.stages[0].prescriptionSlots.some((s) => s.rule.basis === "ftp_watts")
  );

  const farmersProgress = mapVerbToAllowedFamilyTransition({
    familyId: FARMERS_CARRY_DURABILITY_FAMILY_ID,
    fromStageId: FARMERS_CARRY_DURABILITY_STAGE_IDS.s1,
    desired: "PROGRESS",
  });
  check(
    "V farmers PROGRESS",
    farmersProgress.suggestedNext?.toStageId === FARMERS_CARRY_DURABILITY_STAGE_IDS.s2
  );
  check(
    "V farmers athlete title",
    athleteFacingSessionFamilyTitle(FARMERS_CARRY_DURABILITY_FAMILY) === "Farmers Carry"
  );

  check(
    "W upper strength validates + title",
    getSessionFamily(STRENGTH_UPPER_FOUNDATION_FAMILY.id)?.id === STRENGTH_UPPER_FOUNDATION_FAMILY.id &&
      athleteFacingSessionFamilyTitle(STRENGTH_UPPER_FOUNDATION_FAMILY) === "Upper Strength"
  );
  check("W bike athlete title", athleteFacingSessionFamilyTitle(BIKE_FTP_QUALITY_FAMILY) === "Bike Intervals");
}

console.log(`\nqa-hyrox-session-family-expansion: ${passed} checks passed`);
