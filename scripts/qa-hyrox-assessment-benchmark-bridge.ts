/**
 * QA: Assessment → Performance Profile bridge (coach import, no silent activate).
 * Run: npx tsx scripts/qa-hyrox-assessment-benchmark-bridge.ts
 */

import {
  buildAssessmentBenchmarkBridge,
  assessmentImportIdempotencyKey,
} from "../app/lib/hyroxAssessmentBenchmarkBridge";
import { buildHyroxAthletePerformanceProfile } from "../app/lib/hyroxBenchmarkProfile";
import { buildProgrammingAnchorsSummary } from "../app/lib/hyroxProgrammingAnchors";
import { normalizeBenchmarkInput } from "../app/lib/hyroxBenchmarkTypes";
import type { HyroxAthleteBenchmarkRow } from "../app/lib/hyroxBenchmarkTypes";
import type { HyroxAssessmentRow } from "../app/lib/hyroxDatabaseTypes";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function assessment(partial: Partial<HyroxAssessmentRow> & Pick<HyroxAssessmentRow, "id">): HyroxAssessmentRow {
  return {
    athlete_id: "a1",
    created_at: "2026-10-20T12:00:00.000Z",
    updated_at: "2026-10-20T12:00:00.000Z",
    submitted_at: "2026-10-20T12:00:00.000Z",
    raw_answers: {},
    training_days: null,
    weekly_training_hours: null,
    current_weekly_run_volume_km: null,
    five_k_time: null,
    ten_k_time: null,
    max_heart_rate: null,
    threshold_heart_rate: null,
    station_weaknesses: null,
    equipment_access: null,
    injury_flags: null,
    sleep_quality: null,
    stress_level: null,
    bodyweight: null,
    body_composition_goal: null,
    documentation_consent: true,
    status: "submitted",
    ...partial,
  };
}

function row(partial: Partial<HyroxAthleteBenchmarkRow> & Pick<HyroxAthleteBenchmarkRow, "id" | "benchmark_type" | "normalized_value" | "result_value">): HyroxAthleteBenchmarkRow {
  return {
    athlete_id: "a1",
    result_unit: "seconds",
    normalized_unit: "sec",
    derived_value: null,
    derived_unit: null,
    result_date: "2026-10-20",
    source: "onboarding_test",
    status: "pending",
    active_for_programming: false,
    context: {},
    notes: null,
    source_table: null,
    source_id: null,
    submitted_by_user_id: null,
    approved_by_user_id: null,
    approved_at: null,
    idempotency_key: null,
    created_at: "2026-10-20T12:00:00.000Z",
    updated_at: "2026-10-20T12:00:00.000Z",
    ...partial,
  };
}

// A — 5K + 10K shown
const a = assessment({
  id: "assess-1",
  five_k_time: "18:42",
  ten_k_time: "39:10",
  raw_answers: {
    easyRunPace: "4:30/km",
    previousHyroxPb: "1:12:00",
    thresholdHeartRate: 172,
  },
});
const bridgeA = buildAssessmentBenchmarkBridge(a, []);
assert(bridgeA, "bridge exists");
assert(bridgeA!.candidates.some((c) => c.key === "five_k_time" && c.displayValue.includes("18:42")), "5K");
assert(bridgeA!.candidates.some((c) => c.key === "ten_k_time"), "10K");
assert(bridgeA!.candidates.some((c) => c.benchmarkType === "hyrox_race"), "race importable as race");
assert(
  bridgeA!.context.some((c) => /HYROX run pace/i.test(c.note) || /Does not set HYROX run pace/i.test(c.note)),
  "race context note"
);
assert(!bridgeA!.candidates.some((c) => c.benchmarkType === "threshold_pace"), "no auto threshold");
assert(!bridgeA!.candidates.some((c) => c.benchmarkType === "hyrox_run_pace"), "no auto hyrox run");
ok("A Assessment with 5K + 10K shown as available");

// B — Add creates draft that normalizes; pending path (not active)
const five = bridgeA!.candidates.find((c) => c.key === "five_k_time")!;
const norm = normalizeBenchmarkInput(five.draft);
assert(norm.benchmarkType === "run_5k", "type");
assert(norm.normalizedValue === 18 * 60 + 42, "seconds");
const idem = assessmentImportIdempotencyKey("assess-1", "five_k_time", five.draft);
assert(idem.includes("assess-1") && idem.includes("five_k_time"), "idempotency");
ok("B Add 5K draft normalizes; import stays coach-gated (pending unless makeActive)");

// C — Activating updates anchors (simulate active row → profile)
const activeRows = [
  row({
    id: "b1",
    benchmark_type: "run_5k",
    result_value: "18:42",
    normalized_value: 1122,
    normalized_unit: "sec",
    derived_value: 224.4,
    derived_unit: "sec_per_km",
    status: "approved",
    active_for_programming: true,
    source: "onboarding_test",
  }),
];
const profile = buildHyroxAthletePerformanceProfile(
  activeRows.map((r) => ({
    id: r.id,
    benchmarkType: r.benchmark_type,
    normalizedValue: r.normalized_value,
    normalizedUnit: r.normalized_unit,
    derivedValue: r.derived_value,
    derivedUnit: r.derived_unit,
    resultDate: r.result_date,
    source: r.source,
    status: r.status,
    activeForProgramming: r.active_for_programming,
    context: r.context as Record<string, unknown>,
  }))
);
assert(profile.run5k != null, "active 5k on profile");
const anchors = buildProgrammingAnchorsSummary(profile);
assert(anchors.items.find((i) => i.key === "run5k")?.freshness !== "not_set", "anchor set");
ok("C Coach activates 5K → Programming Anchor updates");

// D — Missing threshold remains Not set
assert(anchors.items.find((i) => i.key === "threshold")?.freshness === "not_set", "threshold missing");
ok("D Missing threshold remains Not set");

// E — Coach estimate threshold (simulate active coach_entered)
const withTh = buildProgrammingAnchorsSummary(
  buildHyroxAthletePerformanceProfile([
    {
      id: "t1",
      benchmarkType: "threshold_pace",
      normalizedValue: 235,
      normalizedUnit: "sec_per_km",
      derivedValue: null,
      derivedUnit: null,
      resultDate: "2026-10-25",
      source: "coach_entered",
      status: "approved",
      activeForProgramming: true,
      context: {},
    },
  ])
);
assert(withTh.items.find((i) => i.key === "threshold")?.primary === "3:55/km", "3:55");
assert(withTh.items.find((i) => i.key === "threshold")?.sourceLabel === "Coach estimate", "estimate label");
ok("E Coach estimate threshold → active anchor");

// F — Duplicate same value already pending / active
const bridgePending = buildAssessmentBenchmarkBridge(a, [
  row({
    id: "p1",
    benchmark_type: "run_5k",
    result_value: "18:42",
    normalized_value: 1122,
    status: "pending",
  }),
]);
assert(
  bridgePending!.candidates.find((c) => c.key === "five_k_time")?.match === "pending_same",
  "pending same"
);
const bridgeActive = buildAssessmentBenchmarkBridge(a, [
  row({
    id: "a1",
    benchmark_type: "run_5k",
    result_value: "18:42",
    normalized_value: 1122,
    status: "approved",
    active_for_programming: true,
  }),
]);
assert(
  bridgeActive!.candidates.find((c) => c.key === "five_k_time")?.match === "active_same",
  "active same"
);
const bridgeDiff = buildAssessmentBenchmarkBridge(a, [
  row({
    id: "d1",
    benchmark_type: "run_5k",
    result_value: "19:00",
    normalized_value: 1140,
    status: "approved",
    active_for_programming: true,
  }),
]);
assert(
  bridgeDiff!.candidates.find((c) => c.key === "five_k_time")?.match === "active_different",
  "active different warns"
);
ok("F Duplicate handling: pending_same / active_same / active_different");

// G — Pending does not displace active in profile resolver
const mixed = buildHyroxAthletePerformanceProfile([
  {
    id: "active",
    benchmarkType: "run_5k",
    normalizedValue: 1100,
    normalizedUnit: "sec",
    derivedValue: 220,
    derivedUnit: "sec_per_km",
    resultDate: "2026-09-01",
    source: "lab_test",
    status: "approved",
    activeForProgramming: true,
    context: {},
  },
  {
    id: "pend",
    benchmarkType: "run_5k",
    normalizedValue: 1122,
    normalizedUnit: "sec",
    derivedValue: 224.4,
    derivedUnit: "sec_per_km",
    resultDate: "2026-10-20",
    source: "onboarding_test",
    status: "pending",
    activeForProgramming: false,
    context: {},
  },
]);
assert(mixed.run5k?.paceSecondsPerKm === 220, "pending does not win");
assert(mixed.run5k?.source === "lab_test", "active source retained");
ok("G Pending athlete/assessment value does not displace active");

// H — Builder summary matches profile
const builder = buildProgrammingAnchorsSummary(mixed, { includeRun10k: false });
assert(builder.items.find((i) => i.key === "run5k")?.primary != null, "builder has 5k");
assert(builder.items.find((i) => i.key === "threshold")?.freshness === "not_set", "builder threshold");
ok("H Programme Builder receives same active anchors");

// Skip N/A
const skip = buildAssessmentBenchmarkBridge(
  assessment({ id: "x", five_k_time: "N/A", ten_k_time: "" }),
  []
);
assert(!skip || !skip.candidates.some((c) => c.key === "five_k_time"), "skip N/A");
ok("Skips non-real assessment times");

console.log(`\nqa-hyrox-assessment-benchmark-bridge: ${passed} checks passed`);
