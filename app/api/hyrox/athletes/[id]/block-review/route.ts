import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import type { HyroxBlockReviewCoachNotes, HyroxBlockReviewNextRecommendation } from "@/app/lib/hyroxBlockReview";
import { BLOCK_REVIEW_RECOMMENDATION_OPTIONS, maxReviewBlocks } from "@/app/lib/hyroxBlockReview";
import {
  buildBlockReviewCompletionSummary,
  loadBlockReviewForCoach,
  upsertHyroxBlockReview,
} from "@/app/lib/hyroxBlockReviewServer";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_RECOMMENDATIONS = new Set(
  BLOCK_REVIEW_RECOMMENDATION_OPTIONS.map((o) => o.value)
);

function parseBlockNumber(raw: string | null): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 4) return null;
  return Math.floor(n);
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const blockNumber = parseBlockNumber(new URL(request.url).searchParams.get("block"));
  if (!blockNumber) {
    return NextResponse.json(
      { success: false, error: "Query param block is required (1–4)." },
      { status: 400 }
    );
  }

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error: fetchError } = await fetchHyroxAthleteById(supabase, id);
  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  const row = athlete as HyroxAthleteRow;
  const maxBlocks = maxReviewBlocks(row.programme_length_weeks === 16 ? 16 : 12);
  if (blockNumber > maxBlocks) {
    return NextResponse.json(
      { success: false, error: `Block ${blockNumber} is outside this athlete's programme length.` },
      { status: 400 }
    );
  }

  try {
    const { summary, review } = await loadBlockReviewForCoach(supabase, row, blockNumber);
    return NextResponse.json({
      success: true,
      blockNumber,
      maxBlocks,
      summary,
      review,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load block review.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    block_number?: number;
    coach_notes?: HyroxBlockReviewCoachNotes;
    next_block_recommendation?: string | null;
    next_block_focus?: string | null;
  };

  const blockNumber =
    typeof body.block_number === "number" ? Math.floor(body.block_number) : null;
  if (!blockNumber || blockNumber < 1 || blockNumber > 4) {
    return NextResponse.json(
      { success: false, error: "block_number is required (1–4)." },
      { status: 400 }
    );
  }

  const recommendation =
    body.next_block_recommendation == null || body.next_block_recommendation === ""
      ? null
      : body.next_block_recommendation;
  if (recommendation && !VALID_RECOMMENDATIONS.has(recommendation as HyroxBlockReviewNextRecommendation)) {
    return NextResponse.json(
      { success: false, error: "Invalid next_block_recommendation." },
      { status: 400 }
    );
  }

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error: fetchError } = await fetchHyroxAthleteById(supabase, id);
  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  const row = athlete as HyroxAthleteRow;
  const maxBlocks = maxReviewBlocks(row.programme_length_weeks === 16 ? 16 : 12);
  if (blockNumber > maxBlocks) {
    return NextResponse.json(
      { success: false, error: `Block ${blockNumber} is outside this athlete's programme length.` },
      { status: 400 }
    );
  }

  try {
    const summary = await buildBlockReviewCompletionSummary(supabase, row, blockNumber);
    const review = await upsertHyroxBlockReview(supabase, {
      athlete: row,
      blockNumber,
      coachNotes: body.coach_notes ?? {},
      nextBlockRecommendation: recommendation as HyroxBlockReviewNextRecommendation | null,
      nextBlockFocus: body.next_block_focus ?? null,
      completionSummary: summary,
    });

    return NextResponse.json({
      success: true,
      review,
      summary,
      message: `Block ${blockNumber} review saved.`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save block review.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
