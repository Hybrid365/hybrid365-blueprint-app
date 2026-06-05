import { getDashboardSession } from "@/app/lib/dashboardAuth";
import { loadCommunityProgrammeContext } from "@/app/lib/communityProgrammeStatus";
import { loadCommunityAssessmentTrack } from "@/app/lib/loadCommunityAssessmentTrack";
import { MEMBERSHIP_ACCESS_SELECT, type MembershipForAccess } from "@/app/lib/membershipAccess";
import { localDateKey, shiftLocalDateKey, type DailyHabitLogRow } from "@/app/lib/dailyHabitLogs";
import {
  buildTwelveProgrammeWeeks,
  calculateSessionAdherence,
  deriveEffectiveCurrentWeek,
  type SessionLogLike,
} from "@/app/lib/progressMetrics";
import type { CommunityWeeklyCheckInRecord } from "@/app/lib/communityWeeklyCheckIn";
import CheckInClient from "./CheckInClient";

export const dynamic = "force-dynamic";

export default async function CheckInPage() {
  const { supabase, user } = await getDashboardSession("/dashboard/check-in");

  const programmeCtx = await loadCommunityProgrammeContext(supabase, user.id);
  const trackCtx = await loadCommunityAssessmentTrack(supabase, user.id);
  const { instance, weeksRaw, programmeGenerated, entitledWeeks, weeks12 } = programmeCtx;

  let checkIns: CommunityWeeklyCheckInRecord[] = [];
  let habitLogs: DailyHabitLogRow[] = [];
  let completedByWeek: Record<number, { completed: number; total: number }> = {};

  if (instance?.id) {
    const todayYmd = localDateKey(new Date());
    const habitFromYmd = shiftLocalDateKey(todayYmd, -41);

    const [{ data: ci }, { data: habits }, { data: logs }] = await Promise.all([
      supabase
        .from("weekly_check_ins")
        .select(
          "id, week_number, bodyweight_kg, sleep_hours, energy_score, recovery_score, stress_score, motivation_score, adherence_score, biggest_win, biggest_struggle, pain_or_injury, notes, hyrox_checkin_details, submitted_at"
        )
        .eq("user_id", user.id)
        .eq("programme_instance_id", instance.id)
        .order("week_number", { ascending: true }),
      supabase
        .from("daily_habit_logs")
        .select(
          "id, user_id, programme_instance_id, log_date, water_hit, protein_hit, steps_hit, sleep_hit, mobility_hit, proof_posted, notes, created_at, updated_at"
        )
        .eq("user_id", user.id)
        .gte("log_date", habitFromYmd)
        .lte("log_date", todayYmd),
      supabase
        .from("session_logs")
        .select("week_number, session_key, completed, rpe")
        .eq("user_id", user.id)
        .eq("programme_instance_id", instance.id),
    ]);

    checkIns = (ci ?? []) as CommunityWeeklyCheckInRecord[];
    habitLogs = (habits ?? []) as DailyHabitLogRow[];
    const adherence = calculateSessionAdherence(
      (logs ?? []) as SessionLogLike[],
      weeks12,
      deriveEffectiveCurrentWeek(instance.current_week ?? null, weeks12)
    );
    completedByWeek = adherence.completedByWeek;
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select(MEMBERSHIP_ACCESS_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();

  const effectiveWeek = deriveEffectiveCurrentWeek(instance?.current_week ?? null, weeks12);

  return (
    <CheckInClient
      programmeInstanceId={instance?.id ?? null}
      programmeGenerated={programmeGenerated}
      effectiveWeek={effectiveWeek}
      weeks={buildTwelveProgrammeWeeks(
        entitledWeeks.map((w) => ({
          week_number: w.week_number,
          is_unlocked: w.is_unlocked ?? false,
          plan_json: w.plan_json,
        }))
      )}
      membership={membership as MembershipForAccess | null}
      initialCheckIns={checkIns}
      habitLogs={habitLogs}
      completedByWeek={completedByWeek}
      isHyroxTrack={trackCtx.isHyroxTrack}
    />
  );
}
