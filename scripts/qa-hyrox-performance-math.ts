/**
 * Performance presentation helpers — current anchors + previous mark only.
 */
import assert from "node:assert/strict";
import type { HyroxAthleteBenchmarkRow } from "../app/lib/hyroxBenchmarkTypes";
import {
  computeMarkDelta,
  currentAnchors,
  findPreviousMark,
  pickPrimaryAnchor,
} from "../components/athlete-command-centre/performance/performanceMath";

function row(partial: Partial<HyroxAthleteBenchmarkRow> & Pick<HyroxAthleteBenchmarkRow, "id" | "benchmark_type" | "result_value" | "normalized_value" | "result_date" | "active_for_programming" | "status">): HyroxAthleteBenchmarkRow {
  return {
    athlete_id: "a1",
    result_unit: "time",
    normalized_unit: "seconds",
    derived_value: null,
    derived_unit: null,
    source: "performance_test",
    context: {},
    notes: null,
    source_table: null,
    source_id: null,
    idempotency_key: null,
    submitted_by_user_id: null,
    approved_by_user_id: null,
    approved_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

const current = row({
  id: "c1",
  benchmark_type: "run_5k",
  result_value: "18:02",
  normalized_value: 1082,
  result_date: "2026-09-10",
  active_for_programming: true,
  status: "approved",
});
const previous = row({
  id: "p1",
  benchmark_type: "run_5k",
  result_value: "17:40",
  normalized_value: 1060,
  result_date: "2025-11-02",
  active_for_programming: false,
  status: "historical",
  source: "imported",
});
const ftp = row({
  id: "f1",
  benchmark_type: "ftp",
  result_value: "280",
  result_unit: "W",
  normalized_value: 280,
  normalized_unit: "watts",
  result_date: "2026-08-01",
  active_for_programming: true,
  status: "approved",
});

const anchors = currentAnchors([current, previous, ftp]);
assert.equal(anchors.length, 2);
assert.equal(pickPrimaryAnchor(anchors)?.row.benchmark_type, "run_5k");

const prev = findPreviousMark([current, previous, ftp], current);
assert.equal(prev?.row.id, "p1");

const delta = computeMarkDelta(current, previous);
assert.ok(delta);
assert.equal(delta.improved, false);
assert.match(delta.absoluteLabel, /\+22/);

console.log("qa-hyrox-performance-math: ok");
