/**
 * QA: HYROX Team Today readiness rule engine + session CTA helpers.
 * Run: npx --yes tsx scripts/qa-hyrox-today-readiness.ts
 */

import { computeDailyReadinessScore } from "../app/lib/hyrox-team/modules/today/readinessScore";
import {
  resolveSessionCtaState,
  resolveTodaysSessions,
  sessionCtaLabel,
} from "../app/lib/hyrox-team/modules/today/resolveTodaySessions";
import { buildTodayChecklist } from "../app/lib/hyrox-team/modules/today/checklist";
import { isHyroxTodayV2Enabled } from "../app/lib/hyrox-team/modules/today/featureFlag";
import { isHyroxDailyReadinessRelationMissing } from "../app/lib/hyrox-team/modules/today/dailyReadinessServer";
import type { HyroxSession } from "../app/lib/hyroxTeamDashboardMock";
import { toYmd, startOfLocalDay } from "../app/lib/hyroxProgrammeDates";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

function mockSession(partial: Partial<HyroxSession> & Pick<HyroxSession, "id" | "name" | "day">): HyroxSession {
  return {
    dayShort: partial.day.slice(0, 3),
    dateLabel: partial.day,
    type: "Run",
    focus: "Run",
    duration: "45 min",
    rpeTarget: "6",
    status: "upcoming",
    priority: "Key",
    intent: "Quality",
    ...partial,
  };
}

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

// --- Readiness ---
{
  const green = computeDailyReadinessScore({
    sleepQuality: 8,
    energy: 8,
    motivation: 8,
    stress: 3,
    muscleSoreness: 3,
  });
  assert(green.category === "green", "expected green");
  assert((green.score ?? 0) >= 70, "green score");
  ok("Green readiness");
}

{
  const amber = computeDailyReadinessScore({
    sleepQuality: 5,
    energy: 5,
    motivation: 5,
    stress: 6,
    muscleSoreness: 6,
  });
  assert(amber.category === "amber", `expected amber got ${amber.category}`);
  ok("Amber readiness");
}

{
  const red = computeDailyReadinessScore({
    sleepQuality: 2,
    energy: 2,
    motivation: 3,
    stress: 9,
    muscleSoreness: 8,
  });
  assert(red.category === "red", `expected red got ${red.category}`);
  ok("Red readiness");
}

{
  const illness = computeDailyReadinessScore({
    sleepQuality: 9,
    energy: 9,
    motivation: 9,
    stress: 2,
    muscleSoreness: 2,
    feelingUnwell: true,
  });
  assert(illness.category === "red", "illness override");
  assert((illness.score ?? 99) <= 30, "illness score cap");
  ok("Illness flag override");
}

{
  const missing = computeDailyReadinessScore({ sleepQuality: 7 });
  assert(missing.score == null, "missing fields → null score");
  assert(missing.category === "amber", "missing → amber");
  ok("Missing optional / sparse inputs");
}

{
  const sore = computeDailyReadinessScore({
    sleepQuality: 9,
    energy: 9,
    motivation: 9,
    stress: 2,
    muscleSoreness: 9,
  });
  assert(sore.category !== "green", "high soreness cannot stay green");
  ok("High soreness downgrade");
}

// --- CTA states ---
{
  const start = resolveSessionCtaState(mockSession({ id: "1", name: "Run", day: "Mon" }));
  assert(start === "start" && sessionCtaLabel(start) === "Start session", "start cta");
  ok("Start session CTA");
}

{
  const partial = resolveSessionCtaState(
    mockSession({ id: "1", name: "Run", day: "Mon", loggedRpe: "7", status: "upcoming" })
  );
  assert(partial === "continue_logging", "continue");
  ok("Continue logging CTA");
}

{
  const done = resolveSessionCtaState(
    mockSession({
      id: "1",
      name: "Run",
      day: "Mon",
      status: "complete",
      loggedRpe: "7",
      activityMetrics: { distanceKm: "8", rpe: "7" },
    })
  );
  assert(done === "view_result", "view result");
  ok("Completed + V2 log CTA");
}

{
  const legacy = resolveSessionCtaState(
    mockSession({ id: "1", name: "Run", day: "Mon", status: "complete", loggedRpe: "6" })
  );
  assert(legacy === "view_result", "legacy complete");
  ok("Legacy session log CTA");
}

{
  const missed = resolveSessionCtaState(
    mockSession({ id: "1", name: "Run", day: "Mon", status: "missed" })
  );
  assert(missed === "log_partial", "partial");
  ok("Skipped / missed CTA");
}

// --- Double session + recovery ---
{
  const today = startOfLocalDay(new Date());
  const dayName = today.toLocaleDateString("en-GB", { weekday: "short" }); // Mon, Tue, ...
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const startYmd = toYmd(monday);

  const sessions = [
    mockSession({ id: "am", name: "AM Run", day: dayName, timeOfDay: "AM" }),
    mockSession({
      id: "pm",
      name: "PM Strength",
      day: dayName,
      timeOfDay: "PM",
      type: "Strength",
    }),
  ];

  const empty = resolveTodaysSessions({
    programmeStartDate: null,
    globalWeekNumber: 1,
    sessions,
    today,
  });
  assert(empty.length === 0, "no start date → empty");
  ok("Recovery / no-start handling");

  const todays = resolveTodaysSessions({
    programmeStartDate: startYmd,
    globalWeekNumber: 1,
    sessions,
    today,
  });
  assert(todays.length === 2, `expected 2 sessions got ${todays.length} (day=${dayName})`);
  assert(todays[0].id === "am" && todays[1].id === "pm", "slot order + ids preserved");
  ok("Double-session day (IDs preserved)");
}

{
  const checklist = buildTodayChecklist({
    readinessSubmitted: true,
    todaysSessions: [
      mockSession({ id: "1", name: "Run", day: "Mon", status: "complete", loggedRpe: "7" }),
    ],
    coachNoteReviewed: false,
    hasCoachNote: true,
  });
  assert(checklist.some((i) => i.id === "morning_readiness" && i.done), "readiness done");
  assert(checklist.some((i) => i.id === "coach_note" && !i.done), "coach note pending");
  assert(!checklist.some((i) => i.id === "mobility_recovery"), "no fake mobility");
  ok("Checklist applicability");
}

{
  const prev = process.env.HYROX_TODAY_V2_ENABLED;
  const prevIds = process.env.HYROX_TODAY_V2_ATHLETE_IDS;
  delete process.env.HYROX_TODAY_V2_ENABLED;
  process.env.HYROX_TODAY_V2_ATHLETE_IDS = "abc-123";
  assert(isHyroxTodayV2Enabled({ id: "abc-123", email: "x@y.com" }), "allow-list id");
  assert(!isHyroxTodayV2Enabled({ id: "other", email: "x@y.com" }), "non-allow-list off");
  if (prev === undefined) delete process.env.HYROX_TODAY_V2_ENABLED;
  else process.env.HYROX_TODAY_V2_ENABLED = prev;
  if (prevIds === undefined) delete process.env.HYROX_TODAY_V2_ATHLETE_IDS;
  else process.env.HYROX_TODAY_V2_ATHLETE_IDS = prevIds;
  ok("Feature flag allow-list");
}

{
  assert(
    isHyroxDailyReadinessRelationMissing({
      code: "PGRST205",
      message: "Could not find the table 'public.hyrox_daily_readiness' in the schema cache",
    }),
    "detects schema-cache miss"
  );
  assert(
    !isHyroxDailyReadinessRelationMissing({ code: "42501", message: "permission denied" }),
    "ignores unrelated errors"
  );
  ok("Missing readiness relation detection");
}

console.log(`\nAll ${passed} Today readiness QA checks passed.`);
