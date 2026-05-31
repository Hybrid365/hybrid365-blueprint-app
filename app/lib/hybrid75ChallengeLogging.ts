import type { FreePlanSession } from "./freePlanDashboard";

export type Hybrid75LogSessionType = "run" | "lift" | "mobility" | "challenge";

export type Hybrid75ProofType = "telegram" | "instagram" | "both" | "not_yet";

export type Hybrid75LogStatus = "pending" | "approved" | "rejected";

export type Hybrid75ChallengeSessionLog = {
  id: string;
  plan_id: string;
  email: string | null;
  name: string | null;
  session_id: string;
  session_title: string;
  session_type: Hybrid75LogSessionType;
  completed: boolean;
  rpe: number | null;
  proof_type: Hybrid75ProofType;
  proof_note: string | null;
  notes: string | null;
  points_claimed: number;
  status: Hybrid75LogStatus;
  created_at: string;
  updated_at: string;
};

export type Hybrid75PointAdjustment = {
  id: string;
  plan_id: string | null;
  name: string | null;
  email: string;
  points: number;
  reason: string;
  created_by: string | null;
  created_at: string;
};

export type Hybrid75LeaderboardRow = {
  /** Stable row key — prefer normalised email, else plan_id */
  key: string;
  plan_id: string;
  email: string | null;
  name: string;
  approved_points: number;
  pending_points: number;
  adjustment_points: number;
  /** Official total = approved + adjustments (excludes pending) */
  total_points: number;
};

export const HYBRID75_INSTAGRAM_TAGS = "@kieranhiggsfit @hybrid.365";

export const HYBRID75_POINTS_COPY = [
  "+10 points for each completed run, lift or mobility session with proof.",
  "+30 points for completing the weekly Hybrid Hard Challenge.",
  "+10 bonus points for top 3 fastest athletes on timed weekly challenges.",
  "Proof must be posted in Telegram or by tagging @kieranhiggsfit / @hybrid.365 on Instagram.",
  "Points are manually checked and approved at the end of each week.",
] as const;

const SESSION_POINTS = 10;
const CHALLENGE_POINTS = 30;

export function getHybrid75LogSessionType(session: FreePlanSession): Hybrid75LogSessionType | null {
  const tagStr = session.tags.join(" ").toLowerCase();
  const title = session.title.toLowerCase();

  if (
    session.category === "Challenge" ||
    session.hybrid75Role === "challenge" ||
    title.includes("hybrid hard")
  ) {
    return "challenge";
  }

  if (title.includes("easy run add-on") || tagStr.includes("hybrid75_addon_run")) {
    return "run";
  }

  if (tagStr.includes("challenge_addon_lift") || tagStr.includes("hybrid75_addon_lift")) {
    return "lift";
  }

  if (session.hybrid75Role === "run" || session.category === "Run") return "run";
  if (session.hybrid75Role === "strength" || session.category === "Strength") return "lift";
  if (session.hybrid75Role === "mobility" || session.category === "Mobility") return "mobility";

  return null;
}

export function isHybrid75LoggableSession(session: FreePlanSession): boolean {
  return getHybrid75LogSessionType(session) !== null;
}

export function hasProofSubmitted(proofType: Hybrid75ProofType): boolean {
  return proofType !== "not_yet";
}

export function calculatePointsClaimed(
  sessionType: Hybrid75LogSessionType,
  completed: boolean,
  proofType: Hybrid75ProofType
): number {
  if (!completed || !hasProofSubmitted(proofType)) return 0;
  return sessionType === "challenge" ? CHALLENGE_POINTS : SESSION_POINTS;
}

export function deriveLogStatus(
  completed: boolean,
  proofType: Hybrid75ProofType,
  pointsClaimed: number
): Hybrid75LogStatus {
  if (!completed || pointsClaimed === 0) return "pending";
  return "pending";
}

export function logDisplayMessage(log: Pick<Hybrid75ChallengeSessionLog, "completed" | "proof_type" | "points_claimed" | "status">): {
  headline: string;
  pointsLine: string | null;
  proofRequired: boolean;
} {
  if (!log.completed) {
    return { headline: "Logged — not completed", pointsLine: null, proofRequired: false };
  }

  if (!hasProofSubmitted(log.proof_type)) {
    return {
      headline: "Logged — proof required",
      pointsLine: "Post proof in Telegram or tag Instagram to earn points",
      proofRequired: true,
    };
  }

  if (log.status === "approved") {
    return {
      headline: "Approved",
      pointsLine: `+${log.points_claimed} points approved`,
      proofRequired: false,
    };
  }

  if (log.status === "rejected") {
    return {
      headline: "Not approved",
      pointsLine: "Contact support if you believe this is an error",
      proofRequired: false,
    };
  }

  return {
    headline: "Logged — pending proof check",
    pointsLine: `+${log.points_claimed} points pending`,
    proofRequired: false,
  };
}

export function sumPointsByStatus(
  logs: Hybrid75ChallengeSessionLog[],
  status: Hybrid75LogStatus
): number {
  return logs
    .filter((log) => log.status === status)
    .reduce((sum, log) => sum + log.points_claimed, 0);
}

export function sumPendingPoints(logs: Hybrid75ChallengeSessionLog[]): number {
  return logs
    .filter((log) => log.status === "pending" && log.points_claimed > 0)
    .reduce((sum, log) => sum + log.points_claimed, 0);
}

export function countCompletedByType(
  logs: Hybrid75ChallengeSessionLog[],
  sessionType: Hybrid75LogSessionType
): number {
  return logs.filter(
    (log) =>
      log.session_type === sessionType &&
      log.completed &&
      hasProofSubmitted(log.proof_type) &&
      log.status !== "rejected"
  ).length;
}

function normaliseEmail(email: string | null | undefined): string | null {
  const value = email?.trim().toLowerCase();
  return value || null;
}

function leaderboardKey(email: string | null | undefined, planId: string): string {
  return normaliseEmail(email) ?? planId;
}

export function buildLeaderboardRows(
  logs: Hybrid75ChallengeSessionLog[],
  adjustments: Hybrid75PointAdjustment[] = []
): Hybrid75LeaderboardRow[] {
  const rows = new Map<string, Hybrid75LeaderboardRow>();

  const ensureRow = (key: string, planId: string, email: string | null, name: string | null) => {
    const existing = rows.get(key);
    if (existing) {
      if (name?.trim()) existing.name = name.trim();
      if (email) existing.email = email;
      if (planId && existing.plan_id === "unknown") existing.plan_id = planId;
      return existing;
    }
    const row: Hybrid75LeaderboardRow = {
      key,
      plan_id: planId || "unknown",
      email,
      name: name?.trim() || "Athlete",
      approved_points: 0,
      pending_points: 0,
      adjustment_points: 0,
      total_points: 0,
    };
    rows.set(key, row);
    return row;
  };

  for (const log of logs) {
    const email = normaliseEmail(log.email);
    const key = leaderboardKey(email, log.plan_id);
    const row = ensureRow(key, log.plan_id, email, log.name);

    if (log.status === "approved") {
      row.approved_points += log.points_claimed;
    } else if (log.status === "pending" && log.points_claimed > 0) {
      row.pending_points += log.points_claimed;
    }
  }

  for (const adj of adjustments) {
    const email = normaliseEmail(adj.email);
    if (!email) continue;
    const key = leaderboardKey(email, adj.plan_id ?? email);
    const row = ensureRow(key, adj.plan_id ?? "unknown", email, adj.name);
    row.adjustment_points += adj.points;
    if (adj.name?.trim()) row.name = adj.name.trim();
  }

  for (const row of rows.values()) {
    row.total_points = row.approved_points + row.adjustment_points;
  }

  return [...rows.values()].sort(
    (a, b) => b.total_points - a.total_points || b.approved_points - a.approved_points
  );
}

export function sumAdjustmentPointsForPlan(
  adjustments: Hybrid75PointAdjustment[],
  planId: string,
  email?: string | null
): number {
  const normalised = normaliseEmail(email);
  return adjustments
    .filter(
      (adj) =>
        (adj.plan_id && adj.plan_id === planId) ||
        (normalised && normaliseEmail(adj.email) === normalised)
    )
    .reduce((sum, adj) => sum + adj.points, 0);
}

export type Hybrid75LogUpsertPayload = {
  plan_id: string;
  email?: string;
  name?: string;
  session_id: string;
  session_title: string;
  session_type: Hybrid75LogSessionType;
  completed: boolean;
  rpe?: number | null;
  proof_type: Hybrid75ProofType;
  proof_note?: string | null;
  notes?: string | null;
};

export function buildLogUpsertRow(payload: Hybrid75LogUpsertPayload) {
  const points_claimed = calculatePointsClaimed(
    payload.session_type,
    payload.completed,
    payload.proof_type
  );

  return {
    plan_id: payload.plan_id,
    email: payload.email?.trim() || null,
    name: payload.name?.trim() || null,
    session_id: payload.session_id,
    session_title: payload.session_title,
    session_type: payload.session_type,
    completed: payload.completed,
    rpe: payload.rpe ?? null,
    proof_type: payload.proof_type,
    proof_note: payload.proof_note?.trim() || null,
    notes: payload.notes?.trim() || null,
    points_claimed,
    status: "pending" as const,
  };
}
