/**
 * Applies the staging schema to hybrid365-staging ONLY:
 *   supabase/staging/baseline-pre.sql -> supabase/migrations 001..021 -> supabase/staging/baseline-post.sql
 *   -> supabase/staging/api-role-grants.sql
 * Migrations numbered above 021 (for example 022) are refused.
 *
 * Dry run (default): node scripts/staging/apply-staging-schema.mjs
 * Apply:             node scripts/staging/apply-staging-schema.mjs --apply
 *
 * Needs `.env.local` with HYROX_ENV=staging, the staging NEXT_PUBLIC_SUPABASE_URL and HYROX_STAGING_DATABASE_URL.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { stagingMigrationPlan } from "./lib/schemaCatalog.mjs";
import { assertStagingTarget, GuardError, loadLocalEnv, redactDatabaseUrl } from "./lib/stagingGuard.mjs";

const root = process.cwd();
const apply = process.argv.includes("--apply");

function buildPlan() {
  const { allowed, refused } = stagingMigrationPlan(join(root, "supabase", "migrations"));
  const steps = [
    { name: "baseline-pre.sql", path: join(root, "supabase", "staging", "baseline-pre.sql") },
    ...allowed.map((name) => ({ name, path: join(root, "supabase", "migrations", name) })),
    { name: "baseline-post.sql", path: join(root, "supabase", "staging", "baseline-post.sql") },
    { name: "api-role-grants.sql", path: join(root, "supabase", "staging", "api-role-grants.sql") },
  ];
  for (const step of steps) {
    if (!existsSync(step.path)) throw new GuardError(`Missing ${step.name}. Generate the baseline first (scripts/staging/dump-production-schema.mjs).`);
    step.sql = readFileSync(step.path, "utf8");
    step.sha256 = createHash("sha256").update(step.sql).digest("hex");
  }
  return { steps, refused };
}

async function main() {
  const env = loadLocalEnv(root);
  const { databaseUrl } = assertStagingTarget(env, { needDatabase: true });
  const { steps, refused } = buildPlan();

  console.log(`Target: hybrid365-staging (${redactDatabaseUrl(databaseUrl)})`);
  for (const file of refused) console.log(`  refused  ${file.name} (${file.reason})`);

  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false }, statement_timeout: 120000 });
  await client.connect();
  try {
    if (apply) {
      await client.query(`
        create schema if not exists hybrid365_staging;
        create table if not exists hybrid365_staging.applied_files (
          name text primary key,
          sha256 text not null,
          applied_at timestamptz not null default now()
        );`);
    }
    const [{ exists }] = (await client.query("select to_regclass('hybrid365_staging.applied_files') is not null as exists")).rows;
    const applied = new Map(
      exists ? (await client.query("select name, sha256 from hybrid365_staging.applied_files")).rows.map((r) => [r.name, r.sha256]) : []
    );

    for (const step of steps) {
      const previous = applied.get(step.name);
      if (previous && previous !== step.sha256) {
        throw new GuardError(`${step.name} changed since it was applied to staging. Reset staging or add a new migration; refusing to re-run.`);
      }
      if (previous) {
        console.log(`  applied  ${step.name}`);
        continue;
      }
      if (!apply) {
        console.log(`  pending  ${step.name}`);
        continue;
      }
      await client.query("begin");
      try {
        await client.query(step.sql);
        await client.query("insert into hybrid365_staging.applied_files (name, sha256) values ($1, $2)", [step.name, step.sha256]);
        await client.query("commit");
        console.log(`  applied  ${step.name} (now)`);
      } catch (error) {
        await client.query("rollback");
        throw new Error(`${step.name} failed and was rolled back: ${error.message}`);
      }
    }
    if (apply) await client.query("notify pgrst, 'reload schema'");
  } finally {
    await client.end();
  }
  console.log(apply ? "Staging schema is up to date." : "Dry run only. Re-run with --apply to write to staging.");
}

main().catch((error) => {
  console.error(error instanceof GuardError ? error.message : `Failed: ${error.message}`);
  process.exit(1);
});
