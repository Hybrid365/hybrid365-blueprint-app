/**
 * QA: HYROX Team Home V2 layout helpers.
 * Run: npm run qa:hyrox-home-v2
 */

import { isHyroxHomeV2Enabled } from "../app/lib/hyrox-team/modules/home/featureFlag";
import { resolveUpcomingProgrammeSessions } from "../app/lib/hyrox-team/modules/home/resolveUpcomingSessions";
import { sanitizeCoachInsightForAthlete } from "../app/lib/hyrox-team/modules/home/coachInsightCopy";
import { buildHomeDailyDataChecklist, homeDailyDataProgress } from "../app/lib/hyrox-team/modules/home/buildHomeDailyDataChecklist";
import {
  isPopulatedTargetValue,
  resolveCompactSessionTargets,
} from "../app/lib/hyrox-team/modules/home/resolveCompactSessionTargets";
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
    checkInComplete: false,
  });
  const readinessItem = items.find((i) => i.id === "morning_readiness");
  assert(readinessItem?.done === true, "readiness submitted counts once");
  const sleepItem = items.find((i) => i.id === "sleep_quality");
  assert(!sleepItem, "no fake per-field sleep item");
  const painItem = items.find((i) => i.id === "pain_reported");
  assert(!painItem, "illness/pain not a checklist item");
  const { complete, total } = homeDailyDataProgress(items);
  assert(complete === 1 && total === 1, "only required items in completion score");
  const bw = items.find((i) => i.id === "bodyweight");
  assert(bw?.required === false, "bodyweight optional");
  ok("Daily data checklist accuracy");
}

{
  const items = buildHomeDailyDataChecklist({
    todayV2Enabled: true,
    readiness: {
      submitted_at: "2026-01-01",
      bodyweight: null,
      resting_hr: null,
      feeling_unwell: false,
    } as never,
    todaysSessions: [
      {
        id: "s1",
        day: "Mon",
        dayShort: "Mon",
        dateLabel: "Mon",
        name: "Lower strength",
        type: "Strength",
        focus: "Strength",
        duration: "60 min",
        rpeTarget: "6–7",
        status: "upcoming",
        priority: "Key",
        intent: "Build lower strength",
        plannedTargets: {
          targetRPE: "6–7",
          targetLoad: "Top sets @ RPE 7",
          activityType: "strength",
        },
      },
    ],
    coachNoteReviewed: false,
    hasCoachNote: false,
    checkInDue: false,
    checkInComplete: false,
  });
  const { total } = homeDailyDataProgress(items);
  assert(total === 3, "readiness + session complete + session log required");
  ok("Checklist required-only denominator with session");
}

{
  assert(!isPopulatedTargetValue("See session prescription"), "rejects placeholder");
  const strengthTargets = resolveCompactSessionTargets(
    {
      id: "str1",
      day: "Mon",
      dayShort: "Mon",
      dateLabel: "Mon",
      name: "Lower strength",
      type: "Strength",
      focus: "",
      duration: "60 min",
      rpeTarget: "6–7",
      status: "upcoming",
      priority: "Key",
      intent: "",
      plannedTargets: { targetRPE: "6–7", targetLoad: "5×5 @ RPE 7", activityType: "strength" },
    },
    {
      sessionId: "str1",
      weekLabel: "Mon",
      categoryTag: "Strength",
      objective: "Lower strength",
      durationMin: 60,
      rpeTarget: "6–7",
      hrZone: "RPE 4–5 on accessories",
      targetPaceLoad: "See session prescription",
      tags: [],
      warmUp: [],
      mainSet: [],
      coolDown: [],
      coachNote: "",
      recordFields: [],
    }
  );
  assert(
    !strengthTargets.some((t) => t.label === "Pace" || t.label === "HR"),
    "strength skips pace/hr"
  );
  assert(strengthTargets.some((t) => t.label === "Target RPE"), "strength shows RPE");
  ok("Modality-aware compact session targets");
}

console.log(`\n${passed} Home V2 QA checks passed.`);
