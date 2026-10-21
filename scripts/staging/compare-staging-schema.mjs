/**
 * Read-only: compares hybrid365-staging structure with supabase/staging/production-schema-snapshot.json.
 * Expected differences: tables from migrations not yet in production (for example 017 readiness).
 *
 * Run: node scripts/staging/compare-staging-schema.mjs
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { catalogSnapshot, readCatalog } from "./lib/schemaCatalog.mjs";
import { assertStagingTarget, GuardError, loadLocalEnv } from "./lib/stagingGuard.mjs";

const root = process.cwd();

async function main() {
  const { databaseUrl } = assertStagingTarget(loadLocalEnv(root), { needDatabase: true });
  const production = JSON.parse(readFileSync(join(root, "supabase", "staging", "production-schema-snapshot.json"), "utf8"));

  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false }, statement_timeout: 30000 });
  await client.connect();
  let staging;
  try {
    await client.query("begin transaction read only");
    staging = catalogSnapshot(await readCatalog(client));
    await client.query("rollback");
  } finally {
    await client.end();
  }

  const lines = [];
  const names = new Set([...Object.keys(production.tables), ...Object.keys(staging.tables)]);
  for (const name of [...names].sort()) {
    const p = production.tables[name];
    const s = staging.tables[name];
    if (!s) { lines.push(`missing on staging: table ${name}`); continue; }
    if (!p) { lines.push(`staging only:      table ${name}`); continue; }
    if (p.rls !== s.rls) lines.push(`rls differs:       ${name} (production ${p.rls}, staging ${s.rls})`);
    for (const column of Object.keys(p.columns)) {
      if (!s.columns[column]) lines.push(`missing on staging: column ${name}.${column}`);
      else if (s.columns[column].type !== p.columns[column].type) lines.push(`type differs:      ${name}.${column} (${p.columns[column].type} vs ${s.columns[column].type})`);
      else if (s.columns[column].notNull !== p.columns[column].notNull) lines.push(`nullability:       ${name}.${column}`);
    }
    for (const column of Object.keys(s.columns)) if (!p.columns[column]) lines.push(`staging only:      column ${name}.${column}`);
    for (const policy of p.policies) if (!s.policies.includes(policy)) lines.push(`missing on staging: policy ${name}."${policy}"`);
    for (const trigger of p.triggers) if (!s.triggers.includes(trigger)) lines.push(`missing on staging: trigger ${name}.${trigger}`);
  }
  for (const fn of production.functions) if (!staging.functions.includes(fn)) lines.push(`missing on staging: function ${fn}`);
  for (const trigger of production.authUserTriggers) if (!staging.authUserTriggers.includes(trigger)) lines.push(`missing on staging: auth.users trigger ${trigger}`);

  console.log(lines.length ? lines.join("\n") : "No structural drift between staging and the production snapshot.");
}

main().catch((error) => {
  console.error(error instanceof GuardError ? error.message : `Failed: ${error.message}`);
  process.exit(1);
});
