import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import {
  approveProgrammeDraft,
  fetchProgrammeDraftById,
  logCoachDraftRoute,
} from "@/app/lib/hyroxProgrammeServer";

type RouteContext = { params: Promise<{ draftId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { draftId } = await context.params;
  const { client: supabase, mode } = await createCoachServerClient();

  const { draft, error: draftError } = await fetchProgrammeDraftById(supabase, draftId);
  logCoachDraftRoute("approve", draftId, draft, { coachSupabaseMode: mode });

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
  if (!draft) {
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

  if (draft.status === "published") {
    return NextResponse.json({ success: false, error: "Draft already published." }, { status: 409 });
  }

  const { athlete, error: athleteError } = await fetchHyroxAthleteById(supabase, draft.athlete_id);

  if (athleteError) {
    return NextResponse.json({ success: false, error: athleteError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  try {
    const saved = await approveProgrammeDraft(supabase, {
      draftId,
      athleteRow: athlete as HyroxAthleteRow,
      changedBy: auth.ctx.userId,
    });

    return NextResponse.json({
      success: true,
      draft: saved,
      coachStatus: "approved",
      message: "Week approved. Publish when ready for the athlete dashboard.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Approve failed.";
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
