import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxApplicationById } from "@/app/lib/hyroxApplicationCoachDb";
import {
  buildAthleteInsertFromApplication,
  fetchHyroxAthleteByApplicationId,
  fetchHyroxAthleteByEmail,
} from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxApplicationRow } from "@/app/lib/hyroxDatabaseTypes";

type RouteContext = { params: Promise<{ id: string }> };

function athleteCreateFailed(detail: string) {
  return NextResponse.json(
    { success: false, error: "ATHLETE_CREATE_FAILED", detail },
    { status: 500 }
  );
}

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: applicationId } = await context.params;
  const { client: supabase, mode } = await createCoachServerClient();

  const { application, error: fetchError } = await fetchHyroxApplicationById(
    supabase,
    applicationId
  );

  if (fetchError) {
    console.error("Hyrox application accept fetch failed", {
      applicationId,
      message: fetchError,
      coachSupabaseMode: mode,
    });
    return NextResponse.json({ success: false, error: fetchError }, { status: 500 });
  }
  if (!application) {
    return NextResponse.json(
      { success: false, error: "Application not found." },
      { status: 404 }
    );
  }

  const app = application;

  const { error: statusError } = await supabase
    .from("hyrox_applications")
    .update({ status: "accepted" })
    .eq("id", applicationId);

  if (statusError) {
    return NextResponse.json({ success: false, error: statusError.message }, { status: 500 });
  }

  const acceptedApplication = { ...app, status: "accepted" as const };

  const { athlete: existingByApp, error: byAppError } = await fetchHyroxAthleteByApplicationId(
    supabase,
    applicationId
  );
  if (byAppError) {
    return athleteCreateFailed(byAppError);
  }
  if (existingByApp) {
    return NextResponse.json({
      success: true,
      message: "Application accepted. Athlete record already exists for this application.",
      application: acceptedApplication,
      athlete: existingByApp,
      created: false,
    });
  }

  const email = app.email.trim().toLowerCase();
  const { athlete: existingByEmail, error: byEmailError } = await fetchHyroxAthleteByEmail(
    supabase,
    email
  );
  if (byEmailError) {
    return athleteCreateFailed(byEmailError);
  }

  if (existingByEmail) {
    const { error: linkError } = await supabase
      .from("hyrox_athletes")
      .update({ application_id: applicationId })
      .eq("id", existingByEmail.id);

    if (linkError) {
      console.error("Hyrox athlete link by email failed", linkError);
      return athleteCreateFailed(linkError.message);
    }

    const { athlete: linked, error: refetchError } = await fetchHyroxAthleteByApplicationId(
      supabase,
      applicationId
    );
    if (refetchError || !linked) {
      return athleteCreateFailed(refetchError ?? "Could not load linked athlete.");
    }

    return NextResponse.json({
      success: true,
      message:
        "Application accepted. Existing athlete matched by email — linked to this application.",
      application: acceptedApplication,
      athlete: linked,
      created: false,
    });
  }

  const insertRow = buildAthleteInsertFromApplication(applicationId, app);

  const { error: insertError } = await supabase.from("hyrox_athletes").insert(insertRow);

  if (insertError) {
    console.error("Hyrox athlete creation failed", {
      message: insertError.message,
      code: insertError.code,
      applicationId,
      coachSupabaseMode: mode,
    });
    return athleteCreateFailed(insertError.message);
  }

  const { athlete: created, error: createdFetchError } = await fetchHyroxAthleteByApplicationId(
    supabase,
    applicationId
  );

  if (createdFetchError || !created) {
    console.error("Hyrox athlete creation failed after insert", createdFetchError);
    return athleteCreateFailed(
      createdFetchError ?? "Athlete insert succeeded but row could not be loaded."
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.log("Hyrox athlete created from accept", created.id, created.email);
  }

  return NextResponse.json({
    success: true,
    message: "Athlete created. Send accepted/payment link manually.",
    application: acceptedApplication,
    athlete: created,
    created: true,
  });
}
