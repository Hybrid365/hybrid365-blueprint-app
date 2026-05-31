/**
 * Hybrid 75 admin points + leaderboard calculation tests.
 * Run: npx tsx scripts/test-hybrid75-admin-points.ts
 */

import {
  buildLeaderboardRows,
  type Hybrid75ChallengeSessionLog,
  type Hybrid75PointAdjustment,
} from "../app/lib/hybrid75ChallengeLogging";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function makeLog(
  overrides: Partial<Hybrid75ChallengeSessionLog> & Pick<Hybrid75ChallengeSessionLog, "plan_id" | "session_id">
): Hybrid75ChallengeSessionLog {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    email: overrides.email ?? "athlete@example.com",
    name: overrides.name ?? "Athlete One",
    session_title: overrides.session_title ?? "Easy Run",
    session_type: overrides.session_type ?? "run",
    completed: overrides.completed ?? true,
    rpe: overrides.rpe ?? 6,
    proof_type: overrides.proof_type ?? "telegram",
    proof_note: overrides.proof_note ?? null,
    notes: overrides.notes ?? null,
    points_claimed: overrides.points_claimed ?? 10,
    status: overrides.status ?? "pending",
    created_at: overrides.created_at ?? new Date().toISOString(),
    updated_at: overrides.updated_at ?? new Date().toISOString(),
    ...overrides,
  };
}

function testApprovedRunCounts() {
  const logs = [
    makeLog({
      plan_id: "plan-a",
      session_id: "s1",
      status: "approved",
      points_claimed: 10,
    }),
  ];
  const rows = buildLeaderboardRows(logs, []);
  assert(rows.length === 1, "one row");
  assert(rows[0].approved_points === 10, "approved 10");
  assert(rows[0].total_points === 10, "official total 10");
  assert(rows[0].pending_points === 0, "no pending");
}

function testRejectedExcludedFromOfficial() {
  const logs = [
    makeLog({
      plan_id: "plan-a",
      session_id: "s1",
      status: "rejected",
      points_claimed: 10,
    }),
  ];
  const rows = buildLeaderboardRows(logs, []);
  assert(rows[0].approved_points === 0, "rejected not approved");
  assert(rows[0].total_points === 0, "rejected not in total");
}

function testManualAdjustment() {
  const logs = [
    makeLog({
      plan_id: "plan-a",
      session_id: "s1",
      email: "athlete@example.com",
      status: "approved",
      points_claimed: 10,
    }),
  ];
  const adjustments: Hybrid75PointAdjustment[] = [
    {
      id: "adj-1",
      plan_id: "plan-a",
      name: "Athlete One",
      email: "athlete@example.com",
      points: 10,
      reason: "Top 3 timed challenge bonus",
      created_by: "admin",
      created_at: new Date().toISOString(),
    },
  ];
  const rows = buildLeaderboardRows(logs, adjustments);
  assert(rows[0].approved_points === 10, "approved session points");
  assert(rows[0].adjustment_points === 10, "adjustment points");
  assert(rows[0].total_points === 20, "official total includes adjustment");
}

function testNegativeAdjustment() {
  const logs = [
    makeLog({
      plan_id: "plan-b",
      session_id: "s1",
      email: "b@example.com",
      status: "approved",
      points_claimed: 30,
    }),
  ];
  const adjustments: Hybrid75PointAdjustment[] = [
    {
      id: "adj-2",
      plan_id: null,
      name: null,
      email: "b@example.com",
      points: -10,
      reason: "Proof correction",
      created_by: "admin",
      created_at: new Date().toISOString(),
    },
  ];
  const rows = buildLeaderboardRows(logs, adjustments);
  assert(rows[0].total_points === 20, "negative adjustment reduces total");
}

function testPendingNotInOfficialTotal() {
  const logs = [
    makeLog({
      plan_id: "plan-c",
      session_id: "s1",
      status: "pending",
      points_claimed: 10,
    }),
  ];
  const rows = buildLeaderboardRows(logs, []);
  assert(rows[0].pending_points === 10, "pending tracked");
  assert(rows[0].total_points === 0, "pending not in official total");
}

console.log("Hybrid 75 admin points tests\n");
testApprovedRunCounts();
console.log("✓ approved run counts toward official total");
testRejectedExcludedFromOfficial();
console.log("✓ rejected logs excluded from official total");
testManualAdjustment();
console.log("✓ manual +10 adjustment added to total");
testNegativeAdjustment();
console.log("✓ negative adjustment reduces total");
testPendingNotInOfficialTotal();
console.log("✓ pending not counted in official total");
console.log("\nAll admin points checks passed.");
