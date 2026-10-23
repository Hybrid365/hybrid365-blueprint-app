/** Race intelligence V1 types. Analysis reads `seconds` only — never UI strings. */

export const HYROX_RACE_RUN_KEYS = [
  "run1",
  "run2",
  "run3",
  "run4",
  "run5",
  "run6",
  "run7",
  "run8",
] as const;

export type HyroxRaceRunKey = (typeof HYROX_RACE_RUN_KEYS)[number];

export const HYROX_RACE_STATION_KEYS = [
  "skiErg",
  "sledPush",
  "sledPull",
  "burpeeBroadJumps",
  "row",
  "farmersCarry",
  "sandbagLunges",
  "wallBalls",
] as const;

export type HyroxRaceStationKey = (typeof HYROX_RACE_STATION_KEYS)[number];

export const HYROX_RACE_RUN_LABELS: Record<HyroxRaceRunKey, string> = {
  run1: "Run 1",
  run2: "Run 2",
  run3: "Run 3",
  run4: "Run 4",
  run5: "Run 5",
  run6: "Run 6",
  run7: "Run 7",
  run8: "Run 8",
};

export const HYROX_RACE_STATION_LABELS: Record<HyroxRaceStationKey, string> = {
  skiErg: "SkiErg",
  sledPush: "Sled Push",
  sledPull: "Sled Pull",
  burpeeBroadJumps: "Burpee Broad Jumps",
  row: "Row",
  farmersCarry: "Farmers Carry",
  sandbagLunges: "Sandbag Lunges",
  wallBalls: "Wall Balls",
};

export type HyroxRaceTimedValue = {
  display: string | null;
  seconds: number | null;
};

export type HyroxRaceSelfReport = {
  weakestStation: string | null;
  weakestRun: string | null;
  biggestLimiter: string | null;
};

export type HyroxRaceRecord = {
  id: string;
  athleteId: string;
  createdAt: string;
  updatedAt: string;
  eventName: string;
  raceDate: string | null;
  division: string | null;
  category: string | null;
  overall: HyroxRaceTimedValue;
  goal: HyroxRaceTimedValue;
  roxzone: HyroxRaceTimedValue;
  runs: Record<HyroxRaceRunKey, HyroxRaceTimedValue>;
  stations: Record<HyroxRaceStationKey, HyroxRaceTimedValue>;
  notes: string | null;
  selfReport: HyroxRaceSelfReport;
};

export type HyroxRaceDraft = {
  eventName: string;
  raceDate?: string | null;
  division?: string | null;
  category?: string | null;
  overallTime?: string | null;
  goalTime?: string | null;
  notes?: string | null;
  runs?: Partial<Record<HyroxRaceRunKey, string>>;
  stations?: Partial<Record<HyroxRaceStationKey, string>>;
  roxzone?: string | null;
};

export type HyroxRaceCompleteness = "none" | "overall_only" | "partial" | "full";

export type HyroxRaceObservationKind =
  | "run_summary"
  | "run_fade"
  | "station_total"
  | "station_share"
  | "roxzone"
  | "overall_vs_previous"
  | "station_vs_previous"
  | "run_vs_previous"
  | "goal";

export type HyroxRaceObservation = {
  kind: HyroxRaceObservationKind;
  text: string;
};

export type HyroxRaceSplitMark = {
  key: string;
  label: string;
  display: string | null;
  seconds: number;
};

export type HyroxRaceStationShare = {
  key: HyroxRaceStationKey;
  label: string;
  seconds: number;
  display: string | null;
  share: number;
};

export type HyroxRacePreviousComparison = {
  previousId: string;
  previousEventName: string;
  previousDate: string | null;
  overallDeltaSeconds: number | null;
  averageRunDeltaSeconds: number | null;
  stations: Array<{
    key: HyroxRaceStationKey;
    label: string;
    deltaSeconds: number;
  }>;
};

export type HyroxRaceAnalysis = {
  completeness: HyroxRaceCompleteness;
  runCount: number;
  stationCount: number;
  averageRunSeconds: number | null;
  fastestRun: HyroxRaceSplitMark | null;
  slowestRun: HyroxRaceSplitMark | null;
  runFadeSeconds: number | null;
  totalStationSeconds: number | null;
  roxzoneSeconds: number | null;
  stationDistribution: HyroxRaceStationShare[];
  vsPrevious: HyroxRacePreviousComparison | null;
  vsGoalSeconds: number | null;
  observations: HyroxRaceObservation[];
};

export type HyroxRaceHistoryItem = {
  race: HyroxRaceRecord;
  analysis: HyroxRaceAnalysis;
};

/** Raw hyrox_race_results row, including optional 022 columns. */
export type HyroxRaceResultDbRow = {
  id: string;
  athlete_id: string;
  created_at: string;
  updated_at: string;
  race_event: string;
  race_date: string | null;
  category: string | null;
  division?: string | null;
  total_time: string | null;
  total_time_seconds?: number | string | null;
  goal_time?: string | null;
  goal_time_seconds?: number | string | null;
  bodyweight?: number | string | null;
  run_splits: unknown;
  station_splits: unknown;
  split_times?: unknown;
  roxzone_display?: string | null;
  roxzone_seconds?: number | string | null;
  weakest_station?: string | null;
  weakest_run?: string | null;
  biggest_limiter?: string | null;
  notes: string | null;
  roxfit_screenshot_url?: string | null;
};
