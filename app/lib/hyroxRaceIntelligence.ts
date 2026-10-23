import { formatDuration, parseClockToSeconds } from "@/app/lib/hyroxBenchmarkMath";
import {
  HYROX_RACE_RUN_KEYS,
  HYROX_RACE_RUN_LABELS,
  HYROX_RACE_STATION_KEYS,
  HYROX_RACE_STATION_LABELS,
  type HyroxRaceAnalysis,
  type HyroxRaceCompleteness,
  type HyroxRaceDraft,
  type HyroxRaceHistoryItem,
  type HyroxRaceObservation,
  type HyroxRacePreviousComparison,
  type HyroxRaceRecord,
  type HyroxRaceResultDbRow,
  type HyroxRaceRunKey,
  type HyroxRaceSplitMark,
  type HyroxRaceStationKey,
  type HyroxRaceStationShare,
  type HyroxRaceTimedValue,
} from "@/app/lib/hyroxRaceIntelligenceTypes";

export {
  HYROX_RACE_RUN_KEYS,
  HYROX_RACE_RUN_LABELS,
  HYROX_RACE_STATION_KEYS,
  HYROX_RACE_STATION_LABELS,
} from "@/app/lib/hyroxRaceIntelligenceTypes";
export type {
  HyroxRaceAnalysis,
  HyroxRaceDraft,
  HyroxRaceHistoryItem,
  HyroxRaceObservation,
  HyroxRaceRecord,
  HyroxRaceResultDbRow,
  HyroxRaceTimedValue,
} from "@/app/lib/hyroxRaceIntelligenceTypes";

const RUN_ALIASES: Record<string, HyroxRaceRunKey> = Object.fromEntries(
  HYROX_RACE_RUN_KEYS.flatMap((key, index) => {
    const n = String(index + 1);
    return [
      [key, key],
      [`run ${n}`, key],
      [`run_${n}`, key],
      [`run-${n}`, key],
    ];
  })
) as Record<string, HyroxRaceRunKey>;

const STATION_ALIASES: Record<string, HyroxRaceStationKey> = {
  skierg: "skiErg",
  ski: "skiErg",
  ski_erg: "skiErg",
  "ski-erg": "skiErg",
  sledpush: "sledPush",
  sled_push: "sledPush",
  "sled-push": "sledPush",
  sledpull: "sledPull",
  sled_pull: "sledPull",
  "sled-pull": "sledPull",
  burpeebroadjumps: "burpeeBroadJumps",
  burpee_broad_jumps: "burpeeBroadJumps",
  "burpee-broad-jumps": "burpeeBroadJumps",
  bbj: "burpeeBroadJumps",
  row: "row",
  rower: "row",
  farmerscarry: "farmersCarry",
  farmers_carry: "farmersCarry",
  "farmers-carry": "farmersCarry",
  farmercarry: "farmersCarry",
  sandbaglunges: "sandbagLunges",
  sandbag_lunges: "sandbagLunges",
  "sandbag-lunges": "sandbagLunges",
  wallballs: "wallBalls",
  wall_balls: "wallBalls",
  "wall-balls": "wallBalls",
  wallball: "wallBalls",
};

const ROXZONE_ALIASES = new Set(["roxzone", "rox_zone", "rox-zone", "rox zone"]);

function emptyTimed(): HyroxRaceTimedValue {
  return { display: null, seconds: null };
}

function emptyRuns(): Record<HyroxRaceRunKey, HyroxRaceTimedValue> {
  return {
    run1: emptyTimed(),
    run2: emptyTimed(),
    run3: emptyTimed(),
    run4: emptyTimed(),
    run5: emptyTimed(),
    run6: emptyTimed(),
    run7: emptyTimed(),
    run8: emptyTimed(),
  };
}

function emptyStations(): Record<HyroxRaceStationKey, HyroxRaceTimedValue> {
  return {
    skiErg: emptyTimed(),
    sledPush: emptyTimed(),
    sledPull: emptyTimed(),
    burpeeBroadJumps: emptyTimed(),
    row: emptyTimed(),
    farmersCarry: emptyTimed(),
    sandbagLunges: emptyTimed(),
    wallBalls: emptyTimed(),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asPositiveNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

/** Parse a clock for storage. Malformed input returns null seconds; never throws. */
export function parseOptionalRaceClock(raw: string | null | undefined): number | null {
  const text = raw?.trim() ?? "";
  if (!text) return null;
  try {
    return parseClockToSeconds(text);
  } catch {
    return null;
  }
}

export function formatRaceClock(seconds: number, forceHours = false): string {
  const useHours = forceHours || seconds >= 3600;
  return formatDuration(seconds, { forceHours: useHours });
}

export function formatRaceDelta(deltaSeconds: number): string {
  const abs = Math.abs(deltaSeconds);
  const clock = abs < 60 ? `${Math.round(abs)}s` : formatRaceClock(abs);
  if (deltaSeconds > 0) return `${clock} slower`;
  if (deltaSeconds < 0) return `${clock} faster`;
  return "unchanged";
}

export function timedValueFromDisplay(raw: string | null | undefined): HyroxRaceTimedValue {
  const display = asString(raw);
  return { display, seconds: parseOptionalRaceClock(display) };
}

export function timedValueFromStored(input: {
  display?: string | null;
  seconds?: unknown;
}): HyroxRaceTimedValue {
  const seconds = asPositiveNumber(input.seconds);
  const display = asString(input.display) ?? (seconds != null ? formatRaceClock(seconds, seconds >= 3600) : null);
  return { display, seconds };
}

function timedFromUnknown(value: unknown): HyroxRaceTimedValue {
  if (value == null) return emptyTimed();
  if (typeof value === "string" || typeof value === "number") {
    return timedValueFromDisplay(String(value));
  }
  const obj = asRecord(value);
  if ("display" in obj || "seconds" in obj) {
    const display = asString(obj.display) ?? asString(obj.raw) ?? asString(obj.time);
    return timedValueFromStored({ display, seconds: obj.seconds });
  }
  return emptyTimed();
}

function lookupAlias(map: Record<string, string>, rawKey: string): string | null {
  const compact = rawKey.trim();
  if (!compact) return null;
  if (map[compact]) return map[compact];
  const lower = compact.toLowerCase().replace(/\s+/g, "_");
  return map[lower] ?? map[lower.replace(/_/g, "-")] ?? map[lower.replace(/[_-]/g, "")] ?? null;
}

function readRunMap(source: Record<string, unknown>): Record<HyroxRaceRunKey, HyroxRaceTimedValue> {
  const runs = emptyRuns();
  for (const [rawKey, value] of Object.entries(source)) {
    const key = lookupAlias(RUN_ALIASES, rawKey) as HyroxRaceRunKey | null;
    if (!key) continue;
    runs[key] = timedFromUnknown(value);
  }
  return runs;
}

function readStationMap(source: Record<string, unknown>): Record<HyroxRaceStationKey, HyroxRaceTimedValue> {
  const stations = emptyStations();
  for (const [rawKey, value] of Object.entries(source)) {
    const key = lookupAlias(STATION_ALIASES, rawKey) as HyroxRaceStationKey | null;
    if (!key) continue;
    stations[key] = timedFromUnknown(value);
  }
  return stations;
}

function readRoxzone(splitTimes: Record<string, unknown>, row: HyroxRaceResultDbRow): HyroxRaceTimedValue {
  const fromColumn = timedValueFromStored({
    display: row.roxzone_display ?? null,
    seconds: row.roxzone_seconds,
  });
  if (fromColumn.seconds != null || fromColumn.display) return fromColumn;
  if (splitTimes.roxzone != null) return timedFromUnknown(splitTimes.roxzone);
  for (const [rawKey, value] of Object.entries(splitTimes)) {
    if (ROXZONE_ALIASES.has(rawKey.trim().toLowerCase().replace(/\s+/g, "_"))) {
      return timedFromUnknown(value);
    }
  }
  const stations = asRecord(row.station_splits);
  for (const [rawKey, value] of Object.entries(stations)) {
    if (ROXZONE_ALIASES.has(rawKey.trim().toLowerCase().replace(/\s+/g, "_"))) {
      return timedFromUnknown(value);
    }
  }
  return emptyTimed();
}

function countedSplits<K extends string>(map: Record<K, HyroxRaceTimedValue>): Array<HyroxRaceSplitMark & { key: K }> {
  const out: Array<HyroxRaceSplitMark & { key: K }> = [];
  for (const [key, value] of Object.entries(map) as Array<[K, HyroxRaceTimedValue]>) {
    if (value.seconds == null) continue;
    out.push({
      key,
      label: key,
      display: value.display,
      seconds: value.seconds,
    });
  }
  return out;
}

export function raceCompleteness(race: HyroxRaceRecord): HyroxRaceCompleteness {
  const runCount = countedSplits(race.runs).length;
  const stationCount = countedSplits(race.stations).length;
  if (runCount === 8 && stationCount === 8) return "full";
  if (runCount > 0 || stationCount > 0 || race.roxzone.seconds != null) return "partial";
  if (race.overall.seconds != null || race.overall.display) return "overall_only";
  return "none";
}

function raceSortStamp(race: Pick<HyroxRaceRecord, "raceDate" | "createdAt">): string {
  return `${race.raceDate ?? race.createdAt.slice(0, 10)}T${race.createdAt}`;
}

export function previousRaceFor(
  current: HyroxRaceRecord,
  history: HyroxRaceRecord[]
): HyroxRaceRecord | null {
  const older = history
    .filter((race) => race.id !== current.id)
    .filter((race) => raceSortStamp(race) < raceSortStamp(current))
    .sort((a, b) => raceSortStamp(b).localeCompare(raceSortStamp(a)));
  return older[0] ?? null;
}

function observation(kind: HyroxRaceObservation["kind"], text: string): HyroxRaceObservation {
  return { kind, text };
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

export function analyzeRace(race: HyroxRaceRecord, previous: HyroxRaceRecord | null): HyroxRaceAnalysis {
  const runs = countedSplits(race.runs).map((mark) => ({
    ...mark,
    label: HYROX_RACE_RUN_LABELS[mark.key as HyroxRaceRunKey] ?? mark.key,
  }));
  const stations = countedSplits(race.stations).map((mark) => ({
    ...mark,
    label: HYROX_RACE_STATION_LABELS[mark.key as HyroxRaceStationKey] ?? mark.key,
  }));

  const averageRunSeconds = average(runs.map((r) => r.seconds));
  const fastestRun = runs.length ? runs.reduce((best, r) => (r.seconds < best.seconds ? r : best)) : null;
  const slowestRun = runs.length ? runs.reduce((worst, r) => (r.seconds > worst.seconds ? r : worst)) : null;
  const firstRun = runs[0] ?? null;
  const lastRun = runs.length > 1 ? runs[runs.length - 1] : null;
  const runFadeSeconds =
    firstRun && lastRun ? lastRun.seconds - firstRun.seconds : null;
  const totalStationSeconds = stations.length ? stations.reduce((sum, s) => sum + s.seconds, 0) : null;
  const roxzoneSeconds = race.roxzone.seconds;

  const stationDistribution: HyroxRaceStationShare[] =
    totalStationSeconds && totalStationSeconds > 0
      ? stations.map((s) => ({
          key: s.key as HyroxRaceStationKey,
          label: s.label,
          seconds: s.seconds,
          display: s.display,
          share: s.seconds / totalStationSeconds,
        }))
      : [];

  let vsPrevious: HyroxRacePreviousComparison | null = null;
  if (previous) {
    const prevRuns = countedSplits(previous.runs);
    const prevStations = countedSplits(previous.stations);
    const stationDeltas: HyroxRacePreviousComparison["stations"] = [];
    for (const key of HYROX_RACE_STATION_KEYS) {
      const currentSeconds = race.stations[key].seconds;
      const previousSeconds = previous.stations[key].seconds;
      if (currentSeconds == null || previousSeconds == null) continue;
      stationDeltas.push({
        key,
        label: HYROX_RACE_STATION_LABELS[key],
        deltaSeconds: currentSeconds - previousSeconds,
      });
    }
    const prevAvg = average(prevRuns.map((r) => r.seconds));
    vsPrevious = {
      previousId: previous.id,
      previousEventName: previous.eventName,
      previousDate: previous.raceDate,
      overallDeltaSeconds:
        race.overall.seconds != null && previous.overall.seconds != null
          ? race.overall.seconds - previous.overall.seconds
          : null,
      averageRunDeltaSeconds:
        averageRunSeconds != null && prevAvg != null ? averageRunSeconds - prevAvg : null,
      stations: stationDeltas,
    };
  }

  const vsGoalSeconds =
    race.overall.seconds != null && race.goal.seconds != null
      ? race.overall.seconds - race.goal.seconds
      : null;

  const observations: HyroxRaceObservation[] = [];

  if (averageRunSeconds != null && fastestRun && slowestRun) {
    observations.push(
      observation(
        "run_summary",
        `Average run ${formatRaceClock(averageRunSeconds)} from ${runs.length} recorded run split${runs.length === 1 ? "" : "s"}. Fastest ${fastestRun.label} ${fastestRun.display ?? formatRaceClock(fastestRun.seconds)}; slowest ${slowestRun.label} ${slowestRun.display ?? formatRaceClock(slowestRun.seconds)}.`
      )
    );
  }
  if (runFadeSeconds != null && firstRun && lastRun) {
    observations.push(
      observation(
        "run_fade",
        `${lastRun.label} was ${formatRaceDelta(runFadeSeconds)} than ${firstRun.label.toLowerCase()}.`
      )
    );
  }
  if (totalStationSeconds != null) {
    observations.push(
      observation(
        "station_total",
        `Recorded station time ${formatRaceClock(totalStationSeconds)} from ${stations.length} station${stations.length === 1 ? "" : "s"}.`
      )
    );
  }
  for (const share of stationDistribution) {
    const pct = Math.round(share.share * 100);
    observations.push(
      observation(
        "station_share",
        `${share.label} ${pct}% of recorded station time.`
      )
    );
  }
  if (roxzoneSeconds != null) {
    observations.push(
      observation("roxzone", `Roxzone ${race.roxzone.display ?? formatRaceClock(roxzoneSeconds)}.`)
    );
  } else {
    observations.push(observation("roxzone", "Roxzone was not recorded."));
  }
  if (vsPrevious?.overallDeltaSeconds != null) {
    observations.push(
      observation(
        "overall_vs_previous",
        `Overall ${formatRaceDelta(vsPrevious.overallDeltaSeconds)} than previous race${vsPrevious.previousEventName ? ` (${vsPrevious.previousEventName})` : ""}.`
      )
    );
  }
  if (vsPrevious?.averageRunDeltaSeconds != null) {
    observations.push(
      observation(
        "run_vs_previous",
        `Average run ${formatRaceDelta(vsPrevious.averageRunDeltaSeconds)} than previous race.`
      )
    );
  }
  if (vsPrevious) {
    for (const station of vsPrevious.stations) {
      observations.push(
        observation(
          "station_vs_previous",
          `${station.label} ${formatRaceDelta(station.deltaSeconds)} than previous race.`
        )
      );
    }
  }
  if (vsGoalSeconds != null && race.goal.display) {
    const relation = vsGoalSeconds > 0 ? "outside" : vsGoalSeconds < 0 ? "inside" : "equal to";
    const amount =
      vsGoalSeconds === 0 ? "" : ` (${formatRaceClock(Math.abs(vsGoalSeconds))} ${relation})`;
    observations.push(
      observation("goal", `Goal ${race.goal.display}${amount || " — equal to goal"}.`)
    );
  }

  return {
    completeness: raceCompleteness(race),
    runCount: runs.length,
    stationCount: stations.length,
    averageRunSeconds,
    fastestRun,
    slowestRun,
    runFadeSeconds,
    totalStationSeconds,
    roxzoneSeconds,
    stationDistribution,
    vsPrevious,
    vsGoalSeconds,
    observations,
  };
}

export function analyzeRaceHistory(races: HyroxRaceRecord[]): HyroxRaceHistoryItem[] {
  const newestFirst = [...races].sort((a, b) => raceSortStamp(b).localeCompare(raceSortStamp(a)));
  return newestFirst.map((race) => ({
    race,
    analysis: analyzeRace(race, previousRaceFor(race, races)),
  }));
}

export function raceRecordFromRow(row: HyroxRaceResultDbRow): HyroxRaceRecord {
  const splitTimes = asRecord(row.split_times);
  const structuredRuns = asRecord(splitTimes.runs);
  const structuredStations = asRecord(splitTimes.stations);
  const runSource = Object.keys(structuredRuns).length ? structuredRuns : asRecord(row.run_splits);
  const stationSource = Object.keys(structuredStations).length
    ? structuredStations
    : asRecord(row.station_splits);

  const division = asString(row.division) ?? asString(row.category);
  const category = asString(row.division) ? asString(row.category) : null;

  return {
    id: row.id,
    athleteId: row.athlete_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    eventName: asString(row.race_event) || "HYROX",
    raceDate: asString(row.race_date),
    division,
    category,
    overall: timedValueFromStored({ display: row.total_time, seconds: row.total_time_seconds }),
    goal: timedValueFromStored({ display: row.goal_time ?? null, seconds: row.goal_time_seconds }),
    roxzone: readRoxzone(splitTimes, row),
    runs: readRunMap(runSource),
    stations: readStationMap(stationSource),
    notes: asString(row.notes),
    selfReport: {
      weakestStation: asString(row.weakest_station),
      weakestRun: asString(row.weakest_run),
      biggestLimiter: asString(row.biggest_limiter),
    },
  };
}

export function raceRecordFromDraft(
  athleteId: string,
  draft: HyroxRaceDraft,
  ids?: { id?: string; createdAt?: string; updatedAt?: string }
): HyroxRaceRecord {
  const createdAt = ids?.createdAt ?? new Date().toISOString();
  const runs = emptyRuns();
  for (const key of HYROX_RACE_RUN_KEYS) {
    runs[key] = timedValueFromDisplay(draft.runs?.[key]);
  }
  const stations = emptyStations();
  for (const key of HYROX_RACE_STATION_KEYS) {
    stations[key] = timedValueFromDisplay(draft.stations?.[key]);
  }
  return {
    id: ids?.id ?? "draft",
    athleteId,
    createdAt,
    updatedAt: ids?.updatedAt ?? createdAt,
    eventName: draft.eventName.trim() || "HYROX",
    raceDate: asString(draft.raceDate),
    division: asString(draft.division),
    category: asString(draft.category),
    overall: timedValueFromDisplay(draft.overallTime),
    goal: timedValueFromDisplay(draft.goalTime),
    roxzone: timedValueFromDisplay(draft.roxzone),
    runs,
    stations,
    notes: asString(draft.notes),
    selfReport: { weakestStation: null, weakestRun: null, biggestLimiter: null },
  };
}

export function displaySplitMap(
  values: Record<string, HyroxRaceTimedValue>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value.display) out[key] = value.display;
  }
  return out;
}

export function structuredSplitTimes(race: HyroxRaceRecord) {
  return {
    runs: Object.fromEntries(HYROX_RACE_RUN_KEYS.map((key) => [key, race.runs[key]])),
    stations: Object.fromEntries(HYROX_RACE_STATION_KEYS.map((key) => [key, race.stations[key]])),
    roxzone: race.roxzone,
  };
}

export function parseRaceDraft(body: unknown): { draft: HyroxRaceDraft } | { error: string } {
  if (!body || typeof body !== "object") return { error: "Enter a race." };
  const raw = body as Record<string, unknown>;
  const eventName = asString(raw.eventName) ?? asString(raw.race_event) ?? asString(raw.raceLocation);
  if (!eventName) return { error: "Enter the event name." };

  const runsRaw = asRecord(raw.runs ?? raw.runSplits);
  const stationsRaw = asRecord(raw.stations ?? raw.stationSplits);
  const runs: HyroxRaceDraft["runs"] = {};
  for (const key of HYROX_RACE_RUN_KEYS) {
    const value = asString(runsRaw[key]);
    if (value) runs[key] = value;
  }
  const stations: HyroxRaceDraft["stations"] = {};
  for (const key of HYROX_RACE_STATION_KEYS) {
    const value = asString(stationsRaw[key]);
    if (value) stations[key] = value;
  }

  return {
    draft: {
      eventName,
      raceDate: asString(raw.raceDate) ?? asString(raw.race_date),
      division: asString(raw.division) ?? asString(raw.category),
      category: asString(raw.category) && asString(raw.division) ? asString(raw.category) : null,
      overallTime: asString(raw.overallTime) ?? asString(raw.total_time) ?? asString(raw.totalFinishTime),
      goalTime: asString(raw.goalTime) ?? asString(raw.goal_time),
      notes: asString(raw.notes),
      runs,
      stations,
      roxzone: asString(raw.roxzone) ?? asString(raw.roxzone_display),
    },
  };
}

export function progressCopy(analysis: HyroxRaceAnalysis): string | null {
  if (analysis.vsPrevious?.overallDeltaSeconds != null) {
    return `${formatRaceDelta(analysis.vsPrevious.overallDeltaSeconds)} than previous race`;
  }
  if (analysis.vsGoalSeconds != null) {
    if (analysis.vsGoalSeconds === 0) return "Equal to goal";
    return `${formatRaceClock(Math.abs(analysis.vsGoalSeconds))} ${analysis.vsGoalSeconds > 0 ? "outside" : "inside"} goal`;
  }
  return null;
}
