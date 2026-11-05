/**
 * QA: v0 visual-system Batch 0 — tokens, safe APIs, timeline adapters, fixture isolation.
 * Run: npx tsx scripts/qa-hyrox-visual-system-v0.ts
 */

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  buildWorkoutTimelineViewModel,
} from "../app/lib/visual-system/workoutTimelineViewModel";
import type { StructuredWorkout } from "../app/lib/hyroxSessionFamilyTypes";
import {
  SESSION_STATUS_LABELS,
  type SessionStatusKey,
} from "../components/athlete-command-centre/visual-system/tokens";
import { VS_DURATION, VS_EASE } from "../components/athlete-command-centre/visual-system/motion";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

function walkTsFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkTsFiles(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

// --- Tokens in globals ---
{
  const css = read("app/globals.css");
  for (const v of [
    "--h365-background",
    "--h365-surface",
    "--h365-surface-raised",
    "--h365-border",
    "--h365-hairline",
    "--h365-text",
    "--h365-text-muted",
    "--h365-accent",
    "--h365-recovery",
    "--h365-danger",
  ]) {
    assert.match(css, new RegExp(v.replace(/-/g, "\\-")));
  }
  assert.match(css, /--font-display/);
  assert.match(css, /@utility label-caps/);
  assert.match(css, /@utility num/);
  ok("visual-system CSS tokens + typography utilities present");
}

{
  const layout = read("app/layout.tsx");
  assert.match(layout, /Barlow_Condensed/);
  assert.match(layout, /--font-barlow/);
  assert.match(layout, /Geist/);
  ok("Barlow Condensed via next/font; Geist retained");
}

{
  assert.deepEqual(VS_EASE, [0.2, 0, 0, 1]);
  assert.equal(VS_DURATION.fast, 0.15);
  assert.equal(VS_DURATION.normal, 0.18);
  assert.equal(VS_DURATION.medium, 0.2);
  assert.equal(VS_DURATION.reveal, 0.32);
  const motionSrc = read(
    "components/athlete-command-centre/visual-system/motion.ts"
  );
  assert.match(motionSrc, /prefers-reduced-motion/);
  assert.match(motionSrc, /usePrefersReducedMotion/);
  ok("motion contract + reduced-motion hook");
}

{
  const keys = Object.keys(SESSION_STATUS_LABELS) as SessionStatusKey[];
  assert.deepEqual(keys.sort(), [
    "completed",
    "missed",
    "partial",
    "unresolved",
    "upcoming",
  ]);
  assert.equal(SESSION_STATUS_LABELS.upcoming, "Upcoming");
  assert.equal(SESSION_STATUS_LABELS.unresolved, "Not logged");
  ok("SessionStatusPill states match Home D athlete statuses");
}

{
  const coach = read(
    "components/athlete-command-centre/visual-system/primitives/CoachNote.tsx"
  );
  assert.match(coach, /AthleteCoachNote/);
  assert.match(coach, /note: string/);
  assert.doesNotMatch(coach, /internalCoachNotes|coach_note\s*\?\?|fallback/);
  assert.match(coach, /never internal/i);
  ok("AthleteCoachNote accepts athlete-facing text only");
}

// --- Repeat → timeline ---
{
  const workout: StructuredWorkout = {
    warmup: ["easy"],
    blocks: [
      {
        type: "repeat",
        reps: 3,
        work: { kind: "time", value: 300, unit: "sec" },
        recoveries: [{ durationSeconds: 90, type: "jog" }],
      },
    ],
    cooldown: [],
    guidance: [],
  };
  const vm = buildWorkoutTimelineViewModel(workout, {
    workTarget: { pace: "3:55 /km" },
  });
  assert.equal(vm.support, "supported");
  assert.equal(vm.segments.length, 5); // W R W R W
  assert.equal(vm.canProportionByDuration, true);
  assert.equal(vm.totalDurationSec, 300 * 3 + 90 * 2);
  const work = vm.segments.filter((s) => s.kind === "work");
  assert.equal(work.length, 3);
  assert.equal(work[0].targetPace, "3:55 /km");
  assert.equal(work[0].durationSec, 300);
  assert.equal(work[0].startOffsetSec, 0);
  assert.equal(vm.segments[1].kind, "recovery");
  assert.equal(vm.segments[1].durationSec, 90);
  ok("repeat → WorkoutTimelineViewModel");
}

// --- Continuous → timeline ---
{
  const workout: StructuredWorkout = {
    warmup: [],
    blocks: [{ type: "continuous", work: { kind: "time", value: 2400, unit: "sec" } }],
    cooldown: [],
    guidance: [],
  };
  const vm = buildWorkoutTimelineViewModel(workout);
  assert.equal(vm.support, "supported");
  assert.equal(vm.segments.length, 1);
  assert.equal(vm.segments[0].durationSec, 2400);
  assert.equal(vm.segments[0].targetPace, null);
  ok("continuous → WorkoutTimelineViewModel");
}

// --- Missing data stays missing ---
{
  const workout: StructuredWorkout = {
    warmup: [],
    blocks: [
      {
        type: "repeat",
        reps: 2,
        work: { kind: "distance", value: 1000, unit: "m" },
        recoveries: [{ durationSeconds: 60, type: "walk" }],
      },
    ],
    cooldown: [],
    guidance: [],
  };
  const vm = buildWorkoutTimelineViewModel(workout);
  assert.equal(vm.canProportionByDuration, false);
  assert.equal(vm.totalDurationSec, null);
  for (const w of vm.segments.filter((s) => s.kind === "work")) {
    assert.equal(w.durationSec, null);
    assert.equal(w.targetPace, null);
    assert.equal(w.distanceLabel, "1000 m");
  }
  ok("missing duration/pace stays null — no invention");
}

// --- Unsupported does not fabricate ---
{
  const station: StructuredWorkout = {
    warmup: [],
    blocks: [
      {
        type: "station_round",
        rounds: 4,
        station: { name: "Sled" },
        run: { kind: "distance", value: 1000, unit: "m" },
      },
    ],
    cooldown: [],
    guidance: [],
  };
  const vm = buildWorkoutTimelineViewModel(station);
  assert.equal(vm.support, "unsupported");
  assert.equal(vm.segments.length, 0);
  assert.ok(vm.unsupportedReasons.some((r) => /station_round/.test(r)));
  ok("unsupported station_round does not fabricate segments");
}

{
  const mixed: StructuredWorkout = {
    warmup: [],
    blocks: [
      {
        type: "repeat",
        reps: 2,
        work: { kind: "time", value: 120, unit: "sec" },
        recoveries: [{ durationSeconds: 30, type: "walk" }],
      },
      { type: "strength", exercises: [{ name: "Squat" }] },
    ],
    cooldown: [],
    guidance: [],
  };
  const vm = buildWorkoutTimelineViewModel(mixed);
  assert.equal(vm.support, "partial");
  assert.ok(vm.segments.length > 0);
  assert.ok(vm.unsupportedReasons.some((r) => /strength/.test(r)));
  ok("mixed supported+unsupported → partial, no silent flatten of strength");
}

// --- Fixture isolation ---
{
  const prodRoots = [
    "app/lib",
    "app/athlete",
    "components/athlete-command-centre",
  ];
  const banned = /visual-system\/lab\/labFixtures|from ['"].*lab\/labFixtures/;
  const allow = [
    "components/athlete-command-centre/visual-system/lab/",
    "scripts/qa-hyrox-visual-system-v0.ts",
  ];
  const offenders: string[] = [];
  for (const root of prodRoots) {
    for (const file of walkTsFiles(root)) {
      if (allow.some((a) => file.includes(a))) continue;
      // skip the lab package itself
      if (file.includes("/visual-system/lab/")) continue;
      const src = readFileSync(file, "utf8");
      if (banned.test(src)) offenders.push(file);
    }
  }
  assert.deepEqual(offenders, []);
  ok("no production module imports labFixtures");
}

{
  const idx = read("components/athlete-command-centre/visual-system/index.ts");
  assert.doesNotMatch(idx, /labFixtures|V0VisualSystemLab/);
  ok("index does not re-export lab fixtures");
}

{
  const pkg = read("package.json");
  assert.match(pkg, /"motion"/);
  assert.doesNotMatch(pkg, /"@base-ui\/react"/);
  assert.doesNotMatch(pkg, /"class-variance-authority"/);
  assert.doesNotMatch(pkg, /"tw-animate-css"/);
  ok("dependency discipline — motion only, no v0-only UI kits");
}

{
  const tl = read(
    "components/athlete-command-centre/visual-system/workout/WorkoutTimeline.tsx"
  );
  assert.match(tl, /ArrowRight|ArrowLeft/);
  assert.match(tl, /aria-label/);
  assert.match(tl, /tabIndex/);
  assert.match(tl, /usePrefersReducedMotion|prefers-reduced-motion|reduced/);
  ok("timeline keyboard selection + reduced-motion awareness");
}

{
  const lab = read(
    "components/athlete-command-centre/visual/VisualSystemLab.tsx"
  );
  assert.match(lab, /V0VisualSystemLab/);
  const badge = read(
    "components/athlete-command-centre/visual-system/lab/LabFixtureBadge.tsx"
  );
  assert.match(badge, /LAB \/ FIXTURE/);
  ok("visual lab hosts V0 section with LAB / FIXTURE labelling");
}

console.log(`\nqa-hyrox-visual-system-v0: ${passed} passed`);
