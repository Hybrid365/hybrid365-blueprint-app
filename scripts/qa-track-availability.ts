import { resolveRemainingWeek } from "../app/lib/daily-readiness/reflow";
import type { DailyReadinessState, WeekSession } from "../app/lib/daily-readiness/types";
import { generate12WeekProgramme } from "../app/lib/generate12WeekProgramme";
import { placeHyroxWeek, PROGRAMME_CONFIGURATION_REQUIRED } from "../app/lib/hyroxAvailabilityPlacement";
import { mapAssessmentToProgrammeInput } from "../app/lib/mapAssessmentToProgrammeInput";
import { composeNextWeek, type WeekRow } from "../app/lib/track-loop/nextWeekPlan";
import { formatPacePer500 } from "../app/lib/track-foundation/dates";
import { ERG_THRESHOLD_OFFSET_SEC } from "../app/lib/track-foundation/policies";
import type { DayKey } from "../app/lib/sessionLibrary";

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function available(except: DayKey[]): DayKey[] {
  return DAYS.filter((day) => !except.includes(day));
}

function byStimulus(days: Array<{ day: string; stimulus: string }>, stimulus: string) {
  return days.find((day) => day.stimulus === stimulus)?.day ?? null;
}

const failures: string[] = [];
function expect(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

const six = placeHyroxWeek({ availableDays: available(["Sun"]) });
expect(six.ok, "A: six days with Sunday unavailable should place");
if (six.ok) {
  expect(!six.days.some((day) => day.day === "Sun"), "A: Sunday is empty");
  expect(byStimulus(six.days, "threshold") === "Tue", `A: threshold on Tue, got ${byStimulus(six.days, "threshold")}`);
  expect(byStimulus(six.days, "hyrox") === "Thu", `A: HYROX on Thu, got ${byStimulus(six.days, "hyrox")}`);
  expect(byStimulus(six.days, "long") === "Sat", `A: long run on Sat, got ${byStimulus(six.days, "long")}`);
  expect(six.dropped.includes("lower"), "A: lower strength waits because every other day touches a hard stimulus");
}

const weekend = placeHyroxWeek({ availableDays: ["Mon", "Tue", "Thu", "Sat", "Sun"] });
expect(weekend.ok, "B: five days with the weekend available should place");
if (weekend.ok) {
  expect(!weekend.days.some((day) => day.day === "Wed" || day.day === "Fri"), "B: unavailable midweek days stay empty");
  expect(Boolean(byStimulus(weekend.days, "threshold") && byStimulus(weekend.days, "hyrox") && byStimulus(weekend.days, "long")), "B: three stimuli placed");
}

const noSaturday = placeHyroxWeek({ availableDays: available(["Sat"]) });
expect(noSaturday.ok, "C: Saturday unavailable should place");
if (noSaturday.ok) {
  expect(!noSaturday.days.some((day) => day.day === "Sat"), "C: Saturday is empty");
  expect(byStimulus(noSaturday.days, "hyrox") !== "Sat", "C: HYROX is not left on Saturday");
  expect(byStimulus(noSaturday.days, "long") === "Sun", `C: long run stays Sunday, got ${byStimulus(noSaturday.days, "long")}`);
}

const four = placeHyroxWeek({ availableDays: ["Mon", "Tue", "Thu", "Fri"] });
expect(four.ok, "D: four limited days should still place the three stimuli");
if (four.ok) {
  const used = new Set(four.days.map((day) => day.day));
  expect([...used].every((day) => ["Mon", "Tue", "Thu", "Fri"].includes(day)), "D: only the four available days are used");
}

const tooTight = placeHyroxWeek({ availableDays: ["Mon", "Tue", "Wed"] });
expect(!tooTight.ok && tooTight.ok === false && tooTight.code === PROGRAMME_CONFIGURATION_REQUIRED, "E: three consecutive days fail closed");

const locked = placeHyroxWeek({ availableDays: available(["Sun"]), locked: { Thu: "lower" } });
expect(locked.ok, "Week 1 lock: Thursday lower stays and the week still places");
if (locked.ok) {
  expect(byStimulus(locked.days, "lower") === "Thu", "Week 1 lock: Thursday remains lower");
  expect(!locked.days.some((day) => day.day === "Sun"), "Week 1 lock: Sunday stays empty");
  expect(byStimulus(locked.days, "threshold") === "Tue", "Week 1 lock: threshold stays Tuesday");
  expect(byStimulus(locked.days, "hyrox") === "Sat", "Week 1 lock: HYROX stays Saturday");
  expect(byStimulus(locked.days, "long") === "Mon", `Week 1 lock: long run moves to the only unstacked day, got ${byStimulus(locked.days, "long")}`);
}

const generated = generate12WeekProgramme({
  ...mapAssessmentToProgrammeInput({
    assessment: {
      first_name: "Track",
      goal_focus: "Improve Hybrid / Hyrox Performance",
      event_type: "Hyrox Pro",
      event_date: "2027-05-15",
      target_time: null,
      training_days_per_week: 6,
      weekly_hours_band: "7-10",
      preferred_training_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      double_session_days: null,
      recent_5k_time: "20:48",
      max_heart_rate: null,
      strength_experience: "advanced",
      hyrox_experience: "competitive",
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: "Running under fatigue after stations",
      notes: "Availability QA",
      hyrox_pb: "1:18:30",
      current_run_volume_band: "30-40km/week",
    },
    benchmarkTests: [],
    email: null,
    profile: { full_name: "Availability QA" },
  }),
  unavailable_days: ["Sun"],
});
expect(generated.length === 12, "Engine returns 12 weeks");
for (const week of generated) {
  const schedule = week.plan_json.schedule;
  const days = schedule.map((day) => day.day);
  expect(!days.includes("Sun"), `Week ${week.week_number} scheduled Sunday`);
  expect(new Set(days).size === days.length, `Week ${week.week_number} has a duplicate day`);
  const titles = schedule.map((day) => `${day.tags?.[0] ?? ""} ${day.title}`);
  expect(titles.some((title) => /threshold/i.test(title)), `Week ${week.week_number} is missing threshold`);
  expect(titles.some((title) => /compromised|race-style|hyrox/i.test(title)), `Week ${week.week_number} is missing the HYROX stimulus`);
  expect(titles.some((title) => /long/i.test(title)), `Week ${week.week_number} is missing the long run`);
}

function session(day: WeekSession["day"], title: string, hard: boolean, anchor = false): WeekSession {
  return {
    id: day,
    day,
    title,
    priority: hard ? "key" : "supporting",
    stimulus: hard ? "quality" : "easy",
    hard,
    lowerBody: hard,
    modality: "run",
    status: "planned",
    anchor,
    load: [],
  };
}

const reflow = resolveRemainingWeek({
  state: {
    interpretation: "FATIGUED",
    freshness: "KNOWN",
    athleteSentence: "Recovery is low.",
    answers: { painProvokes: "" },
  } as DailyReadinessState,
  sessions: [session("Mon", "5 x 5 min Threshold", true), session("Sun", "Easy", false)],
  today: "Mon",
  unavailableDays: ["Sun"],
  product: "track",
});
expect(!reflow.after.some((item) => item.day === "Sun" && item.title.includes("Threshold")), "Reflow does not move threshold onto Sunday");
expect(reflow.after.every((item) => item.day !== "Sun" || item.title === "Easy"), "Reflow leaves Sunday untouched");

const source: WeekRow[] = [
  { day_key: "Tue", session_date: "2026-11-24", title: "5 x 5 min Threshold", kind: "training", instructions: [], payload: { family: "threshold_volume_a" } },
  { day_key: "Sat", session_date: "2026-11-28", title: "65 min Aerobic Long Run", kind: "training", instructions: [], payload: {} },
];
const progressed = composeNextWeek({
  decision: "PROGRESS",
  source,
  current: source,
  edges: [],
  unavailableDays: ["Sun"],
});
expect(progressed.map((row) => row.day_key).join() === "Tue,Sat", "Next-week progression keeps the written days");
let rejected = false;
try {
  composeNextWeek({
    decision: "KEEP",
    source: [{ ...source[0], day_key: "Sun" }],
    current: source,
    edges: [],
    unavailableDays: ["Sun"],
  });
} catch (error) {
  rejected = error instanceof Error && error.message.includes(PROGRAMME_CONFIGURATION_REQUIRED);
}
expect(rejected, "Next week rejects a session on an unavailable day");

const skiSplit = formatPacePer500((8 * 60 + 12) / 4, 500);
const rowSplit = formatPacePer500((7 * 60 + 58) / 4, 500);
const skiGuide = formatPacePer500((8 * 60 + 12) / 4 + ERG_THRESHOLD_OFFSET_SEC, 500);
const rowGuide = formatPacePer500((7 * 60 + 58) / 4 + ERG_THRESHOLD_OFFSET_SEC, 500);
expect(ERG_THRESHOLD_OFFSET_SEC === 5, "Erg guide offset stays 5 seconds");
expect(skiSplit === "2:03/500m" && skiGuide === "2:08/500m", `Ski guide is 2:03 plus 5s, got ${skiSplit} / ${skiGuide}`);
expect(rowSplit === "2:00/500m" && rowGuide === "2:05/500m", `Row guide is 2:00 plus 5s, got ${rowSplit} / ${rowGuide}`);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(JSON.stringify({
  fixtures: "A-E passed",
  week1Lock: locked.ok ? locked.days.map((day) => `${day.day}:${day.stimulus}`) : null,
  futurePattern: six.ok ? six.days.map((day) => `${day.day}:${day.stimulus}`) : null,
  reflow: reflow.status,
  ski: `${skiSplit} guide ${skiGuide}`,
  row: `${rowSplit} guide ${rowGuide}`,
}, null, 2));
