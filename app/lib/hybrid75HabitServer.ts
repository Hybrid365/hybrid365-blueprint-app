import { createServiceRoleClient } from "@/app/lib/supabaseAdmin";
import { isChallengeLoggingConfigured } from "@/app/lib/hybrid75ChallengeLogServer";
import {
  buildHabitSummary,
  buildHabitUpsertRow,
  formatLogDate,
  getWeekStartDate,
  type Hybrid75HabitLog,
  type Hybrid75HabitSummary,
  type Hybrid75HabitUpsertPayload,
} from "@/app/lib/hybrid75HabitLogging";
import {
  buildCheckinUpsertRow,
  type Hybrid75CheckinUpsertPayload,
  type Hybrid75WeeklyCheckin,
} from "@/app/lib/hybrid75CheckinLogging";

export function isHybrid75HabitStorageConfigured(): boolean {
  return isChallengeLoggingConfigured();
}

function getAdminClient() {
  if (!isHybrid75HabitStorageConfigured()) {
    throw new Error("Hybrid 75 habit storage is not configured");
  }
  return createServiceRoleClient();
}

export async function fetchHabitLogsForPlan(
  planId: string,
  fromDate?: string,
  toDate?: string
): Promise<Hybrid75HabitLog[]> {
  const supabase = getAdminClient();
  let query = supabase.from("hybrid75_habit_logs").select("*").eq("plan_id", planId);

  if (fromDate) query = query.gte("log_date", fromDate);
  if (toDate) query = query.lte("log_date", toDate);

  const { data, error } = await query.order("log_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Hybrid75HabitLog[];
}

export async function upsertHabitLog(
  payload: Hybrid75HabitUpsertPayload,
  logDate: string = formatLogDate()
): Promise<Hybrid75HabitLog> {
  const supabase = getAdminClient();
  const row = buildHabitUpsertRow(payload, logDate);

  const { data, error } = await supabase
    .from("hybrid75_habit_logs")
    .upsert(row, { onConflict: "plan_id,habit_key,log_date" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Hybrid75HabitLog;
}

export async function buildHabitSummaryForPlan(
  planId: string,
  referenceDate: Date = new Date()
): Promise<Hybrid75HabitSummary> {
  const weekStart = getWeekStartDate(referenceDate);
  const logs = await fetchHabitLogsForPlan(planId, weekStart);
  return buildHabitSummary(logs, planId, referenceDate);
}

export async function fetchWeeklyCheckin(
  planId: string,
  weekStart?: string
): Promise<Hybrid75WeeklyCheckin | null> {
  const supabase = getAdminClient();
  const resolvedWeekStart = weekStart || getWeekStartDate();

  const { data, error } = await supabase
    .from("hybrid75_weekly_checkins")
    .select("*")
    .eq("plan_id", planId)
    .eq("week_start", resolvedWeekStart)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Hybrid75WeeklyCheckin | null) ?? null;
}

export async function upsertWeeklyCheckin(
  payload: Hybrid75CheckinUpsertPayload
): Promise<Hybrid75WeeklyCheckin> {
  const supabase = getAdminClient();
  const row = buildCheckinUpsertRow(payload);

  const { data, error } = await supabase
    .from("hybrid75_weekly_checkins")
    .upsert(row, { onConflict: "plan_id,week_start" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Hybrid75WeeklyCheckin;
}
