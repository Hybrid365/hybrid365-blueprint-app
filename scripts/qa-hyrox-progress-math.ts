/**
 * Progress presentation helpers — real deltas only, no invented trends.
 */
import assert from "node:assert/strict";
import {
  buildWeekCompareRows,
  computeBenchmarkDelta,
  deriveMilestones,
  filterSeriesByPeriod,
  isLowerBetter,
  pickBestImprovement,
  pickPrimarySeries,
} from "../components/athlete-command-centre/progress/progressMath";
import type { HyroxAnalyticsBenchmarkSeries } from "../app/lib/hyroxAthleteAnalytics";

function series(
  type: string,
  label: string,
  points: Array<{ date: string; display: string; value: number }>
): HyroxAnalyticsBenchmarkSeries {
  return {
    type,
    label,
    points: points.map((point) => ({
      date: point.date,
      display: point.display,
      normalizedValue: point.value,
      source: "coach_entered",
      status: "approved",
    })),
  };
}

assert.equal(isLowerBetter("run_5k"), true);
assert.equal(isLowerBetter("ftp"), false);

const fiveK = series("run_5k", "5K", [
  { date: "2026-01-01", display: "22:00", value: 1320 },
  { date: "2026-02-01", display: "21:18", value: 1278 },
]);
const delta = computeBenchmarkDelta(fiveK);
assert.ok(delta);
assert.equal(delta.improved, true);
assert.ok(delta.absoluteLabel?.includes("42") || delta.absoluteLabel?.includes("−42"));
assert.equal(delta.previous?.display, "22:00");

const single = series("ftp", "FTP", [{ date: "2026-03-01", display: "280 W", value: 280 }]);
assert.equal(computeBenchmarkDelta(single)?.previous, null);

const filtered = filterSeriesByPeriod(fiveK, "4w", "2026-02-10");
assert.equal(filtered.points.length, 1);
assert.equal(filtered.points[0]?.date, "2026-02-01");

const milestones = deriveMilestones([fiveK, single]);
assert.equal(milestones.length, 1);
assert.match(milestones[0]!.label, /5K/);

assert.equal(pickPrimarySeries([single, fiveK])?.type, "run_5k");

const ftpUp = series("ftp", "FTP", [
  { date: "2026-01-01", display: "270 W", value: 270 },
  { date: "2026-02-01", display: "282 W", value: 282 },
]);
const best = pickBestImprovement([fiveK, ftpUp, single]);
assert.ok(best);
assert.match(best.headline, /FTP|5K/);

const slower = series("run_5k", "5K", [
  { date: "2026-01-01", display: "17:40", value: 1060 },
  { date: "2026-02-01", display: "18:02", value: 1082 },
]);
assert.equal(pickBestImprovement([slower, single]), null);

const compare = buildWeekCompareRows(
  {
    plannedSessions: 7,
    completedSessions: 2,
    completionPct: 29,
    averageRpe: 5.5,
    runDistanceKm: null,
    trainingDurationMinutes: null,
  },
  {
    plannedSessions: 6,
    completedSessions: 5,
    completionPct: 83,
    averageRpe: 6,
    runDistanceKm: null,
    trainingDurationMinutes: null,
  }
);
assert.ok(compare.some((row) => row.id === "completed"));
assert.ok(compare.some((row) => row.id === "completion"));
assert.ok(compare.some((row) => row.id === "rpe"));
assert.equal(
  buildWeekCompareRows(
    {
      plannedSessions: 7,
      completedSessions: 2,
      completionPct: 29,
      averageRpe: null,
      runDistanceKm: null,
      trainingDurationMinutes: null,
    },
    { plannedSessions: 0, completedSessions: 0, completionPct: null, averageRpe: null, runDistanceKm: null, trainingDurationMinutes: null }
  ).length,
  0
);

console.log("qa-hyrox-progress-math: ok");
