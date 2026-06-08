import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import type { HyroxWeeklyCoachNotes } from "@/app/lib/hyroxWeeklyReview";
import {
  loadWeeklyReviewForCoach,
  upsertWeeklyCoachReview,
} from "@/app/lib/hyroxWeeklyReviewServer";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";

type RouteContext = { params: Promise<{ id: string }> };

function parseWeekNumber(raw: string | null): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const weekNumber = parseWeekNumber(new URL(request.url).searchParams.get("week"));
  if (!weekNumber) {
    return NextResponse.json(
      { success: false, error: "Query param week is required (positive integer)." },
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
  const maxWeeks = row.programme_length_weeks === 16 ? 16 : 12;
  if (weekNumber > maxWeeks) {
    return NextResponse.json(
      { success: false, error: `Week ${weekNumber} is outside this athlete's programme length.` },
      { status: 400 }
    );
  }

  try {
    const review = await loadWeeklyReviewForCoach(supabase, row, weekNumber);
    return NextResponse.json({ success: true, review });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load weekly review.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    week_number?: number;
    programme_week_id?: string | null;
    coach_notes?: HyroxWeeklyCoachNotes;
  };

  const weekNumber =
    typeof body.week_number === "number" ? Math.floor(body.week_number) : null;
  if (!weekNumber || weekNumber < 1) {
    return NextResponse.json(
      { success: false, error: "week_number is required." },
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
  const maxWeeks = row.programme_length_weeks === 16 ? 16 : 12;
  if (weekNumber > maxWeeks) {
    return NextResponse.json(
      { success: false, error: `Week ${weekNumber} is outside this athlete's programme length.` },
      { status: 400 }
    );
  }

  try {
    const saved = await upsertWeeklyCoachReview(supabase, {
      athleteId: row.id,
      weekNumber,
      programmeWeekId: body.programme_week_id ?? null,
      coachNotes: body.coach_notes ?? {},
    });

    return NextResponse.json({
      success: true,
      coachNotes: saved.coachNotes,
      coachReviewUpdatedAt: saved.updatedAt,
      message: `Week ${weekNumber} coach review saved.`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save weekly review.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
