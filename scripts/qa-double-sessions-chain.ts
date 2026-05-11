/**
 * Local QA: double-session chain from PaidProgrammeInput → generate12WeekProgramme.
 * Run: npx tsx scripts/qa-double-sessions-chain.ts
 */
import { generate12WeekProgramme } from "../app/lib/generate12WeekProgramme";

function countDoubleSecondaries(schedule: unknown[]): number {
  let n = 0;
  for (const row of schedule) {
    const d = row as { double_session?: { secondary?: unknown } };
    if (d.double_session?.secondary) n += 1;
  }
  return n;
}

const input = {
  first_name: "QA",
  days_per_week: 6,
  weekly_hours_band: "10+" as const,
  goal_focus: "hybrid" as const,
  ability_level: "advanced" as const,
  double_sessions: true,
  double_session_days: ["Mon", "Wed", "Fri"],
  equipment: ["Full gym"],
  five_k_time: "20:00",
  notes: "",
};

const weeks = generate12WeekProgramme(input);

let totalWeeks1to4 = 0;
const perWeek: number[] = [];
for (let i = 0; i < 4; i++) {
  const sch = weeks[i]?.plan_json.schedule ?? [];
  const c = countDoubleSecondaries(sch);
  perWeek.push(c);
  totalWeeks1to4 += c;
}

console.log("Weeks 1–4 doubles per week:", perWeek.join(", "));
console.log("Total doubles (weeks 1–4):", totalWeeks1to4);

if (perWeek[0] === 0) {
  console.error("FAIL: Week 1 has zero double_session.secondaries — check doubleSessionPlanner / weekly_hours_band.");
  process.exit(1);
}

if (totalWeeks1to4 === 0) {
  console.error("FAIL: No doubles in first 4 weeks.");
  process.exit(1);
}

console.log("qa-double-sessions-chain: OK");
