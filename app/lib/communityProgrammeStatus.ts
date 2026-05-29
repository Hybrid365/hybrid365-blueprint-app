/**
 * Community / paid dashboard programme readiness (not Hyrox Team).
 * Keeps /dashboard and /dashboard/programme in sync on instance lookup + plan detection.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { hasMeaningfulPlanJson } from "@/app/lib/programmePlan";
import type { ProgrammeWeekLike } from "@/app/lib/progressMetrics";

export type CommunityProgrammeInstanceRow = {
  id: string;
  title: string | null;
  current_week?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type WeekPlanRow = { plan_json?: unknown | null; is_unlocked?: boolean | null };

/** Latest programme_instances row for a member (avoids maybeSingle() failing when duplicates exist). */
export async function fetchCommunityProgrammeInstance(
  supabase: SupabaseClient,
  userId: string
): Promise<CommunityProgrammeInstanceRow | null> {
  const { data, error } = await supabase
    .from("programme_instances")
    .select("id, title, current_week, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    console.warn("[community programme] instance fetch failed", error.message);
    return null;
  }

  const row = (data ?? [])[0] as CommunityProgrammeInstanceRow | undefined;
  return row?.id ? row : null;
}

/** True when stored plan_json has a non-empty schedule (raw DB or member-facing week rows). */
export function resolveCommunityProgrammeGenerated(
  programmeInstanceId: string | null | undefined,
  weeksRaw: readonly WeekPlanRow[],
  displayWeeks?: readonly ProgrammeWeekLike[]
): boolean {
  if (!programmeInstanceId) return false;

  if (weeksRaw.some((w) => hasMeaningfulPlanJson(w.plan_json))) {
    return true;
  }

  if (displayWeeks?.some((w) => hasMeaningfulPlanJson(w.plan_json))) {
    return true;
  }

  return false;
}

/** Member-facing gate: at least one unlocked week with sessions (matches dashboard session list). */
export function communityProgrammeHasUnlockedSchedule(
  programmeInstanceId: string | null | undefined,
  displayWeeks: readonly ProgrammeWeekLike[]
): boolean {
  if (!programmeInstanceId) return false;
  return displayWeeks.some(
    (w) => Boolean(w.is_unlocked) && hasMeaningfulPlanJson(w.plan_json)
  );
}
