import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { mergeProfileIntoCoachAthlete } from "@/app/lib/hyroxAssessmentMapping";
import type { HyroxAthleteProfile } from "@/app/lib/hyroxAthleteProfileTypes";
import { buildCoachAthleteStubFromLiveRow } from "@/app/lib/hyroxLiveCoachAthlete";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import {
  generateCoachBlockDraftWeeks,
  generateCoachDraftWeek,
  type CoachDraftWeek,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import { draftDbToCoachStatus } from "@/app/lib/hyroxCoachProgrammeStatusMap";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import {
  fetchLatestMappedProfile,
  fetchLatestProgrammeDraft,
  insertProgrammeDraft,
  parseCoachDraftWeek,
} from "@/app/lib/hyroxProgrammeServer";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const { client: supabase } = await createCoachServerClient();

  const [draft, mappedProfile] = await Promise.all([
    fetchLatestProgrammeDraft(supabase, athleteId),
    fetchLatestMappedProfile(supabase, athleteId),
  ]);

  if (!draft) {
    return NextResponse.json({
      success: true,
      draft: null,
      mappedProfile,
      coachStatus: null,
    });
  }

  return NextResponse.json({
    success: true,
    draft,
    mappedProfile,
    coachStatus: draftDbToCoachStatus(draft.status),
    draftData: parseCoachDraftWeek(draft.draft_data),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    effective_profile?: HyroxAthleteProfile;
    draft?: CoachDraftWeek;
    coach_note?: string;
    athlete_facing_note?: string;
    /** Generate drafts for all four weeks in the current block (coach-only, not published). */
    generate_block?: boolean;
  };

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error: fetchError } = await fetchHyroxAthleteById(supabase, athleteId);

  if (fetchError) {
    return NextResponse.json({ error: fetchError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ error: "Athlete not found." }, { status: 404 });
  }

  const row = athlete as HyroxAthleteRow;
  const flags = await fetchAthleteProgressFlags(supabase, athleteId);
  const stub = buildCoachAthleteStubFromLiveRow(row, flags);

  const effectiveProfile = body.effective_profile;
  if (!effectiveProfile) {
    return NextResponse.json({ error: "effective_profile is required." }, { status: 400 });
  }

  const coachAthlete = mergeProfileIntoCoachAthlete(stub, effectiveProfile);
  const mappedProfile = await fetchLatestMappedProfile(supabase, athleteId);

  try {
    if (body.generate_block) {
      const blockDrafts = generateCoachBlockDraftWeeks(coachAthlete);
      const savedDrafts = [];
      for (const draft of blockDrafts) {
        const saved = await insertProgrammeDraft(supabase, {
          athlete: coachAthlete,
          athleteRow: row,
          mappedProfileId: mappedProfile?.id ?? null,
          draft,
          coachNote: body.coach_note ?? "",
          athleteFacingNote: body.athlete_facing_note ?? "",
          changedBy: auth.ctx.userId,
        });
        savedDrafts.push(saved);
      }

      return NextResponse.json({
        success: true,
        drafts: savedDrafts,
        draft: savedDrafts[0] ?? null,
        draftData: blockDrafts[0],
        coachStatus: savedDrafts[0] ? draftDbToCoachStatus(savedDrafts[0].status) : null,
        message: "Four-week block drafts generated (coach-only). Publish block to release to athlete.",
      });
    }

    const draft = body.draft ?? generateCoachDraftWeek(coachAthlete);
    const saved = await insertProgrammeDraft(supabase, {
      athlete: coachAthlete,
      athleteRow: row,
      mappedProfileId: mappedProfile?.id ?? null,
      draft,
      coachNote: body.coach_note ?? "",
      athleteFacingNote: body.athlete_facing_note ?? "",
      changedBy: auth.ctx.userId,
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[hyrox/athletes/programme-draft] created", {
        athleteId,
        draftId: saved.id,
        status: saved.status,
      });
    }

    return NextResponse.json({
      success: true,
      draft: saved,
      draftData: draft,
      coachStatus: draftDbToCoachStatus(saved.status),
      message: "Programme draft saved (coach-only). Athlete dashboard unchanged until publish.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Draft generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
