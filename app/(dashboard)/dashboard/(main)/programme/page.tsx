import { getDashboardSession } from "@/app/lib/dashboardAuth";
import {
  applyMembershipEntitlementToWeeks,
  MEMBERSHIP_ACCESS_SELECT,
  type MembershipForAccess,
} from "@/app/lib/membershipAccess";
import { hasMeaningfulPlanJson } from "@/app/lib/programmePlan";
import {
  extractProgrammeIntelligence,
  extractProgrammeRationale,
} from "@/app/lib/memberDashboardSchedule";
import {
  buildTwelveProgrammeWeeks,
  calculateSessionAdherence,
  deriveEffectiveCurrentWeek,
  type ProgrammeWeekLike,
} from "@/app/lib/progressMetrics";
import { getDefaultSelectedWeek } from "@/app/lib/programmePageMetrics";
import {
  assessmentUpdatedAfterProgramme,
  maxIsoTimestamp,
  resolveProgrammeGeneratedAt,
} from "@/app/lib/programmeRefreshStatus";
import type { SessionLogLike } from "@/app/lib/progressMetrics";
import ProgrammeClient from "./ProgrammeClient";

type ProgrammeInstanceRow = {
  id: string;
  title: string | null;
  current_week?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProgrammeWeekRow = {
  week_number: number;
  title: string | null;
  is_unlocked: boolean | null;
  plan_json: unknown | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SessionLogRow = SessionLogLike & {
  id: string;
  session_title: string | null;
  session_day: string | null;
  completed_at: string | null;
  notes: string | null;
};

type WeeklyCheckInRow = {
  week_number: number;
};

type AthleteAssessmentRow = {
  completed_at: string | null;
  max_heart_rate?: number | null;
  updated_at?: string | null;
};

export default async function ProgrammePage() {
  const { supabase, user } = await getDashboardSession("/dashboard/programme");

  const [{ data: assess }, { data: benchTests }] = await Promise.all([
    supabase
      .from("athlete_assessments")
      .select("completed_at, max_heart_rate, updated_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("benchmark_tests").select("test_type").eq("user_id", user.id),
  ]);
  const typedAssess = assess as AthleteAssessmentRow | null;
  const assessmentCompleted = Boolean(typedAssess?.completed_at);
  const maxHeartRate =
    typedAssess?.max_heart_rate != null && Number.isFinite(typedAssess.max_heart_rate)
      ? typedAssess.max_heart_rate
      : null;
  const hasEngineBenchmark = (benchTests ?? []).some((t) => {
    const ty = String((t as { test_type?: string }).test_type ?? "").toLowerCase();
    return ty.includes("ski") || ty.includes("row");
  });

  const { data: instance } = await supabase
    .from("programme_instances")
    .select("id, title, current_week, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const typedInstance = instance as ProgrammeInstanceRow | null;

  let weeksRaw: ProgrammeWeekRow[] = [];
  let sessionLogs: SessionLogRow[] = [];
  const checkInsByWeek: Record<number, boolean> = {};

  if (typedInstance?.id) {
    const { data: weekRows } = await supabase
      .from("programme_weeks")
      .select("week_number, title, is_unlocked, plan_json, created_at, updated_at")
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

    const { data: cis } = await supabase
      .from("weekly_check_ins")
      .select("week_number")
      .eq("user_id", user.id)
      .eq("programme_instance_id", typedInstance.id);

    for (const row of cis ?? []) {
      const w = (row as WeeklyCheckInRow).week_number;
      if (typeof w === "number" && w >= 1 && w <= 12) checkInsByWeek[w] = true;
    }
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select(MEMBERSHIP_ACCESS_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();

  const membershipRow = membership as MembershipForAccess | null;
  const entitledWeeksRaw = applyMembershipEntitlementToWeeks(weeksRaw, membershipRow);
  const weeks12: ProgrammeWeekLike[] = buildTwelveProgrammeWeeks(entitledWeeksRaw);

  const programmeGenerated =
    Boolean(typedInstance?.id) &&
    weeksRaw.some((w) => hasMeaningfulPlanJson(w.plan_json));

  let weeksMaxUpdatedAt: string | null = null;
  for (const w of weeksRaw) {
    if (!hasMeaningfulPlanJson(w.plan_json)) continue;
    weeksMaxUpdatedAt = maxIsoTimestamp([
      weeksMaxUpdatedAt,
      w.updated_at,
      w.created_at,
    ]);
  }

  const programmeGeneratedAt = resolveProgrammeGeneratedAt({
    weeksMaxUpdatedAt,
    instanceUpdatedAt: typedInstance?.updated_at ?? null,
    instanceCreatedAt: typedInstance?.created_at ?? null,
  });

  const assessmentUpdatedAt =
    typedAssess?.updated_at ?? typedAssess?.completed_at ?? null;
  const assessmentChangedSinceProgramme =
    programmeGenerated &&
    assessmentUpdatedAfterProgramme(assessmentUpdatedAt, programmeGeneratedAt);

  const effectiveWeek = deriveEffectiveCurrentWeek(typedInstance?.current_week ?? null, weeks12);
  const adherence = calculateSessionAdherence(sessionLogs, weeks12, effectiveWeek);
  const defaultSelectedWeek = getDefaultSelectedWeek(typedInstance?.current_week ?? null, weeks12);

  const week1Plan = weeks12.find((w) => w.week_number === 1)?.plan_json ?? null;
  const programmeRationale = extractProgrammeRationale(week1Plan);
  const programmeIntelligence = extractProgrammeIntelligence(week1Plan);

  const rawByWeek = new Map(entitledWeeksRaw.map((r) => [r.week_number, r]));
  const weeksPayload = weeks12.map((w) => {
    const r = rawByWeek.get(w.week_number);
    return {
      week_number: w.week_number,
      title: r?.title ?? null,
      is_unlocked: w.is_unlocked,
      plan_json: w.plan_json,
    };
  });

  const programmeTitle = typedInstance?.title?.trim() || "Your Hybrid365 programme";

  return (
    <ProgrammeClient
      programmeInstanceId={typedInstance?.id ?? null}
      programmeTitle={programmeTitle}
      programmeGenerated={programmeGenerated}
      assessmentCompleted={assessmentCompleted}
      effectiveWeek={effectiveWeek}
      defaultSelectedWeek={defaultSelectedWeek}
      unlockedCount={weeks12.filter((w) => w.is_unlocked).length}
      completionPercentage={adherence.unlockedPercentage}
      completedUnlocked={adherence.completedUnlocked}
      totalUnlockedSlots={adherence.totalUnlockedSlots}
      completedByWeek={adherence.completedByWeek}
      weeksFromDb={weeksPayload}
      initialSessionLogs={sessionLogs}
      checkInsByWeek={checkInsByWeek}
      programmeRationale={programmeRationale}
      programmeIntelligence={programmeIntelligence}
      maxHeartRate={maxHeartRate}
      hasEngineBenchmark={hasEngineBenchmark}
      assessmentChangedSinceProgramme={assessmentChangedSinceProgramme}
    />
  );
}
