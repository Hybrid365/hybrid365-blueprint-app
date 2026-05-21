import { getDashboardSession } from "@/app/lib/dashboardAuth";
import {
  applyMembershipEntitlementToWeeks,
  MEMBERSHIP_ACCESS_SELECT,
  type MembershipForAccess,
} from "@/app/lib/membershipAccess";
import { hasMeaningfulPlanJson } from "@/app/lib/programmePlan";
import { countCoreBaselineAreas } from "@/app/lib/benchmarkCoreAreas";
import {
  buildChallengeTrackingSummary,
  buildDashboardWeekTrackingSummary,
} from "@/app/lib/dashboardWeekTracking";
import { localDateKey, shiftLocalDateKey, type DailyHabitLogRow } from "@/app/lib/dailyHabitLogs";
import { hybridAthleteDisplayName } from "@/app/lib/displayName";
import type { ChallengeSubmissionRow } from "@/app/lib/hybridChallengeMetrics";
import {
  buildTwelveProgrammeWeeks,
  deriveEffectiveCurrentWeek,
  type BenchmarkTestLike,
} from "@/app/lib/progressMetrics";
import MemberDashboardClient, {
  type WeekPayload,
} from "./MemberDashboardClient";

type ProgrammeInstanceRow = {
  id: string;
  title: string | null;
  current_week?: number | null;
};

type ProgrammeWeekRow = {
  week_number: number;
  title: string | null;
  is_unlocked: boolean | null;
  plan_json: unknown | null;
};

type SessionLogRow = {
  id: string;
  week_number: number;
  session_key: string;
  session_title: string | null;
  session_day: string | null;
  completed: boolean;
  completed_at: string | null;
  rpe: number | null;
  notes: string | null;
};

type WeeklyCheckInRow = {
  id: string;
  week_number: number;
  bodyweight_kg: number | null;
  sleep_hours: number | null;
  energy_score: number | null;
  recovery_score: number | null;
  stress_score: number | null;
  motivation_score: number | null;
  adherence_score: number | null;
  biggest_win: string | null;
  biggest_struggle: string | null;
  pain_or_injury: string | null;
  notes: string | null;
  submitted_at: string | null;
};

type AthleteAssessmentRow = {
  id: string;
  completed_at: string | null;
  first_name?: string | null;
};

type BenchmarkTestRow = BenchmarkTestLike & {
  id: string;
};

export default async function DashboardPage() {
  const { supabase, user } = await getDashboardSession("/dashboard");

  const [{ data: profileRow }, { data: assessGlobal }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("athlete_assessments").select("id, completed_at, first_name").eq("user_id", user.id).maybeSingle(),
  ]);
  const typedAssessGlobal = assessGlobal as AthleteAssessmentRow | null;
  const assessmentCompleted = Boolean(typedAssessGlobal?.completed_at);
  const viewerDisplayName = hybridAthleteDisplayName({
    assessmentFirstName: typedAssessGlobal?.first_name,
    profileFullName: (profileRow as { full_name: string | null } | null)?.full_name,
    email: user.email,
  });

  const { data: allCoreTests } = await supabase
    .from("benchmark_tests")
    .select("test_type")
    .eq("user_id", user.id);
  const typedAllTests = (allCoreTests ?? []) as BenchmarkTestRow[];
  const coreTestsLogged = countCoreBaselineAreas(typedAllTests);

  const { data: instance } = await supabase
    .from("programme_instances")
    .select("id, title, current_week")
    .eq("user_id", user.id)
    .maybeSingle();

  const typedInstance = instance as ProgrammeInstanceRow | null;

  let weeks: ProgrammeWeekRow[] = [];
  let initialSessionLogs: SessionLogRow[] = [];
  let initialWeeklyCheckIns: WeeklyCheckInRow[] = [];
  let habitLogs: DailyHabitLogRow[] = [];
  let benchmarkTests: BenchmarkTestRow[] = [];
  let challengeSubmissions: ChallengeSubmissionRow[] = [];

  const todayYmd = localDateKey(new Date());
  const habitFromYmd = shiftLocalDateKey(todayYmd, -6);

  if (typedInstance?.id) {
    const { data: weekRows } = await supabase
      .from("programme_weeks")
      .select("week_number, title, is_unlocked, plan_json")
      .eq("programme_instance_id", typedInstance.id)
      .order("week_number", { ascending: true });

    weeks = (weekRows ?? []) as ProgrammeWeekRow[];

    const { data: logs } = await supabase
      .from("session_logs")
      .select(
        "id, week_number, session_key, session_title, session_day, completed, completed_at, rpe, notes"
      )
      .eq("user_id", user.id)
      .eq("programme_instance_id", typedInstance.id)
      .in(
        "week_number",
        weeks.length > 0 ? weeks.map((w) => w.week_number) : [1]
      );
    initialSessionLogs = (logs ?? []) as SessionLogRow[];

    const { data: checkIns } = await supabase
      .from("weekly_check_ins")
      .select(
        "id, week_number, bodyweight_kg, sleep_hours, energy_score, recovery_score, stress_score, motivation_score, adherence_score, biggest_win, biggest_struggle, pain_or_injury, notes, submitted_at"
      )
      .eq("user_id", user.id)
      .eq("programme_instance_id", typedInstance.id)
      .order("week_number", { ascending: true });
    initialWeeklyCheckIns = (checkIns ?? []) as WeeklyCheckInRow[];

    const [{ data: habitRows }, { data: benchRows }, { data: subRows }] = await Promise.all([
      supabase
        .from("daily_habit_logs")
        .select(
          "id, user_id, programme_instance_id, log_date, water_hit, protein_hit, steps_hit, sleep_hit, mobility_hit, proof_posted, notes, created_at, updated_at"
        )
        .eq("user_id", user.id)
        .gte("log_date", habitFromYmd)
        .lte("log_date", todayYmd)
        .order("log_date", { ascending: true }),
      supabase
        .from("benchmark_tests")
        .select("id, test_type, test_time, test_value, test_unit, tested_at")
        .eq("user_id", user.id)
        .order("tested_at", { ascending: false }),
      supabase
        .from("challenge_submissions")
        .select(
          "id, user_id, programme_instance_id, challenge_key, challenge_week, challenge_title, score_value, score_unit, score_time, proof_url, proof_note, status, points_awarded, admin_notes, submitted_at, reviewed_at"
        )
        .eq("user_id", user.id),
    ]);

    habitLogs = (habitRows ?? []) as DailyHabitLogRow[];
    benchmarkTests = (benchRows ?? []) as BenchmarkTestRow[];
    challengeSubmissions = (subRows ?? []) as ChallengeSubmissionRow[];
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select(MEMBERSHIP_ACCESS_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();

  const membershipRow = membership as MembershipForAccess | null;
  const entitledWeeks = applyMembershipEntitlementToWeeks(weeks, membershipRow);

  const programmeTitle =
    typedInstance?.title?.trim() || "Your Hybrid365 programme";

  const weeksFromDb: WeekPayload[] = entitledWeeks.map((w) => ({
    week_number: w.week_number,
    title: w.title ?? null,
    is_unlocked: w.is_unlocked ?? false,
    plan_json: w.plan_json,
  }));

  const instanceCurrentWeek =
    typeof typedInstance?.current_week === "number"
      ? typedInstance.current_week
      : null;

  const programmeGenerated =
    Boolean(typedInstance?.id) &&
    weeks.some((w) => hasMeaningfulPlanJson(w.plan_json));

  const weeks12 = buildTwelveProgrammeWeeks(
    entitledWeeks.map((w) => ({
      week_number: w.week_number,
      is_unlocked: w.is_unlocked ?? false,
      plan_json: w.plan_json,
    }))
  );
  const effectiveWeek = deriveEffectiveCurrentWeek(instanceCurrentWeek, weeks12);
  const challengeTracking =
    programmeGenerated && typedInstance?.id
      ? buildChallengeTrackingSummary({
          habitLogs,
          todayYmd,
          weeklyCheckIns: initialWeeklyCheckIns,
          sessionLogs: initialSessionLogs,
          submissions: challengeSubmissions,
        })
      : null;
  const weekTrackingSummary = programmeGenerated
    ? buildDashboardWeekTrackingSummary({
        weeks: weeks12,
        sessionLogs: initialSessionLogs,
        weeklyCheckIns: initialWeeklyCheckIns,
        effectiveWeek,
        habitLogs,
        challenge: challengeTracking,
        benchmarkTests,
      })
    : null;

  return (
    <MemberDashboardClient
      email={user.email ?? ""}
      viewerDisplayName={viewerDisplayName}
      programmeTitle={programmeTitle}
      membershipExpiresAt={
        membership?.expires_at ? String(membership.expires_at) : null
      }
      instanceCurrentWeek={instanceCurrentWeek}
      programmeInstanceId={typedInstance?.id ?? null}
      weeksFromDb={weeksFromDb}
      initialSessionLogs={initialSessionLogs}
      initialWeeklyCheckIns={initialWeeklyCheckIns}
      assessmentCompleted={assessmentCompleted}
      coreTestsLogged={coreTestsLogged}
      programmeGenerated={programmeGenerated}
      weekTrackingSummary={weekTrackingSummary}
      habitLogs={habitLogs}
      benchmarkTests={benchmarkTests}
      challengeTracking={challengeTracking}
    />
  );
}
