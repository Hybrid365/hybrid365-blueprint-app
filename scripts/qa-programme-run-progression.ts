/**
 * QA: paid programme run volume + week-to-week progression.
 * Run: npm run qa:programme-run-progression
 */

import { generate12WeekProgramme, type PaidProgrammeInput } from "../app/lib/generate12WeekProgramme";
import { mapAssessmentToProgrammeInput } from "../app/lib/mapAssessmentToProgrammeInput";
import { countRunExposuresInSchedule, planWeeklyRunVolume } from "../app/lib/runVolumePlanner";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function thresholdSessions(week: { plan_json: { schedule: { title: string; tags?: string[] }[] } }) {
  return week.plan_json.schedule.filter((d) => {
    const t0 = d.tags?.[0] ?? "";
    return t0 === "threshold_run" || /threshold/i.test(d.title);
  });
}

function advancedInput(overrides: Partial<PaidProgrammeInput> = {}): PaidProgrammeInput {
  const base = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "Improve Hybrid / Hyrox Performance",
      event_type: "No event booked",
      event_date: null,
      target_time: null,
      training_days_per_week: 7,
      weekly_hours_band: "10+",
      preferred_training_days: null,
      double_session_days: ["Mon", "Wed", "Fri"],
      recent_5k_time: "16:30",
      strength_experience: "advanced",
      hyrox_experience: "competitive",
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: null,
      notes: null,
      hyrox_pb: null,
      current_run_volume_band: "50-70km/week",
    },
    benchmarkTests: [],
    email: "qa@hybrid365.local",
    profile: null,
  });
  return { ...base, ...overrides };
}

function beginnerInput(): PaidProgrammeInput {
  return mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "General Hybrid Fitness",
      event_type: "No event booked",
      event_date: null,
      target_time: null,
      training_days_per_week: 3,
      weekly_hours_band: "3-5",
      preferred_training_days: null,
      double_session_days: null,
      recent_5k_time: "28:00",
      strength_experience: "beginner",
      hyrox_experience: null,
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: null,
      notes: null,
      hyrox_pb: null,
      current_run_volume_band: "0-10km/week",
    },
    benchmarkTests: [],
    email: "qa-beginner@hybrid365.local",
    profile: null,
  });
}

function testAdvancedHighVolume() {
  const input = advancedInput();
  const plan = planWeeklyRunVolume(input, 1);
  assert(plan.preferredRunSessionsPerWeek >= 5, "Case A: plan should target >=5 run exposures");
  assert(plan.highVolumeAdvanced, "Case A: should flag high-volume advanced profile");

  const weeks = generate12WeekProgramme(input);
  const w1 = weeks[0];
  const w2 = weeks[1];

  const runCounts = weeks.map((w) => countRunExposuresInSchedule(w.plan_json.schedule));
  const avgRuns = runCounts.reduce((a, b) => a + b, 0) / runCounts.length;
  assert(avgRuns >= 4, `Case A: 12-week average run exposures should be >=4, got ${avgRuns.toFixed(1)}`);
  assert(
    runCounts.filter((n) => n >= 4).length >= 8,
    `Case A: most weeks should have >=4 runs, got ${runCounts.filter((n) => n >= 4).length}/12`
  );

  const t1 = thresholdSessions(w1);
  const t2 = thresholdSessions(w2);
  assert(t1.length >= 1, "Case A: week 1 should include a threshold run");
  assert(t2.length >= 1, "Case A: week 2 should include a threshold run");
  const name1 = t1[0]!.title.trim().toLowerCase();
  const name2 = t2[0]!.title.trim().toLowerCase();
  assert(name1 !== name2, `Case A: threshold titles must differ W1 vs W2 (${name1} vs ${name2})`);

  const longRun = weeks.some((w) =>
    w.plan_json.schedule.some((d) => (d.tags?.[0] ?? "") === "long_run")
  );
  assert(longRun, "Case A: programme should include long runs");

  const rationale =
    w1.plan_json.programme_rationale?.summary?.join(" ") ??
    w1.plan_json.programme_intelligence?.rationale_notes?.join(" ") ??
    "";
  assert(
    /run|threshold|aerobic|mileage/i.test(rationale),
    "Case A: programme rationale should mention running structure"
  );
  console.log("Case A (advanced 16:30, 7d, 50-70km): OK");
}

function testBeginnerLowVolume() {
  const input = beginnerInput();
  const weeks = generate12WeekProgramme(input);
  const w1 = weeks[0];
  const runs = countRunExposuresInSchedule(w1.plan_json.schedule);
  assert(runs <= 4, `Case B: beginner low volume should stay <=4 runs, got ${runs}`);
  const plan = planWeeklyRunVolume(input, 1);
  assert(plan.targetKmMax <= 22, `Case B: km target should stay conservative, max=${plan.targetKmMax}`);
  console.log("Case B (beginner 0-10km): OK");
}

function testInjuryConservative() {
  const input = advancedInput({
    has_injury: true,
    notes: "Injury flags: knee | low impact preference",
    current_run_volume_band: "35-50km/week",
  });
  const weeks = generate12WeekProgramme(input);
  const plan = planWeeklyRunVolume(input, 1);
  assert(plan.preferredRunSessionsPerWeek <= 3, "Case C: injury should cap preferred runs");
  assert(plan.targetKmMax < 50, "Case C: injury should reduce km targets");
  const w1runs = countRunExposuresInSchedule(weeks[0].plan_json.schedule);
  assert(w1runs <= 4, `Case C: injury week should not overload runs (${w1runs})`);
  console.log("Case C (injury / impact): OK");
}

function main() {
  testAdvancedHighVolume();
  testBeginnerLowVolume();
  testInjuryConservative();
  console.log("\nqa-programme-run-progression: all cases passed");
}

main();
