/**
 * QA: coaching methodology — hybrid muscle-building + low-impact engine support.
 * Run: npx tsx scripts/qa-programme-coaching-methodology.ts
 */

import { generate12WeekProgramme } from "../app/lib/generate12WeekProgramme";
import { mapAssessmentToProgrammeInput } from "../app/lib/mapAssessmentToProgrammeInput";
import { summariseThresholdVolume } from "../app/lib/thresholdVolumeTracking";
import type { DayPlan } from "../app/lib/sessionLibrary";
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
  const weeks = generate12WeekProgramme(input);
  const w1 = weeks[0]!.plan_json.schedule as DayPlan[];

  const strengthDays = w1.filter((d) => {
    const t0 = d.tags?.[0] ?? "";
    return t0.startsWith("strength") || /strength|circuit|hypertrophy|functional/i.test(d.title);
  });
  assert(strengthDays.length >= 2, "General hybrid muscle: week 1 needs ≥2 strength-focused days");

  const hyroxOnly = w1.filter((d) => /wall ball|hyrox compromised/i.test(d.title));
  assert(hyroxOnly.length <= 1, "Muscle profile should not be overly HYROX-specific");

  const vagueStrength = w1.filter((d) => hasVagueStrengthPrescription(d));
  assert(vagueStrength.length === 0, "General hybrid: strength sessions should name specific exercises");

  const bikeNote = w1.some((d) =>
    /bike|row|erg|optional support/i.test(
      `${d.title} ${(d.session?.notes ?? []).join(" ")}`
    )
  );
  assert(bikeNote || strengthDays.length >= 2, "General hybrid: bike/erg support optional or strength focus");

  console.log("✓ General hybrid muscle-building — adequate strength exposure");
}

function testLowImpactEngine() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "Improve Hybrid / Hyrox Performance",
      event_type: "Hyrox Open",
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

  const weeks = generate12WeekProgramme(input);
  const w1 = weeks[0]!.plan_json.schedule as DayPlan[];
  const notes = w1.flatMap((d) => d.session?.notes ?? []).join(" ");

  const thr = summariseThresholdVolume(w1);
  assert(
    thr.erg_threshold_minutes > 0 || /bike|row|ski|low.?impact|without unnecessary impact/i.test(notes),
    "Low-impact: erg/bike engine support or coaching note expected"
  );

  const runMains = w1
    .filter((d) => (d.tags?.[0] ?? "") === "interval_run" || (d.tags?.[0] ?? "") === "threshold_run")
    .flatMap((d) => d.session?.main ?? [])
    .join(" ");
  assert(
    !/\b12\s*x\s*400\b/i.test(runMains) || /substitut|bike|row/i.test(notes),
    "Low-impact: avoid heavy run intervals without alternatives noted"
  );

  console.log("✓ Low-impact — erg/bike engine support, conservative run exposure");
}

function main() {
  testGeneralHybridMuscle();
  testLowImpactEngine();
  console.log("\nAll coaching methodology QA checks passed.");
}

main();
