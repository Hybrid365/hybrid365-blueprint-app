/**
 * Reads production STRUCTURE (pg_catalog only, no rows) inside a READ ONLY transaction and writes
 * the staging baseline files. Never writes to production.
 *
 * The production URL comes only from the untracked file `.env.production-schema-read`:
 *   HYROX_PRODUCTION_SCHEMA_READ_URL=postgresql://postgres.<prod-ref>:<password>@<pooler-host>:5432/postgres
 * Delete that file after the read.
 *
 * Run: node scripts/staging/dump-production-schema.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { catalogSnapshot, migrationOwnedObjects, readCatalog, renderBaseline } from "./lib/schemaCatalog.mjs";
import { assertProductionSchemaRead, GuardError, parseEnvFile, redactDatabaseUrl } from "./lib/stagingGuard.mjs";

const root = process.cwd();
const outDir = join(root, "supabase", "staging");
const migrationsDir = join(root, "supabase", "migrations");

async function main() {
  const { HYROX_PRODUCTION_SCHEMA_READ_URL: url } = parseEnvFile(join(root, ".env.production-schema-read"));
  assertProductionSchemaRead(url);
  console.log(`Reading production structure (read-only) from ${redactDatabaseUrl(url)}`);

  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, statement_timeout: 30000 });
  await client.connect();
  let catalog;
  try {
    await client.query("set session characteristics as transaction read only");
    await client.query("begin transaction isolation level repeatable read read only");
    const [{ transaction_read_only: readOnly }] = (await client.query("show transaction_read_only")).rows;
    if (readOnly !== "on") throw new GuardError("Transaction is not read-only; aborting before any catalog read.");
    catalog = await readCatalog(client);
    await client.query("rollback");
  } finally {
    await client.end();
  }

  const owned = migrationOwnedObjects(migrationsDir);
  const baseline = renderBaseline(catalog, owned, { source: "production pg_catalog" });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "baseline-pre.sql"), baseline.pre);
  writeFileSync(join(outDir, "baseline-post.sql"), baseline.post);
  writeFileSync(join(outDir, "production-schema-snapshot.json"), `${JSON.stringify(catalogSnapshot(catalog), null, 2)}\n`);

  console.log(`Base tables not created by migrations (${baseline.baseTables.length}): ${baseline.baseTables.join(", ")}`);
  console.log(`Base functions (${baseline.baseFunctions.length}): ${baseline.baseFunctions.join(", ") || "none"}`);
  console.log("Wrote supabase/staging/baseline-pre.sql, baseline-post.sql, production-schema-snapshot.json");
  console.log("Delete .env.production-schema-read now.");
}

main().catch((error) => {
  console.error(error instanceof GuardError ? error.message : `Failed: ${error.message}`);
  process.exit(1);
});
