/**
 * QA: HYROX 1-1 prescription engine — structured rules, arithmetic, overrides.
 * Run: npx tsx scripts/qa-hyrox-prescription-engine.ts
 * Deterministic unit checks only. No production or staging database.
 */

import type { HyroxAthletePerformanceProfile } from "../app/lib/hyroxBenchmarkProfile";
import {
  PrescriptionEngineError,
  formatPrescriptionExpression,
  resolveHyroxPrescription,
} from "../app/lib/hyroxPrescriptionEngine";
import type { PrescriptionRule } from "../app/lib/hyroxPrescriptionTypes";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}
function assert(cond: unknown, message: string) {
  if (!cond) throw new Error(message);
}

function throws(fn: () => unknown): Error | null {
  try {
    fn();
    return null;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

function emptyProfile(
  overrides: Partial<HyroxAthletePerformanceProfile> = {}
): HyroxAthletePerformanceProfile {
  return {
    run5k: null,
    run10k: null,
    run30min: null,
    threshold: null,
    hyroxRun: null,
    ski2k: null,
    ski1k: null,
    row2k: null,
    ftp: null,
    hyroxRace: null,
    readiness: [],
    ...overrides,
  };
}

const RESOLVED_AT = "2026-10-23T12:00:00.000Z";

const fiveKRule: PrescriptionRule = {
  basis: "run_5k_pace",
  adjustment: { type: "seconds_per_km", value: 20 },
};
const thresholdRule: PrescriptionRule = {
  basis: "threshold_pace",
  adjustment: { type: "seconds_per_km", value: 5 },
};
const hyroxRule: PrescriptionRule = {
  basis: "hyrox_run_pace",
  adjustment: { type: "identity" },
};
const skiRule: PrescriptionRule = {
  basis: "ski_2k_split",
  adjustment: { type: "seconds_per_500m", value: 8 },
};
const rowRule: PrescriptionRule = {
  basis: "row_2k_split",
  adjustment: { type: "seconds_per_500m", value: 5 },
};
const ftpRule: PrescriptionRule = {
  basis: "ftp_watts",
  adjustment: { type: "percent", value: 85 },
};

assert(formatPrescriptionExpression(fiveKRule) === "@5K +20s/km", "5k label");
assert(formatPrescriptionExpression(thresholdRule) === "@THRESHOLD +5s/km", "threshold label");
assert(formatPrescriptionExpression(hyroxRule) === "@HYROX", "hyrox identity label");
assert(formatPrescriptionExpression(skiRule) === "@2K_SKIERG +8s/500m", "ski label");
assert(formatPrescriptionExpression(rowRule) === "@2K_ROW +5s/500m", "row label");
assert(formatPrescriptionExpression(ftpRule) === "@FTP 85%", "ftp label");
assert(
  formatPrescriptionExpression({
    basis: "run_5k_pace",
    adjustment: { type: "seconds_per_km", value: -20 },
  }) === "@5K -20s/km",
  "faster 5k label"
);
assert(
  formatPrescriptionExpression({ basis: "run_5k_pace", adjustment: { type: "identity" } }) === "@5K",
  "5k identity label"
);
ok("formats display labels from structured rules");

const profile = emptyProfile({
  run5k: {
    benchmarkId: "b-5k",
    resultSeconds: 1062,
    paceSecondsPerKm: 212.4,
    resultDate: "2026-10-12",
    source: "coach_entered",
  },
  run10k: {
    benchmarkId: "b-10k",
    resultSeconds: 2210,
    paceSecondsPerKm: 221,
    resultDate: "2026-10-12",
    source: "coach_entered",
  },
  run30min: {
    benchmarkId: "b-30",
    distanceKm: 8.4,
    paceSecondsPerKm: 214,
    resultDate: "2026-10-12",
    source: "coach_entered",
  },
  threshold: {
    benchmarkId: "b-th",
    paceSecondsPerKm: 220,
    thresholdHr: 172,
    resultDate: "2026-10-12",
    source: "coach_entered",
  },
  hyroxRun: {
    benchmarkId: "b-hx",
    paceSecondsPerKm: 230,
    thresholdHr: null,
    resultDate: "2026-10-12",
    source: "coach_entered",
  },
  ski2k: {
    benchmarkId: "b-ski",
    resultSeconds: 438,
    splitSecondsPer500: 109.5,
    resultDate: "2026-10-12",
    source: "coach_entered",
  },
  ski1k: {
    benchmarkId: "b-ski1k",
    resultSeconds: 210,
    splitSecondsPer500: 105,
    resultDate: "2026-10-12",
    source: "onboarding_test",
  },
  row2k: {
    benchmarkId: "b-row",
    resultSeconds: 414,
    splitSecondsPer500: 103.5,
    resultDate: "2026-10-12",
    source: "coach_entered",
  },
  ftp: {
    benchmarkId: "b-ftp",
    watts: 320,
    resultDate: "2026-10-12",
    source: "lab_test",
  },
  hyroxRace: {
    benchmarkId: "b-race",
    totalSeconds: 3854,
    division: "open",
    eventName: "London",
    resultDate: "2026-10-01",
    source: "race_result",
  },
});

const fiveK = resolveHyroxPrescription({
  rule: fiveKRule,
  profile,
  resolvedAt: RESOLVED_AT,
});
assert(fiveK.expression === "@5K +20s/km", "5k expression");
assert(fiveK.anchorType === "run_5k_pace", "5k anchor type");
assert(fiveK.anchorValue === 212.4, "5k uses active 5k pace, not 10k or 30min");
assert(fiveK.anchorUnit === "s/km", "5k unit");
assert(fiveK.offset === 20, "5k offset");
assert(fiveK.resolvedValue === 232.4, "5k +20s/km");
assert(fiveK.resolvedUnit === "s/km", "5k resolved unit");
assert(fiveK.resolvedAt === RESOLVED_AT, "resolvedAt passthrough");
assert(fiveK.source === "formula", "5k source");
assert(fiveK.missingAnchor === false, "5k present");
ok("resolves @5K +20s/km from the active 5k pace");

const faster = resolveHyroxPrescription({
  rule: { basis: "run_5k_pace", adjustment: { type: "seconds_per_km", value: -20 } },
  profile,
  resolvedAt: RESOLVED_AT,
});
assert(faster.resolvedValue === 192.4, "signed faster offset");
assert(faster.expression === "@5K -20s/km", "signed faster expression");
ok("treats negative seconds/km as faster");

const threshold = resolveHyroxPrescription({
  rule: thresholdRule,
  profile,
  resolvedAt: RESOLVED_AT,
});
assert(threshold.resolvedValue === 225, "threshold +5");
assert(threshold.anchorValue === 220, "threshold anchor");
ok("resolves @THRESHOLD +5s/km");

const hyrox = resolveHyroxPrescription({
  rule: hyroxRule,
  profile,
  resolvedAt: RESOLVED_AT,
});
assert(hyrox.resolvedValue === 230, "hyrox identity");
assert(hyrox.offset === null, "identity has no offset");
assert(hyrox.expression === "@HYROX", "hyrox expression");
ok("resolves identity @HYROX as the hyrox run pace");

const ski = resolveHyroxPrescription({
  rule: skiRule,
  profile,
  resolvedAt: RESOLVED_AT,
});
assert(ski.resolvedValue === 117.5, "ski +8");
assert(ski.anchorValue === 109.5, "ski uses 2k split, not ski_1k");
assert(ski.resolvedUnit === "s/500m", "ski unit");
ok("resolves @2K_SKIERG +8s/500m from ski 2k, not ski 1k");

const row = resolveHyroxPrescription({
  rule: rowRule,
  profile,
  resolvedAt: RESOLVED_AT,
});
assert(row.resolvedValue === 108.5, "row +5");
ok("resolves @2K_ROW +5s/500m");

const ftp = resolveHyroxPrescription({
  rule: ftpRule,
  profile,
  resolvedAt: RESOLVED_AT,
});
assert(ftp.resolvedValue === 272, "320 * 85%");
assert(ftp.resolvedUnit === "W", "ftp unit");
assert(ftp.offset === null, "percent is not an additive offset");
ok("resolves @FTP 85% as integer watts");

const ftpRound = resolveHyroxPrescription({
  rule: { basis: "ftp_watts", adjustment: { type: "percent", value: 85 } },
  profile: emptyProfile({
    ftp: { benchmarkId: "ftp-321", watts: 321, resultDate: "2026-10-12", source: "lab_test" },
  }),
  resolvedAt: RESOLVED_AT,
});
assert(ftpRound.resolvedValue === 273, "round 321 * 0.85 = 272.85");
ok("rounds FTP percent to integer watts");

const ftpIdentity = resolveHyroxPrescription({
  rule: { basis: "ftp_watts", adjustment: { type: "identity" } },
  profile,
  resolvedAt: RESOLVED_AT,
});
assert(ftpIdentity.resolvedValue === 320, "ftp identity");
assert(ftpIdentity.expression === "@FTP", "ftp identity label");
ok("allows identity on any Phase A basis");

const again = resolveHyroxPrescription({
  rule: fiveKRule,
  profile,
  resolvedAt: RESOLVED_AT,
});
assert(JSON.stringify(fiveK) === JSON.stringify(again), "deterministic snapshot");
ok("same rule and same anchor produce the same snapshot");

const missing = resolveHyroxPrescription({
  rule: fiveKRule,
  profile: emptyProfile({
    run10k: profile.run10k,
    run30min: profile.run30min,
    ski1k: profile.ski1k,
    hyroxRace: profile.hyroxRace,
    threshold: profile.threshold,
  }),
  resolvedAt: RESOLVED_AT,
});
assert(missing.missingAnchor === true, "missing 5k");
assert(missing.resolvedValue === null, "no estimate");
assert(missing.resolvedUnit === null, "no unit without anchor");
assert(missing.anchorValue === null, "no substitute anchor");
assert(missing.source === "formula", "missing still formula");
assert(missing.expression === "@5K +20s/km", "expression remains");
ok("missing 5k stays missing and does not use 10k, 30min, ski 1k, race or threshold");

const missingFtp = resolveHyroxPrescription({
  rule: ftpRule,
  profile: emptyProfile(),
  resolvedAt: RESOLVED_AT,
});
assert(missingFtp.missingAnchor === true && missingFtp.resolvedValue === null, "missing ftp");
ok("missing FTP is not inferred");

const override = resolveHyroxPrescription({
  rule: fiveKRule,
  profile,
  override: { value: 240, unit: "s/km" },
  resolvedAt: RESOLVED_AT,
});
assert(override.source === "coach_override", "override source");
assert(override.resolvedValue === 240, "typed override");
assert(override.resolvedUnit === "s/km", "override unit");
assert(override.expression === "@5K +20s/km", "rule stays as context");
assert(override.rule.basis === "run_5k_pace", "rule kept");
assert(override.anchorValue === 212.4, "anchor still visible");
assert(override.offset === 20, "offset remains context");
assert(override.resolvedValue !== 232.4, "formula not re-run");
ok("coach override stores the typed number and keeps the rule as context");

const overrideMissing = resolveHyroxPrescription({
  rule: fiveKRule,
  profile: emptyProfile(),
  override: { value: 255, unit: "s/km" },
  resolvedAt: RESOLVED_AT,
});
assert(overrideMissing.source === "coach_override", "override without anchor");
assert(overrideMissing.resolvedValue === 255, "typed number without formula");
assert(overrideMissing.missingAnchor === true, "anchor still missing");
assert(overrideMissing.expression === "@5K +20s/km", "expression context");
ok("coach override does not require an anchor and does not estimate one");

const illegal: Array<[string, PrescriptionRule]> = [
  ["percent on 5k", { basis: "run_5k_pace", adjustment: { type: "percent", value: 85 } }],
  ["s/km on ski", { basis: "ski_2k_split", adjustment: { type: "seconds_per_km", value: 8 } }],
  ["s/km on ftp", { basis: "ftp_watts", adjustment: { type: "seconds_per_km", value: 20 } }],
  ["s/500m on 5k", { basis: "run_5k_pace", adjustment: { type: "seconds_per_500m", value: 5 } }],
  ["s/500m on threshold", { basis: "threshold_pace", adjustment: { type: "seconds_per_500m", value: 5 } }],
  ["percent on hyrox", { basis: "hyrox_run_pace", adjustment: { type: "percent", value: 90 } }],
];

for (const [name, rule] of illegal) {
  const formatError = throws(() => formatPrescriptionExpression(rule));
  const resolveError = throws(() =>
    resolveHyroxPrescription({ rule, profile, resolvedAt: RESOLVED_AT })
  );
  assert(formatError instanceof PrescriptionEngineError, `format rejects ${name}`);
  assert(resolveError instanceof PrescriptionEngineError, `resolve rejects ${name}`);
}
ok("rejects illegal basis and adjustment pairs without guessing");

const overrideIllegal = throws(() =>
  resolveHyroxPrescription({
    rule: { basis: "ftp_watts", adjustment: { type: "seconds_per_km", value: 20 } },
    profile,
    override: { value: 280, unit: "W" },
    resolvedAt: RESOLVED_AT,
  })
);
assert(overrideIllegal instanceof PrescriptionEngineError, "override does not launder illegal rule");
ok("coach override cannot bypass an illegal rule");

console.log(`\n${passed} checks passed`);
