/**
 * QA: Auto-carry previous HYROX week forward on consecutive week navigation.
 * Run: npx tsx scripts/qa-hyrox-auto-carry-week.ts
 */

import {
  AUTO_CARRY_COPY,
  cloneCoachDraftWeekForTarget,
  resolveAutoCarryForward,
  shouldAutoCarryProgrammeWeek,
} from "../app/lib/hyroxCopyProgrammeWeek";
import {
  blockNumberForGlobalWeek,
  cycleInBlockForGlobalWeek,
} from "../app/lib/hyroxProgrammeDates";
import { globalWeekForBlock } from "../app/lib/hyroxCoachProgrammeDraft";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

const empty = { hasProgramming: false, published: false, athleteHistory: false };
const populated = { hasProgramming: true, published: false, athleteHistory: false };
const published = { hasProgramming: true, published: true, athleteHistory: false };
const history = { hasProgramming: true, published: true, athleteHistory: true };

assert(shouldAutoCarryProgrammeWeek(14, 15), "A: 14 → 15 is consecutive");
assert(shouldAutoCarryProgrammeWeek(15, 16), "A: 15 → 16 is consecutive");
const a = resolveAutoCarryForward({
  fromWeek: 14,
  toWeek: 15,
  target: empty,
  sourceHasProgramming: true,
});
assert(a.action === "copy", "A: empty consecutive target copies");
assert(
  AUTO_CARRY_COPY.copiedTitle(14, 15) === "WEEK 15 STARTED FROM WEEK 14",
  "A: copied title"
);
ok("A normal progression 14 → 15 copies into an empty week");

const b = resolveAutoCarryForward({
  fromWeek: 14,
  toWeek: 15,
  target: populated,
  sourceHasProgramming: true,
});
assert(b.action === "preserve" && b.reason === "has_programming", "B: existing draft preserved");
assert(
  AUTO_CARRY_COPY.preservedTitle(15) === "WEEK 15 ALREADY CONTAINS PROGRAMMING",
  "B: preserved title"
);
ok("B existing target programming is not overwritten");

const c = resolveAutoCarryForward({
  fromWeek: 14,
  toWeek: 15,
  target: published,
  sourceHasProgramming: true,
});
assert(c.action === "preserve" && c.reason === "published", "C: published target preserved");
ok("C published target is not auto-copied");

const d = resolveAutoCarryForward({
  fromWeek: 14,
  toWeek: 15,
  target: history,
  sourceHasProgramming: true,
});
assert(d.action === "preserve" && d.reason === "athlete_activity", "D: athlete history preserved");
ok("D athlete history in the target blocks auto-copy");

const cloned = cloneCoachDraftWeekForTarget(
  {
    athleteId: "athlete-1",
    block: 4,
    week: 14,
    generatedAt: "2026-08-24T10:00:00.000Z",
    days: [
      {
        day: "Mon",
        role: "quality",
        roleLabel: "Quality",
        title: "Mon",
        sessionType: "run",
        intensity: "RPE 7–8",
        duration: "60 min",
        rpeHr: "RPE 7–8",
        isKeySession: true,
        hardDay: true,
        hardEasyLabel: "Hard",
        thresholdMinutes: 30,
        qualityRunMinutes: 40,
        plannedMinutes: 60,
        rationale: "",
        sessions: [
          {
            timeOfDay: "Main",
            badges: ["Key"],
            title: "Threshold",
            sessionType: "run",
            duration: "60 min",
            intensity: "RPE 7–8",
            rpeHr: "RPE 7–8",
            isKeySession: true,
            isOptional: false,
            rationale: "",
            sessionId: "lib-1",
            prescription: { objective: "Threshold" },
            sessionDetail: null,
            draftId: "src-1",
            coachNote: "Hold",
            editConfig: { kind: "threshold_run", sessionName: "Threshold", targetPace: "3:32" },
            athlete_feedback: { rpe: "9" },
            completed_at: "2026-08-24T18:00:00.000Z",
          } as never,
        ],
        optionalAddOn: null,
        emom: null,
        stationFocus: null,
        equipment: [],
      } as never,
    ],
  },
  { athleteId: "athlete-1", targetWeek: 15 }
);
const copiedSession = cloned.days[0]!.sessions[0]! as { draftId: string; athlete_feedback?: unknown; completed_at?: unknown };
assert(cloned.week === 15 && cloned.block === 4, "E: week 15 / block 4 metadata");
assert(copiedSession.draftId.startsWith("copy-"), "E: fresh draft ids");
assert(copiedSession.athlete_feedback == null, "E: athlete feedback stripped");
assert(copiedSession.completed_at == null, "E: completion stripped");
ok("E published/completed source copies prescription only");

assert(shouldAutoCarryProgrammeWeek(16, 17), "F: 16 → 17 is consecutive");
assert(blockNumberForGlobalWeek(17) === 5, "F: week 17 is Block 5");
assert(cycleInBlockForGlobalWeek(17) === 1, "F: week 17 is cycle 1");
assert(globalWeekForBlock(5, 1) === 17, "F: inverse helper");
const f = resolveAutoCarryForward({
  fromWeek: 16,
  toWeek: 17,
  target: empty,
  sourceHasProgramming: true,
});
assert(f.action === "copy", "F: empty week 17 copies from 16");
ok("F Week 16 → 17 seeds Block 5 cycle 1");

assert(!shouldAutoCarryProgrammeWeek(14, 16), "G: 14 → 16 is a jump");
const g = resolveAutoCarryForward({
  fromWeek: 14,
  toWeek: 16,
  target: empty,
  sourceHasProgramming: true,
});
assert(g.action === "skip" && g.reason === "not_consecutive", "G: jumps skip auto-copy");
ok("G jump ahead does not auto-copy");

assert(!shouldAutoCarryProgrammeWeek(15, 14), "H: backwards is not consecutive");
const h = resolveAutoCarryForward({
  fromWeek: 15,
  toWeek: 14,
  target: empty,
  sourceHasProgramming: true,
});
assert(h.action === "skip" && h.reason === "not_consecutive", "H: backwards skip");
ok("H moving backwards does not auto-copy");

const noSource = resolveAutoCarryForward({
  fromWeek: 14,
  toWeek: 15,
  target: empty,
  sourceHasProgramming: false,
});
assert(noSource.action === "skip" && noSource.reason === "source_unavailable", "source missing skips");
assert(
  AUTO_CARRY_COPY.sourceUnavailable === "No previous programme was available to copy.",
  "source unavailable copy"
);
ok("missing previous programme skips copy without failing week change");

console.log(`\n${passed} auto-carry checks passed.`);
