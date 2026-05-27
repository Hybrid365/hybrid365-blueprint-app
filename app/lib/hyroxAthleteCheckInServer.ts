import type { SupabaseClient } from "@supabase/supabase-js";
import type { HyroxAthleteRow, HyroxCheckInRow, HyroxProgrammeSessionRow } from "@/app/lib/hyroxDatabaseTypes";
import type { AthletePublishedProgramme } from "@/app/lib/hyroxProgrammeServer";
import { deriveLiveGlobalWeek } from "@/app/lib/hyroxProgrammeDates";

export type AthleteCheckInUiStatus = "locked" | "needs_completing" | "completed";

export type AthleteCheckInFormState = {
  sleep: number;
  energy: number;
  stress: number;
  soreness: number;
  recovery: number;
  bodyweightKg: number | null;
  painNiggles: string;
  biggestWin: string;
  biggestStruggle: string;
  nextWeekAvailability: string;
};

export type AthleteWeeklyCheckInView = {
  weekNumber: number;
  blockWeekInCycle: number;
  programmeWeekId: string | null;
  status: AthleteCheckInUiStatus;
  statusLabel: string;
  submittedAt: string | null;
  sessionsCompleted: number;
  sessionsPlanned: number;
  form: AthleteCheckInFormState;
  canSubmit: boolean;
  nextCheckInWeekNumber: number | null;
};

export type AthleteCheckInSummary = {
  weekNumber: number;
  status: AthleteCheckInUiStatus;
  statusLabel: string;
  sub: string;
  due: boolean;
  submittedAt: string | null;
};

export type CoachCheckInListItem = {
  id: string;
  weekNumber: number;
  submittedAt: string | null;
  status: string;
  sleep: number | null;
  energy: number | null;
  stress: number | null;
  soreness: number | null;
  bodyweight: number | null;
  painNiggles: string | null;
  biggestWin: string | null;
  biggestStruggle: string | null;
  nextWeekAvailability: string | null;
};

export type CheckInSubmitInput = {
  sleep: number;
  energy: number;
  stress: number;
  soreness: number;
  recovery: number;
  bodyweight?: number | null;
  painNiggles?: string;
  biggestWin?: string;
  biggestStruggle?: string;
  nextWeekAvailability?: string;
};

const CHECK_IN_SELECT =
  "id, athlete_id, programme_week_id, created_at, updated_at, submitted_at, week_number, sleep, energy, stress, soreness, motivation, bodyweight, sessions_completed, biggest_win, biggest_struggle, pain_niggles, next_week_availability, raw_answers, coach_response, status";

function blockWeekInCycle(globalWeek: number): number {
  return ((globalWeek - 1) % 4) + 1;
}

function emptyForm(): AthleteCheckInFormState {
  return {
    sleep: 5,
    energy: 5,
    stress: 5,
    soreness: 5,
    recovery: 5,
    bodyweightKg: null,
    painNiggles: "",
    biggestWin: "",
    biggestStruggle: "",
    nextWeekAvailability: "",
  };
}

function formFromRow(row: HyroxCheckInRow): AthleteCheckInFormState {
  const raw =
    row.raw_answers && typeof row.raw_answers === "object" && !Array.isArray(row.raw_answers)
      ? (row.raw_answers as Record<string, unknown>)
      : {};
  const recovery =
    typeof raw.recovery === "number"
      ? raw.recovery
      : row.motivation ?? 5;

  return {
    sleep: row.sleep ?? 5,
    energy: row.energy ?? 5,
    stress: row.stress ?? 5,
    soreness: row.soreness ?? 5,
    recovery,
    bodyweightKg: row.bodyweight != null ? Number(row.bodyweight) : null,
    painNiggles: row.pain_niggles ?? "",
    biggestWin: row.biggest_win ?? "",
    biggestStruggle: row.biggest_struggle ?? "",
    nextWeekAvailability: row.next_week_availability ?? "",
  };
}

function isSubmitted(row: HyroxCheckInRow | null | undefined): boolean {
  if (!row) return false;
  return Boolean(row.submitted_at) || row.status === "submitted" || row.status === "reviewed";
}

function sessionCountsForWeek(
  programme: AthletePublishedProgramme,
  weekNumber: number
): { completed: number; planned: number; programmeWeekId: string | null } {
  const bundle = programme.weeks.find((w) => w.weekNumber === weekNumber);
  const sessions = bundle?.sessions ?? [];
  const planned = sessions.length;
  const completed = sessions.filter((s) => s.status === "completed").length;
  return {
    completed,
    planned,
    programmeWeekId: bundle?.week?.id ?? null,
  };
}

export function resolveLiveCheckInWeekNumber(
  athlete: HyroxAthleteRow,
  programme: Pick<AthletePublishedProgramme, "programmeStartDate" | "liveGlobalWeek">
): number {
  if (programme.programmeStartDate) {
    return deriveLiveGlobalWeek(programme.programmeStartDate);
  }
  return athlete.current_week ?? programme.liveGlobalWeek ?? 1;
}

export async function fetchCheckInForWeek(
  supabase: SupabaseClient,
  athleteId: string,
  weekNumber: number
): Promise<HyroxCheckInRow | null> {
  const { data } = await supabase
    .from("hyrox_check_ins")
    .select(CHECK_IN_SELECT)
    .eq("athlete_id", athleteId)
    .eq("week_number", weekNumber)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return (data as HyroxCheckInRow | null) ?? null;
}

export function buildAthleteWeeklyCheckInView(params: {
  athlete: HyroxAthleteRow;
  programme: AthletePublishedProgramme;
  row: HyroxCheckInRow | null;
  targetWeekNumber?: number;
}): AthleteWeeklyCheckInView {
  const weekNumber =
    params.targetWeekNumber ??
    resolveLiveCheckInWeekNumber(params.athlete, params.programme);
  const cycle = blockWeekInCycle(weekNumber);
  const { completed, planned, programmeWeekId } = sessionCountsForWeek(
    params.programme,
    weekNumber
  );
  const beforeStart = !params.programme.programmeStartDate;
  const weekPublished = planned > 0;
  const submitted = isSubmitted(params.row);

  let status: AthleteCheckInUiStatus = "needs_completing";
  if (beforeStart || !weekPublished) {
    status = "locked";
  } else if (submitted) {
    status = "completed";
  }

  const statusLabel =
    status === "completed"
      ? "Completed"
      : status === "needs_completing"
        ? "Needs completing"
        : "Not available yet";

  const form = submitted && params.row ? formFromRow(params.row) : emptyForm();
  const nextWeek = weekNumber < params.programme.programmeLengthWeeks ? weekNumber + 1 : null;

  return {
    weekNumber,
    blockWeekInCycle: cycle,
    programmeWeekId,
    status,
    statusLabel,
    submittedAt: params.row?.submitted_at ?? null,
    sessionsCompleted: params.row?.sessions_completed ?? completed,
    sessionsPlanned: planned,
    form,
    canSubmit: status === "needs_completing",
    nextCheckInWeekNumber: status === "completed" ? nextWeek : null,
  };
}

export function buildAthleteCheckInSummary(view: AthleteWeeklyCheckInView): AthleteCheckInSummary {
  const due = view.status === "needs_completing";
  let sub = "Complete your weekly check-in for this training week";
  if (view.status === "completed" && view.submittedAt) {
    sub = `Submitted on ${formatSubmittedDate(view.submittedAt)}`;
  } else if (view.status === "locked") {
    sub = view.nextCheckInWeekNumber
      ? `Your next check-in unlocks in Week ${view.nextCheckInWeekNumber}`
      : "Check-in unlocks when your programme week is live";
  }

  return {
    weekNumber: view.weekNumber,
    status: view.status,
    statusLabel: view.statusLabel,
    sub,
    due,
    submittedAt: view.submittedAt,
  };
}

export async function buildAthleteWeeklyCheckInForProgramme(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  programme: AthletePublishedProgramme
): Promise<AthleteWeeklyCheckInView> {
  const weekNumber = resolveLiveCheckInWeekNumber(athlete, programme);
  const row = await fetchCheckInForWeek(supabase, athlete.id, weekNumber);
  return buildAthleteWeeklyCheckInView({ athlete, programme, row, targetWeekNumber: weekNumber });
}

export async function upsertAthleteWeeklyCheckIn(
  supabase: SupabaseClient,
  params: {
    athlete: HyroxAthleteRow;
    programme: AthletePublishedProgramme;
    input: CheckInSubmitInput;
  }
): Promise<{ view: AthleteWeeklyCheckInView; row: HyroxCheckInRow }> {
  const weekNumber = resolveLiveCheckInWeekNumber(params.athlete, params.programme);
  const { completed, planned, programmeWeekId } = sessionCountsForWeek(
    params.programme,
    weekNumber
  );

  if (!params.programme.programmeStartDate || planned === 0) {
    throw new Error("CHECK_IN_LOCKED");
  }

  const existing = await fetchCheckInForWeek(supabase, params.athlete.id, weekNumber);
  if (isSubmitted(existing)) {
    throw new Error("CHECK_IN_ALREADY_SUBMITTED");
  }

  const now = new Date().toISOString();
  const payload = {
    athlete_id: params.athlete.id,
    programme_week_id: programmeWeekId,
    week_number: weekNumber,
    sleep: params.input.sleep,
    energy: params.input.energy,
    stress: params.input.stress,
    soreness: params.input.soreness,
    motivation: params.input.recovery,
    bodyweight: params.input.bodyweight ?? null,
    sessions_completed: completed,
    biggest_win: params.input.biggestWin?.trim() || null,
    biggest_struggle: params.input.biggestStruggle?.trim() || null,
    pain_niggles: params.input.painNiggles?.trim() || null,
    next_week_availability: params.input.nextWeekAvailability?.trim() || null,
    raw_answers: { recovery: params.input.recovery } as Record<string, unknown>,
    status: "submitted" as const,
    submitted_at: now,
    updated_at: now,
  };

  let row: HyroxCheckInRow;
  if (existing?.id) {
    const { data, error } = await supabase
      .from("hyrox_check_ins")
      .update(payload)
      .eq("id", existing.id)
      .eq("athlete_id", params.athlete.id)
      .select(CHECK_IN_SELECT)
      .single();
    if (error || !data) throw new Error(error?.message ?? "Could not save check-in.");
    row = data as HyroxCheckInRow;
  } else {
    const { data, error } = await supabase
      .from("hyrox_check_ins")
      .insert({ ...payload, created_at: now })
      .select(CHECK_IN_SELECT)
      .single();
    if (error || !data) throw new Error(error?.message ?? "Could not save check-in.");
    row = data as HyroxCheckInRow;
  }

  const view = buildAthleteWeeklyCheckInView({
    athlete: params.athlete,
    programme: params.programme,
    row,
    targetWeekNumber: weekNumber,
  });

  return { view, row };
}

export async function fetchCoachCheckInHistory(
  supabase: SupabaseClient,
  athleteId: string,
  limit = 24
): Promise<CoachCheckInListItem[]> {
  const { data, error } = await supabase
    .from("hyrox_check_ins")
    .select(CHECK_IN_SELECT)
    .eq("athlete_id", athleteId)
    .not("submitted_at", "is", null)
    .order("week_number", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return ((data as HyroxCheckInRow[] | null) ?? []).map((row) => ({
    id: row.id,
    weekNumber: row.week_number ?? 0,
    submittedAt: row.submitted_at,
    status: row.status,
    sleep: row.sleep,
    energy: row.energy,
    stress: row.stress,
    soreness: row.soreness,
    bodyweight: row.bodyweight != null ? Number(row.bodyweight) : null,
    painNiggles: row.pain_niggles,
    biggestWin: row.biggest_win,
    biggestStruggle: row.biggest_struggle,
    nextWeekAvailability: row.next_week_availability,
  }));
}

export function formatSubmittedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** @deprecated use sessionCountsForWeek */
export function countWeekSessions(sessions: HyroxProgrammeSessionRow[]): {
  completed: number;
  planned: number;
} {
  return {
    planned: sessions.length,
    completed: sessions.filter((s) => s.status === "completed").length,
  };
}
