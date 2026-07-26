/**
 * Server helpers for HYROX Team daily readiness.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import {
  computeDailyReadinessScore,
  type DailyReadinessInputs,
  type ReadinessCategory,
} from "@/app/lib/hyrox-team/modules/today/readinessScore";
import { localDateYmd } from "@/app/lib/hyrox-team/modules/today/resolveTodaySessions";

export type HyroxDailyReadinessRow = {
  id: string;
  athlete_id: string;
  local_date: string;
  timezone: string;
  sleep_quality: number | null;
  energy: number | null;
  motivation: number | null;
  stress: number | null;
  muscle_soreness: number | null;
  feeling_unwell: boolean;
  bodyweight: number | null;
  resting_hr: number | null;
  score: number | null;
  category: ReadinessCategory | null;
  explanation: string | null;
  coaching_prompt: string | null;
  inputs_json: Record<string, unknown>;
  coach_note_reviewed_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyReadinessSubmitInput = DailyReadinessInputs & {
  localDate?: string;
  timezone?: string;
};

export class HyroxDailyReadinessError extends Error {
  constructor(
    message: string,
    public readonly code: "VALIDATION" | "FORBIDDEN" | "NOT_FOUND"
  ) {
    super(message);
    this.name = "HyroxDailyReadinessError";
  }
}

const SELECT =
  "id, athlete_id, local_date, timezone, sleep_quality, energy, motivation, stress, muscle_soreness, feeling_unwell, bodyweight, resting_hr, score, category, explanation, coaching_prompt, inputs_json, coach_note_reviewed_at, submitted_at, created_at, updated_at";

function resolveTimezone(raw?: string | null): string {
  const tz = raw?.trim();
  if (!tz) return "UTC";
  try {
    // Validate IANA-ish timezone via Intl
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

/** Local calendar YMD for an instant in a timezone. */
export function localDateYmdInTimeZone(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    /* fall through */
  }
  return localDateYmd(date);
}

export async function fetchDailyReadinessForDate(
  supabase: SupabaseClient,
  athleteId: string,
  localDate: string
): Promise<HyroxDailyReadinessRow | null> {
  const { data, error } = await supabase
    .from("hyrox_daily_readiness")
    .select(SELECT)
    .eq("athlete_id", athleteId)
    .eq("local_date", localDate)
    .maybeSingle();
  if (error) throw new HyroxDailyReadinessError(error.message, "VALIDATION");
  return (data as HyroxDailyReadinessRow | null) ?? null;
}

export async function upsertDailyReadiness(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  input: DailyReadinessSubmitInput
): Promise<HyroxDailyReadinessRow> {
  const timezone = resolveTimezone(input.timezone);
  const localDate =
    input.localDate?.trim() || localDateYmdInTimeZone(new Date(), timezone);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
    throw new HyroxDailyReadinessError("Invalid localDate.", "VALIDATION");
  }

  const scored = computeDailyReadinessScore(input);
  const payload = {
    athlete_id: athlete.id,
    local_date: localDate,
    timezone,
    sleep_quality: input.sleepQuality ?? null,
    energy: input.energy ?? null,
    motivation: input.motivation ?? null,
    stress: input.stress ?? null,
    muscle_soreness: input.muscleSoreness ?? null,
    feeling_unwell: Boolean(input.feelingUnwell),
    bodyweight: input.bodyweight ?? null,
    resting_hr: input.restingHr ?? null,
    score: scored.score,
    category: scored.category,
    explanation: scored.explanation,
    coaching_prompt: scored.coachingPrompt,
    inputs_json: {
      ...input,
      scoreResult: {
        score: scored.score,
        category: scored.category,
        contributors: scored.contributors,
        overridesApplied: scored.overridesApplied,
      },
    },
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("hyrox_daily_readiness")
    .upsert(payload, { onConflict: "athlete_id,local_date" })
    .select(SELECT)
    .single();

  if (error) throw new HyroxDailyReadinessError(error.message, "VALIDATION");
  if (!data) throw new HyroxDailyReadinessError("Could not save readiness.", "VALIDATION");
  return data as HyroxDailyReadinessRow;
}

export async function acknowledgeCoachNoteToday(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  opts?: { localDate?: string; timezone?: string }
): Promise<HyroxDailyReadinessRow> {
  const timezone = resolveTimezone(opts?.timezone);
  const localDate =
    opts?.localDate?.trim() || localDateYmdInTimeZone(new Date(), timezone);

  const existing = await fetchDailyReadinessForDate(supabase, athlete.id, localDate);
  const now = new Date().toISOString();

  if (existing) {
    const { data, error } = await supabase
      .from("hyrox_daily_readiness")
      .update({ coach_note_reviewed_at: now, updated_at: now })
      .eq("id", existing.id)
      .eq("athlete_id", athlete.id)
      .select(SELECT)
      .single();
    if (error) throw new HyroxDailyReadinessError(error.message, "VALIDATION");
    return data as HyroxDailyReadinessRow;
  }

  const { data, error } = await supabase
    .from("hyrox_daily_readiness")
    .insert({
      athlete_id: athlete.id,
      local_date: localDate,
      timezone,
      feeling_unwell: false,
      coach_note_reviewed_at: now,
      inputs_json: { coachNoteOnly: true },
    })
    .select(SELECT)
    .single();
  if (error) throw new HyroxDailyReadinessError(error.message, "VALIDATION");
  return data as HyroxDailyReadinessRow;
}

export function mapReadinessToUi(row: HyroxDailyReadinessRow | null) {
  if (!row || !row.submitted_at) {
    return {
      submitted: false,
      row: null as HyroxDailyReadinessRow | null,
    };
  }
  return { submitted: true, row };
}
