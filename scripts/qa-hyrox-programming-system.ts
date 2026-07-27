/**
 * QA: HYROX Team Programming System (post coaching-quality audit)
 * Run: npm run qa:hyrox-programming-system
 */

import { COACH_SESSION_LIBRARY, filterCoachLibrary } from "../app/lib/hyroxCoachSessionLibrary";
import { HYROX_VOLUME_BUILDER_COACH_SESSIONS } from "../app/lib/hyroxCoachSessionLibraryVolumeBuilders";
import { HYBRID_ENGINE_COACH_SESSIONS } from "../app/lib/hyroxCoachSessionLibraryHybridEngine";
import {
  deriveProgrammingBuilderHints,
  EMPTY_COACH_PERFORMANCE_PROFILE,
  getProgressionFamily,
  PROGRAMMING_PROGRESSION_FAMILIES,
  PROGRAMMING_PILLAR_TAXONOMY,
} from "../app/lib/hyrox-team/modules/programmingSystem";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

const ALL_PROGRAMMING = [
  ...HYROX_VOLUME_BUILDER_COACH_SESSIONS,
  ...HYBRID_ENGINE_COACH_SESSIONS,
];
const ID_SET = new Set(COACH_SESSION_LIBRARY.map((s) => s.id));

const VAGUE = [
  /work steadily/i,
  /repeat as needed/i,
  /moderate pace(?!\s*\()/i,
  /several rounds/i,
  /coach chooses volume/i,
];

{
  assert(HYROX_VOLUME_BUILDER_COACH_SESSIONS.length >= 20, "at least 20 volume builders");
  assert(
    HYROX_VOLUME_BUILDER_COACH_SESSIONS.some((s) => s.id === "vb-sled-pull-push-bbj-wb-l1"),
    "coach-brief core session present"
  );
  for (const s of HYROX_VOLUME_BUILDER_COACH_SESSIONS) {
    assert(s.category === "hyrox_volume_builders", `${s.id} category`);
    assert(s.programmingStandards, `${s.id} standards`);
    assert(s.progressionFamily && s.progressionLevel, `${s.id} progression meta`);
    assert(s.prescription.warmup.length >= 2, `${s.id} warmup`);
    assert(s.prescription.mainSet.length >= 3, `${s.id} mainSet`);
    assert(s.prescription.targetRPE, `${s.id} RPE`);
    assert(s.prescription.whatToRecord.length >= 2, `${s.id} logging`);
    const blob = [...s.prescription.mainSet, s.prescription.objective].join(" ");
    for (const re of VAGUE) {
      assert(!re.test(blob), `${s.id} vague language: ${re}`);
    }
  }
  ok("Volume builders executable prescriptions");
}

{
  assert(HYBRID_ENGINE_COACH_SESSIONS.length === 4, "4 hybrid engine sessions");
  for (const s of HYBRID_ENGINE_COACH_SESSIONS) {
    assert(s.category === "hybrid_engine", `${s.id} category`);
    assert(s.programmingStandards, `${s.id} standards`);
    assert(/\d+\s*min|\d+×|\d+ x/i.test(s.prescription.mainSet.join(" ")), `${s.id} timed work`);
  }
  ok("Hybrid Engine executable prescriptions");
}

{
  for (const s of ALL_PROGRAMMING) {
    const prog = s.recommendedProgression;
    if (prog && (prog.startsWith("vb-") || prog.startsWith("he-"))) {
      assert(ID_SET.has(prog), `${s.id} progression id missing: ${prog}`);
    }
    const reg = s.recommendedRegression;
    if (reg && (reg.startsWith("vb-") || reg.startsWith("he-"))) {
      assert(ID_SET.has(reg), `${s.id} regression id missing: ${reg}`);
    }
  }
  const core = HYROX_VOLUME_BUILDER_COACH_SESSIONS.find((s) => s.id === "vb-sled-capacity-l1");
  assert(core?.recommendedProgression === "vb-sled-pull-push-bbj-wb-l1", "sled L1→coach brief");
  ok("Progression / regression references");
}

{
  const vb = filterCoachLibrary("hyrox_volume_builders", "");
  assert(vb.length === HYROX_VOLUME_BUILDER_COACH_SESSIONS.length, "VB category filter");
  assert(filterCoachLibrary("all", "sled capacity").length >= 1, "search family/name");
  assert(filterCoachLibrary("all", "", { quickFilter: "volume_builders" }).length >= 20, "VB quick");
  assert(filterCoachLibrary("all", "", { quickFilter: "low_fatigue" }).length >= 1, "low fatigue");
  assert(filterCoachLibrary("all", "", { quickFilter: "level_1" }).length >= 1, "level 1");
  assert(filterCoachLibrary("all", "limiter_wall_ball").length >= 1, "limiter search");
  ok("Search / filter coverage");
}

{
  assert(PROGRAMMING_PROGRESSION_FAMILIES.length >= 20, "families registered");
  assert(getProgressionFamily("sled_capacity_builder"), "sled family");
  assert(PROGRAMMING_PILLAR_TAXONOMY.hyrox_volume_builders.families.length >= 5, "taxonomy");
  ok("Progression family registry");
}

{
  const sample = HYROX_VOLUME_BUILDER_COACH_SESSIONS[0]!;
  const hints = deriveProgrammingBuilderHints(sample);
  assert(hints.length <= 3, "max 3 chips");
  assert(hints.some((h) => h.kind === "volume_builder" || h.kind === "progression_available"), "hints");
  ok("Builder guidance chips capped");
}

{
  const profile = EMPTY_COACH_PERFORMANCE_PROFILE("athlete-1");
  assert(profile.schemaVersion === 1 && profile.primaryLimiter === null, "profile empty");
  ok("Performance profile structure-only");
}

{
  assert(
    !HYROX_VOLUME_BUILDER_COACH_SESSIONS.every((s) =>
      s.prescription.mainSet.join(" ").includes("rounds for quality")
    ),
    "not all identical circuit shells"
  );
  ok("Session structural variety");
}

console.log(`\n${passed} Programming System QA checks passed.`);
console.log(
  `Sessions: ${HYROX_VOLUME_BUILDER_COACH_SESSIONS.length} volume builders + ${HYBRID_ENGINE_COACH_SESSIONS.length} hybrid engine`
);
