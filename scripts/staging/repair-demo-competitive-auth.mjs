/**
 * Staging-only: repair Demo Competitive Auth identity for Preview review.
 *
 * - Moves email from invalid @staging.hybrid365.local → @hybrid365.test
 * - Sets a known password for email+password login (no inbox required)
 * - Keeps hyrox_athletes.user_id link intact
 *
 * Refuses unless HYROX_ENV=staging and URL is hybrid365-staging.
 *
 *   node scripts/staging/repair-demo-competitive-auth.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv, assertStagingTarget, proveStagingServiceRole, GuardError } from "./lib/stagingGuard.mjs";

const COMPETITIVE_ID = "03d58628-a379-4bd6-8278-9ea074d14439";
const NEW_EMAIL = "demo.competitive@hybrid365.test";
/** Deliberate staging demo password for manual Preview review. */
const DEMO_PASSWORD = "Hybrid365-Staging-Demo!";

/** Migrate remaining demos off invalid .local addresses (email only). */
const OTHER_EMAIL_MIGRATIONS = [
  {
    oldEmail: "demo-developing@staging.hybrid365.local",
    newEmail: "demo.developing@hybrid365.test",
  },
  {
    oldEmail: "demo-high-performance@staging.hybrid365.local",
    newEmail: "demo.high-performance@hybrid365.test",
  },
  {
    oldEmail: "demo-coach@staging.hybrid365.local",
    newEmail: "demo.coach@hybrid365.test",
  },
];

async function migrateAuthEmail(admin, oldEmail, newEmail, opts = {}) {
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listError) throw new Error(listError.message);
  const user = listed.users.find((u) => u.email === oldEmail || u.email === newEmail);
  if (!user) {
    console.log(`  skip auth migrate (no user): ${oldEmail}`);
    return null;
  }
  const payload = {
    email: newEmail,
    email_confirm: true,
    user_metadata: {
      ...(user.user_metadata ?? {}),
      staging_demo_email_migrated_from: oldEmail,
    },
  };
  if (opts.password) payload.password = opts.password;
  if (opts.fullName) payload.user_metadata.full_name = opts.fullName;
  if (opts.stagingDemoId) payload.user_metadata.staging_demo = opts.stagingDemoId;
  const { data, error } = await admin.auth.admin.updateUserById(user.id, payload);
  if (error) throw new Error(`updateUser ${oldEmail}: ${error.message}`);
  return data.user;
}

async function main() {
  const env = loadLocalEnv();
  assertStagingTarget(env, { needServiceRole: true });
  await proveStagingServiceRole(env);

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url.includes("bfwboqaovirzjpxpwgty")) {
    throw new GuardError("Refusing: expected staging project ref bfwboqaovirzjpxpwgty");
  }

  const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: athlete, error: athleteError } = await admin
    .from("hyrox_athletes")
    .select("id, name, email, user_id, status")
    .eq("id", COMPETITIVE_ID)
    .maybeSingle();
  if (athleteError) throw new Error(athleteError.message);
  if (!athlete) throw new GuardError(`Missing Demo Competitive athlete ${COMPETITIVE_ID}`);
  if (!athlete.user_id) throw new GuardError("Athlete has no user_id — seed auth first");

  const { data: userData, error: getUserError } = await admin.auth.admin.getUserById(athlete.user_id);
  if (getUserError) throw new Error(`getUserById: ${getUserError.message}`);
  const user = userData.user;
  if (!user) throw new GuardError("Auth user missing for athlete.user_id");

  console.log("before", {
    athleteEmail: athlete.email,
    authEmail: user.email,
    userId: user.id,
    confirmed: Boolean(user.email_confirmed_at),
  });

  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    email: NEW_EMAIL,
    email_confirm: true,
    password: DEMO_PASSWORD,
    user_metadata: {
      ...(user.user_metadata ?? {}),
      full_name: "Demo Competitive",
      staging_demo: "demo-competitive",
      staging_demo_email_migrated_from: "demo-competitive@staging.hybrid365.local",
    },
  });
  if (updateError) throw new Error(`updateUserById: ${updateError.message}`);

  const { error: rowError } = await admin
    .from("hyrox_athletes")
    .update({ email: NEW_EMAIL, name: "Demo Competitive" })
    .eq("id", COMPETITIVE_ID);
  if (rowError) throw new Error(`hyrox_athletes email update: ${rowError.message}`);

  for (const m of OTHER_EMAIL_MIGRATIONS) {
    await migrateAuthEmail(admin, m.oldEmail, m.newEmail);
    const { error } = await admin
      .from("hyrox_athletes")
      .update({ email: m.newEmail })
      .eq("email", m.oldEmail);
    if (error) console.log(`  athlete row migrate note (${m.oldEmail}): ${error.message}`);
    else console.log(`  migrated ${m.oldEmail} → ${m.newEmail}`);
  }

  // Prove password login with anon client (no cookies persisted here).
  const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: signed, error: signError } = await anon.auth.signInWithPassword({
    email: NEW_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (signError) throw new Error(`signInWithPassword proof failed: ${signError.message}`);
  if (!signed.session?.access_token) throw new Error("signInWithPassword returned no session");
  await anon.auth.signOut();

  console.log("after", {
    athleteId: COMPETITIVE_ID,
    email: NEW_EMAIL,
    authEmail: updated.user?.email,
    passwordLogin: "ok",
  });
  console.log("Demo Competitive staging login ready.");
  console.log(`  email:    ${NEW_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
}

main().catch((error) => {
  console.error(error instanceof GuardError ? error.message : `Failed: ${error.message}`);
  process.exit(1);
});
