import { isMissingRawPayloadColumnError } from "@/app/lib/hyroxApplicationSubmit";
import type { HyroxApplicationRow } from "@/app/lib/hyroxDatabaseTypes";
import type { SupabaseClient } from "@supabase/supabase-js";

export const HYROX_APPLICATION_SELECT_BASE =
  "id, created_at, updated_at, name, email, instagram_handle, phone, hyrox_experience, current_level, target_event, target_date, goal, reason_for_applying, documentation_interest, status, coach_notes";

export const HYROX_APPLICATION_SELECT_WITH_RAW = `${HYROX_APPLICATION_SELECT_BASE}, raw_payload`;

export async function fetchHyroxApplicationById(
  supabase: SupabaseClient,
  id: string
): Promise<{ application: HyroxApplicationRow | null; error: string | null }> {
  let select = HYROX_APPLICATION_SELECT_WITH_RAW;
  let result = await supabase
    .from("hyrox_applications")
    .select(select)
    .eq("id", id)
    .maybeSingle();

  if (result.error && isMissingRawPayloadColumnError(result.error.message)) {
    select = HYROX_APPLICATION_SELECT_BASE;
    result = await supabase
      .from("hyrox_applications")
      .select(select)
      .eq("id", id)
      .maybeSingle();
  }

  if (result.error) {
    return { application: null, error: result.error.message };
  }
  if (!result.data) {
    return { application: null, error: null };
  }

  return {
    application: result.data as unknown as HyroxApplicationRow,
    error: null,
  };
}

export async function listHyroxApplications(
  supabase: SupabaseClient
): Promise<{ applications: HyroxApplicationRow[]; error: string | null }> {
  let select = HYROX_APPLICATION_SELECT_WITH_RAW;
  let result = await supabase
    .from("hyrox_applications")
    .select(select)
    .order("created_at", { ascending: false });

  if (result.error && isMissingRawPayloadColumnError(result.error.message)) {
    select = HYROX_APPLICATION_SELECT_BASE;
    result = await supabase
      .from("hyrox_applications")
      .select(select)
      .order("created_at", { ascending: false });
  }

  if (result.error) {
    return { applications: [], error: result.error.message };
  }

  return {
    applications: (result.data ?? []) as unknown as HyroxApplicationRow[],
    error: null,
  };
}

export async function updateHyroxApplication(
  supabase: SupabaseClient,
  id: string,
  updates: Record<string, unknown>
): Promise<{ application: HyroxApplicationRow | null; error: string | null }> {
  let select = HYROX_APPLICATION_SELECT_WITH_RAW;
  let result = await supabase
    .from("hyrox_applications")
    .update(updates)
    .eq("id", id)
    .select(select)
    .single();

  if (result.error && isMissingRawPayloadColumnError(result.error.message)) {
    select = HYROX_APPLICATION_SELECT_BASE;
    result = await supabase
      .from("hyrox_applications")
      .update(updates)
      .eq("id", id)
      .select(select)
      .single();
  }

  if (result.error) {
    return { application: null, error: result.error.message };
  }

  return {
    application: result.data as unknown as HyroxApplicationRow,
    error: null,
  };
}
