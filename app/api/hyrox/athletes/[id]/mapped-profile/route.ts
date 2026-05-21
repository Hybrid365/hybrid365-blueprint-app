import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type {
  HyroxAthleteProfile,
  ProfileReviewOverrides,
} from "@/app/lib/hyroxAthleteProfileTypes";
import { recordHyroxStatusHistory } from "@/app/lib/hyroxAthleteServer";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { upsertMappedProfile } from "@/app/lib/hyroxProgrammeServer";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    mapped_profile?: HyroxAthleteProfile;
    coach_overrides?: ProfileReviewOverrides;
    effective_profile?: HyroxAthleteProfile;
  };

  if (!body.mapped_profile || !body.effective_profile) {
    return NextResponse.json(
      { error: "mapped_profile and effective_profile are required." },
      { status: 400 }
    );
  }

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error: fetchError } = await fetchHyroxAthleteById(supabase, athleteId);

  if (fetchError) {
    return NextResponse.json({ error: fetchError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ error: "Athlete not found." }, { status: 404 });
  }

  const row = athlete as HyroxAthleteRow;
  const statusFrom = row.status;

  try {
    const { profile, created } = await upsertMappedProfile(supabase, {
      athleteId,
      mappedProfile: body.mapped_profile,
      coachOverrides: body.coach_overrides ?? {},
      effectiveProfile: body.effective_profile,
      changedBy: auth.ctx.userId,
    });

    const nextStatus =
      row.status === "draft_generated" || row.status === "programme_published"
        ? row.status
        : "coach_reviewing";

    await supabase
      .from("hyrox_athletes")
      .update({
        status: nextStatus,
        programme_status: "mapped",
      })
      .eq("id", athleteId);

    await recordHyroxStatusHistory(supabase, {
      athleteId,
      statusFrom,
      statusTo: nextStatus,
      changedBy: auth.ctx.userId,
      reason: created ? "mapped_profile_created" : "mapped_profile_updated",
      metadata: {
        mapped_profile_id: profile.id,
        programme_status: "mapped",
      },
    });

    return NextResponse.json({
      success: true,
      profile,
      created,
      message: created ? "Mapped profile saved." : "Mapped profile updated.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
