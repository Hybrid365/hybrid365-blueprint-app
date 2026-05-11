import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { hasMeaningfulPlanJson } from "@/app/lib/programmePlan";
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
  type BenchmarkTestLike,
  type ProgrammeWeekLike,
  type SessionLogLike,
  type WeeklyCheckInLike,
} from "@/app/lib/progressMetrics";
import ProgressClient from "./ProgressClient";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/progress");
  }

  const { data: instance } = await supabase
    .from("programme_instances")
    .select("id, title, current_week")
    .eq("user_id", user.id)
    .maybeSingle();

  const typedInstance = instance as ProgrammeInstanceRow | null;

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

  const weeks12: ProgrammeWeekLike[] = buildTwelveProgrammeWeeks(weeksRaw);

  const programmeGenerated =
    Boolean(typedInstance?.id) &&
    weeksRaw.some((w) => hasMeaningfulPlanJson(w.plan_json));

  const effectiveWeek = deriveEffectiveCurrentWeek(typedInstance?.current_week ?? null, weeks12);

  const adherence = calculateSessionAdherence(sessionLogs, weeks12, effectiveWeek);
  const keySessions = calculateKeySessionCompletion(sessionLogs, weeks12);
  const bodyweightTrend = calculateBodyweightTrend(checkIns);
  const avgRpe = calculateAverageRpe(sessionLogs);
  const groupedBenchmarks = groupBenchmarkTests(benchmarks);
  const recoveryTrends = buildRecoveryTrends(checkIns);
  const latestCheckIn = getLatestCheckIn(checkIns);
  const latestBodyweightKg =
    latestCheckIn?.bodyweight_kg != null && Number.isFinite(Number(latestCheckIn.bodyweight_kg))
      ? Number(latestCheckIn.bodyweight_kg)
      : bodyweightTrend.latestKg;

  const programmeTitle = typedInstance?.title?.trim() || "Your Hybrid365 programme";

  return (
    <ProgressClient
      email={user.email ?? ""}
      programmeInstanceId={typedInstance?.id ?? null}
      programmeGenerated={programmeGenerated}
      programmeTitle={programmeTitle}
      weeks={weeks12}
      effectiveWeek={effectiveWeek}
      adherence={adherence}
      keySessions={keySessions}
      bodyweightTrend={bodyweightTrend}
      avgRpe={avgRpe}
      groupedBenchmarks={groupedBenchmarks}
      recoveryTrends={recoveryTrends}
      checkInsSubmitted={checkIns.length}
      latestBodyweightKg={latestBodyweightKg}
    />
  );
}
