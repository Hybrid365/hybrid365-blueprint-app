import {
  PROGRAMMING_READINESS_TYPES,
  benchmarkLabel,
  type BenchmarkSource,
  type BenchmarkStatus,
  type BenchmarkType,
} from "@/app/lib/hyroxBenchmarkTypes";

export type ProfileBenchmarkRow = {
  id: string;
  benchmarkType: BenchmarkType;
  normalizedValue: number;
  normalizedUnit: string;
  derivedValue: number | null;
  derivedUnit: string | null;
  resultDate: string;
  source: BenchmarkSource;
  status: BenchmarkStatus;
  activeForProgramming: boolean;
  context: Record<string, unknown>;
};

export type ActiveRunBenchmark = {
  benchmarkId: string;
  resultSeconds: number;
  paceSecondsPerKm: number;
  resultDate: string;
  source: BenchmarkSource;
};

export type ActivePaceBenchmark = {
  benchmarkId: string;
  paceSecondsPerKm: number;
  thresholdHr: number | null;
  resultDate: string;
  source: BenchmarkSource;
};

export type ActiveErgBenchmark = {
  benchmarkId: string;
  resultSeconds: number;
  splitSecondsPer500: number;
  resultDate: string;
  source: BenchmarkSource;
};

export type ActiveFtpBenchmark = {
  benchmarkId: string;
  watts: number;
  resultDate: string;
  source: BenchmarkSource;
};

export type ActiveHyroxRace = {
  benchmarkId: string;
  totalSeconds: number;
  division: string | null;
  eventName: string | null;
  resultDate: string;
  source: BenchmarkSource;
};

export type HyroxAthletePerformanceProfile = {
  run5k: ActiveRunBenchmark | null;
  run10k: ActiveRunBenchmark | null;
  run30min: { benchmarkId: string; distanceKm: number; paceSecondsPerKm: number; resultDate: string; source: BenchmarkSource } | null;
  threshold: ActivePaceBenchmark | null;
  hyroxRun: ActivePaceBenchmark | null;
  ski2k: ActiveErgBenchmark | null;
  ski1k: ActiveErgBenchmark | null;
  row2k: ActiveErgBenchmark | null;
  ftp: ActiveFtpBenchmark | null;
  hyroxRace: ActiveHyroxRace | null;
  readiness: { type: BenchmarkType; label: string; state: "ready" | "missing" }[];
};

function activeOf(rows: ProfileBenchmarkRow[], type: BenchmarkType): ProfileBenchmarkRow | null {
  return rows.find((row) => row.benchmarkType === type && row.activeForProgramming && row.status === "approved") ?? null;
}

function asRun(row: ProfileBenchmarkRow | null): ActiveRunBenchmark | null {
  if (!row || row.derivedValue == null) return null;
  return {
    benchmarkId: row.id,
    resultSeconds: row.normalizedValue,
    paceSecondsPerKm: row.derivedValue,
    resultDate: row.resultDate,
    source: row.source,
  };
}

function asPace(row: ProfileBenchmarkRow | null): ActivePaceBenchmark | null {
  if (!row) return null;
  const hr = row.context.thresholdHr;
  return {
    benchmarkId: row.id,
    paceSecondsPerKm: row.normalizedValue,
    thresholdHr: typeof hr === "number" ? hr : null,
    resultDate: row.resultDate,
    source: row.source,
  };
}

function asErg(row: ProfileBenchmarkRow | null): ActiveErgBenchmark | null {
  if (!row || row.derivedValue == null) return null;
  return {
    benchmarkId: row.id,
    resultSeconds: row.normalizedValue,
    splitSecondsPer500: row.derivedValue,
    resultDate: row.resultDate,
    source: row.source,
  };
}

/** Active programming anchors only. Missing anchors stay null — nothing is estimated. */
export function buildHyroxAthletePerformanceProfile(rows: ProfileBenchmarkRow[]): HyroxAthletePerformanceProfile {
  const run5k = asRun(activeOf(rows, "run_5k"));
  const run10k = asRun(activeOf(rows, "run_10k"));
  const run30 = activeOf(rows, "run_30min");
  const threshold = asPace(activeOf(rows, "threshold_pace"));
  const hyroxRun = asPace(activeOf(rows, "hyrox_run_pace"));
  const ski2k = asErg(activeOf(rows, "ski_2k"));
  const ski1k = asErg(activeOf(rows, "ski_1k"));
  const row2k = asErg(activeOf(rows, "row_2k"));
  const ftpRow = activeOf(rows, "ftp");
  const race = activeOf(rows, "hyrox_race");
  const readiness = PROGRAMMING_READINESS_TYPES.map((type) => ({
    type,
    label: benchmarkLabel(type),
    state: activeOf(rows, type) ? ("ready" as const) : ("missing" as const),
  }));

  return {
    run5k,
    run10k,
    run30min: run30 && run30.derivedValue != null
      ? {
          benchmarkId: run30.id,
          distanceKm: run30.normalizedValue,
          paceSecondsPerKm: run30.derivedValue,
          resultDate: run30.resultDate,
          source: run30.source,
        }
      : null,
    threshold,
    hyroxRun,
    ski2k,
    ski1k,
    row2k,
    ftp: ftpRow
      ? {
          benchmarkId: ftpRow.id,
          watts: ftpRow.normalizedValue,
          resultDate: ftpRow.resultDate,
          source: ftpRow.source,
        }
      : null,
    hyroxRace: race
      ? {
          benchmarkId: race.id,
          totalSeconds: race.normalizedValue,
          division: typeof race.context.division === "string" ? race.context.division : null,
          eventName: typeof race.context.eventName === "string" ? race.context.eventName : null,
          resultDate: race.resultDate,
          source: race.source,
        }
      : null,
    readiness,
  };
}
