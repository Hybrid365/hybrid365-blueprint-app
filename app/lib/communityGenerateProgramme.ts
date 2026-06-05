import type { SupabaseClient } from "@supabase/supabase-js";
import {
  countCommunityProgrammeInstances,
  fetchCommunityProgrammeInstance,
} from "@/app/lib/communityProgrammeStatus";
import { computeCommunityProgrammeUnlockAt } from "@/app/lib/communityProgrammeUnlock";
import { generatePaidCommunityProgramme } from "@/app/lib/communityProgrammeGeneration";
import {
  getUnlockedWeekCount,
  getUnlockedWeeksForMembership,
  isMembershipActive,
  type MembershipForAccess,
} from "@/app/lib/membershipAccess";
import {
  mapAssessmentToProgrammeInput,
  type AthleteAssessmentRowForProgramme,
  type BenchmarkTestRowForProgramme,
} from "@/app/lib/mapAssessmentToProgrammeInput";
import { programmeInstanceGoalFocusForHyrox } from "@/app/lib/communityProgrammePreview/hyroxGoalGuardrail";
import { resolveCommunityTrainingTrack } from "@/app/lib/communityProgrammePreview/mapAssessmentToHyroxBuilderInput";

export type CommunityGenerateProgrammeResult =
  | {
      ok: true;
      programmeInstanceId: string;
      weeksGenerated: number;
      unlockedWeeks: number[];
      message: string;
      unlockAt: string | null;
      status: "pending_unlock" | "live";
      hadWeeksAlready: boolean;
    }
  | { ok: false; error: string; status: number };

export async function runCommunityGenerateProgramme(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null }
): Promise<CommunityGenerateProgrammeResult> {
  const { data: membership } = await supabase
    .from("memberships")
    .select("status, expires_at, access_started_at, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const membershipRow = membership as MembershipForAccess | null;
  if (!isMembershipActive(membershipRow)) {
    return { ok: false, error: "Active membership required", status: 403 };
  }

  const unlockedWeekCount = getUnlockedWeekCount(membershipRow);

  const { data: assessment, error: assessErr } = await supabase
    .from("athlete_assessments")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (assessErr) {
    console.error("[generate-programme] assessment fetch:", assessErr);
    return { ok: false, error: "Could not load your assessment.", status: 500 };
  }

  const typedAssessment = assessment as AthleteAssessmentRowForProgramme | null;
  if (!typedAssessment?.completed_at) {
    return {
      ok: false,
      error: "Complete your athlete assessment before generating your programme.",
      status: 400,
    };
  }

  let profile: { full_name: string | null } | null = null;
  const profilesResult = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profilesResult.error) {
    profile = profilesResult.data as { full_name: string | null } | null;
  }

  const { data: testsRaw } = await supabase
    .from("benchmark_tests")
    .select("test_type, test_label, test_time, test_value, test_unit, tested_at")
    .eq("user_id", user.id)
    .order("tested_at", { ascending: false });

  const benchmarkTests = (testsRaw ?? []) as BenchmarkTestRowForProgramme[];

  const trainingTrack = resolveCommunityTrainingTrack(typedAssessment);
  const blueprintInput = mapAssessmentToProgrammeInput({
    assessment: typedAssessment,
    benchmarkTests,
    email: user.email ?? null,
    profile,
  });
  const instanceGoalFocus =
    trainingTrack === "hyrox"
      ? programmeInstanceGoalFocusForHyrox()
      : blueprintInput.goal_focus;

  const existingInstance = await fetchCommunityProgrammeInstance(supabase, user.id);
  const existingId = existingInstance?.id;
  const instanceCount = await countCommunityProgrammeInstances(supabase, user.id);

  console.info("[generate-programme] instance lookup", {
    userId: user.id.slice(0, 8),
    emailDomain: user.email?.includes("@") ? user.email.split("@")[1] : null,
    instanceCount,
    existingId: existingId?.slice(0, 8) ?? null,
  });

  let hadWeeksAlready = false;
  if (existingId) {
    const { data: wc } = await supabase
      .from("programme_weeks")
      .select("week_number")
      .eq("programme_instance_id", existingId)
      .limit(1);
    hadWeeksAlready = (wc ?? []).length > 0;
  }

  let generatedResult;
  try {
    generatedResult = generatePaidCommunityProgramme({
      assessment: typedAssessment,
      benchmarkTests,
      email: user.email ?? null,
      profile,
      userId: user.id,
    });
  } catch (e) {
    console.error("generatePaidCommunityProgramme error:", e);
    return {
      ok: false,
      error: "Unable to generate programme plan. Try again shortly.",
      status: 500,
    };
  }

  const generated = generatedResult.weeks;

  const nowIso = new Date().toISOString();
  const existingUnlockMs = existingInstance?.unlock_at
    ? Date.parse(existingInstance.unlock_at)
    : NaN;
  const pendingUnlockActive =
    existingInstance?.status === "pending_unlock" &&
    Number.isFinite(existingUnlockMs) &&
    existingUnlockMs > Date.now();

  const unlockAt = pendingUnlockActive
    ? existingInstance!.unlock_at!
    : hadWeeksAlready
      ? null
      : computeCommunityProgrammeUnlockAt();
  const instanceStatus =
    pendingUnlockActive ? "pending_unlock" : hadWeeksAlready ? "live" : "pending_unlock";

  const programmeInstancePayload = {
    user_id: user.id,
    title: "Hybrid365 12-Week Programme",
    current_week: 1,
    goal_focus: instanceGoalFocus,
    ability_level: blueprintInput.ability_level,
    weekly_hours_band: blueprintInput.weekly_hours_band,
    status: instanceStatus,
    unlock_at: unlockAt,
    programme_generated_at: nowIso,
  };

  let programmeInstanceId: string;

  if (existingId) {
    programmeInstanceId = existingId;

    const { error: updErr } = await supabase
      .from("programme_instances")
      .update({
        title: programmeInstancePayload.title,
        current_week: programmeInstancePayload.current_week,
        goal_focus: programmeInstancePayload.goal_focus,
        ability_level: programmeInstancePayload.ability_level,
        weekly_hours_band: programmeInstancePayload.weekly_hours_band,
        status: programmeInstancePayload.status,
        unlock_at: programmeInstancePayload.unlock_at,
        programme_generated_at: programmeInstancePayload.programme_generated_at,
      })
      .eq("id", programmeInstanceId)
      .eq("user_id", user.id);

    if (updErr) {
      console.error("programme_instances update:", updErr);
      return {
        ok: false,
        error:
          "Could not save your programme metadata. Verify programme_instances unlock columns (status, unlock_at, programme_generated_at).",
        status: 500,
      };
    }
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from("programme_instances")
      .insert(programmeInstancePayload)
      .select("id")
      .single();

    if (insErr || !(inserted as { id?: string } | null)?.id) {
      console.error("programme_instances insert:", insErr);
      return {
        ok: false,
        error: "Could not create programme instance.",
        status: 500,
      };
    }
    programmeInstanceId = (inserted as { id: string }).id;
  }

  const weekRows = generated.map((week) => ({
    programme_instance_id: programmeInstanceId,
    week_number: week.week_number,
    title: week.title,
    plan_json: week.plan_json as unknown as Record<string, unknown>,
    is_unlocked: week.week_number <= unlockedWeekCount,
  }));

  const { error: upsertErr } = await supabase.from("programme_weeks").upsert(weekRows, {
    onConflict: "programme_instance_id,week_number",
  });

  if (upsertErr) {
    console.error("programme_weeks upsert:", upsertErr);
    return {
      ok: false,
      error: "Could not save programme weeks.",
      status: 500,
    };
  }

  await supabase
    .from("athlete_assessments")
    .update({ programme_instance_id: programmeInstanceId })
    .eq("user_id", user.id);

  await supabase
    .from("benchmark_tests")
    .update({ programme_instance_id: programmeInstanceId })
    .eq("user_id", user.id)
    .is("programme_instance_id", null);

  const message = hadWeeksAlready
    ? "Existing programme updated."
    : "Programme generated — unlocks within 12 hours.";

  console.info("[generate-programme] saved", {
    userId: user.id.slice(0, 8),
    programmeInstanceId: programmeInstanceId.slice(0, 8),
    hadWeeksAlready,
    status: instanceStatus,
    unlockAt,
    trainingTrack: generatedResult.trainingTrack,
    builder: generatedResult.builder,
    weeksGenerated: generated.length,
    totalSessions: generatedResult.totalSessions,
    paceGuidanceCreated: generatedResult.paceGuidanceCreated,
  });

  return {
    ok: true,
    programmeInstanceId,
    weeksGenerated: 12,
    unlockedWeeks: getUnlockedWeeksForMembership(membershipRow),
    message,
    unlockAt,
    status: instanceStatus,
    hadWeeksAlready,
  };
}
