import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { mergeProfileIntoCoachAthlete } from "@/app/lib/hyroxAssessmentMapping";
import { buildCoachAthleteStubFromLiveRow } from "@/app/lib/hyroxLiveCoachAthlete";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import { fetchLatestMappedProfile } from "@/app/lib/hyroxProgrammeServer";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import type { HyroxAthleteProfile } from "@/app/lib/hyroxAthleteProfileTypes";
import {
  parseCoachGlobalWeek,
  type ProgrammeLengthWeeks,
} from "@/app/lib/hyroxProgrammeDates";
import {
  CopyProgrammeWeekError,
  copyProgrammeWeekDraft,
  listCopyWeekDestinations,
} from "@/app/lib/hyroxCopyProgrammeWeekServer";

type RouteContext = { params: Promise<{ id: string }> };

function copyWeekErrorResponse(e: unknown) {
  if (e instanceof CopyProgrammeWeekError) {
    return NextResponse.json(
      { success: false, error: e.message, code: e.code },
      { status: e.httpStatus }
    );
  }
  const message = e instanceof Error ? e.message : "Copy week failed.";
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const sourceWeek = parseCoachGlobalWeek(new URL(request.url).searchParams.get("sourceWeek"));
  if (!sourceWeek) {
    return NextResponse.json(
      { success: false, error: "sourceWeek is required." },
      { status: 400 }
    );
  }

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error: athleteError } = await fetchHyroxAthleteById(supabase, athleteId);
  if (athleteError) {
    return NextResponse.json({ success: false, error: athleteError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  const lengthWeeks = (athlete.programme_length_weeks === 16 ? 16 : 12) as ProgrammeLengthWeeks;

  try {
    const { source, destinations } = await listCopyWeekDestinations(supabase, {
      athleteId,
      sourceWeek,
      programmeStartYmd: athlete.programme_start_date ?? null,
      programmeLengthWeeks: lengthWeeks,
    });
    return NextResponse.json({
      success: true,
      sourceWeek,
      sourceDraftId: source.id,
      destinations,
    });
  } catch (e) {
    return copyWeekErrorResponse(e);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    source_week?: number;
    target_week?: number;
    replace?: boolean;
    effective_profile?: HyroxAthleteProfile;
  };

  const sourceWeek = parseCoachGlobalWeek(body.source_week);
  const targetWeek = parseCoachGlobalWeek(body.target_week);
  if (!sourceWeek || !targetWeek) {
    return NextResponse.json(
      { success: false, error: "source_week and target_week are required." },
      { status: 400 }
    );
  }

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error: athleteError } = await fetchHyroxAthleteById(supabase, athleteId);
  if (athleteError) {
    return NextResponse.json({ success: false, error: athleteError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  const row = athlete as HyroxAthleteRow;
  const flags = await fetchAthleteProgressFlags(supabase, athleteId);
  const stub = buildCoachAthleteStubFromLiveRow(row, flags);
  const mapped = await fetchLatestMappedProfile(supabase, athleteId);
  const coachAthlete = body.effective_profile
    ? mergeProfileIntoCoachAthlete(stub, body.effective_profile)
    : mapped?.effective_profile
      ? mergeProfileIntoCoachAthlete(stub, mapped.effective_profile as HyroxAthleteProfile)
      : stub;

  try {
    const result = await copyProgrammeWeekDraft(supabase, {
      athleteId,
      athlete: coachAthlete,
      sourceWeek,
      targetWeek,
      replace: body.replace === true,
    });

    return NextResponse.json({
      success: true,
      sourceWeek: result.sourceWeek,
      targetWeek: result.targetWeek,
      targetBlock: result.targetBlock,
      targetCycle: result.targetCycle,
      draftId: result.draft.id,
      sessionCount: result.sessionCount,
      replaced: result.replaced,
      published: false,
      message: `WEEK ${result.sourceWeek} COPIED TO WEEK ${result.targetWeek}`,
      detail: "Review the sessions before publishing.",
    });
  } catch (e) {
    return copyWeekErrorResponse(e);
  }
}
