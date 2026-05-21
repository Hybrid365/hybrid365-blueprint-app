import type { SupabaseClient } from "@supabase/supabase-js";
import { getNextHyroxAthleteStatus } from "@/app/lib/hyroxAthleteStatus";
import type { HyroxAthleteRow, HyroxPaymentLinkType } from "@/app/lib/hyroxDatabaseTypes";

export async function fetchAthleteProgressFlags(
  supabase: SupabaseClient,
  athleteId: string
): Promise<{ hasAssessment: boolean; hasTesting: boolean }> {
  const [{ count: assessmentCount }, { count: testingCount }] = await Promise.all([
    supabase
      .from("hyrox_assessments")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", athleteId)
      .not("submitted_at", "is", null),
    supabase
      .from("hyrox_testing_results")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", athleteId)
      .eq("status", "submitted"),
  ]);

  return {
    hasAssessment: (assessmentCount ?? 0) > 0,
    hasTesting: (testingCount ?? 0) > 0,
  };
}

export async function recordHyroxStatusHistory(
  supabase: SupabaseClient,
  params: {
    athleteId: string;
    statusFrom: string | null;
    statusTo: string;
    changedBy: string | null;
    reason?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.from("hyrox_programme_status_history").insert({
    athlete_id: params.athleteId,
    status_from: params.statusFrom,
    status_to: params.statusTo,
    changed_by: params.changedBy,
    reason: params.reason ?? null,
    metadata: params.metadata ?? null,
  });

  if (error) {
    console.warn("[hyrox] status history insert failed", error.message);
  }
}

export async function resolveAthleteStatusAfterLink(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow
): Promise<HyroxAthleteRow["status"]> {
  const flags = await fetchAthleteProgressFlags(supabase, athlete.id);
  return getNextHyroxAthleteStatus({
    payment_status: athlete.payment_status,
    user_id: athlete.user_id,
    status: athlete.status,
    hasAssessment: flags.hasAssessment,
    hasTesting: flags.hasTesting,
  });
}

const PAYMENT_LINK_TYPES: HyroxPaymentLinkType[] = ["monthly", "twelve_week", "sixteen_week"];

export function parsePaymentLinkType(value: unknown): HyroxPaymentLinkType | null {
  if (typeof value !== "string") return null;
  return PAYMENT_LINK_TYPES.includes(value as HyroxPaymentLinkType)
    ? (value as HyroxPaymentLinkType)
    : null;
}
