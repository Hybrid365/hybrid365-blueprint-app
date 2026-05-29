import { getDashboardSession } from "@/app/lib/dashboardAuth";
import {
  applyMembershipEntitlementToWeeks,
  MEMBERSHIP_ACCESS_SELECT,
  type MembershipForAccess,
} from "@/app/lib/membershipAccess";
import {
  fetchCommunityProgrammeInstance,
  resolveCommunityProgrammeGenerated,
} from "@/app/lib/communityProgrammeStatus";
import { hybridAthleteDisplayName } from "@/app/lib/displayName";
import { buildBenchmarkSnapshot } from "@/app/lib/dashboardWeekTracking";
import {
  buildRecoveryTrends,
  buildTwelveProgrammeWeeks,
  calculateAverageRpe,
  calculateBodyweightTrend,
  calculateKeySessionCompletion,
  calculateSessionAdherence,
  deriveEffectiveCurrentWeek,
  getLatestCheckIn,
  groupBenchmarkTests,
  strengthBenchmarksLogged,
  type BenchmarkTestLike,
  type ProgrammeWeekLike,
  type SessionLogLike,
  type WeeklyCheckInLike,
} from "@/app/lib/progressMetrics";
import ProgressClient from "./ProgressClient";

type ProgrammeWeekRow = {
  week_number: number;
  title: string | null;
  is_unlocked: boolean | null;
  plan_json: unknown | null;
};

type SessionLogRow = SessionLogLike & {
  id: string;
  session_title: string | null;
  session_day: string | null;
  completed_at: string | null;
  notes: string | null;
};

type WeeklyCheckInRow = WeeklyCheckInLike & {
  id: string;
  adherence_score: number | null;
  biggest_win: string | null;
  biggest_struggle: string | null;
  pain_or_injury: string | null;
  notes: string | null;
};

type BenchmarkTestRow = BenchmarkTestLike & {
  test_label: string | null;
  week_number: number | null;
  test_phase: string | null;
  notes: string | null;
  bodyweight_kg: number | null;
};

export default async function ProgressPage() {
  const { supabase, user } = await getDashboardSession("/dashboard/progress");

  const [{ data: profileRow }, { data: assessName }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("athlete_assessments").select("first_name").eq("user_id", user.id).maybeSingle(),
  ]);
  const viewerDisplayName = hybridAthleteDisplayName({
    assessmentFirstName: (assessName as { first_name?: string | null } | null)?.first_name,
    profileFullName: (profileRow as { full_name: string | null } | null)?.full_name,
    email: user.email,
  });

  const typedInstance = await fetchCommunityProgrammeInstance(supabase, user.id);

  let weeksRaw: ProgrammeWeekRow[] = [];
  let sessionLogs: SessionLogRow[] = [];
  let checkIns: WeeklyCheckInRow[] = [];
  let benchmarks: BenchmarkTestRow[] = [];

  if (typedInstance?.id) {
    const { data: weekRows } = await supabase
      .from("programme_weeks")
      .select("week_number, title, is_unlocked, plan_json")
      .eq("programme_instance_id", typedInstance.id)
      .order("week_number", { ascending: true });

    weeksRaw = (weekRows ?? []) as ProgrammeWeekRow[];

    const { data: logs } = await supabase
      .from("session_logs")
      .select(
        "id, week_number, session_key, session_title, session_day, completed, completed_at, rpe, notes"
      )
      .eq("user_id", user.id)
      .eq("programme_instance_id", typedInstance.id)
      .gte("week_number", 1)
      .lte("week_number", 12);

    sessionLogs = (logs ?? []) as SessionLogRow[];

    const { data: ci } = await supabase
      .from("weekly_check_ins")
      .select(
        "id, week_number, bodyweight_kg, sleep_hours, energy_score, recovery_score, stress_score, motivation_score, adherence_score, biggest_win, biggest_struggle, pain_or_injury, notes, submitted_at"
      )
      .eq("user_id", user.id)
      .eq("programme_instance_id", typedInstance.id)
      .order("week_number", { ascending: true });

    checkIns = (ci ?? []) as WeeklyCheckInRow[];

    const { data: bench } = await supabase
      .from("benchmark_tests")
      .select("*")
      .eq("user_id", user.id)
      .order("tested_at", { ascending: false });

    benchmarks = (bench ?? []) as BenchmarkTestRow[];
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select(MEMBERSHIP_ACCESS_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();

  const membershipRow = membership as MembershipForAccess | null;
  const entitledWeeksRaw = applyMembershipEntitlementToWeeks(weeksRaw, membershipRow);
  const weeks12: ProgrammeWeekLike[] = buildTwelveProgrammeWeeks(entitledWeeksRaw);

  const programmeGenerated = resolveCommunityProgrammeGenerated(
    typedInstance?.id ?? null,
    weeksRaw,
    weeks12
  );

  const effectiveWeek = deriveEffectiveCurrentWeek(typedInstance?.current_week ?? null, weeks12);

  const adherence = calculateSessionAdherence(sessionLogs, weeks12, effectiveWeek);
  const keySessions = calculateKeySessionCompletion(sessionLogs, weeks12);
  const bodyweightTrend = calculateBodyweightTrend(checkIns);
  const avgRpe = calculateAverageRpe(sessionLogs);
  const groupedBenchmarks = groupBenchmarkTests(benchmarks);
  const hasStrengthBenchmarks = strengthBenchmarksLogged(benchmarks);
  const recoveryTrends = buildRecoveryTrends(checkIns);
  const latestCheckIn = getLatestCheckIn(checkIns);
  const latestBodyweightKg =
    latestCheckIn?.bodyweight_kg != null && Number.isFinite(Number(latestCheckIn.bodyweight_kg))
      ? Number(latestCheckIn.bodyweight_kg)
      : bodyweightTrend.latestKg;

  const programmeTitle = typedInstance?.title?.trim() || "Your Hybrid365 programme";
  const benchmarkSnapshot = buildBenchmarkSnapshot(benchmarks);

  return (
    <ProgressClient
      email={user.email ?? ""}
      programmeInstanceId={typedInstance?.id ?? null}
      programmeGenerated={programmeGenerated}
      programmeTitle={programmeTitle}
      viewerDisplayName={viewerDisplayName}
      weeks={weeks12}
      effectiveWeek={effectiveWeek}
      adherence={adherence}
      keySessions={keySessions}
      bodyweightTrend={bodyweightTrend}
      avgRpe={avgRpe}
      groupedBenchmarks={groupedBenchmarks}
      hasStrengthBenchmarks={hasStrengthBenchmarks}
      recoveryTrends={recoveryTrends}
      checkInsSubmitted={checkIns.length}
      latestBodyweightKg={latestBodyweightKg}
      benchmarkSnapshot={benchmarkSnapshot}
    />
  );
}
