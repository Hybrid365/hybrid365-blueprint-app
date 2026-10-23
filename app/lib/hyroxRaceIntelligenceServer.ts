import type { SupabaseClient } from "@supabase/supabase-js";
import {
  analyzeRaceHistory,
  displaySplitMap,
  parseRaceDraft,
  raceRecordFromDraft,
  raceRecordFromRow,
  structuredSplitTimes,
  type HyroxRaceDraft,
  type HyroxRaceHistoryItem,
  type HyroxRaceRecord,
  type HyroxRaceResultDbRow,
} from "@/app/lib/hyroxRaceIntelligence";

export { parseRaceDraft };

const LEGACY_SELECT =
  "id, athlete_id, created_at, updated_at, race_event, race_date, category, total_time, bodyweight, run_splits, station_splits, weakest_station, weakest_run, biggest_limiter, notes, roxfit_screenshot_url";

const FULL_SELECT = `${LEGACY_SELECT}, division, goal_time, goal_time_seconds, total_time_seconds, roxzone_display, roxzone_seconds, split_times`;

type SchemaMode = "full" | "legacy";

let schemaMode: SchemaMode | null = null;

function isMissingColumnError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return error.code === "42703" || message.includes("does not exist") || message.includes("schema cache");
}

async function detectSchema(client: SupabaseClient): Promise<SchemaMode> {
  if (schemaMode) return schemaMode;
  const probe = await client.from("hyrox_race_results").select("split_times").limit(1);
  if (probe.error && isMissingColumnError(probe.error)) {
    schemaMode = "legacy";
    return schemaMode;
  }
  schemaMode = "full";
  return schemaMode;
}

function insertRow(athleteId: string, race: HyroxRaceRecord, mode: SchemaMode) {
  const legacy = {
    athlete_id: athleteId,
    race_event: race.eventName,
    race_date: race.raceDate,
    category: race.division ?? race.category,
    total_time: race.overall.display,
    notes: race.notes,
    run_splits: displaySplitMap(race.runs),
    station_splits: {
      ...displaySplitMap(race.stations),
      ...(race.roxzone.display ? { roxzone: race.roxzone.display } : {}),
    },
  };
  if (mode === "legacy") return legacy;
  return {
    ...legacy,
    division: race.division,
    category: race.category,
    goal_time: race.goal.display,
    goal_time_seconds: race.goal.seconds,
    total_time_seconds: race.overall.seconds,
    roxzone_display: race.roxzone.display,
    roxzone_seconds: race.roxzone.seconds,
    split_times: structuredSplitTimes(race),
  };
}

export async function listHyroxRaceHistory(
  client: SupabaseClient,
  athleteId: string
): Promise<{ items: HyroxRaceHistoryItem[]; error: string | null; schema: SchemaMode }> {
  const mode = await detectSchema(client);
  const { data, error } = await client
    .from("hyrox_race_results")
    .select((mode === "full" ? FULL_SELECT : LEGACY_SELECT) as string)
    .eq("athlete_id", athleteId)
    .order("race_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    if (mode === "full" && isMissingColumnError(error)) {
      schemaMode = "legacy";
      return listHyroxRaceHistory(client, athleteId);
    }
    return { items: [], error: error.message, schema: mode };
  }

  const records: HyroxRaceRecord[] = ((data ?? []) as unknown as HyroxRaceResultDbRow[]).map(raceRecordFromRow);
  return { items: analyzeRaceHistory(records), error: null, schema: mode };
}

export async function insertHyroxRaceRecord(
  client: SupabaseClient,
  athleteId: string,
  draft: HyroxRaceDraft
): Promise<{ item: HyroxRaceHistoryItem | null; error: string | null }> {
  const mode = await detectSchema(client);
  const mapped = raceRecordFromDraft(athleteId, draft);
  const row = insertRow(athleteId, mapped, mode);
  const { data, error } = await client
    .from("hyrox_race_results")
    .insert(row)
    .select((mode === "full" ? FULL_SELECT : LEGACY_SELECT) as string)
    .single();

  if (error) {
    if (mode === "full" && isMissingColumnError(error)) {
      schemaMode = "legacy";
      return insertHyroxRaceRecord(client, athleteId, draft);
    }
    return { item: null, error: error.message };
  }

  const record = raceRecordFromRow(data as unknown as HyroxRaceResultDbRow);
  const { items } = await listHyroxRaceHistory(client, athleteId);
  const item = items.find((entry) => entry.race.id === record.id) ?? {
    race: record,
    analysis: analyzeRaceHistory([record])[0]!.analysis,
  };
  return { item, error: null };
}
