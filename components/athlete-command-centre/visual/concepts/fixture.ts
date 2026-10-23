/**
 * Clearly labelled prototype fixtures for visual-lab concepts.
 * Not a live athlete. Do not render these as production results.
 */
import type { HyroxAthleteAnalytics } from "@/app/lib/hyroxAthleteAnalytics";
import type {
  HyroxRaceAnalysis,
  HyroxRaceHistoryItem,
  HyroxRaceRecord,
  HyroxRaceTimedValue,
} from "@/app/lib/hyroxRaceIntelligenceTypes";
import {
  HYROX_RACE_RUN_KEYS,
  HYROX_RACE_STATION_KEYS,
} from "@/app/lib/hyroxRaceIntelligenceTypes";

export const CONCEPT_PROTOTYPE_BANNER =
  "Prototype · demo data · not a live athlete result";

function timed(display: string, seconds: number): HyroxRaceTimedValue {
  return { display, seconds };
}

export const CONCEPT_FIXTURE = {
  athleteName: "Prototype athlete",
  coachName: "Prototype coach",
  weekLabel: "Week 6 · Build",
  weekRole: "Threshold build",
  dateLabel: "Fri 23 Oct",
  todaySession: {
    name: "Threshold run",
    purpose: "Hold 5K race pace under fatigue",
    duration: "48 min",
    rpe: "7–8",
    primaryTarget: "3:55/km",
    primaryTargetHint: "5 × 1 km",
    structure: [
      { kind: "work" as const, label: "1 km", target: "3:55" },
      { kind: "rest" as const, label: "90s", target: "jog" },
      { kind: "work" as const, label: "1 km", target: "3:55" },
      { kind: "rest" as const, label: "90s", target: "jog" },
      { kind: "work" as const, label: "1 km", target: "3:55" },
      { kind: "rest" as const, label: "90s", target: "jog" },
      { kind: "work" as const, label: "1 km", target: "3:55" },
      { kind: "rest" as const, label: "90s", target: "jog" },
      { kind: "work" as const, label: "1 km", target: "3:55" },
    ],
    prescriptions: [
      { label: "Run", value: "3:55/km", hint: "5K pace" },
      { label: "Ski split", value: "2:05/500m", hint: "if pairing later" },
      { label: "Row split", value: "1:58/500m", hint: "steady" },
      { label: "Watts", value: "210 W", hint: "threshold" },
      { label: "Strength", value: "70 kg", hint: "back squat 4×5" },
    ],
    coachNote:
      "Demo coach copy — keep the last two reps honest. If 3:55 slips, cut the rest, not the pace.",
    whyChanged:
      "Demo coach copy — Tuesday's run faded, so today's volume stays, intensity holds, Saturday's HYROX piece is shorter.",
    upcomingFocus: "Station density under a controlled run",
    guidance: ["Even splits", "Last rep at or faster than first", "Jog recoveries, do not stop"],
  },
  completion: {
    targetPace: "3:55/km",
    actualPace: "3:52/km",
    rpe: "7/10",
    execution: "On target",
    legs: "Good",
    energy: "Solid",
    note: "Demo note — last rep 3:50.",
  },
  week: {
    completed: 3,
    planned: 5,
    runKm: 21,
    durationMinutes: 248,
    averageRpe: 6.8,
    sessionRpeLoad: 1686,
    keyCompleted: 2,
    keyPlanned: 3,
  },
  rolling4: {
    runKm: [18, 21, 20, 21],
    durationMinutes: [210, 236, 228, 248],
    completionPct: [80, 100, 80, 60],
  },
  performance: {
    label: "5K",
    current: "17:55",
    derived: "3:35/km",
    previous: "18:02",
    previousDerived: "3:36/km",
    delta: "↓ 7 sec",
    date: "12 Oct 2026",
    source: "Athlete test",
    status: "current" as const,
    pending: {
      label: "1000 m Ski",
      value: "3:42",
      derived: "1:51/500m",
      date: "21 Oct 2026",
      status: "pending" as const,
    },
  },
} as const;

export const CONCEPT_ANALYTICS: HyroxAthleteAnalytics = {
  athleteId: "prototype-not-a-live-athlete",
  asOf: "2026-10-23T12:00:00.000Z",
  currentWeek: {
    startDate: "2026-10-20",
    endDate: "2026-10-26",
    complete: false,
    plannedSessions: 5,
    completedSessions: 3,
    completionPct: 60,
    runDistanceKm: 21,
    trainingDurationMinutes: 248,
    averageRpe: 6.8,
    sessionRpeLoad: 1686,
    keySessionsCompleted: 2,
    keySessionsPlanned: 3,
  },
  previousWeek: {
    startDate: "2026-10-13",
    endDate: "2026-10-19",
    complete: true,
    plannedSessions: 5,
    completedSessions: 4,
    completionPct: 80,
    runDistanceKm: 20,
    trainingDurationMinutes: 228,
    averageRpe: 6.5,
    sessionRpeLoad: 1482,
    keySessionsCompleted: 3,
    keySessionsPlanned: 3,
  },
  rolling4: {
    runDistanceKm: 80,
    trainingDurationMinutes: 922,
    completionPct: 80,
    averageRpe: 6.6,
  },
  distribution: [
    { modality: "run", durationMinutes: 412, sessionCount: 8 },
    { modality: "hyrox_specific", durationMinutes: 210, sessionCount: 4 },
    { modality: "strength", durationMinutes: 180, sessionCount: 4 },
    { modality: "skierg", durationMinutes: 64, sessionCount: 2 },
    { modality: "rowerg", durationMinutes: 56, sessionCount: 2 },
  ],
  benchmarks: [
    {
      type: "run_5k",
      label: "5K",
      points: [
        { date: "2026-08-18", display: "18:22", normalizedValue: 1102, source: "athlete_test", status: "historical" },
        { date: "2026-09-15", display: "18:02", normalizedValue: 1082, source: "athlete_test", status: "historical" },
        { date: "2026-10-12", display: "17:55", normalizedValue: 1075, source: "athlete_test", status: "approved" },
      ],
    },
  ],
  unsupported: ["heart_rate_series"],
};

const previousRuns = {
  run1: timed("4:12", 252),
  run2: timed("4:18", 258),
  run3: timed("4:20", 260),
  run4: timed("4:22", 262),
  run5: timed("4:28", 268),
  run6: timed("4:30", 270),
  run7: timed("4:34", 274),
  run8: timed("4:38", 278),
} as const;

const latestRuns = {
  run1: timed("4:08", 248),
  run2: timed("4:12", 252),
  run3: timed("4:14", 254),
  run4: timed("4:16", 256),
  run5: timed("4:18", 258),
  run6: timed("4:20", 260),
  run7: timed("4:22", 262),
  run8: timed("4:26", 266),
} as const;

const previousStations = {
  skiErg: timed("4:08", 248),
  sledPush: timed("4:42", 282),
  sledPull: timed("4:18", 258),
  burpeeBroadJumps: timed("3:52", 232),
  row: timed("4:22", 262),
  farmersCarry: timed("2:08", 128),
  sandbagLunges: timed("3:38", 218),
  wallBalls: timed("5:12", 312),
} as const;

const latestStations = {
  skiErg: timed("4:02", 242),
  sledPush: timed("4:28", 268),
  sledPull: timed("4:10", 250),
  burpeeBroadJumps: timed("3:48", 228),
  row: timed("4:16", 256),
  farmersCarry: timed("2:02", 122),
  sandbagLunges: timed("3:30", 210),
  wallBalls: timed("4:54", 294),
} as const;

function raceRecord(partial: {
  id: string;
  eventName: string;
  raceDate: string;
  overall: HyroxRaceTimedValue;
  runs: HyroxRaceRecord["runs"];
  stations: HyroxRaceRecord["stations"];
  roxzone: HyroxRaceTimedValue;
}): HyroxRaceRecord {
  return {
    id: partial.id,
    athleteId: "prototype-not-a-live-athlete",
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-01T12:00:00.000Z",
    eventName: partial.eventName,
    raceDate: partial.raceDate,
    division: "Open",
    category: "Prototyped division — not a live result",
    overall: partial.overall,
    goal: timed("1:14:00", 4440),
    roxzone: partial.roxzone,
    runs: Object.fromEntries(HYROX_RACE_RUN_KEYS.map((key) => [key, partial.runs[key]])) as HyroxRaceRecord["runs"],
    stations: Object.fromEntries(
      HYROX_RACE_STATION_KEYS.map((key) => [key, partial.stations[key]])
    ) as HyroxRaceRecord["stations"],
    notes: "Demo race note — not a live athlete result.",
    selfReport: { weakestStation: null, weakestRun: null, biggestLimiter: null },
  };
}

const latestRace = raceRecord({
  id: "prototype-race-2",
  eventName: "Prototype HYROX Manchester",
  raceDate: "2026-09-28",
  overall: timed("1:12:18", 4338),
  runs: latestRuns,
  stations: latestStations,
  roxzone: timed("6:42", 402),
});

const previousRace = raceRecord({
  id: "prototype-race-1",
  eventName: "Prototype HYROX Birmingham",
  raceDate: "2026-05-10",
  overall: timed("1:14:29", 4469),
  runs: previousRuns,
  stations: previousStations,
  roxzone: timed("7:18", 438),
});

const latestAnalysis: HyroxRaceAnalysis = {
  completeness: "full",
  runCount: 8,
  stationCount: 8,
  averageRunSeconds: 257,
  fastestRun: { key: "run1", label: "Run 1", display: "4:08", seconds: 248 },
  slowestRun: { key: "run8", label: "Run 8", display: "4:26", seconds: 266 },
  runFadeSeconds: 18,
  totalStationSeconds: 1870,
  roxzoneSeconds: 402,
  stationDistribution: HYROX_RACE_STATION_KEYS.map((key) => ({
    key,
    label: key,
    seconds: latestStations[key].seconds ?? 0,
    display: latestStations[key].display,
    share: (latestStations[key].seconds ?? 0) / 1870,
  })),
  vsPrevious: {
    previousId: previousRace.id,
    previousEventName: previousRace.eventName,
    previousDate: previousRace.raceDate,
    overallDeltaSeconds: -131,
    averageRunDeltaSeconds: -8,
    stations: HYROX_RACE_STATION_KEYS.map((key) => ({
      key,
      label: key,
      deltaSeconds: (latestStations[key].seconds ?? 0) - (previousStations[key].seconds ?? 0),
    })),
  },
  vsGoalSeconds: -102,
  observations: [
    { kind: "overall_vs_previous", text: "Overall 2:11 faster than Prototype HYROX Birmingham." },
    { kind: "run_fade", text: "Run fade 18s from Run 1 to Run 8." },
    { kind: "station_vs_previous", text: "Largest station improvement: Wall Balls 18s faster than previous race." },
    { kind: "roxzone", text: "Roxzone 36s faster than previous race." },
  ],
};

export const CONCEPT_RACES: HyroxRaceHistoryItem[] = [
  { race: latestRace, analysis: latestAnalysis },
  {
    race: previousRace,
    analysis: {
      completeness: "full",
      runCount: 8,
      stationCount: 8,
      averageRunSeconds: 265,
      fastestRun: { key: "run1", label: "Run 1", display: "4:12", seconds: 252 },
      slowestRun: { key: "run8", label: "Run 8", display: "4:38", seconds: 278 },
      runFadeSeconds: 26,
      totalStationSeconds: 1940,
      roxzoneSeconds: 438,
      stationDistribution: [],
      vsPrevious: null,
      vsGoalSeconds: 29,
      observations: [{ kind: "run_fade", text: "Run fade 26s from Run 1 to Run 8." }],
    },
  },
];
