import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";

export type AthleteWeekCalendarStatus =
  | "past"
  | "live"
  | "upcoming"
  | "not_generated"
  | "locked";

export type AthleteProgrammeWeekBundle = {
  weekNumber: number;
  blockWeekInCycle: number;
  generated: boolean;
  calendarStatus?: AthleteWeekCalendarStatus;
  weekStartDate?: string | null;
  weekEndDate?: string | null;
  dateRangeLabel?: string | null;
  week: {
    id: string;
    block_number: number;
    week_number: number;
    weekly_focus: string | null;
    coach_note: string | null;
    athlete_facing_note: string | null;
  } | null;
  weekRole: string;
  sessions: HyroxSession[];
};
