/**
 * QA: Coach Command Centre — attention rules, analytics adapter, auth wiring.
 * Run: npx tsx scripts/qa-hyrox-coach-command-centre.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { athleteFacingWeeklyNote, withoutInternalWeekCoachNote } from "../app/lib/hyroxAthleteFacingCopy";
import {
  createHyroxAdminAthletePreviewToken,
  getAdminAthletePreviewMutationBlock,
} from "../app/lib/hyroxAdminAthletePreview";
import { HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE } from "../app/lib/hyroxAdminAthletePreviewPaths";
import { resolveHyroxCoachAccess } from "../app/lib/hyroxAccess";
import { isHyroxAdminProtectedPath } from "../app/lib/supabase/hyroxMiddlewareAuth";
import {
  adaptHyroxAthleteAnalytics,
  loadHyroxAthleteAnalyticsFromEngine,
  registerHyroxAthleteAnalyticsGetter,
} from "../app/lib/hyroxCommandCentreAnalyticsAdapter";
import {
  overlayAnalyticsOnThisWeek,
  summarizePublishedWeek,
} from "../app/lib/hyroxCommandCentreBuild";
import {
  evaluateCoachAttentionFlags,
  type CoachAttentionInput,
  type CoachAttentionSession,
} from "../app/lib/hyroxCoachAttention";
import { isHighRpeVsPrescribed, parsePrescribedRpeRange } from "../app/lib/hyroxCoachAttentionParse";
import type { CommandCentreThisWeek } from "../app/lib/hyroxCommandCentreTypes";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}
function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const athleteId = "athlete-1";

function session(
  partial: Partial<CoachAttentionSession> & Pick<CoachAttentionSession, "id" | "name">
): CoachAttentionSession {
  return {
    dateYmd: "2026-10-20",
    dayOfWeek: "Mon",
    slot: "Main",
    completed: false,
    isKey: false,
    loggedRpe: null,
    prescribedRpeMax: null,
    notes: null,
    painOrTightness: null,
    ...partial,
  };
}

function baseInput(overrides: Partial<CoachAttentionInput> = {}): CoachAttentionInput {
  return {
    athleteId,
    todayYmd: "2026-10-23",
    currentWeekNumber: 4,
    currentWeekCalendarStatus: "live",
    currentWeekPublished: true,
    currentWeekSessions: [],
    previousWeekSessions: [],
    recentCheckIns: [],
    currentWeekCheckIn: null,
    recentReadiness: [],
    pendingBenchmarks: [],
    ...overrides,
  };
}

function frozenWeek(partial: Record<string, unknown> = {}) {
  return {
    startDate: "2026-10-20",
    endDate: "2026-10-26",
    completeWeek: false,
    plannedSessions: 5,
    completedSessions: 3,
    completionPct: 60,
    runDistanceKm: null,
    trainingDurationMinutes: null,
    averageRpe: 6.5,
    sessionRpeLoad: null,
    keySessionsCompleted: 1,
    keySessionsPlanned: 2,
    ...partial,
  };
}

async function main() {
{
  const flags = evaluateCoachAttentionFlags(
    baseInput({ currentWeekPublished: false, currentWeekCalendarStatus: "unpublished" })
  );
  assert(flags.length === 0, "sparse: no flags");
  ok("sparse / unpublished athlete produces no attention flags");
}

{
  const flags = evaluateCoachAttentionFlags(
    baseInput({
      pendingBenchmarks: [{ id: "b1", type: "run_5k", label: "5K", resultDate: "2026-10-21" }],
    })
  );
  assert(flags.some((f) => f.code === "pending_benchmark"), "pending");
  ok("pending benchmark flag");
}

{
  const flags = evaluateCoachAttentionFlags(
    baseInput({
      currentWeekSessions: [session({ id: "s1", name: "Easy run", dateYmd: "2026-10-21" })],
    })
  );
  assert(flags.some((f) => f.code === "missed_programmed_session"), "missed");
  const future = evaluateCoachAttentionFlags(
    baseInput({
      currentWeekSessions: [session({ id: "s2", name: "Future run", dateYmd: "2026-10-24" })],
    })
  );
  assert(!future.some((f) => f.code === "missed_programmed_session"), "future");
  ok("missed programmed session; future sessions ignored");
}

{
  const flags = evaluateCoachAttentionFlags(
    baseInput({
      currentWeekSessions: [session({ id: "k1", name: "Threshold", dateYmd: "2026-10-22", isKey: true })],
    })
  );
  assert(flags.some((f) => f.code === "key_session_incomplete"), "key");
  assert(!flags.some((f) => f.code === "missed_programmed_session"), "not double");
  ok("key session incomplete is distinct");
}

{
  assert(parsePrescribedRpeRange("RPE 7–8")?.max === 8, "en dash");
  assert(isHighRpeVsPrescribed(10, 8), "10 vs 8");
  assert(!isHighRpeVsPrescribed(9, 8), "9 vs 8");
  const flags = evaluateCoachAttentionFlags(
    baseInput({
      currentWeekSessions: [
        session({ id: "r1", name: "VO2", loggedRpe: 10, prescribedRpeMax: 8, completed: true }),
      ],
    })
  );
  assert(flags.some((f) => f.code === "high_rpe_vs_prescribed"), "high rpe");
  ok("high RPE vs prescribed (+1)");
}

{
  const flags = evaluateCoachAttentionFlags(
    baseInput({
      currentWeekCheckIn: {
        id: "c1",
        weekNumber: 4,
        submittedAt: "2026-10-22T12:00:00Z",
        energy: 6,
        soreness: 8,
        painNiggles: "left calf tight",
        biggestStruggle: null,
      },
    })
  );
  assert(flags.find((f) => f.code === "pain_soreness")?.reason.includes("Not a diagnosis"), "no dx");
  ok("pain/soreness is not a diagnosis");
}

{
  const flags = evaluateCoachAttentionFlags(
    baseInput({
      recentReadiness: [{ localDate: "2026-10-22", feelingUnwell: true, muscleSoreness: 3 }],
    })
  );
  assert(flags.some((f) => f.code === "illness"), "illness");
  ok("illness flag from readiness");
}

{
  const flags = evaluateCoachAttentionFlags(
    baseInput({
      currentWeekSessions: [session({ id: "h1", name: "Legs A", notes: "heavy legs today", completed: true })],
      previousWeekSessions: [session({ id: "h2", name: "Legs B", notes: "still heavy legs", completed: true })],
    })
  );
  assert(flags.some((f) => f.code === "repeated_heavy_legs"), "two");
  ok("repeated heavy legs");
}

{
  const flags = evaluateCoachAttentionFlags(
    baseInput({
      recentCheckIns: [
        { id: "e1", weekNumber: 4, submittedAt: "2026-10-22", energy: 3, soreness: 4, painNiggles: null, biggestStruggle: null },
        { id: "e2", weekNumber: 3, submittedAt: "2026-10-15", energy: 4, soreness: 3, painNiggles: null, biggestStruggle: null },
      ],
    })
  );
  assert(flags.some((f) => f.code === "repeated_low_energy"), "energy");
  ok("repeated low energy");
}

{
  const thu = evaluateCoachAttentionFlags(baseInput({ todayYmd: "2026-10-22", currentWeekCheckIn: null }));
  assert(thu.some((f) => f.code === "missing_weekly_check_in"), "thu");
  const tue = evaluateCoachAttentionFlags(baseInput({ todayYmd: "2026-10-20", currentWeekCheckIn: null }));
  assert(!tue.some((f) => f.code === "missing_weekly_check_in"), "tue");
  ok("missing check-in from Thursday of live week");
}

{
  const noBench = evaluateCoachAttentionFlags(
    baseInput({ pendingBenchmarks: [], currentWeekPublished: false, currentWeekCalendarStatus: "unpublished" })
  );
  assert(!noBench.some((f) => f.code === "pending_benchmark"), "none");
  ok("no benchmarks does not invent pending");
}

{
  const full = evaluateCoachAttentionFlags(
    baseInput({
      pendingBenchmarks: [{ id: "b1", type: "run_5k", label: "5K", resultDate: "2026-10-21" }],
      currentWeekSessions: [
        session({ id: "s1", name: "Easy run", dateYmd: "2026-10-21" }),
        session({ id: "k1", name: "Threshold", dateYmd: "2026-10-22", isKey: true }),
        session({ id: "r1", name: "VO2", loggedRpe: 10, prescribedRpeMax: 8, completed: true }),
        session({ id: "h1", name: "Legs A", notes: "heavy legs today", completed: true, dateYmd: "2026-10-23" }),
      ],
      previousWeekSessions: [session({ id: "h2", name: "Legs B", notes: "still heavy legs", completed: true })],
      currentWeekCheckIn: {
        id: "c1",
        weekNumber: 4,
        submittedAt: "2026-10-22T12:00:00Z",
        energy: 3,
        soreness: 8,
        painNiggles: "left calf tight",
        biggestStruggle: "felt ill yesterday",
      },
      recentCheckIns: [
        { id: "c1", weekNumber: 4, submittedAt: "2026-10-22T12:00:00Z", energy: 3, soreness: 8, painNiggles: "left calf tight", biggestStruggle: "felt ill yesterday" },
        { id: "c0", weekNumber: 3, submittedAt: "2026-10-15T12:00:00Z", energy: 4, soreness: 3, painNiggles: null, biggestStruggle: null },
      ],
      recentReadiness: [{ localDate: "2026-10-22", feelingUnwell: true, muscleSoreness: 8 }],
    })
  );
  const codes = new Set(full.map((f) => f.code));
  for (const code of [
    "pending_benchmark",
    "missed_programmed_session",
    "key_session_incomplete",
    "high_rpe_vs_prescribed",
    "pain_soreness",
    "illness",
    "repeated_heavy_legs",
    "repeated_low_energy",
  ] as const) {
    assert(codes.has(code), `full-data missing ${code}`);
  }
  assert(!full.some((f) => /diagnos/i.test(f.reason) && !f.reason.includes("Not a diagnosis") && !f.reason.includes("not a diagnosis")), "no dx");
  ok("full-data flags fire together without diagnoses");
}

{
  registerHyroxAthleteAnalyticsGetter(null);
  const unloaded = await loadHyroxAthleteAnalyticsFromEngine({ athleteId });
  assert(unloaded.status === "unavailable", "status");
  assert(unloaded.analytics === null, "null analytics");
  ok("adapter returns unavailable when B is not on this branch");
}

{
  const adapted = adaptHyroxAthleteAnalytics({
    athleteId,
    generatedAt: "2026-10-23T00:00:00.000Z",
    currentWeek: frozenWeek({ runDistanceKm: 32.4, trainingDurationMinutes: 310, sessionRpeLoad: 1800, completeWeek: true }),
    previousWeek: frozenWeek({ startDate: "2026-10-13", endDate: "2026-10-19", completeWeek: true, plannedSessions: 6, completedSessions: 6, completionPct: 100 }),
    rolling4: { runDistanceKm: 110, trainingDurationMinutes: null, completionPct: 80, averageRpe: 6 },
    distribution: [{ modality: "hyrox_specific", durationMinutes: 40, sessionCount: 2 }],
    benchmarks: [
      {
        type: "run_5k",
        label: "5K",
        points: [
          {
            date: "2026-09-01",
            display: "21:00",
            normalizedValue: 1260,
            normalizedUnit: "seconds",
            source: "coach_entered",
            status: "approved",
          },
        ],
      },
    ],
    unsupported: ["wearables"],
  });
  assert(adapted?.currentWeek.runDistanceKm === 32.4, "distance");
  assert(adapted?.currentWeek.completeWeek === true, "completeWeek");
  assert(adapted?.currentWeek.keySessionsPlanned === 2, "key planned");
  assert(adapted?.distribution[0]?.modality === "hyrox_specific", "modality");
  assert(adapted?.benchmarks[0]?.points[0]?.normalizedUnit === "seconds", "unit");
  assert(adapted?.rolling4.trainingDurationMinutes === null, "null stays null");
  ok("adapter consumes frozen B payload without recomputing");
}

{
  const missingDistance = adaptHyroxAthleteAnalytics({
    athleteId,
    generatedAt: "2026-10-23T00:00:00.000Z",
    currentWeek: frozenWeek(),
    previousWeek: null,
    rolling4: { runDistanceKm: null, trainingDurationMinutes: null, completionPct: null, averageRpe: null },
    distribution: [],
    benchmarks: [],
    unsupported: ["runDistanceKm"],
  });
  assert(missingDistance?.currentWeek.runDistanceKm === null, "not zero");
  assert(missingDistance?.currentWeek.sessionRpeLoad === null, "load not zero");
  ok("adapter never fills missing volume with zeros");
}

{
  registerHyroxAthleteAnalyticsGetter(async () => ({
    athleteId,
    generatedAt: "2026-10-23T00:00:00.000Z",
    currentWeek: frozenWeek({ runDistanceKm: 12 }),
    previousWeek: null,
    rolling4: { runDistanceKm: null, trainingDurationMinutes: null, completionPct: null, averageRpe: null },
    distribution: [],
    benchmarks: [],
    unsupported: [],
  }));
  const loaded = await loadHyroxAthleteAnalyticsFromEngine({ athleteId });
  assert(loaded.status === "ok", "ok");
  assert(loaded.analytics?.currentWeek.runDistanceKm === 12, "from getter");
  registerHyroxAthleteAnalyticsGetter(null);
  ok("registered getter is consumed, not reimplemented");
}

{
  const unpublished: CommandCentreThisWeek = {
    weekNumber: 4,
    startDate: "2026-10-20",
    endDate: "2026-10-26",
    published: false,
    calendarStatus: "unpublished",
    plannedSessions: null,
    completedSessions: null,
    completionPct: null,
    runDistanceKm: null,
    trainingDurationMinutes: null,
    averageRpe: null,
    sessionRpeLoad: null,
    keySessionsCompleted: null,
    keySessionsPlanned: null,
    latestCheckIn: null,
    pendingBenchmarkCount: null,
    pendingBenchmarkUnavailable: true,
    upcomingKeySession: null,
  };
  const overlaid = overlayAnalyticsOnThisWeek(unpublished, {
    athleteId,
    generatedAt: "2026-10-23T00:00:00.000Z",
    currentWeek: frozenWeek({ runDistanceKm: 20, plannedSessions: 9, completedSessions: 9 }),
    previousWeek: null,
    rolling4: { runDistanceKm: null, trainingDurationMinutes: null, completionPct: null, averageRpe: null },
    distribution: [],
    benchmarks: [],
    unsupported: [],
  });
  assert(overlaid.plannedSessions === null, "unpublished ignores B planned");
  assert(overlaid.runDistanceKm === 20, "B distance still overlays");
  assert(overlaid.pendingBenchmarkUnavailable, "pending unavailable not zero");
  ok("unpublished week omits session counts; pending unavailable is not zero");
}

{
  const facts = summarizePublishedWeek([
    session({ id: "a", name: "A", completed: true, loggedRpe: 6, isKey: true }),
    session({ id: "b", name: "B", completed: false, isKey: true }),
  ]);
  assert(facts.plannedSessions === 2, "planned");
  assert(facts.completedSessions === 1, "done");
  assert(facts.averageRpe === 6, "rpe");
  assert(facts.keySessionsPlanned === 2 && facts.keySessionsCompleted === 1, "keys");
  ok("published week facts are session counts, not a volume engine");
}

{
  const stripped = withoutInternalWeekCoachNote({
    athlete_facing_note: "for athlete",
    coach_note: "internal only",
  });
  assert(stripped?.coach_note === null, "stripped");
  assert(athleteFacingWeeklyNote(null) === "", "empty");
  ok("internal coach note never falls into athlete copy");
}

{
  const token = createHyroxAdminAthletePreviewToken({
    coachUserId: "11111111-1111-1111-1111-111111111111",
    athleteId: "22222222-2222-2222-2222-222222222222",
  });
  const blocked = getAdminAthletePreviewMutationBlock(
    new Request("https://example.com/api/hyrox/athlete/session-log", {
      headers: { cookie: `${HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE}=${encodeURIComponent(token)}` },
    })
  );
  assert(blocked.blocked, "preview blocks");
  ok("View-as-Athlete remains mutation-safe");
}

{
  const prevInternal = process.env.INTERNAL_ADMIN_EMAILS;
  const prevCoach = process.env.HYROX_COACH_EMAILS;
  process.env.INTERNAL_ADMIN_EMAILS = "coach@example.com";
  process.env.HYROX_COACH_EMAILS = "";
  assert(!resolveHyroxCoachAccess("athlete", "athlete@example.com"), "athlete role is not coach");
  assert(!resolveHyroxCoachAccess(null, "athlete@example.com"), "unknown email is not coach");
  assert(resolveHyroxCoachAccess("coach", "anyone@example.com"), "coach role");
  assert(resolveHyroxCoachAccess(null, "coach@example.com"), "allowlisted coach email");
  if (prevInternal === undefined) delete process.env.INTERNAL_ADMIN_EMAILS;
  else process.env.INTERNAL_ADMIN_EMAILS = prevInternal;
  if (prevCoach === undefined) delete process.env.HYROX_COACH_EMAILS;
  else process.env.HYROX_COACH_EMAILS = prevCoach;
  assert(isHyroxAdminProtectedPath("/admin/hyrox-athletes/abc"), "admin protected");
  assert(!isHyroxAdminProtectedPath("/athlete/dashboard"), "athlete portal is not admin");
  assert(!isHyroxAdminProtectedPath("/admin/no-access"), "no-access is not gated as coach admin");
  ok("coach allowed; non-coach denied; athlete cannot access admin");
}

{
  const root = process.cwd();
  const route = readFileSync(join(root, "app/api/hyrox/athletes/[id]/command-centre/route.ts"), "utf8");
  assert(route.includes("requireHyroxCoachApi"), "coach gate");
  assert(!route.includes("requireCurrentHyroxAthleteForApi"), "not athlete");
  const layout = readFileSync(join(root, "app/admin/hyrox-athletes/layout.tsx"), "utf8");
  assert(layout.includes("assertHyroxCoachAccess"), "layout");
  const dashboard = readFileSync(join(root, "components/admin-hyrox-athletes/CoachAthleteDashboard.tsx"), "utf8");
  assert(dashboard.includes("CommandCentreOverview"), "mounted");
  assert(dashboard.includes("ProgrammeBuilder"), "builder remains");
  const overview = readFileSync(
    join(root, "components/admin-hyrox-athletes/CommandCentreOverview.tsx"),
    "utf8"
  );
  assert(overview.includes("/preview/start"), "view as");
  assert(overview.includes("never shown to the athlete"), "internal label");
  const adapter = readFileSync(join(root, "app/lib/hyroxCommandCentreAnalyticsAdapter.ts"), "utf8");
  assert(!adapter.includes("adaptSessionsToHyroxAthleteAnalytics"), "no session rollup");
  assert(adapter.includes("unavailable"), "unavailable path");
  ok("coach API + admin layout + overview wiring");
}

console.log(`\n${passed} checks passed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
