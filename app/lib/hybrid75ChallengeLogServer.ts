import { createServiceRoleClient } from "@/app/lib/supabaseAdmin";
import {
  buildLeaderboardRows,
  buildLogUpsertRow,
  type Hybrid75ChallengeSessionLog,
  type Hybrid75LogStatus,
  type Hybrid75LogUpsertPayload,
  type Hybrid75PointAdjustment,
} from "@/app/lib/hybrid75ChallengeLogging";

export function isChallengeLoggingConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getAdminClient() {
  if (!isChallengeLoggingConfigured()) {
    throw new Error("Challenge logging is not configured");
  }
  return createServiceRoleClient();
}

export async function fetchLogsForPlan(planId: string): Promise<Hybrid75ChallengeSessionLog[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("challenge_session_logs")
    .select("*")
    .eq("plan_id", planId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Hybrid75ChallengeSessionLog[];
}

export async function fetchAllChallengeLogs(
  status: "pending" | "approved" | "rejected" | "all" = "pending"
): Promise<Hybrid75ChallengeSessionLog[]> {
  const supabase = getAdminClient();
  let query = supabase.from("challenge_session_logs").select("*");

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const logs = (data ?? []) as Hybrid75ChallengeSessionLog[];

  if (status === "all") {
    return logs.sort((a, b) => {
      const statusOrder = { pending: 0, approved: 1, rejected: 2 };
      const diff = statusOrder[a.status] - statusOrder[b.status];
      if (diff !== 0) return diff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  return logs;
}

export async function upsertChallengeLog(
  payload: Hybrid75LogUpsertPayload
): Promise<Hybrid75ChallengeSessionLog> {
  const supabase = getAdminClient();
  const row = buildLogUpsertRow(payload);

  const { data, error } = await supabase
    .from("challenge_session_logs")
    .upsert(row, { onConflict: "plan_id,session_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Hybrid75ChallengeSessionLog;
}

export async function fetchLeaderboardLogs(): Promise<Hybrid75ChallengeSessionLog[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("challenge_session_logs")
    .select("*")
    .in("status", ["pending", "approved"]);

  if (error) throw new Error(error.message);
  return (data ?? []) as Hybrid75ChallengeSessionLog[];
}

export async function fetchAllPointAdjustments(): Promise<Hybrid75PointAdjustment[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("challenge_point_adjustments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Hybrid75PointAdjustment[];
}

export async function buildPublicLeaderboard() {
  const [logs, adjustments] = await Promise.all([
    fetchLeaderboardLogs(),
    fetchAllPointAdjustments(),
  ]);
  return buildLeaderboardRows(logs, adjustments);
}

export async function approveChallengeLog(
  logId: string,
  status: Extract<Hybrid75LogStatus, "approved" | "rejected">
): Promise<Hybrid75ChallengeSessionLog> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("challenge_session_logs")
    .update({ status })
    .eq("id", logId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Hybrid75ChallengeSessionLog;
}

export type PointAdjustmentInput = {
  email: string;
  name?: string;
  plan_id?: string;
  points: number;
  reason: string;
  created_by?: string;
};

export async function createPointAdjustment(
  input: PointAdjustmentInput
): Promise<Hybrid75PointAdjustment> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("challenge_point_adjustments")
    .insert({
      email: input.email.trim().toLowerCase(),
      name: input.name?.trim() || null,
      plan_id: input.plan_id?.trim() || null,
      points: input.points,
      reason: input.reason.trim(),
      created_by: input.created_by?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Hybrid75PointAdjustment;
}

export async function getUserLeaderboardSummary(planId: string, email?: string | null) {
  const [logs, adjustments] = await Promise.all([
    fetchLogsForPlan(planId),
    fetchAllPointAdjustments(),
  ]);

  const approved = logs
    .filter((log) => log.status === "approved")
    .reduce((sum, log) => sum + log.points_claimed, 0);
  const pending = logs
    .filter((log) => log.status === "pending" && log.points_claimed > 0)
    .reduce((sum, log) => sum + log.points_claimed, 0);

  const normalisedEmail = email?.trim().toLowerCase() || logs.find((l) => l.email)?.email?.toLowerCase();
  const adjustment = adjustments
    .filter(
      (adj) =>
        adj.plan_id === planId ||
        (normalisedEmail && adj.email.trim().toLowerCase() === normalisedEmail)
    )
    .reduce((sum, adj) => sum + adj.points, 0);

  return {
    pending_points: pending,
    approved_points: approved,
    adjustment_points: adjustment,
    total_points: approved + adjustment,
  };
}
