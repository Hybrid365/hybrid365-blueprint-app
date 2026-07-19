/**
 * Read-only performance profile derived from submitted test results.
 * Does not regenerate or overwrite programmes.
 *
 * Supports Version 1 (legacy station diagnostics + 3-round sled-run) and
 * Version 2 (continuous HYROX benchmark) result shapes without mutating stored data.
 */

import type {
  CompromisedHyroxBenchmarkResult,
  CompromisedHyroxRunKey,
  CompromisedSledRunResult,
  Erg2kResult,
  FiveKRunResult,
  PerformanceTestResultRow,
  PerformanceTestingVersion,
  PerformanceTestType,
  RecoveryBaselineRow,
} from "@/app/lib/hyroxPerformanceTestingTypes";
import {
  COMPROMISED_HYROX_RUN_CONTEXT,
  COMPROMISED_HYROX_RUN_KEYS,
  COMPROMISED_HYROX_STATION_FIELDS,
  PERFORMANCE_TEST_DEFINITIONS,
  PERFORMANCE_TESTING_VERSION,
  requiredPerformanceTestTypesForVersion,
} from "@/app/lib/hyroxPerformanceTestingTypes";

export type CompromisedSimulationDerived = {
  protocolVersion: string | null;
  totalCompletionTime: string | null;
  averageCompromisedRunPace: string | null;
  fastestRun: string | null;
  slowestRun: string | null;
  run1VersusRun8: string | null;
  averageFirstFourRunPace: string | null;
  averageLastFourRunPace: string | null;
  percentageRunningDeterioration: string | null;
  largestSlowdownAfterStation: string | null;
  freshSkiVersusSimulationSki: string | null;
  freshRowVersusSimulationRow: string | null;
  biggestReportedLimiter: string | null;
  runSplits: string[];
  stationSplits: Array<{ label: string; time: string | null }>;
  equipmentSetup: Record<string, string | null>;
};

export type HyroxPerformanceProfile = {
  completedTests: PerformanceTestType[];
  missingTests: PerformanceTestType[];
  performanceTestingVersion: PerformanceTestingVersion;
  benchmarkValues: Record<string, string | number | null>;
  running: {
    fiveKTime: string | null;
    fiveKPace: string | null;
    runAverageHr: string | null;
    thresholdPaceReference: string | null;
    runningLevel: string | null;
    splitFade: string | null;
  };
  ski: {
    ski2kTime: string | null;
    ski500mSplit: string | null;
    skiAverageWatts: string | null;
    skiAverageHr: string | null;
    skiFade: string | null;
    suggestedSkiThresholdRange: string | null;
    suggestedSkiRaceRange: string | null;
  };
  row: {
    row2kTime: string | null;
    row500mSplit: string | null;
    rowAverageWatts: string | null;
    rowAverageHr: string | null;
    rowFade: string | null;
    suggestedRowThresholdRange: string | null;
    suggestedRowRaceRange: string | null;
  };
  strength: {
    lowerStrengthExercise: string | null;
    load: string | null;
    reps: string | null;
    estimatedStrengthReserve: string | null;
    singleLegAsymmetry: string | null;
    painOrRestriction: string | null;
  };
  grip: {
    deadHangSeconds: string | null;
    farmersCarryDrops: string | null;
    gripLimitation: string | null;
  };
  stations: {
    sledPushResult: string | null;
    sledPullResult: string | null;
    wallBallTime: string | null;
    wallBallSetBreakdown: string | null;
    stationLimiters: string[];
  };
  compromised: {
    compromisedRunSplits: string[];
    runPaceDropoff: string | null;
    stationToRunLimitation: string | null;
    totalRounds: number | null;
    primaryLimiter: string | null;
    secondaryLimiter: string | null;
    /** Version 2 continuous simulation derived metrics (null fields when inputs missing). */
    simulation: CompromisedSimulationDerived | null;
  };
  recovery: {
    restingHrBaseline: number | null;
    baselineDays: number | null;
    optionalHrvBaseline: number | null;
    optionalSleepBaseline: number | null;
  };
  likelyPrimaryLimiter: string | null;
  likelySecondaryLimiter: string | null;
  suggestedProgrammingEmphasis: string[];
  missingInformationWarnings: string[];
};

function resultByType(
  results: PerformanceTestResultRow[],
  testType: PerformanceTestType
): PerformanceTestResultRow | undefined {
  return results.find(
    (r) =>
      r.test_type === testType &&
      (r.status === "submitted" || r.status === "reviewed")
  );
}

function str(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

function parseSplitFade(first: string | null, second: string | null): string | null {
  if (!first || !second) return null;
  return `${first} → ${second}`;
}

function suggestErgRange(split: string | null): { threshold: string | null; race: string | null } {
  if (!split) return { threshold: null, race: null };
  return {
    threshold: `Slightly slower than test split (${split}) for threshold work`,
    race: `Conservative race pace ~${split} or slightly slower`,
  };
}

/** Parse mm:ss or m:ss or seconds into total seconds. Returns null if unparseable. */
function parseTimeToSeconds(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  const parts = s.split(":").map((p) => p.trim());
  if (parts.length === 2) {
    const m = Number(parts[0]);
    const sec = Number(parts[1]);
    if (!Number.isFinite(m) || !Number.isFinite(sec)) return null;
    return m * 60 + sec;
  }
  if (parts.length === 3) {
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    const sec = Number(parts[2]);
    if (![h, m, sec].every(Number.isFinite)) return null;
    return h * 3600 + m * 60 + sec;
  }
  return null;
}

function formatSecondsAsPace(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds);
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatSecondsClock(totalSeconds: number): string {
  return formatSecondsAsPace(totalSeconds);
}

function averageSeconds(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function protocolRunDistanceM(protocolVersion: string | null): number | null {
  if (protocolVersion === "600m") return 600;
  if (protocolVersion === "800m") return 800;
  return null;
}

function buildSimulationDerived(
  data: CompromisedHyroxBenchmarkResult,
  freshSkiTime: string | null,
  freshRowTime: string | null
): CompromisedSimulationDerived {
  const protocolVersion = str(data.protocolVersion);
  const runDistanceM = protocolRunDistanceM(protocolVersion);
  const runEntries = COMPROMISED_HYROX_RUN_KEYS.map((key) => ({
    key,
    label: COMPROMISED_HYROX_RUN_CONTEXT[key].label,
    precededBy: COMPROMISED_HYROX_RUN_CONTEXT[key].precededBy,
    raw: str(data.runSplits?.[key]),
    seconds: parseTimeToSeconds(str(data.runSplits?.[key])),
  }));

  const timedRuns = runEntries.filter((r) => r.seconds != null) as Array<{
    key: CompromisedHyroxRunKey;
    label: string;
    precededBy: string;
    raw: string;
    seconds: number;
  }>;

  let averageCompromisedRunPace: string | null = null;
  let averageFirstFourRunPace: string | null = null;
  let averageLastFourRunPace: string | null = null;
  let percentageRunningDeterioration: string | null = null;

  if (runDistanceM && timedRuns.length === 8) {
    const avgSec = averageSeconds(timedRuns.map((r) => r.seconds));
    if (avgSec != null) {
      averageCompromisedRunPace = `${formatSecondsAsPace((avgSec / runDistanceM) * 1000)}/km`;
    }
    const first4 = averageSeconds(timedRuns.slice(0, 4).map((r) => r.seconds));
    const last4 = averageSeconds(timedRuns.slice(4).map((r) => r.seconds));
    if (first4 != null) {
      averageFirstFourRunPace = `${formatSecondsAsPace((first4 / runDistanceM) * 1000)}/km`;
    }
    if (last4 != null) {
      averageLastFourRunPace = `${formatSecondsAsPace((last4 / runDistanceM) * 1000)}/km`;
    }
    if (first4 != null && last4 != null && first4 > 0) {
      const pct = ((last4 - first4) / first4) * 100;
      percentageRunningDeterioration = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    }
  }

  let fastestRun: string | null = null;
  let slowestRun: string | null = null;
  if (timedRuns.length > 0) {
    const fastest = [...timedRuns].sort((a, b) => a.seconds - b.seconds)[0];
    const slowest = [...timedRuns].sort((a, b) => b.seconds - a.seconds)[0];
    fastestRun = `${fastest.label} · ${fastest.raw}`;
    slowestRun = `${slowest.label} · ${slowest.raw}`;
  }

  let run1VersusRun8: string | null = null;
  const r1 = timedRuns.find((r) => r.key === "run1");
  const r8 = timedRuns.find((r) => r.key === "run8");
  if (r1 && r8) {
    const delta = r8.seconds - r1.seconds;
    run1VersusRun8 = `${r1.raw} → ${r8.raw} (${delta >= 0 ? "+" : ""}${formatSecondsClock(Math.abs(delta))})`;
  }

  let largestSlowdownAfterStation: string | null = null;
  if (timedRuns.length >= 2) {
    let maxDelta = -Infinity;
    let afterLabel: string | null = null;
    for (let i = 1; i < timedRuns.length; i++) {
      const delta = timedRuns[i].seconds - timedRuns[i - 1].seconds;
      if (delta > maxDelta) {
        maxDelta = delta;
        afterLabel = timedRuns[i].precededBy;
      }
    }
    if (afterLabel && maxDelta > -Infinity) {
      largestSlowdownAfterStation = `${afterLabel} (+${formatSecondsClock(maxDelta)})`;
    }
  }

  const simSki = str(data.stationSplits?.ski1000m);
  const simRow = str(data.stationSplits?.row1000m);
  const freshSkiSec = parseTimeToSeconds(freshSkiTime);
  const simSkiSec = parseTimeToSeconds(simSki);
  const freshRowSec = parseTimeToSeconds(freshRowTime);
  const simRowSec = parseTimeToSeconds(simRow);

  let freshSkiVersusSimulationSki: string | null = null;
  if (freshSkiTime && simSki) {
    if (freshSkiSec != null && simSkiSec != null) {
      const delta = simSkiSec - freshSkiSec;
      freshSkiVersusSimulationSki = `Fresh ${freshSkiTime} vs sim ${simSki} (${delta >= 0 ? "+" : ""}${formatSecondsClock(Math.abs(delta))})`;
    } else {
      freshSkiVersusSimulationSki = `Fresh ${freshSkiTime} vs sim ${simSki}`;
    }
  }

  let freshRowVersusSimulationRow: string | null = null;
  if (freshRowTime && simRow) {
    if (freshRowSec != null && simRowSec != null) {
      const delta = simRowSec - freshRowSec;
      freshRowVersusSimulationRow = `Fresh ${freshRowTime} vs sim ${simRow} (${delta >= 0 ? "+" : ""}${formatSecondsClock(Math.abs(delta))})`;
    } else {
      freshRowVersusSimulationRow = `Fresh ${freshRowTime} vs sim ${simRow}`;
    }
  }

  return {
    protocolVersion,
    totalCompletionTime: str(data.totalCompletionTime),
    averageCompromisedRunPace,
    fastestRun,
    slowestRun,
    run1VersusRun8,
    averageFirstFourRunPace,
    averageLastFourRunPace,
    percentageRunningDeterioration,
    largestSlowdownAfterStation,
    freshSkiVersusSimulationSki,
    freshRowVersusSimulationRow,
    biggestReportedLimiter: str(data.overallLimitation),
    runSplits: runEntries.map((r) => (r.raw ? `${r.label}: ${r.raw}` : "")).filter(Boolean),
    stationSplits: COMPROMISED_HYROX_STATION_FIELDS.map((f) => ({
      label: f.label,
      time: str(data.stationSplits?.[f.key]),
    })),
    equipmentSetup: {
      sledPushWeight: str(data.sledPushWeight),
      sledPullWeight: str(data.sledPullWeight),
      farmersCarryWeight: str(data.farmersCarryWeight),
      sandbagWeight: str(data.sandbagWeight),
      wallBallWeight: str(data.wallBallWeight),
      wallBallTargetHeight: str(data.wallBallTargetHeight),
      surfaceFacilityNotes: str(data.surfaceFacilityNotes),
      divisionCategory: str(data.divisionCategory),
    },
  };
}

function inferLimiters(profile: {
  runFade: string | null;
  skiFade: string | null;
  rowFade: string | null;
  gripLimitation: string | null;
  stationLimiters: string[];
  compromisedDropoff: string | null;
  painOrRestriction: string | null;
}): { primary: string | null; secondary: string | null; emphasis: string[] } {
  const scores: Record<string, number> = {};

  const bump = (key: string, amount = 1) => {
    scores[key] = (scores[key] ?? 0) + amount;
  };

  if (profile.runFade) bump("running", 2);
  if (profile.skiFade) bump("engine_ski", 2);
  if (profile.rowFade) bump("engine_row", 2);
  if (profile.gripLimitation) bump("grip", 2);
  if (profile.compromisedDropoff) bump("compromised_running", 3);
  if (profile.painOrRestriction) bump("strength_recovery", 3);
  for (const limiter of profile.stationLimiters) {
    if (limiter) bump(`station_${limiter.toLowerCase()}`, 1);
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primary = ranked[0]?.[0] ?? null;
  const secondary = ranked[1]?.[0] ?? null;

  const emphasis: string[] = [];
  if (primary?.includes("running") || primary?.includes("compromised")) {
    emphasis.push("Threshold and race-pace running with compromised-run progressions");
  }
  if (primary?.includes("engine")) {
    emphasis.push("Sustainable erg threshold development");
  }
  if (primary?.includes("grip") || primary?.includes("station")) {
    emphasis.push("Grip endurance and station durability");
  }
  if (primary?.includes("strength")) {
    emphasis.push("Controlled strength development with recovery priority");
  }
  if (!emphasis.length) {
    emphasis.push("Balanced base with retest comparison after next block");
  }

  const label = (key: string | null) => {
    if (!key) return null;
    if (key.startsWith("station_")) return key.replace("station_", "").replace(/_/g, " ");
    if (key === "engine_ski") return "SkiErg engine";
    if (key === "engine_row") return "RowErg engine";
    if (key === "compromised_running") return "Compromised running";
    if (key === "strength_recovery") return "Strength / recovery";
    return key.replace(/_/g, " ");
  };

  return { primary: label(primary), secondary: label(secondary), emphasis };
}

export function buildHyroxPerformanceProfile(
  results: PerformanceTestResultRow[],
  baseline?: RecoveryBaselineRow | null,
  version: PerformanceTestingVersion = PERFORMANCE_TESTING_VERSION
): HyroxPerformanceProfile {
  const requiredTypes = requiredPerformanceTestTypesForVersion(version);
  const completedTests = requiredTypes.filter((t) => Boolean(resultByType(results, t)));
  const missingTests = requiredTypes.filter((t) => !resultByType(results, t));

  const fiveK = resultByType(results, "five_k_run");
  const fiveKData = (fiveK?.result_json ?? {}) as FiveKRunResult;
  const ski = resultByType(results, "ski_2k");
  const skiData = (ski?.result_json ?? {}) as Erg2kResult;
  const row = resultByType(results, "row_2k");
  const rowData = (row?.result_json ?? {}) as Erg2kResult;
  const strength = resultByType(results, "strength_assessment");
  const strengthData = strength?.result_json ?? {};
  const deadHang = resultByType(results, "dead_hang");
  const deadHangData = deadHang?.result_json ?? {};
  const farmers = resultByType(results, "farmers_carry");
  const farmersData = farmers?.result_json ?? {};
  const sledPush = resultByType(results, "sled_push");
  const sledPull = resultByType(results, "sled_pull");
  const wallBall = resultByType(results, "wall_ball");
  const legacyCompromised = resultByType(results, "compromised_sled_run");
  const legacyData = (legacyCompromised?.result_json ?? {}) as CompromisedSledRunResult;
  const simResult = resultByType(results, "compromised_hyrox_benchmark");
  const simData = (simResult?.result_json ?? {}) as CompromisedHyroxBenchmarkResult;

  const skiFade = parseSplitFade(str(skiData.first1kmSplit), str(skiData.second1kmSplit));
  const rowFade = parseSplitFade(str(rowData.first1kmSplit), str(rowData.second1kmSplit));
  const skiRanges = suggestErgRange(str(skiData.average500mSplit));
  const rowRanges = suggestErgRange(str(rowData.average500mSplit));

  const simulation =
    simResult != null
      ? buildSimulationDerived(simData, str(skiData.totalTime), str(rowData.totalTime))
      : null;

  const stationLimiters = [
    str(sledPush?.result_json?.limitation),
    str(sledPull?.result_json?.limitation),
    str(wallBall?.result_json?.primaryLimitation),
    str(farmersData.gripPostureLimitation),
    simulation?.biggestReportedLimiter ?? null,
  ].filter(Boolean) as string[];

  const compromisedDropoff =
    simulation?.percentageRunningDeterioration ??
    simulation?.run1VersusRun8 ??
    str(legacyData.runPaceDeterioration);

  const limiterInference = inferLimiters({
    runFade: str(fiveKData.kmSplits),
    skiFade,
    rowFade,
    gripLimitation: str(deadHangData.limitation) ?? str(simData.stationNotes?.farmersDrops),
    stationLimiters,
    compromisedDropoff,
    painOrRestriction:
      str(strengthData.painOrRestriction) ?? str(simData.stationNotes?.painOrRestriction),
  });

  const warnings: string[] = [];
  for (const testType of missingTests) {
    warnings.push(`Missing ${PERFORMANCE_TEST_DEFINITIONS[testType].title}.`);
  }
  if (!baseline?.resting_hr_baseline) {
    warnings.push("Recovery baseline resting HR not recorded.");
  }
  if (version === 1) {
    warnings.push("Legacy testing protocol (Version 1) — structure preserved as published.");
  }

  return {
    completedTests,
    missingTests,
    performanceTestingVersion: version,
    benchmarkValues: {
      five_k_time: str(fiveKData.totalTime),
      five_k_pace: str(fiveKData.averagePace),
      ski_2k_time: str(skiData.totalTime),
      row_2k_time: str(rowData.totalTime),
      dead_hang_seconds: str(deadHangData.totalSeconds),
      simulation_total_time: simulation?.totalCompletionTime ?? null,
      simulation_protocol: simulation?.protocolVersion ?? null,
    },
    running: {
      fiveKTime: str(fiveKData.totalTime),
      fiveKPace: str(fiveKData.averagePace),
      runAverageHr: str(fiveKData.averageHr),
      thresholdPaceReference: str(fiveKData.averagePace),
      runningLevel: fiveKData.totalTime ? "Derived from 5 km test" : null,
      splitFade: str(fiveKData.kmSplits),
    },
    ski: {
      ski2kTime: str(skiData.totalTime),
      ski500mSplit: str(skiData.average500mSplit),
      skiAverageWatts: str(skiData.averageWatts),
      skiAverageHr: str(skiData.averageHr),
      skiFade,
      suggestedSkiThresholdRange: skiRanges.threshold,
      suggestedSkiRaceRange: skiRanges.race,
    },
    row: {
      row2kTime: str(rowData.totalTime),
      row500mSplit: str(rowData.average500mSplit),
      rowAverageWatts: str(rowData.averageWatts),
      rowAverageHr: str(rowData.averageHr),
      rowFade,
      suggestedRowThresholdRange: rowRanges.threshold,
      suggestedRowRaceRange: rowRanges.race,
    },
    strength: {
      lowerStrengthExercise: str(strengthData.exercise),
      load: str(strengthData.load),
      reps: str(strengthData.reps),
      estimatedStrengthReserve: str(strengthData.rpe)
        ? `RPE ${str(strengthData.rpe)} — ~1–2 reps in reserve assumed`
        : null,
      singleLegAsymmetry: str(strengthData.leftRightDifference),
      painOrRestriction: str(strengthData.painOrRestriction),
    },
    grip: {
      deadHangSeconds: str(deadHangData.totalSeconds),
      farmersCarryDrops:
        str(farmersData.drops) ?? str(simData.stationNotes?.farmersDrops),
      gripLimitation: str(deadHangData.limitation),
    },
    stations: {
      sledPushResult:
        str(sledPush?.result_json?.totalTime) ?? str(simData.stationSplits?.sledPush50m),
      sledPullResult:
        str(sledPull?.result_json?.totalTime) ?? str(simData.stationSplits?.sledPull50m),
      wallBallTime:
        str(wallBall?.result_json?.totalTime) ?? str(simData.stationSplits?.wallBalls50),
      wallBallSetBreakdown:
        str(wallBall?.result_json?.setBreakdown) ??
        str(simData.stationNotes?.wallBallSetBreakdown),
      stationLimiters,
    },
    compromised: {
      compromisedRunSplits:
        simulation?.runSplits ??
        (legacyData.rounds ?? []).map((r) => r.runSplit).filter(Boolean),
      runPaceDropoff: compromisedDropoff,
      stationToRunLimitation:
        simulation?.largestSlowdownAfterStation ?? str(legacyData.weakestComponent),
      totalRounds: simulation ? 1 : (legacyData.rounds?.length ?? null),
      primaryLimiter:
        simulation?.biggestReportedLimiter ?? str(legacyData.weakestComponent),
      secondaryLimiter:
        str(simData.stationNotes?.technicalBreakdown) ?? str(legacyData.techniqueBreakdown),
      simulation,
    },
    recovery: {
      restingHrBaseline: baseline?.resting_hr_baseline ?? null,
      baselineDays: baseline?.baseline_days ?? null,
      optionalHrvBaseline: baseline?.average_hrv ?? null,
      optionalSleepBaseline: baseline?.average_sleep_minutes ?? null,
    },
    likelyPrimaryLimiter: limiterInference.primary,
    likelySecondaryLimiter: limiterInference.secondary,
    suggestedProgrammingEmphasis: limiterInference.emphasis,
    missingInformationWarnings: warnings,
  };
}
