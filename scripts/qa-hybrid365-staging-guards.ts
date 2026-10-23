/**
 * Offline checks for staging guards, the migration allowlist, and the environment badge.
 * Run: npx tsx scripts/qa-hybrid365-staging-guards.ts
 */

import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { environmentBadge } from "../app/lib/hybrid365EnvironmentBadge";
import { stagingMigrationPlan, renderBaseline } from "./staging/lib/schemaCatalog.mjs";
import { assertStagingTarget, assertProductionSchemaRead, databaseProjectRef, GuardError } from "./staging/lib/stagingGuard.mjs";

const STAGING = "https://uluapwqohujavhlpucta.supabase.co";
const PRODUCTION = "https://uuqdgbsntdjhojjkjkgd.supabase.co";
const STAGING_POOLER = "postgresql://postgres.uluapwqohujavhlpucta:pw@aws-0-eu-west-2.pooler.supabase.com:5432/postgres";
const PRODUCTION_POOLER = "postgresql://postgres.uuqdgbsntdjhojjkjkgd:pw@aws-0-eu-west-2.pooler.supabase.com:5432/postgres";
const good = { HYROX_ENV: "staging", NEXT_PUBLIC_SUPABASE_URL: STAGING, HYROX_PRODUCTION_SUPABASE_URL: PRODUCTION, HYROX_STAGING_DATABASE_URL: STAGING_POOLER, SUPABASE_SERVICE_ROLE_KEY: "x" };

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}
const refuses = (env: Record<string, string | undefined>, opts = { needDatabase: true }) =>
  assert.throws(() => assertStagingTarget(env, opts), GuardError);

check("accepts proven staging env", () => {
  assert.equal(assertStagingTarget(good, { needDatabase: true, needServiceRole: true }).projectRef, "uluapwqohujavhlpucta");
});
check("refuses when HYROX_ENV is not staging", () => {
  refuses({ ...good, HYROX_ENV: undefined });
  refuses({ ...good, HYROX_ENV: "production" });
  refuses({ ...good, HYROX_ENV: "Staging" });
});
check("refuses production Supabase URL", () => refuses({ ...good, NEXT_PUBLIC_SUPABASE_URL: PRODUCTION }));
check("refuses URL equal to HYROX_PRODUCTION_SUPABASE_URL", () => refuses({ ...good, HYROX_PRODUCTION_SUPABASE_URL: STAGING }));
check("refuses an unknown Supabase project", () => refuses({ ...good, NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co" }));
check("refuses production database URL", () => refuses({ ...good, HYROX_STAGING_DATABASE_URL: PRODUCTION_POOLER }));
check("refuses direct production database host", () =>
  refuses({ ...good, HYROX_STAGING_DATABASE_URL: "postgresql://postgres:pw@db.uuqdgbsntdjhojjkjkgd.supabase.co:5432/postgres" }));
check("refuses unprovable database host", () => refuses({ ...good, HYROX_STAGING_DATABASE_URL: "postgresql://postgres:pw@localhost:5432/postgres" }));
check("refuses missing database URL when needed", () => refuses({ ...good, HYROX_STAGING_DATABASE_URL: undefined }));
check("refuses missing service role when needed", () =>
  assert.throws(() => assertStagingTarget({ ...good, SUPABASE_SERVICE_ROLE_KEY: "" }, { needServiceRole: true }), GuardError));
check("reads project ref from direct and pooler URLs", () => {
  assert.equal(databaseProjectRef("postgresql://postgres:pw@db.uluapwqohujavhlpucta.supabase.co:5432/postgres"), "uluapwqohujavhlpucta");
  assert.equal(databaseProjectRef(STAGING_POOLER), "uluapwqohujavhlpucta");
});
check("production schema read only accepts the production project", () => {
  assert.equal(assertProductionSchemaRead(PRODUCTION_POOLER), PRODUCTION_POOLER);
  assert.throws(() => assertProductionSchemaRead(STAGING_POOLER), GuardError);
  assert.throws(() => assertProductionSchemaRead(""), GuardError);
});

check("migration plan allows 001..021 and refuses 022", () => {
  const dir = mkdtempSync(join(tmpdir(), "h365-mig-"));
  for (const name of ["001_a.sql", "002_b.sql", "002_c.sql", "020_d.sql", "021_hyrox_benchmarks.sql", "022_next.sql", "notes.sql"]) writeFileSync(join(dir, name), "");
  const plan = stagingMigrationPlan(dir);
  assert.deepEqual(plan.allowed, ["001_a.sql", "002_b.sql", "002_c.sql", "020_d.sql", "021_hyrox_benchmarks.sql"]);
  assert.deepEqual(plan.refused.map((r: { name: string }) => r.name).sort(), ["022_next.sql", "notes.sql"]);
});
check("repo migration plan ends at 021", () => {
  const plan = stagingMigrationPlan(join(process.cwd(), "supabase", "migrations"));
  assert.ok(plan.allowed.length >= 20);
  assert.ok(plan.allowed.every((name: string) => Number.parseInt(name, 10) <= 21));
  assert.ok(plan.allowed.includes("021_hyrox_athlete_benchmarks.sql"));
});

check("baseline skips migration-owned tables and keeps base tables", () => {
  const catalog = {
    version: "17",
    extensions: [],
    enums: [],
    sequences: [],
    views: [],
    functions: [],
    tables: [
      { name: "profiles", rls: true, force_rls: false },
      { name: "hyrox_athletes", rls: true, force_rls: false },
    ],
    columns: [
      { table_name: "profiles", name: "id", type: "uuid", not_null: true, default_expr: null, identity: "", generated: "" },
      { table_name: "hyrox_athletes", name: "id", type: "uuid", not_null: true, default_expr: null, identity: "", generated: "" },
    ],
    constraints: [{ table_name: "profiles", name: "profiles_pkey", type: "p", definition: "PRIMARY KEY (id)" }],
    indexes: [],
    policies: [{ table_name: "profiles", name: "own", permissive: "PERMISSIVE", roles: ["authenticated"], cmd: "SELECT", qual: "(auth.uid() = id)", with_check: null }],
    triggers: [],
  };
  const out = renderBaseline(catalog, { tables: new Set(["hyrox_athletes"]), functions: new Set() }, { source: "test" });
  assert.deepEqual(out.baseTables, ["profiles"]);
  assert.match(out.pre, /create table if not exists public\.profiles/);
  assert.doesNotMatch(out.pre, /hyrox_athletes \(/);
  assert.match(out.post, /create policy own on public\.profiles/);
});

check("badge: hidden on Vercel Production", () => {
  assert.equal(environmentBadge({ VERCEL_ENV: "production", HYROX_ENV: "staging", NEXT_PUBLIC_SUPABASE_URL: PRODUCTION }), null);
});
check("badge: STAGING locally on staging", () => {
  assert.equal(environmentBadge({ NODE_ENV: "development", HYROX_ENV: "staging", NEXT_PUBLIC_SUPABASE_URL: STAGING })?.label, "STAGING");
});
check("badge: STAGING on Vercel Preview with staging env", () => {
  assert.equal(environmentBadge({ VERCEL_ENV: "preview", NODE_ENV: "production", HYROX_ENV: "staging", NEXT_PUBLIC_SUPABASE_URL: STAGING })?.label, "STAGING");
});
check("badge: PRODUCTION DATA when preview or local reads production", () => {
  assert.equal(environmentBadge({ VERCEL_ENV: "preview", NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: PRODUCTION })?.tone, "danger");
  assert.equal(environmentBadge({ NODE_ENV: "development", NEXT_PUBLIC_SUPABASE_URL: PRODUCTION })?.label, "PRODUCTION DATA");
});

console.log(`\n${passed} staging guard checks passed`);
