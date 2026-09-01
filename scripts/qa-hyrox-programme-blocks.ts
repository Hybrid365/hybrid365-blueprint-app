/**
 * QA: HYROX 1-1 programme blocks — Block 4 / next-block helpers.
 * Run: npx tsx scripts/qa-hyrox-programme-blocks.ts
 */

import {
  blockNumberForGlobalWeek,
  clampProgrammeBlock,
  cycleInBlockForGlobalWeek,
  globalWeeksForBlock,
  nextBlockNumber,
  parseCoachBlockNumber,
  plannedProgrammeBlocks,
  resolvePublishBlockNumber,
  visibleCoachBlockCount,
} from "../app/lib/hyroxProgrammeDates";
import { globalWeekForBlock } from "../app/lib/hyroxCoachProgrammeDraft";
import { resolveNextBlockGenerationPlan } from "../app/lib/hyroxBlockReviewGeneration";
import { maxReviewBlocks } from "../app/lib/hyroxBlockReview";
import { resolveHyroxBlockMeta } from "../app/lib/hyroxTeamDashboardMock";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

assert(plannedProgrammeBlocks(12) === 3, "12-week plan still lists 3 named blocks");
ok("12-week planned block count is 3");

assert(plannedProgrammeBlocks(16) === 4, "16-week plan lists 4 named blocks");
ok("16-week planned block count is 4");

assert(nextBlockNumber(1, 12) === 2, "next after Block 1 is 2");
assert(nextBlockNumber(2, 12) === 3, "next after Block 2 is 3");
assert(nextBlockNumber(3, 12) === 4, "next after Block 3 on 12-week is 4");
assert(nextBlockNumber(4, 12) === 5, "next after Block 4 is 5");
ok("nextBlockNumber is not capped at plan length");

assert(visibleCoachBlockCount({ programmeLengthWeeks: 12, highestExistingBlock: 0 }) === 3, "new 12-week athlete still sees 3 tabs");
assert(visibleCoachBlockCount({ programmeLengthWeeks: 12, highestExistingBlock: 1 }) === 3, "Block 1 only still sees 3 tabs");
assert(visibleCoachBlockCount({ programmeLengthWeeks: 12, highestExistingBlock: 2 }) === 3, "Blocks 1–2 still sees 3 tabs");
assert(visibleCoachBlockCount({ programmeLengthWeeks: 12, highestExistingBlock: 3 }) === 4, "Blocks 1–3 unlocks Block 4 tab");
assert(visibleCoachBlockCount({ programmeLengthWeeks: 12, highestExistingBlock: 4 }) === 5, "Block 4 existing unlocks next empty tab");
assert(
  visibleCoachBlockCount({ programmeLengthWeeks: 12, highestExistingBlock: 3, requestedBlock: 4 }) === 4,
  "requesting Block 4 is not clamped to 3"
);
ok("visibleCoachBlockCount is additive and does not shrink Blocks 1–3");

assert(globalWeekForBlock(1, 1) === 1, "Block 1 W1 is global week 1");
assert(globalWeekForBlock(3, 4) === 12, "Block 3 W4 is global week 12");
assert(globalWeekForBlock(4, 1) === 13, "Block 4 W1 is global week 13");
assert(globalWeekForBlock(4, 4) === 16, "Block 4 W4 is global week 16");
ok("globalWeekForBlock supports Block 4 weeks 13–16");

assert(JSON.stringify(globalWeeksForBlock(4)) === JSON.stringify([13, 14, 15, 16]), "Block 4 weeks tuple");
ok("globalWeeksForBlock(4) is 13–16");

const plan12b3 = resolveNextBlockGenerationPlan({
  reviewedBlockNumber: 3,
  programmeLengthWeeks: 12,
  recommendation: "progress_as_planned",
});
assert(plan12b3.kind === "generate_block", "Block 3 on 12-week can generate next block");
assert(plan12b3.kind === "generate_block" && plan12b3.nextBlockNumber === 4, "next is Block 4");
ok("12-week Block 3 review generates Block 4");

const planRetest = resolveNextBlockGenerationPlan({
  reviewedBlockNumber: 3,
  programmeLengthWeeks: 12,
  recommendation: "retest_recalibrate",
});
assert(planRetest.kind === "generate_block" && planRetest.nextBlockNumber === 4, "retest recommendation does not block Block 4");
ok("Create Next Block is not hijacked by retest recommendation");

const planForcedRetest = resolveNextBlockGenerationPlan({
  reviewedBlockNumber: 3,
  programmeLengthWeeks: 12,
  forceRetestWeek: true,
});
assert(planForcedRetest.kind === "retest_week", "explicit retest week still available");
ok("forceRetestWeek still generates Week 12 retest only");

const plan12b1 = resolveNextBlockGenerationPlan({
  reviewedBlockNumber: 1,
  programmeLengthWeeks: 12,
});
assert(plan12b1.kind === "generate_block" && plan12b1.nextBlockNumber === 2, "Block 1 still generates Block 2");
ok("Block 1 → 2 generation unchanged");

assert(parseCoachBlockNumber(4) === 4, "parseCoachBlockNumber(4) is not clamped to 3");
assert(parseCoachBlockNumber(3) === 3, "parseCoachBlockNumber(3) unchanged");
assert(parseCoachBlockNumber(5) === 5, "parseCoachBlockNumber(5) is not clamped to 4");
assert(clampProgrammeBlock(0) === 1, "clamp lower bound");
ok("API block parsing no longer clamps 4 down to 3");

assert(resolvePublishBlockNumber(4) === 4, "publish Block 4 stays Block 4");
assert(resolvePublishBlockNumber(4) !== 3, "publish Block 4 never resolves to Block 3");
assert(resolvePublishBlockNumber(5) === 5, "publish Block 5 stays Block 5");
assert(resolvePublishBlockNumber(1) === 1, "publish Block 1 unchanged");
assert(resolvePublishBlockNumber(3) === 3, "publish Block 3 unchanged");
ok("publishProgrammeBlock does not clamp Block 4 to Block 3");

assert(JSON.stringify(globalWeeksForBlock(1)) === JSON.stringify([1, 2, 3, 4]), "Block 1 weeks 1–4");
assert(JSON.stringify(globalWeeksForBlock(2)) === JSON.stringify([5, 6, 7, 8]), "Block 2 weeks 5–8");
assert(JSON.stringify(globalWeeksForBlock(3)) === JSON.stringify([9, 10, 11, 12]), "Block 3 weeks 9–12");
assert(JSON.stringify(globalWeeksForBlock(4)) === JSON.stringify([13, 14, 15, 16]), "Block 4 weeks 13–16");
assert(JSON.stringify(globalWeeksForBlock(5)) === JSON.stringify([17, 18, 19, 20]), "Block 5 weeks 17–20");
ok("block numbering: 1=1–4, 2=5–8, 3=9–12, 4=13–16, 5=17–20");

assert(blockNumberForGlobalWeek(13) === 4 && cycleInBlockForGlobalWeek(13) === 1, "W13 is Block 4 cycle 1");
assert(blockNumberForGlobalWeek(14) === 4 && cycleInBlockForGlobalWeek(14) === 2, "W14 is Block 4 cycle 2");
assert(blockNumberForGlobalWeek(16) === 4 && cycleInBlockForGlobalWeek(16) === 4, "W16 is Block 4 cycle 4");
assert(blockNumberForGlobalWeek(17) === 5 && cycleInBlockForGlobalWeek(17) === 1, "W17 is Block 5 cycle 1");
assert(globalWeekForBlock(5, 1) === 17, "Block 5 W1 is global week 17");
ok("Week 16 → 17 resolves to Block 5 without hard-coding Block 4");

const b4Weeks = new Set(globalWeeksForBlock(4));
const b5Weeks = new Set(globalWeeksForBlock(5));
const priorWeeks = new Set([...globalWeeksForBlock(1), ...globalWeeksForBlock(2), ...globalWeeksForBlock(3)]);
assert([...b4Weeks].every((w) => !priorWeeks.has(w)), "Block 4 weeks do not overlap Blocks 1–3");
assert([...b5Weeks].every((w) => !b4Weeks.has(w) && !priorWeeks.has(w)), "Block 5 weeks do not overlap Blocks 1–4");
ok("Block 5 drafts target weeks 17–20 and cannot collide with Block 4");

const plan12b4 = resolveNextBlockGenerationPlan({
  reviewedBlockNumber: 4,
  programmeLengthWeeks: 12,
  recommendation: "progress_as_planned",
});
assert(plan12b4.kind === "generate_block" && plan12b4.nextBlockNumber === 5, "published Block 4 can generate Block 5");
assert(plan12b4.kind === "generate_block" && plan12b4.weeksStart === 17 && plan12b4.weeksEnd === 20, "Block 5 is weeks 17–20");
ok("Create Next Block after Block 4 offers Block 5");

assert(maxReviewBlocks(12) === 4, "reviews allow Block 4 (DB check is 1–4)");
ok("maxReviewBlocks allows Block 4 on 12-week athletes");

const block4Meta = resolveHyroxBlockMeta(4);
assert(block4Meta.weeks[0] === 13 && block4Meta.weeks[3] === 16, "athlete Block 4 weeks 13–16");
assert(resolveHyroxBlockMeta(5).weeks[0] === 17 && resolveHyroxBlockMeta(5).weeks[3] === 20, "athlete Block 5 weeks 17–20");
assert(resolveHyroxBlockMeta(1).name === "Build the Base", "Block 1 athlete name unchanged");
assert(resolveHyroxBlockMeta(3).name === "Race Performance", "Block 3 athlete name unchanged");
ok("athlete block meta is generic past Block 3");

console.log(`\n${passed} checks passed.`);
