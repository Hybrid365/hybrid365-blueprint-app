import { generate12WeekProgramme } from "../app/lib/generate12WeekProgramme";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const weeks = generate12WeekProgramme({
  first_name: "Kieran",
  email: "test@hybrid365.local",
  days_per_week: 6,
  weekly_hours_band: "7-10",
  goal_focus: "hybrid",
  ability_level: "advanced",
  double_sessions: true,
  equipment: ["Full gym"],
  five_k_time: "17:00",
  preferred_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  notes: "competitive hyrox",
});

assert(weeks.length === 12, "Expected 12 generated weeks");

for (let i = 0; i < weeks.length; i += 1) {
  const week = weeks[i];
  assert(week.week_number === i + 1, `Week number mismatch at index ${i}`);
  assert(week.block_number >= 1 && week.block_number <= 3, `Invalid block number for week ${week.week_number}`);
  assert(Array.isArray(week.plan_json.schedule), `Missing schedule for week ${week.week_number}`);
  assert(
    week.plan_json.week_context?.program_type === "community_12_week",
    `Week context program_type mismatch for week ${week.week_number}`
  );
}

const week4 = weeks[3].plan_json.week_context;
const week8 = weeks[7].plan_json.week_context;
const week12 = weeks[11].plan_json.week_context;
assert(week4?.week_focus === "base_deload", "Week 4 should be base_deload");
assert(week8?.week_focus === "engine_deload", "Week 8 should be engine_deload");
assert(week12?.week_focus === "test_or_taper", "Week 12 should be test_or_taper");

console.log("generate12WeekProgramme: OK");
