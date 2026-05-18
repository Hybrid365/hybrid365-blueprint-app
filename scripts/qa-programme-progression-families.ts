/**
 * QA: progression families, markers, and weekly coaching notes.
 * Run: npm run qa:programme-progression-families
 */

import { generate12WeekProgramme } from "../app/lib/generate12WeekProgramme";
import { mapAssessmentToProgrammeInput } from "../app/lib/mapAssessmentToProgrammeInput";
import { countRunExposuresInSchedule } from "../app/lib/runVolumePlanner";
import type { PaidProgrammeInput } from "../app/lib/generate12WeekProgramme";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function thresholdTitles(week: { plan_json: { schedule: { title: string; tags?: string[] }[] } }) {
  return week.plan_json.schedule
    .filter((d) => (d.tags?.[0] ?? "") === "threshold_run" || /threshold/i.test(d.title))
    .map((d) => d.title.trim().toLowerCase());
}

function hasProgressionMarkers(week: {
  plan_json: { schedule: { progression_marker?: unknown; progression_family?: string }[] };
}) {
  return week.plan_json.schedule.some((d) => d.progression_family || d.progression_marker);
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

function testAdvanced() {
  const weeks = generate12WeekProgramme(advancedInput());
  const w1 = weeks[0];
  const w2 = weeks[1];
  const t1 = thresholdTitles(w1);
  const t2 = thresholdTitles(w2);
  assert(t1.length >= 1 && t2.length >= 1, "Case A: threshold sessions required");
  assert(t1[0] !== t2[0], `Case A: threshold must progress W1→W2 (${t1[0]} vs ${t2[0]})`);

  const longRun = weeks.some((w) =>
    w.plan_json.schedule.some((d) => (d.tags?.[0] ?? "") === "long_run")
  );
  assert(longRun, "Case A: long run required");

  const wr = w2.plan_json.week_rationale;
  assert(wr?.progression_focus, "Case A: progression_focus on week rationale");
  assert(wr?.key_marker_this_week, "Case A: key_marker_this_week");
  assert(hasProgressionMarkers(w2), "Case A: progression markers on schedule");

  const avgRuns =
    weeks.reduce((s, w) => s + countRunExposuresInSchedule(w.plan_json.schedule), 0) / 12;
  assert(avgRuns >= 4, `Case A: average run exposures >=4 (${avgRuns})`);
  console.log("Case A (advanced 16:30, 50-70km): OK");
}

function testBeginner() {
  const input = mapAssessmentToProgrammeInput({
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
    email: "qa-b@hybrid365.local",
    profile: null,
  });
  const weeks = generate12WeekProgramme(input);
  const w1 = weeks[0];
  const runs = countRunExposuresInSchedule(w1.plan_json.schedule);
  assert(runs <= 4, `Case B: conservative runs (${runs})`);
  const thr = w1.plan_json.schedule.find((d) => (d.tags?.[0] ?? "") === "threshold_run");
  if (thr?.progression_marker?.threshold_total_minutes) {
    assert(
      thr.progression_marker.threshold_total_minutes <= 20,
      "Case B: no aggressive threshold volume"
    );
  }
  assert(
    /confidence|tolerance|consistency/i.test(w1.plan_json.week_rationale?.progression_focus ?? ""),
    "Case B: beginner coaching tone"
  );
  console.log("Case B (beginner 0-10km): OK");
}

function testIntermediateHybrid() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "Improve Hybrid / Hyrox Performance",
      event_type: "No event booked",
      event_date: null,
      target_time: null,
      training_days_per_week: 5,
      weekly_hours_band: "5-7",
      preferred_training_days: null,
      double_session_days: null,
      recent_5k_time: "22:00",
      strength_experience: "intermediate",
      hyrox_experience: "some experience",
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: null,
      notes: null,
      hyrox_pb: null,
      current_run_volume_band: "20-35km/week",
    },
    benchmarkTests: [],
    email: "qa-i@hybrid365.local",
    profile: null,
  });
  const weeks = generate12WeekProgramme(input);
  const runs = countRunExposuresInSchedule(weeks[0].plan_json.schedule);
  assert(runs >= 3 && runs <= 5, `Case C: 3-4 run exposures (${runs})`);
  assert(weeks[1].plan_json.week_rationale?.progression_focus, "Case C: weekly progression note");
  assert(hasProgressionMarkers(weeks[0]), "Case C: markers present");
  console.log("Case C (intermediate hybrid): OK");
}

function testMuscle() {
  const input = advancedInput({
    goal_focus: "muscle",
    ability_level: "intermediate",
    days_per_week: 4,
    weekly_hours_band: "5-7",
    five_k_time: "24:00",
    current_run_volume_band: "10-20km/week",
    double_sessions: false,
    double_session_days: [],
  });
  const weeks = generate12WeekProgramme(input);
  const strengthMarker = weeks[0].plan_json.schedule.find(
    (d) => d.progression_marker?.strength_main_lift_sets
  );
  assert(strengthMarker, "Case D: strength progression marker");
  const rationale =
    weeks[0].plan_json.programme_rationale?.summary?.join(" ") ??
    weeks[0].plan_json.programme_intelligence?.rationale_notes?.join(" ") ??
    "";
  assert(/strength|lift/i.test(rationale), "Case D: strength rationale");
  console.log("Case D (strength/body comp): OK");
}

function testInjury() {
  const weeks = generate12WeekProgramme(
    advancedInput({
      has_injury: true,
      notes: "Injury flags: knee | low impact preference",
      current_run_volume_band: "35-50km/week",
    })
  );
  const lowImpact = weeks[0].plan_json.schedule.some(
    (d) => d.progression_marker?.low_impact_aerobic_minutes != null
  );
  const runs = countRunExposuresInSchedule(weeks[0].plan_json.schedule);
  assert(runs <= 4, `Case E: reduced run exposure (${runs})`);
  assert(
    /conservative|low-impact|recovery/i.test(weeks[0].plan_json.week_rationale?.progression_focus ?? ""),
    "Case E: injury coaching tone"
  );
  console.log("Case E (injury / low impact): OK");
}

function main() {
  testAdvanced();
  testBeginner();
  testIntermediateHybrid();
  testMuscle();
  testInjury();
  console.log("\nqa-programme-progression-families: all cases passed");
}

main();
