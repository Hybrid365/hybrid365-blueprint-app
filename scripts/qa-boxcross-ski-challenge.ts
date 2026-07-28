/**
 * QA: BoxCross 1KM Ski Challenge (isolated module)
 * Run: npx tsx scripts/qa-boxcross-ski-challenge.ts
 */

import {
  buildBestAttempts,
  buildLeaderboardPayload,
  challengeAcceptsEntries,
  isChallengeFinal,
} from "../app/lib/boxcross/leaderboard";
import {
  BOXCROSS_DEV_ATTEMPT_FIXTURES,
  BOXCROSS_DEV_CHALLENGE_FIXTURE,
} from "../app/lib/boxcross/fixtures";
import { formatSkiTime, parseSkiTimeToMs } from "../app/lib/boxcross/time";
import { BOXCROSS_REQUIRED_ASSETS } from "../app/lib/boxcross/types";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

{
  assert(parseSkiTimeToMs("3:42.6") === 222600, "parse 3:42.6");
  assert(parseSkiTimeToMs("3:42") === 222000, "parse 3:42");
  assert(formatSkiTime(222600) === "3:42.6", "format 3:42.6");
  assert(formatSkiTime(61000) === "1:01.0", "format 1:01.0");
  assert(parseSkiTimeToMs("0:00.0") === 0, "zero parses to 0");
  assert(parseSkiTimeToMs("") == null, "empty invalid");
  assert(parseSkiTimeToMs("-1:00") == null, "negative invalid");
  ok("Time parse / format");
}

{
  const board = buildLeaderboardPayload(
    BOXCROSS_DEV_CHALLENGE_FIXTURE,
    BOXCROSS_DEV_ATTEMPT_FIXTURES,
    "overall",
    new Date("2026-08-01T12:00:00Z")
  );
  assert(board.rows.length === 2, "two unique athletes");
  assert(board.rows[0]!.athlete_name === "Alex Example", "male fastest overall");
  assert(board.stats.male_leader?.athlete_name === "Alex Example", "male leader");
  assert(board.stats.female_leader?.athlete_name === "Sam Example", "female leader");
  assert(board.challenge.accepts_entries === true, "accepts during window");

  const male = buildBestAttempts(BOXCROSS_DEV_ATTEMPT_FIXTURES, "male");
  assert(male.length === 1 && male[0]!.category === "male", "male tab");

  const finalBoard = buildLeaderboardPayload(
    BOXCROSS_DEV_CHALLENGE_FIXTURE,
    BOXCROSS_DEV_ATTEMPT_FIXTURES,
    "overall",
    new Date("2026-09-01T12:00:00Z")
  );
  assert(finalBoard.challenge.is_final === true, "final after end");
  assert(isChallengeFinal(BOXCROSS_DEV_CHALLENGE_FIXTURE, new Date("2026-09-01")) === true, "final helper");
  assert(
    challengeAcceptsEntries(BOXCROSS_DEV_CHALLENGE_FIXTURE, new Date("2026-09-01")) === false,
    "no entries after end"
  );
  ok("Leaderboard ranking + final state");
}

{
  const repeat: typeof BOXCROSS_DEV_ATTEMPT_FIXTURES = [
    ...BOXCROSS_DEV_ATTEMPT_FIXTURES,
    {
      ...BOXCROSS_DEV_ATTEMPT_FIXTURES[0]!,
      id: "dev-1b",
      time_ms: 210000,
      attempted_at: "2026-08-01T12:00:00.000Z",
    },
  ];
  const best = buildBestAttempts(repeat, "overall");
  const alex = best.find((r) => r.athlete_name === "Alex Example");
  assert(alex?.time_ms === 210000, "keeps fastest verified per athlete");
  assert(best.filter((r) => r.athlete_name === "Alex Example").length === 1, "one public row");
  ok("Repeat attempts collapse to best");
}

{
  assert(BOXCROSS_REQUIRED_ASSETS.length >= 2, "required assets documented");
  ok("Asset requirements listed");
}

console.log(`\n${passed} BoxCross Ski Challenge QA checks passed.`);
console.log("Fixtures are DEV-ONLY and are not served by the public leaderboard API.");
