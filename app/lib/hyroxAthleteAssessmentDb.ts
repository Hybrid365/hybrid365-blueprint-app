import {
  buildAssessmentInsertRow,
  HYROX_ASSESSMENT_SELECT,
  type AssessmentFormValues,
} from "@/app/lib/hyroxAssessmentPayload";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxAssessmentRow } from "@/app/lib/hyroxDatabaseTypes";

/**
 * Persist assessment via coach/service client after API auth verified athlete ownership.
 * Avoids session RLS failures on insert().select().single().
 */
export async function saveHyroxAssessmentSubmission(
  athleteId: string,
  values: AssessmentFormValues
): Promise<{ assessment: HyroxAssessmentRow | null; error: string | null; code?: string }> {
  const { client, mode } = await createCoachServerClient();
  const insertRow = {
    athlete_id: athleteId,
    ...buildAssessmentInsertRow(values),
  };

  const { error: insertError } = await client.from("hyrox_assessments").insert(insertRow);

  if (insertError) {
    console.error("Hyrox assessment save failed", {
      message: insertError.message,
      code: insertError.code,
      details: insertError.details,
      hint: insertError.hint,
      athleteId,
      coachSupabaseMode: mode,
    });
    return {
      assessment: null,
      error: insertError.message,
      code: insertError.code ?? undefined,
    };
  }

  const { data, error: fetchError } = await client
    .from("hyrox_assessments")
    .select(HYROX_ASSESSMENT_SELECT)
    .eq("athlete_id", athleteId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("Hyrox assessment reload failed", fetchError);
    return { assessment: null, error: fetchError.message, code: fetchError.code ?? undefined };
  }

  return {
    assessment: (data as HyroxAssessmentRow | null) ?? null,
    error: null,
  };
}

export async function fetchLatestHyroxAssessment(
  athleteId: string
): Promise<{ assessment: HyroxAssessmentRow | null; error: string | null }> {
  const { client } = await createCoachServerClient();

  const { data, error } = await client
    .from("hyrox_assessments")
    .select(HYROX_ASSESSMENT_SELECT)
    .eq("athlete_id", athleteId)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { assessment: null, error: error.message };
  }

  return { assessment: (data as HyroxAssessmentRow | null) ?? null, error: null };
}
