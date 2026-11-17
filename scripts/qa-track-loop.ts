/**
 * Track coaching loop fixtures.
 * The HYROX generator flake is reported, not weakened.
 */
import fs from "node:fs";
import { actualWorkload } from "../app/lib/track-loop/policy";
import {
  assertNoLiveWrite,
  CANONICAL_STAGING_SUPABASE_REF,
  PRODUCTION_SUPABASE_REF,
  trackStagingWriteAllowed,
  GENERATOR_REGRESSION,
  nextBlock,
  oneGoodSessionKeeps,
  productStopsAutomation,
  proveAtomicRollback,
  readinessTransition,
  reassessmentExample,
  runAcceptStory,
  runDeclineStory,
  runMultiMissStory,
  runNoSafeReflowStory,
  runPainStory,
  storageReview,
  TRACK_PROGRAMME_MUTATION_ENABLED,
} from "../app/lib/track-loop";

const failures: string[] = [];
function assert(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

const accept = runAcceptStory();
const decline = runDeclineStory();
const pain = runPainStory();
const stuck = runNoSafeReflowStory();
const misses = runMultiMissStory();

assert(GENERATOR_REGRESSION.verdict === "fixed", "generator verdict");
assert(fs.readFileSync("scripts/qa-hyrox-track-programming.ts", "utf8").includes("Week 7: Tuesday hard threshold anchor"), "threshold assert still present");
assert(!fs.readFileSync("scripts/qa-hyrox-track-programming.ts", "utf8").includes("test.skip"), "generator test not skipped");

const storage = storageReview();
assert(storage.duplicateTables.length === 0, "storage duplicates foundation tables");
assert(storage.productionApplied === false, "storage not applied");
const sql = fs.readFileSync("supabase/migrations/022_track_coaching_loop.sql", "utf8");
assert(sql.includes("track_session_feedback_athlete_insert"), "athlete can submit feedback");
assert(!sql.includes("track_adaptation_log_athlete_insert"), "athlete cannot write provenance");
assert(sql.includes("published = false"), "proposals cannot be marked published");

assert(accept.beforeReadiness === "PARTIALLY_READY", `start ${accept.beforeReadiness}`);
assert(accept.skiCleared, "ski result cleared the ski requirement and set an anchor");
assert(accept.record.versions[0]?.some((session) => session.testId === "ski_2k" && session.kind === "assessment" && session.instructions.length > 0), "ski assessment uses the calendar");
assert(accept.proposal?.published === false && accept.proposal.mutationEnabled === false && accept.proposal.weekCount === 12, "read-only 12 week proposal");
assert(accept.activationAllowed === false, "activation refused");
assert(accept.decisionOffer === true, "athlete was offered the change");
assert(accept.proposalAction === "REPLACE_WITH_EASY_BIKE", accept.proposalAction ?? "no action");
assert(accept.apply?.applied === true && accept.apply.rolledBack === false, "accept applied");
assert(accept.weekTitles.some((title) => title.startsWith("Tue Easy bike")), accept.weekTitles.join(", "));
assert(accept.weekTitles.some((title) => title.startsWith("Wed") && title.includes("Threshold")), accept.weekTitles.join(", "));
assert(accept.record.sessions.every((session) => session.status !== "completed" || session.day !== "Tue"), "today's completed history was not the thing that moved");
assert(accept.record.adaptations[0]?.decision === "accepted" && accept.record.adaptations[0].policyVersion === "track-loop-v1", "provenance");
assert(accept.record.adaptations[0].beforeWeek.length > 0 && accept.record.adaptations[0].afterWeek.length > 0, "before and after week stored");
assert(accept.nextWeek.decision === "PROGRESS", accept.nextWeek.decision);
assert(accept.nextWeek.changes.some((change) => change.from === "25 min" && change.to === "30 min"), "threshold minutes come from the family");
assert(accept.nextWeek.explanation.includes("Sled volume stays unchanged"), accept.nextWeek.explanation);
assert(oneGoodSessionKeeps().decision === "KEEP", "one good session does not progress");
assert(accept.notifications.includes("morning_check_in") && accept.notifications.includes("next_week_ready"), "notifications");
assert(!accept.notifications.includes("every_normal_state"), "no spam notification");

assert(decline.apply?.applied === false && decline.sessionsUnchanged, "decline leaves the programme");
assert(decline.record.adaptations.some((row) => row.decision === "declined"), "decline stored");
assert(decline.nagSuppressed, "same recommendation is not offered again");
assert(decline.reofferAfterChange, "a material session change can offer again");

assert(pain.decisionOffer === false && pain.sessionsUnchanged, "pain does not rewrite the week");
assert(pain.explanation.toLowerCase().includes("not a diagnosis"), pain.explanation);
assert(pain.escalations.includes("PAIN_REVIEW"), "pain queue");
assert(!pain.explanation.toLowerCase().includes("tendin"), "no diagnosis");

assert(stuck.proposalStatus === "NO_SAFE_REFLOW" && stuck.sessionsUnchanged && stuck.decisionOffer === false, `stuck ${stuck.proposalStatus}`);
assert(stuck.escalations.includes("NO_SAFE_REFLOW"), "no safe reflow queue");

assert(misses.nextWeek.decision === "REDUCE" && misses.sessionsUnchanged, misses.nextWeek.decision);
assert(misses.escalations.includes("REPEATED_FATIGUE"), "repeated misses are reviewed");
assert(misses.transitions[0]?.includes("review"), "miss policy is review");

const rollback = proveAtomicRollback();
assert(rollback.rolledBack && rollback.unchanged, "failed write rolls back");
assert(productStopsAutomation(), "paused product does not offer a change");

const ready = readinessTransition();
assert(ready.from === "NOT_READY" && ready.to === "PARTIALLY_READY" && ready.proposal, `${ready.from} -> ${ready.to}`);
const reassess = reassessmentExample();
assert(reassess.due && reassess.programmeKept, "stale anchor flags reassessment and keeps a read-only proposal");
assert(nextBlock(accept)?.weekCount === 12 && nextBlock(accept)?.published === false, "next block uses the same read-only generator");

const calculated = actualWorkload({ planned: [{ label: "Threshold", value: 25, unit: "min" }], feedback: { completion: "completed", actuals: {} } });
const explicit = actualWorkload({ planned: [{ label: "Threshold", value: 25, unit: "min" }], feedback: { completion: "completed", actuals: { Threshold: 22 } } });
const partial = actualWorkload({ planned: [{ label: "Threshold", value: 25, unit: "min" }], feedback: { completion: "partial", actuals: {} } });
const modified = actualWorkload({ planned: [{ label: "Threshold", value: 25, unit: "min" }], feedback: { completion: "modified", actuals: {} } });
assert(calculated[0]?.source === "calculated" && calculated[0].value === 25, "full completion can use planned load");
assert(explicit[0]?.source === "actual" && explicit[0].value === 22, "explicit actual wins");
assert(partial[0]?.source === "withheld" && partial[0].value == null, "partial is not guessed");
assert(modified.length === 0, "modified does not copy planned load");

assert(TRACK_PROGRAMME_MUTATION_ENABLED === false, "mutation flag");
let canaryRefused = false;
try {
  assertNoLiveWrite({ NODE_ENV: "development", VERCEL_ENV: "preview", HYROX_TRACK_ADAPTATION_V1: "1" });
} catch {
  canaryRefused = true;
}
assert(canaryRefused, "canary flag is not a live write");
const stagingAthlete = "c0ffee00-1111-4111-8111-000000000365";
assert(
  trackStagingWriteAllowed(
    {
      NEXT_PUBLIC_SUPABASE_URL: `https://${CANONICAL_STAGING_SUPABASE_REF}.supabase.co`,
      HYROX_STAGING_SUPABASE_REF: CANONICAL_STAGING_SUPABASE_REF,
      HYROX_ENV: "staging",
      HYROX_TRACK_STAGING_WRITE: "1",
      HYROX_TRACK_CANARY_ATHLETE_IDS: stagingAthlete,
    },
    stagingAthlete
  ),
  "staging allowlist can open a write"
);
assert(
  trackStagingWriteAllowed(
    {
      NEXT_PUBLIC_SUPABASE_URL: `https://${PRODUCTION_SUPABASE_REF}.supabase.co`,
      HYROX_STAGING_SUPABASE_REF: CANONICAL_STAGING_SUPABASE_REF,
      HYROX_ENV: "production",
      VERCEL_ENV: "production",
      HYROX_TRACK_STAGING_WRITE: "1",
      HYROX_TRACK_ADAPTATION_V1: "1",
      HYROX_TRACK_CANARY_ATHLETE_IDS: stagingAthlete,
    },
    stagingAthlete
  ) === false,
  "production stays blocked when staging flags are copied"
);
assert(accept.athleteState.anchors.ski != null && accept.athleteState.missing.includes("Ski anchor") === false, "athlete state has the ski anchor");
assert(accept.athleteState.readiness === "FATIGUED" || accept.athleteState.readiness === "MULTIPLE_STRESSORS", accept.athleteState.readiness);

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log(`Track loop QA passed. Stories: accept, decline, pain, no-safe-reflow, multi-miss. Generator: ${GENERATOR_REGRESSION.verdict}.`);
