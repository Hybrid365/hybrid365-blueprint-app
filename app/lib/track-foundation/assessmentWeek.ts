import { addDays, mondayOf } from "./dates";
import type { AssessmentRequirement, AssessmentSession, AssessmentWeek, DayKey, TrackIntake } from "./types";
import { getTest } from "./testLibrary";

const DAY_ORDER: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TEST_ORDER = [
  "run_5k",
  "ski_2k",
  "row_2k",
  "bike_20min",
  "strength_lower",
  "hyrox_station_battery",
];

function dayIndex(day: DayKey): number {
  return DAY_ORDER.indexOf(day);
}

function restBetween(a: DayKey, b: DayKey): boolean {
  return dayIndex(b) - dayIndex(a) > 1;
}

export function trainingDays(intake: TrackIntake): DayKey[] {
  let days =
    intake.availability.availableDays.length > 0
      ? DAY_ORDER.filter((day) => intake.availability.availableDays.includes(day))
      : DAY_ORDER.slice(0, Math.min(7, Math.max(0, intake.availability.daysPerWeek ?? 0)));

  if (intake.availability.availableDays.length === 0 && !intake.availability.weekendAvailable) {
    days = days.filter((day) => day !== "Sat" && day !== "Sun");
  }
  if (intake.availability.unavailableDays.length > 0) {
    const blocked = new Set(intake.availability.unavailableDays);
    days = days.filter((day) => !blocked.has(day));
  }
  return days;
}

type WorkItem = {
  kind: "aerobic" | "test";
  stress: "low" | "moderate" | "high";
  testId: string | null;
  title: string;
  summary: string;
};

function workItems(intake: TrackIntake, requirements: AssessmentRequirement[]): WorkItem[] {
  if (intake.pain.severity === "meaningful_unresolved") {
    return [
      {
        kind: "aerobic",
        stress: "low",
        testId: "easy_aerobic",
        title: "Easy aerobic",
        summary: "Keep this conversational. Maximal tests wait for review.",
      },
    ];
  }

  const tests = requirements
    .filter((req) => (req.status === "test_required" || req.status === "reassessment_due") && req.testId)
    .map((req) => req.testId!)
    .filter((testId, index, all) => all.indexOf(testId) === index)
    .sort((a, b) => TEST_ORDER.indexOf(a) - TEST_ORDER.indexOf(b));

  if (tests.length === 0) return [];

  const items: WorkItem[] = [
    {
      kind: "aerobic",
      stress: "low",
      testId: "easy_aerobic",
      title: "Easy aerobic",
      summary: "Familiarisation. No test result required.",
    },
  ];

  for (const testId of tests) {
    const test = getTest(testId);
    if (!test?.prescribable) continue;
    items.push({
      kind: "test",
      stress: test.stress,
      testId,
      title: test.name,
      summary: test.why,
    });
  }
  return items;
}

/**
 * Places hard tests with a rest day between them.
 * Covered results are listed, not turned into another test.
 * Sessions land only on days the athlete can train.
 */
export function buildAssessmentWeek(
  intake: TrackIntake,
  requirements: AssessmentRequirement[],
  asOf: string,
  resultLabels: Record<string, string> = {}
): AssessmentWeek {
  const manualReview = intake.pain.severity === "meaningful_unresolved";
  const alreadyHave = requirements
    .filter((req) => req.status === "satisfied" && req.id !== "equipment" && req.id !== "availability")
    .map((req) => req.label);
  const stillNeed = requirements
    .filter((req) => req.status === "test_required" || req.status === "reassessment_due" || req.status === "manual_review")
    .filter((req) => req.id !== "equipment" && req.id !== "availability")
    .map((req) => req.label);

  const days = trainingDays(intake);
  const monday = mondayOf(asOf);
  const queue = workItems(intake, requirements);
  const sessions: AssessmentSession[] = [];
  const overflow: string[] = [];
  let cursor = 0;

  for (const day of days) {
    if (cursor >= queue.length) break;
    const item = queue[cursor]!;
    const previousHigh = [...sessions].reverse().find((session) => session.stress === "high");
    if (item.stress === "high" && previousHigh && !restBetween(previousHigh.day, day)) {
      sessions.push({
        id: `recovery-${day}`,
        day,
        date: addDays(monday, dayIndex(day)),
        kind: "recovery",
        stress: "low",
        title: "Recovery",
        testId: null,
        summary: "Easy day so the next test is not stacked on a hard one.",
        resultLabel: null,
        loggingFields: ["rpe", "pain", "notes"],
      });
      continue;
    }
    sessions.push({
      id: `${item.testId ?? item.kind}-${day}`,
      day,
      date: addDays(monday, dayIndex(day)),
      kind: item.kind === "test" ? "test" : "aerobic",
      stress: item.stress,
      title: item.title,
      testId: item.testId,
      summary: item.summary,
      resultLabel: null,
      loggingFields: item.kind === "test" ? ["result", "rpe", "pain", "modified", "notes"] : ["rpe", "pain", "notes"],
    });
    cursor += 1;
  }

  for (const item of queue.slice(cursor)) {
    overflow.push(item.title);
  }

  const covered = requirements.filter((req) => req.status === "satisfied" && req.testId && req.satisfiedByResultId);
  for (const req of covered) {
    const free = days.find((day) => !sessions.some((session) => session.day === day));
    if (!free) break;
    sessions.push({
      id: `covered-${req.id}`,
      day: free,
      date: addDays(monday, dayIndex(free)),
      kind: "covered",
      stress: "none",
      title: req.label,
      testId: req.testId,
      summary: "Already covered. Not repeated.",
      resultLabel: resultLabels[req.id] ?? null,
      loggingFields: [],
    });
  }

  sessions.sort((a, b) => dayIndex(a.day) - dayIndex(b.day));

  const testCount = sessions.filter((session) => session.kind === "test").length;
  const trainingDayCount = sessions.filter((session) => session.kind !== "covered").length;
  const headline = manualReview
    ? "Assessment stays easy until pain has been reviewed."
    : alreadyHave.length === 0 && stillNeed.length === 0
      ? "Nothing extra to test. Recent results already cover this goal."
      : `We already have ${alreadyHave.length} recent result${alreadyHave.length === 1 ? "" : "s"}. We need ${stillNeed.length} more piece${stillNeed.length === 1 ? "" : "s"} of information to personalise your training.`;

  return {
    headline,
    alreadyHave,
    stillNeed,
    sessions,
    overflow,
    testCount,
    trainingDayCount,
    manualReview,
  };
}
