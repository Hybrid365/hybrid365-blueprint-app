import type { Hybrid11ApplicationRow } from "@/app/lib/hybrid11DatabaseTypes";
import type { SupabaseClient } from "@supabase/supabase-js";

export const HYBRID11_APPLICATION_SELECT =
  "id, created_at, updated_at, full_name, email, phone, instagram, age, location, occupation, application_type, track, status, main_goal, body_composition_goal, performance_goal, target_outcome, reason_for_applying, training_background, benchmarks, availability, nutrition_lifestyle, injuries_limitations, coaching_fit, consent, raw_payload, coach_notes";

export async function listHybrid11Applications(
  supabase: SupabaseClient
): Promise<{ applications: Hybrid11ApplicationRow[]; error: string | null }> {
  const result = await supabase
    .from("hybrid_1_1_applications")
    .select(HYBRID11_APPLICATION_SELECT)
    .order("created_at", { ascending: false });

  if (result.error) {
    return { applications: [], error: result.error.message };
  }

  return {
    applications: (result.data ?? []) as unknown as Hybrid11ApplicationRow[],
    error: null,
  };
}

export async function fetchHybrid11ApplicationById(
  supabase: SupabaseClient,
  id: string
): Promise<{ application: Hybrid11ApplicationRow | null; error: string | null }> {
  const result = await supabase
    .from("hybrid_1_1_applications")
    .select(HYBRID11_APPLICATION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (result.error) {
    return { application: null, error: result.error.message };
  }
  if (!result.data) {
    return { application: null, error: null };
  }

  return {
    application: result.data as unknown as Hybrid11ApplicationRow,
    error: null,
  };
}

export async function updateHybrid11Application(
  supabase: SupabaseClient,
  id: string,
  updates: Record<string, unknown>
): Promise<{ application: Hybrid11ApplicationRow | null; error: string | null }> {
  const result = await supabase
    .from("hybrid_1_1_applications")
    .update(updates)
    .eq("id", id)
    .select(HYBRID11_APPLICATION_SELECT)
    .single();

  if (result.error) {
    return { application: null, error: result.error.message };
  }

  return {
    application: result.data as unknown as Hybrid11ApplicationRow,
    error: null,
  };
}
