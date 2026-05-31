import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { buildHyroxAssessmentInputFromRow } from "@/app/lib/hyroxAssessmentPayload";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { draftDbToCoachStatus } from "@/app/lib/hyroxCoachProgrammeStatusMap";
import {
  fetchLatestMappedProfile,
  fetchLatestProgrammeDraft,
  parseCoachDraftWeek,
} from "@/app/lib/hyroxProgrammeServer";
import type { HyroxAssessmentRow, HyroxAthleteRow, HyroxApplicationRow } from "@/app/lib/hyroxDatabaseTypes";
import type { HyroxAssessmentInput } from "@/app/lib/hyroxAthleteProfileTypes";

const ASSESSMENT_SELECT =
  "id, athlete_id, created_at, updated_at, submitted_at, raw_answers, training_days, weekly_training_hours, current_weekly_run_volume_km, five_k_time, ten_k_time, max_heart_rate, threshold_heart_rate, station_weaknesses, equipment_access, injury_flags, sleep_quality, stress_level, bodyweight, body_composition_goal, documentation_consent, status";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const { client: supabase, mode } = await createCoachServerClient();

  const { athlete, error: fetchError } = await fetchHyroxAthleteById(supabase, id);

  if (fetchError) {
    console.error("Hyrox athlete detail fetch failed", {
      athleteId: id,
      message: fetchError,
      coachSupabaseMode: mode,
    });
    return NextResponse.json(
      {
        success: false,
        error: fetchError,
        ...(process.env.NODE_ENV === "development" ? { detail: fetchError } : {}),
      },
      { status: 500 }
    );
  }

  if (!athlete) {
    console.error("Hyrox athlete detail not found", { athleteId: id, coachSupabaseMode: mode });
    return NextResponse.json(
      {
        success: false,
        error: "Athlete not found.",
        ...(process.env.NODE_ENV === "development"
          ? { detail: `No hyrox_athletes row for id ${id}` }
          : {}),
      },
      { status: 404 }
    );
  }

  const row = athlete as HyroxAthleteRow;
  const flags = await fetchAthleteProgressFlags(supabase, id);

  const [{ data: assessment }, { count: raceCount }] = await Promise.all([
    supabase
      .from("hyrox_assessments")
      .select(ASSESSMENT_SELECT)
      .eq("athlete_id", id)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("hyrox_race_results")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", id),
  ]);

  let assessmentInput: HyroxAssessmentInput | null = null;
  if (assessment) {
    assessmentInput = buildHyroxAssessmentInputFromRow(row, assessment as HyroxAssessmentRow);
  }

  const [mappedProfile, programmeDraft, applicationResult] = await Promise.all([
    fetchLatestMappedProfile(supabase, id),
    fetchLatestProgrammeDraft(supabase, id),
    row.application_id
      ? supabase.from("hyrox_applications").select("*").eq("id", row.application_id).maybeSingle()
      : supabase
          .from("hyrox_applications")
          .select("*")
          .eq("email", row.email)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
  ]);

  const application = (applicationResult.data as HyroxApplicationRow | null) ?? null;

  if (process.env.NODE_ENV === "development") {
    console.log("Hyrox athlete detail loaded", {
      athleteId: row.id,
      status: row.status,
      hasAssessment: flags.hasAssessment,
      hasTesting: flags.hasTesting,
      coachSupabaseMode: mode,
    });
  }

  return NextResponse.json({
    success: true,
    athlete: row,
    hasAssessment: flags.hasAssessment,
    hasTesting: flags.hasTesting,
    hasRaceResult: (raceCount ?? 0) > 0,
    assessment: assessment as HyroxAssessmentRow | null,
    application,
    assessmentInput,
    mappedProfile,
    mappedProfileSaved: Boolean(mappedProfile),
    programmeDraft,
    programmeDraftCoachStatus: programmeDraft
      ? draftDbToCoachStatus(programmeDraft.status)
      : null,
    programmeDraftData: programmeDraft
      ? parseCoachDraftWeek(programmeDraft.draft_data)
      : null,
  });
}
