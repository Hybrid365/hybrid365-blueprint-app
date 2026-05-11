import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { localDateKey } from "@/app/lib/dailyHabitLogs";
import type { DailyHabitLogRow } from "@/app/lib/dailyHabitLogs";
import { displayChallengeWeek } from "@/app/lib/hybridChallengeConfig";
import {
  approvedChallengePoints,
  provisionalTotalChallengePoints,
  type ChallengeSubmissionRow,
} from "@/app/lib/hybridChallengeMetrics";
import type { SessionLogLike, WeeklyCheckInLike } from "@/app/lib/progressMetrics";

type InstanceRow = { id: string; current_week: number | null; created_at?: string | null };

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: instance } = await supabase
    .from("programme_instances")
    .select("id, current_week, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const typed = instance as InstanceRow | null;
  const todayYmd = localDateKey(new Date());
  const from = new Date();
  from.setDate(from.getDate() - 41);
  const fromYmd = localDateKey(from);

  const habitsRes = await supabase
    .from("daily_habit_logs")
    .select(
      "id, user_id, programme_instance_id, log_date, water_hit, protein_hit, steps_hit, sleep_hit, mobility_hit, proof_posted, notes, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .gte("log_date", fromYmd)
    .lte("log_date", todayYmd);

  const subsRes = await supabase
    .from("challenge_submissions")
    .select(
      "id, user_id, programme_instance_id, challenge_key, challenge_week, challenge_title, score_value, score_unit, score_time, proof_url, proof_note, status, points_awarded, admin_notes, submitted_at, reviewed_at"
    )
    .eq("user_id", user.id);

  const logsRes = typed?.id
    ? await supabase
        .from("session_logs")
        .select("week_number, session_key, completed")
        .eq("user_id", user.id)
        .eq("programme_instance_id", typed.id)
    : { data: [] as SessionLogLike[] };

  const checkRes = typed?.id
    ? await supabase
        .from("weekly_check_ins")
        .select("week_number, submitted_at")
        .eq("user_id", user.id)
        .eq("programme_instance_id", typed.id)
    : { data: [] as WeeklyCheckInLike[] };

  const habitLogs = (habitsRes.data ?? []) as DailyHabitLogRow[];
  const mySubmissions = (subsRes.data ?? []) as ChallengeSubmissionRow[];
  const sessionLogs = (logsRes.data ?? []) as SessionLogLike[];
  const checkIns = (checkRes.data ?? []) as WeeklyCheckInLike[];

  const cw = displayChallengeWeek(typeof typed?.current_week === "number" ? typed.current_week : null);
  const prov = provisionalTotalChallengePoints({
    habitLogs,
    todayYmd,
    weeklyCheckIns: checkIns,
    sessionLogs,
    mySubmissions,
  });

  return NextResponse.json({
    challengeWeek: cw,
    habitTodayPoints: prov.habitTodayPoints,
    provisionalTotal: prov.total,
    approvedChallengePoints: approvedChallengePoints(mySubmissions),
  });
}
