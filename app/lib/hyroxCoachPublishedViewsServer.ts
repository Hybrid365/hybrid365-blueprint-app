import type { HyroxAthleteRow, HyroxProgrammeWeekRow } from "@/app/lib/hyroxDatabaseTypes";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listHyroxAthletes } from "@/app/lib/hyroxAthleteCoachDb";

export type PublishedViewAthleteSummary = {
  id: string;
  name: string;
  email: string;
  athleteStatus: string;
  programmeStatus: string;
  currentBlock: number;
  blockTitle: string | null;
  publishedWeekNumbers: number[];
  publishedWeekLabel: string;
  hasPublishedBlock: boolean;
  lastPublishedAt: string | null;
};

function formatWeekRange(weeks: number[]): string {
  if (!weeks.length) return "No published block";
  const sorted = [...weeks].sort((a, b) => a - b);
  if (sorted.length === 1) return `Week ${sorted[0]}`;
  const consecutive =
    sorted.every((w, i) => i === 0 || w === sorted[i - 1]! + 1) &&
    sorted.length === sorted[sorted.length - 1]! - sorted[0]! + 1;
  if (consecutive) return `Weeks ${sorted[0]}–${sorted[sorted.length - 1]}`;
  return `Weeks ${sorted.join(", ")}`;
}

function blockTitleForWeeks(
  athlete: HyroxAthleteRow,
  weeks: HyroxProgrammeWeekRow[]
): string | null {
  if (!weeks.length) return null;
  const block = weeks[0]?.block_number ?? athlete.current_block ?? 1;
  const focus = weeks.find((w) => w.weekly_focus?.trim())?.weekly_focus?.trim();
  if (focus) return `Block ${block} · ${focus}`;
  return `Block ${block}`;
}

export async function listPublishedViewSummaries(
  supabase: SupabaseClient
): Promise<{ rows: PublishedViewAthleteSummary[]; error: string | null }> {
  const { athletes, error: listError } = await listHyroxAthletes(supabase);
  if (listError) return { rows: [], error: listError };

  const athleteIds = athletes.map((a) => a.id);
  if (!athleteIds.length) return { rows: [], error: null };

  const { data: weekRows, error: weeksError } = await supabase
    .from("hyrox_programme_weeks")
    .select(
      "id, athlete_id, block_number, week_number, weekly_focus, status, published_at, updated_at"
    )
    .eq("status", "published")
    .in("athlete_id", athleteIds)
    .order("week_number", { ascending: true });

  if (weeksError) return { rows: [], error: weeksError.message };

  const weeksByAthlete = new Map<string, HyroxProgrammeWeekRow[]>();
  for (const row of (weekRows ?? []) as HyroxProgrammeWeekRow[]) {
    const list = weeksByAthlete.get(row.athlete_id) ?? [];
    list.push(row);
    weeksByAthlete.set(row.athlete_id, list);
  }

  const rows: PublishedViewAthleteSummary[] = athletes.map((athlete) => {
    const published = weeksByAthlete.get(athlete.id) ?? [];
    const weekNumbers = published.map((w) => w.week_number);
    const lastPublishedAt =
      published
        .map((w) => w.published_at ?? w.updated_at)
        .filter(Boolean)
        .sort()
        .pop() ?? null;

    return {
      id: athlete.id,
      name: athlete.name,
      email: athlete.email,
      athleteStatus: athlete.status,
      programmeStatus: athlete.programme_status,
      currentBlock: athlete.current_block ?? 1,
      blockTitle: blockTitleForWeeks(athlete, published),
      publishedWeekNumbers: weekNumbers,
      publishedWeekLabel: formatWeekRange(weekNumbers),
      hasPublishedBlock: weekNumbers.length > 0,
      lastPublishedAt,
    };
  });

  rows.sort((a, b) => {
    if (a.hasPublishedBlock !== b.hasPublishedBlock) return a.hasPublishedBlock ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return { rows, error: null };
}
