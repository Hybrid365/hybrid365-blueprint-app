import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { mergeProfileIntoCoachAthlete } from "@/app/lib/hyroxAssessmentMapping";
import type { HyroxAthleteProfile } from "@/app/lib/hyroxAthleteProfileTypes";
import { buildCoachAthleteStubFromLiveRow } from "@/app/lib/hyroxLiveCoachAthlete";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { fetchLatestMappedProfile } from "@/app/lib/hyroxProgrammeServer";
import { isHyroxSessionFamiliesEnabled } from "@/app/lib/hyroxSessionFamiliesFlag";
import { ensureProgrammeDraftWeeksExist } from "@/app/lib/hyroxSessionFamilyEnsureDraft";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Ensure empty draft shells exist for the given global weeks.
 * Does not publish. Does not mutate athlete current_week.
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  if (!isHyroxSessionFamiliesEnabled({ id: athleteId })) {
    return NextResponse.json(
      { success: false, error: "Session families not enabled for this athlete." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    global_weeks?: number[];
    effective_profile?: HyroxAthleteProfile;
    coach_note?: string;
    athlete_facing_note?: string;
  };

  const weeks = Array.isArray(body.global_weeks)
    ? body.global_weeks.filter((w) => Number.isInteger(w) && w >= 1)
    : [];
  if (weeks.length === 0) {
    return NextResponse.json(
      { success: false, error: "global_weeks required." },
      { status: 400 }
    );
  }
  if (!body.effective_profile) {
    return NextResponse.json(
      { success: false, error: "effective_profile required." },
      { status: 400 }
    );
  }

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error } = await fetchHyroxAthleteById(supabase, athleteId);
  if (error) return NextResponse.json({ success: false, error }, { status: 500 });
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  const row = athlete as HyroxAthleteRow;
  const flags = await fetchAthleteProgressFlags(supabase, athleteId);
  const stub = buildCoachAthleteStubFromLiveRow(row, flags);
  const coachAthlete = mergeProfileIntoCoachAthlete(stub, body.effective_profile);
  const mapped = await fetchLatestMappedProfile(supabase, athleteId);

  try {
    const ensured = await ensureProgrammeDraftWeeksExist(supabase, {
      athleteId,
      athlete: coachAthlete,
      globalWeeks: weeks,
      mappedProfileId: mapped?.id ?? null,
      coachNote: body.coach_note,
      athleteFacingNote: body.athlete_facing_note,
    });
    return NextResponse.json({
      success: true,
      weeks: ensured.map((w) => ({
        globalWeek: w.globalWeek,
        draftId: w.draftId,
        created: w.created,
        block: w.draftData.block,
        draftData: w.draftData,
        sessionCount: w.draftData.days.reduce((n, d) => n + d.sessions.length, 0),
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ensure weeks failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
