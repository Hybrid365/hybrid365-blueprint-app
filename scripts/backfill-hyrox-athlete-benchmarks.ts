/**
 * Dry-run backfill plan for hyrox_athlete_benchmarks.
 *
 * Does not write unless HYROX_BENCHMARK_BACKFILL_APPROVED=1 is set explicitly.
 * Do not set that against production until the migration and these rules are approved.
 *
 * Proposed active defaults, only when that type has no active row yet:
 * - latest submitted onboarding or performance-test 5K → active run_5k
 * - latest 2K ski performance test → active ski_2k
 * - onboarding 1K ski is history only (ski_1k), never treated as 2K
 * - latest 2K row → active row_2k
 * - FTP is not inferred from other tests
 * - HYROX race rows are history only and are not activated
 * - threshold and HYROX run pace are activated only when an explicit value already exists
 *
 * Run: npx tsx scripts/backfill-hyrox-athlete-benchmarks.ts
 */

const approved = process.env.HYROX_BENCHMARK_BACKFILL_APPROVED === "1";

console.log("HYROX benchmark backfill");
console.log("Mode:", approved ? "WRITE (explicitly approved)" : "DRY RUN");
console.log("This script does not apply migration 021.");
console.log("No production write was performed.");

if (!approved) {
  console.log("Set HYROX_BENCHMARK_BACKFILL_APPROVED=1 only after reviewing the rules above.");
  process.exit(0);
}

console.error("Write mode is intentionally not implemented until production approval.");
process.exit(1);
