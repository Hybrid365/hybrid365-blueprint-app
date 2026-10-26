/**
 * Lossless StructuredWorkout ↔ builder editConfig round-trip QA.
 * Run: npx tsx scripts/qa-hyrox-structured-workout-adapters.ts
 */

import { BIKE_FTP_QUALITY_FAMILY } from "../app/lib/families/bikeFtpQuality";
import { FARMERS_CARRY_DURABILITY_FAMILY } from "../app/lib/families/farmersCarryDurability";
import { HYROX_COMPROMISED_RUN_FAMILY } from "../app/lib/families/hyroxCompromisedRun";
import { STRENGTH_LOWER_FOUNDATION_FAMILY } from "../app/lib/families/strengthLowerFoundation";
import { STRENGTH_UPPER_FOUNDATION_FAMILY } from "../app/lib/families/strengthUpperFoundation";
import { THRESHOLD_5MIN_REPEATS_FAMILY } from "../app/lib/families/threshold5MinRepeats";
import {
  coachEditConfigToStructuredWorkout,
  structuredWorkoutToCoachEditConfig,
  structuredWorkoutsEqual,
} from "../app/lib/hyroxSessionFamilyBuilderAdapter";
import {
  createCoachDraftSessionFromFamilyStage,
  applyEditConfigWithFamilyLink,
} from "../app/lib/hyroxSessionFamilyDraft";
import { listSessionFamilies } from "../app/lib/hyroxSessionFamilyRegistry";
import { assertValidSessionFamily } from "../app/lib/hyroxSessionFamilyValidate";
import type { StructuredWorkout } from "../app/lib/hyroxSessionFamilyTypes";
import type { HyroxAthletePerformanceProfile } from "../app/lib/hyroxBenchmarkProfile";

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

function emptyProfile(): HyroxAthletePerformanceProfile {
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
  };
}

function roundTrip(name: string, workout: StructuredWorkout, kind?: Parameters<typeof structuredWorkoutToCoachEditConfig>[1]["kind"]) {
  const { editConfig, gaps } = structuredWorkoutToCoachEditConfig(workout, {
    sessionName: name,
    kind,
  });
  check(`${name}: embeds structuredWorkout`, Boolean(editConfig.structuredWorkout));
  const back = coachEditConfigToStructuredWorkout(editConfig);
  check(`${name}: round-trip equal`, Boolean(back) && structuredWorkoutsEqual(workout, back!));
  // UI may note multi-block partial — that is OK if SoT embedded
  const fatal = gaps.filter((g) => g.code === "empty_blocks" || g.code === "unknown_block");
  check(`${name}: no fatal adapter gaps`, fatal.length === 0);
  return editConfig;
}

// Registry validates
for (const f of listSessionFamilies()) {
  assertValidSessionFamily(f);
}
check("registry families validate", listSessionFamilies().length >= 14);

// Repeat (threshold)
{
  const stage = THRESHOLD_5MIN_REPEATS_FAMILY.stages[0];
  roundTrip("repeat/threshold", stage.structuredWorkout, "threshold_run");
}

// Station round (HYROX + farmers)
{
  const hyrox = HYROX_COMPROMISED_RUN_FAMILY.stages[0].structuredWorkout;
  const cfg = roundTrip("station_round/hyrox", hyrox, "compromised");
  const hyroxBlock = hyrox.blocks[0];
  check(
    "station_round preserves rounds",
    hyroxBlock.type === "station_round" && cfg.rounds === hyroxBlock.rounds
  );
  const farmers = FARMERS_CARRY_DURABILITY_FAMILY.stages[1].structuredWorkout;
  roundTrip("station_round/farmers", farmers, "compromised");
}

// Strength
{
  const lower = STRENGTH_LOWER_FOUNDATION_FAMILY.stages[0].structuredWorkout;
  const cfg = roundTrip("strength/lower", lower, "strength_endurance");
  check(
    "strength embeds structuredExercises",
    (cfg.structuredExercises?.length ?? 0) >= 1
  );
  const upper = STRENGTH_UPPER_FOUNDATION_FAMILY.stages[0].structuredWorkout;
  roundTrip("strength/upper", upper, "strength_endurance");
}

// Bike continuous/repeat
{
  const bike = BIKE_FTP_QUALITY_FAMILY.stages[0].structuredWorkout;
  roundTrip("repeat/bike", bike, "erg_interval");
}

// Mixed ordering: multi-block workout preserves full AST even if UI maps first block
{
  const mixed: StructuredWorkout = {
    warmup: ["WU"],
    blocks: [
      {
        type: "repeat",
        reps: 2,
        work: { kind: "time", value: 300, unit: "sec" },
        recoveries: [{ durationSeconds: 90, type: "jog" }],
      },
      {
        type: "station_round",
        rounds: 3,
        station: { name: "sled push", note: "coach load" },
        recoveries: [{ durationSeconds: 60, type: "walk" }],
      },
    ],
    cooldown: ["CD"],
    guidance: ["Mixed"],
  };
  const { editConfig, gaps } = structuredWorkoutToCoachEditConfig(mixed, {
    sessionName: "mixed",
  });
  check(
    "mixed: multi_block_ui_partial noted",
    gaps.some((g) => g.code === "multi_block_ui_partial")
  );
  const back = coachEditConfigToStructuredWorkout(editConfig)!;
  check("mixed: full block ordering preserved", back.blocks.length === 2 && structuredWorkoutsEqual(mixed, back));
}

// Draft → edit → re-embed path
{
  const family = HYROX_COMPROMISED_RUN_FAMILY;
  const stage = family.stages[0];
  const session = createCoachDraftSessionFromFamilyStage({
    family,
    stageId: stage.id,
    profile: emptyProfile(),
    resolvedAt: "2026-10-25T12:00:00.000Z",
    draftId: "d-adapter-1",
    base: {
      timeOfDay: "AM",
      badges: ["Main"],
      sessionType: "run_development",
      duration: "50 min",
      intensity: "RPE 7–8",
      rpeHr: "RPE 7–8",
      isKeySession: true,
      isOptional: false,
      rationale: "hyrox",
      sessionId: "family-hyrox",
      prescription: null,
      sessionDetail: null,
      title: "Compromised Running",
    },
  });
  check("draft embeds sessionFamily.structuredWorkout", Boolean(session.sessionFamily?.structuredWorkout));
  check("draft editConfig embeds structuredWorkout", Boolean(session.editConfig?.structuredWorkout));

  const edited = applyEditConfigWithFamilyLink(session, {
    ...session.editConfig!,
    coachNote: "manual tweak",
  });
  const back = coachEditConfigToStructuredWorkout(edited.editConfig!);
  check(
    "edit retains structuredWorkout when not unlinked",
    Boolean(back) && structuredWorkoutsEqual(stage.structuredWorkout, back!)
  );
}

// Recoveries survive
{
  const w: StructuredWorkout = {
    warmup: [],
    blocks: [
      {
        type: "repeat",
        reps: 4,
        work: { kind: "time", value: 300, unit: "sec" },
        recoveries: [
          { durationSeconds: 90, type: "jog", note: "shakeout" },
          { durationSeconds: 60, type: "walk" },
        ],
      },
    ],
    cooldown: [],
    guidance: [],
  };
  const cfg = structuredWorkoutToCoachEditConfig(w, { sessionName: "rec" }).editConfig;
  check(
    "structured recoveries survive",
    (cfg.structuredRecoveries?.length ?? 0) === 2 &&
      cfg.structuredRecoveries![0].note === "shakeout"
  );
}

console.log(`\nstructured-workout-adapters: ${passed} checks`);
