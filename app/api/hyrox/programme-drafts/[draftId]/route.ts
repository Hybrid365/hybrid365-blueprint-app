import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { mergeProfileIntoCoachAthlete } from "@/app/lib/hyroxAssessmentMapping";
import type { HyroxAthleteProfile } from "@/app/lib/hyroxAthleteProfileTypes";
import { buildCoachAthleteStubFromLiveRow } from "@/app/lib/hyroxLiveCoachAthlete";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import type { CoachDraftWeek, CoachProgrammeStatus } from "@/app/lib/hyroxCoachProgrammeDraft";
import { draftDbToCoachStatus } from "@/app/lib/hyroxCoachProgrammeStatusMap";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import {
  fetchProgrammeDraftById,
  logCoachDraftRoute,
  updateProgrammeDraft,
} from "@/app/lib/hyroxProgrammeServer";

type RouteContext = { params: Promise<{ draftId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { draftId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    draft?: CoachDraftWeek;
    effective_profile?: HyroxAthleteProfile;
    coach_note?: string;
    athlete_facing_note?: string;
    coach_status?: CoachProgrammeStatus;
  };

  if (!body.draft) {
    return NextResponse.json({ success: false, error: "draft is required." }, { status: 400 });
  }

  const { client: supabase, mode } = await createCoachServerClient();
  const { draft: draftRow, error: draftError } = await fetchProgrammeDraftById(supabase, draftId);
  logCoachDraftRoute("patch", draftId, draftRow, { coachSupabaseMode: mode });

  if (draftError) {
    return NextResponse.json(
      {
        success: false,
        error: draftError,
        ...(process.env.NODE_ENV === "development" ? { detail: draftError } : {}),
      },
      { status: 500 }
    );
  }
  if (!draftRow) {
    return NextResponse.json(
      {
        success: false,
        error: "Draft not found.",
        ...(process.env.NODE_ENV === "development"
          ? { detail: `No hyrox_programme_drafts row for id ${draftId}` }
          : {}),
      },
      { status: 404 }
    );
  }

  if (draftRow.status === "published") {
    return NextResponse.json(
      { success: false, error: "Published drafts cannot be edited." },
      { status: 409 }
    );
  }

  const { athlete, error: athleteError } = await fetchHyroxAthleteById(supabase, draftRow.athlete_id);

  if (athleteError) {
    return NextResponse.json({ success: false, error: athleteError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  const row = athlete as HyroxAthleteRow;
  const flags = await fetchAthleteProgressFlags(supabase, row.id);
  const stub = buildCoachAthleteStubFromLiveRow(row, flags);
  const coachAthlete = body.effective_profile
    ? mergeProfileIntoCoachAthlete(stub, body.effective_profile)
    : stub;

  const coachStatus =
    body.coach_status ??
    draftDbToCoachStatus(
      draftRow.status === "draft_generated" ? "draft_generated" : draftRow.status
    );

  try {
    const saved = await updateProgrammeDraft(supabase, {
      draftId,
      athlete: coachAthlete,
      athleteRow: row,
      draft: body.draft,
      coachNote: body.coach_note ?? draftRow.coach_note ?? "",
      athleteFacingNote: body.athlete_facing_note ?? draftRow.athlete_facing_note ?? "",
      coachStatus,
      changedBy: auth.ctx.userId,
    });

    return NextResponse.json({
      success: true,
      draft: saved,
      coachStatus: draftDbToCoachStatus(saved.status),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed.";
    return NextResponse.json(
      {
        success: false,
        error: message,
        ...(process.env.NODE_ENV === "development" ? { detail: message } : {}),
      },
      { status: 500 }
    );
  }
}
