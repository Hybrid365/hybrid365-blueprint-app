import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { hasMeaningfulPlanJson } from "@/app/lib/programmePlan";
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
};

type BenchmarkTestRow = {
  test_type: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: assessGlobal } = await supabase
    .from("athlete_assessments")
    .select("id, completed_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const typedAssessGlobal = assessGlobal as AthleteAssessmentRow | null;
  const assessmentCompleted = Boolean(typedAssessGlobal?.completed_at);

  const { data: allCoreTests } = await supabase
    .from("benchmark_tests")
    .select("test_type")
    .eq("user_id", user.id);
  const typedAllTests = (allCoreTests ?? []) as BenchmarkTestRow[];
  const coreTypes = new Set([
    "5km time trial",
    "1km SkiErg",
    "1km Row",
    "Bodyweight",
  ]);
  const coreTestsLogged = new Set(
    typedAllTests
      .map((t) => t.test_type)
      .filter((v): v is string => typeof v === "string" && coreTypes.has(v))
  ).size;

  const { data: instance } = await supabase
    .from("programme_instances")
    .select("id, title, current_week")
    .eq("user_id", user.id)
    .maybeSingle();

  const typedInstance = instance as ProgrammeInstanceRow | null;

  let weeks: ProgrammeWeekRow[] = [];
  let initialSessionLogs: SessionLogRow[] = [];
  let initialWeeklyCheckIns: WeeklyCheckInRow[] = [];

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
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("status, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const programmeTitle =
    typedInstance?.title?.trim() || "Your Hybrid365 programme";

  const weeksFromDb: WeekPayload[] = weeks.map((w) => ({
    week_number: w.week_number,
    title: w.title,
    is_unlocked: w.is_unlocked,
    plan_json: w.plan_json,
  }));

  const instanceCurrentWeek =
    typeof typedInstance?.current_week === "number"
      ? typedInstance.current_week
      : null;

  const programmeGenerated =
    Boolean(typedInstance?.id) &&
    weeks.some((w) => hasMeaningfulPlanJson(w.plan_json));

  return (
    <MemberDashboardClient
      email={user.email ?? ""}
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
    />
  );
}
