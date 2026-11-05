/**
 * QA: authless Home D visual-review Preview route guards + fixture honesty.
 * Run: npx tsx scripts/qa-hyrox-home-d-visual-review-preview.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isAthleteVisualReviewPreviewAllowed } from "../app/lib/previewAthleteVisualReviewGuard";
import {
  HOME_D_VISUAL_REVIEW_STATES,
  getHomeDVisualReviewFixture,
  parseHomeDVisualReviewState,
} from "../components/athlete-command-centre/visual-system/preview/homeDVisualReviewFixtures";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

// --- Production hard-fail ---
{
  assert.equal(
    isAthleteVisualReviewPreviewAllowed({
      VERCEL_ENV: "production",
      HYROX_ENV: "staging",
      NODE_ENV: "production",
    }),
    false
  );
  assert.equal(
    isAthleteVisualReviewPreviewAllowed({
      VERCEL_ENV: "preview",
      HYROX_ENV: "production",
      NODE_ENV: "production",
    }),
    false
  );
  assert.equal(
    isAthleteVisualReviewPreviewAllowed({
      VERCEL_ENV: "production",
      HYROX_ENV: "production",
      NODE_ENV: "production",
    }),
    false
  );
  ok("visual-review route refused in Production (VERCEL_ENV / HYROX_ENV)");
}

// --- Allowed surfaces ---
{
  assert.equal(
    isAthleteVisualReviewPreviewAllowed({
      VERCEL_ENV: "preview",
      HYROX_ENV: "staging",
      NODE_ENV: "production",
    }),
    true
  );
  assert.equal(
    isAthleteVisualReviewPreviewAllowed({
      HYROX_ENV: "staging",
      NODE_ENV: "production",
    }),
    true
  );
  assert.equal(
    isAthleteVisualReviewPreviewAllowed({
      NODE_ENV: "development",
    }),
    true
  );
  ok("visual-review allowed on Preview / staging / development");
}

// --- Page wires guard + notFound ---
{
  const page = read("app/preview/athlete/home/page.tsx");
  assert.match(page, /isAthleteVisualReviewPreviewAllowed/);
  assert.match(page, /notFound\(/);
  assert.match(page, /HomeDVisualReview/);
  assert.doesNotMatch(page, /SessionDrawer|useAthleteDashboardLive|requireCurrentHyroxAthlete/);
  ok("preview page uses guard + HomeDVisualReview; no live athlete/auth/write path");
}

// --- Fixtures cover requested states + no production athlete ids ---
{
  for (const id of HOME_D_VISUAL_REVIEW_STATES) {
    const fx = getHomeDVisualReviewFixture(id);
    assert.equal(fx.id, id);
    assert.ok(fx.weekDays.length === 7);
    assert.ok(fx.weekDays.some((d) => d.id === fx.selectedId));
    const blob = JSON.stringify(fx);
    assert.doesNotMatch(blob, /f3bb2aa6-d78f-4cf4-a0a4-17f6c21c6601|Ben Kelly|uuqdgbsntdjhojjkjkgd/);
  }
  assert.equal(parseHomeDVisualReviewState("partial"), "partial");
  assert.equal(parseHomeDVisualReviewState("nope"), "upcoming");
  ok("all visual-review fixtures present; no production athlete data");
}

// --- Read-only: review client never mounts SessionDrawer ---
{
  const client = read(
    "components/athlete-command-centre/visual-system/preview/HomeDVisualReview.tsx"
  );
  assert.doesNotMatch(client, /from ["']@\/components\/athlete-command-centre\/SessionDrawer["']/);
  assert.doesNotMatch(client, /useAthleteDashboardLive/);
  assert.doesNotMatch(client, /\bfetch\s*\(/);
  assert.match(client, /Read-only|read-only/);
  assert.match(client, /PrimarySessionCard|SecondarySessionRow|WeekDateNav/);
  ok("review client uses real Home D chrome without drawer/live APIs");
}

console.log(`\nqa-hyrox-home-d-visual-review-preview: ${passed} passed`);
