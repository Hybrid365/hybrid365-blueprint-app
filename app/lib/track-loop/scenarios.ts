import type { ReadinessSubmission, WeekDay } from "@/app/lib/daily-readiness/types";
import { TRACK_FIXTURES } from "@/app/lib/track-foundation/fixtures";
import { evaluateTrackFoundation, type TrackFoundationState } from "@/app/lib/track-foundation/pipeline";
import { buildReadOnlyProgrammeProposal, type ReadOnlyProgrammeProposal } from "@/app/lib/track-foundation/proposeProgramme";
import { getTest } from "@/app/lib/track-foundation/testLibrary";
import type { BenchmarkResultInput, DayKey } from "@/app/lib/track-foundation/types";
import { rehearseAtomicApply, commitWouldBeRefused, type ApplyResult } from "./apply";
import { buildAthleteState, type TrackAthleteState } from "./athleteState";
import { decideToday, fingerprint, missedKeyPolicy, morningState, notificationsFor, type NextWeekDecision } from "./policy";
import { recommendNextWeek } from "./progression";
import { createAthleteRecord, TRACK_STORAGE_TABLES, type CalendarSession, type EscalationKind, type TrackAthleteRecord } from "./store";

const DAYS: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DATE: Record<WeekDay, string> = {
  Mon: "2026-11-16",
  Tue: "2026-11-17",
  Wed: "2026-11-18",
  Thu: "2026-11-19",
  Fri: "2026-11-20",
  Sat: "2026-11-21",
  Sun: "2026-11-22",
};

export const GENERATOR_REGRESSION = {
  verdict: "fixed" as const,
  assertion: "Week 7 Tuesday hard threshold anchor",
  cause:
    "Tuesday, Saturday and Sunday are hard anchors on a non-deload HYROX Pro week. The picker may vary only among sessions that satisfy the anchor, and repair cannot swap those days away.",
};

export const AUTOMATION_MATRIX = {
  ATHLETE_CHOICE: [
    "remove optional work",
    "reduce easy volume modestly",
    "move a key session one safe day",
    "swap a known easy run for easy bike",
  ],
  COACH_REQUIRED: [
    "pain",
    "repeated major fatigue",
    "significant deload",
    "major race-week change",
    "no valid family progression",
    "unknown modality tolerance",
    "programme structure conflict",
  ],
  BLOCKED: [
    "completed session mutation",
    "unsafe lower-body stacking",
    "unavailable day",
    "unsupported session",
    "provoking pain modality",
    "no safe reflow",
  ],
} as const;

export type LoopStory = {
  id: "accept" | "decline" | "pain" | "no_safe_reflow" | "multi_miss";
  transitions: string[];
  record: TrackAthleteRecord;
  beforeReadiness: string;
  afterReadiness: string;
  skiCleared: boolean;
  proposal: ReadOnlyProgrammeProposal | null;
  activationAllowed: false;
  activationReason: string;
  decisionOffer: boolean;
  proposalStatus: string | null;
  proposalAction: string | null;
  explanation: string;
  apply: ApplyResult | null;
  sessionsUnchanged: boolean;
  nagSuppressed: boolean;
  reofferAfterChange: boolean;
  nextWeek: NextWeekDecision;
  athleteState: TrackAthleteState;
  notifications: string[];
  escalations: EscalationKind[];
  weekTitles: string[];
};

function baseAthlete(id: string): TrackAthleteRecord {
  const seed = TRACK_FIXTURES.find((fixture) => fixture.id === "hyrox_recent");
  if (!seed) throw new Error("Track foundation fixture missing.");
  const intake = {
    ...seed.intake,
    athleteId: id,
    displayName: "Alex",
    availability: {
      ...seed.intake.availability,
      daysPerWeek: 7,
      availableDays: DAYS as DayKey[],
      unavailableDays: [] as DayKey[],
    },
  };
  const fiveK = seed.results.filter((result) => result.testId === "run_5k");
  const record = createAthleteRecord(intake, fiveK);
  record.priorFamilyCompletions = [
    { familyId: "threshold_volume_a", title: "5 x 5 min Threshold", rpe: 7, completion: "completed" },
    { familyId: "threshold_volume_a", title: "5 x 5 min Threshold", rpe: 7, completion: "completed" },
  ];
  return record;
}

function session(partial: Omit<CalendarSession, "date" | "kind" | "testId" | "instructions" | "version" | "status" | "load"> & { load?: CalendarSession["load"] }): CalendarSession {
  return {
    load: [],
    ...partial,
    date: DATE[partial.day],
    kind: "training",
    testId: null,
    instructions: [],
    version: 1,
    status: "planned",
  };
}

function trainingWeek(mode: "safe" | "blocked"): CalendarSession[] {
  const easy = (id: string, day: WeekDay, title: string): CalendarSession =>
    session({ id, day, title, priority: "supporting", stimulus: "easy", hard: false, lowerBody: false, modality: "run", anchor: false });
  if (mode === "blocked") {
    return [
      session({ id: "key-threshold", day: "Tue", title: "5 x 5 min Threshold", priority: "key", stimulus: "threshold", hard: true, lowerBody: true, modality: "run", anchor: false, load: [{ metricId: "threshold_min", label: "Threshold", value: 25, unit: "min" }] }),
      session({ id: "wed-hard", day: "Wed", title: "Lower strength", priority: "key", stimulus: "strength", hard: true, lowerBody: true, modality: "strength", anchor: false }),
      session({ id: "thu-hard", day: "Thu", title: "Sled", priority: "key", stimulus: "strength", hard: true, lowerBody: true, modality: "strength", anchor: false }),
      session({ id: "fri-hyrox", day: "Fri", title: "HYROX", priority: "key", stimulus: "hyrox", hard: true, lowerBody: true, modality: "hyrox", anchor: true }),
    ];
  }
  return [
    session({ id: "mon-easy", day: "Mon", title: "Easy run", priority: "supporting", stimulus: "easy", hard: false, lowerBody: false, modality: "run", anchor: false, load: [{ metricId: "run_km", label: "Run", value: 8, unit: "km" }] }),
    session({ id: "key-threshold", day: "Tue", title: "5 x 5 min Threshold", priority: "key", stimulus: "threshold", hard: true, lowerBody: true, modality: "run", anchor: false, load: [{ metricId: "threshold_min", label: "Threshold", value: 25, unit: "min" }] }),
    easy("wed-easy", "Wed", "Easy run"),
    easy("thu-easy", "Thu", "Easy run"),
    session({ id: "fri-hyrox", day: "Fri", title: "HYROX", priority: "key", stimulus: "hyrox", hard: true, lowerBody: true, modality: "hyrox", anchor: true }),
    session({ id: "key-hyrox", day: "Sat", title: "HYROX session", priority: "key", stimulus: "hyrox", hard: true, lowerBody: true, modality: "hyrox", anchor: false, load: [{ metricId: "hyrox_min", label: "HYROX", value: 50, unit: "min" }] }),
    session({ id: "sun-long", day: "Sun", title: "Long run", priority: "key", stimulus: "long", hard: true, lowerBody: true, modality: "run", anchor: true, load: [{ metricId: "run_min", label: "Long run", value: 60, unit: "min" }] }),
  ];
}

function morning(athleteId: string, localDate: string, scores: { sleep: number; energy: number; recovery: number; soreness: number; trainingReadiness: number }, pain?: { provokes: string }): ReadinessSubmission {
  return {
    id: `${athleteId}-${localDate}`,
    athleteId,
    localDate,
    timezone: "Europe/London",
    submittedAt: `${localDate}T07:00:00.000Z`,
    sleep: scores.sleep,
    energy: scores.energy,
    recovery: scores.recovery,
    soreness: scores.soreness,
    trainingReadiness: scores.trainingReadiness,
    pain: Boolean(pain),
    painArea: pain ? "knee" : null,
    painSeverity: pain ? 4 : null,
    painCourse: pain ? "same" : null,
    painProvokes: pain?.provokes ?? null,
    painNote: null,
    painFreeModalities: [],
  };
}

function history(athleteId: string): ReadinessSubmission[] {
  const good = { sleep: 8, energy: 8, recovery: 8, soreness: 2, trainingReadiness: 8 };
  return ["2026-11-14", "2026-11-15", "2026-11-16"].map((date) => morning(athleteId, date, good));
}

function lowMorning(athleteId: string, pain?: { provokes: string }) {
  return morningState({
    athleteId,
    localDate: "2026-11-17",
    history: history(athleteId),
    today: morning(athleteId, "2026-11-17", { sleep: 4, energy: 4, recovery: 4, soreness: 6, trainingReadiness: 3 }, pain),
  });
}

function addResult(record: TrackAthleteRecord, result: BenchmarkResultInput) {
  record.results.push(result);
  const session = record.sessions.find((item) => item.testId === result.testId && item.status === "planned");
  if (session) {
    session.status = "completed";
    record.feedback.push({
      id: `fb-${result.id}`,
      sessionId: session.id,
      completion: "completed",
      rpe: 8,
      feel: "expected",
      pain: false,
      actuals: {},
      recordedAt: `${result.date}T18:00:00.000Z`,
    });
  }
}

function stageAssessment(record: TrackAthleteRecord, foundation: TrackFoundationState) {
  record.sessions = foundation.week.sessions.map((item) => ({
    id: item.id,
    day: item.day,
    date: item.date,
    title: item.title,
    priority: item.kind === "test" ? "key" : "supporting",
    stimulus: item.kind,
    hard: item.stress === "high",
    lowerBody: item.testId === "run_5k" || item.testId === "hyrox_station_battery",
    modality: item.testId === "ski_2k" || item.testId === "row_2k" ? "erg" : item.kind === "recovery" ? "rest" : "run",
    status: "planned",
    anchor: false,
    load: [],
    kind: item.kind === "test" ? "assessment" : "training",
    testId: item.testId,
    instructions: item.testId ? getTest(item.testId)?.protocol ?? [item.summary] : [item.summary],
    version: 1,
  }));
}

function titles(record: TrackAthleteRecord): string[] {
  return DAYS.flatMap((day) => record.sessions.filter((session) => session.day === day).map((session) => `${day} ${session.title}`));
}

function finish(input: {
  id: LoopStory["id"];
  record: TrackAthleteRecord;
  transitions: string[];
  before: TrackFoundationState;
  after: TrackFoundationState;
  proposal: ReadOnlyProgrammeProposal | null;
  state: ReturnType<typeof lowMorning> | null;
  decisionOffer: boolean;
  proposalStatus: string | null;
  proposalAction: string | null;
  explanation: string;
  apply: ApplyResult | null;
  beforeTitles: string[];
  nagSuppressed: boolean;
  reofferAfterChange: boolean;
  nextWeek: NextWeekDecision;
}): LoopStory {
  return {
    id: input.id,
    transitions: input.transitions,
    record: input.record,
    beforeReadiness: input.before.profile.programmingReadiness,
    afterReadiness: input.after.profile.programmingReadiness,
    skiCleared: input.after.requirements.find((req) => req.id === "ski")?.status === "satisfied" && Boolean(input.after.anchors.ski),
    proposal: input.proposal,
    activationAllowed: false,
    activationReason: commitWouldBeRefused(),
    decisionOffer: input.decisionOffer,
    proposalStatus: input.proposalStatus,
    proposalAction: input.proposalAction,
    explanation: input.explanation,
    apply: input.apply,
    sessionsUnchanged: titles(input.record).join("|") === input.beforeTitles.join("|"),
    nagSuppressed: input.nagSuppressed,
    reofferAfterChange: input.reofferAfterChange,
    nextWeek: input.nextWeek,
    athleteState: buildAthleteState({ record: input.record, foundation: input.after, readiness: input.state }),
    notifications: notificationsFor(input.transitions.flatMap((item) => (item.startsWith("notify:") ? [item.slice("notify:".length)] : []))),
    escalations: input.record.escalations.map((item) => item.kind),
    weekTitles: titles(input.record),
  };
}

function prepare(id: string, mode: "safe" | "blocked") {
  const record = baseAthlete(id);
  const before = evaluateTrackFoundation({ intake: record.intake, results: record.results });
  stageAssessment(record, before);
  addResult(record, { id: `${id}-ski`, testId: "ski_2k", resultValue: "7:42", unit: "mm:ss", date: "2026-11-16", source: "coach_test" });
  addResult(record, { id: `${id}-row`, testId: "row_2k", resultValue: "7:28", unit: "mm:ss", date: "2026-11-16", source: "coach_test" });
  addResult(record, { id: `${id}-stations`, testId: "hyrox_station_battery", resultValue: "logged", unit: "mixed", date: "2026-11-16", source: "coach_test" });
  const after = evaluateTrackFoundation({ intake: record.intake, results: record.results });
  const proposal = buildReadOnlyProgrammeProposal(after);
  record.versions.push(record.sessions.map((session) => ({ ...session, load: session.load.map((item) => ({ ...item })) })));
  record.sessions = trainingWeek(mode);
  return { record, before, after, proposal };
}

export function runAcceptStory(): LoopStory {
  const { record, before, after, proposal } = prepare("loop-accept", "safe");
  const state = lowMorning(record.athleteId);
  const decision = decideToday({ record, state, today: "Tue" });
  const beforeTitles = titles(record);
  if (!decision.proposal) throw new Error("Expected a Tuesday recommendation.");
  const apply = rehearseAtomicApply({ record, proposal: decision.proposal, state, decision: "accepted", recordedAt: "2026-11-17T08:00:00.000Z" });
  const threshold = record.sessions.find((session) => session.id === "key-threshold");
  if (threshold) threshold.status = "completed";
  record.feedback.push({
    id: "fb-threshold",
    sessionId: "key-threshold",
    completion: "completed",
    rpe: 7,
    feel: "expected",
    pain: false,
    actuals: { Threshold: 25 },
    recordedAt: "2026-11-18T19:00:00.000Z",
  });
  const hyrox = record.sessions.find((session) => session.id === "key-hyrox");
  if (hyrox) hyrox.status = "completed";
  record.feedback.push({
    id: "fb-hyrox",
    sessionId: "key-hyrox",
    completion: "completed",
    rpe: 8,
    feel: "harder",
    pain: false,
    actuals: {},
    recordedAt: "2026-11-21T12:00:00.000Z",
  });
  record.checkIns.push({
    id: "check-1",
    weekOf: "2026-11-16",
    recovery: 8,
    motivation: 8,
    lifeStress: 3,
    manageable: 8,
    persistentSoreness: false,
    availabilityChanged: false,
    travel: false,
    eventChange: false,
    note: null,
  });
  const nextWeek = recommendNextWeek(record);
  return finish({
    id: "accept",
    record,
    transitions: [
      `onboard ${before.profile.programmingReadiness}`,
      "evidence 5K accepted",
      "assessment ski row stations",
      `anchors ${after.profile.programmingReadiness}`,
      "programme read-only",
      "activation refused",
      "notify:morning_check_in",
      "readiness low",
      "notify:meaningful_recommendation",
      "accepted",
      "notify:schedule_change_accepted",
      "threshold RPE 7",
      "hyrox RPE 8",
      "weekly check-in good",
      `next ${nextWeek.decision}`,
      "notify:next_week_ready",
    ],
    before,
    after,
    proposal,
    state,
    decisionOffer: decision.offer,
    proposalStatus: decision.proposal?.status ?? null,
    proposalAction: decision.proposal?.action ?? null,
    explanation: decision.proposal?.athleteExplanation ?? decision.reason,
    apply,
    beforeTitles,
    nagSuppressed: false,
    reofferAfterChange: false,
    nextWeek,
  });
}

export function runDeclineStory(): LoopStory {
  const { record, before, after, proposal } = prepare("loop-decline", "safe");
  const state = lowMorning(record.athleteId);
  const decision = decideToday({ record, state, today: "Tue" });
  const beforeTitles = titles(record);
  if (!decision.proposal) throw new Error("Expected a recommendation to decline.");
  const apply = rehearseAtomicApply({ record, proposal: decision.proposal, state, decision: "declined", recordedAt: "2026-11-17T08:05:00.000Z" });
  const again = decideToday({ record, state, today: "Tue" });
  const moved = record.sessions.find((session) => session.id === "wed-easy");
  if (moved) moved.status = "completed";
  const later = decideToday({ record, state, today: "Tue" });
  return finish({
    id: "decline",
    record,
    transitions: ["recommendation", "declined", again.offer ? "nagged" : "nag suppressed", later.offer ? "state changed" : "still quiet"],
    before,
    after,
    proposal,
    state,
    decisionOffer: decision.offer,
    proposalStatus: decision.proposal?.status ?? null,
    proposalAction: decision.proposal?.action ?? null,
    explanation: decision.proposal?.athleteExplanation ?? decision.reason,
    apply,
    beforeTitles,
    nagSuppressed: !again.offer,
    reofferAfterChange: later.offer,
    nextWeek: recommendNextWeek(record),
  });
}

export function runPainStory(): LoopStory {
  const { record, before, after, proposal } = prepare("loop-pain", "safe");
  const state = lowMorning(record.athleteId, { provokes: "run" });
  const beforeTitles = titles(record);
  const decision = decideToday({ record, state, today: "Tue" });
  record.escalations.push({
    id: "esc-pain",
    kind: "PAIN_REVIEW",
    summary: "Pain was reported before today's run. The programme was left as written.",
    status: "open",
  });
  return finish({
    id: "pain",
    record,
    transitions: ["pain reported", "programme unchanged", "coach queue"],
    before,
    after,
    proposal,
    state,
    decisionOffer: decision.offer,
    proposalStatus: decision.proposal?.status ?? null,
    proposalAction: decision.proposal?.action ?? null,
    explanation: decision.proposal?.athleteExplanation ?? decision.reason,
    apply: null,
    beforeTitles,
    nagSuppressed: true,
    reofferAfterChange: false,
    nextWeek: { decision: "KEEP", changes: [], explanation: "Pain is with a coach. Next week was not rewritten." },
  });
}

export function runNoSafeReflowStory(): LoopStory {
  const { record, before, after, proposal } = prepare("loop-stuck", "blocked");
  const state = lowMorning(record.athleteId);
  const beforeTitles = titles(record);
  const decision = decideToday({ record, state, today: "Tue" });
  if (decision.proposal?.status === "NO_SAFE_REFLOW") {
    record.escalations.push({
      id: "esc-reflow",
      kind: "NO_SAFE_REFLOW",
      summary: decision.proposal.conflicts[0] ?? "No safe move.",
      status: "open",
    });
  }
  return finish({
    id: "no_safe_reflow",
    record,
    transitions: ["readiness low", decision.proposal?.status ?? "missing", "programme unchanged"],
    before,
    after,
    proposal,
    state,
    decisionOffer: decision.offer,
    proposalStatus: decision.proposal?.status ?? null,
    proposalAction: decision.proposal?.action ?? null,
    explanation: decision.proposal?.athleteExplanation ?? decision.reason,
    apply: null,
    beforeTitles,
    nagSuppressed: true,
    reofferAfterChange: false,
    nextWeek: { decision: "KEEP", changes: [], explanation: "There was no safe move, so the week stays." },
  });
}

export function runMultiMissStory(): LoopStory {
  const { record, before, after, proposal } = prepare("loop-miss", "safe");
  const beforeTitles = titles(record);
  record.feedback.push(
    { id: "miss-1", sessionId: "key-threshold", completion: "skipped", rpe: null, feel: null, pain: false, actuals: {}, recordedAt: "2026-11-17T20:00:00.000Z" },
    { id: "miss-2", sessionId: "key-hyrox", completion: "skipped", rpe: null, feel: null, pain: false, actuals: {}, recordedAt: "2026-11-21T20:00:00.000Z" }
  );
  const policy = missedKeyPolicy(2);
  const nextWeek = recommendNextWeek(record);
  return finish({
    id: "multi_miss",
    record,
    transitions: [`miss policy ${policy}`, nextWeek.decision, "sessions not reshuffled"],
    before,
    after,
    proposal,
    state: null,
    decisionOffer: false,
    proposalStatus: null,
    proposalAction: null,
    explanation: "Missed key sessions stay missed. They are not pushed through the week.",
    apply: null,
    beforeTitles,
    nagSuppressed: true,
    reofferAfterChange: false,
    nextWeek,
  });
}

export function proveAtomicRollback(): { rolledBack: boolean; unchanged: boolean } {
  const record = baseAthlete("loop-rollback");
  record.sessions = trainingWeek("safe");
  const snapshot = titles(record);
  const state = lowMorning(record.athleteId);
  const decision = decideToday({ record, state, today: "Tue" });
  if (!decision.proposal) throw new Error("Rollback fixture needs a proposal.");
  const broken = {
    ...decision.proposal,
    after: decision.proposal.after.map((session, index) => (index === 0 ? { ...session, id: decision.proposal!.after[1]?.id ?? session.id } : session)),
  };
  const apply = rehearseAtomicApply({ record, proposal: broken, state, decision: "accepted", recordedAt: "2026-11-17T08:10:00.000Z" });
  return { rolledBack: apply.rolledBack, unchanged: titles(record).join("|") === snapshot.join("|") };
}

export function productStopsAutomation(): boolean {
  const record = baseAthlete("loop-paused");
  record.product = "paused";
  record.sessions = trainingWeek("safe");
  const decision = decideToday({ record, state: lowMorning(record.athleteId), today: "Tue" });
  return decision.offer === false && decision.proposal == null;
}

export function readinessTransition(): { from: string; to: string; proposal: boolean } {
  const record = baseAthlete("loop-ready");
  record.results = [];
  const empty = evaluateTrackFoundation({ intake: record.intake, results: [] });
  record.results.push({ id: "ready-5k", testId: "run_5k", resultValue: "18:12", unit: "mm:ss", date: "2026-11-05", source: "official_race" });
  const withFive = evaluateTrackFoundation({ intake: record.intake, results: record.results });
  return {
    from: empty.profile.programmingReadiness,
    to: withFive.profile.programmingReadiness,
    proposal: buildReadOnlyProgrammeProposal(withFive) != null,
  };
}

export function reassessmentExample(): { due: boolean; programmeKept: boolean } {
  const record = baseAthlete("loop-reassess");
  record.results.push({ id: "old-ski", testId: "ski_2k", resultValue: "7:50", unit: "mm:ss", date: "2026-09-01", source: "coach_test" });
  const state = evaluateTrackFoundation({ intake: record.intake, results: record.results });
  const proposal = buildReadOnlyProgrammeProposal(state);
  const ski = state.requirements.find((req) => req.id === "ski");
  return { due: ski?.status === "reassessment_due" || state.anchors.reassessmentDue.length > 0, programmeKept: proposal != null && proposal.published === false };
}

export function nextBlock(story: LoopStory): { weekCount: number; published: false } | null {
  if (!story.proposal) return null;
  return { weekCount: story.proposal.weekCount, published: false };
}

export function storageReview(): { duplicateTables: string[]; productionApplied: false } {
  const foundation = new Set<string>(TRACK_STORAGE_TABLES.foundation);
  const duplicateTables = TRACK_STORAGE_TABLES.loop.filter((table) => foundation.has(table));
  return { duplicateTables, productionApplied: false };
}

export function sameRecommendationFingerprint(story: LoopStory): string {
  const proposal = story.apply?.record.proposal as { action?: string } | undefined;
  return fingerprint(proposal?.action ?? "none", "2026-11-17", story.apply?.record.beforeWeek ?? []);
}

export function oneGoodSessionKeeps(): NextWeekDecision {
  const record = baseAthlete("loop-once");
  record.priorFamilyCompletions = record.priorFamilyCompletions.slice(0, 1);
  record.checkIns.push({
    id: "check-once",
    weekOf: "2026-11-16",
    recovery: 8,
    motivation: 8,
    lifeStress: 3,
    manageable: 8,
    persistentSoreness: false,
    availabilityChanged: false,
    travel: false,
    eventChange: false,
    note: null,
  });
  return recommendNextWeek(record);
}

export function runLoopStories(): LoopStory[] {
  return [runAcceptStory(), runDeclineStory(), runPainStory(), runNoSafeReflowStory(), runMultiMissStory()];
}
