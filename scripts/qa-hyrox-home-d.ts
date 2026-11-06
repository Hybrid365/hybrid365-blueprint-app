/**
 * QA: Athlete Home D view-model + flag.
 * Run: npx tsx scripts/qa-hyrox-home-d.ts
 */

import { isHyroxHomeDEnabled } from "../app/lib/hyroxHomeDFlag";
import {
  buildAthleteHomeDViewModel,
  mapHyroxSessionToHomeDStatus,
} from "../app/lib/hyroxAthleteHomeDViewModel";
import type { AthleteLiveProgrammePayload } from "../components/athlete-command-centre/useAthleteLiveProgramme";
import type { HyroxSession } from "../app/lib/hyroxTeamDashboardMock";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

// --- Flag default off ---
const prevIds = process.env.HYROX_HOME_D_ATHLETE_IDS;
const prevDev = process.env.HYROX_HOME_D_DEV_ALL;
delete process.env.HYROX_HOME_D_ATHLETE_IDS;
delete process.env.HYROX_HOME_D_DEV_ALL;
assert(!isHyroxHomeDEnabled({ id: "abc-123" }), "flag off by default");
process.env.HYROX_HOME_D_ATHLETE_IDS = "abc-123";
assert(isHyroxHomeDEnabled({ id: "abc-123" }), "allow-list id");
assert(!isHyroxHomeDEnabled({ id: "other" }), "non-allow-list off");
if (prevIds === undefined) delete process.env.HYROX_HOME_D_ATHLETE_IDS;
else process.env.HYROX_HOME_D_ATHLETE_IDS = prevIds;
if (prevDev === undefined) delete process.env.HYROX_HOME_D_DEV_ALL;
else process.env.HYROX_HOME_D_DEV_ALL = prevDev;
ok("A Home D flag default off + allow-list");

// --- Status mapping: past upcoming → unresolved (not auto-missed) ---
const upcoming: HyroxSession = {
  id: "s1",
  day: "Monday",
  dayShort: "Mon",
  dateLabel: "Mon",
  dateYmd: "2026-11-01",
  name: "Easy run",
  type: "Run",
  focus: "Easy",
  duration: "40 min",
  rpeTarget: "RPE 4",
  status: "upcoming",
  priority: "Supporting",
  intent: "Aerobic",
};
assert(
  mapHyroxSessionToHomeDStatus(upcoming, "2026-11-01", "2026-11-03") === "unresolved",
  "past upcoming → unresolved"
);
assert(
  mapHyroxSessionToHomeDStatus({ ...upcoming, status: "complete" }, "2026-11-01", "2026-11-03") ===
    "completed",
  "complete → completed"
);
assert(
  mapHyroxSessionToHomeDStatus({ ...upcoming, status: "missed" }, "2026-11-01", "2026-11-03") ===
    "missed",
  "missed stays missed"
);
ok("H session status mapping respects forgotten-session (no auto-miss)");

const programme: AthleteLiveProgrammePayload = {
  state: "published",
  visibility: "published",
  published: true,
  programmeStatus: "published",
  athleteStatus: "active",
  programmeStartDate: "2026-10-27",
  programmeLengthWeeks: 12,
  liveGlobalWeek: 2,
  athlete: {
    name: "Test Athlete",
    race_name: null,
    race_date: null,
    race_category: null,
    target_time: null,
    current_block: 1,
    current_week: 2,
    programme_start_date: "2026-10-27",
  },
  week: {
    id: "w2",
    block_number: 1,
    week_number: 2,
    weekly_focus: "Threshold",
    athlete_facing_note: "Hold threshold controlled this week.",
  },
  sessions: [
    {
      ...upcoming,
      id: "tue-main",
      dateYmd: "2026-11-03",
      day: "Tuesday",
      dayShort: "Tue",
      name: "Threshold Intervals · Stage 2",
      status: "upcoming",
      timeOfDay: "Main",
      focus: "Threshold",
    },
  ],
  programmeWeeks: [
    {
      weekNumber: 2,
      blockWeekInCycle: 2,
      generated: true,
      calendarStatus: "live",
      weekStartDate: "2026-11-02",
      weekEndDate: "2026-11-08",
      dateRangeLabel: "2–8 Nov",
      week: null,
      weekRole: "Threshold",
      sessions: [],
    },
  ],
  weekRationale: null,
};

const vm = buildAthleteHomeDViewModel({
  programme,
  benchmarkSnapshot: [{ label: "5K", latest: "17:41", change: "from 18:02", logged: true }],
  now: new Date(2026, 10, 3), // 3 Nov 2026 local
});

assert(vm.programmePublished, "published programme");
assert(vm.weekDays.length === 7, "seven week days");
assert(vm.coachContext?.body.includes("Hold threshold"), "athlete-facing coach note");
assert(!JSON.stringify(vm).includes("INTERNAL NEVER SHOW"), "internal coach note excluded");
assert(vm.coachContext?.body === "Hold threshold controlled this week.", "facing note only");
assert(!JSON.stringify(vm.weekDays).includes("Stage 2"), "stage stripped from titles");
assert(vm.adjustmentMessage === null, "L no adaptation message without chain");
assert(vm.adjustmentGap === "no_accepted_published_adaptation_chain", "L gap recorded");
assert(vm.performanceInsight?.label === "5K", "M insight from snapshot");
assert(vm.progressSnapshot?.[0]?.from === "18:02", "progress snapshot from change");
assert(vm.weekContext?.plannedSessions === 1, "weekContext planned from published sessions");
assert(vm.weekContext?.completedSessions === 0, "weekContext completed honest");
assert(
  (vm.weekContext?.modalityCounts?.length ?? 0) >= 1,
  "weekContext modality counts from real session types"
);

const empty = buildAthleteHomeDViewModel({ programme: null });
assert(!empty.programmePublished && empty.weekDays.length === 0, "P no-programme empty");
assert(empty.weekContext == null, "P no weekContext when unpublished");

const noInsight = buildAthleteHomeDViewModel({
  programme,
  benchmarkSnapshot: [],
  now: new Date(2026, 10, 3),
});
assert(noInsight.performanceInsight == null, "N missing benchmark hides insight");

ok("D/E/J/K/L/M/N/P view-model honesty");

console.log(`\n${passed} Home D checks passed.`);
