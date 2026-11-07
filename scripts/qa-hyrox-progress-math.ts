/**
 * Progress presentation helpers — real deltas only, no invented trends.
 */
import assert from "node:assert/strict";
import {
  computeBenchmarkDelta,
  deriveMilestones,
  filterSeriesByPeriod,
  isLowerBetter,
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

console.log("qa-hyrox-progress-math: ok");
