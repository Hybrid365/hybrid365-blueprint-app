/**
 * AthletePortalGate unlock rules — Progress/Performance must not hard-block linked athletes.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const gate = readFileSync("components/athlete-command-centre/AthletePortalGate.tsx", "utf8");
assert.match(gate, /allowLinkedProgrammeAccess && hasLinkedAthlete/);
assert.match(gate, /allowLinkedProgrammeAccess pages/);

const progress = readFileSync("app/athlete/progress/ProgressPageClient.tsx", "utf8");
const performance = readFileSync("app/athlete/benchmarks/BenchmarksPageClient.tsx", "utf8");
assert.match(progress, /allowLinkedProgrammeAccess/);
assert.match(performance, /allowLinkedProgrammeAccess/);

console.log("qa-hyrox-portal-gate: ok");
