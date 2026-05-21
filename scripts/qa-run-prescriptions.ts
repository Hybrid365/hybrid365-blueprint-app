/**
 * QA: individualised run session prescriptions (pace, treadmill, HR, RPE).
 * Run: npm run qa:run-prescriptions
 */

import { generate12WeekProgramme } from "../app/lib/generate12WeekProgramme";
import { mapAssessmentToProgrammeInput } from "../app/lib/mapAssessmentToProgrammeInput";
import { treadmillSpeedRangeFromPaceRange } from "../app/lib/paceGuidance";
import type { RunPrescription } from "../app/lib/runPrescription";
import { enrichRunPrescription } from "../app/lib/runPrescription";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

type ScheduleDay = {
  title: string;
  tags?: string[];
  run_prescription?: RunPrescription;
};

function firstSession(
  weeks: { plan_json: { schedule: ScheduleDay[] } }[],
  match: (d: ScheduleDay) => boolean
) {
  for (const week of weeks) {
    for (const day of week.plan_json.schedule) {
      if (match(day)) return day;
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
  const session = firstSession(
    weeks,
    (d) => d.tags?.[0] === "threshold_run" || /threshold/i.test(d.title)
  );
  assert(session, "Case A: expected a threshold run session");
  const rx = enrichRunPrescription(session.run_prescription!);
  assert(rx.pace_range, "Case A: expected pace_range");
  assert(rx.treadmill_speed_range, "Case A: expected treadmill_speed_range");
  assert(/km\/h/i.test(rx.treadmill_speed_range), "Case A: treadmill must be km/h");
  assert(rx.hr_range, "Case A: expected hr_range");
  assert(/RPE/i.test(rx.rpe), "Case A: expected RPE");
  assert(rx.coach_note.length > 10, "Case A: expected coach_note");
  assert(rx.personalization_line, "Case A: personalization line");
  console.log("✓ Case A (16:30 5km + max HR 190): pace, treadmill, HR, RPE");
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
  const session = firstSession(
    weeks,
    (d) => d.tags?.[0] === "threshold_run" || /threshold/i.test(d.title)
  );
  assert(session?.run_prescription, "Case B: expected run_prescription");
  const rx = enrichRunPrescription(session.run_prescription!);
  assert(rx.pace_range, "Case B: expected pace_range");
  assert(rx.treadmill_speed_range, "Case B: expected treadmill_speed_range");
  assert(!rx.hr_range, "Case B: must not include hr_range without max HR");
  assert(rx.hr_add_note, "Case B: HR add note when no max HR");
  assert(/RPE/i.test(rx.rpe), "Case B: expected RPE");
  console.log("✓ Case B (24:00 5km, no max HR): pace + treadmill + RPE, no HR");
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
  const session = firstSession(
    weeks,
    (d) => d.tags?.[0] === "threshold_run" || /threshold/i.test(d.title)
  );
  assert(session?.run_prescription, "Case C: expected run_prescription");
  const rx = enrichRunPrescription(session.run_prescription!);
  assert(!rx.pace_range, "Case C: must not include pace_range without 5km");
  assert(!rx.treadmill_speed_range, "Case C: no treadmill without pace");
  assert(!rx.hr_range, "Case C: must not include hr_range");
  assert(/RPE/i.test(rx.rpe), "Case C: expected RPE");
  assert(/talk-test|Pace target unavailable/i.test(rx.pace_unavailable_note ?? rx.effort_description), "Case C: fallback guidance");
  console.log("✓ Case C (no 5km, no max HR): RPE + talk-test, no pace/treadmill/HR");
}

function testCaseD() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "Improve Hybrid / Hyrox Performance",
      event_type: "Hyrox Open",
      event_date: null,
      target_time: null,
      training_days_per_week: 5,
      weekly_hours_band: "7-10",
      preferred_training_days: null,
      double_session_days: null,
      recent_5k_time: "20:00",
      max_heart_rate: 185,
      strength_experience: "intermediate",
      hyrox_experience: "intermediate",
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: null,
      notes: null,
      hyrox_pb: null,
    },
    benchmarkTests: [],
    email: "qa-d@hybrid365.local",
    profile: null,
  });

  const weeks = generate12WeekProgramme(input);
  const session = firstSession(weeks, (d) => d.tags?.[0] === "hybrid_compromised");
  assert(session, "Case D: expected hybrid compromised session");
  const rx = enrichRunPrescription(session.run_prescription!);
  assert(rx.pace_range, "Case D: pace range when 5km exists");
  assert(rx.treadmill_speed_range, "Case D: treadmill when pace exists");
  assert(/HYROX|compromise|repeatability|stations/i.test(rx.coach_note), "Case D: compromised effort note");
  console.log("✓ Case D (HYROX compromised + 5km): pace, treadmill, compromised coach note");
}

function testTreadmillMath() {
  const pace = "5:00–5:30/km";
  const t = treadmillSpeedRangeFromPaceRange(pace);
  assert(t === "10.9–12.0 km/h" || t === "11.0–12.0 km/h", `5:00/km band expected ~12 km/h, got ${t}`);
  const fast = treadmillSpeedRangeFromPaceRange("4:00–4:10/km");
  assert(fast && parseFloat(fast) >= 14, `4:00/km should be ~15 km/h, got ${fast}`);
  console.log("✓ Treadmill conversion sanity");
}

function main() {
  testTreadmillMath();
  testCaseA();
  testCaseB();
  testCaseC();
  testCaseD();
  console.log("\nAll run prescription QA checks passed.");
}

main();
