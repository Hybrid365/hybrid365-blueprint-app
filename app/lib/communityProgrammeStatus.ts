/**
 * Community / paid dashboard programme readiness (not Hyrox Team).
 * Keeps /dashboard and /dashboard/programme in sync on instance lookup + plan detection.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyMembershipEntitlementToWeeks,
  MEMBERSHIP_ACCESS_SELECT,
  type MembershipForAccess,
} from "@/app/lib/membershipAccess";
import {
  resolveCommunityProgrammeUnlockState,
  type CommunityProgrammeUnlockState,
  type ProgrammeInstanceUnlockFields,
} from "@/app/lib/communityProgrammeUnlock";
import { hasMeaningfulPlanJson } from "@/app/lib/programmePlan";
import { buildTwelveProgrammeWeeks, type ProgrammeWeekLike } from "@/app/lib/progressMetrics";

export type CommunityProgrammeInstanceRow = {
  id: string;
  title: string | null;
  current_week?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  unlock_at?: string | null;
  programme_generated_at?: string | null;
};

export type CommunityProgrammeWeekRow = {
  week_number: number;
  title: string | null;
  is_unlocked: boolean | null;
  plan_json: unknown | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type WeekPlanRow = {
  programme_instance_id?: string;
  plan_json?: unknown | null;
  is_unlocked?: boolean | null;
};

export type CommunityProgrammeLoadContext = {
  instance: CommunityProgrammeInstanceRow | null;
  weeksRaw: CommunityProgrammeWeekRow[];
  membership: MembershipForAccess | null;
  /** Canonical gate: raw DB weeks with non-empty plan_json.schedule (before entitlement). */
  programmeGenerated: boolean;
  /** Member can view sessions (unlock passed or legacy live). */
  canViewProgramme: boolean;
  programmePendingUnlock: boolean;
  unlock: CommunityProgrammeUnlockState;
  entitledWeeks: CommunityProgrammeWeekRow[];
  weeks12: ProgrammeWeekLike[];
};

const INSTANCE_SELECT =
  "id, title, current_week, created_at, status, unlock_at, programme_generated_at";

/** Columns that exist on public.programme_weeks (no updated_at on this table). */
export const COMMUNITY_PROGRAMME_WEEKS_SELECT =
  "week_number, title, is_unlocked, plan_json, created_at";

function shouldLogCommunityProgrammeDebug(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.DASHBOARD_PROGRAMME_DEBUG === "1"
  );
}

function redactEmail(email: string | null | undefined): string | null {
  if (!email?.includes("@")) return null;
  const [, domain] = email.split("@");
  return domain ? `*@${domain}` : null;
}

export type CommunityProgrammeLoadDebug = {
  userIdPrefix: string;
  emailDomain: string | null;
  instanceCount: number;
  selectedInstanceId: string | null;
  totalWeekRows: number;
  weeksWithMeaningfulPlan: number;
  programmeGenerated: boolean;
  showGenerateProgramme: boolean;
  reason: string;
};

/**
 * Latest programme_instances row for a member.
 * When duplicates exist, prefers the instance that has generated plan_json weeks.
 */
export async function fetchCommunityProgrammeInstance(
  supabase: SupabaseClient,
  userId: string
): Promise<CommunityProgrammeInstanceRow | null> {
  const { data, error } = await supabase
    .from("programme_instances")
    .select(INSTANCE_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    console.warn("[community programme] instance list failed", {
      userId: userId.slice(0, 8),
      message: error.message,
    });
    return null;
  }

  const instances = (data ?? []) as CommunityProgrammeInstanceRow[];
  if (!instances.length) return null;
  if (instances.length === 1) return instances[0]!;

  const ids = instances.map((i) => i.id);
  const { data: weekRows, error: weeksErr } = await supabase
    .from("programme_weeks")
    .select("programme_instance_id, week_number, plan_json")
    .in("programme_instance_id", ids);

  if (weeksErr) {
    console.warn("[community programme] weeks for instance pick failed", {
      userId: userId.slice(0, 8),
      message: weeksErr.message,
    });
    return instances[0]!;
  }

  const weeksByInstance = new Map<string, WeekPlanRow[]>();
  for (const row of weekRows ?? []) {
    const pid = String((row as WeekPlanRow).programme_instance_id ?? "");
    if (!pid) continue;
    const list = weeksByInstance.get(pid) ?? [];
    list.push(row as WeekPlanRow);
    weeksByInstance.set(pid, list);
  }

  for (const inst of instances) {
    const weeks = weeksByInstance.get(inst.id) ?? [];
    if (resolveCommunityProgrammeGenerated(inst.id, weeks)) {
      console.info("[community programme] resolved instance with generated weeks", {
        userId: userId.slice(0, 8),
        instanceCount: instances.length,
        selectedId: inst.id.slice(0, 8),
      });
      return inst;
    }
  }

  console.info("[community programme] no generated weeks; using latest instance by created_at", {
    userId: userId.slice(0, 8),
    instanceCount: instances.length,
    selectedId: instances[0]!.id.slice(0, 8),
  });
  return instances[0]!;
}

/** Count programme_instances rows for a user (debug / admin). */
export async function countCommunityProgrammeInstances(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("programme_instances")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.warn("[community programme] instance count failed", error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Canonical paid-dashboard programme existence check.
 * Uses raw programme_weeks from DB only (not membership-stripped display weeks).
 */
export function resolveCommunityProgrammeGenerated(
  programmeInstanceId: string | null | undefined,
  weeksRaw: readonly WeekPlanRow[]
): boolean {
  if (!programmeInstanceId) return false;
  return weeksRaw.some((w) => hasMeaningfulPlanJson(w.plan_json));
}

/** @deprecated alias — use resolveCommunityProgrammeGenerated */
export const communityProgrammeExists = resolveCommunityProgrammeGenerated;

export function countMeaningfulCommunityWeeks(
  weeksRaw: readonly WeekPlanRow[]
): number {
  return weeksRaw.filter((w) => hasMeaningfulPlanJson(w.plan_json)).length;
}

export async function loadCommunityProgrammeWeeks(
  supabase: SupabaseClient,
  programmeInstanceId: string
): Promise<CommunityProgrammeWeekRow[]> {
  const { data, error } = await supabase
    .from("programme_weeks")
    .select(COMMUNITY_PROGRAMME_WEEKS_SELECT)
    .eq("programme_instance_id", programmeInstanceId)
    .order("week_number", { ascending: true });

  if (error) {
    console.warn("[community programme] weeks load failed", {
      programmeInstanceId: programmeInstanceId.slice(0, 8),
      message: error.message,
    });
    return [];
  }

  return (data ?? []) as CommunityProgrammeWeekRow[];
}

/** Shared instance + weeks + existence gate for /dashboard and /dashboard/programme. */
export async function loadCommunityProgrammeContext(
  supabase: SupabaseClient,
  userId: string
): Promise<CommunityProgrammeLoadContext> {
  const instance = await fetchCommunityProgrammeInstance(supabase, userId);

  let weeksRaw: CommunityProgrammeWeekRow[] = [];
  if (instance?.id) {
    weeksRaw = await loadCommunityProgrammeWeeks(supabase, instance.id);
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select(MEMBERSHIP_ACCESS_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  const membershipRow = membership as MembershipForAccess | null;

  const programmeGenerated = resolveCommunityProgrammeGenerated(instance?.id ?? null, weeksRaw);
  const unlock = resolveCommunityProgrammeUnlockState(instance, programmeGenerated);
  const canViewProgramme = programmeGenerated && unlock.canViewProgramme;

  const entitledWeeksBase = applyMembershipEntitlementToWeeks(weeksRaw, membershipRow);
  const entitledWeeks = canViewProgramme
    ? entitledWeeksBase
    : entitledWeeksBase.map((w) => ({
        ...w,
        plan_json: null,
      }));

  const weeks12 = buildTwelveProgrammeWeeks(
    entitledWeeks.map((w) => ({
      week_number: w.week_number,
      is_unlocked: canViewProgramme ? (w.is_unlocked ?? false) : false,
      plan_json: w.plan_json,
    }))
  );

  return {
    instance,
    weeksRaw,
    membership: membershipRow,
    programmeGenerated,
    canViewProgramme,
    programmePendingUnlock: unlock.programmePendingUnlock,
    unlock,
    entitledWeeks,
    weeks12,
  };
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

/** Server-side debug for paid dashboard programme load (no full email in logs). */
export async function logCommunityProgrammeLoadDebug(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined,
  route: string,
  instance: CommunityProgrammeInstanceRow | null,
  weeksRaw: readonly WeekPlanRow[],
  programmeGenerated: boolean
): Promise<void> {
  if (!shouldLogCommunityProgrammeDebug()) return;

  const instanceCount = await countCommunityProgrammeInstances(supabase, userId);
  const weeksWithMeaningfulPlan = weeksRaw.filter((w) =>
    hasMeaningfulPlanJson(w.plan_json)
  ).length;

  let reason: string;
  if (!instance?.id) {
    reason = instanceCount > 0 ? "instance_query_returned_null" : "no_programme_instance";
  } else if (!programmeGenerated) {
    reason =
      weeksRaw.length === 0
        ? "instance_exists_no_week_rows"
        : "week_rows_exist_but_no_meaningful_plan_json";
  } else {
    reason = "programme_loaded";
  }

  const debug: CommunityProgrammeLoadDebug = {
    userIdPrefix: userId.slice(0, 8),
    emailDomain: redactEmail(email),
    instanceCount,
    selectedInstanceId: instance?.id ? instance.id.slice(0, 8) : null,
    totalWeekRows: weeksRaw.length,
    weeksWithMeaningfulPlan,
    programmeGenerated,
    showGenerateProgramme: !programmeGenerated,
    reason,
  };

  console.info(`[community programme] load ${route}`, debug);
}

/** Client/server debug when programme page would show the build card. */
export function logCommunityProgrammeBuildCardShown(
  route: string,
  details: {
    programmeInstanceId: string | null;
    programmeGenerated: boolean;
    canViewProgramme: boolean;
    rawWeekCount: number;
    rawMeaningfulWeekCount: number;
    entitledUnlockedWithPlanCount: number;
    reason: string;
  }
): void {
  if (!shouldLogCommunityProgrammeDebug()) return;
  console.info(`[community programme] build card ${route}`, {
    selectedInstanceId: details.programmeInstanceId?.slice(0, 8) ?? null,
    programmeGenerated: details.programmeGenerated,
    canViewProgramme: details.canViewProgramme,
    rawWeekCount: details.rawWeekCount,
    rawMeaningfulWeekCount: details.rawMeaningfulWeekCount,
    entitledUnlockedWithPlanCount: details.entitledUnlockedWithPlanCount,
    reason: details.reason,
  });
}

/**
 * Programme page / home view gate.
 * Primary signal: raw programme_weeks rows with plan_json.schedule.length > 0.
 */
export function resolveCommunityCanViewProgramme(
  programmeInstanceId: string | null | undefined,
  programmeGenerated: boolean,
  weeksRaw: readonly WeekPlanRow[],
  instance?: ProgrammeInstanceUnlockFields | null,
  displayWeeks?: readonly ProgrammeWeekLike[]
): boolean {
  if (!programmeInstanceId || !programmeGenerated) return false;
  const unlock = resolveCommunityProgrammeUnlockState(instance ?? null, programmeGenerated);
  if (unlock.canViewProgramme) return true;
  if (countMeaningfulCommunityWeeks(weeksRaw) > 0 && !unlock.programmePendingUnlock) {
    return true;
  }
  if (displayWeeks?.length) {
    return communityProgrammeHasUnlockedSchedule(programmeInstanceId, displayWeeks);
  }
  return false;
}

export type CommunityProgrammeGateDebug = {
  instanceId: string | null;
  rawWeekCount: number;
  rawMeaningfulWeekCount: number;
  programmeGenerated: boolean;
  canViewProgramme: boolean;
  buildCardReason: string;
};

export function buildCommunityProgrammeGateDebug(
  instanceId: string | null | undefined,
  weeksRaw: readonly WeekPlanRow[],
  programmeGenerated: boolean,
  canViewProgramme: boolean
): CommunityProgrammeGateDebug {
  const rawMeaningfulWeekCount = countMeaningfulCommunityWeeks(weeksRaw);
  let buildCardReason: string;
  if (canViewProgramme) {
    buildCardReason = "show_programme";
  } else if (!instanceId) {
    buildCardReason = "no_instance";
  } else if (weeksRaw.length === 0) {
    buildCardReason = "no_week_rows_loaded";
  } else if (rawMeaningfulWeekCount === 0) {
    buildCardReason = "week_rows_missing_schedule_array";
  } else {
    buildCardReason = "unknown";
  }
  return {
    instanceId: instanceId ?? null,
    rawWeekCount: weeksRaw.length,
    rawMeaningfulWeekCount,
    programmeGenerated,
    canViewProgramme,
    buildCardReason,
  };
}
