/**
 * Admin-only community programme refresh (paid app) — service role lookups + regenerate.
 */

import { generatePaidCommunityProgramme } from "@/app/lib/communityProgrammeGeneration";
import {
  getUnlockedWeekCount,
  getUnlockedWeeksForMembership,
  isMembershipActive,
  MEMBERSHIP_ACCESS_SELECT,
  type MembershipForAccess,
} from "@/app/lib/membershipAccess";
import {
  mapAssessmentToProgrammeInput,
  type AthleteAssessmentRowForProgramme,
  type BenchmarkTestRowForProgramme,
} from "@/app/lib/mapAssessmentToProgrammeInput";
import { fetchCommunityProgrammeInstance } from "@/app/lib/communityProgrammeStatus";
import { hasMeaningfulPlanJson } from "@/app/lib/programmePlan";
import {
  assessmentUpdatedAfterProgramme,
  maxIsoTimestamp,
  resolveProgrammeGeneratedAt,
} from "@/app/lib/programmeRefreshStatus";
import { createServiceRoleClient } from "@/app/lib/supabaseAdmin";
import { findAuthUserIdByEmail } from "@/app/lib/whopMembershipSync";
import type { SupabaseClient } from "@supabase/supabase-js";

export const REFRESH_CONFIRM_TOKEN = "REFRESH";

export type MemberRefreshLookup = {
  userId: string;
  email: string;
  membership: {
    status: string | null;
    active: boolean;
    unlockedWeeks: number[];
    expiresAt: string | null;
  };
  assessment: {
    completed: boolean;
    goalFocus: string | null;
    recent5k: string | null;
    maxHeartRate: number | null;
    trainingDaysPerWeek: number | null;
    weeklyHoursBand: string | null;
    completedAt: string | null;
    updatedAt: string | null;
  };
  programme: {
    hasProgramme: boolean;
    instanceId: string | null;
    currentWeek: number | null;
    weeksWithPlan: number;
    generatedAt: string | null;
    sessionLogCount: number;
    checkInCount: number;
  };
  assessmentChangedSinceProgramme: boolean;
};

export type FullRefreshResult = {
  ok: true;
  programmeInstanceId: string;
  weeksGenerated: number;
  unlockedWeeks: number[];
  replacedExisting: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function lookupMemberForProgrammeRefresh(
  admin: SupabaseClient,
  email: string
): Promise<{ ok: true; data: MemberRefreshLookup } | { ok: false; error: string; status: number }> {
  const normalized = normalizeEmail(email);
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: "Enter a valid email address.", status: 400 };
  }

  const lookup = await findAuthUserIdByEmail(admin, normalized);
  if (!lookup.ok || !lookup.userId) {
    return { ok: false, error: "No auth user found for that email.", status: 404 };
  }

  const userId = lookup.userId;

  const [{ data: membership }, { data: assessment }, instance, { data: profile }] =
    await Promise.all([
      admin.from("memberships").select(MEMBERSHIP_ACCESS_SELECT).eq("user_id", userId).maybeSingle(),
      admin.from("athlete_assessments").select("*").eq("user_id", userId).maybeSingle(),
      fetchCommunityProgrammeInstance(admin, userId),
      admin.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    ]);

  const membershipRow = membership as MembershipForAccess | null;
  const typedAssessment = assessment as AthleteAssessmentRowForProgramme | null;
  const typedInstance = instance;

  let weeksRaw: {
    week_number: number;
    plan_json: unknown;
    updated_at?: string | null;
    created_at?: string | null;
  }[] = [];

  if (typedInstance?.id) {
    const { data: weekRows } = await admin
      .from("programme_weeks")
      .select("week_number, plan_json, created_at")
      .eq("programme_instance_id", typedInstance.id)
      .order("week_number", { ascending: true });
    weeksRaw = (weekRows ?? []) as typeof weeksRaw;
  }

  const [{ count: sessionLogCount }, { count: checkInCount }] = await Promise.all([
    typedInstance?.id
      ? admin
          .from("session_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("programme_instance_id", typedInstance.id)
      : Promise.resolve({ count: 0 }),
    typedInstance?.id
      ? admin
          .from("weekly_check_ins")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("programme_instance_id", typedInstance.id)
      : Promise.resolve({ count: 0 }),
  ]);

  let weeksMaxUpdatedAt: string | null = null;
  let weeksWithPlan = 0;
  for (const w of weeksRaw) {
    if (!hasMeaningfulPlanJson(w.plan_json)) continue;
    weeksWithPlan += 1;
    weeksMaxUpdatedAt = maxIsoTimestamp([weeksMaxUpdatedAt, w.created_at]);
  }

  const programmeGeneratedAt = resolveProgrammeGeneratedAt({
    weeksMaxUpdatedAt,
    instanceUpdatedAt: null,
    instanceCreatedAt: typedInstance?.created_at ?? null,
  });

  const assessmentUpdatedAt =
    (typedAssessment as { updated_at?: string | null } | null)?.updated_at ??
    typedAssessment?.completed_at ??
    null;

  const hasProgramme = Boolean(typedInstance?.id && weeksWithPlan > 0);
  const assessmentChangedSinceProgramme =
    hasProgramme &&
    assessmentUpdatedAfterProgramme(assessmentUpdatedAt, programmeGeneratedAt);

  void profile;

  return {
    ok: true,
    data: {
      userId,
      email: normalized,
      membership: {
        status: membershipRow?.status ?? null,
        active: isMembershipActive(membershipRow),
        unlockedWeeks: getUnlockedWeeksForMembership(membershipRow),
        expiresAt: membershipRow?.expires_at ?? null,
      },
      assessment: {
        completed: Boolean(typedAssessment?.completed_at),
        goalFocus: typedAssessment?.goal_focus ?? null,
        recent5k: typedAssessment?.recent_5k_time ?? null,
        maxHeartRate: typedAssessment?.max_heart_rate ?? null,
        trainingDaysPerWeek: typedAssessment?.training_days_per_week ?? null,
        weeklyHoursBand: typedAssessment?.weekly_hours_band ?? null,
        completedAt: typedAssessment?.completed_at ?? null,
        updatedAt: (typedAssessment as { updated_at?: string | null } | null)?.updated_at ?? null,
      },
      programme: {
        hasProgramme,
        instanceId: typedInstance?.id ?? null,
        currentWeek: typedInstance?.current_week ?? null,
        weeksWithPlan,
        generatedAt: programmeGeneratedAt,
        sessionLogCount: sessionLogCount ?? 0,
        checkInCount: checkInCount ?? 0,
      },
      assessmentChangedSinceProgramme,
    },
  };
}

/**
 * Full regenerate: same engine + storage as member generate-programme; replaces all 12 week plans.
 * Preserves session_logs, weekly_check_ins, habits, membership, benchmarks (re-links instance).
 */
export async function fullRegenerateMemberProgramme(
  admin: SupabaseClient,
  userId: string
): Promise<
  { ok: true; result: FullRefreshResult } | { ok: false; error: string; status: number }
> {
  const { data: assessment, error: assessErr } = await admin
    .from("athlete_assessments")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (assessErr) {
    console.error("[programme refresh] assessment fetch failed", assessErr.message);
    return { ok: false, error: "Could not load assessment.", status: 500 };
  }

  const typedAssessment = assessment as AthleteAssessmentRowForProgramme | null;
  if (!typedAssessment?.completed_at) {
    return {
      ok: false,
      error: "Assessment is not complete. Member must finish assessment before refresh.",
      status: 400,
    };
  }

  const { data: membership } = await admin
    .from("memberships")
    .select(MEMBERSHIP_ACCESS_SELECT)
    .eq("user_id", userId)
    .maybeSingle();
  const membershipRow = membership as MembershipForAccess | null;
  const unlockedWeekCount = getUnlockedWeekCount(membershipRow);

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  const { data: testsRaw } = await admin
    .from("benchmark_tests")
    .select("test_type, test_label, test_time, test_value, test_unit, tested_at")
    .eq("user_id", userId)
    .order("tested_at", { ascending: false });

  const { data: authUserData } = await admin.auth.admin.getUserById(userId);
  const email = authUserData?.user?.email ?? null;

  let generatedResult;
  try {
    generatedResult = generatePaidCommunityProgramme({
      assessment: typedAssessment,
      benchmarkTests: (testsRaw ?? []) as BenchmarkTestRowForProgramme[],
      email,
      profile: profile as { full_name: string | null } | null,
      userId,
    });
  } catch (e) {
    console.error("[programme refresh] generate failed", e);
    return { ok: false, error: "Programme generation failed.", status: 500 };
  }

  const generated = generatedResult.weeks;
  const blueprintInput = mapAssessmentToProgrammeInput({
    assessment: typedAssessment,
    benchmarkTests: (testsRaw ?? []) as BenchmarkTestRowForProgramme[],
    email,
    profile: profile as { full_name: string | null } | null,
  });

  const existingInstance = await fetchCommunityProgrammeInstance(admin, userId);
  const existingId = existingInstance?.id;
  const replacedExisting = Boolean(existingId);

  const programmeInstancePayload = {
    user_id: userId,
    title: "Hybrid365 12-Week Programme",
    current_week: 1,
    goal_focus: blueprintInput.goal_focus,
    ability_level: blueprintInput.ability_level,
    weekly_hours_band: blueprintInput.weekly_hours_band,
  };

  let programmeInstanceId: string;

  if (existingId) {
    programmeInstanceId = existingId;
    const { error: updErr } = await admin
      .from("programme_instances")
      .update({
        title: programmeInstancePayload.title,
        current_week: 1,
        goal_focus: programmeInstancePayload.goal_focus,
        ability_level: programmeInstancePayload.ability_level,
        weekly_hours_band: programmeInstancePayload.weekly_hours_band,
        status: "live",
        unlock_at: null,
        programme_generated_at: new Date().toISOString(),
      })
      .eq("id", programmeInstanceId)
      .eq("user_id", userId);

    if (updErr) {
      console.error("[programme refresh] instance update failed", updErr.message);
      return { ok: false, error: "Could not update programme instance.", status: 500 };
    }
  } else {
    const { data: inserted, error: insErr } = await admin
      .from("programme_instances")
      .insert({
        ...programmeInstancePayload,
        status: "live",
        unlock_at: null,
        programme_generated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insErr || !(inserted as { id?: string } | null)?.id) {
      console.error("[programme refresh] instance insert failed", insErr?.message);
      return { ok: false, error: "Could not create programme instance.", status: 500 };
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

  const { error: upsertErr } = await admin.from("programme_weeks").upsert(weekRows, {
    onConflict: "programme_instance_id,week_number",
  });

  if (upsertErr) {
    console.error("[programme refresh] weeks upsert failed", upsertErr.message);
    return { ok: false, error: "Could not save programme weeks.", status: 500 };
  }

  await admin
    .from("athlete_assessments")
    .update({ programme_instance_id: programmeInstanceId })
    .eq("user_id", userId);

  await admin
    .from("benchmark_tests")
    .update({ programme_instance_id: programmeInstanceId })
    .eq("user_id", userId)
    .is("programme_instance_id", null);

  return {
    ok: true,
    result: {
      ok: true,
      programmeInstanceId,
      weeksGenerated: 12,
      unlockedWeeks: getUnlockedWeeksForMembership(membershipRow),
      replacedExisting,
    },
  };
}

export function createAdminClientOrError():
  | { ok: true; client: SupabaseClient }
  | { ok: false; error: string } {
  try {
    return { ok: true, client: createServiceRoleClient() };
  } catch {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is not configured." };
  }
}
