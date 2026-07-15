/**
 * Read-only performance profile derived from submitted test results.
 * Does not regenerate or overwrite programmes.
 */

import type {
  CompromisedSledRunResult,
  Erg2kResult,
  FiveKRunResult,
  PerformanceTestResultRow,
  PerformanceTestType,
  RecoveryBaselineRow,
} from "@/app/lib/hyroxPerformanceTestingTypes";
import {
  ALL_PERFORMANCE_TEST_TYPES,
  PERFORMANCE_TEST_DEFINITIONS,
} from "@/app/lib/hyroxPerformanceTestingTypes";

export type HyroxPerformanceProfile = {
  completedTests: PerformanceTestType[];
  missingTests: PerformanceTestType[];
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
  baseline?: RecoveryBaselineRow | null
): HyroxPerformanceProfile {
  const completedTests = ALL_PERFORMANCE_TEST_TYPES.filter((t) => Boolean(resultByType(results, t)));
  const missingTests = ALL_PERFORMANCE_TEST_TYPES.filter((t) => !resultByType(results, t));

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
  const compromised = resultByType(results, "compromised_sled_run");
  const compromisedData = (compromised?.result_json ?? {}) as CompromisedSledRunResult;

  const skiFade = parseSplitFade(str(skiData.first1kmSplit), str(skiData.second1kmSplit));
  const rowFade = parseSplitFade(str(rowData.first1kmSplit), str(rowData.second1kmSplit));
  const skiRanges = suggestErgRange(str(skiData.average500mSplit));
  const rowRanges = suggestErgRange(str(rowData.average500mSplit));

  const stationLimiters = [
    str(sledPush?.result_json?.limitation),
    str(sledPull?.result_json?.limitation),
    str(wallBall?.result_json?.primaryLimitation),
    str(farmersData.gripPostureLimitation),
  ].filter(Boolean) as string[];

  const limiterInference = inferLimiters({
    runFade: str(fiveKData.kmSplits),
    skiFade,
    rowFade,
    gripLimitation: str(deadHangData.limitation),
    stationLimiters,
    compromisedDropoff: str(compromisedData.runPaceDeterioration),
    painOrRestriction: str(strengthData.painOrRestriction),
  });

  const warnings: string[] = [];
  for (const testType of missingTests) {
    warnings.push(`Missing ${PERFORMANCE_TEST_DEFINITIONS[testType].title}.`);
  }
  if (!baseline?.resting_hr_baseline) {
    warnings.push("Recovery baseline resting HR not recorded.");
  }

  return {
    completedTests,
    missingTests,
    benchmarkValues: {
      five_k_time: str(fiveKData.totalTime),
      five_k_pace: str(fiveKData.averagePace),
      ski_2k_time: str(skiData.totalTime),
      row_2k_time: str(rowData.totalTime),
      dead_hang_seconds: str(deadHangData.totalSeconds),
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
      farmersCarryDrops: str(farmersData.drops),
      gripLimitation: str(deadHangData.limitation),
    },
    stations: {
      sledPushResult: str(sledPush?.result_json?.totalTime),
      sledPullResult: str(sledPull?.result_json?.totalTime),
      wallBallTime: str(wallBall?.result_json?.totalTime),
      wallBallSetBreakdown: str(wallBall?.result_json?.setBreakdown),
      stationLimiters,
    },
    compromised: {
      compromisedRunSplits: (compromisedData.rounds ?? []).map((r) => r.runSplit).filter(Boolean),
      runPaceDropoff: str(compromisedData.runPaceDeterioration),
      stationToRunLimitation: str(compromisedData.weakestComponent),
      totalRounds: compromisedData.rounds?.length ?? null,
      primaryLimiter: str(compromisedData.weakestComponent),
      secondaryLimiter: str(compromisedData.techniqueBreakdown),
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
