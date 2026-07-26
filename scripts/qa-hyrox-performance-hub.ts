/**
 * QA: HYROX Team Performance Hub analytics helpers.
 * Run: npm run qa:hyrox-performance-hub
 */

import { classifySessionForHub } from "../app/lib/hyrox-team/modules/performanceHub/classification";
import { resolveHubDateRange, ymdInRange, eachWeekStarts } from "../app/lib/hyrox-team/modules/performanceHub/dateRange";
import { buildHyroxExposureRows } from "../app/lib/hyrox-team/modules/performanceHub/hyroxExposure";
import { buildHubInsights } from "../app/lib/hyrox-team/modules/performanceHub/insights";
import {
  executionState,
  pctOf,
} from "../app/lib/hyrox-team/modules/performanceHub/types";
import { isHyroxPerformanceHubEnabled } from "../app/lib/hyrox-team/modules/performanceHub/featureFlag";
import { toSessionLogAnalyticsRow } from "../app/lib/hyrox-team/modules/sessionLogging/aggregates";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

{
  const r = resolveHubDateRange("this_week", new Date("2026-07-22T12:00:00"));
  assert(r.startYmd === "2026-07-20" && r.endYmd === "2026-07-26", `week ${r.startYmd}-${r.endYmd}`);
  ok("This week date window");
}

{
  const r = resolveHubDateRange("last_4", new Date("2026-07-22T12:00:00"));
  assert(ymdInRange("2026-07-22", r.startYmd, r.endYmd), "end inclusive");
  assert(!ymdInRange("2026-06-20", r.startYmd, r.endYmd), "before start excluded");
  ok("Last 4 weeks window");
}

{
  const weeks = eachWeekStarts("2026-07-01", "2026-07-22");
  assert(weeks.length >= 3, "week starts");
  ok("12-week / multi-week series scaffolding");
}

{
  assert(executionState(10, 10) === "on_plan", "on plan");
  assert(executionState(10, 7) === "below_plan", "below");
  assert(executionState(10, 13) === "above_plan", "above");
  assert(executionState(null, 5) === "partial_data", "partial");
  assert(pctOf(50, 45) === 90, "pct");
  ok("Planned vs completed states");
}

{
  const c = classifySessionForHub({
    sessionName: "Threshold tempo",
    category: "Run",
    loggedActivityType: "run",
  });
  assert(c.bucket === "threshold_quality" || c.isThresholdQuality, "threshold");
  ok("Threshold classification");
}

{
  const c = classifySessionForHub({
    sessionName: "Easy aerobic",
    category: "Run",
  });
  assert(c.bucket === "easy_aerobic", `easy got ${c.bucket}`);
  ok("Easy aerobic classification");
}

{
  const c = classifySessionForHub({
    sessionName: "Mystery session",
    category: "Training",
  });
  assert(
    c.bucket === "unclassified" || c.bucket === "other" || c.confidence === "low",
    "legacy unclassified path"
  );
  ok("Legacy / low-confidence classification");
}

{
  const legacy = toSessionLogAnalyticsRow({ rpe: "7", notes: "felt ok" });
  assert(legacy.hasLog && legacy.distanceKm == null, "legacy log no false distance");
  ok("Legacy log handling (no invented distance)");
}

{
  const v2 = toSessionLogAnalyticsRow({
    activityType: "run",
    metrics: { distanceKm: "10", duration: "50", rpe: "6" },
    rpe: "6",
  });
  assert(v2.isRunExposure && v2.distanceKm === 10, "v2 run");
  ok("Rich V2 log metrics");
}

{
  const exposures = buildHyroxExposureRows([
    {
      ymd: "2026-07-20",
      name: "Compromised sled push focus",
      prescriptionText: "Sled push 4x20m",
    },
  ]);
  const sled = exposures.find((e) => e.movement === "Sled push");
  assert(sled && sled.sessionsContaining === 1, "sled exposure");
  const wall = exposures.find((e) => e.movement === "Wall balls");
  assert(wall?.emptyReason, "missing structured exposure message");
  ok("HYROX exposure structured vs empty");
}

{
  const insights = buildHubInsights({
    rangeLabel: "Last 4 weeks",
    weeklySeries: [],
    pvc: [],
    readiness: {
      currentScore: null,
      currentCategory: null,
      avg7d: null,
      trend: "unknown",
      missingDays: 7,
      illnessDays: 0,
      highSorenessDays: 0,
      emptyReason: "Not enough structured data yet",
    },
    completionPct: null,
    priorCompletionPct: null,
  });
  assert(insights.some((i) => i.id === "sparse"), "sparse insight");
  ok("Sparse-data insight safety");
}

{
  const prev = process.env.HYROX_PERFORMANCE_HUB_ENABLED;
  const prevIds = process.env.HYROX_PERFORMANCE_HUB_ATHLETE_IDS;
  delete process.env.HYROX_PERFORMANCE_HUB_ENABLED;
  process.env.HYROX_PERFORMANCE_HUB_ATHLETE_IDS = "hub-1";
  assert(isHyroxPerformanceHubEnabled({ id: "hub-1" }), "allow-list");
  assert(!isHyroxPerformanceHubEnabled({ id: "other" }), "blocked");
  if (prev === undefined) delete process.env.HYROX_PERFORMANCE_HUB_ENABLED;
  else process.env.HYROX_PERFORMANCE_HUB_ENABLED = prev;
  if (prevIds === undefined) delete process.env.HYROX_PERFORMANCE_HUB_ATHLETE_IDS;
  else process.env.HYROX_PERFORMANCE_HUB_ATHLETE_IDS = prevIds;
  ok("Feature flag allow-list (independent of Today V2)");
}

console.log(`\nAll ${passed} Performance Hub QA checks passed.`);
