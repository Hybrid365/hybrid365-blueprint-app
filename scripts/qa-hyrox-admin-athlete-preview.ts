/**
 * QA: HYROX Team admin athlete preview helpers (read-only, not impersonation).
 * Run: npm run qa:hyrox-admin-athlete-preview
 */

import {
  createHyroxAdminAthletePreviewToken,
  verifyHyroxAdminAthletePreviewToken,
  getAdminAthletePreviewMutationBlock,
  HYROX_ADMIN_ATHLETE_PREVIEW_PURPOSE,
} from "../app/lib/hyroxAdminAthletePreview";
import {
  athleteHrefToPreviewSection,
  previewPathForAthlete,
  HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE,
} from "../app/lib/hyroxAdminAthletePreviewPaths";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

{
  const token = createHyroxAdminAthletePreviewToken({
    coachUserId: "11111111-1111-1111-1111-111111111111",
    athleteId: "22222222-2222-2222-2222-222222222222",
  });
  const verified = verifyHyroxAdminAthletePreviewToken(token);
  assert(verified.ok, "token verifies");
  if (verified.ok) {
    assert(verified.payload.mode === "admin-athlete-preview", "mode");
    assert(verified.payload.purpose === HYROX_ADMIN_ATHLETE_PREVIEW_PURPOSE, "purpose");
    assert(verified.payload.athleteId === "22222222-2222-2222-2222-222222222222", "athlete");
    assert(verified.payload.coachUserId === "11111111-1111-1111-1111-111111111111", "coach");
  }
  ok("Signed preview token create/verify");
}

{
  const bad = verifyHyroxAdminAthletePreviewToken("not.a.token");
  assert(!bad.ok, "rejects malformed");
  const tampered = createHyroxAdminAthletePreviewToken({
    coachUserId: "11111111-1111-1111-1111-111111111111",
    athleteId: "22222222-2222-2222-2222-222222222222",
  });
  const parts = tampered.split(".");
  const broken = `${parts[0]}.aaaa`;
  assert(!verifyHyroxAdminAthletePreviewToken(broken).ok, "rejects bad signature");
  ok("Rejects malformed / bad-signature tokens");
}

{
  const token = createHyroxAdminAthletePreviewToken({
    coachUserId: "11111111-1111-1111-1111-111111111111",
    athleteId: "22222222-2222-2222-2222-222222222222",
  });
  const req = new Request("https://example.com/api/hyrox/athlete/session-log", {
    headers: { cookie: `${HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE}=${encodeURIComponent(token)}` },
  });
  const block = getAdminAthletePreviewMutationBlock(req);
  assert(block.blocked, "preview cookie blocks mutations");
  const clean = getAdminAthletePreviewMutationBlock(
    new Request("https://example.com/api/hyrox/athlete/session-log")
  );
  assert(!clean.blocked, "no cookie allows");
  ok("Mutation block helper respects preview cookie");
}

{
  assert(athleteHrefToPreviewSection("/athlete/dashboard") === "", "home");
  assert(athleteHrefToPreviewSection("/athlete/programme") === "programme", "programme");
  assert(athleteHrefToPreviewSection("/athlete/check-in") === "check-in", "check-in");
  assert(
    previewPathForAthlete("abc", "progress") === "/admin/hyrox-athletes/abc/preview/progress",
    "path"
  );
  ok("Preview path mapping");
}

console.log(`\n${passed} checks passed.`);
