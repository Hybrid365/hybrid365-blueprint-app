import { NextResponse } from "next/server";
import { fetchLatestHyroxAssessment, saveHyroxAssessmentSubmission } from "@/app/lib/hyroxAthleteAssessmentDb";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { AssessmentFormValues } from "@/app/lib/hyroxAssessmentPayload";
import { syncHyroxAthleteStatus } from "@/app/lib/hyroxAthleteProgress";
import { verifyHyroxOnboardingLinkToken } from "@/app/lib/hyroxOnboardingLinkToken";

type RouteContext = { params: Promise<{ token: string }> };

function invalidLink(reason: string) {
  return NextResponse.json(
    { success: false, error: "INVALID_ONBOARDING_LINK", message: "This onboarding link is invalid. Please contact your coach.", reason },
    { status: 400 }
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const verified = verifyHyroxOnboardingLinkToken(token);
  if (!verified.ok) return invalidLink(verified.reason);

  const { client } = await createCoachServerClient();
  const { athlete, error } = await fetchHyroxAthleteById(client, verified.payload.athleteId);
  if (error || !athlete) return invalidLink("athlete-not-found");
  if (athlete.email.trim().toLowerCase() !== verified.payload.email) {
    return invalidLink("email-mismatch");
  }

  const { assessment, error: assessmentError } = await fetchLatestHyroxAssessment(athlete.id);
  if (assessmentError) {
    return NextResponse.json({ success: false, error: assessmentError }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    athlete: { id: athlete.id, name: athlete.name, email: athlete.email, status: athlete.status, payment_status: athlete.payment_status },
    submitted: Boolean(assessment),
    assessment: assessment ?? null,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const verified = verifyHyroxOnboardingLinkToken(token);
  if (!verified.ok) return invalidLink(verified.reason);

  const body = (await request.json()) as { values?: AssessmentFormValues };
  const values = body.values;
  if (!values || typeof values !== "object") {
    return NextResponse.json({ success: false, error: "Assessment values are required." }, { status: 400 });
  }

  const { client } = await createCoachServerClient();
  const { athlete, error } = await fetchHyroxAthleteById(client, verified.payload.athleteId);
  if (error || !athlete) return invalidLink("athlete-not-found");
  if (athlete.email.trim().toLowerCase() !== verified.payload.email) {
    return invalidLink("email-mismatch");
  }

  const { assessment: inserted, error: saveError } = await saveHyroxAssessmentSubmission(athlete.id, values);
  if (saveError || !inserted) {
    return NextResponse.json({ success: false, error: "ASSESSMENT_SAVE_FAILED", detail: saveError ?? "Insert failed." }, { status: 500 });
  }

  const fullName = typeof values.fullName === "string" ? values.fullName.trim() : "";
  const raceDate = typeof values.raceDate === "string" && values.raceDate.trim() ? values.raceDate.trim() : null;
  const raceName = typeof values.raceLocation === "string" && values.raceLocation.trim() ? values.raceLocation.trim() : athlete.race_name;

  await client
    .from("hyrox_athletes")
    .update({
      name: fullName || athlete.name,
      race_date: raceDate,
      race_name: raceName,
    })
    .eq("id", athlete.id);

  const nextStatus = await syncHyroxAthleteStatus(
    client,
    { ...athlete, name: fullName || athlete.name, race_date: raceDate, race_name: raceName },
    { changedBy: null, reason: "assessment_submitted_via_onboarding_token" }
  );

  return NextResponse.json({
    success: true,
    assessment: inserted,
    nextStatus,
    message: "Assessment complete. Your coach can now prepare your profile and programme build.",
  });
}
