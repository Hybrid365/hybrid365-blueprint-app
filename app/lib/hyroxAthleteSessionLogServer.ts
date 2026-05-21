import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildHyroxAthleteSessionFeedback,
  type HyroxAthleteSessionFeedback,
} from "@/app/lib/hyroxAthleteSessionFeedback";
import {
  deriveWeekCalendarStatus,
  weekDateRangeFromProgrammeStart,
} from "@/app/lib/hyroxProgrammeDates";
import type {
  HyroxAthleteRow,
  HyroxProgrammeSessionRow,
  HyroxProgrammeSessionStatus,
} from "@/app/lib/hyroxDatabaseTypes";

const SESSION_SELECT =
  "id, programme_week_id, athlete_id, status, completed_at, athlete_feedback, day_of_week, session_name";

export type HyroxSessionLogInput = {
  programmeSessionId: string;
  completed?: boolean;
  status?: HyroxProgrammeSessionStatus;
  feedback?: HyroxAthleteSessionFeedback;
};

export type HyroxSessionLogResult = {
  session: HyroxProgrammeSessionRow;
};

export class HyroxSessionLogError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "FORBIDDEN" | "WEEK_LOCKED" | "VALIDATION"
  ) {
    super(message);
    this.name = "HyroxSessionLogError";
  }
}

async function assertSessionLoggable(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  session: Pick<HyroxProgrammeSessionRow, "programme_week_id" | "athlete_id">
): Promise<void> {
  const { data: week, error } = await supabase
    .from("hyrox_programme_weeks")
    .select("id, week_number, status, week_start_date, week_end_date")
    .eq("id", session.programme_week_id)
    .eq("athlete_id", athlete.id)
    .maybeSingle();

  if (error) throw new HyroxSessionLogError(error.message, "VALIDATION");
  if (!week || week.status !== "published") {
    throw new HyroxSessionLogError("This session is not available to log yet.", "WEEK_LOCKED");
  }

  const startYmd =
    week.week_start_date?.trim() ||
    (athlete.programme_start_date
      ? weekDateRangeFromProgrammeStart(athlete.programme_start_date, week.week_number).startYmd
      : null);
  const endYmd =
    week.week_end_date?.trim() ||
    (athlete.programme_start_date
      ? weekDateRangeFromProgrammeStart(athlete.programme_start_date, week.week_number).endYmd
      : null);

  if (startYmd && endYmd) {
    const calendar = deriveWeekCalendarStatus(startYmd, endYmd);
    if (calendar === "upcoming") {
      throw new HyroxSessionLogError(
        "This session unlocks when the week goes live.",
        "WEEK_LOCKED"
      );
    }
  }
}

export async function upsertHyroxAthleteSessionLog(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  input: HyroxSessionLogInput
): Promise<HyroxSessionLogResult> {
  if (!input.programmeSessionId?.trim()) {
    throw new HyroxSessionLogError("programmeSessionId is required.", "VALIDATION");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("hyrox_programme_sessions")
    .select(SESSION_SELECT)
    .eq("id", input.programmeSessionId)
    .eq("athlete_id", athlete.id)
    .maybeSingle();

  if (fetchError) throw new HyroxSessionLogError(fetchError.message, "VALIDATION");
  if (!existing) {
    throw new HyroxSessionLogError("Session not found for this athlete.", "NOT_FOUND");
  }

  await assertSessionLoggable(supabase, athlete, existing);

  const completed = input.completed === true;
  const nextStatus: HyroxProgrammeSessionStatus = completed
    ? "completed"
    : input.status && ["scheduled", "completed", "missed", "modified"].includes(input.status)
      ? input.status
      : input.feedback?.modifications?.trim()
        ? "modified"
        : (existing.status as HyroxProgrammeSessionStatus);

  const athlete_feedback = input.feedback
    ? buildHyroxAthleteSessionFeedback(existing.athlete_feedback, input.feedback)
    : existing.athlete_feedback;

  const completed_at = completed
    ? new Date().toISOString()
    : nextStatus === "completed"
      ? existing.completed_at ?? new Date().toISOString()
      : null;

  const { data: updated, error: updateError } = await supabase
    .from("hyrox_programme_sessions")
    .update({
      status: nextStatus,
      completed_at,
      athlete_feedback,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.programmeSessionId)
    .eq("athlete_id", athlete.id)
    .select(SESSION_SELECT)
    .single();

  if (updateError) throw new HyroxSessionLogError(updateError.message, "VALIDATION");
  if (!updated) throw new HyroxSessionLogError("Could not save session log.", "VALIDATION");

  return { session: updated as HyroxProgrammeSessionRow };
}
