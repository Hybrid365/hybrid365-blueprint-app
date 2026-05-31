/**
 * Local smoke test for Hybrid 75 free-week wrapper + methodology helpers.
 *
 * Run: npx tsx scripts/test-hybrid75-wrapper.ts
 */

import { buildWeekBlueprint } from "../app/lib/buildWeekBlueprint";
import { applyHybrid75FreeWeek } from "../app/lib/applyHybrid75FreeWeek";
import { normalizeChallengeMode } from "../app/lib/freeWeekChallengeMode";
import {
  analyseHybrid75Week,
  countsTowardLiftTarget,
  countsTowardRunTarget,
  hasBackToBackHardRuns,
  hasBackToBackLowerStress,
  hasHybridLegFollowedByViolation,
  isPostHybridLegViolation,
  isWeekendDay,
} from "../app/lib/hybrid75Sequencing";
import {
  classifyHybrid75Session,
  createHybridLegEnduranceSession,
  createUpperStrengthASession,
  createUpperStrengthBSession,
  createUpperStrengthGripSession,
} from "../app/lib/hybrid75SessionMethodology";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function testMethodologyClassification() {
  const easyRun = classifyHybrid75Session({
    title: "Aerobic Support",
    tags: ["aerobic_support", "run"],
    intent: "Easy aerobic support",
    session: { main: ["30–40 min easy Z2 bike or jog"] },
  });
  assert(easyRun.isRun, "easy aerobic should be classified as run");
  assert(!easyRun.isHardRun, "easy run should not be hard run");
  assert(easyRun.stress === "easy" || easyRun.stress === "moderate", "easy run stress should not be hard");

  const hardRun = classifyHybrid75Session({
    title: "4 x 2km Threshold",
    tags: ["threshold_run", "run"],
    session: { main: ["4 x 2km @ threshold"] },
  });
  assert(hardRun.isRun, "threshold session should be a run");
  assert(hardRun.isHardRun, "threshold session should be hard run");
  assert(hardRun.stress === "hard", "threshold session stress should be hard");

  const fiveByFive = classifyHybrid75Session({
    title: "5 x 5 min Threshold",
    tags: ["threshold_run", "run", "threshold"],
    intent: "Quality run to improve pace under fatigue.",
    session: {
      main: ["10–15 min easy", "3×20s strides", "5×5 min @ threshold effort", "75s easy jog between", "8–10 min easy"],
    },
  });
  assert(fiveByFive.isHardRun, "5 x 5 min Threshold must classify as hard run");
  assert(fiveByFive.stress === "hard", "5 x 5 min Threshold stress must be hard");
  assert(
    fiveByFive.primaryStimulus === "run_hard",
    "5 x 5 min Threshold primaryStimulus must be run_hard, not recovery"
  );
  assert(fiveByFive.primaryStimulus !== "recovery", "5 x 5 min Threshold must not be recovery");

  const introThreshold = classifyHybrid75Session({
    title: "3 x 5 min Intro Threshold",
    tags: ["threshold_run", "run", "threshold_short"],
    session: { main: ["3×5 min @ intro threshold", "90s easy jog between"] },
  });
  assert(introThreshold.isHardRun, "3 x 5 min Intro Threshold must classify as hard run");
  assert(introThreshold.stress === "hard", "3 x 5 min Intro Threshold must not be easy");
  assert(introThreshold.primaryStimulus !== "recovery", "3 x 5 min Intro Threshold must not be recovery");

  const upper = createUpperStrengthGripSession({
    day: "Mon",
    ability_level: "intermediate",
    equipment: ["Full gym", "Dumbbells only"],
  });
  assert(Boolean(upper.tags?.includes("upper_strength")), "upper template should include upper_strength tag");

  const upperA = createUpperStrengthASession({ day: "Mon", ability_level: "intermediate", equipment: ["Full gym"] });
  assert(upperA.title.includes("Strength Bias"), "Upper A template title");
  const upperB = createUpperStrengthBSession({ day: "Wed", ability_level: "intermediate", equipment: ["Full gym"] });
  assert(upperB.title.includes("Volume + Grip"), "Upper B template title");
  assert(upperA.title !== upperB.title, "Upper A and B should have distinct titles");

  const upperClass = classifyHybrid75Session(upper);
  assert(upperClass.isUpperSupport, "upper strength should be upper support");
  assert(!upperClass.isLowerStress, "upper strength should not be lower stress");
  assert(upperClass.stress !== "hard", "upper strength should not be hard stress");

  const challenge = classifyHybrid75Session({
    title: "Hybrid Hard Weekly Challenge",
    tags: ["challenge_placeholder", "hybrid_hard_challenge"],
    session: { main: ["Complete in Telegram"] },
  });
  assert(challenge.stress === "hard", "Hybrid Hard challenge should be hard");
  assert(challenge.primaryStimulus === "challenge", "Hybrid Hard should be challenge stimulus");

  const leg = createHybridLegEnduranceSession({
    day: "Thu",
    ability_level: "advanced",
    equipment: ["Full gym", "Rower", "Bike / Spin bike"],
  });
  assert(Boolean(leg.tags?.includes("hybrid_leg_endurance")), "leg endurance template should include hybrid_leg_endurance tag");
  const legClass = classifyHybrid75Session(leg);
  assert(legClass.stress === "hard", "hybrid leg endurance should be hard");
  assert(legClass.isLowerStress, "hybrid leg endurance should be lower stress");
  assert(legClass.primaryStimulus === "hybrid_leg_endurance", "hybrid leg primary stimulus");

  console.log("✓ methodology classification + templates");
}

function testStandardFreeWeekUnchanged() {
  const standard = buildWeekBlueprint({
    days_per_week: 4,
    weekly_hours_band: "5-7",
    goal_focus: "hybrid",
    ability_level: "intermediate",
  });
  assert(standard.challenge_mode === undefined, "standard plan should not set challenge_mode");
  assert(
    !(standard.schedule[0]?.tags ?? []).some((t) => t.startsWith("hybrid75_stress_")),
    "standard plan should not get hybrid75 stress tags"
  );
  assert(!(standard as { hybrid75?: unknown }).hybrid75, "standard plan should not get hybrid75 metadata");
  console.log("✓ standard free-week generation unchanged");
}

function assertNoBackToBackHardRuns(label: string, schedule: ReturnType<typeof buildWeekBlueprint>["schedule"]) {
  const analyses = analyseHybrid75Week(schedule);
  assert(!hasBackToBackHardRuns(analyses), `${label}: should not have consecutive hard run days`);
}

function getChallengeDay(schedule: ReturnType<typeof buildWeekBlueprint>["schedule"]) {
  return schedule.find((d) =>
    (d.tags ?? []).some((t) => t === "challenge_placeholder" || t === "hybrid_hard_challenge")
  );
}

function assertSaturdayChallenge(label: string, schedule: ReturnType<typeof buildWeekBlueprint>["schedule"]) {
  const challengeItem = getChallengeDay(schedule);
  assert(Boolean(challengeItem), `${label}: weekend challenge placeholder missing`);
  assert(challengeItem?.title === "Hybrid Hard Weekly Challenge", `${label}: challenge placeholder title wrong`);
  assert(challengeItem?.day === "Sat", `${label}: Hybrid Hard Challenge should land on Saturday`);
}

function assertSundayEasyAfterChallenge(label: string, schedule: ReturnType<typeof buildWeekBlueprint>["schedule"]) {
  const sat = schedule.find((d) => d.day === "Sat");
  const sun = schedule.find((d) => d.day === "Sun");
  assert(Boolean(sat) && Boolean(sun), `${label}: weekend days missing`);

  const satClass = classifyHybrid75Session(sat!);
  const sunClass = classifyHybrid75Session(sun!);

  if (satClass.primaryStimulus === "challenge") {
    assert(sunClass.stress !== "hard", `${label}: Sunday after Saturday challenge must not be hard`);
    assert(!sunClass.isHardRun, `${label}: Sunday after Saturday challenge must not be a hard run`);
  }
}

function assertNoHardWeekendStacking(label: string, schedule: ReturnType<typeof buildWeekBlueprint>["schedule"]) {
  const sat = schedule.find((d) => d.day === "Sat");
  const sun = schedule.find((d) => d.day === "Sun");
  if (!sat || !sun) return;

  const satClass = classifyHybrid75Session(sat);
  const sunClass = classifyHybrid75Session(sun);

  const satHardNonChallenge = satClass.stress === "hard" && satClass.primaryStimulus !== "challenge";
  const sunHard = sunClass.stress === "hard";
  assert(!(satHardNonChallenge && sunHard), `${label}: must not stack hard Saturday + hard Sunday`);
}

function assertHybrid75Metadata(label: string, hybrid75: ReturnType<typeof applyHybrid75FreeWeek>) {
  assert(hybrid75.challenge_mode === "hybrid75", `${label}: challenge_mode should be hybrid75`);
  assert(Boolean(hybrid75.hybrid75), `${label}: hybrid75 metadata missing`);
  assert(
    hybrid75.hybrid75?.session_classifications?.length === hybrid75.schedule.length,
    `${label}: session_classifications should cover all schedule items`
  );
  assert(Boolean(hybrid75.hybrid75?.hard_easy_summary), `${label}: hard_easy_summary should be present`);
  const hasStressTags = hybrid75.schedule.every((d) =>
    (d.tags ?? []).some((t) => t.startsWith("hybrid75_stress_"))
  );
  assert(hasStressTags, `${label}: all sessions should have hybrid75_stress_* tags`);
}

function assertQualityRunBeforeWeekend(label: string, schedule: ReturnType<typeof buildWeekBlueprint>["schedule"]) {
  const weekdayHardRuns = schedule.filter((d) => {
    if (isWeekendDay(d.day)) return false;
    return classifyHybrid75Session(d).isHardRun;
  });
  assert(weekdayHardRuns.length >= 1, `${label}: should include a weekday quality hard run before the weekend`);
}

function assertNoHybridLegFollowedByViolation(label: string, schedule: ReturnType<typeof buildWeekBlueprint>["schedule"]) {
  assert(!hasHybridLegFollowedByViolation(schedule), `${label}: Hybrid Leg Endurance must not be followed by lower/hard/compromised work`);

  const analyses = analyseHybrid75Week(schedule);
  for (let i = 0; i < analyses.length - 1; i++) {
    if (!(analyses[i].plan.tags ?? []).includes("hybrid_leg_endurance")) continue;
    const next = analyses[i + 1];
    const nc = classifyHybrid75Session(next.plan);
    assert(!nc.isLowerStress, `${label}: day after Hybrid Leg Endurance (${next.day}) must not be lowerStress`);
    assert(!nc.isHardRun, `${label}: day after Hybrid Leg Endurance (${next.day}) must not be a hard run`);
    assert(
      !isPostHybridLegViolation(next.plan),
      `${label}: day after Hybrid Leg Endurance (${next.day}: ${next.plan.title}) must be support/recovery only`
    );
  }
}

function assertFridayBeforeChallenge(label: string, schedule: ReturnType<typeof buildWeekBlueprint>["schedule"]) {
  const sat = schedule.find((d) => d.day === "Sat");
  const fri = schedule.find((d) => d.day === "Fri");
  if (!sat || !fri) return;
  if (classifyHybrid75Session(sat).primaryStimulus !== "challenge") return;

  const fc = classifyHybrid75Session(fri);
  assert(!fc.isLowerStress, `${label}: Friday before Saturday challenge must not be lowerStress`);
  assert(!fc.isHardRun, `${label}: Friday before Saturday challenge must not be a hard run`);
  assert(fc.stress !== "hard" || fc.isUpperSupport, `${label}: Friday before Saturday challenge must be easy/support`);
}

function assertRhythmFridayNotLower(label: string, summary: string | undefined) {
  assert(!summary?.includes("Fri:L"), `${label}: rhythm should not show Fri:L (lower stress before challenge)`);
}

function friTitleIsEasySupport(day: ReturnType<typeof buildWeekBlueprint>["schedule"][0] | undefined): boolean {
  if (!day) return false;
  const t = day.title.toLowerCase();
  return (
    t.includes("easy run + mobility") ||
    t.includes("recovery aerobic") ||
    (t.includes("upper strength") && !t.includes("lower"))
  );
}

function assertDefaultHybrid75Format(label: string, hybrid75: ReturnType<typeof applyHybrid75FreeWeek>) {
  const schedule = hybrid75.schedule;
  const counts = hybrid75.hybrid75?.scheduled_counts;

  assert((counts?.runs ?? 0) >= 3, `${label}: should have at least 3 run exposures`);
  assert((counts?.lifts ?? 0) >= 3, `${label}: should have at least 3 lift exposures`);
  assert((counts?.upper_exposures ?? 0) >= 2, `${label}: should have at least 2 upper-body strength exposures`);
  assert((counts?.hybrid_leg_exposures ?? 0) >= 1, `${label}: should include Hybrid Leg Endurance exposure`);

  assert(hybrid75.hybrid75?.targets.lifts === 3, `${label}: lift target should be 3`);
  assert(hybrid75.hybrid75?.targets.upper_exposures === 2, `${label}: upper exposure target should be 2`);

  const runDays = schedule.filter(countsTowardRunTarget);
  const liftDays = schedule.filter(countsTowardLiftTarget);
  assert(runDays.length >= 3, `${label}: should schedule at least 3 run-target days`);
  assert(liftDays.length >= 3, `${label}: should schedule at least 3 lift-target days`);

  const tue = schedule.find((d) => d.day === "Tue");
  if (tue) {
    const tc = classifyHybrid75Session(tue);
    assert(tc.isHardRun, `${label}: Tuesday should include quality hard run`);
  }

  const thu = schedule.find((d) => d.day === "Thu");
  assert(Boolean(thu?.tags?.includes("hybrid_leg_endurance")), `${label}: Thursday should be Hybrid Leg Endurance`);

  const fri = schedule.find((d) => d.day === "Fri");
  if (fri) {
    const fc = classifyHybrid75Session(fri);
    assert(!fc.isLowerStress, `${label}: Friday must not be lower stress`);
    assert(!fc.isHardRun, `${label}: Friday must not be hard run`);
  }

  const sat = schedule.find((d) => d.day === "Sat");
  assert(classifyHybrid75Session(sat!).primaryStimulus === "challenge", `${label}: Saturday must be challenge`);

  const sun = schedule.find((d) => d.day === "Sun");
  if (sun) {
    const sc = classifyHybrid75Session(sun);
    assert(!sc.isHardRun, `${label}: Sunday must not be hard run`);
    assert(sc.stress !== "hard", `${label}: Sunday must remain easy/moderate`);
  }
}

function testSixDayIntermediateHybrid75() {
  const label = "6-day intermediate Hybrid 75";
  const standard = buildWeekBlueprint({
    days_per_week: 6,
    weekly_hours_band: "7-10",
    goal_focus: "hybrid",
    ability_level: "intermediate",
  });
  const hybrid75 = applyHybrid75FreeWeek(standard, {
    days_per_week: 6,
    ability_level: "intermediate",
    equipment: ["Full gym", "Dumbbells only"],
  });

  assertHybrid75Metadata(label, hybrid75);
  assertNoBackToBackHardRuns(label, hybrid75.schedule);
  assertSaturdayChallenge(label, hybrid75.schedule);
  assertSundayEasyAfterChallenge(label, hybrid75.schedule);
  assertNoHardWeekendStacking(label, hybrid75.schedule);
  assertQualityRunBeforeWeekend(label, hybrid75.schedule);
  assertNoHybridLegFollowedByViolation(label, hybrid75.schedule);
  assertFridayBeforeChallenge(label, hybrid75.schedule);
  assertRhythmFridayNotLower(label, hybrid75.hybrid75?.hard_easy_summary);
  assertDefaultHybrid75Format(label, hybrid75);

  const mon = hybrid75.schedule.find((d) => d.day === "Mon");
  const wed = hybrid75.schedule.find((d) => d.day === "Wed");
  assert(Boolean(mon?.title.includes("Strength Bias")), label + ": Monday should be Upper Strength A");
  assert(Boolean(wed?.title.includes("Volume + Grip")), label + ": Wednesday should be Upper Strength B");
  assert(friTitleIsEasySupport(hybrid75.schedule.find((d) => d.day === "Fri")), label + ": Friday should be easy run/mobility or recovery support");

  const threshold = hybrid75.schedule.find((d) => d.title.includes("5 x 5 min Threshold"));
  if (threshold) {
    const tClass = classifyHybrid75Session(threshold);
    assert(tClass.isHardRun, `${label}: blueprint threshold session must remain a hard run`);
    assert(tClass.stress === "hard", `${label}: blueprint threshold session must stay hard stress`);
  }

  const hasUpperSupport = hybrid75.schedule.some(
    (d) =>
      (d.tags ?? []).includes("upper_strength") ||
      (d.tags ?? []).includes("hybrid75_upper_support") ||
      classifyHybrid75Session(d).isUpperSupport
  );
  assert(hasUpperSupport, `${label}: should include upper strength / upper support session`);

  const hasHybridLeg = hybrid75.schedule.some((d) => (d.tags ?? []).includes("hybrid_leg_endurance"));
  assert(hasHybridLeg, `${label}: should include hybrid leg endurance where possible`);

  console.log(`✓ ${label}`);
  console.log(`    rhythm: ${hybrid75.hybrid75?.hard_easy_summary}`);
  console.log(
    `    runs=${hybrid75.hybrid75?.scheduled_counts.runs} lifts=${hybrid75.hybrid75?.scheduled_counts.lifts} mobility=${hybrid75.hybrid75?.scheduled_counts.mobility}`
  );
}

function testFourDayBeginnerHybrid75() {
  const label = "4-day beginner Hybrid 75";
  const standard = buildWeekBlueprint({
    days_per_week: 4,
    weekly_hours_band: "2-3",
    goal_focus: "running",
    ability_level: "beginner",
  });
  const hybrid75 = applyHybrid75FreeWeek(standard, {
    days_per_week: 4,
    ability_level: "beginner",
  });

  assertHybrid75Metadata(label, hybrid75);
  assertNoBackToBackHardRuns(label, hybrid75.schedule);
  assertSaturdayChallenge(label, hybrid75.schedule);
  assertSundayEasyAfterChallenge(label, hybrid75.schedule);
  assertNoHardWeekendStacking(label, hybrid75.schedule);

  const introThreshold = hybrid75.schedule.find((d) => d.title.includes("Intro Threshold"));
  if (introThreshold) {
    const tClass = classifyHybrid75Session(introThreshold);
    assert(tClass.isHardRun, `${label}: intro threshold must classify as hard run`);
    assert(tClass.primaryStimulus !== "recovery", `${label}: intro threshold must not be recovery`);
  }

  const compressionNote = hybrid75.hybrid75?.compression_note ?? "";
  assert(
    compressionNote.includes("scaled for beginner/compressed availability") ||
      compressionNote.includes("compressed around your availability"),
    `${label}: should include scaled/compressed availability note`
  );

  const counts = hybrid75.hybrid75?.scheduled_counts;
  assert((counts?.runs ?? 0) >= 3, `${label}: should reach at least 3 run exposures via add-ons where possible`);
  assert((counts?.lifts ?? 0) >= 3, `${label}: should reach 3 lift exposures via safe add-ons where possible`);

  const liftDays = hybrid75.schedule.filter(countsTowardLiftTarget);
  assert(liftDays.length >= 2, `${label}: should have at least 2 lift-target days`);
  for (const day of liftDays) {
    const c = classifyHybrid75Session(day);
    assert(!c.isLowerStress, `${label}: lift exposure ${day.day} must not be hard lower stress`);
    assert(c.stress !== "hard" || c.isHardRun, `${label}: lift exposure ${day.day} must not be hard lower work`);
  }

  const runDays = hybrid75.schedule.filter(countsTowardRunTarget);
  assert(runDays.length >= 3, `${label}: should have at least 3 run-target days`);

  const analyses = analyseHybrid75Week(hybrid75.schedule);
  assert(!hasBackToBackLowerStress(analyses), `${label}: should not stack excessive lower-body stress`);

  const methodologyNotes = hybrid75.hybrid75?.methodology_notes ?? [];
  const skippedLegNote = methodologyNotes.some((n) => n.includes("Hybrid Leg Endurance session is reserved"));
  assert(skippedLegNote, `${label}: should note hybrid leg reserved for higher-availability weeks`);

  console.log(`✓ ${label}`);
  console.log(`    rhythm: ${hybrid75.hybrid75?.hard_easy_summary}`);
  console.log(`    compression: ${compressionNote.slice(0, 70)}…`);
}

function testAdvancedFullEquipmentHybrid75() {
  const label = "6-day advanced full-equipment Hybrid 75";
  const standard = buildWeekBlueprint({
    days_per_week: 6,
    weekly_hours_band: "7-10",
    goal_focus: "hybrid",
    ability_level: "advanced",
    double_sessions: true,
    equipment: ["Full gym", "Rower", "Bike / Spin bike", "Dumbbells only"],
  });
  const hybrid75 = applyHybrid75FreeWeek(standard, {
    days_per_week: 6,
    ability_level: "advanced",
    equipment: ["Full gym", "Rower", "Bike / Spin bike", "Dumbbells only"],
  });

  assertHybrid75Metadata(label, hybrid75);
  assertNoBackToBackHardRuns(label, hybrid75.schedule);
  assertSaturdayChallenge(label, hybrid75.schedule);
  assertSundayEasyAfterChallenge(label, hybrid75.schedule);
  assertNoHardWeekendStacking(label, hybrid75.schedule);
  assertQualityRunBeforeWeekend(label, hybrid75.schedule);
  assertNoHybridLegFollowedByViolation(label, hybrid75.schedule);
  assertFridayBeforeChallenge(label, hybrid75.schedule);
  assertRhythmFridayNotLower(label, hybrid75.hybrid75?.hard_easy_summary);
  assertDefaultHybrid75Format(label, hybrid75);

  const upperTitles = hybrid75.schedule
    .filter((d) => classifyHybrid75Session(d).isUpperSupport)
    .map((d) => d.title);
  assert(new Set(upperTitles).size >= 2, `${label}: upper sessions should not all share the same title`);

  const hasHybridLeg = hybrid75.schedule.some((d) => (d.tags ?? []).includes("hybrid_leg_endurance"));
  assert(hasHybridLeg, label + ": should include robust Hybrid Leg Endurance session");

  const summary = hybrid75.hybrid75?.hard_easy_summary ?? "";
  assert(summary.includes("Thu:L"), label + ": should keep Hybrid Leg Endurance on Thursday");
  assert(summary.includes("Sat:C"), label + ": should keep challenge on Saturday");
  assert(
    summary.includes("Fri:S") || summary.includes("Fri:E") || summary.includes("Fri:M") || summary.includes("Fri:A"),
    label + ": Friday rhythm should be S/E/M/A before challenge, got " + summary
  );

  console.log(`✓ ${label}`);
  console.log(`    rhythm: ${hybrid75.hybrid75?.hard_easy_summary}`);
  if ((hybrid75.hybrid75?.sequencing_repairs_applied?.length ?? 0) > 0) {
    console.log(`    repairs: ${hybrid75.hybrid75?.sequencing_repairs_applied?.length} applied`);
  }
}

function testStandardVsHybrid75Diff() {
  const input = {
    days_per_week: 4 as const,
    weekly_hours_band: "5-7" as const,
    goal_focus: "hybrid" as const,
    ability_level: "intermediate" as const,
  };
  const standard = buildWeekBlueprint(input);
  assert(normalizeChallengeMode(undefined) === "standard", "missing challenge_mode defaults to standard");
  const hybrid75 = applyHybrid75FreeWeek(standard, {
    days_per_week: input.days_per_week,
    ability_level: input.ability_level,
  });
  assert(JSON.stringify(standard) !== JSON.stringify(hybrid75), "hybrid75 should differ from standard");
  console.log("✓ hybrid75 wrapper modifies plan as expected");
}

console.log("Hybrid 75 wrapper + methodology smoke tests\n");

testMethodologyClassification();
testStandardFreeWeekUnchanged();
testStandardVsHybrid75Diff();
testSixDayIntermediateHybrid75();
testFourDayBeginnerHybrid75();
testAdvancedFullEquipmentHybrid75();

console.log("\nAll Hybrid 75 checks passed.");
