import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { generateNextBlockFromSavedReview } from "@/app/lib/hyroxBlockReviewGenerateServer";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { fetchLatestMappedProfile } from "@/app/lib/hyroxProgrammeServer";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import type { HyroxAthleteProfile } from "@/app/lib/hyroxAthleteProfileTypes";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    reviewed_block_number?: number;
    effective_profile?: HyroxAthleteProfile;
    force_retest_week?: boolean;
  };

  const reviewedBlockNumber = Number(body.reviewed_block_number);
  if (!Number.isFinite(reviewedBlockNumber) || reviewedBlockNumber < 1 || reviewedBlockNumber > 4) {
    return NextResponse.json(
      { success: false, error: "reviewed_block_number is required (1–4)." },
      { status: 400 }
    );
  }

  if (!body.effective_profile) {
    return NextResponse.json(
      { success: false, error: "effective_profile is required for generation." },
      { status: 400 }
    );
  }

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error: fetchError } = await fetchHyroxAthleteById(supabase, athleteId);
  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  try {
    const result = await generateNextBlockFromSavedReview(supabase, {
      athleteRow: athlete as HyroxAthleteRow,
      reviewedBlockNumber,
      effectiveProfile: body.effective_profile,
      changedBy: auth.ctx.userId,
      forceRetestWeek: body.force_retest_week === true,
    });

    if (result.plan.kind === "unavailable") {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          plan: result.plan,
        },
        { status: 409 }
      );
    }

    const mappedProfile = await fetchLatestMappedProfile(supabase, athleteId);

    return NextResponse.json({
      success: true,
      plan: result.plan,
      weeks: result.weeks,
      nextBlockNumber: result.nextBlockNumber,
      message: result.message,
      programmeBuilderBlock:
        result.plan.kind === "generate_block" ? result.plan.nextBlockNumber : 3,
      mappedProfileId: mappedProfile?.id ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
