/**
 * Athlete baseline testing shapes (onboarding page only — not session library).
 * Structured for later coach assessment / profile mapping.
 */

export type BenchmarkTestId =
  | "5k"
  | "ski"
  | "row2k"
  | "compromised"
  | "farmer_hold"
  | "sandbag_lunge"
  | "wall_ball"
  | "sled_exposure";

export type BenchmarkTestKind =
  | "run_5k"
  | "erg_ski_1k"
  | "erg_row_2k"
  | "mini_compromised"
  | "farmer_hold"
  | "sandbag_lunge"
  | "wall_ball"
  | "sled_exposure";

export const LIMITING_FACTOR_OPTIONS = [
  "",
  "grip",
  "traps",
  "posture",
  "quads",
  "glutes",
  "breathing",
  "balance",
  "shoulders",
  "technique",
  "strength",
  "surface",
  "pain",
  "other",
] as const;

/** Individual benchmark submission payloads (discriminated by kind). */
export type BenchmarkSubmission =
  | {
      kind: "run_5k";
      resultTime: string;
      averagePace: string;
      averageHr: string;
      maxHr: string;
      rpe: string;
      notes: string;
    }
  | {
      kind: "erg_ski_1k";
      resultTime: string;
      averageSplit: string;
      strokeRate: string;
      averageHr: string;
      rpe: string;
      notes: string;
    }
  | {
      kind: "erg_row_2k";
      resultTime: string;
      averageSplit: string;
      strokeRate: string;
      averageHr: string;
      rpe: string;
      notes: string;
    }
  | {
      kind: "mini_compromised";
      totalTime: string;
      firstRunSplit: string;
      finalRunSplit: string;
      lungeLoad: string;
      burpeeLungeNotes: string;
      rpe: string;
      notes: string;
    }
  | {
      kind: "farmer_hold";
      weightPerHand: string;
      totalHoldTime: string;
      rpe: string;
      limitingFactor: string;
      notes: string;
    }
  | {
      kind: "sandbag_lunge";
      loadUsed: string;
      totalMetres4Min: string;
      numberOfBreaks: string;
      rpe: string;
      limitingFactor: string;
      notes: string;
    }
  | {
      kind: "wall_ball";
      formatUsed: string;
      ballWeight: string;
      targetHeight: string;
      repsCompleted: string;
      totalTime: string;
      numberOfBreaks: string;
      rpe: string;
      limitingFactor: string;
      notes: string;
    }
  | {
      kind: "sled_exposure";
      pushOrPull: string;
      loadUsed: string;
      surfaceType: string;
      repTimes: string;
      rpe: string;
      limitingFactor: string;
      notes: string;
    };

/** Snapshot shape for coach/profile mapping (mock local state → API later). */
export type AthleteBaselineTestingSnapshot = {
  core: {
    run5k?: BenchmarkSubmission & { kind: "run_5k" };
    ski1k?: BenchmarkSubmission & { kind: "erg_ski_1k" };
    row2k?: BenchmarkSubmission & { kind: "erg_row_2k" };
    miniCompromised?: BenchmarkSubmission & { kind: "mini_compromised" };
  };
  roxfitRace?: HyroxRaceSplitSubmission | null;
  optionalStrength: {
    farmerHold?: BenchmarkSubmission & { kind: "farmer_hold" };
    sandbagLunge?: BenchmarkSubmission & { kind: "sandbag_lunge" };
    wallBall?: BenchmarkSubmission & { kind: "wall_ball" };
    sledExposure?: BenchmarkSubmission & { kind: "sled_exposure" };
  };
};

export function benchmarkKindForTestId(testId: string): BenchmarkTestKind {
  switch (testId as BenchmarkTestId) {
    case "5k":
      return "run_5k";
    case "ski":
      return "erg_ski_1k";
    case "row2k":
      return "erg_row_2k";
    case "compromised":
      return "mini_compromised";
    case "farmer_hold":
      return "farmer_hold";
    case "sandbag_lunge":
      return "sandbag_lunge";
    case "wall_ball":
      return "wall_ball";
    case "sled_exposure":
      return "sled_exposure";
    default:
      return "run_5k";
  }
}

export function emptySubmissionForKind(kind: BenchmarkTestKind): BenchmarkSubmission {
  switch (kind) {
    case "run_5k":
      return {
        kind: "run_5k",
        resultTime: "",
        averagePace: "",
        averageHr: "",
        maxHr: "",
        rpe: "",
        notes: "",
      };
    case "erg_ski_1k":
      return {
        kind: "erg_ski_1k",
        resultTime: "",
        averageSplit: "",
        strokeRate: "",
        averageHr: "",
        rpe: "",
        notes: "",
      };
    case "erg_row_2k":
      return {
        kind: "erg_row_2k",
        resultTime: "",
        averageSplit: "",
        strokeRate: "",
        averageHr: "",
        rpe: "",
        notes: "",
      };
    case "mini_compromised":
      return {
        kind: "mini_compromised",
        totalTime: "",
        firstRunSplit: "",
        finalRunSplit: "",
        lungeLoad: "",
        burpeeLungeNotes: "",
        rpe: "",
        notes: "",
      };
    case "farmer_hold":
      return {
        kind: "farmer_hold",
        weightPerHand: "",
        totalHoldTime: "",
        rpe: "",
        limitingFactor: "",
        notes: "",
      };
    case "sandbag_lunge":
      return {
        kind: "sandbag_lunge",
        loadUsed: "",
        totalMetres4Min: "",
        numberOfBreaks: "",
        rpe: "",
        limitingFactor: "",
        notes: "",
      };
    case "wall_ball":
      return {
        kind: "wall_ball",
        formatUsed: "",
        ballWeight: "",
        targetHeight: "",
        repsCompleted: "",
        totalTime: "",
        numberOfBreaks: "",
        rpe: "",
        limitingFactor: "",
        notes: "",
      };
    case "sled_exposure":
      return {
        kind: "sled_exposure",
        pushOrPull: "",
        loadUsed: "",
        surfaceType: "",
        repTimes: "",
        rpe: "",
        limitingFactor: "",
        notes: "",
      };
  }
}

/** Primary result line for test cards (RPE shown separately on the card). */
export function formatBenchmarkSummary(s: BenchmarkSubmission): string {
  switch (s.kind) {
    case "run_5k":
      return [s.resultTime && `Time ${s.resultTime}`, s.averagePace && `Pace ${s.averagePace}`].filter(Boolean).join(" · ");
    case "erg_ski_1k":
      return [s.resultTime && `Time ${s.resultTime}`, s.averageSplit && `Split ${s.averageSplit}`].filter(Boolean).join(" · ");
    case "erg_row_2k":
      return [s.resultTime && `Time ${s.resultTime}`, s.averageSplit && `Split ${s.averageSplit}`].filter(Boolean).join(" · ");
    case "mini_compromised":
      return [
        s.totalTime && `Total ${s.totalTime}`,
        s.firstRunSplit && s.finalRunSplit && `Runs ${s.firstRunSplit} → ${s.finalRunSplit}`,
        s.lungeLoad && `Lunge ${s.lungeLoad}`,
      ]
        .filter(Boolean)
        .join(" · ");
    case "farmer_hold":
      return [
        s.weightPerHand && `${s.weightPerHand}/hand`,
        s.totalHoldTime && `Hold ${s.totalHoldTime}`,
        s.limitingFactor && `Limiter: ${s.limitingFactor}`,
      ]
        .filter(Boolean)
        .join(" · ");
    case "sandbag_lunge":
      return [
        s.totalMetres4Min && `${s.totalMetres4Min}m in 4 min`,
        s.loadUsed && `Load ${s.loadUsed}`,
        s.limitingFactor && `Limiter: ${s.limitingFactor}`,
      ]
        .filter(Boolean)
        .join(" · ");
    case "wall_ball":
      return [
        s.formatUsed,
        s.repsCompleted && `${s.repsCompleted} reps`,
        s.totalTime && `Time ${s.totalTime}`,
        s.limitingFactor && `Limiter: ${s.limitingFactor}`,
      ]
        .filter(Boolean)
        .join(" · ");
    case "sled_exposure":
      return [
        s.pushOrPull,
        s.loadUsed && `Load ${s.loadUsed}`,
        s.surfaceType,
        s.limitingFactor && `Limiter: ${s.limitingFactor}`,
      ]
        .filter(Boolean)
        .join(" · ");
  }
}

export type RunSplitKey =
  | "run1"
  | "run2"
  | "run3"
  | "run4"
  | "run5"
  | "run6"
  | "run7"
  | "run8";

/** Recent HYROX Solo / RoxFit-style race submission (local mock). */
export type HyroxRaceSplitSubmission = {
  id: string;
  submittedAt: string;
  raceLocation: string;
  raceDate: string;
  category: string;
  totalFinishTime: string;
  bodyweightKg: string;
  raceNotes: string;
  runSplits: Record<RunSplitKey, string>;
  stationSplits: {
    skiErg: string;
    sledPush: string;
    sledPull: string;
    burpeeBroadJumps: string;
    row: string;
    farmersCarry: string;
    sandbagLunges: string;
    wallBalls: string;
  };
  roxfitScreenshot: "yes" | "no" | "";
  worstStation: string;
  worstRun: string;
  biggestLimiter: string;
  unusual: string;
};

export function emptyRaceForm(): Omit<HyroxRaceSplitSubmission, "id" | "submittedAt"> {
  return {
    raceLocation: "",
    raceDate: "",
    category: "",
    totalFinishTime: "",
    bodyweightKg: "",
    raceNotes: "",
    runSplits: {
      run1: "",
      run2: "",
      run3: "",
      run4: "",
      run5: "",
      run6: "",
      run7: "",
      run8: "",
    },
    stationSplits: {
      skiErg: "",
      sledPush: "",
      sledPull: "",
      burpeeBroadJumps: "",
      row: "",
      farmersCarry: "",
      sandbagLunges: "",
      wallBalls: "",
    },
    roxfitScreenshot: "",
    worstStation: "",
    worstRun: "",
    biggestLimiter: "",
    unusual: "",
  };
}

export function formatRoxFitSummaryCard(s: HyroxRaceSplitSubmission): {
  headline: string;
  lines: string[];
} {
  const lines = [
    s.raceLocation && s.raceDate ? `${s.raceLocation} · ${s.raceDate}` : s.raceLocation || s.raceDate || "",
    s.totalFinishTime && `Finish ${s.totalFinishTime}`,
    s.category && `Category ${s.category}`,
    "Strongest station: identifiable from fastest station split vs field (coach review).",
    s.worstStation && `Weakest station (self-report): ${s.worstStation}`,
    s.worstRun && `Hardest run leg: ${s.worstRun}`,
    s.biggestLimiter && `Biggest limiter: ${s.biggestLimiter}`,
    "Run drop-off: compare Run 1 vs Run 8 splits in RoxFit when reviewing.",
  ].filter(Boolean);

  return {
    headline: s.totalFinishTime ? `HYROX race · ${s.totalFinishTime}` : "HYROX race submitted",
    lines,
  };
}
