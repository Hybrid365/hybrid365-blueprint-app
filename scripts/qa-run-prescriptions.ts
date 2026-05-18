/**
 * QA: individualised run session prescriptions (pace, HR, RPE).
 * Run: npm run qa:run-prescriptions
 */

import { generate12WeekProgramme } from "../app/lib/generate12WeekProgramme";
import { mapAssessmentToProgrammeInput } from "../app/lib/mapAssessmentToProgrammeInput";
import type { RunPrescription } from "../app/lib/runPrescription";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

type ScheduleDay = {
  title: string;
  tags?: string[];
  run_prescription?: RunPrescription;
};

function firstThresholdSession(weeks: { plan_json: { schedule: ScheduleDay[] } }[]) {
  for (const week of weeks) {
    for (const day of week.plan_json.schedule) {
      const t0 = day.tags?.[0] ?? "";
      if (t0 === "threshold_run" || /threshold/i.test(day.title)) {
        return day;
      }
    }
  }
  return null;
}

function testCaseA() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "Improve Hybrid / Hyrox Performance",
      event_type: "No event booked",
      event_date: null,
      target_time: null,
      training_days_per_week: 5,
      weekly_hours_band: "7-10",
      preferred_training_days: null,
      double_session_days: null,
      recent_5k_time: "16:30",
      max_heart_rate: 190,
      strength_experience: "advanced",
      hyrox_experience: "competitive",
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: null,
      notes: null,
      hyrox_pb: null,
    },
    benchmarkTests: [],
    email: "qa-a@hybrid365.local",
    profile: null,
  });

  const weeks = generate12WeekProgramme(input);
  const session = firstThresholdSession(weeks);
  assert(session, "Case A: expected a threshold run session");
  const rx = session.run_prescription;
  assert(rx, "Case A: threshold session must have run_prescription");
  assert(rx.pace_range, "Case A: expected pace_range");
  assert(rx.hr_range, "Case A: expected hr_range");
  assert(/RPE/i.test(rx.rpe), "Case A: expected RPE");
  assert(rx.coach_note.length > 10, "Case A: expected coach_note");
  console.log("✓ Case A (16:30 5km + max HR 190): pace, HR, RPE present");
}

function testCaseB() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "Run Faster / Improve Engine",
      event_type: "No event booked",
      event_date: null,
      target_time: null,
      training_days_per_week: 4,
      weekly_hours_band: "5-7",
      preferred_training_days: null,
      double_session_days: null,
      recent_5k_time: "24:00",
      max_heart_rate: null,
      strength_experience: "intermediate",
      hyrox_experience: null,
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: null,
      notes: null,
      hyrox_pb: null,
    },
    benchmarkTests: [],
    email: "qa-b@hybrid365.local",
    profile: null,
  });

  const weeks = generate12WeekProgramme(input);
  const session = firstThresholdSession(weeks);
  assert(session?.run_prescription, "Case B: expected run_prescription");
  const rx = session.run_prescription!;
  assert(rx.pace_range, "Case B: expected pace_range");
  assert(!rx.hr_range, "Case B: must not include hr_range without max HR");
  assert(/RPE/i.test(rx.rpe), "Case B: expected RPE");
  console.log("✓ Case B (24:00 5km, no max HR): pace + RPE, no HR");
}

function testCaseC() {
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
      recent_5k_time: null,
      max_heart_rate: null,
      strength_experience: "beginner",
      hyrox_experience: null,
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: null,
      notes: null,
      hyrox_pb: null,
    },
    benchmarkTests: [],
    email: "qa-c@hybrid365.local",
    profile: null,
  });

  const weeks = generate12WeekProgramme(input);
  const session = firstThresholdSession(weeks);
  assert(session?.run_prescription, "Case C: expected run_prescription");
  const rx = session.run_prescription!;
  assert(!rx.pace_range, "Case C: must not include pace_range without 5km");
  assert(!rx.hr_range, "Case C: must not include hr_range");
  assert(/RPE/i.test(rx.rpe), "Case C: expected RPE");
  assert(/talk-test/i.test(rx.effort_description), "Case C: expected talk-test guidance");
  console.log("✓ Case C (no 5km, no max HR): RPE + talk-test, no pace/HR");
}

function main() {
  testCaseA();
  testCaseB();
  testCaseC();
  console.log("\nAll run prescription QA checks passed.");
}

main();
