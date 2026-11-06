/**
 * QA: Home D → visual-system adapters (Batch 1).
 * Run: npx tsx scripts/qa-hyrox-home-d-visual.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  homeDDaysToWeekDateNav,
  homeDSessionToCardViewModel,
  sortHomeDSessionsBySlot,
  splitPrimarySecondarySessions,
} from "../app/lib/visual-system/homeDSessionCardAdapter";
import { inferTimelineModality } from "../app/lib/visual-system/timelineModality";
import { extractAthleteStructuredWorkout } from "../app/lib/visual-system/extractStructuredWorkout";
import {
  buildWorkoutTimelineViewModel,
  summarizeWorkoutLoad,
} from "../app/lib/visual-system/workoutTimelineViewModel";
import { buildHyroxAthleteSessionFeedback } from "../app/lib/hyroxAthleteSessionFeedback";
import { programmeStatusForCompletion } from "../app/lib/hyroxSessionExecutionSummary";
import type { AthleteHomeDDay, AthleteHomeDSessionCard } from "../app/lib/hyroxAthleteHomeDViewModel";
import type { HyroxSession } from "../app/lib/hyroxTeamDashboardMock";
import type { StructuredWorkout } from "../app/lib/hyroxSessionFamilyTypes";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

function card(
  partial: Partial<AthleteHomeDSessionCard> & Pick<AthleteHomeDSessionCard, "id" | "slot">
): AthleteHomeDSessionCard {
  return {
    modalityLabel: "Run",
    title: "Session",
    primaryTarget: null,
    primaryDetail: null,
    duration: "40 min",
    intent: null,
    coachNote: null,
    status: "upcoming",
    ...partial,
  };
}

// --- Modality inference ---
{
  assert.equal(inferTimelineModality({ sessionType: "Run" }), "run");
  assert.equal(inferTimelineModality({ sessionType: "Strength" }), "strength");
  assert.equal(inferTimelineModality({ sessionName: "Ski intervals" }), "ski");
  assert.equal(inferTimelineModality({ sessionName: "Row 2k" }), "row");
  assert.equal(inferTimelineModality({ focus: "Bike FTP" }), "bike");
  assert.equal(inferTimelineModality({ sessionName: "Sled push density" }), "station");
  assert.equal(inferTimelineModality({ familyModality: "hyrox" }), "station");
  assert.equal(inferTimelineModality({ sessionType: "Hybrid", sessionName: "Mixed" }), "other");
  assert.equal(inferTimelineModality({}), "other");
  assert.notEqual(inferTimelineModality({ sessionName: "Mystery session" }), "run");
  ok("modality inference — unknown is other, never invents run");
}

{
  const workout: StructuredWorkout = {
    warmup: [],
    blocks: [
      {
        type: "repeat",
        reps: 2,
        work: { kind: "time", value: 60, unit: "sec" },
        recoveries: [{ durationSeconds: 30, type: "walk" }],
      },
    ],
    cooldown: [],
    guidance: [],
  };
  const bare = buildWorkoutTimelineViewModel(workout);
  assert.ok(bare.segments.every((s) => s.kind === "recovery" || s.modality === "other"));
  const ski = buildWorkoutTimelineViewModel(workout, { workModality: "ski" });
  assert.ok(ski.segments.filter((s) => s.kind === "work").every((s) => s.modality === "ski"));
  ok("timeline work modality defaults to other; explicit ski preserved");
}

// --- StructuredWorkout extract (no family IDs) ---
{
  const prescription = {
    sessionFamily: {
      familyId: "fam_secret",
      stageId: "stage_3",
      stageLabel: "Stage 3",
      structuredWorkout: {
        warmup: [],
        blocks: [
          {
            type: "continuous",
            work: { kind: "time", value: 1200, unit: "sec" },
          },
        ],
        cooldown: [],
        guidance: [],
      },
    },
  };
  const sw = extractAthleteStructuredWorkout(prescription);
  assert.ok(sw);
  assert.equal(sw!.blocks.length, 1);
  const json = JSON.stringify(sw);
  assert.doesNotMatch(json, /fam_secret|stage_3|Stage 3|familyId|stageId/);
  ok("extract StructuredWorkout strips family metadata");
}

// --- Slot order primary ---
{
  const sessions = [
    card({ id: "pm", slot: "PM", title: "PM run" }),
    card({ id: "am", slot: "AM", title: "AM strength", modalityLabel: "Strength" }),
    card({ id: "main", slot: "Main", title: "Threshold" }),
  ];
  const ordered = sortHomeDSessionsBySlot(sessions);
  assert.deepEqual(
    ordered.map((s) => s.id),
    ["am", "main", "pm"]
  );
  const split = splitPrimarySecondarySessions(sessions);
  assert.equal(split.primary?.id, "am");
  assert.deepEqual(
    split.secondary.map((s) => s.id),
    ["main", "pm"]
  );
  assert.equal(split.rule, "slot_order_first");
  ok("primary = first by AM→Main→PM→Optional slot order");
}

// --- Card adapter honesty ---
{
  const homeCard = card({
    id: "s1",
    slot: "Main",
    title: "Threshold 5s",
    primaryTarget: "3:55 /km",
    coachNote: "Hold effort",
    status: "upcoming",
  });
  const live: HyroxSession = {
    id: "s1",
    day: "Monday",
    dayShort: "Mon",
    dateLabel: "Mon",
    name: "Threshold 5s",
    type: "Run",
    focus: "Threshold",
    duration: "45 min",
    rpeTarget: "RPE 7",
    status: "upcoming",
    priority: "Key",
    intent: "Quality",
    structuredWorkout: {
      warmup: [],
      blocks: [
        {
          type: "repeat",
          reps: 2,
          work: { kind: "time", value: 300, unit: "sec" },
          recoveries: [{ durationSeconds: 90, type: "jog" }],
        },
      ],
      cooldown: [],
      guidance: [],
    },
  };
  const vm = homeDSessionToCardViewModel(homeCard, live);
  assert.equal(vm.title, "Threshold 5s");
  assert.equal(vm.primaryTarget, "3:55 /km");
  assert.equal(vm.coachNote, "Hold effort");
  assert.ok(vm.timeline);
  assert.equal(vm.timeline!.support, "supported");
  assert.ok(vm.timeline!.segments.every((s) => s.kind === "recovery" || s.modality === "run"));
  const serialized = JSON.stringify(vm);
  assert.doesNotMatch(serialized, /familyId|stageId|Stage\s*\d|automationEligibility/);
  ok("Home D → card VM maps athlete-safe fields + run modality from type");
}

// --- Presentation polish: dedupe objective wall + drop placeholder targets ---
{
  const longIntent =
    "Build upper-body pulling/pushing strength endurance with short, dense EMOM work.";
  const homeCard = card({
    id: "s-dup",
    slot: "Main",
    title: "Upper Body Density EMOM",
    modalityLabel: "Strength",
    intent: longIntent,
    primaryDetail: longIntent,
    primaryTarget: "See session prescription",
    duration: "35–55 min",
    status: "unresolved",
  });
  const vm = homeDSessionToCardViewModel(homeCard);
  assert.equal(vm.prescriptionLine, null);
  assert.equal(vm.objective, longIntent);
  assert.equal(vm.durationLabel, "35–55 min");
  assert.equal(vm.primaryTarget, null);
  ok("card VM dedupes objective into single row and hides placeholder target");
}

{
  const homeCard = card({
    id: "s-distinct",
    slot: "Main",
    title: "Threshold 5s",
    primaryDetail: "5 × 5:00 @ 3:55 /km · 1:30 jog",
    intent: "Accumulate quality threshold work.",
    primaryTarget: "3:55 /km",
    duration: "~45 min",
  });
  const vm = homeDSessionToCardViewModel(homeCard);
  assert.equal(vm.prescriptionLine, "5 × 5:00 @ 3:55 /km · 1:30 jog");
  assert.equal(vm.objective, "Accumulate quality threshold work.");
  assert.equal(vm.primaryTarget, "3:55 /km");
  assert.equal(vm.durationLabel, "~45 min");
  ok("card VM keeps distinct prescription + objective + real target");
}

{
  const homeCard = card({
    id: "s2",
    slot: "Main",
    title: "Station density",
    modalityLabel: "Hybrid",
  });
  const live: HyroxSession = {
    id: "s2",
    day: "Tue",
    dayShort: "Tue",
    dateLabel: "Tue",
    name: "Station density",
    type: "Hybrid",
    focus: "Hyrox",
    duration: "50 min",
    rpeTarget: "RPE 7",
    status: "upcoming",
    priority: "Key",
    intent: "Stations",
    structuredWorkout: {
      warmup: [],
      blocks: [
        {
          type: "station_round",
          rounds: 4,
          station: { name: "Sled" },
        },
      ],
      cooldown: [],
      guidance: [],
    },
  };
  const vm = homeDSessionToCardViewModel(homeCard, live);
  assert.equal(vm.timeline, null);
  ok("unsupported StructuredWorkout omits timeline (no fabricate)");
}

{
  const days: AthleteHomeDDay[] = [
    {
      id: "2026-11-03",
      dow: "Mon",
      dateNumber: 3,
      iso: "2026-11-03",
      isToday: false,
      isPast: true,
      sessions: [card({ id: "a", slot: "Main", status: "completed" })],
    },
    {
      id: "2026-11-04",
      dow: "Tue",
      dateNumber: 4,
      iso: "2026-11-04",
      isToday: true,
      isPast: false,
      sessions: [],
    },
  ];
  const nav = homeDDaysToWeekDateNav(days);
  assert.equal(nav[0]!.sessionStatuses?.[0], "completed");
  assert.equal(nav[1]!.isToday, true);
  assert.deepEqual(nav[1]!.sessionStatuses, []);
  ok("WeekDateNav VM maps real Home D day statuses");
}

// --- Production wiring guards ---
{
  const dash = read("components/athlete-command-centre/home-d/AthleteHomeDDashboard.tsx");
  assert.match(dash, /WeekDateNav/);
  assert.match(dash, /PrimarySessionCard/);
  assert.match(dash, /SecondarySessionRow/);
  assert.match(dash, /SessionDrawer/);
  assert.match(dash, /openSession/);
  assert.match(dash, /HomeInsightsPanel/);
  assert.doesNotMatch(dash, /labFixtures|LAB_REPEAT|from ['"].*\/lab\//);
  assert.match(dash, /data-home-d-visual=["']v0-home-parity["']/);
  assert.match(dash, /320px/);
  ok("Home D dashboard wires visual system + SessionDrawer; no lab fixtures");
}

{
  const src = read("app/lib/visual-system/workoutTimelineViewModel.ts");
  assert.doesNotMatch(src, /modality:\s*"run"/);
  assert.match(src, /workModality \?\? "other"/);
  assert.match(src, /summarizeWorkoutLoad/);
  ok("timeline VM no longer hardcodes run modality");
}

{
  const workout: StructuredWorkout = {
    warmup: [],
    blocks: [
      {
        type: "repeat",
        reps: 2,
        work: { kind: "time", value: 300, unit: "sec" },
        recoveries: [{ durationSeconds: 60, type: "walk" }],
      },
    ],
    cooldown: [],
    guidance: [],
  };
  const tl = buildWorkoutTimelineViewModel(workout, { workModality: "run" });
  const load = summarizeWorkoutLoad(tl);
  assert.ok(load);
  // 2×300s work + 1×60s recovery between reps (Batch 0 expand rule)
  assert.equal(load!.workSec, 600);
  assert.equal(load!.recoverySec, 60);
  assert.equal(load!.totalSec, 660);
  assert.equal(summarizeWorkoutLoad({ ...tl, canProportionByDuration: false }), null);
  ok("Work/Recovery/Total only when durations are complete");
}

// --- Completion contract + Home D refresh ---
{
  const drawer = read("components/athlete-command-centre/SessionDrawer.tsx");
  assert.match(drawer, /handleMarkComplete/);
  assert.match(drawer, /completed:\s*true/);
  assert.match(drawer, /handleSaveLog/);
  assert.match(drawer, /completed:\s*form\.completed/);
  assert.match(
    drawer,
    /Save log stores feedback only|Mark complete \(or tick Mark as completed\)/
  );
  ok("explicit completion contract — Mark complete vs Save log");
}

{
  const server = read("app/lib/hyroxAthleteSessionLogServer.ts");
  assert.match(server, /programmeStatusForCompletion/);
  assert.match(server, /completed === true/);
  assert.match(server, /modifications\?\.trim\(\)/);
  assert.match(server, /existing\.status/);
  ok("status persistence — complete / modified-from-mods / keep scheduled");
}

{
  assert.equal(programmeStatusForCompletion("complete"), "completed");
  assert.equal(programmeStatusForCompletion("partial"), "modified");
  assert.equal(programmeStatusForCompletion("missed"), "missed");
  ok("feedback + status consistency mapping (complete/partial/missed)");
}

{
  const first = buildHyroxAthleteSessionFeedback(null, {
    rpe: "6",
    notes: "ok",
    activityType: "run",
  });
  const second = buildHyroxAthleteSessionFeedback(first, {
    rpe: "6",
    notes: "ok",
    activityType: "run",
  });
  assert.equal((first as { rpe?: string }).rpe, "6");
  assert.equal((second as { rpe?: string }).rpe, "6");
  assert.ok(typeof (second as { loggedAt?: string }).loggedAt === "string");
  ok("no duplicate write — feedback upsert merges into same jsonb object");
}

{
  const dash = read("components/athlete-command-centre/home-d/AthleteHomeDDashboard.tsx");
  assert.match(dash, /handleSessionUpdated/);
  assert.match(dash, /setDrawerSession\(updated\)/);
  assert.match(dash, /reloadLiveProgramme/);
  assert.match(dash, /onSessionUpdated=\{\(updated\)/);
  ok("Home D refresh after status update syncs drawer + reloads programme");
}

{
  const homeD = read("app/lib/hyroxAthleteHomeDViewModel.ts");
  assert.match(homeD, /unresolved/);
  assert.doesNotMatch(homeD, /auto.?miss|forceMiss|status:\s*"missed".*today/i);
  ok("unknown/unresolved not auto-missed in Home D mapping source");
}

{
  const seed = read("scripts/staging/seed-home-d-canary-programme.mjs");
  assert.match(seed, /structuredWorkout/);
  assert.match(seed, /type:\s*"repeat"/);
  assert.match(seed, /reps:\s*6/);
  assert.match(seed, /STAGING SYNTHETIC STRUCTURED WORKOUT/);
  const workout = {
    warmup: ["10 min easy jog"],
    blocks: [
      {
        type: "repeat" as const,
        reps: 6,
        work: { kind: "time" as const, value: 300, unit: "sec" as const },
        recoveries: [{ durationSeconds: 90, type: "jog" as const }],
      },
    ],
    cooldown: ["10 min easy"],
    guidance: ["STAGING SYNTHETIC STRUCTURED WORKOUT"],
  };
  const extracted = extractAthleteStructuredWorkout({
    editConfig: { structuredWorkout: workout },
    sessionFamily: { modality: "run", structuredWorkout: workout },
  });
  assert.ok(extracted);
  const tl = buildWorkoutTimelineViewModel(extracted!, { workModality: "run" });
  assert.ok(tl.segments.length > 0);
  assert.ok(tl.segments.some((s) => s.kind === "work" && s.modality === "run"));
  assert.ok(tl.segments.some((s) => s.kind === "recovery"));
  ok("real supported StructuredWorkout renders timeline (seed shape)");
}

{
  assert.equal(
    extractAthleteStructuredWorkout({
      editConfig: { objective: "no sw" },
    }),
    null
  );
  ok("timeline no-data honesty — missing SW extracts null");
}

console.log(`\nqa-hyrox-home-d-visual: ${passed} passed`);
