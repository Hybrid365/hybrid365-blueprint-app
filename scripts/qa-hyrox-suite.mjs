/**
 * Runs existing HYROX QA scripts in groups. Does not add new assertions.
 *
 * npm run qa:hyrox-all
 * npm run qa:hyrox-core | programme | athlete | auth | data
 * npm run qa:hybrid365-staging
 */

import { spawnSync } from "node:child_process";

const groups = {
  core: [
    "scripts/qa-hyrox-middleware-admin-timeout.ts",
    "scripts/qa-hyrox-admin-athlete-preview.ts",
  ],
  programme: [
    "scripts/qa-hyrox-programme-blocks.ts",
    "scripts/qa-hyrox-copy-programme-week.ts",
    "scripts/qa-hyrox-auto-carry-week.ts",
  ],
  athlete: ["scripts/qa-hyrox-home-v2.ts", "scripts/qa-hyrox-performance-hub.ts"],
  auth: [
    "scripts/qa-hyrox-middleware-admin-timeout.ts",
    "scripts/qa-hyrox-admin-athlete-preview.ts",
  ],
  data: [
    "scripts/qa-hyrox-today-readiness.ts",
    "scripts/qa-hyrox-performance-hub.ts",
    "scripts/qa-hyrox-benchmarks.ts",
    "scripts/qa-hyrox-race-intelligence.ts",
  ],
  staging: ["scripts/qa-hybrid365-staging-guards.ts"],
};

const requested = process.argv[2] ?? "all";
const order = ["core", "programme", "athlete", "auth", "data", "staging"];

function scriptsFor(name) {
  if (name === "all") {
    const seen = new Set();
    const list = [];
    for (const group of order) {
      for (const script of groups[group]) {
        if (!seen.has(script)) {
          seen.add(script);
          list.push(script);
        }
      }
    }
    return list;
  }
  if (!groups[name]) {
    console.error(`Unknown group "${name}". Use ${order.join(", ")} or all.`);
    process.exit(2);
  }
  return groups[name];
}

const scripts = scriptsFor(requested);
let failed = 0;

console.log(`\nqa:hyrox-${requested}`);
for (const script of scripts) {
  const result = spawnSync("npx", ["--yes", "tsx", script], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status === 0) {
    console.log(`PASS ${script}`);
  } else {
    failed += 1;
    console.log(`FAIL ${script}`);
  }
}

console.log(`\n${scripts.length - failed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
