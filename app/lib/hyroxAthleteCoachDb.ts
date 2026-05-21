import { HYROX_ATHLETE_SELECT } from "@/app/lib/hyroxCurrentAthlete";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function listHyroxAthletes(
  supabase: SupabaseClient
): Promise<{ athletes: HyroxAthleteRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("hyrox_athletes")
    .select(HYROX_ATHLETE_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    return { athletes: [], error: error.message };
  }

  return {
    athletes: (data ?? []) as unknown as HyroxAthleteRow[],
    error: null,
  };
}

export async function fetchHyroxAthleteById(
  supabase: SupabaseClient,
  athleteId: string
): Promise<{ athlete: HyroxAthleteRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("hyrox_athletes")
    .select(HYROX_ATHLETE_SELECT)
    .eq("id", athleteId)
    .maybeSingle();

  if (error) {
    return { athlete: null, error: error.message };
  }
  return { athlete: (data as unknown as HyroxAthleteRow) ?? null, error: null };
}

export async function fetchHyroxAthleteByApplicationId(
  supabase: SupabaseClient,
  applicationId: string
): Promise<{ athlete: HyroxAthleteRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("hyrox_athletes")
    .select(HYROX_ATHLETE_SELECT)
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error) {
    return { athlete: null, error: error.message };
  }
  return { athlete: (data as unknown as HyroxAthleteRow) ?? null, error: null };
}

export async function fetchHyroxAthletesByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<{ athletes: HyroxAthleteRow[]; error: string | null }> {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("hyrox_athletes")
    .select(HYROX_ATHLETE_SELECT)
    .ilike("email", normalized)
    .order("created_at", { ascending: false });

  if (error) {
    return { athletes: [], error: error.message };
  }
  return { athletes: (data ?? []) as HyroxAthleteRow[], error: null };
}

export async function fetchHyroxAthleteByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<{ athlete: HyroxAthleteRow | null; error: string | null }> {
  const { athletes, error } = await fetchHyroxAthletesByEmail(supabase, email);
  if (error) return { athlete: null, error };
  if (athletes.length > 1 && process.env.NODE_ENV === "development") {
    console.warn("[hyrox] multiple hyrox_athletes rows for email", {
      email: email.trim().toLowerCase(),
      ids: athletes.map((a) => ({
        id: a.id,
        name: a.name,
        user_id: a.user_id,
        payment_status: a.payment_status,
      })),
    });
  }
  const paid = athletes.filter((a) => a.payment_status === "paid");
  const athlete = paid[0] ?? athletes[0] ?? null;
  return { athlete, error: null };
}

export function buildAthleteInsertFromApplication(
  applicationId: string,
  app: {
    name: string;
    email: string;
    target_event: string | null;
    target_date: string | null;
  }
) {
  return {
    application_id: applicationId,
    name: app.name.trim(),
    email: app.email.trim(),
    status: "accepted" as const,
    payment_status: "pending" as const,
    programme_status: "not_started",
    race_name: app.target_event?.trim() || null,
    race_date: app.target_date,
  };
}
