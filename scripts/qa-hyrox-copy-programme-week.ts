/**
 * QA: Copy Week To… — draft clone, safety, dates, Block 4+ weeks.
 * Run: npx tsx scripts/qa-hyrox-copy-programme-week.ts
 */

import {
  cloneCoachDraftWeekForTarget,
  countDraftProgrammingSessions,
  resolveCopyWeekDecision,
} from "../app/lib/hyroxCopyProgrammeWeek";
import type { CoachDraftSession, CoachDraftWeek } from "../app/lib/hyroxCoachProgrammeDraft";
import {
  blockNumberForGlobalWeek,
  cycleInBlockForGlobalWeek,
  globalWeeksForBlock,
  weekDateRangeFromProgrammeStart,
} from "../app/lib/hyroxProgrammeDates";
import { globalWeekForBlock } from "../app/lib/hyroxCoachProgrammeDraft";
import { publishedSessionHasAthleteLogs } from "../app/lib/hyroxProgrammeServer";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

function session(id: string, title: string, extra?: Record<string, unknown>): CoachDraftSession {
  return {
    timeOfDay: "Main",
    badges: ["Key"],
    title,
    sessionType: "run",
    duration: "60 min",
    intensity: "RPE 7–8",
    rpeHr: "RPE 7–8",
    isKeySession: true,
    isOptional: false,
    rationale: "threshold density",
    sessionId: `lib-${id}`,
    prescription: {
      objective: title,
      warmUp: ["Easy jog"],
      mainSet: ["5 x 6 min @ 3:32–3:38/km"],
      coolDown: ["Easy jog"],
    },
    sessionDetail: null,
    draftId: id,
    coachNote: "Hold controlled threshold.",
    editConfig: {
      kind: "threshold_run",
      sessionName: title,
      targetPace: "3:32–3:38/km",
      rpeTarget: "7–8",
      warmUpLines: ["Easy jog"],
      mainSetLines: ["5 x 6 min @ 3:32–3:38/km"],
      coolDownLines: ["Easy jog"],
    },
    ...extra,
  } as unknown as CoachDraftSession;
}

function weekWithSessions(week: number, sessions: CoachDraftSession[]): CoachDraftWeek {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => ({
    day,
    role: "quality" as const,
    roleLabel: "Quality",
    title: day,
    sessionType: "run" as const,
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
    sessions: sessions[i] ? [sessions[i]!] : [],
    optionalAddOn: null,
    emom: null,
    stationFocus: null,
    equipment: [],
  }));
  return {
    athleteId: "athlete-1",
    block: blockNumberForGlobalWeek(week),
    week,
    generatedAt: "2026-08-24T10:00:00.000Z",
    days,
  } as unknown as CoachDraftWeek;
}

const sourceIds = ["s1", "s2", "s3", "s4", "s5", "s6"];
const source = weekWithSessions(
  13,
  sourceIds.map((id, i) => session(id, `Session ${i + 1}`))
);
const sourceFingerprint = JSON.stringify(source);
const cloned = cloneCoachDraftWeekForTarget(source, { athleteId: "athlete-1", targetWeek: 14 });
const clonedSessions = cloned.days.flatMap((d) => d.sessions);

assert(clonedSessions.length === 6, "A: six target sessions");
assert(JSON.stringify(source) === sourceFingerprint, "A: source week unchanged");
assert(
  clonedSessions.every((s) => s.draftId.startsWith("copy-") && !sourceIds.includes(s.draftId)),
  "A: fresh session IDs"
);
assert(cloned.week === 14 && cloned.block === 4, "A: week/block metadata for W14");
assert(cloned.days[0]?.sessions[0]?.editConfig.targetPace === "3:32–3:38/km", "A: prescription/targets copied");
assert(cloned.days[0]?.sessions[0]?.coachNote === "Hold controlled threshold.", "A: coach notes copied");
assert(!("athlete_feedback" in (cloned.days[0]?.sessions[0] ?? {})), "A: no athlete feedback on target");
assert(cloned.generatedAt !== source.generatedAt, "A: target is a new draft timestamp");
ok("A empty target — six sessions copied as a fresh draft");

const dirtySource = weekWithSessions(13, [
  session("fb1", "Completed run", {
    athlete_feedback: { rpe: "9", notes: "athlete note", metrics: { averageHr: "180" } },
    completed_at: "2026-08-24T18:00:00.000Z",
    completedAt: "2026-08-24T18:00:00.000Z",
    loggedAt: "2026-08-24T18:00:00.000Z",
    metrics: { averageHr: "180", averagePace: "3:20" },
  }),
]);
const stripped = cloneCoachDraftWeekForTarget(dirtySource, { athleteId: "athlete-1", targetWeek: 14 })
  .days[0]!.sessions[0]! as CoachDraftSession & Record<string, unknown>;
assert(stripped.title === "Completed run", "B: coach title copied");
assert(stripped.editConfig.targetPace === "3:32–3:38/km", "B: planned pace copied");
assert(stripped.athlete_feedback == null, "B: athlete_feedback not copied");
assert(stripped.completed_at == null && stripped.completedAt == null, "B: completed_at not copied");
assert(stripped.metrics == null, "B: athlete metrics not copied");
assert(stripped.loggedAt == null, "B: loggedAt not copied");
ok("B source athlete feedback is stripped; programming remains");

const emptyDecision = resolveCopyWeekDecision(
  { hasProgramming: false, published: false, athleteHistory: false },
  false
);
assert(emptyDecision.ok && emptyDecision.action === "copy", "C: empty target allows copy");
const populatedNoReplace = resolveCopyWeekDecision(
  { hasProgramming: true, published: false, athleteHistory: false },
  false
);
assert(!populatedNoReplace.ok && populatedNoReplace.code === "TARGET_HAS_PROGRAMMING", "C: no silent overwrite");
const populatedReplace = resolveCopyWeekDecision(
  { hasProgramming: true, published: false, athleteHistory: false },
  true
);
assert(populatedReplace.ok && populatedReplace.action === "replace", "C: explicit replace allowed when unpublished");
ok("C populated unpublished target requires explicit replace");

const historyBlocked = resolveCopyWeekDecision(
  { hasProgramming: true, published: true, athleteHistory: true },
  true
);
assert(!historyBlocked.ok && historyBlocked.code === "TARGET_ATHLETE_ACTIVITY", "D: athlete history blocks replace");
assert(
  publishedSessionHasAthleteLogs({
    status: "completed",
    completed_at: "2026-08-24T18:00:00.000Z",
    athlete_feedback: { rpe: "8" },
  }),
  "D: completed session is treated as athlete history"
);
assert(
  !publishedSessionHasAthleteLogs({
    status: "scheduled",
    completed_at: null,
    athlete_feedback: null,
  }),
  "D: unused scheduled session is not athlete history"
);
const publishedNoHistory = resolveCopyWeekDecision(
  { hasProgramming: true, published: true, athleteHistory: false },
  true
);
assert(!publishedNoHistory.ok && publishedNoHistory.code === "TARGET_PUBLISHED", "D: published week is blocked even without logs");
ok("D target athlete history / published week cannot be replaced");

const w16to17 = cloneCoachDraftWeekForTarget(weekWithSessions(16, [session("w16", "Peak week")]), {
  athleteId: "athlete-1",
  targetWeek: 17,
});
assert(w16to17.week === 17, "E: target week is 17");
assert(w16to17.block === 5, "E: Week 17 belongs to Block 5");
assert(blockNumberForGlobalWeek(17) === 5, "E: helper Block 5");
assert(cycleInBlockForGlobalWeek(17) === 1, "E: Week 17 is cycle 1");
assert(globalWeekForBlock(5, 1) === 17, "E: inverse helper");
ok("E Week 16 → 17 lands on Block 5");

assert(JSON.stringify(globalWeeksForBlock(1)) === JSON.stringify([1, 2, 3, 4]), "F: Block 1 unchanged");
assert(JSON.stringify(globalWeeksForBlock(2)) === JSON.stringify([5, 6, 7, 8]), "F: Block 2 unchanged");
assert(JSON.stringify(globalWeeksForBlock(3)) === JSON.stringify([9, 10, 11, 12]), "F: Block 3 unchanged");
assert(JSON.stringify(globalWeeksForBlock(4)) === JSON.stringify([13, 14, 15, 16]), "F: Block 4 unchanged");
ok("F Blocks 1–4 week ranges unchanged");

const start = "2026-06-01";
const w13 = weekDateRangeFromProgrammeStart(start, 13);
const w14 = weekDateRangeFromProgrammeStart(start, 14);
assert(w13.startYmd === "2026-08-24" && w13.endYmd === "2026-08-30", "dates: W13 is 24–30 Aug");
assert(w14.startYmd === "2026-08-31" && w14.endYmd === "2026-09-06", "dates: W14 is 31 Aug–6 Sep");
const mon = new Date(`${w13.startYmd}T12:00:00`);
const copiedMon = new Date(mon);
copiedMon.setDate(copiedMon.getDate() + 7);
assert(copiedMon.toISOString().slice(0, 10) === w14.startYmd, "dates: Monday shifts +7 days");
ok("date shifting preserves weekday into the target week");

assert(countDraftProgrammingSessions(source) === 6, "source session count helper");
assert(countDraftProgrammingSessions(cloned) === 6, "cloned session count helper");
ok("session counts");

console.log(`\n${passed} copy-week checks passed.`);
