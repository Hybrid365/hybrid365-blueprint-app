/**
 * Live staging check: ensure draft weeks across block boundary without current_week mutation.
 * Run only with HYROX_ENV=staging against hybrid365-staging.
 */
import { createClient } from "@supabase/supabase-js";
import { fetchAthleteProgressFlags } from "../app/lib/hyroxAthleteServer";
import { buildCoachAthleteStubFromLiveRow } from "../app/lib/hyroxLiveCoachAthlete";
import { ensureProgrammeDraftWeeksExist } from "../app/lib/hyroxSessionFamilyEnsureDraft";
import type { HyroxAthleteRow } from "../app/lib/hyroxDatabaseTypes";

async function main() {
  if (process.env.HYROX_ENV !== "staging") {
    throw new Error("Refusing: HYROX_ENV must be staging");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url.includes("uluapwqohujavhlpucta")) {
    throw new Error("Refusing: not hybrid365-staging URL");
  }

  const sb = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const id = "77b9be0c-81c0-4209-902d-2330e33ae4f0";
  const { data: ath, error } = await sb.from("hyrox_athletes").select("*").eq("id", id).single();
  if (error || !ath) throw new Error(error?.message ?? "athlete missing");
  const before = { current_week: ath.current_week, current_block: ath.current_block };
  const flags = await fetchAthleteProgressFlags(sb, id);
  const stub = buildCoachAthleteStubFromLiveRow(ath as HyroxAthleteRow, flags);
  const ensured = await ensureProgrammeDraftWeeksExist(sb, {
    athleteId: id,
    athlete: stub,
    globalWeeks: [4, 5, 6, 7],
  });
  const { data: ath2 } = await sb
    .from("hyrox_athletes")
    .select("current_week, current_block")
    .eq("id", id)
    .single();

  const weeks = ensured.map((w) => ({
    globalWeek: w.globalWeek,
    created: w.created,
    block: w.draftData.block,
    week: w.draftData.week,
  }));

  if (ath2?.current_week !== before.current_week || ath2?.current_block !== before.current_block) {
    throw new Error(`current_week mutated: ${JSON.stringify({ before, after: ath2 })}`);
  }
  if (weeks.map((w) => w.block).join(",") !== "1,2,2,2") {
    throw new Error(`unexpected blocks ${weeks.map((w) => w.block)}`);
  }
  if (weeks.map((w) => w.week).join(",") !== "4,5,6,7") {
    throw new Error(`unexpected weeks ${weeks.map((w) => w.week)}`);
  }

  console.log("✓ block-boundary ensure W4→W7; current_week unchanged");
  console.log(JSON.stringify({ before, after: ath2, weeks }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
