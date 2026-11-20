import { addDays, mondayOf } from "@/app/lib/track-foundation/dates";
import { evaluateTrackFoundation } from "@/app/lib/track-foundation/pipeline";
import { buildEvidenceBook } from "@/app/lib/track-foundation/evidence";
import { resolveStationDomains } from "@/app/lib/track-foundation/stationEvidence";
import { getTest, protocolForAthlete } from "@/app/lib/track-foundation/testLibrary";
import type { BenchmarkResultInput, DayKey, TrackIntake } from "@/app/lib/track-foundation/types";
import { mapAssessmentToProgrammeInput } from "@/app/lib/mapAssessmentToProgrammeInput";
import { generate12WeekProgramme } from "@/app/lib/generate12WeekProgramme";
import { interpretReadiness } from "@/app/lib/daily-readiness/interpret";
import { resolveRemainingWeek } from "@/app/lib/daily-readiness/reflow";
import type { ReadinessSubmission, WeekSession } from "@/app/lib/daily-readiness/types";
import { CANARY_ATHLETE_ID, CANARY_EMAIL, CANARY_NAME, canaryDb } from "./db";
import { acceptNextWeek as stagingAcceptNextWeek, prepareProgramme, saveStationBattery, type ProgrammeSnapshot } from "./weeks";
import {
  PRODUCTION_TRACK_CANARY_ATHLETE_ID,
  PRODUCTION_TRACK_CANARY_AUTH_USER_ID,
  productionTrackAccessEnabled,
  refuseProductionProgrammeWrite,
} from "@/app/lib/track-production/access";
import { savedMorningForDate, type SavedMorning } from "@/app/lib/track-canary/morningCard";
import { resolveTrackClock } from "@/app/lib/track-production/clock";
import { productionTrackDb } from "@/app/lib/track-production/db";

const WEEK_START = "2026-11-16";
const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function productAthleteId(): string {
  return productionTrackAccessEnabled() ? PRODUCTION_TRACK_CANARY_ATHLETE_ID : CANARY_ATHLETE_ID;
}

function productDb() {
  return productionTrackAccessEnabled() ? productionTrackDb() : canaryDb();
}

function productClock(fallback: string, intakeClock?: string | null): string {
  return resolveTrackClock({
    production: productionTrackAccessEnabled(),
    intakeClock,
    fixtureClock: fallback,
  });
}


type SessionPayload = {
  weekNumber?: number;
  purpose?: string;
  main?: string[];
  notes?: string[];
  family?: string | null;
  pace?: string | null;
  effort?: string | null;
  priority?: WeekSession["priority"];
  stimulus?: string;
  hard?: boolean;
  lowerBody?: boolean;
  modality?: WeekSession["modality"];
  anchor?: boolean;
  load?: WeekSession["load"];
  testId?: string | null;
};

export type CanaryView = {
  name: string;
  clock: string;
  phase: "onboard" | "evidence" | "plan" | "assessment" | "ready" | "home";
  known: string[];
  needed: string[];
  readinessLabel: string;
  sessions: Array<{
    id: string;
    day: string;
    date: string;
    title: string;
    status: string;
    kind: string;
    summary: string;
    blocks: string[];
    pace: string | null;
    effort: string | null;
    family: string | null;
    testId: string | null;
  }>;
  homeDays: Array<{ day: string; title: string; today: boolean; changed: boolean }>;
  todayTitle: string;
  countdown: string;
  recommendation: null | {
    proposalId: string;
    why: string;
    todayTitle: string;
    recommended: string;
    also: string;
    canChoose: boolean;
  };
  accepted: null | { why: string; changes: string[] };
  workload: Array<{ label: string; planned: string; completed: string | null }>;
  performance: Array<{ label: string; display: string; provenance: string }>;
  checkIn: null | { recovery: number; motivation: number };
  morning: SavedMorning | null;
  nextWeek: ProgrammeSnapshot["nextWeek"];
  impact: ProgrammeSnapshot["impact"];
  stations: ProgrammeSnapshot["stations"];
  stationNeeded: boolean;
  history: ProgrammeSnapshot["history"];
  previousCompleted: string[];
  nextTitles: Array<{ day: string; title: string }>;
  currentWeek: number;
  programmeWeeks: number;
  blockNote: string | null;
  wallBall: null | { from: string; to: string; why: string };
  holds: string[];
  painNote: string | null;
  audit: Array<{ label: string; at: string }>;
  activationOpen: boolean;
  evidenceChoices: { fiveK: string; fiveKDate: string; hyrox: string; hyroxDate: string; hyroxLabel: string };
};

function dateFor(day: DayKey, start = WEEK_START): string {
  return addDays(start, DAYS.indexOf(day));
}

function blankIntake(): TrackIntake {
  return {
    athleteId: productAthleteId(),
    displayName: CANARY_NAME,
    goal: null,
    event: { hasEvent: false, eventType: null, eventName: null, eventDate: null, division: null },
    availability: {
      daysPerWeek: 0,
      availableDays: [],
      unavailableDays: [],
      doublesPossible: false,
      doubleDays: [],
      sessionLength: null,
      weekendAvailable: false,
    },
    background: {
      runDaysPerWeek: null,
      runKmPerWeek: null,
      strengthDaysPerWeek: null,
      hyroxSessionsPerWeek: null,
      bikeOrErgNote: null,
      trainingAge: null,
    },
    equipment: [],
    equipmentConfirmed: false,
    pain: { hasConcern: false, areas: [], severity: "none", affectsTraining: false, note: null },
  };
}

async function ensureAthlete() {
  const db = productDb();
  if (productionTrackAccessEnabled()) {
    const { data, error } = await db
      .from("hyrox_athletes")
      .select("id, user_id, name, payment_status")
      .eq("id", productAthleteId())
      .maybeSingle();
    if (error || !data) throw new Error(error?.message ?? "Production canary athlete is missing.");
    if (data.user_id !== PRODUCTION_TRACK_CANARY_AUTH_USER_ID || data.name !== "Hybrid365 Track Canary") {
      throw new Error("Production canary identity mismatch.");
    }
    if (data.payment_status === "paid") throw new Error("Production canary must stay unpaid.");
    return db;
  }
  const { error } = await db.from("hyrox_athletes").upsert(
    {
      id: productAthleteId(),
      name: CANARY_NAME,
      email: CANARY_EMAIL,
      status: "accepted",
      programme_status: "not_started",
      payment_status: "paid",
    },
    { onConflict: "id" }
  );
  if (error) throw new Error(error.message);
  await db.from("track_product_membership").upsert({ athlete_id: productAthleteId(), status: "active" }, { onConflict: "athlete_id" });
  return db;
}

function resultsFromRows(rows: Array<Record<string, unknown>>): BenchmarkResultInput[] {
  return rows.map((row) => ({
    id: String(row.id),
    testId: String(row.test_id),
    resultValue: String(row.result_value),
    unit: String(row.unit),
    date: String(row.tested_on),
    source: row.source as BenchmarkResultInput["source"],
    notes: (row.notes as string | null) ?? null,
    details: (row.details as BenchmarkResultInput["details"]) ?? null,
    correctsResultId: (row.corrects_result_id as string | null) ?? null,
  }));
}

async function persistDerived(intake: TrackIntake, results: BenchmarkResultInput[]) {
  const db = productDb();
  const clock = (intake as TrackIntake & { clock?: string }).clock;
  const state = evaluateTrackFoundation({
    intake,
    results,
    asOf: productClock("2026-11-17", clock),
  });
  const anchors = [
    state.anchors.running.easy,
    state.anchors.running.threshold,
    state.anchors.ski,
    state.anchors.row,
    state.anchors.hyrox.anchor,
    ...state.anchors.stations,
  ].filter((anchor) => anchor);
  for (const anchor of anchors) {
    await db.from("track_training_anchors").upsert(
      {
        athlete_id: productAthleteId(),
        anchor_key: anchor!.key,
        status: anchor!.status,
        display_value: anchor!.display,
        provenance: anchor!.provenance ?? {},
        derived_at: new Date().toISOString(),
      },
      { onConflict: "athlete_id,anchor_key" }
    );
  }
  await db.from("track_performance_profiles").upsert({
    athlete_id: productAthleteId(),
    readiness: state.profile.programmingReadiness,
    profile: { lines: state.profile.sections.flatMap((section) => section.known).slice(0, 12) },
    derived_at: new Date().toISOString(),
  });
  return state;
}

export async function saveOnboarding(intake: TrackIntake) {
  const db = await ensureAthlete();
  const stored = {
    ...intake,
    athleteId: productAthleteId(),
    displayName: productionTrackAccessEnabled() ? "Hybrid365 Track Canary" : CANARY_NAME,
    clock: productClock("2026-11-13"),
  };
  const { error } = await db.from("track_athlete_intake").upsert(
    { athlete_id: productAthleteId(), intake: stored, updated_at: new Date().toISOString() },
    { onConflict: "athlete_id" }
  );
  if (error) throw new Error(error.message);
  await persistDerived(stored, []);
}

export async function addEvidence(input: { testId: string; resultValue: string; date: string; source: BenchmarkResultInput["source"] }) {
  const db = await ensureAthlete();
  const test = getTest(input.testId);
  if (!test) throw new Error("Unknown test.");
  const { error } = await db.from("track_benchmark_results").insert({
    athlete_id: productAthleteId(),
    test_id: input.testId,
    result_value: input.resultValue,
    unit: test.resultUnit,
    tested_on: input.date,
    source: input.source,
    notes: null,
    details: {},
  });
  if (error) throw new Error(error.message);
  const intake = await readIntake();
  const results = await readResults();
  await persistDerived(intake, results);
}

export async function createAssessmentWeek() {
  const db = await ensureAthlete();
  const intake = await readIntake();
  const results = await readResults();
  const asOf = productClock("2026-11-09", (intake as TrackIntake & { clock?: string }).clock);
  const state = evaluateTrackFoundation({ intake, results, asOf });
  await db.from("track_assessment_plans").insert({
    athlete_id: productAthleteId(),
    requirements: state.requirements,
    sessions: state.week.sessions,
  });
  const usedDays = new Set<string>();
  const rows = state.week.sessions.map((session) => {
    const covered = session.summary.includes("Already covered");
    const active = !covered && !usedDays.has(session.day);
    if (active) usedDays.add(session.day);
    return {
    athlete_id: productAthleteId(),
    programme_version: 0,
    week_number: productionTrackAccessEnabled() ? 0 : null,
    session_date: session.date,
    day_key: session.day,
    title: session.title,
    kind: "assessment",
    test_id: session.testId,
    instructions: protocolForAthlete(session.testId ?? "easy_aerobic", intake.equipment),
    status: covered ? "completed" : "planned",
    active,
    payload: {
      purpose: session.summary,
      main: protocolForAthlete(session.testId ?? "easy_aerobic", intake.equipment),
      testId: session.testId,
      priority: "supporting",
      hard: session.stress === "high",
      lowerBody: false,
      modality: "erg",
      anchor: false,
      load: [],
    } satisfies SessionPayload,
    };
  });
  if (rows.length) {
    const { error } = await db.from("track_calendar_sessions").insert(rows);
    if (error) throw new Error(error.message);
  }
}

export async function completeAssessment(input: { sessionId: string; resultValue: string; rpe: number }) {
  const db = await ensureAthlete();
  const { data: session, error } = await db.from("track_calendar_sessions").select("*").eq("id", input.sessionId).single();
  if (error || !session) throw new Error(error?.message ?? "Session missing.");
  const testId = (session.payload as SessionPayload | null)?.testId ?? session.test_id;
  const intake = await readIntake();
  const clock = productClock(String(session.session_date).slice(0, 10), (intake as TrackIntake & { clock?: string }).clock);
  const sessionDate = String(session.session_date).slice(0, 10);
  const testedOn = sessionDate > clock ? clock : sessionDate;
  if (testId && testId !== "easy_aerobic") {
    const test = getTest(String(testId));
    await db.from("track_benchmark_results").insert({
      athlete_id: productAthleteId(),
      test_id: testId,
      result_value: input.resultValue,
      unit: test?.resultUnit ?? "result",
      tested_on: testedOn,
      source: "training_test",
      details: {},
    });
  }
  await db.from("track_session_feedback").insert({
    athlete_id: productAthleteId(),
    session_id: input.sessionId,
    completion: "completed",
    rpe: input.rpe,
    feel: "expected",
    pain: false,
    actuals: { result: input.resultValue },
  });
  await db.from("track_calendar_sessions").update({ status: "completed" }).eq("id", input.sessionId);
  await persistDerived(await readIntake(), await readResults());
}

export async function activateProgramme() {
  refuseProductionProgrammeWrite();
  const db = await ensureAthlete();
  const intake = await readIntake();
  const results = await readResults();
  const five = results.find((row) => row.testId === "run_5k");
  const race = results.find((row) => row.testId === "hyrox_race");
  let chosen: ReturnType<typeof generate12WeekProgramme>[number] | null = null;
  let draw = 0;
  for (draw = 1; draw <= 12; draw += 1) {
    const input = mapAssessmentToProgrammeInput({
      assessment: {
        first_name: "Alex",
        goal_focus: "Improve Hybrid / Hyrox Performance",
        event_type: "Hyrox Pro",
        event_date: intake.event.eventDate,
        target_time: "1:05:00",
        training_days_per_week: intake.availability.daysPerWeek,
        weekly_hours_band: "7-10",
        preferred_training_days: intake.availability.availableDays,
        double_session_days: null,
        recent_5k_time: five?.resultValue ?? null,
        max_heart_rate: 188,
        strength_experience: "advanced",
        hyrox_experience: "competitive",
        equipment: ["Full gym"],
        injury_flags: null,
        movements_to_avoid: null,
        biggest_limiter: "Running under fatigue after stations",
        notes: null,
        hyrox_pb: race?.resultValue ?? null,
        current_run_volume_band: "40-50km/week",
      },
      benchmarkTests: [],
      email: CANARY_EMAIL,
      profile: { full_name: CANARY_NAME },
    });
    const week = generate12WeekProgramme(input)[0];
    if (!week) continue;
    const sessions = week.plan_json.schedule.map((day) => toWeekSession(day));
    const proposal = resolveRemainingWeek({
      state: fatiguedState(),
      sessions,
      today: "Tue",
      product: "track",
    });
    const tuesday = week.plan_json.schedule.find((day) => day.day === "Tue");
    const saturday = week.plan_json.schedule.find((day) => day.day === "Sat");
    const sunday = week.plan_json.schedule.find((day) => day.day === "Sun");
    const anchored =
      tuesday?.tags?.[0] === "threshold_run" &&
      /hyrox|compromised|station/i.test(`${saturday?.title} ${saturday?.tags?.[0] ?? ""}`) &&
      (sunday?.tags?.[0] === "long_run" || /long/i.test(sunday?.title ?? ""));
    if (anchored && proposal.status === "proposed" && proposal.action === "REPLACE_WITH_EASY_BIKE") {
      chosen = week;
      break;
    }
    chosen = chosen ?? week;
  }
  if (!chosen) throw new Error("Programme did not generate.");
  await db.from("track_calendar_sessions").update({ active: false }).eq("athlete_id", productAthleteId()).eq("active", true);
  const rows = chosen.plan_json.schedule.map((day) => ({
    athlete_id: productAthleteId(),
    programme_version: 1,
    session_date: dateFor(day.day),
    day_key: day.day,
    title: day.title,
    kind: "training",
    status: "planned",
    active: true,
    instructions: day.session?.main ?? [],
    payload: payloadFromDay(day, 1),
  }));
  const { error } = await db.from("track_calendar_sessions").insert(rows);
  if (error) throw new Error(error.message);
  await db.from("track_programme_proposals").insert({
    athlete_id: productAthleteId(),
    readiness: "READY",
    proposal: { kind: "programme", weeks: 12, draw, weekTitle: chosen.title },
    published: false,
    status: "proposed",
    week_revision: 1,
    fingerprint: `programme-${draw}`,
  });
  const stored = await readIntake();
  stored.clock = "2026-11-13";
  await db.from("track_athlete_intake").update({ intake: stored, updated_at: new Date().toISOString() }).eq("athlete_id", productAthleteId());
}

function payloadFromDay(day: { day: DayKey; title: string; tags?: string[]; progression_family?: string; session?: { main?: string[]; notes?: string[] }; run_prescription?: { pace_range: string | null; rpe: string; effort_description: string; personalization_line: string | null } | null }, weekNumber: number): SessionPayload {
  const tag = day.tags?.[0] ?? "";
  const hard = ["threshold_run", "hybrid_compromised", "hybrid_density", "strength_lower", "interval_run"].includes(tag);
  return {
    weekNumber,
    purpose: day.run_prescription?.effort_description ?? day.session?.notes?.[0] ?? "",
    main: day.session?.main ?? [],
    notes: day.session?.notes ?? [],
    family: day.progression_family ?? null,
    pace: day.run_prescription?.pace_range ?? null,
    effort: day.run_prescription?.rpe ?? null,
    priority: tag === "threshold_run" || tag.startsWith("hybrid_") ? "key" : "supporting",
    stimulus: tag || "easy",
    hard,
    lowerBody: hard || tag === "long_run" || tag === "aerobic_run",
    modality: tag.startsWith("hybrid_") ? "hyrox" : /bike|aerobic_support/i.test(`${tag} ${day.title}`) ? "bike" : tag === "strength_lower" ? "strength" : "run",
    anchor: tag === "long_run" || tag.startsWith("hybrid_"),
    load: tag === "threshold_run" ? [{ metricId: "threshold_min", label: "Threshold", value: 25, unit: "min" }] : tag === "long_run" ? [{ metricId: "long_min", label: "Long run", value: 65, unit: "min" }] : [],
  };
}

function toWeekSession(day: { day: DayKey; title: string; tags?: string[] }, id = day.day): WeekSession {
  const payload = payloadFromDay(day, 1);
  return {
    id,
    day: day.day,
    title: day.title,
    priority: payload.priority ?? "supporting",
    stimulus: payload.stimulus ?? "easy",
    hard: Boolean(payload.hard),
    lowerBody: Boolean(payload.lowerBody),
    modality: payload.modality ?? "run",
    status: "planned",
    anchor: Boolean(payload.anchor),
    load: payload.load ?? [],
  };
}

function fatiguedState() {
  return interpretReadiness({
    athleteId: productAthleteId(),
    localDate: "2026-11-17",
    submissions: [
      ...["2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16"].map((date) => morning(date, 8, 8, 8, 2, 8)),
      morning("2026-11-17", 3, 3, 3, 8, 3),
    ],
  });
}

function morning(date: string, sleep: number, energy: number, recovery: number, soreness: number, trainingReadiness: number, pain = false): ReadinessSubmission {
  return {
    id: date,
    athleteId: productAthleteId(),
    localDate: date,
    timezone: "Europe/London",
    submittedAt: `${date}T07:00:00.000Z`,
    sleep,
    energy,
    recovery,
    soreness,
    trainingReadiness,
    pain,
    painArea: pain ? "knee" : null,
    painSeverity: pain ? 4 : null,
    painCourse: pain ? "worse" : null,
    painProvokes: pain ? "run" : null,
    painNote: null,
    painFreeModalities: [],
  };
}

export async function saveMorning(input: { sleep: number; energy: number; recovery: number; soreness: number; readiness: number; pain: boolean }) {
  const db = await ensureAthlete();
  const intake = await readIntake();
  const clock = productClock("2026-11-17", (intake as TrackIntake & { clock?: string }).clock);
  const row = morning(clock, input.sleep, input.energy, input.recovery, input.soreness, input.readiness, input.pain);
  const prior = await readMornings();
  const state = interpretReadiness({ athleteId: productAthleteId(), localDate: clock, submissions: [...prior, row] });
  await db.from("track_morning_readiness").insert({
    athlete_id: productAthleteId(),
    local_date: clock,
    answers: row,
    interpretation: state.interpretation,
  });
  if (input.pain) {
    await db.from("track_escalations").insert({
      athlete_id: productAthleteId(),
      kind: "PAIN_REVIEW",
      summary: "Athlete reported pain. The programme was not changed.",
    });
    return;
  }
  const active = await activeSessions();
  const proposal = resolveRemainingWeek({
    state,
    sessions: active.map(rowToSession),
    today: dayKey(clock),
    unavailableDays: intake.availability.unavailableDays,
    product: "track",
  });
  if (proposal.status !== "proposed") return;
  const revision = await activeRevision();
  const fingerprint = `${clock}:${proposal.action}:${revision}`;
  const { data: declined } = await db.from("track_adaptation_log").select("proposal").eq("athlete_id", productAthleteId()).eq("decision", "declined");
  if ((declined ?? []).some((row) => (row.proposal as { fingerprint?: string } | null)?.fingerprint === fingerprint)) return;
  await db.from("track_programme_proposals").insert({
    athlete_id: productAthleteId(),
    readiness: state.interpretation,
    proposal: { fingerprint, action: proposal.action, explanation: proposal.athleteExplanation, after: proposal.after, load: proposal.load },
    published: false,
    status: "proposed",
    week_revision: revision,
    fingerprint,
  });
}

export async function chooseOriginal() {
  refuseProductionProgrammeWrite();
  const db = await ensureAthlete();
  const proposal = await openProposal();
  if (!proposal) return;
  const revision = await activeRevision();
  const { error } = await db.rpc("track_decline_reflow", {
    payload: {
      athlete_id: productAthleteId(),
      proposal_id: proposal.id,
      expected_revision: revision,
      snapshot: { interpretation: proposal.readiness },
      policy_version: "track-loop-v1",
    },
  });
  if (error) throw new Error(error.message);
}

export async function chooseAccept() {
  refuseProductionProgrammeWrite();
  const db = await ensureAthlete();
  const proposal = await openProposal();
  if (!proposal) throw new Error("No current recommendation.");
  const active = await activeSessions();
  const before = active.map(rowToSession);
  const after = ((proposal.proposal as { after?: WeekSession[] }).after ?? before) as WeekSession[];
  const revision = await activeRevision();
  const operations = diffOps(before, after);
  const load = (proposal.proposal as { load?: Array<{ label: string; before: number; after: number }> }).load ?? [];
  const { error } = await db.rpc("track_accept_reflow", {
    payload: {
      athlete_id: productAthleteId(),
      proposal_id: proposal.id,
      expected_revision: revision,
      policy_version: "track-loop-v1",
      snapshot: { interpretation: proposal.readiness, product: "track" },
      workload_before: Object.fromEntries(load.map((item) => [item.label, item.before])),
      workload_after: Object.fromEntries(load.map((item) => [item.label, item.after])),
      reason_codes: ["recovery_below_baseline"],
      operations,
    },
  });
  if (error) throw new Error(error.message);
}

function diffOps(before: WeekSession[], after: WeekSession[]) {
  const afterIds = new Set(after.map((session) => session.id));
  const beforeById = new Map(before.map((session) => [session.id, session]));
  const ops: Array<Record<string, unknown>> = [];
  for (const session of before) {
    if (!afterIds.has(session.id)) ops.push({ op: "remove", session_id: session.id });
  }
  for (const session of after) {
    const prior = beforeById.get(session.id);
    if (!prior) continue;
    if (prior.day !== session.day) {
      ops.push({ op: "move", session_id: session.id, to_day: session.day, session_date: dateFor(session.day) });
    } else if (prior.title !== session.title) {
      ops.push({ op: "replace", session_id: session.id, title: session.title, payload: { load: session.load } });
    }
  }
  for (const session of after) {
    if (beforeById.has(session.id)) continue;
    ops.push({
      op: "insert",
      day_key: session.day,
      title: session.title,
      session_date: dateFor(session.day),
      payload: { priority: session.priority, hard: session.hard, lowerBody: session.lowerBody, modality: session.modality, anchor: session.anchor, load: session.load, main: ["40 min easy bike"] },
    });
  }
  return ops;
}

export async function completeTraining(input: { sessionId: string; completion: string; rpe: number; feel: string; pain: boolean; actuals: Record<string, string | number> }) {
  const db = await ensureAthlete();
  await db.from("track_session_feedback").insert({
    athlete_id: productAthleteId(),
    session_id: input.sessionId,
    completion: input.completion,
    rpe: input.rpe,
    feel: input.feel,
    pain: input.pain,
    actuals: input.actuals,
  });
  if (input.completion === "completed") {
    await db.from("track_calendar_sessions").update({ status: "completed" }).eq("id", input.sessionId).eq("athlete_id", productAthleteId());
  }
}

export async function saveCheckIn(answers: Record<string, string | number | boolean>) {
  const db = await ensureAthlete();
  const weekOf = productionTrackAccessEnabled() ? mondayOf(productClock(WEEK_START)) : WEEK_START;
  const { error } = await db.from("track_weekly_checkins").insert({
    athlete_id: productAthleteId(),
    week_of: weekOf,
    answers,
  });
  if (error) throw new Error(error.message);
}

export async function advanceClock() {
  refuseProductionProgrammeWrite();
  const db = await ensureAthlete();
  const intake = await readIntake();
  const clock = String((intake as TrackIntake & { clock?: string }).clock ?? "2026-11-13");
  const next = addDays(clock, 1);
  await db.from("track_athlete_intake").update({
    intake: { ...intake, clock: next },
    updated_at: new Date().toISOString(),
  }).eq("athlete_id", productAthleteId());
}

async function readIntake(): Promise<TrackIntake & { clock?: string }> {
  const db = productDb();
  const { data } = await db.from("track_athlete_intake").select("intake").eq("athlete_id", productAthleteId()).maybeSingle();
  return (data?.intake as TrackIntake & { clock?: string }) ?? blankIntake();
}

async function readResults(): Promise<BenchmarkResultInput[]> {
  const db = productDb();
  const { data } = await db.from("track_benchmark_results").select("*").eq("athlete_id", productAthleteId()).order("created_at");
  return resultsFromRows(data ?? []);
}

async function readMornings(): Promise<ReadinessSubmission[]> {
  const db = productDb();
  const { data } = await db.from("track_morning_readiness").select("answers").eq("athlete_id", productAthleteId()).order("created_at");
  return (data ?? []).map((row) => row.answers as ReadinessSubmission);
}

async function activeSessions() {
  const db = productDb();
  const { data } = await db.from("track_calendar_sessions").select("*").eq("athlete_id", productAthleteId()).eq("active", true).order("session_date");
  return data ?? [];
}

async function activeRevision(): Promise<number> {
  const rows = await activeSessions();
  return rows.reduce((max, row) => Math.max(max, Number(row.programme_version) || 0), 0);
}

function rowToSession(row: Record<string, unknown>): WeekSession {
  const payload = (row.payload as SessionPayload | null) ?? {};
  return {
    id: String(row.id),
    day: String(row.day_key) as WeekSession["day"],
    title: String(row.title),
    priority: payload.priority ?? "supporting",
    stimulus: payload.stimulus ?? "easy",
    hard: Boolean(payload.hard),
    lowerBody: Boolean(payload.lowerBody),
    modality: payload.modality ?? "run",
    status: row.status === "completed" || row.status === "started" ? row.status : "planned",
    anchor: Boolean(payload.anchor),
    load: payload.load ?? [],
  };
}

function dayKey(iso: string): WeekSession["day"] {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return DAYS[(day + 6) % 7]!;
}

async function openProposal() {
  const db = productDb();
  const { data } = await db
    .from("track_programme_proposals")
    .select("*")
    .eq("athlete_id", productAthleteId())
    .eq("status", "proposed")
    .order("created_at", { ascending: false })
    .limit(5);
  return (data ?? []).find((row) => {
    const proposal = row.proposal as { kind?: string; action?: string } | null;
    return Boolean(proposal?.action) && proposal?.kind !== "next_week" && proposal?.kind !== "programme";
  }) ?? null;
}

async function productionProgrammeView() {
  const { data, error } = await productDb()
    .from("track_calendar_sessions")
    .select("week_number, day_key, title, session_date, programme_key, active, week_state")
    .eq("athlete_id", productAthleteId())
    .eq("kind", "training");
  if (error) throw new Error(error.message);
  const rows = (data ?? []).filter((row) => row.week_state !== "superseded" && row.week_state !== "history");
  if (!rows.length) return null;
  const activeWeek = Number(rows.find((row) => row.active)?.week_number ?? 1);
  const nextRows = rows
    .filter((row) => Number(row.week_number) === activeWeek + 1)
    .sort((a, b) => String(a.session_date).localeCompare(String(b.session_date)));
  const thisThreshold = rows.find((row) => Number(row.week_number) === activeWeek && /threshold/i.test(String(row.title)));
  const nextThreshold = nextRows.find((row) => /threshold/i.test(String(row.title)));
  return {
    currentWeek: activeWeek,
    programmeWeeks: new Set(rows.map((row) => row.week_number)).size,
    blockNote: String(rows.find((row) => row.programme_key)?.programme_key ?? ""),
    nextTitles: nextRows.map((row) => ({ day: String(row.day_key), title: String(row.title) })),
    nextWeek: {
      decision: "KEEP",
      from: String(thisThreshold?.title ?? "This week"),
      to: String(nextThreshold?.title ?? "Next week"),
      minutesFrom: null,
      minutesTo: null,
      why: "Next week is already written. Applying a change is closed on this canary.",
      starts: String(nextRows[0]?.session_date ?? ""),
      accepted: false,
      canAccept: false,
      acceptLabel: null,
      keepLabel: null,
    },
  };
}

export async function loadCanary(): Promise<CanaryView> {
  await ensureAthlete();
  const intake = await readIntake();
  const results = await readResults();
  const clock = productClock("2026-11-17", (intake as TrackIntake & { clock?: string }).clock);
  const state = intake.goal ? evaluateTrackFoundation({ intake, results, asOf: clock }) : null;
  const sessions = await activeSessions();
  const training = sessions.filter((row) => row.kind === "training");
  const assessment = sessions.filter((row) => row.kind === "assessment");
  const openTests = assessment.filter((row) => {
    const payload = (row.payload as SessionPayload | null) ?? {};
    if ((payload.purpose ?? "").includes("Already covered")) return false;
    return row.status !== "completed" && row.test_id && row.test_id !== "easy_aerobic";
  });
  const phase = !intake.goal
    ? "onboard"
    : results.filter((row) => row.testId === "run_5k" || row.testId === "hyrox_race").length < 2
      ? "evidence"
      : training.length > 0
        ? "home"
        : assessment.length === 0
          ? "plan"
          : openTests.length > 0
            ? "assessment"
            : "ready";
  const known = (state?.requirements ?? []).filter((req) => req.status === "satisfied" && ["running", "hyrox"].includes(req.id)).map((req) => (req.id === "running" ? "5K" : "HYROX"));
  const needed = (state?.requirements ?? []).filter((req) => req.status === "test_required").map((req) => req.label);
  const productionHome = productionTrackAccessEnabled() && phase === "home" ? await productionProgrammeView() : null;
  const proposal = phase === "home" ? await openProposal() : null;
  const acceptedLog = await latestAccepted();
  const feedback = await readFeedback();
  const checkins = await readCheckins();
  const mornings = await readMornings();
  const today = dayKey(clock);
  const homeSource = training.length ? training : sessions;
  const beforeTitles = new Map<string, string>();
  const beforeWeek = (acceptedLog?.before_week as Array<{ day_key?: string; title?: string }> | null) ?? [];
  for (const row of beforeWeek) {
    if (row.day_key && row.title) beforeTitles.set(row.day_key, row.title);
  }
  const programme = phase === "home" && !productionTrackAccessEnabled()
    ? await prepareProgramme({
        intake,
        results,
        clock,
        feedback,
        checkins,
        logs: (await productDb().from("track_adaptation_log").select("*").eq("athlete_id", productAthleteId()).order("recorded_at")).data ?? [],
      })
    : null;
  const stationCards = state
    ? resolveStationDomains(buildEvidenceBook(results, clock), intake.equipment).map((domain) => ({
        label: domain.label,
        evidence: domain.evidence ? "YES" as const : "NO" as const,
        graph: domain.graph ? "YES" as const : "NO" as const,
        note: domain.reason,
      }))
    : [];
  const next = productionHome?.nextWeek ?? programme?.nextWeek ?? {
    decision: "KEEP",
    from: "Threshold",
    to: "Threshold",
    minutesFrom: null,
    minutesTo: null,
    why: "",
    starts: "",
    accepted: false,
    canAccept: false,
    acceptLabel: null,
    keepLabel: null,
  };
  return {
    name: productionTrackAccessEnabled() ? "Hybrid365 Track Canary" : CANARY_NAME,
    clock,
    phase,
    known,
    needed,
    readinessLabel: state?.profile.programmingReadiness ?? "NOT_READY",
    sessions: homeSource.map((row) => {
      const payload = (row.payload as SessionPayload | null) ?? {};
      return {
        id: String(row.id),
        day: String(row.day_key),
        date: String(row.session_date),
        title: String(row.title),
        status: String(row.status),
        kind: String(row.kind),
        summary: payload.purpose || String(row.title),
        blocks: payload.main ?? (Array.isArray(row.instructions) ? row.instructions.map(String) : []),
        pace: payload.pace ?? null,
        effort: payload.effort ?? null,
        family: payload.family ?? null,
        testId: payload.testId ?? (row.test_id ? String(row.test_id) : null),
      };
    }),
    homeDays: DAYS.map((day) => {
      const row = homeSource.find((item) => item.day_key === day);
      const title = row ? String(row.title) : "Rest";
      return { day, title, today: day === today, changed: Boolean(beforeTitles.get(day) && beforeTitles.get(day) !== title) };
    }),
    todayTitle: String(homeSource.find((row) => row.day_key === today)?.title ?? "Rest"),
    countdown: intake.event.eventDate ? `${intake.event.eventName ?? "Race"} in ${Math.round((Date.parse(intake.event.eventDate) - Date.parse(productionTrackAccessEnabled() ? clock : "2026-11-17")) / 86_400_000)} days` : "",
    recommendation: proposal
      ? {
          proposalId: String(proposal.id),
          why: "Your energy and recovery were lower than your recent normal, so today can change.",
          todayTitle: String(homeSource.find((row) => row.day_key === today)?.title ?? "Today"),
          recommended: proposalActionTitle(proposal.proposal),
          also: String((proposal.proposal as { explanation?: string }).explanation ?? ""),
          canChoose: !productionTrackAccessEnabled(),
        }
      : null,
    accepted: acceptedNote(acceptedLog, clock),
    workload: workloadCards(homeSource, feedback),
    performance: performanceCards(state),
    checkIn: checkins[0] ? { recovery: Number(checkins[0].answers.recovery ?? 0), motivation: Number(checkins[0].answers.motivation ?? 0) } : null,
    morning: savedMorningForDate(
      mornings.map((row) => ({
        localDate: row.localDate,
        sleep: Number(row.sleep ?? 0),
        energy: Number(row.energy ?? 0),
        recovery: Number(row.recovery ?? 0),
        soreness: Number(row.soreness ?? 0),
        readiness: Number(row.trainingReadiness ?? 0),
        pain: row.pain,
      })),
      clock
    ),
    nextWeek: next,
    impact: programme?.impact ?? [],
    stations: programme?.stations?.length ? programme.stations : stationCards,
    stationNeeded: programme?.stationNeeded ?? false,
    history: programme?.history ?? [],
    previousCompleted: programme?.previousCompleted ?? [],
    nextTitles: productionHome?.nextTitles ?? programme?.nextTitles ?? [],
    currentWeek: productionHome?.currentWeek ?? programme?.currentWeek ?? 1,
    programmeWeeks: productionHome?.programmeWeeks ?? programme?.programmeWeeks ?? 1,
    blockNote: productionHome?.blockNote ?? programme?.blockNote ?? null,
    wallBall: null,
    holds: (programme?.stations ?? []).filter((station) => station.graph === "NO").map((station) => station.label),
    painNote: await painCopy(),
    audit: await audit(),
    activationOpen: !productionTrackAccessEnabled(),
    evidenceChoices: productionTrackAccessEnabled()
      ? { fiveK: "20:48", fiveKDate: "2026-10-12", hyrox: "1:18:30", hyroxDate: "2026-09-27", hyroxLabel: "HYROX Manchester" }
      : { fiveK: "18:12", fiveKDate: "2026-11-05", hyrox: "1:04:40", hyroxDate: "2026-10-18", hyroxLabel: "HYROX London" },
  };
}

function acceptedNote(log: Record<string, unknown> | null, clock: string): CanaryView["accepted"] {
  if (!log || log.source === "next_week") return null;
  const fingerprint = ((log.proposal as { fingerprint?: string } | null)?.fingerprint) ?? "";
  const appliedOn = fingerprint.slice(0, 10);
  if (appliedOn !== clock) return null;
  const before = new Map((asWeek(log.before_week)).map((row) => [row.day, row.title]));
  const after = asWeek(log.after_week);
  const changes = after
    .filter((row) => before.get(row.day) && before.get(row.day) !== row.title)
    .map((row) => `${row.day}: ${shortTitle(row.title)}`);
  return {
    why: "Your energy and recovery were lower than your recent normal, so your hard session has moved one day.",
    changes: changes.length ? changes : after.slice(0, 3).map((row) => `${row.day}: ${shortTitle(row.title)}`),
  };
}

function asWeek(value: unknown): Array<{ day: string; title: string }> {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    const item = row as { day_key?: string; title?: string };
    return { day: String(item.day_key ?? ""), title: String(item.title ?? "") };
  }).filter((row) => row.day);
}

function shortTitle(title: string): string {
  if (/easy bike/i.test(title)) return "Easy bike";
  if (/threshold/i.test(title)) return "Threshold";
  if (/easy|z2 run|aerobic support/i.test(title)) return "Easy";
  return title;
}

function proposalActionTitle(proposal: unknown): string {
  const action = (proposal as { action?: string }).action;
  if (action === "REPLACE_WITH_EASY_BIKE") return "40 min easy bike";
  if (action === "REDUCE_TODAY_VOLUME") return "A shorter easy session";
  return "Keep the shape of the day";
}

function workloadCards(sessions: Array<Record<string, unknown>>, feedback: Array<Record<string, unknown>>) {
  const cards: Array<{ label: string; planned: string; completed: string | null }> = [];
  const threshold = sessions.find((row) => /threshold/i.test(String(row.title)));
  if (threshold) {
    const planned = minutesFromSession(String(threshold.title));
    const done = feedback.find((row) => row.session_id === threshold.id);
    const actual = (done?.actuals as { minutes?: number } | null)?.minutes;
    if (planned) cards.push({ label: "Threshold", planned, completed: actual != null ? `${actual} min` : done ? "Completed" : null });
  }
  const long = sessions.find((row) => /long/i.test(String(row.title)));
  const longMinutes = long ? String(long.title).match(/(\d+)\s*min/i) : null;
  if (long && longMinutes) cards.push({ label: "Long run", planned: `${longMinutes[1]} min`, completed: null });
  const hyrox = sessions.find((row) => /compromised|race-style/i.test(String(row.title)));
  if (hyrox) {
    const done = feedback.find((row) => row.session_id === hyrox.id);
    cards.push({ label: "HYROX session", planned: String(hyrox.title), completed: done ? String((done.actuals as { note?: string } | null)?.note ?? "Logged") : null });
  }
  const bike = sessions.find((row) => /bike/i.test(String(row.title)));
  const bikeMinutes = bike ? String(bike.title).match(/(\d+)\s*min/i) : null;
  if (bike && bikeMinutes) cards.push({ label: "Bike", planned: `${bikeMinutes[1]} min`, completed: null });
  return cards;
}

function minutesFromSession(title: string): string | null {
  const match = title.match(/(\d+)\s*[x×]\s*(\d+)\s*min/i);
  if (!match) return null;
  return `${Number(match[1]) * Number(match[2])} min`;
}

function performanceCards(state: ReturnType<typeof evaluateTrackFoundation> | null) {
  if (!state) return [];
  return [state.anchors.running.threshold, state.anchors.hyrox.anchor, state.anchors.ski, state.anchors.row, ...state.anchors.stations]
    .filter((anchor) => anchor?.display)
    .map((anchor) => ({
      label: anchor!.label,
      display: anchor!.display,
      provenance: anchor!.provenance?.statement ?? "",
    }));
}

async function readFeedback() {
  const db = productDb();
  const { data } = await db.from("track_session_feedback").select("*").eq("athlete_id", productAthleteId());
  return data ?? [];
}

async function readCheckins() {
  const db = productDb();
  const { data } = await db.from("track_weekly_checkins").select("answers, created_at").eq("athlete_id", productAthleteId()).order("created_at", { ascending: false });
  return (data ?? []) as Array<{ answers: Record<string, unknown>; created_at: string }>;
}

async function latestAccepted() {
  const db = productDb();
  const { data } = await db.from("track_adaptation_log").select("*").eq("athlete_id", productAthleteId()).eq("decision", "accepted").order("recorded_at", { ascending: false }).limit(1);
  return data?.[0] ?? null;
}

async function painCopy() {
  const db = productDb();
  const { data } = await db.from("track_escalations").select("id").eq("athlete_id", productAthleteId()).eq("kind", "PAIN_REVIEW").limit(1);
  return data?.[0] ? "You reported pain. Keep today's plan until a coach has seen it. This is not a diagnosis." : null;
}

async function audit() {
  const db = productDb();
  const [intake, evidence, sessions, mornings, proposals, feedback, checkins] = await Promise.all([
    db.from("track_athlete_intake").select("created_at").eq("athlete_id", productAthleteId()).maybeSingle(),
    db.from("track_benchmark_results").select("test_id, created_at").eq("athlete_id", productAthleteId()).order("created_at"),
    db.from("track_calendar_sessions").select("kind, created_at").eq("athlete_id", productAthleteId()).order("created_at").limit(1),
    db.from("track_morning_readiness").select("local_date, created_at").eq("athlete_id", productAthleteId()).order("created_at"),
    db.from("track_programme_proposals").select("status, created_at, proposal").eq("athlete_id", productAthleteId()).order("created_at"),
    db.from("track_session_feedback").select("created_at").eq("athlete_id", productAthleteId()).order("created_at"),
    db.from("track_weekly_checkins").select("created_at").eq("athlete_id", productAthleteId()).order("created_at"),
  ]);
  const rows: Array<{ label: string; at: string }> = [];
  if (intake.data?.created_at) rows.push({ label: "Onboarding saved", at: String(intake.data.created_at) });
  for (const row of evidence.data ?? []) rows.push({ label: `Evidence ${row.test_id}`, at: String(row.created_at) });
  if (sessions.data?.[0]) rows.push({ label: "Calendar started", at: String(sessions.data[0].created_at) });
  for (const row of mornings.data ?? []) rows.push({ label: `Morning ${row.local_date}`, at: String(row.created_at) });
  for (const row of proposals.data ?? []) {
    const kind = (row.proposal as { kind?: string } | null)?.kind;
    const label = kind === "programme" && row.status === "accepted" ? "Programme activated" : `Recommendation ${row.status}`;
    rows.push({ label, at: String(row.created_at) });
  }
  for (const row of feedback.data ?? []) rows.push({ label: "Session feedback", at: String(row.created_at) });
  for (const row of checkins.data ?? []) rows.push({ label: "Weekly check-in", at: String(row.created_at) });
  return rows;
}

export async function completeStationAssessment(input: {
  sessionId: string;
  wallBallReps: string;
  sledPushMetres: string;
  sledPullMetres: string;
  farmersMetres: string;
  bbjMetres: string;
  rpe: number;
}) {
  const db = await ensureAthlete();
  const { data: session, error } = await db.from("track_calendar_sessions").select("*").eq("id", input.sessionId).eq("athlete_id", productAthleteId()).single();
  if (error || !session) throw new Error(error?.message ?? "Session missing.");
  if (session.test_id !== "hyrox_station_battery") throw new Error("This session is not the station assessment.");
  const stored = await readIntake();
  const clock = productClock("2026-11-19", (stored as TrackIntake & { clock?: string }).clock);
  const protocol = "One station session. Rest between stations. Record the number. This is not a race.";
  const rows = [
    { test_id: "wall_ball", result_value: input.wallBallReps, unit: "reps" },
    { test_id: "sled_push", result_value: input.sledPushMetres, unit: "m" },
    { test_id: "sled_pull", result_value: input.sledPullMetres, unit: "m" },
    { test_id: "farmers", result_value: input.farmersMetres, unit: "m" },
    { test_id: "bbj", result_value: input.bbjMetres, unit: "m" },
  ];
  const { error: insertError } = await db.from("track_benchmark_results").insert(rows.map((row) => ({
    athlete_id: productAthleteId(),
    test_id: row.test_id,
    result_value: row.result_value.trim(),
    unit: row.unit,
    tested_on: clock,
    source: "training_test",
    notes: protocol,
    details: { protocol, quality: "measured" },
  })));
  if (insertError) throw new Error(insertError.message);
  await db.from("track_session_feedback").insert({
    athlete_id: productAthleteId(),
    session_id: input.sessionId,
    completion: "completed",
    rpe: input.rpe,
    feel: "expected",
    pain: false,
    actuals: { note: "station_battery" },
  });
  await db.from("track_calendar_sessions").update({ status: "completed" }).eq("id", input.sessionId).eq("athlete_id", productAthleteId());
  await persistDerived(await readIntake(), await readResults());
}

export async function acceptNextWeek(choice: "recommended" | "keep") {
  refuseProductionProgrammeWrite();
  return stagingAcceptNextWeek(choice);
}

export { saveStationBattery };

export async function loadAdmin() {
  const view = await loadCanary();
  const db = productDb();
  const [escalations, adaptations, profile, proposal] = await Promise.all([
    db.from("track_escalations").select("kind, summary, status").eq("athlete_id", productAthleteId()),
    db.from("track_adaptation_log").select("decision, before_revision, after_revision, policy_version").eq("athlete_id", productAthleteId()),
    db.from("track_performance_profiles").select("readiness").eq("athlete_id", productAthleteId()).maybeSingle(),
    db.from("track_programme_proposals").select("proposal, published, status").eq("athlete_id", productAthleteId()).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return {
    view,
    readiness: profile.data?.readiness ?? "NOT_READY",
    escalations: escalations.data ?? [],
    adaptations: adaptations.data ?? [],
    proposal: proposal.data ?? null,
  };
}
