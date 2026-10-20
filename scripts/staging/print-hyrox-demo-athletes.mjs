/**
 * Prints deterministic staging fixtures. Does not write to Supabase.
 * A future seed must refuse unless HYROX_ENV=staging and the URL is not production.
 *
 * Run: node scripts/staging/print-hyrox-demo-athletes.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtures = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "hyrox-demo-athletes.json"), "utf8")
);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const productionUrl = process.env.HYROX_PRODUCTION_SUPABASE_URL?.trim() ?? "";
const askedToSeed = process.env.HYROX_STAGING_SEED === "1";

if (askedToSeed) {
  const staging = process.env.HYROX_ENV === "staging";
  const pointsAtProduction = Boolean(productionUrl) && url === productionUrl;
  if (!staging || pointsAtProduction || !url) {
    console.error("Refusing to seed. Set HYROX_ENV=staging and a non-production NEXT_PUBLIC_SUPABASE_URL.");
    process.exit(1);
  }
  console.error("Seed writes are not implemented. Apply this only after staging exists and the fixture review is approved.");
  process.exit(1);
}

console.log("HYROX staging fixtures (no database write)");
for (const athlete of fixtures.athletes) {
  const active = athlete.benchmarks.filter((row) => row.active).map((row) => row.type);
  console.log(`- ${athlete.id}: active ${active.join(", ") || "none"}`);
}
console.log("Race rows are history unless active is true.");
console.log(JSON.stringify(fixtures, null, 2));
