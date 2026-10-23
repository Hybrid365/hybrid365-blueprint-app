/**
 * Batch 1 cross-workstream integration checks.
 * Run: npx --yes tsx scripts/qa-hyrox-batch-1-integration.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { computeHyroxAthleteAnalytics } from "../app/lib/hyroxAthleteAnalytics";
import { adaptHyroxAthleteAnalytics } from "../app/lib/hyroxCommandCentreAnalyticsAdapter";

const root = process.cwd();
let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}
function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

{
  const payload = computeHyroxAthleteAnalytics({
    athleteId: "athlete-1",
    asOf: new Date("2026-07-22T12:00:00Z"),
    timeZone: "UTC",
    sessions: [
      {
        calendarYmd: "2026-07-20",
        status: "completed",
        category: "Run",
        sessionName: "Easy run",
        activityType: "run",
        durationMinutes: 40,
        runDistanceKm: 8,
        rpe: 6,
      },
    ],
    benchmarks: [
      {
        type: "run_5k",
        label: "5K",
        date: "2026-07-01",
        display: "21:00",
        normalizedValue: 1260,
        source: "coach_entered",
        status: "approved",
      },
    ],
  });
  const adapted = adaptHyroxAthleteAnalytics(payload);
  assert(adapted, "adapts");
  assert(adapted.asOf === payload.asOf, "asOf");
  assert(adapted.currentWeek.complete === payload.currentWeek.complete, "complete");
  assert(adapted.currentWeek.runDistanceKm === 8, "distance from B");
  assert(adapted.currentWeek.trainingDurationMinutes === 40, "duration from B");
  assert(adapted.currentWeek.sessionRpeLoad === 240, "rpe load from B");
  assert(adapted.benchmarks[0]?.points[0]?.display === "21:00", "benchmark without normalizedUnit");
  ok("B payload adapts into C");
}

{
  const progress = read("app/athlete/progress/AthleteAnalyticsSection.tsx");
  assert(progress.includes("TrainingSummary"), "TrainingSummary");
  assert(progress.includes("ProgressChartCard"), "ProgressChartCard");
  assert(progress.includes("BenchmarkCard"), "BenchmarkCard");
  assert(progress.includes("MetricDelta"), "MetricDelta");
  assert(progress.includes("SectionHeader"), "SectionHeader");
  assert(progress.includes("StatusPill"), "StatusPill");
  assert(!progress.includes("function MetricTile"), "no duplicate tiles");
  ok("B Progress uses D primitives");
}

{
  const dashboard = read("components/admin-hyrox-athletes/CoachAthleteDashboard.tsx");
  assert(dashboard.includes("CommandCentreOverview"), "C overview");
  assert(dashboard.includes("RaceIntelligenceCoachPanel"), "E races");
  assert(dashboard.includes("commandCentreEnabled"), "C flag");
  assert(dashboard.includes("raceIntelligenceEnabled"), "E flag");
  assert(dashboard.includes("ProgrammeBuilder"), "builder remains");
  ok("C Overview and E Races coexist on coach athlete UI");
}

{
  const nav = read("components/athlete-command-centre/athleteNav.ts");
  assert(nav.includes('label: "Performance"'), "Performance");
  assert(nav.includes('label: "Progress"'), "Progress");
  assert(nav.includes('label: "Races"'), "Races");
  assert(nav.includes("visibleAthleteNavItems"), "flagged Races filter");
  assert(!nav.includes('label: "Benchmarks"'), "old Benchmarks label gone");
  ok("Athlete nav has Performance + Progress + Races");
}

{
  const server = read("app/lib/hyroxRaceIntelligenceServer.ts");
  assert(server.includes('from("hyrox_race_results")'), "canonical race table");
  assert(!server.includes("hyrox_athlete_benchmarks"), "no benchmark dual-write");
  const insert = read("app/lib/hyroxRaceIntelligence.ts");
  assert(!insert.includes("ingestHyroxBenchmark"), "no benchmark ingest");
  ok("E race records stay in hyrox_race_results");
}

{
  const suite = read("scripts/qa-hyrox-suite.mjs");
  const core = suite.slice(suite.indexOf("core:"), suite.indexOf("programme:"));
  const auth = suite.slice(suite.indexOf("auth:"), suite.indexOf("data:"));
  assert(!core.includes("qa-hyrox-coach-command-centre.ts"), "C not in core");
  assert(auth.includes("qa-hyrox-coach-command-centre.ts"), "C in auth");
  assert(suite.includes("qa-hyrox-visual-system.ts"), "D in suite");
  assert(suite.includes("qa-hyrox-prescription-engine.ts"), "A in suite");
  assert(suite.includes("qa-hyrox-athlete-analytics.ts"), "B in suite");
  assert(suite.includes("qa-hyrox-race-intelligence.ts"), "E in suite");
  ok("QA suite groups do not double-run C");
}

console.log(`\n${passed} integration checks passed.`);
