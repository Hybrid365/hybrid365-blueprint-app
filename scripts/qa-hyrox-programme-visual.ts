/**
 * QA: Programme v0 visual parity + published status honesty.
 * Run: npx tsx scripts/qa-hyrox-programme-visual.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  groupProgrammeSessionsByDay,
  hyroxSessionToProgrammeCardViewModel,
} from "../app/lib/visual-system/programmeSessionCardAdapter";
import type { HyroxSession } from "../app/lib/hyroxTeamDashboardMock";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

{
  const view = read("components/athlete-command-centre/ProgrammePageView.tsx");
  assert.match(view, /data-programme-visual=["']v0-parity["']/);
  assert.match(view, /ProgrammeSessionRow/);
  assert.match(view, /groupProgrammeSessionsByDay/);
  assert.match(view, /AthleteCoachNote/);
  assert.doesNotMatch(view, /WeekSessionCard/);
  assert.doesNotMatch(view, /SessionStatusBadge/);
  // Past-week "all complete" lie removed
  assert.doesNotMatch(view, /mode === "past"[\s\S]{0,80}complete/);
  assert.doesNotMatch(view, /\?\s*\("complete"/);
  ok("Programme page uses visual-system rows; no past-complete remap");
}

{
  const row = read(
    "components/athlete-command-centre/visual-system/sessions/ProgrammeSessionRow.tsx"
  );
  assert.match(row, /SessionStatusPill/);
  assert.match(row, /CompactWorkoutPreview/);
  assert.match(row, /min-h-11/);
  ok("ProgrammeSessionRow uses Home status + optional timeline");
}

{
  const adapter = read("app/lib/visual-system/programmeSessionCardAdapter.ts");
  assert.match(adapter, /mapHyroxSessionToHomeDStatus/);
  assert.match(adapter, /never remaps past/);
  assert.doesNotMatch(adapter, /\/admin\//);
  ok("programme adapter maps honest Home D statuses");
}

{
  const base: HyroxSession = {
    id: "s1",
    name: "Threshold Intervals · Stage 2",
    type: "Run",
    day: "Tuesday",
    dayShort: "Tue",
    dateLabel: "Tue 3 Nov",
    dateYmd: "2026-11-03",
    duration: "55 min",
    focus: "Threshold",
    intent: "Hold controlled",
    status: "missed",
    priority: "Key",
    timeOfDay: "Main",
    rpeTarget: "7-8",
    coachNote: "Athlete-safe cue",
  };

  const card = hyroxSessionToProgrammeCardViewModel(base, {
    now: new Date(2026, 10, 6),
  });
  assert.equal(card.status, "missed");
  assert.doesNotMatch(card.title, /Stage 2/);
  assert.equal(card.focusLabel, "Key");
  ok("missed past session stays missed; Stage stripped");

  const complete = hyroxSessionToProgrammeCardViewModel(
    { ...base, status: "complete" },
    { now: new Date(2026, 10, 6) }
  );
  assert.equal(complete.status, "completed");
  ok("complete maps to completed pill vocabulary");

  const upcomingPast = hyroxSessionToProgrammeCardViewModel(
    { ...base, id: "s2", status: "upcoming", dateYmd: "2026-11-02" },
    { now: new Date(2026, 10, 6) }
  );
  assert.equal(upcomingPast.status, "unresolved");
  ok("past unresolved stays Not logged (unresolved)");
}

{
  const sessions: HyroxSession[] = [
    {
      id: "a",
      name: "Easy Run",
      type: "Run",
      day: "Monday",
      dayShort: "Mon",
      dateLabel: "Mon 2 Nov",
      dateYmd: "2026-11-02",
      duration: "45 min",
      focus: "Aerobic",
      intent: "",
      status: "complete",
      priority: "Key",
      timeOfDay: "AM",
      rpeTarget: "",
    },
    {
      id: "b",
      name: "Threshold",
      type: "Run",
      day: "Tuesday",
      dayShort: "Tue",
      dateLabel: "Tue 3 Nov",
      dateYmd: "2026-11-03",
      duration: "60 min",
      focus: "Threshold",
      intent: "",
      status: "upcoming",
      priority: "Key",
      timeOfDay: "Main",
      rpeTarget: "",
    },
  ];
  const days = groupProgrammeSessionsByDay(sessions, {
    weekStartYmd: "2026-11-02",
    now: new Date(2026, 10, 6),
  });
  assert.equal(days.length, 7);
  assert.equal(days[0]!.sessions.length, 1);
  assert.equal(days[1]!.sessions.length, 1);
  assert.equal(days[2]!.sessions.length, 0);
  assert.ok(days.some((d) => d.sessions.length === 0));
  ok("week grouping includes empty days when week start known");
}

{
  const shell = read("components/athlete-command-centre/AthletePortalShell.tsx");
  assert.match(shell, /data-athlete-shell="v0"/);
  ok("Programme still sits in canonical athlete shell");
}

{
  const view = read("components/athlete-command-centre/ProgrammePageView.tsx");
  assert.doesNotMatch(view, /hyrox_programme_drafts|draft_data|unpublished draft/i);
  assert.match(view, /athlete_facing_note/);
  assert.doesNotMatch(view, /week\.coach_note|internalCoachNotes/);
  assert.match(view, /useLive && !useMock && !previewMode/);
  ok("published/draft isolation — no draft tables; athlete-facing notes only");
}

console.log(`\nqa-hyrox-programme-visual: ${passed} passed`);
