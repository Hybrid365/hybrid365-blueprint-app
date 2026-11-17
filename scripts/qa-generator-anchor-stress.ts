/**
 * Structural anchor stress for the HYROX Pro generator.
 * Randomness may vary supporting sessions. It must not drop a hard anchor.
 */
import { generate12WeekProgramme } from "../app/lib/generate12WeekProgramme";
import { mapAssessmentToProgrammeInput } from "../app/lib/mapAssessmentToProgrammeInput";
import { isRunThresholdAnchorDay } from "../app/lib/thresholdVolumeTracking";
import { isFloatOrIntervalQuality, isHardRunExposure } from "../app/lib/hyroxRunIntensityPolicy";
import { getSkeletonForDay, sessionViolatesSkeleton } from "../app/lib/hyroxProWeeklySkeleton";
import { buildRoleByDayFromSchedule } from "../app/lib/weekScheduleRepair";
import type { DayPlan } from "../app/lib/sessionLibrary";

const RUNS = Number(process.env.ANCHOR_STRESS_RUNS ?? 1000);

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
  email: "qa-anchor-stress@hybrid365.local",
  profile: null,
});

const failures: string[] = [];

function day(schedule: DayPlan[], key: string) {
  return schedule.find((item) => item.day === key);
}

for (let run = 0; run < RUNS; run += 1) {
  const weeks = generate12WeekProgramme(input);
  if (weeks.length !== 12) failures.push(`run ${run}: ${weeks.length} weeks`);
  for (const week of weeks) {
    const schedule = week.plan_json.schedule as DayPlan[];
    const ids = schedule.map((item) => `${item.day}:${item.template_id ?? item.title}`);
    if (new Set(schedule.map((item) => item.day)).size !== schedule.length) {
      failures.push(`run ${run} week ${week.week_number}: duplicate day`);
    }
    const titles = schedule.map((item) => item.title);
    if (new Set(titles).size !== titles.length && titles.filter((title, index) => titles.indexOf(title) !== index).some((title) => /threshold/i.test(title))) {
      failures.push(`run ${run} week ${week.week_number}: duplicate threshold title`);
    }
    if (week.week_number % 4 === 0) continue;
    const roleByDay = buildRoleByDayFromSchedule(schedule);
    const tue = day(schedule, "Tue");
    const sun = day(schedule, "Sun");
    const sat = day(schedule, "Sat");
    if (!tue || (!(isRunThresholdAnchorDay(tue) || tue.tags?.[0] === "threshold_run") || isFloatOrIntervalQuality(tue))) {
      failures.push(`run ${run} week ${week.week_number}: Tuesday ${tue?.title ?? "missing"}`);
    }
    if (!sun || !(sun.tags?.[0] === "long_run" || /long run|long zone|long aerobic|long endurance/i.test(sun.title))) {
      failures.push(`run ${run} week ${week.week_number}: Sunday ${sun?.title ?? "missing"}`);
    }
    if (
      !sat ||
      !(
        sat.tags?.[0] === "hybrid_compromised" ||
        /hyrox|compromised|station/i.test(sat.title) ||
        roleByDay.get("Sat") === "hybrid_primary"
      )
    ) {
      failures.push(`run ${run} week ${week.week_number}: Saturday ${sat?.title ?? "missing"}`);
    }
    if (week.week_number === 7) {
      const wed = day(schedule, "Wed");
      const fri = day(schedule, "Fri");
      const mon = day(schedule, "Mon");
      if (wed && (isHardRunExposure(wed, roleByDay.get("Wed")) || sessionViolatesSkeleton(wed, "easy", roleByDay.get("Wed")))) {
        failures.push(`run ${run}: Wednesday ${wed.title}`);
      }
      if (fri && sessionViolatesSkeleton(fri, "easy", roleByDay.get("Fri"))) failures.push(`run ${run}: Friday ${fri.title}`);
      if (mon && getSkeletonForDay("Mon", 7) !== "recovery") failures.push(`run ${run}: Monday skeleton`);
      void ids;
    }
  }
  if (failures.length > 12) break;
}

if (failures.length) {
  console.error(failures.slice(0, 20).join("\n"));
  console.error(`${failures.length} anchor failures in ${RUNS} runs`);
  process.exit(1);
}
console.log(`Anchor stress passed ${RUNS} full 12-week generations.`);
