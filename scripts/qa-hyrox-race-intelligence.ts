/**
 * QA: HYROX race intelligence V1 — records, splits, observations, no magic scores.
 * Run: npx tsx scripts/qa-hyrox-race-intelligence.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createHyroxAdminAthletePreviewToken,
  getAdminAthletePreviewMutationBlock,
} from "../app/lib/hyroxAdminAthletePreview";
import { HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE } from "../app/lib/hyroxAdminAthletePreviewPaths";
import {
  analyzeRace,
  analyzeRaceHistory,
  formatRaceDelta,
  parseOptionalRaceClock,
  parseRaceDraft,
  previousRaceFor,
  progressCopy,
  raceCompleteness,
  raceRecordFromDraft,
  raceRecordFromRow,
  type HyroxRaceDraft,
  type HyroxRaceRecord,
  type HyroxRaceResultDbRow,
} from "../app/lib/hyroxRaceIntelligence";
import {
  HYROX_RACE_RUN_KEYS,
  HYROX_RACE_STATION_KEYS,
  type HyroxRaceRunKey,
  type HyroxRaceStationKey,
} from "../app/lib/hyroxRaceIntelligenceTypes";
import { isHyroxRaceIntelligenceEnabled } from "../app/lib/hyroxRaceIntelligenceFlag";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}
function assert(cond: unknown, message: string) {
  if (!cond) throw new Error(message);
}

{
  const prevEnabled = process.env.HYROX_RACE_INTELLIGENCE_ENABLED;
  const prevIds = process.env.HYROX_RACE_INTELLIGENCE_ATHLETE_IDS;
  const prevEmails = process.env.HYROX_RACE_INTELLIGENCE_ATHLETE_EMAILS;
  const prevDev = process.env.HYROX_RACE_INTELLIGENCE_DEV_ALL;
  delete process.env.HYROX_RACE_INTELLIGENCE_ENABLED;
  delete process.env.HYROX_RACE_INTELLIGENCE_ATHLETE_IDS;
  delete process.env.HYROX_RACE_INTELLIGENCE_ATHLETE_EMAILS;
  delete process.env.HYROX_RACE_INTELLIGENCE_DEV_ALL;
  assert(!isHyroxRaceIntelligenceEnabled({ id: "abc" }), "default off");
  process.env.HYROX_RACE_INTELLIGENCE_ATHLETE_IDS = "abc-123";
  assert(isHyroxRaceIntelligenceEnabled({ id: "abc-123" }), "id allow-list");
  assert(!isHyroxRaceIntelligenceEnabled({ id: "other" }), "id deny");
  if (prevEnabled === undefined) delete process.env.HYROX_RACE_INTELLIGENCE_ENABLED;
  else process.env.HYROX_RACE_INTELLIGENCE_ENABLED = prevEnabled;
  if (prevIds === undefined) delete process.env.HYROX_RACE_INTELLIGENCE_ATHLETE_IDS;
  else process.env.HYROX_RACE_INTELLIGENCE_ATHLETE_IDS = prevIds;
  if (prevEmails === undefined) delete process.env.HYROX_RACE_INTELLIGENCE_ATHLETE_EMAILS;
  else process.env.HYROX_RACE_INTELLIGENCE_ATHLETE_EMAILS = prevEmails;
  if (prevDev === undefined) delete process.env.HYROX_RACE_INTELLIGENCE_DEV_ALL;
  else process.env.HYROX_RACE_INTELLIGENCE_DEV_ALL = prevDev;
  ok("Race Intelligence flag default off + allow-list");
}

const ATHLETE = "athlete-1";

const FULL_RUNS: Record<HyroxRaceRunKey, string> = {
  run1: "5:00",
  run2: "5:10",
  run3: "5:20",
  run4: "5:30",
  run5: "5:40",
  run6: "5:50",
  run7: "6:00",
  run8: "6:10",
};

const FULL_STATIONS: Record<HyroxRaceStationKey, string> = {
  skiErg: "4:00",
  sledPush: "3:00",
  sledPull: "3:20",
  burpeeBroadJumps: "3:40",
  row: "4:10",
  farmersCarry: "2:00",
  sandbagLunges: "3:30",
  wallBalls: "4:00",
};

function draft(partial: Partial<HyroxRaceDraft> & { eventName?: string }): HyroxRaceDraft {
  return {
    eventName: partial.eventName ?? "HYROX London",
    raceDate: partial.raceDate ?? "2026-05-02",
    division: partial.division ?? "Open",
    category: partial.category ?? null,
    overallTime: partial.overallTime ?? null,
    goalTime: partial.goalTime ?? null,
    notes: partial.notes ?? null,
    runs: partial.runs,
    stations: partial.stations,
    roxzone: partial.roxzone ?? null,
  };
}

function record(
  partial: Partial<HyroxRaceDraft> & { eventName?: string },
  ids: { id: string; createdAt: string }
): HyroxRaceRecord {
  return raceRecordFromDraft(ATHLETE, draft(partial), ids);
}

assert(parseOptionalRaceClock("1:04:14") === 3854, "parses 1:04:14");
assert(parseOptionalRaceClock("4:20") === 260, "parses 4:20");
assert(parseOptionalRaceClock("") == null, "empty clock is null");
assert(parseOptionalRaceClock("abc") == null, "malformed clock is null");
assert(parseOptionalRaceClock("1:60:00") == null, "invalid minutes is null");
assert(parseOptionalRaceClock("17:60") == null, "invalid seconds is null");
ok("parses race clocks and rejects malformed times without throwing");

const emptyHistory = analyzeRaceHistory([]);
assert(emptyHistory.length === 0, "no races → empty history");
ok("no races");

const nameOnly = record(
  { eventName: "HYROX Dublin", raceDate: "2026-09-12", overallTime: null },
  { id: "name-1", createdAt: "2026-09-12T10:00:00.000Z" }
);
assert(raceCompleteness(nameOnly) === "none", "name/date only is valid incomplete race");
assert(nameOnly.overall.seconds == null && nameOnly.overall.display == null, "no invented overall");
assert(analyzeRace(nameOnly, null).averageRunSeconds == null, "name-only has no run analysis");
ok("name/date only stays incomplete");

const overallOnly = record(
  { overallTime: "1:03:40", division: "Open", eventName: "HYROX Manchester" },
  { id: "overall-1", createdAt: "2026-06-14T12:00:00.000Z" }
);
assert(overallOnly.overall.display === "1:03:40", "preserves overall display");
assert(overallOnly.overall.seconds === 3820, "stores overall seconds");
assert(raceCompleteness(overallOnly) === "overall_only", "overall only completeness");
const overallAnalysis = analyzeRace(overallOnly, null);
assert(overallAnalysis.runCount === 0 && overallAnalysis.stationCount === 0, "no split counts");
assert(overallAnalysis.averageRunSeconds == null, "no invented average run");
assert(overallAnalysis.totalStationSeconds == null, "no invented station total");
assert(
  overallAnalysis.observations.some((item) => item.text === "Roxzone was not recorded."),
  "missing Roxzone observation on overall-only race"
);
assert(
  overallAnalysis.observations.every((item) => !/percent|bottom \d|population/i.test(item.text)),
  "overall-only observations stay transparent"
);
ok("overall only");

const partial = record(
  {
    overallTime: "1:10:00",
    runs: { run1: "5:12", run8: "5:54" },
    stations: { skiErg: "4:20", wallBalls: "5:01" },
  },
  { id: "partial-1", createdAt: "2026-03-01T12:00:00.000Z" }
);
const partialAnalysis = analyzeRace(partial, null);
assert(raceCompleteness(partial) === "partial", "partial completeness");
assert(partialAnalysis.runCount === 2 && partialAnalysis.stationCount === 2, "partial counts");
assert(partial.runs.run2.seconds == null && partial.runs.run2.display == null, "missing run stays null");
assert(partialAnalysis.runFadeSeconds === 42, "fade from first/last recorded runs");
assert(
  partialAnalysis.observations.some((item) => item.text.includes("Run 8 was 42s slower than run 1")),
  `run fade copy: ${partialAnalysis.observations.find((item) => item.kind === "run_fade")?.text}`
);
ok("partial splits");

const full = record(
  {
    eventName: "HYROX Hamburg",
    raceDate: "2026-05-02",
    division: "Pro",
    overallTime: "58:40",
    goalTime: "1:00:00",
    runs: FULL_RUNS,
    stations: FULL_STATIONS,
    roxzone: "7:40",
  },
  { id: "full-1", createdAt: "2026-05-02T18:00:00.000Z" }
);
const fullAnalysis = analyzeRace(full, null);
assert(raceCompleteness(full) === "full", "full completeness even with Roxzone present");
assert(fullAnalysis.runCount === 8 && fullAnalysis.stationCount === 8, "eight runs and stations");
assert(fullAnalysis.averageRunSeconds === 335, "average run 5:35");
assert(fullAnalysis.fastestRun?.key === "run1" && fullAnalysis.slowestRun?.key === "run8", "fastest/slowest run");
assert(fullAnalysis.runFadeSeconds === 70, "run fade 70s");
assert(fullAnalysis.totalStationSeconds === 1660, "station total 27:40");
assert(fullAnalysis.roxzoneSeconds === 460, "stored Roxzone seconds");
assert(fullAnalysis.stationDistribution.length === 8, "station distribution over recorded stations");
assert(
  fullAnalysis.observations.some((item) => item.text === "Roxzone 7:40."),
  "Roxzone observation uses stored display"
);
assert(fullAnalysis.vsGoalSeconds === 3520 - 3600, "overall inside goal");
ok("full splits");

const missingRoxzone = record(
  {
    eventName: "HYROX Madrid",
    overallTime: "59:10",
    runs: FULL_RUNS,
    stations: FULL_STATIONS,
  },
  { id: "full-no-rox", createdAt: "2026-04-01T12:00:00.000Z" }
);
const missingRoxzoneAnalysis = analyzeRace(missingRoxzone, null);
assert(raceCompleteness(missingRoxzone) === "full", "full splits without Roxzone");
assert(missingRoxzoneAnalysis.roxzoneSeconds == null, "Roxzone stays null");
assert(
  missingRoxzoneAnalysis.observations.some((item) => item.text === "Roxzone was not recorded."),
  "does not invent Roxzone from overall minus splits"
);
ok("missing Roxzone");

const previous = record(
  {
    eventName: "HYROX Glasgow",
    raceDate: "2025-11-15",
    overallTime: "1:04:22",
    runs: { ...FULL_RUNS, run1: "5:10", run8: "6:20" },
    stations: { ...FULL_STATIONS, wallBalls: "3:18" },
  },
  { id: "prev-1", createdAt: "2025-11-15T12:00:00.000Z" }
);
const current = record(
  {
    eventName: "HYROX London",
    raceDate: "2026-05-02",
    overallTime: "1:03:40",
    runs: FULL_RUNS,
    stations: { ...FULL_STATIONS, wallBalls: "4:00" },
  },
  { id: "curr-1", createdAt: "2026-05-02T12:00:00.000Z" }
);
assert(previousRaceFor(current, [current, previous])?.id === "prev-1", "previous race by date");
const compared = analyzeRace(current, previous);
assert(compared.vsPrevious?.overallDeltaSeconds === 3820 - 3862, "overall faster than previous");
assert(compared.vsPrevious?.stations.find((s) => s.key === "wallBalls")?.deltaSeconds === 42, "wall balls +42s");
assert(
  compared.observations.some((item) => item.text === "Wall Balls 42s slower than previous race."),
  `station regression copy: ${compared.observations.find((item) => item.text.includes("Wall Balls"))?.text}`
);
assert(
  compared.observations.some((item) => /Overall .+ faster than previous race/.test(item.text)),
  "overall comparison observation"
);
const history = analyzeRaceHistory([previous, current]);
assert(history[0]?.race.id === "curr-1", "history newest first");
assert(history[0]?.analysis.vsPrevious?.previousId === "prev-1", "history wires previous");
assert(progressCopy(history[0]!.analysis)?.includes("faster than previous race") === true, "progress vs previous");
ok("two-race comparison");

const malformed = record(
  {
    overallTime: "not-a-time",
    runs: { run1: "abc", run2: "5:12" },
    stations: { wallBalls: "1:60", skiErg: "4:00" },
    roxzone: "??",
  },
  { id: "bad-1", createdAt: "2026-01-01T12:00:00.000Z" }
);
assert(malformed.overall.display === "not-a-time", "keeps malformed overall display");
assert(malformed.overall.seconds == null, "malformed overall has no seconds");
assert(malformed.runs.run1.display === "abc" && malformed.runs.run1.seconds == null, "malformed run kept");
assert(malformed.runs.run2.seconds === 312, "valid sibling split still parsed");
assert(malformed.stations.wallBalls.seconds == null, "invalid station seconds null");
assert(malformed.roxzone.display === "??" && malformed.roxzone.seconds == null, "malformed Roxzone kept");
const malformedAnalysis = analyzeRace(malformed, null);
assert(malformedAnalysis.runCount === 1 && malformedAnalysis.stationCount === 1, "analysis skips malformed splits");
assert(malformedAnalysis.averageRunSeconds === 312, "average uses stored seconds only");
ok("malformed times");

const divisions = ["Open", "Pro", "Doubles", "Mixed Doubles", "Adaptive", "Women's Pro", "Men's Open"];
for (const division of divisions) {
  const raced = record({ division, overallTime: "1:10:00" }, { id: `div-${division}`, createdAt: "2026-01-02T00:00:00.000Z" });
  assert(raced.division === division, `stores division ${division}`);
}
const fromRowDivision: HyroxRaceResultDbRow = {
  id: "legacy-div",
  athlete_id: ATHLETE,
  created_at: "2026-01-03T00:00:00.000Z",
  updated_at: "2026-01-03T00:00:00.000Z",
  race_event: "HYROX",
  race_date: "2026-01-03",
  category: "Pro",
  total_time: "59:42",
  run_splits: null,
  station_splits: null,
  notes: null,
};
assert(raceRecordFromRow(fromRowDivision).division === "Pro", "legacy category maps to division");
ok("division variants");

const structuredRow: HyroxRaceResultDbRow = {
  id: "structured-1",
  athlete_id: ATHLETE,
  created_at: "2026-02-01T00:00:00.000Z",
  updated_at: "2026-02-01T00:00:00.000Z",
  race_event: "HYROX Vienna",
  race_date: "2026-02-01",
  category: "Open",
  division: "Open",
  total_time: "ignore-me",
  total_time_seconds: 3600,
  run_splits: { run1: "9:99" },
  station_splits: { wallBalls: "nope" },
  split_times: {
    runs: { run1: { display: "5:00", seconds: 300 } },
    stations: { wallBalls: { display: "4:00", seconds: 240 } },
    roxzone: { display: "8:00", seconds: 480 },
  },
  notes: "cramped start",
};
const structured = raceRecordFromRow(structuredRow);
assert(structured.overall.seconds === 3600, "uses stored overall seconds");
assert(structured.runs.run1.seconds === 300, "uses stored run seconds, does not reparse 9:99");
assert(structured.stations.wallBalls.seconds === 240, "uses stored station seconds");
assert(structured.roxzone.seconds === 480, "uses stored Roxzone seconds");
assert(analyzeRace(structured, null).averageRunSeconds === 300, "analysis reads seconds only");
ok("stored seconds win over display strings");

const selfReported = raceRecordFromRow({
  ...fromRowDivision,
  id: "self-1",
  weakest_station: "Wall Balls",
  weakest_run: "Run 8",
  biggest_limiter: "Grip",
});
assert(selfReported.selfReport.weakestStation === "Wall Balls", "keeps athlete-reported station");
const selfAnalysis = analyzeRace(selfReported, null);
assert(
  selfAnalysis.observations.every((item) => !/Grip|Weakest station|Hardest run/i.test(item.text)),
  "self-report is context, not an observation"
);
ok("self-report stays labelled context");

const missingEvent = parseRaceDraft({ overallTime: "1:00:00" });
assert("error" in missingEvent, "draft requires event name");
const parsed = parseRaceDraft({
  eventName: "HYROX Paris",
  division: "Open",
  category: "30-34",
  overallTime: "1:02:00",
  runSplits: { run1: "5:01" },
  stationSplits: { wallBalls: "4:12" },
});
assert(!("error" in parsed) && parsed.draft.category === "30-34", "optional category kept when division set");
assert(!("error" in parsed) && parsed.draft.runs?.run1 === "5:01", "accepts runSplits alias");
ok("draft parsing");

assert(formatRaceDelta(42) === "42s slower", "42s slower");
assert(formatRaceDelta(-42) === "42s faster", "42s faster");
assert(formatRaceDelta(0) === "unchanged", "unchanged");

const banned = /bottom\s*\d|percentile|population rank|magic score/i;
for (const item of [...overallAnalysis.observations, ...fullAnalysis.observations, ...compared.observations]) {
  assert(!banned.test(item.text), `forbidden copy: ${item.text}`);
}
ok("no percentiles or magic scores");

const contract = readFileSync(join(process.cwd(), "docs/contracts/race-intelligence.md"), "utf8");
assert(contract.includes("Do not apply 022"), "contract records unapplied 022");
assert(contract.includes("prescription engine"), "future prescription interface named");
assert(contract.includes('Never "bottom 20%"') || contract.includes("No population rank"), "contract forbids population ranks");
const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/022_hyrox_race_intelligence.sql"),
  "utf8"
);
assert(migration.includes("NOT APPLIED"), "migration file says it is not applied");
assert(migration.includes("add column if not exists total_time_seconds"), "adds numeric seconds");
assert(!/\bdrop table\b/i.test(migration), "rollback is drop column, not drop table");
const catalog = readFileSync(join(process.cwd(), "scripts/staging/lib/schemaCatalog.mjs"), "utf8");
assert(/MAX_STAGING_MIGRATION = 21/.test(catalog), "staging still refuses 022");
const applyScript = readFileSync(join(process.cwd(), "scripts/staging/apply-staging-schema.mjs"), "utf8");
assert(applyScript.includes("022") && applyScript.includes("refused"), "apply script still refuses 022");
ok("contract and unapplied 022 migration present");

const server = readFileSync(join(process.cwd(), "app/lib/hyroxRaceIntelligenceServer.ts"), "utf8");
assert(server.includes(".insert("), "writes append a new row");
assert(!server.includes(".upsert("), "race intelligence never upserts");
assert(!server.includes("upsertHyroxRaceResult"), "does not call onboarding overwrite");
const domain = readFileSync(join(process.cwd(), "app/lib/hyroxRaceIntelligence.ts"), "utf8");
assert(!/roxzone.*=.*overall|overall.*minus.*run|totalStationSeconds\s*\+/i.test(domain), "does not invent Roxzone from overall minus splits");
assert(!/percentile|bottom\s*20|population rank/i.test(domain), "domain has no rank language");
const athleteRoute = readFileSync(join(process.cwd(), "app/api/hyrox/athlete/races/route.ts"), "utf8");
assert(athleteRoute.includes("requireCurrentHyroxAthleteForApi"), "athlete API uses athlete auth");
assert(athleteRoute.includes("insertHyroxRaceRecord"), "athlete POST appends");
assert(athleteRoute.includes("isHyroxRaceIntelligenceEnabled"), "athlete flag");
const coachRoute = readFileSync(join(process.cwd(), "app/api/hyrox/athletes/[id]/races/route.ts"), "utf8");
assert(coachRoute.includes("requireHyroxCoachApi"), "coach API uses coach auth");
assert(coachRoute.includes("insertHyroxRaceRecord"), "coach POST appends");
assert(coachRoute.includes("isHyroxRaceIntelligenceEnabled"), "coach flag");
ok("write path is append-only and auth-scoped");

const previewToken = createHyroxAdminAthletePreviewToken({
  coachUserId: "coach-1",
  athleteId: "athlete-1",
});
const blocked = getAdminAthletePreviewMutationBlock(
  new Request("http://localhost/api/hyrox/athlete/races", {
    headers: { cookie: `${HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE}=${previewToken}` },
  })
);
assert(blocked.blocked === true, "preview blocks athlete race mutations");
assert(
  getAdminAthletePreviewMutationBlock(new Request("http://localhost/api/hyrox/athlete/races")).blocked === false,
  "athlete race GET/POST allowed without preview cookie"
);
ok("preview stays read-only");

console.log(`\n${passed} checks passed`);
