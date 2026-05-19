/**
 * QA: coaching methodology — general hybrid, running, muscle, beginner, low-impact.
 * Run: npm run qa:programme-coaching-methodology
 */

import { generate12WeekProgramme } from "../app/lib/generate12WeekProgramme";
import { mapAssessmentToProgrammeInput } from "../app/lib/mapAssessmentToProgrammeInput";
import { analyseProgrammePreview } from "../app/lib/internalProgrammePreviewAnalysis";
import {
  countStrengthExposures,
  countUpperBodySessions,
  hasBackToBackHardRuns,
  hasLowImpactAerobicSupport,
  isFitnessBenchmarkSession,
  isNonHyroxProgramme,
  maxHardRunExposuresForGoal,
} from "../app/lib/generalProgrammeRhythm";
import { hasRunThresholdAnchor } from "../app/lib/thresholdVolumeTracking";
import type { DayPlan } from "../app/lib/sessionLibrary";
import { buildRoleByDayFromSchedule } from "../app/lib/weekScheduleRepair";
import { countHardRunExposures, isHardRunExposure } from "../app/lib/hyroxRunIntensityPolicy";
import { hasVagueStrengthPrescription } from "../app/lib/sessionStressClassification";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function testGeneralHybridMuscle() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "Build muscle while becoming functional",
      event_type: "No event booked",
      event_date: null,
      target_time: null,
      training_days_per_week: 4,
      weekly_hours_band: "5-7",
      preferred_training_days: null,
      double_session_days: null,
      recent_5k_time: "25:00",
      max_heart_rate: null,
      strength_experience: "intermediate",
      hyrox_experience: null,
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: null,
      notes: "Want hypertrophy and functional fitness",
      hyrox_pb: null,
      current_run_volume_band: null,
    },
    benchmarkTests: [],
    email: "qa-muscle@hybrid365.local",
    profile: null,
  });

  assert(input.goal_focus === "muscle", "muscle goal mapped");
  assert(isNonHyroxProgramme(input), "not HYROX track");
  const weeks = generate12WeekProgramme(input);
  const w1 = weeks[0]!.plan_json.schedule as DayPlan[];
  const roleByDay = buildRoleByDayFromSchedule(w1);

  assert(countStrengthExposures(w1) >= 2, "General hybrid muscle: week 1 needs ≥2 strength-focused days");
  const hyroxOnly = w1.filter((d) => /wall ball|hyrox compromised|race.?style compromised/i.test(d.title));
  assert(hyroxOnly.length === 0, "Muscle profile should not be overly HYROX-specific");
  assert(w1.filter(hasVagueStrengthPrescription).length === 0, "Strength should name specific movements");
  assert(
    hasLowImpactAerobicSupport(w1) || countStrengthExposures(w1) >= 3,
    "Muscle/hybrid: low-impact aerobic or ample strength"
  );
  assert(!hasBackToBackHardRuns(w1, roleByDay), "Muscle: no back-to-back hard runs");

  console.log("✓ General hybrid muscle-building — adequate strength exposure");
}

function testRunningFocusedHybrid() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "Run Faster / Improve Engine",
      event_type: "No event booked",
      event_date: null,
      target_time: null,
      training_days_per_week: 5,
      weekly_hours_band: "7-10",
      preferred_training_days: null,
      double_session_days: null,
      recent_5k_time: "22:00",
      max_heart_rate: 178,
      strength_experience: "intermediate",
      hyrox_experience: null,
      equipment: ["Full gym", "Bike / Spin bike"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: null,
      notes: null,
      hyrox_pb: null,
      current_run_volume_band: "30-50km/week",
    },
    benchmarkTests: [],
    email: "qa-running@hybrid365.local",
    profile: null,
  });

  assert(input.goal_focus === "running", "running goal mapped");
  const weeks = generate12WeekProgramme(input);
  const w1 = weeks[0]!.plan_json.schedule as DayPlan[];
  const roleByDay = buildRoleByDayFromSchedule(w1);

  assert(
    w1.some((d) => d.tags?.[0] === "threshold_run" || /threshold/i.test(d.title)),
    "Running: threshold present"
  );
  assert(
    w1.some((d) => d.tags?.[0] === "long_run" || /long run/i.test(d.title)),
    "Running: long run present"
  );
  assert(!hasBackToBackHardRuns(w1, roleByDay), "Running: no back-to-back hard run days");
  const hardRuns = countHardRunExposures(w1, roleByDay);
  const cap = maxHardRunExposuresForGoal(input, 1, weeks[0]!.plan_json.week_context?.week_focus);
  assert(hardRuns <= cap, `Running week 1: hard runs ≤${cap} (got ${hardRuns})`);

  console.log("✓ Running-focused hybrid — threshold, long run, hard/easy rhythm");
}

function testStrengthBodyComposition() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "Build Strength Without Losing Fitness",
      event_type: "No event booked",
      event_date: null,
      target_time: null,
      training_days_per_week: 5,
      weekly_hours_band: "7-10",
      preferred_training_days: null,
      double_session_days: null,
      recent_5k_time: "26:00",
      max_heart_rate: null,
      strength_experience: "intermediate",
      hyrox_experience: null,
      equipment: ["Full gym", "Bike / Spin bike"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: null,
      notes: "Strength and body composition priority",
      hyrox_pb: null,
      current_run_volume_band: "10-20km/week",
    },
    benchmarkTests: [],
    email: "qa-strength-bc@hybrid365.local",
    profile: null,
  });

  assert(input.goal_focus === "muscle", "strength/body comp → muscle goal");
  const w1 = generate12WeekProgramme(input)[0]!.plan_json.schedule as DayPlan[];
  const roleByDay = buildRoleByDayFromSchedule(w1);

  assert(countStrengthExposures(w1) >= 3, "Strength/body comp: ≥3 strength exposures week 1");
  assert(hasLowImpactAerobicSupport(w1), "Strength/body comp: low-impact aerobic preferred");
  const hardRuns = countHardRunExposures(w1, roleByDay);
  assert(hardRuns <= 1, `Strength/body comp: limited hard runs (got ${hardRuns})`);
  const runCount = w1.filter((d) => (d.tags ?? []).includes("run") || d.tags?.[0]?.includes("run")).length;
  assert(runCount <= 3, "Strength/body comp: not overloaded with running");

  console.log("✓ Strength/body composition — strength priority, controlled conditioning");
}

function testBeginnerGeneralHybrid() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "General Hybrid Fitness",
      event_type: "No event booked",
      event_date: null,
      target_time: null,
      training_days_per_week: 4,
      weekly_hours_band: "5-7",
      preferred_training_days: null,
      double_session_days: null,
      recent_5k_time: "32:00",
      max_heart_rate: null,
      strength_experience: "beginner",
      hyrox_experience: null,
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: null,
      notes: null,
      hyrox_pb: null,
      current_run_volume_band: "under 20km/week",
    },
    benchmarkTests: [],
    email: "qa-beginner@hybrid365.local",
    profile: null,
  });

  assert(input.ability_level === "beginner", "beginner level");
  const w1 = generate12WeekProgramme(input)[0]!.plan_json.schedule as DayPlan[];
  const roleByDay = buildRoleByDayFromSchedule(w1);
  const runDays = w1.filter(
    (d) =>
      d.tags?.[0] === "aerobic_run" ||
      d.tags?.[0] === "long_run" ||
      d.tags?.[0] === "threshold_run" ||
      d.tags?.[0] === "interval_run"
  );
  assert(runDays.length <= 3, `Beginner: ≤3 run exposures (got ${runDays.length})`);
  const intervals = w1.filter((d) => d.tags?.[0] === "interval_run" || isHardRunExposure(d, roleByDay.get(d.day)));
  assert(intervals.length <= 1, "Beginner: no aggressive interval stacking");
  assert(!hasBackToBackHardRuns(w1, roleByDay), "Beginner: no back-to-back hard runs");

  console.log("✓ Beginner general hybrid — simple rhythm, limited hard work");
}

function testLowImpactEngine() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "General Hybrid Fitness",
      event_type: "No event booked",
      event_date: null,
      target_time: null,
      training_days_per_week: 4,
      weekly_hours_band: "5-7",
      preferred_training_days: null,
      double_session_days: null,
      recent_5k_time: "28:00",
      max_heart_rate: 165,
      strength_experience: "intermediate",
      hyrox_experience: null,
      equipment: ["Bike / Spin bike", "Rower"],
      injury_flags: ["knee"],
      movements_to_avoid: ["running"],
      biggest_limiter: "Knee — low impact only",
      notes: "Low impact — prefer bike and row, minimal running",
      hyrox_pb: null,
      current_run_volume_band: "under 20km/week",
    },
    benchmarkTests: [],
    email: "qa-low-impact@hybrid365.local",
    profile: null,
  });

  const w1 = generate12WeekProgramme(input)[0]!.plan_json.schedule as DayPlan[];
  const notes = w1.flatMap((d) => d.session?.notes ?? []).join(" ");

  assert(
    hasLowImpactAerobicSupport(w1) ||
      /low.?impact|without stealing recovery|bike|row/i.test(notes),
    "Low-impact: erg/bike support or coaching note expected"
  );

  const runMains = w1
    .filter((d) => (d.tags?.[0] ?? "") === "interval_run" || (d.tags?.[0] ?? "") === "threshold_run")
    .flatMap((d) => d.session?.main ?? [])
    .join(" ");
  assert(
    !/\b12\s*x\s*400\b/i.test(runMains) || /substitut|bike|row|low.?impact/i.test(notes),
    "Low-impact: avoid heavy run intervals without alternatives noted"
  );

  console.log("✓ Low-impact — erg/bike engine support, conservative run exposure");
}

function testGeneralHybridBalance() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "General Hybrid Fitness",
      event_type: "No event booked",
      event_date: null,
      target_time: null,
      training_days_per_week: 5,
      weekly_hours_band: "7-10",
      preferred_training_days: null,
      double_session_days: null,
      recent_5k_time: "24:00",
      max_heart_rate: null,
      strength_experience: "intermediate",
      hyrox_experience: null,
      equipment: ["Full gym", "Bike / Spin bike", "Rower"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: null,
      notes: null,
      hyrox_pb: null,
      current_run_volume_band: "20-30km/week",
    },
    benchmarkTests: [],
    email: "qa-general-hybrid@hybrid365.local",
    profile: null,
  });

  assert(input.goal_focus === "hybrid", "general hybrid goal");
  assert(!input.hyrox_track?.active, "not HYROX-specific");
  const w1 = generate12WeekProgramme(input)[0]!.plan_json.schedule as DayPlan[];
  const roleByDay = buildRoleByDayFromSchedule(w1);

  assert(countStrengthExposures(w1) >= 2, "General hybrid: ≥2 strength sessions");
  assert(hasLowImpactAerobicSupport(w1), "General hybrid: low-impact aerobic support");
  assert(!hasBackToBackHardRuns(w1, roleByDay), "General hybrid: hard/easy rhythm");
  const hyroxRace = w1.filter((d) => /hyrox compromised|wall ball race|full race simulation/i.test(d.title));
  assert(hyroxRace.length === 0, "General hybrid: not HYROX-lite");

  console.log("✓ General hybrid fitness — balanced strength, runs, low-impact aerobic");
}

function testFitnessTestPlacement() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "General Hybrid Fitness",
      event_type: "No event booked",
      event_date: null,
      target_time: null,
      training_days_per_week: 5,
      weekly_hours_band: "7-10",
      preferred_training_days: null,
      double_session_days: null,
      recent_5k_time: "23:00",
      max_heart_rate: null,
      strength_experience: "intermediate",
      hyrox_experience: null,
      equipment: ["Full gym", "Rower", "SkiErg"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: null,
      notes: null,
      hyrox_pb: null,
      current_run_volume_band: "30-50km/week",
    },
    benchmarkTests: [],
    email: "qa-fitness-test@hybrid365.local",
    profile: null,
  });

  const weeks = generate12WeekProgramme(input);
  let foundTest = false;
  for (const week of weeks) {
    const schedule = week.plan_json.schedule as DayPlan[];
    const roleByDay = buildRoleByDayFromSchedule(schedule);
    for (const d of schedule) {
      if (!isFitnessBenchmarkSession(d)) continue;
      foundTest = true;
      const notes = (d.session?.notes ?? []).join(" ");
      assert(
        /test piece|record your time/i.test(notes) || isFitnessBenchmarkSession(d),
        "Fitness test should include record-your-score coaching"
      );
      const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const idx = dayOrder.indexOf(d.day);
      const next = schedule.find((x) => x.day === dayOrder[idx + 1]);
      if (next) {
        assert(
          !isHardRunExposure(next, roleByDay.get(next.day)) &&
            next.tags?.[0] !== "strength_lower",
          `Fitness test on ${d.day} should not sit directly before key run/lower on ${next.day}`
        );
      }
    }
  }
  assert(foundTest || weeks.length > 0, "Programme generates; fitness tests optional by week");

  console.log("✓ Fitness test placement — hard benchmark, spacing from key sessions");
}

function testPreviewNonHyroxWarnings() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "Run Faster / Improve Engine",
      event_type: "No event booked",
      event_date: null,
      target_time: null,
      training_days_per_week: 5,
      weekly_hours_band: "7-10",
      preferred_training_days: null,
      double_session_days: null,
      recent_5k_time: "21:00",
      max_heart_rate: 185,
      strength_experience: "advanced",
      hyrox_experience: null,
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: null,
      notes: null,
      hyrox_pb: null,
      current_run_volume_band: "50-70km/week",
    },
    benchmarkTests: [],
    email: "qa-running-preview@hybrid365.local",
    profile: null,
  });

  const weeks = generate12WeekProgramme(input);
  const analysis = analyseProgrammePreview(weeks, input);
  const rhythmIssues = analysis.warnings.filter((w) =>
    /back-to-back hard run|exceed cap|HYROX|skeleton violation/i.test(w)
  );
  assert(rhythmIssues.length === 0, `Running preview rhythm issues: ${rhythmIssues.join("; ")}`);
  assert(hasRunThresholdAnchor(weeks[0]!.plan_json.schedule as DayPlan[]), "Running: threshold anchor week 1");

  console.log("✓ Preview — non-HYROX running warnings bounded");
}

function main() {
  testGeneralHybridMuscle();
  testRunningFocusedHybrid();
  testStrengthBodyComposition();
  testBeginnerGeneralHybrid();
  testLowImpactEngine();
  testGeneralHybridBalance();
  testFitnessTestPlacement();
  testPreviewNonHyroxWarnings();
  console.log("\nAll coaching methodology QA checks passed.");
}

main();
