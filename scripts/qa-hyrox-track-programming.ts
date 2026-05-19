/**
 * QA: HYROX track programming (session bias, progression, coaching).
 * Run: npm run qa:hyrox-track-programming
 */

import { generate12WeekProgramme } from "../app/lib/generate12WeekProgramme";
import { mapAssessmentToProgrammeInput } from "../app/lib/mapAssessmentToProgrammeInput";
import { detectHyroxTrack } from "../app/lib/hyroxTrackContext";
import { analyseProgrammePreview } from "../app/lib/internalProgrammePreviewAnalysis";
import { ergThresholdReplacedRunAnchor } from "../app/lib/ergThresholdSupport";
import {
  analyzeWeeklyRhythm,
  classifyDayPlan,
  hasVagueStrengthPrescription,
} from "../app/lib/sessionStressClassification";
import {
  hasRunThresholdAnchor,
  isRunThresholdAnchorDay,
  summariseThresholdVolume,
} from "../app/lib/thresholdVolumeTracking";
import {
  countRunExposuresInSchedule,
  estimatePlannedRunKmFromSchedule,
  planWeeklyRunVolume,
} from "../app/lib/runVolumePlanner";
import { buildRoleByDayFromSchedule } from "../app/lib/weekScheduleRepair";
import {
  countHardRunExposures,
  hasBikeOrErgAerobicSupport,
  isFloatOrIntervalQuality,
  maxHardRunExposuresForHyroxPro,
  mondayViolatesSundayRecovery,
  sundayIsLongAerobic,
  weekHasThresholdAndCompromised,
} from "../app/lib/hyroxRunIntensityPolicy";
import type { DayPlan } from "../app/lib/sessionLibrary";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

type ScheduleDay = {
  day: string;
  title: string;
  tags?: string[];
  template_id?: string;
  progression_family?: string;
  progression_marker?: { threshold_total_minutes?: number; erg_threshold_minutes?: number };
  run_prescription?: { pace_range?: string | null; coach_note?: string };
  session?: { main?: string[]; notes?: string[] };
};

function thresholdSessions(schedule: ScheduleDay[]) {
  return schedule.filter((d) => {
    const t0 = d.tags?.[0] ?? "";
    return t0 === "threshold_run" || /threshold/i.test(d.title);
  });
}

function compromisedSessions(schedule: ScheduleDay[]) {
  return schedule.filter((d) => {
    const t0 = d.tags?.[0] ?? "";
    return t0 === "hybrid_compromised" || /compromised|hyrox/i.test(d.title);
  });
}

function wallBallSignals(schedule: ScheduleDay[]) {
  const hits: string[] = [];
  for (const d of schedule) {
    const blob = `${d.title} ${(d.session?.notes ?? []).join(" ")}`.toLowerCase();
    if (/wall\s*ball/.test(blob)) hits.push(d.title);
  }
  return hits;
}

function testCaseA() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "Improve Hybrid / Hyrox Performance",
      event_type: "Hyrox Pro",
      event_date: "2026-09-01",
      target_time: "1:05:00",
      training_days_per_week: 6,
      weekly_hours_band: "10+",
      preferred_training_days: null,
      double_session_days: ["Mon", "Wed"],
      recent_5k_time: "16:30",
      max_heart_rate: 192,
      strength_experience: "advanced",
      hyrox_experience: "competitive",
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: "Running under fatigue after stations",
      notes: null,
      hyrox_pb: "1:08:00",
      current_run_volume_band: "50-70km/week",
    },
    benchmarkTests: [],
    email: "qa-hyrox-pro@hybrid365.local",
    profile: null,
  });

  assert(input.hyrox_track?.active, "Case A: hyrox_track must be active");
  assert(input.hyrox_track?.hyrox_event_type === "pro", "Case A: expect pro event type");

  const weeks = generate12WeekProgramme(input);
  const w1 = weeks[0]!.plan_json.schedule as DayPlan[];
  const w2 = weeks[1]!.plan_json.schedule as DayPlan[];

  assert(thresholdSessions(w1).length >= 1, "Case A: week 1 needs threshold");
  assert(compromisedSessions(w1).length >= 1, "Case A: week 1 needs compromised/hyrox hybrid");
  assert(
    weeks[0]!.plan_json.week_rationale?.coach_note?.includes("Hyrox"),
    "Case A: HYROX coaching in week rationale"
  );

  const t1 = thresholdSessions(w1)[0]?.title ?? "";
  const t2 = thresholdSessions(w2)[0]?.title ?? "";
  assert(
    t1 !== t2 || thresholdSessions(w1)[0]?.template_id !== thresholdSessions(w2)[0]?.template_id,
    "Case A: threshold should progress or differ week 1 vs 2"
  );

  const rationale = weeks[0]!.plan_json.programme_rationale;
  assert(
    rationale?.summary?.some((s) => /hyrox|pro/i.test(s)) ||
      rationale?.key_priorities?.some((s) => /threshold|compromised|station/i.test(s)),
    "Case A: programme rationale mentions HYROX priorities"
  );

  const analysis = analyseProgrammePreview(weeks, input);
  const w2Rhythm = analyzeWeeklyRhythm(w2);
  assert(
    w2Rhythm.max_consecutive_hard < 3 ||
      w2.some((d) =>
        (d.session?.notes ?? []).some((n) => /optional support aerobic|fatigue is high/i.test(n))
      ),
    "Case A: 3+ consecutive hard days must include fatigue monitoring note"
  );

  assert(hasRunThresholdAnchor(w1), "Case A: week 1 must have run threshold anchor");
  assert(hasRunThresholdAnchor(w2), "Case A: week 2 must keep run threshold anchor (not replaced by erg)");
  const w1RunThr = w1.find(isRunThresholdAnchorDay)!;
  const w2RunThr = w2.find(isRunThresholdAnchorDay)!;
  assert(
    !w2RunThr.progression_family?.startsWith("erg_threshold_"),
    "Case A: week 2 primary threshold must not be erg-only"
  );
  assert(
    w1RunThr.title !== w2RunThr.title ||
      (w2RunThr.progression_marker?.threshold_total_minutes ?? 0) >=
        (w1RunThr.progression_marker?.threshold_total_minutes ?? 0),
    "Case A: week 2 run threshold should progress vs week 1"
  );

  const w2ThrVol = summariseThresholdVolume(w2);
  const w3ThrVol = summariseThresholdVolume(weeks[2]!.plan_json.schedule as DayPlan[]);
  assert(w2ThrVol.run_threshold_minutes > 0, "Case A: week 2 run threshold minutes required");
  assert(
    w3ThrVol.total_threshold_minutes >= w2ThrVol.total_threshold_minutes - 5,
    "Case A: threshold volume should progress or hold into week 3"
  );

  const sun = w2.find((d) => d.day === "Sun");
  const mon = w2.find((d) => d.day === "Mon");
  if (sun && mon && sundayIsLongAerobic(sun)) {
    const roleByDay = buildRoleByDayFromSchedule(w2);
    assert(
      !mondayViolatesSundayRecovery(mon, roleByDay.get("Mon")),
      "Case A: Monday should be easy/recovery after Sunday long"
    );
  }

  const lowerHyrox = w1.find((d) =>
    /hyrox lower|lower_strength_hyrox/i.test(`${d.progression_family ?? ""} ${d.title}`)
  );
  if (lowerHyrox) {
    const blob = (lowerHyrox.session?.main ?? []).join(" ").toLowerCase();
    assert(/calf iso|soleus iso/i.test(blob), "Case A: HYROX lower should include calf isometrics");
  }

  const lowerDay = w1.find(
    (d) =>
      (d.tags?.[0] ?? "") === "strength_lower" ||
      /hyrox lower|lower strength/i.test(d.title)
  );
  if (lowerDay) {
    const main = (lowerDay.session?.main ?? []).join(" ");
    assert(
      !hasVagueStrengthPrescription(lowerDay) &&
        /squat|lunge|wall sit|sled/i.test(main),
      "Case A: HYROX lower strength should use specific movements"
    );
  }

  const longRun = w1.find((d) => (d.tags?.[0] ?? "") === "long_run");
  if (longRun?.run_prescription) {
    assert(
      /conversational|aerobic|easy/i.test(longRun.run_prescription.coach_note ?? ""),
      "Case A: long run prescription should be easy/conservative"
    );
  }

  assert(analysis.warnings.length < 30, "Case A: preview warnings should be bounded");

  console.log("✓ Case A: HYROX Pro — threshold, compromised, rhythm, erg, specific strength");
}

function testCaseB() {
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
      recent_5k_time: "22:00",
      max_heart_rate: null,
      strength_experience: "intermediate",
      hyrox_experience: "some experience",
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: "Wall balls gas me early",
      notes: null,
      hyrox_pb: null,
      current_run_volume_band: "20-35km/week",
    },
    benchmarkTests: [],
    email: "qa-hyrox-open@hybrid365.local",
    profile: null,
  });

  assert(input.hyrox_track?.active, "Case B: hyrox_track active");
  assert(
    input.hyrox_track?.station_weaknesses.includes("wall_balls"),
    "Case B: wall ball weakness parsed"
  );

  const weeks = generate12WeekProgramme(input);
  const schedule = weeks[2]!.plan_json.schedule as DayPlan[];

  assert(thresholdSessions(schedule).length >= 1, "Case B: running still scheduled");
  const wb = wallBallSignals(schedule);
  assert(wb.length >= 1 || compromisedSessions(schedule).length >= 1, "Case B: wall ball or density signal");

  const maxThresholdReps = schedule.filter((d) =>
    /6\s*x\s*6|7\s*x\s*5|8\s*x\s*4/i.test(d.title)
  );
  assert(maxThresholdReps.length <= 1, "Case B: not overly advanced threshold titling in week 3");

  const sun = schedule.find((d) => d.day === "Sun");
  const mon = schedule.find((d) => d.day === "Mon");
  if (sun) {
    const c = classifyDayPlan(sun);
    assert(
      c.session_stress !== "high" || (sun.tags?.[0] ?? "") === "long_run" || /long/i.test(sun.title ?? ""),
      "Case B: Sunday should anchor longer aerobic, not arbitrary high stress"
    );
  }
  if (mon) {
    assert(
      classifyDayPlan(mon).session_stress !== "high",
      "Case B: Monday should be recovery/easier for HYROX Open"
    );
  }

  const roleByDay = buildRoleByDayFromSchedule(schedule);
  const rhythm = analyzeWeeklyRhythm(schedule, roleByDay);
  assert(rhythm.max_consecutive_hard < 3, "Case B: no 3 consecutive hard days in week 3");

  console.log("✓ Case B: HYROX Open + wall balls — Sunday/Monday rhythm, durability bias");
}

function testCaseC() {
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
      recent_5k_time: "26:00",
      max_heart_rate: null,
      strength_experience: "intermediate",
      hyrox_experience: null,
      equipment: ["Minimal Equipment"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: "Sled and ski erg — no access at my gym",
      notes: "No sled, no wall balls, no SkiErg at home gym",
      hyrox_pb: null,
      current_run_volume_band: "10-20km/week",
    },
    benchmarkTests: [],
    email: "qa-hyrox-limited@hybrid365.local",
    profile: null,
  });

  assert(input.hyrox_track?.active, "Case C: hyrox track");
  assert(input.hyrox_track?.equipment_limited, "Case C: equipment limited flag");

  const weeks = generate12WeekProgramme(input);
  const schedule = weeks[0]!.plan_json.schedule as DayPlan[];
  const notesBlob = schedule.flatMap((d) => d.session?.notes ?? []).join(" ");

  assert(
    /reduced specificity|substitut|limited hyrox equipment/i.test(notesBlob) ||
      input.hyrox_track?.equipment_note,
    "Case C: coaching note about reduced specificity"
  );

  const sledOnly = schedule.filter((d) => {
    const main = (d as ScheduleDay & { session?: { main?: string[] } }).session?.main?.join(" ") ?? "";
    return (
      /sled push/i.test(main) &&
      !/substitut|alternative|or heavy marching|backward drag|leg press|if sled|no sled/i.test(
        main.toLowerCase()
      )
    );
  });
  assert(sledOnly.length === 0, "Case C: should not prescribe raw sled-only main work without substitutes");

  console.log("✓ Case C: limited equipment — substitutions + specificity note");
}

/** Matches internal preview preset A: 7 days, doubles, 16:30 5k, 50–70km. */
function testAdvancedHyroxPro7Day() {
  const input = mapAssessmentToProgrammeInput({
    assessment: {
      goal_focus: "Improve Hybrid / Hyrox Performance",
      event_type: "Hyrox Pro",
      event_date: "2026-09-15",
      target_time: "1:05:00",
      training_days_per_week: 7,
      weekly_hours_band: "10+",
      preferred_training_days: null,
      double_session_days: ["Tue", "Thu", "Sat"],
      recent_5k_time: "16:30",
      max_heart_rate: 192,
      strength_experience: "advanced",
      hyrox_experience: "competitive",
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: "Running under fatigue after stations",
      notes: null,
      hyrox_pb: "1:08:00",
      current_run_volume_band: "50-70km/week",
    },
    benchmarkTests: [],
    email: "qa-hyrox-pro-7d@hybrid365.local",
    profile: null,
  });

  assert(input.hyrox_track?.active, "7d Pro: hyrox track active");
  assert(input.ability_level === "advanced", "7d Pro: advanced ability");
  assert(input.days_per_week === 7, "7d Pro: seven training days");

  const weeks = generate12WeekProgramme(input);
  function doubleIntentCounts(schedule: DayPlan[]) {
    let aerobic = 0;
    let thrPlusAerobic = 0;
    let doubleThr = 0;
    for (const d of schedule) {
      const intent = d.double_session?.double_session_intent;
      if (intent === "aerobic_support") aerobic += 1;
      if (intent === "threshold_plus_aerobic") thrPlusAerobic += 1;
      if (intent === "double_threshold") doubleThr += 1;
    }
    return { aerobic, thrPlusAerobic, doubleThr };
  }

  for (const wn of [1, 2, 3]) {
    const schedule = weeks[wn - 1]!.plan_json.schedule as DayPlan[];
    const summary = weeks[wn - 1]!.plan_json.double_session_summary;
    assert(summary?.phase === "early_aerobic", `Week ${wn}: expected early_aerobic double phase`);
    const counts = doubleIntentCounts(schedule);
    assert(counts.doubleThr === 0, `Week ${wn}: no double-threshold in weeks 1–3`);
    assert(
      counts.aerobic + (summary?.strength_endurance_addon_count ?? 0) >= 1,
      `Week ${wn}: expected aerobic doubles in early block`
    );
    assert(hasRunThresholdAnchor(schedule), `Week ${wn}: run threshold anchor required`);
    const mon = schedule.find((d) => d.day === "Mon");
    assert(
      !mon?.double_session?.enabled ||
        mon.double_session?.double_session_intent !== "double_threshold",
      `Week ${wn}: Monday must not be double-threshold`
    );
  }

  for (const wn of [5, 6, 7]) {
    const schedule = weeks[wn - 1]!.plan_json.schedule as DayPlan[];
    const summary = weeks[wn - 1]!.plan_json.double_session_summary;
    assert(
      summary?.phase === "threshold_plus_aerobic",
      `Week ${wn}: expected threshold_plus_aerobic double phase`
    );
    const counts = doubleIntentCounts(schedule);
    assert(
      counts.thrPlusAerobic >= 1,
      `Week ${wn}: run threshold + easy aerobic support double expected`
    );
    assert(hasRunThresholdAnchor(schedule), `Week ${wn}: run threshold anchor required`);
  }

  let doubleThrWeeks = 0;
  for (const wn of [9, 10, 11]) {
    const schedule = weeks[wn - 1]!.plan_json.schedule as DayPlan[];
    const summary = weeks[wn - 1]!.plan_json.double_session_summary;
    assert(
      summary?.phase === "late_double_threshold",
      `Week ${wn}: expected late_double_threshold phase`
    );
    const counts = doubleIntentCounts(schedule);
    if (counts.doubleThr >= 1) doubleThrWeeks += 1;
    assert(hasRunThresholdAnchor(schedule), `Week ${wn}: run threshold anchor still required`);
    assert(
      !ergThresholdReplacedRunAnchor(schedule),
      `Week ${wn}: erg must support run anchor, not replace it`
    );
  }
  assert(doubleThrWeeks >= 1, "Weeks 9–11: at least one double-threshold week expected");

  const w12Thr = summariseThresholdVolume(weeks[11]!.plan_json.schedule as DayPlan[]);
  const w11Thr = summariseThresholdVolume(weeks[10]!.plan_json.schedule as DayPlan[]);
  assert(
    w12Thr.total_threshold_minutes <= w11Thr.total_threshold_minutes + 5,
    "Week 12: threshold volume should taper vs week 11"
  );

  const buildWeeks = [1, 2, 3, 5, 6, 7, 9, 10, 11];
  for (const wn of buildWeeks) {
    const schedule = weeks[wn - 1]!.plan_json.schedule as DayPlan[];
    const sun = schedule.find((d) => d.day === "Sun");
    const mon = schedule.find((d) => d.day === "Mon");
    const roleByDay = buildRoleByDayFromSchedule(schedule);
    if (sun && mon && sundayIsLongAerobic(sun)) {
      assert(
        !mondayViolatesSundayRecovery(mon, roleByDay.get("Mon")),
        `Week ${wn}: Monday must be easy/recovery after Sunday long`
      );
    }

    const hardRuns = countHardRunExposures(schedule, roleByDay);
    const hardCap = maxHardRunExposuresForHyroxPro(
      wn,
      weeks[wn - 1]!.plan_json.week_context?.week_focus
    );
    assert(
      hardRuns <= hardCap,
      `Week ${wn}: max ${hardCap} hard run exposures (got ${hardRuns})`
    );

    if (wn === 1) {
      assert(hasRunThresholdAnchor(schedule), "Week 1: threshold anchor required");
      assert(
        schedule.some(
          (d) => d.tags?.[0] === "long_run" || /long run|long zone|long aerobic/i.test(d.title)
        ),
        "Week 1: long aerobic run required"
      );
      if (weekHasThresholdAndCompromised(schedule)) {
        const intervals = schedule.filter(
          (d) => d.tags?.[0] === "interval_run" || isFloatOrIntervalQuality(d)
        );
        assert(
          intervals.length === 0,
          `Week 1: no interval/float when threshold + compromised both present (got ${intervals.map((d) => d.title).join(", ")})`
        );
      }
      assert(
        hasBikeOrErgAerobicSupport(schedule),
        "Week 1: bike/erg aerobic support should be present"
      );
    }

    const runs = countRunExposuresInSchedule(schedule);
    const runFloor = wn === 1 ? 3 : 4;
    if (wn <= 2) {
      assert(runs >= runFloor, `Week ${wn}: need ≥${runFloor} run exposures (got ${runs})`);
    }

    const rhythm = analyzeWeeklyRhythm(schedule, roleByDay);
    assert(
      rhythm.max_consecutive_hard < 3 ||
        schedule.some((d) =>
          (d.session?.notes ?? []).some((n) => /fatigue is high|optional support aerobic/i.test(n))
        ),
      `Week ${wn}: no 3 consecutive hard days without fatigue monitoring guidance`
    );

    const plannedKm = estimatePlannedRunKmFromSchedule(schedule);
    const volPlan = planWeeklyRunVolume(input, wn, weeks[wn - 1]!.plan_json.week_context?.week_focus);
    const kmFloor =
      wn <= 3 ? Math.max(34, volPlan.targetKmMin - 10) : Math.max(40, volPlan.targetKmMin - 5);
    assert(
      plannedKm >= kmFloor,
      `Week ${wn}: planned run volume should be ≥${kmFloor}km for 50–70 band (got ~${plannedKm}km) — intensity protected over raw km`
    );
    const kmCap = Math.min(75, volPlan.targetKmMax + 15);
    assert(
      plannedKm <= kmCap,
      `Week ${wn}: planned run volume should not exceed 70km band cap (got ~${plannedKm}km)`
    );

    const lowerHyrox = schedule.find((d) =>
      /hyrox lower|lower_strength_hyrox/i.test(`${d.progression_family ?? ""} ${d.title}`)
    );
    if (lowerHyrox) {
      assert(!lowerHyrox.run_prescription, `Week ${wn}: HYROX lower must not have run prescription`);
      const blob = (lowerHyrox.session?.main ?? []).join(" ").toLowerCase();
      assert(/calf iso|soleus iso/i.test(blob), `Week ${wn}: HYROX lower needs calf isometrics`);
    }

    const bikeSessions = schedule.filter(
      (d) =>
        d.title === "Aerobic Support" ||
        d.tags?.includes("aerobic_support") ||
        d.tags?.includes("bike_z2_support") ||
        /easy z2 bike|bike flush|bike z2/i.test(d.title)
    );
    for (const bikeSupport of bikeSessions) {
      const bikeBlob = `${bikeSupport.title} ${(bikeSupport.session?.main ?? []).join(" ")} ${(bikeSupport.session?.notes ?? []).join(" ")}`;
      assert(
        /(\d{2}–\d{2}|\d{2}-\d{2})\s*min/i.test(bikeBlob),
        `Week ${wn}: bike/aerobic "${bikeSupport.title}" needs duration window`
      );
    }
    const bikeDoubles = schedule.filter(
      (d) =>
        d.double_session?.enabled &&
        /bike|z2 flush|row.*z2/i.test(d.double_session?.secondary.title ?? "")
    );
    for (const d of bikeDoubles) {
      const blob = `${d.double_session!.secondary.title} ${(d.double_session!.secondary.session?.main ?? []).join(" ")}`;
      assert(
        /\d+\s*min|\d{2}–\d{2}/i.test(blob),
        `Week ${wn}: double bike/aerobic "${d.double_session!.secondary.title}" needs duration`
      );
    }
  }

  const preferredUsed = weeks.some((w) =>
    (w.plan_json.double_session_summary?.selected_double_days ?? []).some((d) =>
      /tue|thu|sat/i.test(d)
    )
  );
  assert(preferredUsed, "7d Pro: athlete-selected double days (Tue/Thu/Sat) should be used");

  const w1Thr = summariseThresholdVolume(weeks[0]!.plan_json.schedule as DayPlan[]);
  const w3Thr = summariseThresholdVolume(weeks[2]!.plan_json.schedule as DayPlan[]);
  assert(
    w3Thr.total_threshold_minutes >= w1Thr.total_threshold_minutes - 2,
    "7d Pro: threshold minutes should progress week 1 → 3"
  );

  const analysis = analyseProgrammePreview(weeks, input);
  const rhythmWarnings = analysis.warnings.filter((w) =>
    /Monday is hard after Sunday|Monday moderate\/hard after Sunday|hard run exposures|interval\/float run with threshold|run volume .* below band with .* hard runs|only 3 run exposure|no erg threshold minutes detected|3 consecutive hard days|non-run session.*run prescription|below target.*km|missing calf|missing explicit duration/i.test(
      w
    )
  );
  assert(
    rhythmWarnings.length === 0,
    `7d Pro: preview should not report fixable rhythm issues (got: ${rhythmWarnings.join("; ")})`
  );

  console.log("✓ Advanced HYROX Pro 7-day — rhythm, runs, threshold, erg constraints");
}

function testCaseD() {
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
      current_run_volume_band: null,
    },
    benchmarkTests: [],
    email: "qa-general@hybrid365.local",
    profile: null,
  });

  assert(!input.hyrox_track?.active, "Case D: must not activate hyrox track");
  assert(
    !detectHyroxTrack({
      goal_focus_raw: "General Hybrid Fitness",
      event_type: "No event booked",
    }),
    "Case D: detectHyroxTrack false"
  );

  const weeks = generate12WeekProgramme(input);
  const coach = weeks[0]!.plan_json.week_rationale?.coach_note ?? "";
  assert(!/Hyrox Pro|Hyrox Open track/i.test(coach), "Case D: week coach note not HYROX-specific");

  console.log("✓ Case D: general hybrid — not HYROX-specific");
}

function main() {
  testCaseA();
  testAdvancedHyroxPro7Day();
  testCaseB();
  testCaseC();
  testCaseD();
  console.log("\nAll HYROX track programming QA checks passed.");
}

main();
