/**
 * QA: canonical athlete shell (desktop left rail + mobile bottom nav).
 * Run: npx tsx scripts/qa-hyrox-athlete-shell.ts
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
  const shell = read("components/athlete-command-centre/AthletePortalShell.tsx");
  assert.match(shell, /data-athlete-shell="v0"/);
  assert.match(shell, /data-athlete-desktop-rail/);
  assert.match(shell, /w-\[220px\]/);
  assert.match(shell, /AthleteDesktopRailNav/);
  assert.match(shell, /AthleteMobileBottomNav/);
  assert.doesNotMatch(shell, /AthleteAppNav variant="desktop"/);
  assert.doesNotMatch(shell, /max-w-7xl flex-wrap.*AthleteAppNav/);
  // When bottom nav is visible, v0 has no mobile top wordmark/sign-out strip.
  assert.match(shell, /v0 has no mobile top wordmark/);
  ok("shell uses 220px left rail + mobile bottom nav (no legacy top tabs)");
}

{
  const nav = read("components/athlete-command-centre/AthleteAppNav.tsx");
  assert.match(nav, /AthleteDesktopRailNav/);
  assert.match(nav, /AthleteMobileBottomNav/);
  assert.match(nav, /layoutId/);
  assert.match(nav, /usePrefersReducedMotion/);
  assert.match(nav, /grid-cols-5/);
  assert.match(nav, /safe-area-inset-bottom/);
  ok("nav implements rail + 5-col mobile shelf with motion + reduced-motion");
}

{
  const ia = read("components/athlete-command-centre/athleteNav.ts");
  assert.match(ia, /HOME_D_NAV_ITEMS/);
  assert.match(ia, /\/athlete\/dashboard/);
  assert.match(ia, /\/athlete\/programme/);
  assert.match(ia, /\/athlete\/progress/);
  assert.match(ia, /\/athlete\/benchmarks/);
  assert.doesNotMatch(ia, /\/admin\//);
  ok("nav IA maps real athlete routes only (no admin)");
}

{
  const concept = read(
    "components/athlete-command-centre/visual/concepts/HomeConceptD.tsx"
  );
  assert.match(concept, /grid-cols-\[220px_/);
  assert.match(concept, /HomeDNav/);
  ok("v0 HomeConceptD remains the shell benchmark (220px + bottom nav)");
}

console.log(`\nqa-hyrox-athlete-shell: ${passed} passed`);
