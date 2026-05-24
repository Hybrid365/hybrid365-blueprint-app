import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { resolveEffectiveProgrammeStartYmd } from "@/app/lib/hyroxAthleteProgrammeWeekChip";
import { getBlockWeekRole } from "@/app/lib/hyroxProgrammeDates";
import type { AthleteWeekCalendarStatus } from "@/app/lib/hyroxAthleteProgrammeTypes";
import {
  fetchAthletePublishedProgramme,
  mapPublishedSessionsToAthleteUi,
  resolveAthleteProgrammeApiState,
  resolvePublishedWeekCalendarStatus,
  resolvePublishedWeekDates,
} from "@/app/lib/hyroxProgrammeServer";

/** Server-side programme payload — same shape as GET /api/hyrox/athlete/programme. */
export async function fetchAthleteLiveProgrammeForServer(
  athlete: HyroxAthleteRow,
  userEmail?: string | null
): Promise<AthleteLiveProgrammePayload | null> {
  const { client: supabase } = await createCoachServerClient();
  const flags = await fetchAthleteProgressFlags(supabase, athlete.id);
  const programme = await fetchAthletePublishedProgramme(supabase, athlete, flags);
  const sessions = mapPublishedSessionsToAthleteUi(programme.sessions);
  const state = resolveAthleteProgrammeApiState({
    published: programme.published,
    visibility: programme.visibility,
    athleteStatus: programme.athleteStatus,
  });

  const displayName =
    athlete.name?.trim() || userEmail?.trim() || programme.athlete.name?.trim() || "Athlete";

  const programmeStartEffective = resolveEffectiveProgrammeStartYmd(
    programme.programmeStartDate,
    athlete.programme_start_date ?? programme.athlete.programme_start_date,
    programme.weeks.map((w) => ({ weekNumber: w.weekNumber, week: w.week }))
  );

  const programmeWeeks = programme.weeks.map((bundle) => {
    const cycle = (((bundle.weekNumber - 1) % 4) + 1) as 1 | 2 | 3 | 4;
    const blockNum = bundle.week?.block_number ?? athlete.current_block ?? 1;
    const weekRole =
      bundle.week?.weekly_focus ??
      getBlockWeekRole(blockNum, cycle, programme.programmeLengthWeeks);
    const resolvedDates = resolvePublishedWeekDates(bundle, programmeStartEffective);
    const dateRangeLabel = resolvedDates?.dateRangeLabel ?? null;
    const calendarStatus = resolvePublishedWeekCalendarStatus(
      bundle,
      programmeStartEffective
    ) as AthleteWeekCalendarStatus;

    return {
      weekNumber: bundle.weekNumber,
      blockWeekInCycle: cycle,
      generated: bundle.generated,
      calendarStatus,
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

  return {
    state,
    visibility: programme.visibility,
    published: programme.published,
    programmeStatus: programme.programmeStatus,
    athleteStatus: programme.athleteStatus,
    programmeStartDate: programmeStartEffective ?? programme.programmeStartDate,
    programmeLengthWeeks: programme.programmeLengthWeeks,
    liveGlobalWeek: programme.liveGlobalWeek,
    athlete: {
      ...programme.athlete,
      name: displayName,
    },
    week: programme.week,
    sessions,
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
  };
}
