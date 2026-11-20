/**
 * Pure checks for the 12-week completion rules.
 * Does not write to Production or staging.
 */
import { evaluateTrackFoundation } from "../app/lib/track-foundation/pipeline";
import { TRACK_FIXTURES } from "../app/lib/track-foundation/fixtures";
import { resolveStationDomains } from "../app/lib/track-foundation/stationEvidence";
import { mondayOf } from "../app/lib/track-foundation/dates";
import { TRACK_PROGRAMME_MUTATION_ENABLED } from "../app/lib/track-foundation/productionBoundary";
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
