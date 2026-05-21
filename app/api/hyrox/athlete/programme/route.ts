import { NextResponse } from "next/server";
import { BLOCK_WEEK_FOCUS_LABELS } from "@/app/lib/hyroxCoachProgrammeDraft";
import { requireCurrentHyroxAthleteForApi } from "@/app/lib/hyroxAthleteApiAuth";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import {
  fetchAthletePublishedProgramme,
  mapPublishedSessionsToAthleteUi,
  resolveAthleteProgrammeApiState,
} from "@/app/lib/hyroxProgrammeServer";

export async function GET() {
  const auth = await requireCurrentHyroxAthleteForApi();
  if (auth.error) return auth.error;

  const { athlete, user } = auth;
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
      return {
        weekNumber: bundle.weekNumber,
        blockWeekInCycle: cycle,
        generated: bundle.generated,
        week: bundle.week
          ? {
              id: bundle.week.id,
              block_number: bundle.week.block_number,
              week_number: bundle.week.week_number,
              weekly_focus: bundle.week.weekly_focus,
              coach_note: bundle.week.coach_note,
              athlete_facing_note: bundle.week.athlete_facing_note,
            }
          : null,
        weekRole: bundle.week?.weekly_focus ?? BLOCK_WEEK_FOCUS_LABELS[cycle],
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

    return NextResponse.json({
      success: true,
      state,
      visibility: programme.visibility,
      published: programme.published,
      hasPublishedProgramme: programme.published,
      programmeStatus: programme.programmeStatus,
      athleteStatus: programme.athleteStatus,
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
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load programme.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
