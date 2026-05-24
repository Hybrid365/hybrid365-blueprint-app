import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentHyroxAthleteForApi } from "@/app/lib/hyroxAthleteApiAuth";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { getBlockWeekRole } from "@/app/lib/hyroxProgrammeDates";
import {
  fetchAthletePublishedProgramme,
  mapPublishedSessionsToAthleteUi,
  resolveAthleteProgrammeApiState,
  resolvePublishedWeekDates,
} from "@/app/lib/hyroxProgrammeServer";

export async function GET(request: NextRequest) {
  const auth = await requireCurrentHyroxAthleteForApi(request);
  if (auth.error) return auth.error;

  const { athlete, user, withAuthCookies } = auth;
  const { client: supabase, mode } = await createCoachServerClient();

  try {
    const flags = await fetchAthleteProgressFlags(supabase, athlete.id);
    const programme = await fetchAthletePublishedProgramme(supabase, athlete, flags);
    const sessions = mapPublishedSessionsToAthleteUi(programme.sessions);
    const state = resolveAthleteProgrammeApiState({
      published: programme.published,
      visibility: programme.visibility,
      athleteStatus: programme.athleteStatus,
    });

    const displayName = athlete.name?.trim() || user.email?.trim() || "Athlete";

    const programmeWeeks = programme.weeks.map((bundle) => {
      const cycle = (((bundle.weekNumber - 1) % 4) + 1) as 1 | 2 | 3 | 4;
      const blockNum = bundle.week?.block_number ?? athlete.current_block ?? 1;
      const weekRole =
        bundle.week?.weekly_focus ??
        getBlockWeekRole(blockNum, cycle, programme.programmeLengthWeeks);
      const resolvedDates = resolvePublishedWeekDates(bundle, programme.programmeStartDate);
      const dateRangeLabel = resolvedDates?.dateRangeLabel ?? null;

      return {
        weekNumber: bundle.weekNumber,
        blockWeekInCycle: cycle,
        generated: bundle.generated,
        calendarStatus: bundle.calendarStatus,
        weekStartDate: resolvedDates?.startYmd ?? bundle.weekStartDate,
        weekEndDate: resolvedDates?.endYmd ?? bundle.weekEndDate,
        dateRangeLabel,
        week: bundle.week
          ? {
              id: bundle.week.id,
              block_number: bundle.week.block_number,
              week_number: bundle.week.week_number,
              week_start_date: bundle.week.week_start_date,
              week_end_date: bundle.week.week_end_date,
              weekly_focus: bundle.week.weekly_focus,
              coach_note: bundle.week.coach_note,
              athlete_facing_note: bundle.week.athlete_facing_note,
            }
          : null,
        weekRole,
        sessions: mapPublishedSessionsToAthleteUi(bundle.sessions),
      };
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[hyrox/athlete/programme]", {
        athleteId: athlete.id,
        athleteName: displayName,
        coachSupabaseMode: mode,
        state,
        publishedWeekCount: programme.weeks.filter((w) => w.generated).length,
        sessionCount: sessions.length,
        visibility: programme.visibility,
      });
    }

    return withAuthCookies(
      NextResponse.json({
      success: true,
      state,
      visibility: programme.visibility,
      published: programme.published,
      hasPublishedProgramme: programme.published,
      programmeStatus: programme.programmeStatus,
      athleteStatus: programme.athleteStatus,
      programmeStartDate: programme.programmeStartDate,
      programmeLengthWeeks: programme.programmeLengthWeeks,
      liveGlobalWeek: programme.liveGlobalWeek,
      athlete: {
        ...programme.athlete,
        name: displayName,
      },
      programmeWeek: programme.week,
      week: programme.week,
      sessions,
      sessionCount: sessions.length,
      programmeWeeks,
      weekRationale: programme.week
        ? {
            weekRole:
              programme.week.weekly_focus ??
              `Block ${programme.week.block_number} · Week ${programme.week.week_number}`,
            whyMatters: programme.week.athlete_facing_note ?? programme.week.coach_note ?? "",
            prioritise: [] as string[],
            coachNote: programme.week.coach_note ?? "",
          }
        : null,
    })
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load programme.";
    return withAuthCookies(
      NextResponse.json({ success: false, error: message }, { status: 500 })
    );
  }
}
