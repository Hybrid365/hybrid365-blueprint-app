/**
 * QA: SessionDrawer v0 token bridge (presentation only).
 * Run: npx tsx scripts/qa-hyrox-session-drawer-visual.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}
function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

{
  const drawer = read("components/athlete-command-centre/SessionDrawer.tsx");
  assert.match(drawer, /data-session-drawer=["']v0["']/);
  assert.match(drawer, /--h365-background|--h365-border|--h365-accent/);
  assert.match(drawer, /SessionStatusPill/);
  assert.match(drawer, /CompactWorkoutPreview/);
  assert.match(drawer, /AthleteCoachNote/);
  assert.match(drawer, /hyroxSessionToProgrammeCardViewModel/);
  assert.match(drawer, /motion-reduce:animate-none/);
  assert.match(drawer, /safe-area-inset-bottom/);
  // Functional contracts preserved
  assert.match(drawer, /handleMarkComplete/);
  assert.match(drawer, /handleSaveLog/);
  assert.match(drawer, /completed:\s*form\.completed/);
  assert.match(drawer, /completed:\s*true/);
  assert.match(drawer, /Save log stores feedback only/);
  // Legacy chrome reduced
  assert.doesNotMatch(drawer, /bg-yellow-400 py-3/);
  assert.doesNotMatch(drawer, /d\.tags\.map/);
  ok("SessionDrawer uses h365 tokens + Home status/timeline; logging handlers intact");
}

{
  const home = read("components/athlete-command-centre/home-d/AthleteHomeDDashboard.tsx");
  const programme = read("components/athlete-command-centre/ProgrammePageView.tsx");
  assert.match(home, /SessionDrawer/);
  assert.match(programme, /SessionDrawer/);
  ok("Home and Programme still share the same SessionDrawer");
}

console.log(`\nqa-hyrox-session-drawer-visual: ${passed} passed`);
