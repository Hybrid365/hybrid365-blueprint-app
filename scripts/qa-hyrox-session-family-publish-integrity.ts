/**
 * QA: Slice 5 — publish integrity + athlete-safe titles (no DB).
 * Run: npx tsx scripts/qa-hyrox-session-family-publish-integrity.ts
 */

import type { HyroxProgrammeWeekRow } from "../app/lib/hyroxDatabaseTypes";
import {
  collapseToCanonicalPublishedWeeks,
  comparePublishedWeekRecency,
  pickNewerPublishedWeek,
  selectCanonicalPublishedWeek,
} from "../app/lib/hyroxProgrammeWeekIdentity";
import {
  derivePublishedSessionName,
  resolveAthleteSessionDisplayName,
} from "../app/lib/hyroxProgrammeSessionSync";
import {
  athleteFacingSessionFamilyTitle,
  coachFamilyContextLabel,
  sanitizeAthleteSessionTitle,
} from "../app/lib/hyroxSessionFamilyAthleteCopy";
import { buildSessionFamilyPublishSnapshot } from "../app/lib/hyroxSessionFamilyPublish";
import { buildSessionFamilyDraftAttachment } from "../app/lib/hyroxSessionFamilyDraft";
import { getThreshold5MinRepeatsFamily } from "../app/lib/hyroxSessionFamilyRegistry";
import type { HyroxAthletePerformanceProfile } from "../app/lib/hyroxBenchmarkProfile";
import type { CoachDraftSession } from "../app/lib/hyroxCoachProgrammeDraft";
import type { HyroxProgrammeSessionRow } from "../app/lib/hyroxDatabaseTypes";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}
function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function week(
  partial: Partial<HyroxProgrammeWeekRow> & Pick<HyroxProgrammeWeekRow, "id" | "week_number">
): HyroxProgrammeWeekRow {
  return {
    athlete_id: "ath-1",
    source_draft_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    block_number: 1,
    week_start_date: "2026-01-05",
    week_end_date: "2026-01-11",
    weekly_focus: null,
    coach_note: null,
    athlete_facing_note: null,
    weekly_summary: null,
    status: "published",
    published_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

// --- Canonical week identity ---
{
  const older = week({
    id: "w-old",
    week_number: 1,
    published_at: "2026-10-01T10:00:00.000Z",
  });
  const newer = week({
    id: "w-new",
    week_number: 1,
    published_at: "2026-10-20T12:00:00.000Z",
  });
  assert(comparePublishedWeekRecency(older, newer) < 0, "newer should win");
  assert(pickNewerPublishedWeek(older, newer).id === "w-new", "pick newer");
  assert(selectCanonicalPublishedWeek([older, newer])?.id === "w-new", "canonical latest");
  assert(selectCanonicalPublishedWeek([newer, older])?.id === "w-new", "order-independent");
  ok("duplicate W1 → latest published_at wins (order-independent)");
}

{
  const w1a = week({ id: "1a", week_number: 1, published_at: "2026-10-01T00:00:00.000Z" });
  const w1b = week({ id: "1b", week_number: 1, published_at: "2026-10-25T00:00:00.000Z" });
  const w2 = week({ id: "2", week_number: 2, published_at: "2026-10-10T00:00:00.000Z" });
  const archived = week({
    id: "1c",
    week_number: 1,
    status: "archived",
    published_at: "2026-10-30T00:00:00.000Z",
  });
  const collapsed = collapseToCanonicalPublishedWeeks([w2, w1a, archived, w1b]);
  assert(collapsed.length === 2, `expected 2 weeks got ${collapsed.length}`);
  assert(collapsed[0]!.id === "1b", "W1 canonical is latest published");
  assert(collapsed[1]!.id === "2", "W2 retained");
  ok("collapse ignores archived + one row per week_number");
}

{
  // Reproduce pre-fix athlete .find bug: oldest first in array → stale week.
  const older = week({ id: "stale", week_number: 1, published_at: "2026-09-01T00:00:00.000Z" });
  const newer = week({ id: "fresh", week_number: 1, published_at: "2026-10-25T00:00:00.000Z" });
  const unordered = [older, newer];
  const buggy = unordered.find((w) => w.week_number === 1);
  assert(buggy?.id === "stale", "precondition: Array.find returns oldest");
  const fixed = selectCanonicalPublishedWeek(unordered);
  assert(fixed?.id === "fresh", "athlete read must pick fresh");
  ok("regression: duplicate W1 athlete read picks latest not oldest");
}

// --- Athlete-safe titles ---
{
  assert(
    athleteFacingSessionFamilyTitle({
      id: "threshold_5min_repeats",
      name: "Threshold — 5 Minute Repeats",
    }) === "Threshold Intervals",
    "canonical athlete title"
  );
  assert(
    sanitizeAthleteSessionTitle("Threshold — 5 Minute Repeats · S1 — Intro") ===
      "Threshold Intervals",
    "strip S1"
  );
  assert(
    sanitizeAthleteSessionTitle("Threshold progression · Stage 2") === "Threshold Intervals",
    "strip Stage 2"
  );
  assert(!/S\d|Stage|familyId|stageId/i.test(sanitizeAthleteSessionTitle("Threshold · Stage 3")), "no stage leak");
  ok("athlete title sanitisation strips stage labels");
}

{
  const label = coachFamilyContextLabel({
    familyName: "Threshold — 5 Minute Repeats",
    stageKey: "stage_2",
  });
  assert(label.includes("Stage 2"), `coach label: ${label}`);
  assert(label.includes("Threshold"), `coach family: ${label}`);
  ok("coach family context retains stage");
}

{
  const family = getThreshold5MinRepeatsFamily();
  const stage = family.stages[1]!;
  const attachment = buildSessionFamilyDraftAttachment({ family, stage });
  const draftSession = {
    title: `${family.name} · Stage 2`,
    editConfig: { sessionName: `${family.name} · Stage 2` },
    sessionFamily: attachment,
  } as unknown as CoachDraftSession;
  const publishedName = derivePublishedSessionName(draftSession);
  assert(publishedName === "Threshold Intervals", `published name was ${publishedName}`);
  assert(!/Stage|S2/i.test(publishedName), "no stage in published session_name");
  ok("derivePublishedSessionName uses athlete-facing title for family");
}

{
  const row = {
    id: "sess-1",
    programme_week_id: "w1",
    athlete_id: "ath",
    created_at: "",
    updated_at: "",
    day_of_week: "Wed",
    session_slot: "AM",
    session_name: "Threshold — 5 Minute Repeats · Stage 2",
    category: "run",
    prescription: {
      sessionFamily: {
        familyId: "threshold_5min_repeats",
        familyName: "Threshold — 5 Minute Repeats",
        stageId: "s2",
        athleteFacingTitle: "Threshold Intervals",
      },
      editConfig: { sessionName: "Threshold — 5 Minute Repeats · Stage 2", coachNote: "INTERNAL coach only" },
    },
    metadata: null,
    status: "scheduled",
    completed_at: null,
    athlete_feedback: null,
  } as unknown as HyroxProgrammeSessionRow;
  const display = resolveAthleteSessionDisplayName(row);
  assert(display === "Threshold Intervals", `display=${display}`);
  assert(!display.includes("Stage"), "no stage in display name");
  assert(!display.includes("stageId"), "no stageId leak");
  ok("athlete display name hides family metadata / stage");
}

{
  const family = getThreshold5MinRepeatsFamily();
  const stage = family.stages[0]!;
  const attachment = buildSessionFamilyDraftAttachment({ family, stage });
  const profile: HyroxAthletePerformanceProfile = {
    run5k: null,
    run10k: null,
    run30min: null,
    threshold: {
      benchmarkId: "b",
      paceSecondsPerKm: 230,
      thresholdHr: null,
      resultDate: "2026-10-01",
      source: "coach_entered",
    },
    hyroxRun: null,
    ski2k: null,
    ski1k: null,
    row2k: null,
    ftp: null,
    hyroxRace: null,
    readiness: [],
  };
  const snap = buildSessionFamilyPublishSnapshot({
    attachment,
    family,
    profile,
    publishedAt: "2026-10-25T15:00:00.000Z",
  });
  assert(snap.athleteFacingTitle === "Threshold Intervals", "snapshot athleteFacingTitle");
  assert(snap.familyId === "threshold_5min_repeats", "familyId frozen");
  assert(snap.stageId === stage.id, "stageId frozen");
  assert(snap.familyDefinitionVersion === family.definitionVersion, "definitionVersion");
  assert(snap.structuredWorkout?.blocks?.length, "structuredWorkout");
  assert(snap.slots.length > 0, "slots");
  assert(snap.publishedAt === "2026-10-25T15:00:00.000Z", "publishedAt");
  const slot = snap.slots[0]!;
  assert(slot.finalResolvedValue != null, "final result frozen");
  assert(slot.formulaResolvedValue != null, "formula result frozen");
  ok("publish snapshot includes athleteFacingTitle + frozen targets");
}

console.log(`\nqa-hyrox-session-family-publish-integrity: ${passed} checks passed`);
