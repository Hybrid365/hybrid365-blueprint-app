/**
 * One-shot staging cleanup: archive superseded published W1 siblings.
 * HYROX_ENV=staging npx tsx scripts/qa-hyrox-archive-duplicate-w1-staging.ts
 */
import { createClient } from "@supabase/supabase-js";
import { archiveSupersededPublishedWeeks } from "../app/lib/hyroxProgrammeServer";
import { selectCanonicalPublishedWeek } from "../app/lib/hyroxProgrammeWeekIdentity";
import type { HyroxProgrammeWeekRow } from "../app/lib/hyroxDatabaseTypes";

const ATHLETE_ID = "77b9be0c-81c0-4209-902d-2330e33ae4f0";

async function main() {
  if (process.env.HYROX_ENV !== "staging") throw new Error("HYROX_ENV=staging required");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url.includes("uluapwqohujavhlpucta")) throw new Error("staging URL required");

  const sb = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await sb
    .from("hyrox_programme_weeks")
    .select(
      "id, athlete_id, source_draft_id, created_at, updated_at, block_number, week_number, week_start_date, week_end_date, weekly_focus, coach_note, athlete_facing_note, weekly_summary, status, published_at"
    )
    .eq("athlete_id", ATHLETE_ID)
    .eq("week_number", 1)
    .eq("status", "published");
  if (error) throw new Error(error.message);
  const rows = (data as HyroxProgrammeWeekRow[]) ?? [];
  const keep = selectCanonicalPublishedWeek(rows);
  if (!keep) throw new Error("no published W1");
  const archived = await archiveSupersededPublishedWeeks(sb, {
    athleteId: ATHLETE_ID,
    weekNumber: 1,
    keepId: keep.id,
  });
  const { data: after } = await sb
    .from("hyrox_programme_weeks")
    .select("id, status, published_at")
    .eq("athlete_id", ATHLETE_ID)
    .eq("week_number", 1);
  console.log(JSON.stringify({ keepId: keep.id, archived, after }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
