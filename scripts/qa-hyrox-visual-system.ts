/**
 * QA: athlete visual system primitives and presentation invariants.
 * Run: npx tsx scripts/qa-hyrox-visual-system.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ATHLETE_STATUS_LABEL,
  ATHLETE_STATUS_WORDS,
  athleteBenchmarkStatus,
  ENV_BADGE_HEIGHT_PX,
  MOTION_MS,
  visualBody,
  visualMeta,
  visualMuted,
  visualTouch,
} from "../components/athlete-command-centre/visual/tokens";
import { SOCIAL_PROTOTYPE_DEMO } from "../components/athlete-command-centre/visual/social/demoProps";

const QA_VIEWPORTS = [375, 390, 430, 768, 1440] as const;

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

function read(rel: string) {
  return readFileSync(join(rel), "utf8");
}

/** WCAG relative luminance for a #rrggbb hex. */
function luminance(hex: string): number {
  const n = hex.replace("#", "");
  const rgb = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const lin = rgb.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrast(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

{
  assert.equal(MOTION_MS.fast, 120);
  assert.equal(MOTION_MS.base, 160);
  assert.equal(MOTION_MS.enter, 180);
  assert.ok(MOTION_MS.enter < 200);
  ok("motion tokens stay under 200ms");
}

{
  assert.deepEqual([...ATHLETE_STATUS_WORDS], [
    "Current",
    "Pending review",
    "Approved",
    "Coach verified",
    "Historical",
  ]);
  assert.equal(ATHLETE_STATUS_LABEL.current, "Current");
  assert.equal(ATHLETE_STATUS_LABEL.pending, "Pending review");
  ok("status pills use product words");
}

{
  assert.equal(athleteBenchmarkStatus({ status: "pending" }), "pending");
  assert.equal(
    athleteBenchmarkStatus({ status: "approved", active_for_programming: true }),
    "current"
  );
  assert.equal(athleteBenchmarkStatus({ status: "historical" }), "historical");
  assert.equal(
    athleteBenchmarkStatus({ status: "approved", source: "coach_entered" }),
    "coach_verified"
  );
  ok("benchmark status mapping does not invent a state");
}

{
  assert.equal(ENV_BADGE_HEIGHT_PX, 24);
  const badge = read("app/components/EnvironmentBadge.tsx");
  assert.match(badge, /hybrid365-env-badge-height/);
  assert.match(badge, /inset-x-0 top-0/);
  assert.doesNotMatch(badge, /left-1\/2/);
  const shell = read("components/athlete-command-centre/AthletePortalShell.tsx");
  assert.match(shell, /hybrid365-env-badge-height/);
  const header = read("components/athlete-command-centre/MobileAnchorBar.tsx");
  assert.match(header, /hybrid365-env-badge-height/);
  ok("staging badge is a reserved top strip, not a centred overlay");
}

{
  assert.match(SOCIAL_PROTOTYPE_DEMO.athleteName, /Prototype/i);
  assert.match(SOCIAL_PROTOTYPE_DEMO.note, /Demo/i);
  const frame = read(
    "components/athlete-command-centre/visual/social/SocialPrototypeFrame.tsx"
  );
  assert.match(frame, /Demo — not a live athlete result/);
  assert.match(frame, /aspect-\[9\/16\]/);
  const proto = read(
    "components/athlete-command-centre/visual/social/PrototypeFrame.tsx"
  );
  assert.match(proto, /not a live athlete result/);
  assert.match(proto, /aspect-\[9\/16\]/);
  ok("social cards are labelled prototypes at 9:16");
}

{
  const chart = read("components/athlete-command-centre/visual/ProgressChartCard.tsx");
  assert.match(chart, /empty/);
  assert.doesNotMatch(chart, /\[0,\s*0,\s*0\]/);
  const metric = read("components/athlete-command-centre/visual/PerformanceMetric.tsx");
  assert.match(metric, /No current value/);
  const summary = read("components/athlete-command-centre/visual/TrainingSummary.tsx");
  assert.match(summary, /!items\.length/);
  const delta = read("components/athlete-command-centre/visual/MetricDelta.tsx");
  assert.match(delta, /if \(!shown\) return null/);
  const target = read("components/athlete-command-centre/visual/SessionTarget.tsx");
  assert.match(target, /if \(!shown && !hint/);
  const progress = read(
    "components/athlete-command-centre/ProgressDashboardSection.tsx"
  );
  assert.doesNotMatch(progress, /MOCK_PROGRESS/);
  ok("progress primitives hide empty values and do not hardcode fake series");
}

{
  const home = read("components/athlete-command-centre/AthleteHomeDashboard.tsx");
  assert.match(home, /Awaiting data/);
  assert.doesNotMatch(
    home,
    /label="Race readiness"\s*\n\s*value=\{\s*`\$\{m\.raceReadiness\.value\}%`/
  );
  const header = read("components/athlete-command-centre/CommandCentreHeader.tsx");
  assert.match(header, /Awaiting data/);
  ok("home does not present 0% as fake readiness when data is missing");
}

{
  const nav = read("components/athlete-command-centre/athleteNav.ts");
  assert.match(nav, /label: "Performance"/);
  assert.match(nav, /label: "Performance Testing"/);
  const meta = read("components/athlete-command-centre/athleteUi.tsx");
  assert.match(meta, /title: "Performance"/);
  assert.match(meta, /title: "Performance testing"/);
  ok("Performance and Performance testing stay distinct names");
}

{
  assert.deepEqual([...QA_VIEWPORTS], [375, 390, 430, 768, 1440]);
  const doc = read("docs/HYBRID365_VISUAL_SYSTEM.md");
  assert.match(doc, /375, 390, and 430, then 768 and 1440/);
  ok("QA viewport set is 375, 390, 430, 768, 1440");
}

{
  const css = read("app/globals.css");
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\[data-h365-motion\]/);
  const motion = read("components/athlete-command-centre/visual/motion.tsx");
  assert.match(motion, /usePrefersReducedMotion/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /data-h365-motion/);
  const drawer = read("components/athlete-command-centre/SessionDrawer.tsx");
  assert.match(drawer, /motion-reduce:animate-none/);
  const homeMotion = read("components/athlete-command-centre/home-v2/motion.tsx");
  assert.match(homeMotion, /Do not count up from zero/);
  assert.doesNotMatch(homeMotion, /requestAnimationFrame/);
  ok("reduced-motion skips enter/confirm; measured numbers do not count up");
}

{
  const surface = "#09090b";
  const pairs: Array<[string, string, string, number]> = [
    ["white on zinc-950", "#ffffff", surface, 4.5],
    ["zinc-200 on zinc-950", "#e4e4e7", surface, 4.5],
    ["zinc-300 on zinc-950", "#d4d4d8", surface, 4.5],
    ["zinc-400 on zinc-950", "#a1a1aa", surface, 4.5],
    ["yellow-400 on zinc-950", "#facc15", surface, 4.5],
    ["amber-200 on zinc-950", "#fde68a", surface, 4.5],
    ["black on amber-400 badge", "#000000", "#fbbf24", 4.5],
    ["white on red-600 badge", "#ffffff", "#dc2626", 4.5],
  ];
  for (const [name, fg, bg, min] of pairs) {
    const ratio = contrast(fg, bg);
    assert.ok(ratio >= min, `${name} contrast ${ratio.toFixed(2)} < ${min}`);
  }
  const zinc500 = contrast("#71717a", surface);
  assert.ok(zinc500 < 4.5, "zinc-500 on zinc-950 stays below AA — do not use for body/meta");
  assert.match(visualMeta, /zinc-400/);
  assert.match(visualMuted, /zinc-400/);
  assert.doesNotMatch(visualMeta, /zinc-500/);
  const pill = read("components/athlete-command-centre/visual/StatusPill.tsx");
  assert.doesNotMatch(pill, /text-zinc-500/);
  assert.match(pill, /ATHLETE_STATUS_LABEL\[status\]/);
  ok("token contrast pairs meet WCAG AA; status keeps the word");
}

{
  assert.match(visualBody, /text-sm/);
  assert.match(visualTouch, /min-h-11/);
  const buttons = read("components/athlete-command-centre/athleteUi.tsx");
  assert.match(buttons, /min-h-\[44px\]/);
  const week = read("components/athlete-command-centre/WeekSessionCard.tsx");
  assert.match(week, /min-h-11/);
  const drawer = read("components/athlete-command-centre/SessionDrawer.tsx");
  assert.match(drawer, /min-h-11/);
  ok("body text is 14px and touch controls are at least 44px");
}

{
  const confirm = read(
    "components/athlete-command-centre/visual/SessionCompleteConfirm.tsx"
  );
  assert.doesNotMatch(confirm, /confetti|streak|on fire/i);
  const lab = read("components/athlete-command-centre/visual/VisualSystemLab.tsx");
  assert.match(lab, /labelled demo props, not live athlete results/);
  assert.match(lab, /No measured series yet/);
  assert.match(lab, /No current value/);
  ok("completion is restrained; lab empty states stay honest");
}

{
  const fixture = read("components/athlete-command-centre/visual/concepts/fixture.ts");
  assert.match(fixture, /Prototype · demo data · not a live athlete result/);
  assert.match(fixture, /prototype-not-a-live-athlete/);
  const lab = read("components/athlete-command-centre/visual/concepts/ConceptsLab.tsx");
  assert.match(lab, /do not replace[\s\S]*live athlete Home/);
  assert.match(lab, /coached-home/);
  assert.match(lab, /Coached Command Centre/);
  const chrome = read("components/athlete-command-centre/visual/concepts/chrome.tsx");
  assert.match(chrome, /CONCEPT_PROTOTYPE_BANNER/);
  const homeD = read("components/athlete-command-centre/visual/concepts/HomeConceptD.tsx");
  assert.match(homeD, /Not live Home/);
  assert.match(lab, /home-d/);
  const coachedBrief = read("docs/visual-qa/concepts/COACHED_COMMAND_CENTRE.md");
  assert.match(coachedBrief, /Do not apply to live athlete screens/);
  ok("direction concepts stay labelled prototypes");
}

console.log(`\n${passed} visual-system checks passed`);
console.log(`Viewports to screenshot: ${QA_VIEWPORTS.join(", ")}`);
