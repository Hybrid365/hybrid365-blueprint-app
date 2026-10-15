/**
 * QA: HYROX admin middleware timeout helpers.
 * Run: npm run qa:hyrox-middleware-admin-timeout
 */

import { hasValidSupabaseSessionCookies } from "../app/lib/supabase/apiRoute";
import {
  MIDDLEWARE_AUTH_CALL_TIMEOUT_MS,
  isHyroxAdminProtectedPath,
  withAuthCallTimeout,
} from "../app/lib/supabase/hyroxMiddlewareAuth";
import { resolveHyroxCoachAccess } from "../app/lib/hyroxAccess";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

async function main() {
  assert(isHyroxAdminProtectedPath("/admin/hyrox-athletes"), "athletes admin");
  assert(isHyroxAdminProtectedPath("/admin/one-to-one-applications"), "applications admin");
  assert(!isHyroxAdminProtectedPath("/admin/no-access"), "no-access is public after auth");
  assert(!isHyroxAdminProtectedPath("/athlete/dashboard"), "athlete not admin");
  ok("Admin protected-path helper");

  assert(MIDDLEWARE_AUTH_CALL_TIMEOUT_MS < 10_000, "timeout stays under Vercel middleware limit");
  assert(MIDDLEWARE_AUTH_CALL_TIMEOUT_MS >= 1000, "timeout is long enough for a healthy Auth call");
  ok("Middleware auth timeout budget");

  const resolved = await withAuthCallTimeout(Promise.resolve("ok"), 200, "resolve");
  assert(resolved.ok && resolved.value === "ok", "resolves before timeout");
  const hung = await withAuthCallTimeout(new Promise<string>(() => {}), 40, "hang");
  assert(!hung.ok && hung.timedOut, "hang returns timedOut");
  ok("withAuthCallTimeout resolve vs hang");

  const prevInternal = process.env.INTERNAL_ADMIN_EMAILS;
  const prevCoach = process.env.HYROX_COACH_EMAILS;
  process.env.INTERNAL_ADMIN_EMAILS = "coach@example.com";
  process.env.HYROX_COACH_EMAILS = "";
  assert(resolveHyroxCoachAccess(null, "coach@example.com") === true, "email allowlist without profile");
  assert(resolveHyroxCoachAccess(null, "other@example.com") === false, "unknown email needs profile");
  if (prevInternal === undefined) delete process.env.INTERNAL_ADMIN_EMAILS;
  else process.env.INTERNAL_ADMIN_EMAILS = prevInternal;
  if (prevCoach === undefined) delete process.env.HYROX_COACH_EMAILS;
  else process.env.HYROX_COACH_EMAILS = prevCoach;
  ok("Admin email allowlist can skip athlete lookups");

  assert(
    !hasValidSupabaseSessionCookies([
      { name: "sb-access-token", value: "fake" },
      { name: "sb-refresh-token", value: "x" },
    ]),
    "junk cookies are not a refreshable session"
  );
  assert(
    hasValidSupabaseSessionCookies([
      {
        name: "sb-xxxx-auth-token",
        value: `base64-${"A".repeat(80)}`,
      },
    ]),
    "encoded session chunk is treated as refreshable"
  );
  ok("Valid session cookie probe");

  console.log(`\n${passed} middleware admin timeout checks passed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
