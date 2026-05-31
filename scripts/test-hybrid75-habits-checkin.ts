/**
 * Hybrid 75 habit tracking + weekly check-in smoke tests.
 * Run: npx tsx scripts/test-hybrid75-habits-checkin.ts
 */

import { buildWeekBlueprint } from "../app/lib/buildWeekBlueprint";
import { applyHybrid75FreeWeek } from "../app/lib/applyHybrid75FreeWeek";
import { normalizeChallengeMode } from "../app/lib/freeWeekChallengeMode";
import {
  buildHabitSummary,
  buildHabitUpsertRow,
  formatLogDate,
  getWeekStartDate,
  type Hybrid75HabitLog,
} from "../app/lib/hybrid75HabitLogging";
import {
  buildCheckinUpsertRow,
  resolveCheckinWeekStart,
} from "../app/lib/hybrid75CheckinLogging";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function testStandardFreeWeekUnaffected() {
  const standard = buildWeekBlueprint({
    days_per_week: 5,
    weekly_hours_band: "3-5",
    goal_focus: "hybrid",
    ability_level: "beginner",
  });
  assert(normalizeChallengeMode(undefined) === "standard", "missing mode -> standard");
  assert(
    normalizeChallengeMode(standard.challenge_mode) === "standard",
    "blueprint should stay standard"
  );
  assert(!(standard as { hybrid75?: unknown }).hybrid75, "standard plan has no hybrid75 meta");
}

function testHabitUpsertRow() {
  const row = buildHabitUpsertRow(
    { plan_id: "h365_test", habit_key: "hydrate", completed: true },
    "2026-05-28"
  );
  assert(row.plan_id === "h365_test", "plan_id preserved");
  assert(row.habit_key === "hydrate", "habit_key preserved");
  assert(row.habit_label === "Hydrate 3–4L", "label from definition");
  assert(row.log_date === "2026-05-28", "log_date set");
  assert(row.completed === true, "completed flag");
}

function testDailyResetByDate() {
  const planId = "h365_test";
  const logs: Hybrid75HabitLog[] = [
    {
      id: "1",
      plan_id: planId,
      email: null,
      name: null,
      habit_key: "hydrate",
      habit_label: "Hydrate 3–4L",
      log_date: "2026-05-27",
      completed: true,
      created_at: "",
      updated_at: "",
    },
  ];

  const yesterday = buildHabitSummary(logs, planId, new Date("2026-05-27T12:00:00.000Z"));
  assert(yesterday.todayHabits.find((h) => h.key === "hydrate")?.completed === true, "yesterday complete");

  const today = buildHabitSummary(logs, planId, new Date("2026-05-28T12:00:00.000Z"));
  assert(today.todayHabits.find((h) => h.key === "hydrate")?.completed === false, "today fresh checklist");
}

function testWeeklyTrendCalculation() {
  const planId = "h365_test";
  const weekStart = getWeekStartDate(new Date("2026-05-28T12:00:00.000Z"));
  const logs: Hybrid75HabitLog[] = [
    "hydrate",
    "eat_clean",
    "proof",
    "mobility",
  ].flatMap((key, dayOffset) => {
    const d = new Date(`${weekStart}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + dayOffset);
    const logDate = formatLogDate(d);
    return [
      {
        id: `${key}-${dayOffset}`,
        plan_id: planId,
        email: null,
        name: null,
        habit_key: key,
        habit_label: key,
        log_date: logDate,
        completed: true,
        created_at: "",
        updated_at: "",
      },
    ];
  });

  const summary = buildHabitSummary(logs, planId, new Date("2026-05-28T12:00:00.000Z"));
  assert(summary.weeklyTrends.length === 4, "four core trend rows");
  assert(summary.weeklyTrends.every((row) => row.completedDays >= 1), "each habit has completions");
  assert(summary.overallCompletionPct > 0, "overall pct > 0");
  assert(summary.weekDays.length === 7, "seven day grid");
}

function testCheckinUpsertRow() {
  const row = buildCheckinUpsertRow({
    plan_id: "h365_test",
    energy_score: 8,
    recovery_score: 7,
    soreness_score: 4,
    biggest_win: "Hit all runs",
    interested_full_programme: true,
  });
  assert(row.plan_id === "h365_test", "plan_id");
  assert(row.week_start === resolveCheckinWeekStart({ plan_id: "h365_test" }), "week_start defaults to current week");
  assert(row.energy_score === 8, "energy score");
  assert(row.interested_full_programme === true, "programme interest");
}

function testHybrid75GenerationStillWorks() {
  const standard = buildWeekBlueprint({
    days_per_week: 6,
    weekly_hours_band: "5-7",
    goal_focus: "hybrid",
    ability_level: "intermediate",
  });
  const hybrid75 = applyHybrid75FreeWeek(standard, {
    days_per_week: 6,
    ability_level: "intermediate",
  });
  assert(hybrid75.challenge_mode === "hybrid75", "hybrid75 mode set");
  assert(Boolean(hybrid75.hybrid75), "hybrid75 metadata present");
}

console.log("Hybrid 75 habits + check-in tests\n");
testStandardFreeWeekUnaffected();
console.log("✓ standard free-week unaffected");
testHabitUpsertRow();
console.log("✓ habit upsert row");
testDailyResetByDate();
console.log("✓ daily reset by date");
testWeeklyTrendCalculation();
console.log("✓ weekly trend calculation");
testCheckinUpsertRow();
console.log("✓ check-in upsert row");
testHybrid75GenerationStillWorks();
console.log("✓ hybrid75 generation");
console.log("\nAll tests passed.");
