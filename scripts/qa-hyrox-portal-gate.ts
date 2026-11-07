/**
 * AthletePortalGate unlock rules — Progress/Performance must not hard-block linked athletes.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const gate = readFileSync("components/athlete-command-centre/AthletePortalGate.tsx", "utf8");
assert.match(gate, /allowLinkedProgrammeAccess && hasLinkedAthlete/);

const active = readFileSync("components/athlete-command-centre/ActiveAthletePage.tsx", "utf8");
assert.match(active, /gate\?: GateMode/);
assert.match(active, /resolvedGate === "none"/);

const progress = readFileSync("app/athlete/progress/ProgressPageClient.tsx", "utf8");
const performance = readFileSync("app/athlete/benchmarks/BenchmarksPageClient.tsx", "utf8");
assert.match(progress, /gate="none"/);
assert.match(performance, /gate="none"/);
assert.doesNotMatch(progress, /ProgrammeWaitingCard/);
assert.doesNotMatch(performance, /ProgrammeWaitingCard/);

console.log("qa-hyrox-portal-gate: ok");
