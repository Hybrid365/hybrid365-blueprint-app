import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import {
  defaultProgrammeStartYmd,
  deriveLiveGlobalWeek,
  weekDateRangeFromProgrammeStart,
} from "@/app/lib/hyroxProgrammeDates";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    programme_start_date?: string;
    programme_length_weeks?: 12 | 16;
  };

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error: fetchError } = await fetchHyroxAthleteById(supabase, athleteId);
  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};
  if (body.programme_start_date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.programme_start_date)) {
      return NextResponse.json(
        { success: false, error: "programme_start_date must be YYYY-MM-DD." },
        { status: 400 }
      );
    }
    patch.programme_start_date = body.programme_start_date;
    const now = new Date().toISOString();
    patch.programme_updated_at = now;
    if (!athlete.programme_start_date) {
      patch.programme_started_at = now;
    }
  }
  if (body.programme_length_weeks !== undefined) {
    if (body.programme_length_weeks !== 12 && body.programme_length_weeks !== 16) {
      return NextResponse.json(
        { success: false, error: "programme_length_weeks must be 12 or 16." },
        { status: 400 }
      );
    }
    patch.programme_length_weeks = body.programme_length_weeks;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({
      success: true,
      athlete,
      programme_start_date: athlete.programme_start_date ?? defaultProgrammeStartYmd(),
      programme_length_weeks: athlete.programme_length_weeks ?? 12,
    });
  }

  const { data, error } = await supabase
    .from("hyrox_athletes")
    .update(patch)
    .eq("id", athleteId)
    .select(
      "id, programme_start_date, programme_length_weeks, current_block, current_week, programme_status"
    )
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  if (patch.programme_start_date) {
    const startYmd = patch.programme_start_date as string;
    const { data: publishedWeeks } = await supabase
      .from("hyrox_programme_weeks")
      .select("id, week_number")
      .eq("athlete_id", athleteId)
      .eq("status", "published");

    for (const row of publishedWeeks ?? []) {
      const weekNum = row.week_number as number;
      const { startYmd: ws, endYmd: we } = weekDateRangeFromProgrammeStart(startYmd, weekNum);
      await supabase
        .from("hyrox_programme_weeks")
        .update({ week_start_date: ws, week_end_date: we })
        .eq("id", row.id);
    }

    await supabase
      .from("hyrox_athletes")
      .update({ current_week: deriveLiveGlobalWeek(startYmd) })
      .eq("id", athleteId);
  }

  return NextResponse.json({
    success: true,
    athlete: data,
    programme_start_date: data.programme_start_date,
    programme_length_weeks: data.programme_length_weeks,
  });
}
