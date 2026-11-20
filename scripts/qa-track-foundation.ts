/**
 * QA: Track assessment + athlete profile foundation.
 * Run: npm run qa:track-foundation
 *
 * Production Track mutation stays off. The existing 12-week generator is called
 * in memory only.
 */

import { parseTimeToSeconds } from "../app/lib/mapAssessmentToProgrammeInput";
import { repairWeekSchedule } from "../app/lib/weekScheduleRepair";
import { computeDailyReadinessScore } from "../app/lib/hyrox-team/modules/today/readinessScore";
import { parseClockToSeconds } from "../app/lib/track-foundation/dates";
import { evaluateTrackFoundation } from "../app/lib/track-foundation/pipeline";
import { TRACK_FIXTURES } from "../app/lib/track-foundation/fixtures";
import { buildReadOnlyProgrammeProposal } from "../app/lib/track-foundation/proposeProgramme";
import { protocolForAthlete } from "../app/lib/track-foundation/testLibrary";
import { resolveStationDomains } from "../app/lib/track-foundation/stationEvidence";
import { trainingDays } from "../app/lib/track-foundation/assessmentWeek";
import { classifyEvidence } from "../app/lib/track-foundation/evidence";
import { buildAutomationContext } from "../app/lib/track-foundation/automationContext";
import {
  TRACK_PROGRAMME_MUTATION_ENABLED,
  TRACK_REFLOW_APPLIED_IN_THIS_BUILD,
} from "../app/lib/track-foundation/productionBoundary";
import type { BenchmarkResultInput, DayKey } from "../app/lib/track-foundation/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function fixture(id: string) {
  const found = TRACK_FIXTURES.find((item) => item.id === id);
  if (!found) throw new Error(`Missing fixture ${id}`);
  return found;
}

function evaluate(id: string) {
  const item = fixture(id);
  return evaluateTrackFoundation({
    intake: item.intake,
    results: item.results,
    workload: item.workload,
  });
}

function testIds(state: ReturnType<typeof evaluate>): string[] {
  return state.week.sessions
    .filter((session) => session.kind === "test")
    .map((session) => session.testId)
    .filter((id): id is string => Boolean(id));
}

function consecutiveHighs(state: ReturnType<typeof evaluate>): boolean {
  const order: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const highs = state.week.sessions.filter((session) => session.stress === "high");
  for (let i = 1; i < highs.length; i += 1) {
    const gap = order.indexOf(highs[i]!.day) - order.indexOf(highs[i - 1]!.day);
    if (gap <= 1) return true;
  }
  return false;
}

const counts = {
  fixtures: 0,
  proposals: 0,
  blocked: 0,
};

assert(TRACK_PROGRAMME_MUTATION_ENABLED === false, "Track mutation must stay off");
assert(TRACK_REFLOW_APPLIED_IN_THIS_BUILD === false, "Reflow must not be applied");
assert(typeof repairWeekSchedule === "function", "Existing week reflow is missing");

const readiness = computeDailyReadinessScore({
  sleepQuality: 8,
  energy: 8,
  motivation: 8,
  stress: 2,
  muscleSoreness: 2,
});
assert(readiness.category === "green", `Readiness regression: ${readiness.category}`);
assert(parseClockToSeconds("18:12") === parseTimeToSeconds("18:12"), "Clock parser drifted from the programme parser");

const recent = evaluate("hyrox_recent");
counts.fixtures += 1;
assert(recent.profile.programmingReadiness === "PARTIALLY_READY", `A readiness ${recent.profile.programmingReadiness}`);
assert(!testIds(recent).includes("run_5k"), "A repeated a valid 5K");
assert(recent.week.sessions.some((session) => session.kind === "covered" && session.testId === "run_5k"), "A did not show the 5K as already covered");
assert(testIds(recent).includes("ski_2k"), "A skipped SkiErg");
assert(!testIds(recent).includes("bike_20min"), "A prescribed a bike test for HYROX");
assert(testIds(recent).includes("hyrox_station_battery"), "A skipped stations when the race had no splits");
assert(
  recent.requirements.some((req) => req.id === "stations" && req.status === "test_required"),
  "A treated an overall race time as station evidence"
);
const recentDomains = resolveStationDomains(recent.evidence, recent.intake.equipment);
assert(recentDomains.every((domain) => !domain.evidence), "A inferred station capacity from the race clock");
assert(recentDomains.some((domain) => domain.id === "wall_ball" && domain.graph === true), "Wall-ball graph was dropped");
assert(recentDomains.some((domain) => domain.id === "sled" && domain.graph === false), "A invented a sled progression graph");
assert(recent.handoff.fiveKTime === "18:12", "A did not pass the 5K to the handoff");
assert(recent.anchors.running.threshold?.provenance?.statement.includes("18:12"), "A threshold provenance missing");
assert(!consecutiveHighs(recent), "A stacked maximal tests");
assert(recent.week.sessions.every((session) => recent.intake.availability.availableDays.includes(session.day)), "A scheduled an unavailable day");
const proposalA = buildReadOnlyProgrammeProposal(recent);
assert(proposalA?.published === false && proposalA.persisted === false && proposalA.mutationEnabled === false, "A proposal was not read-only");
assert(proposalA?.weekCount === 12, `A generator weeks ${proposalA?.weekCount}`);
assert(proposalA?.hyroxTrackActive === true, "A did not reach the HYROX track");
assert(proposalA.fiveKTime === "18:12", "Generator did not receive the 5K");
counts.proposals += 1;

const blank = evaluate("new_athlete");
counts.fixtures += 1;
assert(blank.profile.programmingReadiness === "NOT_READY", `B readiness ${blank.profile.programmingReadiness}`);
assert(testIds(blank).includes("run_5k"), "B missing 5K");
assert(testIds(blank).includes("ski_2k"), "B missing ski");
assert(
  testIds(blank).includes("hyrox_station_battery") ||
    blank.week.overflow.some((title) => /station/i.test(title)),
  "B dropped station assessment"
);
assert(blank.requirements.some((req) => req.id === "stations" && req.status === "test_required"), "B station requirement missing");
assert(buildReadOnlyProgrammeProposal(blank) === null, "B generated a programme without a running anchor");
assert(blank.handoff.abilityLevel === "intermediate", "B used the self-label as ability");
assert(blank.handoff.abilityNote.includes("not taken from the self-reported"), "B ability note missing");
counts.blocked += 1;

const runner = evaluate("runner_no_stations");
counts.fixtures += 1;
assert(!testIds(runner).includes("run_5k"), "C repeated the 5K");
assert(testIds(runner).includes("hyrox_station_battery"), "C was not station-heavy");
assert(testIds(runner).includes("ski_2k"), "C skipped ski");
assert(runner.profile.programmingReadiness === "PARTIALLY_READY", `C readiness ${runner.profile.programmingReadiness}`);

const complete = evaluate("complete_recent");
counts.fixtures += 1;
const completeDomains = resolveStationDomains(complete.evidence, complete.intake.equipment);
assert(completeDomains.every((domain) => domain.evidence), "D ignored race splits that name the station");
assert(complete.profile.programmingReadiness === "READY", `D readiness ${complete.profile.programmingReadiness}`);
assert(complete.week.testCount === 0, `D still scheduled ${complete.week.testCount} tests`);
assert(complete.week.sessions.some((session) => session.kind === "test") === false, "D scheduled a test");
const fiveSeries = complete.dashboard.series.find((series) => series.id === "run_5k");
assert(fiveSeries && fiveSeries.points.length === 3, "D 5K history missing");
assert(fiveSeries.points.map((point) => point.value).join(" → ") === "18:12 → 17:45 → 17:21", "D history order");
assert(fiveSeries.points[2]?.isCurrentAnchor === true, "D current 5K not marked");
assert(fiveSeries.points[0]?.isCurrentAnchor === false, "D stale 5K marked current");
assert(complete.dashboard.workload.length >= 5, "D workload cards missing");
assert(complete.dashboard.targets.some((target) => target.label === "Threshold"), "D threshold target missing");
assert(complete.anchors.running.lt1 === null, "D invented LT1");
assert(complete.anchors.hyrox.splits.ski === "4:10", "D dropped HYROX splits");
const proposalD = buildReadOnlyProgrammeProposal(complete);
assert(proposalD?.weekCount === 12 && proposalD.published === false, "D proposal failed");
counts.proposals += 1;

const pain = evaluate("pain_review");
counts.fixtures += 1;
assert(pain.profile.programmingReadiness === "NOT_READY", `E readiness ${pain.profile.programmingReadiness}`);
assert(pain.week.manualReview === true, "E review flag missing");
assert(pain.week.sessions.every((session) => session.stress !== "high"), "E scheduled a maximal test");
assert(!testIds(pain).includes("run_5k"), "E scheduled a 5K");
assert(buildReadOnlyProgrammeProposal(pain) === null, "E generated a programme");
assert(pain.profile.sections.some((section) => section.knowledge === "MANUAL_REVIEW_REQUIRED"), "E profile missing review");
counts.blocked += 1;

const noSled = evaluate("no_sled");
counts.fixtures += 1;
assert(testIds(noSled).includes("hyrox_station_battery"), "F skipped stations");
const protocol = protocolForAthlete("hyrox_station_battery", noSled.intake.equipment);
assert(protocol.some((step) => /Wall balls/.test(step)), "F dropped wall balls");
assert(!protocol.some((step) => /Sled push/.test(step)), "F prescribed a sled test");
const proposalF = buildReadOnlyProgrammeProposal(noSled);
assert(proposalF?.equipmentNote?.toLowerCase().includes("sled"), `F generator note: ${proposalF?.equipmentNote}`);
assert(proposalF?.published === false, "F published");
counts.proposals += 1;

const stale = evaluate("stale_5k");
counts.fixtures += 1;
assert(stale.evidence.running.anchorStatus === "unavailable", "Stale 5K became an anchor");
assert(stale.evidence.running.historical.some((row) => row.resultValue === "16:40"), "Stale 5K was deleted");
assert(stale.handoff.fiveKTime == null, "Stale 5K was passed to the generator");
assert(testIds(stale).includes("run_5k"), "Stale 5K did not request reassessment");
assert(stale.profile.programmingReadiness === "NOT_READY", "Stale 5K was treated as ready");
assert(buildReadOnlyProgrammeProposal(stale) === null, "Stale 5K generated a programme");
counts.blocked += 1;

const quality = evaluate("source_quality");
counts.fixtures += 1;
assert(quality.evidence.running.current?.id === "race-5k", `Source winner ${quality.evidence.running.current?.id}`);
assert(quality.evidence.running.current?.resultValue === "18:12", "Watch estimate won");
assert(/source quality/i.test(quality.evidence.running.winnerReason), quality.evidence.running.winnerReason);
assert(quality.anchors.running.threshold?.provenance?.result === "18:12", "Threshold used the watch estimate");
assert(quality.anchors.running.threshold?.provenance?.source === "official_race", "Threshold source was not the race");
assert(!quality.anchors.running.threshold?.provenance?.statement.includes("17:50"), "Provenance cited the watch estimate");

const graceResults: BenchmarkResultInput[] = [
  {
    id: "grace-5k",
    testId: "run_5k",
    resultValue: "20:00",
    unit: "mm:ss",
    date: "2026-08-20",
    source: "official_race",
  },
];
const grace = evaluateTrackFoundation({
  intake: fixture("hyrox_recent").intake,
  results: graceResults,
});
assert(grace.evidence.running.anchorStatus === "reassessment_due", `Grace status ${grace.evidence.running.anchorStatus}`);
assert(grace.anchors.running.threshold?.reassessmentDue === true, "Grace anchor was not flagged");
assert(grace.anchors.running.threshold?.display.includes("/km"), "Grace anchor was cleared");
assert(testIds(grace).includes("run_5k"), "Grace did not schedule reassessment");

const corrected = classifyEvidence(
  [
    {
      id: "old",
      testId: "run_5k",
      resultValue: "19:00",
      unit: "mm:ss",
      date: "2026-11-01",
      source: "official_race",
    },
    {
      id: "fix",
      testId: "run_5k",
      resultValue: "19:10",
      unit: "mm:ss",
      date: "2026-11-01",
      source: "official_race",
      correctsResultId: "old",
    },
  ],
  "2026-11-17"
);
assert(corrected.find((row) => row.id === "old")?.excludedFromAnchor === true, "Correction deleted history instead of superseding");
assert(corrected.find((row) => row.id === "fix")?.canAnchor === true, "Correction did not become eligible");

const weakCorrection = classifyEvidence(
  [
    {
      id: "race",
      testId: "run_5k",
      resultValue: "18:12",
      unit: "mm:ss",
      date: "2026-11-01",
      source: "official_race",
    },
    {
      id: "watch-fix",
      testId: "run_5k",
      resultValue: "17:40",
      unit: "mm:ss",
      date: "2026-11-02",
      source: "watch_estimate",
      correctsResultId: "race",
    },
  ],
  "2026-11-17"
);
assert(weakCorrection.find((row) => row.id === "race")?.excludedFromAnchor === false, "Weaker correction erased the race");

const limitedDays = {
  ...fixture("new_athlete").intake,
  availability: {
    ...fixture("new_athlete").intake.availability,
    daysPerWeek: 3,
    availableDays: ["Mon", "Wed", "Sat"] as DayKey[],
    unavailableDays: ["Tue", "Thu", "Fri", "Sun"] as DayKey[],
  },
};
const limited = evaluateTrackFoundation({ intake: limitedDays, results: [] });
assert(trainingDays(limitedDays).join(",") === "Mon,Wed,Sat", trainingDays(limitedDays).join(","));
assert(
  limited.week.sessions.every((session) => ["Mon", "Wed", "Sat"].includes(session.day)),
  "Session landed on an unavailable day"
);
assert(!consecutiveHighs(limited), "Limited week stacked maximal days");

const auto = buildAutomationContext({
  intake: recent.intake,
  anchors: recent.anchors,
  readiness: { sleepQuality: 3, energy: 3, motivation: 3, stress: 9, muscleSoreness: 9, feelingUnwell: true },
});
assert(auto.decision.applied === false, "Automation applied a programme change");
assert(auto.decision.mutationEnabled === false, "Automation enabled mutation");
assert(auto.decision.choice === "pending", "Automation skipped the athlete choice");
assert(auto.readinessCategory === "red", `Readiness feed ${auto.readinessCategory}`);

const emptyDash = evaluate("new_athlete");
assert(emptyDash.dashboard.workload.length === 0, "Empty workload rendered cards");
assert(emptyDash.dashboard.targets.length === 0, "Empty athlete invented targets");

console.log(
  JSON.stringify(
    {
      fixtures: TRACK_FIXTURES.length,
      evaluated: counts.fixtures,
      readOnlyProposals: counts.proposals,
      proposalsBlocked: counts.blocked,
      mutationEnabled: TRACK_PROGRAMME_MUTATION_ENABLED,
      reflowApplied: TRACK_REFLOW_APPLIED_IN_THIS_BUILD,
      generatorWeeks: proposalA.weekCount,
      sourceWinner: quality.evidence.running.winnerReason,
    },
    null,
    2
  )
);
