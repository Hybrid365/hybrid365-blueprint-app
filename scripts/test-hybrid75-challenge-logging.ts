/**
 * Hybrid 75 challenge logging — points + session type smoke tests.
 * Run: npx tsx scripts/test-hybrid75-challenge-logging.ts
 */

import { buildWeekBlueprint } from "../app/lib/buildWeekBlueprint";
import { applyHybrid75FreeWeek } from "../app/lib/applyHybrid75FreeWeek";
import {
  calculatePointsClaimed,
  getHybrid75LogSessionType,
  isHybrid75LoggableSession,
  logDisplayMessage,
} from "../app/lib/hybrid75ChallengeLogging";
import { parseFreePlanSchedule } from "../app/lib/freePlanDashboard";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function testPointsCalculation() {
  assert(calculatePointsClaimed("run", true, "telegram") === 10, "run + proof = 10");
  assert(calculatePointsClaimed("lift", true, "instagram") === 10, "lift + proof = 10");
  assert(calculatePointsClaimed("mobility", true, "both") === 10, "mobility + proof = 10");
  assert(calculatePointsClaimed("challenge", true, "telegram") === 30, "challenge + proof = 30");
  assert(calculatePointsClaimed("run", true, "not_yet") === 0, "not yet = 0");
  assert(calculatePointsClaimed("run", false, "telegram") === 0, "not completed = 0");

  const pendingMsg = logDisplayMessage({
    completed: true,
    proof_type: "telegram",
    points_claimed: 10,
    status: "pending",
  });
  assert(pendingMsg.headline.includes("pending"), "pending message");
  assert(Boolean(pendingMsg.pointsLine?.includes("+10")), "pending points line");

  const proofRequired = logDisplayMessage({
    completed: true,
    proof_type: "not_yet",
    points_claimed: 0,
    status: "pending",
  });
  assert(proofRequired.proofRequired, "proof required flag");
}

function testLoggableSessions() {
  const standard = buildWeekBlueprint({
    days_per_week: 6,
    weekly_hours_band: "5-7",
    goal_focus: "hybrid",
    ability_level: "intermediate",
  });
  const hybrid75 = applyHybrid75FreeWeek(standard, {
    days_per_week: 6,
    ability_level: "intermediate",
  });
  const sessions = parseFreePlanSchedule(hybrid75.schedule);

  const loggable = sessions.filter(isHybrid75LoggableSession);
  assert(loggable.length >= 4, "6-day plan should have multiple loggable sessions");

  const challenge = sessions.find((s) => getHybrid75LogSessionType(s) === "challenge");
  assert(Boolean(challenge), "should include challenge session");

  const run = sessions.find((s) => getHybrid75LogSessionType(s) === "run");
  assert(Boolean(run), "should include run session");

  if (run) {
    assert(calculatePointsClaimed("run", true, "telegram") === 10, "run points");
  }
  if (challenge) {
    assert(calculatePointsClaimed("challenge", true, "both") === 30, "challenge points");
  }
}

console.log("Hybrid 75 challenge logging tests\n");
testPointsCalculation();
console.log("✓ points calculation");
testLoggableSessions();
console.log("✓ loggable session detection");
console.log("\nAll challenge logging checks passed.");
