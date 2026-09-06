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
import { parseCoachGlobalWeek } from "@/app/lib/hyroxProgrammeDates";
import {
  CopyProgrammeWeekError,
  autoCarryForwardProgrammeWeek,
} from "@/app/lib/hyroxCopyProgrammeWeekServer";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    from_week?: number;
    to_week?: number;
    effective_profile?: HyroxAthleteProfile;
  };

  const fromWeek = parseCoachGlobalWeek(body.from_week);
  const toWeek = parseCoachGlobalWeek(body.to_week);
  if (!fromWeek || !toWeek) {
    return NextResponse.json(
      { success: false, error: "from_week and to_week are required." },
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
    const result = await autoCarryForwardProgrammeWeek(supabase, {
      athleteId,
      athlete: coachAthlete,
      fromWeek,
      toWeek,
    });

    return NextResponse.json({
      success: true,
      published: false,
      ...result,
    });
  } catch (e) {
    if (e instanceof CopyProgrammeWeekError) {
      return NextResponse.json(
        { success: false, error: e.message, code: e.code },
        { status: e.httpStatus }
      );
    }
    const message = e instanceof Error ? e.message : "Auto-carry week failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
