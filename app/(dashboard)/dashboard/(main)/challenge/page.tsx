import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { localDateKey } from "@/app/lib/dailyHabitLogs";
import type { DailyHabitLogRow } from "@/app/lib/dailyHabitLogs";
import { displayChallengeWeek } from "@/app/lib/hybridChallengeConfig";
import {
  buildLeaderboard,
  getWeeklyTrainingSnapshot,
  leaderboardPublicDisplayName,
  provisionalTotalChallengePoints,
  userRankInLeaderboard,
  baselineChecklist,
  type ChallengeSubmissionRow,
} from "@/app/lib/hybridChallengeMetrics";
import type { SessionLogLike, WeeklyCheckInLike } from "@/app/lib/progressMetrics";
import ChallengeClient from "./ChallengeClient";

type ProgrammeInstanceRow = {
  id: string;
  current_week: number | null;
};

const SUB_SELECT =
  "id, user_id, programme_instance_id, challenge_key, challenge_week, challenge_title, score_value, score_unit, score_time, proof_url, proof_note, status, points_awarded, admin_notes, submitted_at, reviewed_at";

export default async function ChallengePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/challenge");
  }

  const viewerUserId = user.id;
  const viewerEmail = user.email ?? null;

  const { data: instance } = await supabase
    .from("programme_instances")
    .select("id, current_week")
    .eq("user_id", viewerUserId)
    .maybeSingle();

  const typedInstance = instance as ProgrammeInstanceRow | null;
  const programmeInstanceId = typedInstance?.id ?? null;
  const instanceCurrentWeek =
    typeof typedInstance?.current_week === "number" ? typedInstance.current_week : null;
  const programmeWeekForPlan = Math.min(12, Math.max(1, instanceCurrentWeek ?? 1));
  const displayWeek = displayChallengeWeek(instanceCurrentWeek);

  const todayYmd = localDateKey(new Date());
  const from = new Date();
  from.setDate(from.getDate() - 41);
  const fromYmd = localDateKey(from);

  const [weekRow, habitsRes, mineRes, boardRes, sessionsRes, checkRes, benchRes] = await Promise.all([
    programmeInstanceId
      ? supabase
          .from("programme_weeks")
          .select("plan_json")
          .eq("programme_instance_id", programmeInstanceId)
          .eq("week_number", programmeWeekForPlan)
          .maybeSingle()
      : Promise.resolve({ data: null as { plan_json: unknown } | null }),
    supabase
      .from("daily_habit_logs")
      .select(
        "id, user_id, programme_instance_id, log_date, water_hit, protein_hit, steps_hit, sleep_hit, mobility_hit, proof_posted, notes, created_at, updated_at"
      )
      .eq("user_id", viewerUserId)
      .gte("log_date", fromYmd)
      .lte("log_date", todayYmd),
    supabase.from("challenge_submissions").select(SUB_SELECT).eq("user_id", viewerUserId),
    supabase.from("challenge_submissions").select(SUB_SELECT).eq("status", "approved"),
    programmeInstanceId
      ? supabase
          .from("session_logs")
          .select("week_number, session_key, completed")
          .eq("user_id", viewerUserId)
          .eq("programme_instance_id", programmeInstanceId)
      : Promise.resolve({ data: [] as SessionLogLike[] }),
    programmeInstanceId
      ? supabase
          .from("weekly_check_ins")
          .select("week_number, submitted_at")
          .eq("user_id", viewerUserId)
          .eq("programme_instance_id", programmeInstanceId)
      : Promise.resolve({ data: [] as WeeklyCheckInLike[] }),
    supabase.from("benchmark_tests").select("test_type").eq("user_id", viewerUserId),
  ]);

  const habitLogs = (habitsRes.data ?? []) as DailyHabitLogRow[];
  const mySubmissions = (mineRes.data ?? []) as ChallengeSubmissionRow[];
  const leaderboardRows = (boardRes.data ?? []) as ChallengeSubmissionRow[];
  const sessionLogs = (sessionsRes.data ?? []) as SessionLogLike[];
  const weeklyCheckIns = (checkRes.data ?? []) as WeeklyCheckInLike[];
  const benchmarks = (benchRes.data ?? []) as { test_type: string | null }[];

  const weekPlanJson = weekRow.data?.plan_json ?? null;
  const weeklySnap = getWeeklyTrainingSnapshot(programmeWeekForPlan, weekPlanJson, sessionLogs, weeklyCheckIns);
  const prov = provisionalTotalChallengePoints({
    habitLogs,
    todayYmd,
    weeklyCheckIns,
    sessionLogs,
    mySubmissions,
  });

  const leaderboardUserIds = [
    ...new Set(
      leaderboardRows.filter((r) => r.status === "approved").map((r) => r.user_id)
    ),
  ];
  const profileFullByUserId = new Map<string, string | null>();
  const assessmentFirstByUserId = new Map<string, string | null>();

  if (leaderboardUserIds.length > 0) {
    const [profilesRes, assessmentsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", leaderboardUserIds),
      supabase
        .from("athlete_assessments")
        .select("user_id, first_name")
        .in("user_id", leaderboardUserIds),
    ]);

    if (profilesRes.error) {
      console.warn("challenge leaderboard profiles:", profilesRes.error.message);
    } else {
      for (const p of profilesRes.data ?? []) {
        profileFullByUserId.set(p.id as string, (p as { full_name: string | null }).full_name);
      }
    }
    if (assessmentsRes.error) {
      console.warn("challenge leaderboard assessments:", assessmentsRes.error.message);
    } else {
      for (const a of assessmentsRes.data ?? []) {
        const uid = (a as { user_id: string }).user_id;
        const raw = (a as { first_name: string | null }).first_name;
        const trimmed = raw?.trim();
        if (trimmed) assessmentFirstByUserId.set(uid, trimmed);
        else if (!assessmentFirstByUserId.has(uid)) assessmentFirstByUserId.set(uid, null);
      }
    }
  }

  function displayLabelForLeaderboardUser(subjectUserId: string): string {
    return leaderboardPublicDisplayName({
      subjectUserId,
      viewerUserId,
      profileFullName: profileFullByUserId.get(subjectUserId),
      assessmentFirstName: assessmentFirstByUserId.get(subjectUserId),
      viewerEmail,
    });
  }

  const board = buildLeaderboard(leaderboardRows, displayLabelForLeaderboardUser);
  const rank = userRankInLeaderboard(board, viewerUserId);
  const baseline = baselineChecklist(benchmarks);
  const dayLabel = `Day ${Math.min(42, Math.max(1, (displayWeek - 1) * 7 + 1))} / 42`;

  const submissionForDisplayWeek =
    mySubmissions.find((s) => s.challenge_week === displayWeek) ?? null;

  return (
    <ChallengeClient
      userId={viewerUserId}
      programmeInstanceId={programmeInstanceId}
      displayWeek={displayWeek}
      programmeWeekForPlan={programmeWeekForPlan}
      dayLabel={dayLabel}
      weeklySnap={weeklySnap}
      habitLogs={habitLogs}
      todayYmd={todayYmd}
      provisional={prov}
      submissionForDisplayWeek={submissionForDisplayWeek}
      leaderboard={board}
      userRank={rank}
      baseline={baseline}
    />
  );
}
