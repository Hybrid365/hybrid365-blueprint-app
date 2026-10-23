/**
 * QA: HYROX athlete analytics foundation.
 * Run: npx --yes tsx scripts/qa-hyrox-athlete-analytics.ts
 */
import {
  ANALYTICS_UNSUPPORTED_METRICS,
  analyticsWeekContaining,
  computeHyroxAthleteAnalytics,
  mapActivityToModality,
  readLoggedAnalyticsMetrics,
  shiftAnalyticsWeek,
} from "../app/lib/hyroxAthleteAnalytics";
import { isHyroxAnalyticsEnabled, isHyroxAthleteAnalyticsEnabled } from "../app/lib/hyroxAthleteAnalyticsFlag";
import type { HyroxAnalyticsSessionInput } from "../app/lib/hyroxAthleteAnalytics";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}
let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}
function session(partial: Partial<HyroxAnalyticsSessionInput> & { calendarYmd: string }): HyroxAnalyticsSessionInput {
  return {
    status: "scheduled",
    sessionSlot: "Main",
    category: "Run",
    sessionName: "Easy run",
    metadata: null,
    activityType: "run",
    durationMinutes: null,
    runDistanceKm: null,
    rpe: null,
    ...partial,
  };
}
const WED = new Date("2026-07-22T12:00:00Z");
const SUN = new Date("2026-07-26T12:00:00Z");
const MON = new Date("2026-07-20T12:00:00Z");
const NEXT_MON = new Date("2026-07-27T12:00:00Z");

{
  const week = analyticsWeekContaining(WED, "UTC");
  assert(week.startDate === "2026-07-20" && week.endDate === "2026-07-26", "Wed week");
  assert(analyticsWeekContaining(SUN, "UTC").startDate === "2026-07-20", "Sunday same week");
  const previous = shiftAnalyticsWeek(week, -1);
  assert(previous.startDate === "2026-07-13" && previous.endDate === "2026-07-19", "previous week");
  ok("Monday-Sunday week containing asOf");
}
{
  const prevEnabled = process.env.HYROX_ATHLETE_ANALYTICS_ENABLED;
  const prevIds = process.env.HYROX_ATHLETE_ANALYTICS_ATHLETE_IDS;
  const prevV1 = process.env.HYROX_ANALYTICS_V1_ENABLED;
  delete process.env.HYROX_ATHLETE_ANALYTICS_ENABLED;
  delete process.env.HYROX_ATHLETE_ANALYTICS_ATHLETE_IDS;
  delete process.env.HYROX_ATHLETE_ANALYTICS_ATHLETE_EMAILS;
  delete process.env.HYROX_ATHLETE_ANALYTICS_DEV_ALL;
  delete process.env.HYROX_ANALYTICS_V1_ENABLED;
  delete process.env.HYROX_ANALYTICS_V1_ATHLETE_IDS;
  delete process.env.HYROX_ANALYTICS_V1_ATHLETE_EMAILS;
  delete process.env.HYROX_ANALYTICS_V1_DEV_ALL;
  assert(!isHyroxAnalyticsEnabled({ id: "abc", email: "a@b.com" }), "default off");
  assert(!isHyroxAthleteAnalyticsEnabled({ id: "abc" }), "alias default off");
  process.env.HYROX_ATHLETE_ANALYTICS_ATHLETE_IDS = "abc-123";
  assert(isHyroxAnalyticsEnabled({ id: "abc-123" }), "id allow-list");
  assert(!isHyroxAnalyticsEnabled({ id: "other" }), "id deny");
  if (prevEnabled === undefined) delete process.env.HYROX_ATHLETE_ANALYTICS_ENABLED;
  else process.env.HYROX_ATHLETE_ANALYTICS_ENABLED = prevEnabled;
  if (prevIds === undefined) delete process.env.HYROX_ATHLETE_ANALYTICS_ATHLETE_IDS;
  else process.env.HYROX_ATHLETE_ANALYTICS_ATHLETE_IDS = prevIds;
  if (prevV1 === undefined) delete process.env.HYROX_ANALYTICS_V1_ENABLED;
  else process.env.HYROX_ANALYTICS_V1_ENABLED = prevV1;
  ok("Feature flag default off + allow-list");
}
{
  const payload = computeHyroxAthleteAnalytics({ athleteId: "a1", asOf: WED, timeZone: "UTC", sessions: [], benchmarks: [] });
  assert(payload.athleteId === "a1", "athleteId");
  assert(typeof payload.asOf === "string" && payload.asOf.length > 0, "asOf");
  assert(payload.currentWeek.plannedSessions === 0 && payload.currentWeek.completionPct === null, "empty current");
  assert(payload.currentWeek.complete === false, "in-progress week is incomplete");
  assert(payload.currentWeek.runDistanceKm === null && payload.currentWeek.sessionRpeLoad === null, "nulls");
  assert(payload.currentWeek.startDate === "2026-07-20" && payload.currentWeek.endDate === "2026-07-26", "current dates");
  assert(payload.currentWeek.keySessionsPlanned === 0, "key planned");
  assert(payload.previousWeek?.startDate === "2026-07-13", "previous week dated");
  assert(payload.benchmarks.length === 0 && payload.distribution.length === 0, "no mock series");
  assert(!("generatedAt" in payload), "no generatedAt");
  for (const metric of ANALYTICS_UNSUPPORTED_METRICS) assert(payload.unsupported.includes(metric), metric);
  ok("No sessions");
}
{
  const payload = computeHyroxAthleteAnalytics({
    athleteId: "a1", asOf: WED, timeZone: "UTC",
    sessions: [
      session({ calendarYmd: "2026-07-20", status: "completed", durationMinutes: 40, runDistanceKm: 8, rpe: 6 }),
      session({ calendarYmd: "2026-07-22", status: "scheduled" }),
      session({ calendarYmd: "2026-07-24", status: "scheduled", sessionName: "Friday long run" }),
    ],
    benchmarks: [],
  });
  assert(payload.currentWeek.complete === false, "Wednesday week incomplete");
  assert(payload.currentWeek.plannedSessions === 3, `planned ${payload.currentWeek.plannedSessions}`);
  assert(payload.currentWeek.completedSessions === 1 && payload.currentWeek.completionPct === 33, "Friday still planned");
  ok("Partial week");
}
{
  const payload = computeHyroxAthleteAnalytics({
    athleteId: "a1", asOf: NEXT_MON, timeZone: "UTC",
    sessions: [
      session({ calendarYmd: "2026-07-20", status: "completed", durationMinutes: 40, rpe: 6 }),
      session({ calendarYmd: "2026-07-22", status: "completed", durationMinutes: 50, rpe: 7 }),
      session({ calendarYmd: "2026-07-24", status: "completed", durationMinutes: 70, rpe: 8 }),
    ],
    benchmarks: [],
  });
  assert(payload.previousWeek?.complete === true, "closed week complete");
  assert(payload.previousWeek?.completionPct === 100, "complete");
  assert(payload.previousWeek?.trainingDurationMinutes === 160, "duration");
  assert(payload.previousWeek?.averageRpe === 7, "rpe");
  assert(payload.previousWeek?.sessionRpeLoad === 40 * 6 + 50 * 7 + 70 * 8, "load");
  ok("Complete week");
}
{
  const payload = computeHyroxAthleteAnalytics({
    athleteId: "a1", asOf: SUN, timeZone: "UTC",
    sessions: [
      session({ calendarYmd: "2026-07-20", status: "completed" }),
      session({ calendarYmd: "2026-07-22", status: "missed" }),
      session({ calendarYmd: "2026-07-24", status: "modified" }),
    ],
    benchmarks: [],
  });
  assert(payload.currentWeek.complete === false, "Sunday still incomplete");
  assert(payload.currentWeek.plannedSessions === 3 && payload.currentWeek.completedSessions === 1, "missed not completed");
  assert(payload.currentWeek.completionPct === 33, "33%");
  ok("Missed sessions");
}
{
  const payload = computeHyroxAthleteAnalytics({
    athleteId: "a1", asOf: WED, timeZone: "UTC",
    sessions: [
      session({ calendarYmd: "2026-07-20", status: "completed", rpe: 8, durationMinutes: null }),
      session({ calendarYmd: "2026-07-22", status: "completed", durationMinutes: 45, rpe: null }),
    ],
    benchmarks: [],
  });
  assert(payload.currentWeek.averageRpe === 8 && payload.currentWeek.trainingDurationMinutes === 45, "partial metrics");
  assert(payload.currentWeek.sessionRpeLoad === null, "load needs both");
  ok("Missing duration or RPE");
}
{
  const payload = computeHyroxAthleteAnalytics({
    athleteId: "a1", asOf: WED, timeZone: "UTC",
    sessions: [
      session({ calendarYmd: "2026-07-20", status: "completed", activityType: "run", durationMinutes: 40, runDistanceKm: 7 }),
      session({ calendarYmd: "2026-07-21", status: "completed", activityType: "strength", category: "Strength", sessionName: "Lower", runDistanceKm: null, rpe: 7 }),
      session({ calendarYmd: "2026-07-22", status: "completed", activityType: "ski", category: "Ski", sessionName: "Ski 2k", durationMinutes: 12 }),
    ],
    benchmarks: [],
  });
  const names = payload.distribution.map((row) => row.modality);
  assert(names.includes("run") && names.includes("strength") && names.includes("skierg"), "modalities");
  assert(payload.distribution.find((row) => row.modality === "strength")?.durationMinutes === null, "strength duration");
  ok("Multiple modalities");
}
{
  const payload = computeHyroxAthleteAnalytics({
    athleteId: "a1", asOf: WED, timeZone: "UTC", sessions: [],
    benchmarks: [
      { type: "run_5k", label: "5K", date: "2026-01-10", display: "20:10", normalizedValue: 1210, source: "coach", status: "approved" },
      { type: "run_5k", label: "5K", date: "2026-04-02", display: "19:40", normalizedValue: 1180, source: "athlete", status: "approved" },
      { type: "ski_2k", label: "2K Ski", date: "2026-03-01", display: "7:20", normalizedValue: 440, source: "coach", status: "approved" },
      { type: "run_5k", label: "5K", date: "2026-02-01", display: "19:55", normalizedValue: 1195, source: "athlete", status: "rejected" },
    ],
  });
  const fiveK = payload.benchmarks.find((series) => series.type === "run_5k");
  assert(fiveK?.points.length === 2 && fiveK.points[0]?.date === "2026-01-10", "two 5K points");
  assert(fiveK?.points[0]?.source === "coach" && fiveK.points[0]?.status === "approved", "source/status");
  assert(payload.benchmarks.find((series) => series.type === "ski_2k")?.points.length === 1, "one ski");
  ok("Benchmark history");
}
{
  const payload = computeHyroxAthleteAnalytics({
    athleteId: "a1", asOf: MON, timeZone: "UTC",
    sessions: [
      session({ calendarYmd: "2026-07-19", status: "completed", durationMinutes: 30, rpe: 5 }),
      session({ calendarYmd: "2026-07-20", status: "completed", durationMinutes: 40, rpe: 6 }),
    ],
    benchmarks: [],
  });
  assert(payload.previousWeek?.completedSessions === 1 && payload.currentWeek.completedSessions === 1, "crossing");
  ok("Week-crossing");
}
{
  const sessions: HyroxAnalyticsSessionInput[] = [];
  for (const monday of ["2026-06-29", "2026-07-06", "2026-07-13", "2026-07-20"]) {
    sessions.push(session({ calendarYmd: monday, status: "completed", durationMinutes: 40, runDistanceKm: 8, rpe: 6 }));
    sessions.push(session({ calendarYmd: monday, status: "missed", sessionName: "Second" }));
  }
  sessions.push(session({ calendarYmd: "2026-07-24", status: "scheduled", sessionName: "Future Friday" }));
  const payload = computeHyroxAthleteAnalytics({ athleteId: "a1", asOf: WED, timeZone: "UTC", sessions, benchmarks: [] });
  assert(payload.currentWeek.complete === false, "current incomplete");
  assert(payload.currentWeek.plannedSessions === 3, "current week includes remaining Friday");
  assert(payload.rolling4.completionPct === 50, `rolling ${payload.rolling4.completionPct}`);
  assert(payload.rolling4.runDistanceKm === 32, "rolling km");
  ok("Rolling 4-week");
}
{
  const logged = readLoggedAnalyticsMetrics({
    rpe: "7",
    planned: { estimatedDurationMinutes: 60 },
    activityType: "strength",
    metrics: { sessionRpe: "8" },
  });
  assert(logged.durationMinutes === null, "planned duration ignored");
  assert(logged.rpe === 8, "strength rpe");
  ok("Logged metrics ignore planned duration");
}
{
  assert(mapActivityToModality("ski", "Ski", "Ski 2k") === "skierg", "skierg");
  assert(mapActivityToModality("row", "Row", "Row 2k") === "rowerg", "rowerg");
  assert(mapActivityToModality("hyrox", "HYROX", "Race sim") === "hyrox_specific", "hyrox_specific");
  ok("Modality map");
}
{
  const a = computeHyroxAthleteAnalytics({ athleteId: "a1", asOf: WED, timeZone: "UTC", sessions: [session({ calendarYmd: "2026-07-20", status: "completed", durationMinutes: 40, rpe: 6 })], benchmarks: [] });
  const b = computeHyroxAthleteAnalytics({ athleteId: "a1", asOf: WED, timeZone: "UTC", sessions: [session({ calendarYmd: "2026-07-20", status: "completed", durationMinutes: 40, rpe: 6 })], benchmarks: [] });
  assert(JSON.stringify(a) === JSON.stringify(b), "deterministic");
  ok("Deterministic");
}
console.log(`\n${passed} checks passed`);
