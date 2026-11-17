import { TRACK_FOUNDATION_AS_OF } from "./dates";
import type { BenchmarkResultInput, DayKey, EquipmentId, TrackIntake, WorkloadCard } from "./types";

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FULL_KIT: EquipmentId[] = [
  "gym",
  "treadmill",
  "track",
  "skierg",
  "rower",
  "bike",
  "sled",
  "wall_ball",
  "sandbag",
  "farmers",
  "dumbbells",
];

function intake(partial: Partial<TrackIntake> & Pick<TrackIntake, "athleteId" | "displayName" | "goal">): TrackIntake {
  return {
    athleteId: partial.athleteId,
    displayName: partial.displayName,
    goal: partial.goal,
    event: partial.event ?? {
      hasEvent: false,
      eventType: null,
      eventName: null,
      eventDate: null,
      division: null,
    },
    availability: partial.availability ?? {
      daysPerWeek: 6,
      availableDays: DAYS,
      unavailableDays: ["Sun"],
      doublesPossible: false,
      doubleDays: [],
      sessionLength: "60_90",
      weekendAvailable: true,
    },
    background: partial.background ?? {
      runDaysPerWeek: 3,
      runKmPerWeek: 25,
      strengthDaysPerWeek: 2,
      hyroxSessionsPerWeek: 1,
      bikeOrErgNote: null,
      trainingAge: "intermediate",
    },
    equipment: partial.equipment ?? FULL_KIT,
    equipmentConfirmed: partial.equipmentConfirmed ?? true,
    pain: partial.pain ?? {
      hasConcern: false,
      areas: [],
      severity: "none",
      affectsTraining: false,
      note: null,
    },
  };
}

function result(partial: BenchmarkResultInput): BenchmarkResultInput {
  return partial;
}

export type TrackFixture = {
  id: string;
  label: string;
  summary: string;
  intake: TrackIntake;
  results: BenchmarkResultInput[];
  workload: WorkloadCard[];
};

const hyroxEvent = {
  hasEvent: true,
  eventType: "HYROX Open",
  eventName: "HYROX London",
  eventDate: "2027-03-20",
  division: "Open",
};

export const TRACK_FIXTURES: TrackFixture[] = [
  {
    id: "hyrox_recent",
    label: "A · Recent 5K + HYROX",
    summary: "Fewer tests. 5K and race are kept. Ski, row and strength are still open.",
    intake: intake({
      athleteId: "fixture-a",
      displayName: "Alex",
      goal: "hyrox",
      event: hyroxEvent,
      background: {
        runDaysPerWeek: 4,
        runKmPerWeek: 32,
        strengthDaysPerWeek: 2,
        hyroxSessionsPerWeek: 1,
        bikeOrErgNote: null,
        trainingAge: "experienced",
      },
    }),
    results: [
      result({
        id: "a-5k",
        testId: "run_5k",
        resultValue: "18:12",
        unit: "mm:ss",
        date: "2026-11-05",
        source: "official_race",
        notes: "Park race",
      }),
      result({
        id: "a-hyrox",
        testId: "hyrox_race",
        resultValue: "1:18:40",
        unit: "mm:ss",
        date: "2026-10-20",
        source: "official_race",
        details: { division: "Open", eventName: "HYROX Manchester" },
      }),
    ],
    workload: [],
  },
  {
    id: "new_athlete",
    label: "B · No benchmarks",
    summary: "Fuller assessment. Nothing is assumed from the training-age label.",
    intake: intake({
      athleteId: "fixture-b",
      displayName: "Blake",
      goal: "hyrox",
      event: { ...hyroxEvent, hasEvent: false, eventDate: null, eventName: null },
      background: {
        runDaysPerWeek: 2,
        runKmPerWeek: 12,
        strengthDaysPerWeek: 1,
        hyroxSessionsPerWeek: 0,
        bikeOrErgNote: null,
        trainingAge: "beginner",
      },
    }),
    results: [],
    workload: [],
  },
  {
    id: "runner_no_stations",
    label: "C · Running, no stations",
    summary: "Running is accepted. The week is station and erg heavy.",
    intake: intake({
      athleteId: "fixture-c",
      displayName: "Casey",
      goal: "hyrox",
      event: hyroxEvent,
      background: {
        runDaysPerWeek: 5,
        runKmPerWeek: 45,
        strengthDaysPerWeek: 1,
        hyroxSessionsPerWeek: 0,
        bikeOrErgNote: null,
        trainingAge: "experienced",
      },
    }),
    results: [
      result({
        id: "c-5k",
        testId: "run_5k",
        resultValue: "19:40",
        unit: "mm:ss",
        date: "2026-11-01",
        source: "official_race",
      }),
      result({
        id: "c-10k",
        testId: "run_10k",
        resultValue: "41:20",
        unit: "mm:ss",
        date: "2026-09-12",
        source: "official_race",
      }),
    ],
    workload: [],
  },
  {
    id: "complete_recent",
    label: "D · Recent complete testing",
    summary: "Almost no assessment. History still shows the 5K path.",
    intake: intake({
      athleteId: "fixture-d",
      displayName: "Drew",
      goal: "hyrox",
      event: hyroxEvent,
      background: {
        runDaysPerWeek: 4,
        runKmPerWeek: 40,
        strengthDaysPerWeek: 2,
        hyroxSessionsPerWeek: 2,
        bikeOrErgNote: "Ski and row weekly",
        trainingAge: "experienced",
      },
    }),
    results: [
      result({ id: "d-5k-old", testId: "run_5k", resultValue: "18:12", unit: "mm:ss", date: "2026-05-01", source: "official_race" }),
      result({ id: "d-5k-mid", testId: "run_5k", resultValue: "17:45", unit: "mm:ss", date: "2026-08-15", source: "official_race" }),
      result({ id: "d-5k", testId: "run_5k", resultValue: "17:21", unit: "mm:ss", date: "2026-11-05", source: "official_race" }),
      result({ id: "d-ski", testId: "ski_2k", resultValue: "7:35", unit: "mm:ss", date: "2026-11-02", source: "coach_test" }),
      result({ id: "d-row", testId: "row_2k", resultValue: "7:20", unit: "mm:ss", date: "2026-11-02", source: "coach_test" }),
      result({
        id: "d-strength",
        testId: "strength_lower",
        resultValue: "100",
        unit: "kg",
        date: "2026-11-03",
        source: "coach_test",
        details: { load: "trap-bar × 5" },
      }),
      result({
        id: "d-hyrox",
        testId: "hyrox_race",
        resultValue: "1:12:05",
        unit: "mm:ss",
        date: "2026-10-18",
        source: "official_race",
        details: {
          division: "Pro",
          eventName: "HYROX Birmingham",
          splits: { ski: "4:10", sled_push: "3:40", sled_pull: "4:05", burpee_broad_jump: "3:55", row: "4:02", farmers: "2:20", sandbag_lunges: "4:30", wall_balls: "3:50" },
        },
      }),
      result({ id: "d-wall", testId: "wall_ball", resultValue: "80", unit: "reps", date: "2026-11-04", source: "training_test" }),
    ],
    workload: [
      { key: "run_km", label: "Run", planned: 36, completed: 34, unit: "km" },
      { key: "run_easy", label: "Easy", planned: 22, completed: 21, unit: "km" },
      { key: "threshold_min", label: "Threshold", planned: 24, completed: 20, unit: "min" },
      { key: "ski_m", label: "Ski", planned: 6000, completed: 5500, unit: "m" },
      { key: "row_m", label: "Row", planned: 5000, completed: 5000, unit: "m" },
      { key: "sled_push_m", label: "Sled push", planned: 250, completed: 200, unit: "m" },
      { key: "wall_balls", label: "Wall balls", planned: 120, completed: 100, unit: "reps" },
    ],
  },
  {
    id: "pain_review",
    label: "E · Pain flagged",
    summary: "Manual review. Easy aerobic only. No programme proposal.",
    intake: intake({
      athleteId: "fixture-e",
      displayName: "Eden",
      goal: "hyrox",
      event: hyroxEvent,
      pain: {
        hasConcern: true,
        areas: ["knee"],
        severity: "meaningful_unresolved",
        affectsTraining: true,
        note: "Knee pain on stairs for three weeks.",
      },
    }),
    results: [
      result({
        id: "e-5k",
        testId: "run_5k",
        resultValue: "22:10",
        unit: "mm:ss",
        date: "2026-11-01",
        source: "training_test",
      }),
    ],
    workload: [],
  },
  {
    id: "no_sled",
    label: "F · No sled",
    summary: "Station session is built without a sled.",
    intake: intake({
      athleteId: "fixture-f",
      displayName: "Frankie",
      goal: "hyrox",
      event: hyroxEvent,
      equipment: ["gym", "treadmill", "skierg", "rower", "wall_ball", "farmers", "dumbbells"],
    }),
    results: [
      result({
        id: "f-5k",
        testId: "run_5k",
        resultValue: "21:05",
        unit: "mm:ss",
        date: "2026-11-08",
        source: "coach_test",
      }),
    ],
    workload: [],
  },
  {
    id: "stale_5k",
    label: "Stale 5K",
    summary: "Fast but old. Kept in history. Not used as the current anchor.",
    intake: intake({
      athleteId: "fixture-stale",
      displayName: "Sam",
      goal: "hyrox",
      event: hyroxEvent,
    }),
    results: [
      result({
        id: "stale-5k",
        testId: "run_5k",
        resultValue: "16:40",
        unit: "mm:ss",
        date: "2026-04-01",
        source: "official_race",
      }),
    ],
    workload: [],
  },
  {
    id: "source_quality",
    label: "Watch vs race",
    summary: "A newer watch estimate does not beat a slightly older official race.",
    intake: intake({
      athleteId: "fixture-source",
      displayName: "Riley",
      goal: "running_performance",
      equipment: ["track", "treadmill"],
      background: {
        runDaysPerWeek: 5,
        runKmPerWeek: 40,
        strengthDaysPerWeek: 0,
        hyroxSessionsPerWeek: 0,
        bikeOrErgNote: null,
        trainingAge: "experienced",
      },
    }),
    results: [
      result({
        id: "watch-5k",
        testId: "run_5k",
        resultValue: "17:50",
        unit: "mm:ss",
        date: "2026-11-12",
        source: "watch_estimate",
      }),
      result({
        id: "race-5k",
        testId: "run_5k",
        resultValue: "18:12",
        unit: "mm:ss",
        date: "2026-10-08",
        source: "official_race",
      }),
    ],
    workload: [],
  },
];

export function fixtureById(id: string): TrackFixture | null {
  return TRACK_FIXTURES.find((fixture) => fixture.id === id) ?? null;
}

export const FIXTURE_AS_OF = TRACK_FOUNDATION_AS_OF;

export const DASHBOARD_WORKLOAD_FIXTURE = "complete_recent";
