/**
 * Pure checks for the 12-week completion rules.
 * Does not write to Production or staging.
 */
import { evaluateTrackFoundation } from "../app/lib/track-foundation/pipeline";
import { TRACK_FIXTURES } from "../app/lib/track-foundation/fixtures";
import { resolveStationDomains } from "../app/lib/track-foundation/stationEvidence";
import { mondayOf } from "../app/lib/track-foundation/dates";
import { TRACK_PROGRAMME_MUTATION_ENABLED } from "../app/lib/track-foundation/productionBoundary";
import { savedMorningForDate } from "../app/lib/track-canary/morningCard";
import { PRODUCTION_TRACK_CANARY_AUTH_USER_ID, PRODUCTION_TRACK_JOURNEY_AUTH_USER_ID, isTrackJourneyWhopException, productionTrackAllowsUser } from "../app/lib/track-production/access";
import { JOURNEY_STEP_ORDER, journeyContinueTarget, journeyResumeStep } from "../app/lib/track-production/journeyContinue";
import { productionClockLeakedFixture, resolveTrackClock } from "../app/lib/track-production/clock";
import { recommendNextWeek } from "../app/lib/track-loop/progression";
import type { TrackAthleteRecord } from "../app/lib/track-loop/store";
import {
  GENERAL_HYBRID_THRESHOLD_FLAKE,
  applyEdges,
  composeNextWeek,
  nextBlockContract,
  publishedEdge,
  workloadDelta,
  type WeekRow,
} from "../app/lib/track-loop/nextWeekPlan";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(TRACK_PROGRAMME_MUTATION_ENABLED === false, "mutation flag moved");

const friday = new Date("2026-11-20T12:00:00Z");
const productionToday = resolveTrackClock({ production: true, intakeClock: "2026-11-19", fixtureClock: "2026-11-17", now: friday });
assert(productionToday === "2026-11-20", "production Track used the stored fixture clock");
assert(mondayOf(productionToday) === "2026-11-16", "Friday is outside the Monday 16 Nov week");
assert(!productionClockLeakedFixture(productionToday, friday), "production clock matched a fixture date");
assert(resolveTrackClock({ production: false, intakeClock: "2026-11-19", now: friday }) === "2026-11-19", "staging fixture clock was discarded");

const yesterday = { localDate: "2026-11-19", sleep: 7, energy: 7, recovery: 7, soreness: 3, readiness: 7, pain: false };
const todaySaved = { ...yesterday, localDate: "2026-11-20", sleep: 6 };
assert(savedMorningForDate([], "2026-11-20") === null, "A: empty today showed a readiness");
assert(savedMorningForDate([todaySaved], "2026-11-20")?.sleep === 6, "B: today's saved readiness was hidden");
assert(savedMorningForDate([yesterday], "2026-11-20") === null, "C: yesterday appeared as today");
const previousFlag = process.env.HYROX_TRACK_PRODUCTION_CANARY;
const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
process.env.HYROX_TRACK_PRODUCTION_CANARY = "0";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://uuqdgbsntdjhojjkjkgd.supabase.co";
assert(productionTrackAllowsUser({ id: "31115568-5181-479d-ad17-4d653c7f8fa8" }) === false, "D: logged-out production access stayed open");
process.env.HYROX_TRACK_PRODUCTION_CANARY = "1";
assert(productionTrackAllowsUser(null) === false, "D: a missing user could open Track");
assert(productionTrackAllowsUser({ id: "1c0e603e-71a0-4852-a582-def1ca9ec7e2" }) === false, "E: a non-canary athlete could open Track");
assert(productionTrackAllowsUser({ id: PRODUCTION_TRACK_JOURNEY_AUTH_USER_ID }) === true, "journey canary was locked out of Track");
assert(productionTrackAllowsUser({ id: PRODUCTION_TRACK_CANARY_AUTH_USER_ID }) === true, "mature canary lost Track access");
assert(isTrackJourneyWhopException(PRODUCTION_TRACK_JOURNEY_AUTH_USER_ID) === true, "journey Whop exception did not match the allowlisted user");
assert(isTrackJourneyWhopException(PRODUCTION_TRACK_CANARY_AUTH_USER_ID) === false, "mature canary received the journey Whop exception");
assert(isTrackJourneyWhopException("1c0e603e-71a0-4852-a582-def1ca9ec7e2") === false, "a non-canary received the journey Whop exception");
assert(isTrackJourneyWhopException(PRODUCTION_TRACK_JOURNEY_AUTH_USER_ID, { HYROX_TRACK_PRODUCTION_CANARY: "0", NEXT_PUBLIC_SUPABASE_URL: "https://uuqdgbsntdjhojjkjkgd.supabase.co" }) === false, "the journey exception survived the canary flag being off");
const journeySteps = JOURNEY_STEP_ORDER;
for (const step of journeySteps) {
  for (const needsAssessment of [true, false]) {
    const target = journeyContinueTarget({ step, steps: journeySteps, needsAssessment });
    assert(journeySteps.indexOf(target.step as (typeof journeySteps)[number]) >= journeySteps.indexOf(step), `${step} continued backward`);
  }
}
assert(journeyContinueTarget({ step: "summary", steps: journeySteps, needsAssessment: true }).step === "week", "summary skipped the assessment week");
assert(journeyContinueTarget({ step: "week", steps: journeySteps, needsAssessment: true }).reason === "assessment-open", "an open assessment week advanced");
assert(journeyContinueTarget({ step: "week", steps: journeySteps, needsAssessment: false }).step === "profile", "a finished assessment week stayed put");
assert(journeyContinueTarget({ step: "profile", steps: journeySteps, needsAssessment: true }).reason === "backward-blocked", "profile jumped back to the assessment week");
assert(journeyContinueTarget({ step: "home", steps: journeySteps, needsAssessment: false }).reason === "last-screen", "a finished setup left Home");
assert(journeyResumeStep({ step: "profile", steps: journeySteps, needsAssessment: true }).step === "week", "resume left an open assessment on the profile preview");
assert(journeyResumeStep({ step: "week", steps: journeySteps, needsAssessment: true }).step === "week", "resume left the assessment week");
assert(journeyResumeStep({ step: "summary", steps: journeySteps, needsAssessment: true }).step === "summary", "resume bounced a passed setup screen");
if (previousFlag === undefined) delete process.env.HYROX_TRACK_PRODUCTION_CANARY;
else process.env.HYROX_TRACK_PRODUCTION_CANARY = previousFlag;
if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;

const recent = TRACK_FIXTURES.find((item) => item.id === "hyrox_recent");
const complete = TRACK_FIXTURES.find((item) => item.id === "complete_recent");
if (!recent || !complete) throw new Error("fixtures missing");
const recentState = evaluateTrackFoundation({ intake: recent.intake, results: recent.results });
const recentDomains = resolveStationDomains(recentState.evidence, recent.intake.equipment);
assert(recentDomains.every((domain) => domain.state === "ASSESSMENT_REQUIRED"), "race clock satisfied a station");
assert(recentState.requirements.some((req) => req.id === "hyrox" && req.status === "satisfied"), "race evidence was dropped");
assert(recentState.week.sessions.filter((session) => session.testId === "hyrox_station_battery").length === 1, "station battery was not one session");

const completeState = evaluateTrackFoundation({ intake: complete.intake, results: complete.results });
const completeDomains = resolveStationDomains(completeState.evidence, complete.intake.equipment);
assert(completeDomains.every((domain) => domain.evidence), "named splits were ignored");
assert(completeDomains.find((domain) => domain.id === "sled")?.graph === false, "sled graph was invented");
assert(completeDomains.find((domain) => domain.id === "wall_ball")?.graph === true, "wall-ball graph missing");

const edge = publishedEdge("threshold_volume_a", "5 x 5 min Threshold", "progress");
assert(edge?.to_title === "6 x 5 min Threshold", edge?.to_title ?? "no edge");
assert(edge?.to_value === 30, `threshold minutes ${edge?.to_value}`);
assert(publishedEdge("sled_push", "Sled", "progress") == null, "sled edge was invented");
const back = publishedEdge("threshold_volume_a", "6 x 5 min Threshold", "reduce");
assert(back?.to_title === "5 x 5 min Threshold", back?.to_title ?? "no reduce");
const wall = publishedEdge("wall_ball_durability_a", "Wall Ball — 5 x 20 Controlled", "progress");
assert(wall?.to_title === "Wall Ball — 4 x 30", wall?.to_title ?? "no wall edge");
assert(wall?.to_value === 120, `wall reps ${wall?.to_value}`);

const source: WeekRow[] = [
  {
    day_key: "Tue",
    session_date: "2026-11-24",
    title: "5 x 5 min Threshold",
    kind: "training",
    instructions: ["5×5 min"],
    payload: { family: "threshold_volume_a", stage: 1, marker: { threshold_total_minutes: 25 } },
  },
  {
    day_key: "Wed",
    session_date: "2026-11-25",
    title: "Wall Ball — 5 x 20 Controlled",
    kind: "training",
    instructions: ["5×20"],
    payload: { family: "wall_ball_durability_a", marker: { hyrox_station_density: 100 } },
  },
];
const current: WeekRow[] = source.map((row) => ({ ...row, session_date: "2026-11-17", payload: { ...row.payload } }));
const progressed = applyEdges(source, [edge!, wall!]);
assert(progressed[0]?.title === "6 x 5 min Threshold", "threshold was not stepped");
assert(progressed[1]?.title === "Wall Ball — 4 x 30", "wall balls were not stepped");
assert(source[0]?.title === "5 x 5 min Threshold", "source week was mutated");
const kept = composeNextWeek({ decision: "KEEP", source, current, edges: [] });
assert(kept[0]?.title === source[0]?.title, "keep changed the plan");
const repeated = composeNextWeek({ decision: "REPEAT", source, current: current.map((row) => ({ ...row, title: "Easy" })), edges: [] });
assert(repeated[0]?.title === "Easy" && repeated[0]?.session_date === "2026-11-24", "repeat did not keep next week's date");

const impact = workloadDelta(source, progressed);
assert(impact.some((line) => line.label === "Threshold" && line.current === "25 min" && line.next === "30 min"), JSON.stringify(impact));
assert(impact.some((line) => line.label === "Wall balls" && line.current === "100 reps" && line.next === "120 reps"), JSON.stringify(impact));
assert(!impact.some((line) => line.label === "Run volume"), "run kilometres were invented");

const block = nextBlockContract(12, ["Sled"]);
assert(block.due && block.published === false && block.persisted === false && block.mutationEnabled === false, "block contract would publish");
assert(!nextBlockContract(11, []).due, "block contract fired early");

function record(completions: number, tone: "good" | "strained"): TrackAthleteRecord {
  return {
    athleteId: "fixture",
    product: "active",
    intake: {} as TrackAthleteRecord["intake"],
    results: [],
    sessions: [],
    versions: [],
    feedback: [],
    checkIns: [
      {
        id: "c",
        weekOf: "2026-11-16",
        recovery: tone === "good" ? 8 : 3,
        motivation: 8,
        lifeStress: 3,
        manageable: 8,
        persistentSoreness: false,
        availabilityChanged: false,
        travel: false,
        eventChange: false,
        note: null,
      },
    ],
    adaptations: [],
    escalations: [],
    priorFamilyCompletions: Array.from({ length: completions }, () => ({
      familyId: "threshold_volume_a",
      title: "5 x 5 min Threshold",
      rpe: 7,
      completion: "completed" as const,
    })),
  };
}
assert(recommendNextWeek(record(1, "good")).decision === "KEEP", "one session progressed");
assert(recommendNextWeek(record(2, "good")).decision === "PROGRESS", "two sessions did not progress");
assert(recommendNextWeek(record(2, "strained")).decision === "COACH_REQUIRED", "strained week progressed");
assert(GENERAL_HYBRID_THRESHOLD_FLAKE.cause.includes("flexible"), "hybrid flake cause missing");

console.log(JSON.stringify({ productRules: "passed", mutationEnabled: false, hybridFlake: "documented" }));
