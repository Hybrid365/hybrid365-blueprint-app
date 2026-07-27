/**
 * QA: HYROX Team Home V2 layout helpers.
 * Run: npm run qa:hyrox-home-v2
 */

import { isHyroxHomeV2Enabled } from "../app/lib/hyrox-team/modules/home/featureFlag";
import { resolveUpcomingProgrammeSessions } from "../app/lib/hyrox-team/modules/home/resolveUpcomingSessions";
import { sanitizeCoachInsightForAthlete } from "../app/lib/hyrox-team/modules/home/coachInsightCopy";
import { buildHomeDailyDataChecklist } from "../app/lib/hyrox-team/modules/home/buildHomeDailyDataChecklist";
import { timeAwareGreeting } from "../components/athlete-command-centre/home-v2/greeting";
import type { HyroxSession } from "../app/lib/hyroxTeamDashboardMock";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

{
  const prev = process.env.HYROX_HOME_V2_ENABLED;
  const prevIds = process.env.HYROX_HOME_V2_ATHLETE_IDS;
  delete process.env.HYROX_HOME_V2_ENABLED;
  process.env.HYROX_HOME_V2_ATHLETE_IDS = "abc-123";
  assert(isHyroxHomeV2Enabled({ id: "abc-123", email: "a@b.com" }), "id allow-list");
  assert(!isHyroxHomeV2Enabled({ id: "other", email: "a@b.com" }), "id deny");
  if (prev === undefined) delete process.env.HYROX_HOME_V2_ENABLED;
  else process.env.HYROX_HOME_V2_ENABLED = prev;
  if (prevIds === undefined) delete process.env.HYROX_HOME_V2_ATHLETE_IDS;
  else process.env.HYROX_HOME_V2_ATHLETE_IDS = prevIds;
  ok("Home V2 feature flag allow-list");
}

{
  const sessions: HyroxSession[] = [
    {
      id: "s1",
      day: "Monday",
      dayShort: "Mon",
      dateLabel: "Mon",
      name: "Easy run",
      type: "Run",
      focus: "",
      duration: "45 min",
      rpeTarget: "5",
      status: "upcoming",
      priority: "Supporting",
      intent: "",
    },
    {
      id: "s2",
      day: "Wednesday",
      dayShort: "Wed",
      dateLabel: "Wed",
      name: "Threshold",
      type: "Run",
      focus: "",
      duration: "50 min",
      rpeTarget: "7",
      status: "upcoming",
      priority: "Key",
      intent: "",
    },
  ];
  const upcoming = resolveUpcomingProgrammeSessions({
    programmeStartDate: "2026-01-05",
    programmeWeeks: [{ weekNumber: 1, sessions }],
    todayYmd: "2026-01-05",
    limit: 5,
    excludeSessionIds: ["s1"],
  });
  assert(upcoming.length === 1 && upcoming[0]?.session.id === "s2", "exclude mission ids");
  ok("Upcoming programme session resolver");
}

{
  const greet = timeAwareGreeting("Europe/London");
  assert(/Good (morning|afternoon|evening)/.test(greet), `greeting ${greet}`);
  ok("Time-aware greeting");
}

{
  const raw =
    "Generated from Block 1 review → Progress as planned. Completion: 3/5 sessions (60%). This block: Maintain aerobic volume.";
  const { body, sourceHint } = sanitizeCoachInsightForAthlete(raw);
  assert(!body.toLowerCase().includes("generated"), "strips generated language");
  assert(body.includes("Maintain aerobic volume"), "keeps athlete focus");
  assert(sourceHint?.includes("block review"), "human source hint");
  ok("Coach insight sanitization");
}

{
  const items = buildHomeDailyDataChecklist({
    todayV2Enabled: true,
    readiness: {
      submitted_at: "2026-01-01",
      bodyweight: null,
      resting_hr: null,
      feeling_unwell: false,
      coach_note_reviewed_at: null,
    } as never,
    todaysSessions: [],
    coachNoteReviewed: false,
    hasCoachNote: false,
    checkInDue: false,
    checkInComplete: true,
  });
  const readinessItem = items.find((i) => i.id === "morning_readiness");
  assert(readinessItem?.done === true, "readiness submitted counts once");
  const sleepItem = items.find((i) => i.id === "sleep_quality");
  assert(!sleepItem, "no fake per-field sleep item");
  ok("Daily data checklist accuracy");
}

console.log(`\n${passed} Home V2 QA checks passed.`);
