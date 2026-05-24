import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { mergeProfileIntoCoachAthlete } from "@/app/lib/hyroxAssessmentMapping";
import { buildCoachAthleteStubFromLiveRow } from "@/app/lib/hyroxLiveCoachAthlete";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import {
  fetchLatestMappedProfile,
  fetchProgrammeDraftById,
  logCoachDraftRoute,
  publishProgrammeBlock,
  publishProgrammeDraft,
} from "@/app/lib/hyroxProgrammeServer";

type RouteContext = { params: Promise<{ draftId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { draftId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    weekly_focus?: string;
    /** When true (default), publish all four weeks in the athlete's current block. */
    publish_block?: boolean;
    programme_start_date?: string;
  };
  const publishBlock = body.publish_block !== false;

  const { client: supabase, mode } = await createCoachServerClient();
  const { draft, error: draftError } = await fetchProgrammeDraftById(supabase, draftId);
  logCoachDraftRoute("publish", draftId, draft, { coachSupabaseMode: mode });

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

  if (draft.status !== "approved") {
    return NextResponse.json(
      {
        success: false,
        error: "Draft must be approved before publishing. Approve the week first.",
        draftStatus: draft.status,
      },
      { status: 409 }
    );
  }

  const { athlete, error: athleteError } = await fetchHyroxAthleteById(supabase, draft.athlete_id);

  if (athleteError) {
    return NextResponse.json({ success: false, error: athleteError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  const programmeStartDate =
    body.programme_start_date?.trim() ||
    (athlete as HyroxAthleteRow).programme_start_date?.trim() ||
    null;

  if (!programmeStartDate || !/^\d{4}-\d{2}-\d{2}$/.test(programmeStartDate)) {
    return NextResponse.json(
      {
        success: false,
        error: "Set a programme start date before publishing.",
      },
      { status: 400 }
    );
  }

  try {
    if (publishBlock) {
      const flags = await fetchAthleteProgressFlags(supabase, draft.athlete_id);
      const stub = buildCoachAthleteStubFromLiveRow(athlete as HyroxAthleteRow, flags);
      const mappedProfile = await fetchLatestMappedProfile(supabase, draft.athlete_id);
      const effective = mappedProfile?.effective_profile as
        | import("@/app/lib/hyroxAthleteProfileTypes").HyroxAthleteProfile
        | undefined;
      const coachAthlete = effective
        ? mergeProfileIntoCoachAthlete(stub, effective)
        : stub;

      const blockResult = await publishProgrammeBlock(supabase, {
        coachAthlete,
        athleteRow: athlete as HyroxAthleteRow,
        mappedProfileId: mappedProfile?.id ?? null,
        programmeStartDate,
        changedBy: auth.ctx.userId,
      });

      return NextResponse.json({
        success: true,
        weeks: blockResult.weeks,
        sessionCount: blockResult.sessionCount,
        generatedWeekNumbers: blockResult.generatedWeekNumbers,
        syncedWeekNumbers: blockResult.syncedWeekNumbers,
        publishBlock: true,
        message: `Published ${blockResult.weeks.length} week(s) in block ${coachAthlete.programmeBlock} to athlete dashboard.${
          blockResult.syncedWeekNumbers.length > 0
            ? ` Synced missing sessions for week(s): ${blockResult.syncedWeekNumbers.join(", ")}.`
            : ""
        }`,
      });
    }

    const result = await publishProgrammeDraft(supabase, {
      draft,
      athleteRow: athlete as HyroxAthleteRow,
      weeklyFocus: body.weekly_focus ?? "",
      programmeStartDate,
      changedBy: auth.ctx.userId,
    });

    return NextResponse.json({
      success: true,
      week: result.week,
      sessionCount: result.sessionCount,
      publishBlock: false,
      message: "Programme published to athlete dashboard.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Publish failed.";
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
