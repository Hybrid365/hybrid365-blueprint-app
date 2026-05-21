import { NextResponse } from "next/server";
import { requireCurrentHyroxAthleteForApi } from "@/app/lib/hyroxAthleteApiAuth";
import {
  fetchLatestHyroxAssessment,
  saveHyroxAssessmentSubmission,
} from "@/app/lib/hyroxAthleteAssessmentDb";
import { syncHyroxAthleteStatus } from "@/app/lib/hyroxAthleteProgress";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { AssessmentFormValues } from "@/app/lib/hyroxAssessmentPayload";
import type { HyroxAssessmentRow } from "@/app/lib/hyroxDatabaseTypes";

function assessmentSaveErrorResponse(message: string, code?: string) {
  const body: Record<string, unknown> = {
    success: false,
    error: "ASSESSMENT_SAVE_FAILED",
    detail: message,
  };
  if (process.env.NODE_ENV === "development" && code) {
    body.code = code;
  }
  return NextResponse.json(body, { status: 500 });
}

export async function GET() {
  const auth = await requireCurrentHyroxAthleteForApi();
  if (auth.error) return auth.error;

  const { athlete } = auth;

  const { assessment, error } = await fetchLatestHyroxAssessment(athlete.id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({
    submitted: Boolean(assessment),
    assessment: assessment ?? null,
    athleteStatus: athlete.status,
  });
}

export async function POST(request: Request) {
  const auth = await requireCurrentHyroxAthleteForApi();
  if (auth.error) return auth.error;

  const body = (await request.json()) as { values?: AssessmentFormValues };
  const values = body.values;
  if (!values || typeof values !== "object") {
    return NextResponse.json({ error: "Assessment values are required." }, { status: 400 });
  }

  const { athlete, user } = auth;

  if (athlete.user_id && athlete.user_id !== user.id) {
    return NextResponse.json(
      { success: false, error: "Athlete profile is not linked to this sign-in." },
      { status: 403 }
    );
  }

  const { assessment: inserted, error, code } = await saveHyroxAssessmentSubmission(
    athlete.id,
    values
  );

  if (error || !inserted) {
    return assessmentSaveErrorResponse(error ?? "Insert returned no row.", code);
  }

  let nextStatus = athlete.status;
  try {
    const { client } = await createCoachServerClient();
    nextStatus = await syncHyroxAthleteStatus(
      client,
      { ...athlete, status: athlete.status },
      { changedBy: user.id, reason: "assessment_submitted" }
    );
  } catch (syncErr) {
    const message = syncErr instanceof Error ? syncErr.message : String(syncErr);
    console.error("Hyrox assessment status sync failed", message);
  }

  return NextResponse.json({
    success: true,
    id: inserted.id,
    assessment: inserted as HyroxAssessmentRow,
    nextStatus,
    message: "Assessment submitted. Next step: complete your baseline testing.",
  });
}
