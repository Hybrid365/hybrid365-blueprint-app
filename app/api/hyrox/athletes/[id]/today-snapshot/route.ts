import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxAthleteRow, HyroxProgrammeSessionRow } from "@/app/lib/hyroxDatabaseTypes";
import {
  fetchDailyReadinessForDate,
  localDateYmdInTimeZone,
} from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import { buildCoachTodaySessionRows } from "@/app/lib/hyrox-team/modules/today/checklist";
import { resolveTodaysSessions } from "@/app/lib/hyrox-team/modules/today/resolveTodaySessions";
import { mapPublishedSessionsToAthleteUi } from "@/app/lib/hyroxProgrammeServer";
import { deriveLiveGlobalWeek } from "@/app/lib/hyroxProgrammeDates";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Coach-only Today snapshot (readiness + today's session status).
 * Scoped to a single athlete id — no cross-account exposure.
 */
export async function GET(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const url = new URL(request.url);
  const timezone = url.searchParams.get("timezone") ?? "Europe/London";
  const localDate =
    url.searchParams.get("localDate") ??
    localDateYmdInTimeZone(new Date(), timezone);

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error: fetchError } = await fetchHyroxAthleteById(supabase, id);
  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  const row = athlete as HyroxAthleteRow;
  const readiness = await fetchDailyReadinessForDate(supabase, row.id, localDate);

  let sessionStatuses: ReturnType<typeof buildCoachTodaySessionRows> = [];
  const programmeStart = row.programme_start_date?.trim() || null;
  if (programmeStart) {
    const liveWeek = deriveLiveGlobalWeek(programmeStart);
    const { data: weekRow } = await supabase
      .from("hyrox_programme_weeks")
      .select("id, week_number")
      .eq("athlete_id", row.id)
      .eq("status", "published")
      .eq("week_number", liveWeek)
      .maybeSingle();

    if (weekRow?.id) {
      const { data: sessionRows } = await supabase
        .from("hyrox_programme_sessions")
        .select(
          "id, programme_week_id, athlete_id, created_at, updated_at, day_of_week, session_slot, session_name, category, prescription, metadata, status, completed_at, athlete_feedback"
        )
        .eq("programme_week_id", weekRow.id);

      const ui = mapPublishedSessionsToAthleteUi(
        (sessionRows as HyroxProgrammeSessionRow[] | null) ?? [],
        { programmeStartYmd: programmeStart, globalWeekNumber: liveWeek }
      );
      const todays = resolveTodaysSessions({
        programmeStartDate: programmeStart,
        globalWeekNumber: liveWeek,
        sessions: ui,
      });
      sessionStatuses = buildCoachTodaySessionRows(todays);
    }
  }

  const highSoreness =
    readiness?.muscle_soreness != null && readiness.muscle_soreness >= 8;

  const includeReadiness = url.searchParams.get("includeReadiness") === "1";

  return NextResponse.json({
    success: true,
    localDate,
    readinessSubmitted: Boolean(readiness?.submitted_at),
    readinessCategory: readiness?.category ?? null,
    readinessExplanation: readiness?.explanation ?? null,
    readinessScore: readiness?.score ?? null,
    feelingUnwell: Boolean(readiness?.feeling_unwell),
    highSoreness,
    muscleSoreness: readiness?.muscle_soreness ?? null,
    coachingPrompt: readiness?.coaching_prompt ?? null,
    sessionStatuses,
    ...(includeReadiness ? { readiness } : {}),
  });
}
