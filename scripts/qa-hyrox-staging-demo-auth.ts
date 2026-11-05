/**
 * QA: staging Demo Competitive password login gate (no Production leak).
 * Run: npx tsx scripts/qa-hyrox-staging-demo-auth.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  STAGING_DEMO_COMPETITIVE_EMAIL,
  STAGING_SUPABASE_REF,
  isStagingDemoPasswordLoginAllowed,
} from "../app/lib/stagingDemoAthleteAuth";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

{
  assert.equal(STAGING_DEMO_COMPETITIVE_EMAIL, "demo.competitive@hybrid365.test");
  assert.equal(
    isStagingDemoPasswordLoginAllowed({
      NEXT_PUBLIC_SUPABASE_URL: `https://${STAGING_SUPABASE_REF}.supabase.co`,
      NEXT_PUBLIC_VERCEL_ENV: "preview",
      NODE_ENV: "production",
    }),
    true
  );
  assert.equal(
    isStagingDemoPasswordLoginAllowed({
      NEXT_PUBLIC_SUPABASE_URL: "https://uuqdgbsntdjhojjkjkgd.supabase.co",
      NEXT_PUBLIC_VERCEL_ENV: "preview",
      NODE_ENV: "production",
    }),
    false
  );
  assert.equal(
    isStagingDemoPasswordLoginAllowed({
      NEXT_PUBLIC_SUPABASE_URL: `https://${STAGING_SUPABASE_REF}.supabase.co`,
      VERCEL_ENV: "production",
      NODE_ENV: "production",
    }),
    false
  );
  ok("password login allowed only on staging Supabase + non-production runtime");
}

{
  const page = read("app/athlete/login/page.tsx");
  assert.match(page, /StagingDemoPasswordLogin/);
  const form = read("components/auth/StagingDemoPasswordLogin.tsx");
  assert.match(form, /signInWithPassword/);
  assert.match(form, /isStagingDemoPasswordLoginAllowed/);
  assert.doesNotMatch(form, /uuqdgbsntdjhojjkjkgd/);
  ok("athlete login wires staging-only password form");
}

{
  const repair = read("scripts/staging/repair-demo-competitive-auth.mjs");
  assert.match(repair, /assertStagingTarget/);
  assert.match(repair, /bfwboqaovirzjpxpwgty/);
  assert.match(repair, /demo\.competitive@hybrid365\.test/);
  assert.doesNotMatch(repair, /uuqdgbsntdjhojjkjkgd/);
  ok("repair script is staging-guarded");
}

console.log(`\nqa-hyrox-staging-demo-auth: ${passed} passed`);
