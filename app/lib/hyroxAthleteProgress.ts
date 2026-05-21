import type { SupabaseClient } from "@supabase/supabase-js";
import { getNextHyroxAthleteStatus } from "@/app/lib/hyroxAthleteStatus";
import { fetchAthleteProgressFlags, recordHyroxStatusHistory } from "@/app/lib/hyroxAthleteServer";
import type { HyroxAthleteRow, HyroxAthleteStatus } from "@/app/lib/hyroxDatabaseTypes";

export async function syncHyroxAthleteStatus(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  options?: { changedBy?: string | null; reason?: string }
): Promise<HyroxAthleteStatus> {
  const flags = await fetchAthleteProgressFlags(supabase, athlete.id);
  const next = getNextHyroxAthleteStatus({
    payment_status: athlete.payment_status,
    user_id: athlete.user_id,
    status: athlete.status,
    hasAssessment: flags.hasAssessment,
    hasTesting: flags.hasTesting,
  });

  if (next === athlete.status) return next;

  const { error } = await supabase
    .from("hyrox_athletes")
    .update({ status: next })
    .eq("id", athlete.id);

  if (error) {
    console.warn("[hyrox] status sync failed", error.message);
    return athlete.status;
  }

  await recordHyroxStatusHistory(supabase, {
    athleteId: athlete.id,
    statusFrom: athlete.status,
    statusTo: next,
    changedBy: options?.changedBy ?? athlete.user_id,
    reason: options?.reason ?? "auto_status_sync",
  });

  return next;
}
