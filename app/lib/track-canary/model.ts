import { addDays } from "@/app/lib/track-foundation/dates";
import { evaluateTrackFoundation } from "@/app/lib/track-foundation/pipeline";
import { getTest, protocolForAthlete } from "@/app/lib/track-foundation/testLibrary";
import type { BenchmarkResultInput, DayKey, TrackIntake } from "@/app/lib/track-foundation/types";
import { mapAssessmentToProgrammeInput } from "@/app/lib/mapAssessmentToProgrammeInput";
import { generate12WeekProgramme } from "@/app/lib/generate12WeekProgramme";
import { interpretReadiness } from "@/app/lib/daily-readiness/interpret";
import { resolveRemainingWeek } from "@/app/lib/daily-readiness/reflow";
import type { ReadinessSubmission, WeekSession } from "@/app/lib/daily-readiness/types";
import { getProgressionFamily } from "@/app/lib/progressionFamilies";
import { recommendNextWeek } from "@/app/lib/track-loop/progression";
import type { TrackAthleteRecord } from "@/app/lib/track-loop/store";
import { CANARY_ATHLETE_ID, CANARY_EMAIL, CANARY_NAME, canaryDb } from "./db";

const WEEK_START = "2026-11-16";
const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  nextWeek: { decision: string; from: string; to: string; why: string; write: "read-only" };
  wallBall: null | { from: string; to: string; why: string };
  holds: string[];
  painNote: string | null;
  audit: Array<{ label: string; at: string }>;
};

function dateFor(day: DayKey, start = WEEK_START): string {
  return addDays(start, DAYS.indexOf(day));
}

function blankIntake(): TrackIntake {
  return {
    athleteId: CANARY_ATHLETE_ID,
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
  const db = canaryDb();
  const { error } = await db.from("hyrox_athletes").upsert(
    {
      id: CANARY_ATHLETE_ID,
      name: CANARY_NAME,
      email: CANARY_EMAIL,
      status: "accepted",
      programme_status: "not_started",
      payment_status: "paid",
    },
    { onConflict: "id" }
  );
  if (error) throw new Error(error.message);
  await db.from("track_product_membership").upsert({ athlete_id: CANARY_ATHLETE_ID, status: "active" }, { onConflict: "athlete_id" });
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
  const db = canaryDb();
  const state = evaluateTrackFoundation({ intake, results, asOf: "2026-11-17" });
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
        athlete_id: CANARY_ATHLETE_ID,
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
    athlete_id: CANARY_ATHLETE_ID,
    readiness: state.profile.programmingReadiness,
    profile: { lines: state.profile.sections.flatMap((section) => section.known).slice(0, 12) },
    derived_at: new Date().toISOString(),
  });
  return state;
}

export async function saveOnboarding(intake: TrackIntake) {
  const db = await ensureAthlete();
  const stored = { ...intake, athleteId: CANARY_ATHLETE_ID, displayName: CANARY_NAME, clock: "2026-11-13" };
  const { error } = await db.from("track_athlete_intake").upsert(
    { athlete_id: CANARY_ATHLETE_ID, intake: stored, updated_at: new Date().toISOString() },
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
    athlete_id: CANARY_ATHLETE_ID,
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
  const state = evaluateTrackFoundation({ intake, results, asOf: "2026-11-09" });
  await db.from("track_assessment_plans").insert({
    athlete_id: CANARY_ATHLETE_ID,
    requirements: state.requirements,
    sessions: state.week.sessions,
  });
  const rows = state.week.sessions.map((session) => ({
    athlete_id: CANARY_ATHLETE_ID,
    programme_version: 0,
    session_date: session.date,
    day_key: session.day,
    title: session.title,
    kind: "assessment",
    test_id: session.testId,
    instructions: protocolForAthlete(session.testId ?? "easy_aerobic", intake.equipment),
    status: "planned",
    active: true,
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
  }));
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
  if (testId && testId !== "easy_aerobic") {
    const test = getTest(String(testId));
    await db.from("track_benchmark_results").insert({
      athlete_id: CANARY_ATHLETE_ID,
      test_id: testId,
      result_value: input.resultValue,
      unit: test?.resultUnit ?? "result",
      tested_on: session.session_date,
      source: "training_test",
      details: {},
    });
  }
  await db.from("track_session_feedback").insert({
    athlete_id: CANARY_ATHLETE_ID,
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
  await db.from("track_calendar_sessions").update({ active: false }).eq("athlete_id", CANARY_ATHLETE_ID).eq("active", true);
  const rows = chosen.plan_json.schedule.map((day) => ({
    athlete_id: CANARY_ATHLETE_ID,
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
    athlete_id: CANARY_ATHLETE_ID,
    readiness: "READY",
    proposal: { kind: "programme", weeks: 12, draw, weekTitle: chosen.title },
    published: false,
    status: "proposed",
    week_revision: 1,
    fingerprint: `programme-${draw}`,
  });
  const stored = await readIntake();
  stored.clock = "2026-11-13";
  await db.from("track_athlete_intake").update({ intake: stored, updated_at: new Date().toISOString() }).eq("athlete_id", CANARY_ATHLETE_ID);
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
    athleteId: CANARY_ATHLETE_ID,
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
    athleteId: CANARY_ATHLETE_ID,
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
  const clock = String((intake as TrackIntake & { clock?: string }).clock ?? "2026-11-17");
  const row = morning(clock, input.sleep, input.energy, input.recovery, input.soreness, input.readiness, input.pain);
  const prior = await readMornings();
  const state = interpretReadiness({ athleteId: CANARY_ATHLETE_ID, localDate: clock, submissions: [...prior, row] });
  await db.from("track_morning_readiness").insert({
    athlete_id: CANARY_ATHLETE_ID,
    local_date: clock,
    answers: row,
    interpretation: state.interpretation,
  });
  if (input.pain) {
    await db.from("track_escalations").insert({
      athlete_id: CANARY_ATHLETE_ID,
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
    product: "track",
  });
  if (proposal.status !== "proposed") return;
  const revision = await activeRevision();
  const fingerprint = `${clock}:${proposal.action}:${revision}`;
  const { data: declined } = await db.from("track_adaptation_log").select("proposal").eq("athlete_id", CANARY_ATHLETE_ID).eq("decision", "declined");
  if ((declined ?? []).some((row) => (row.proposal as { fingerprint?: string } | null)?.fingerprint === fingerprint)) return;
  await db.from("track_programme_proposals").insert({
    athlete_id: CANARY_ATHLETE_ID,
    readiness: state.interpretation,
    proposal: { fingerprint, action: proposal.action, explanation: proposal.athleteExplanation, after: proposal.after, load: proposal.load },
    published: false,
    status: "proposed",
    week_revision: revision,
    fingerprint,
  });
}

export async function chooseOriginal() {
  const db = await ensureAthlete();
  const proposal = await openProposal();
  if (!proposal) return;
  const revision = await activeRevision();
  const { error } = await db.rpc("track_decline_reflow", {
    payload: {
      athlete_id: CANARY_ATHLETE_ID,
      proposal_id: proposal.id,
      expected_revision: revision,
      snapshot: { interpretation: proposal.readiness },
      policy_version: "track-loop-v1",
    },
  });
  if (error) throw new Error(error.message);
}

export async function chooseAccept() {
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
      athlete_id: CANARY_ATHLETE_ID,
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
    athlete_id: CANARY_ATHLETE_ID,
    session_id: input.sessionId,
    completion: input.completion,
    rpe: input.rpe,
    feel: input.feel,
    pain: input.pain,
    actuals: input.actuals,
  });
  if (input.completion === "completed") {
    await db.from("track_calendar_sessions").update({ status: "completed" }).eq("id", input.sessionId);
  }
}

export async function saveCheckIn(answers: Record<string, string | number | boolean>) {
  const db = await ensureAthlete();
  const { error } = await db.from("track_weekly_checkins").insert({
    athlete_id: CANARY_ATHLETE_ID,
    week_of: WEEK_START,
    answers,
  });
  if (error) throw new Error(error.message);
}

export async function advanceClock() {
  const db = await ensureAthlete();
  const intake = await readIntake();
  const clock = String((intake as TrackIntake & { clock?: string }).clock ?? "2026-11-13");
  const next = addDays(clock, 1);
  await db.from("track_athlete_intake").update({
    intake: { ...intake, clock: next },
    updated_at: new Date().toISOString(),
  }).eq("athlete_id", CANARY_ATHLETE_ID);
}

async function readIntake(): Promise<TrackIntake & { clock?: string }> {
  const db = canaryDb();
  const { data } = await db.from("track_athlete_intake").select("intake").eq("athlete_id", CANARY_ATHLETE_ID).maybeSingle();
  return (data?.intake as TrackIntake & { clock?: string }) ?? blankIntake();
}

async function readResults(): Promise<BenchmarkResultInput[]> {
  const db = canaryDb();
  const { data } = await db.from("track_benchmark_results").select("*").eq("athlete_id", CANARY_ATHLETE_ID).order("created_at");
  return resultsFromRows(data ?? []);
}

async function readMornings(): Promise<ReadinessSubmission[]> {
  const db = canaryDb();
  const { data } = await db.from("track_morning_readiness").select("answers").eq("athlete_id", CANARY_ATHLETE_ID).order("created_at");
  return (data ?? []).map((row) => row.answers as ReadinessSubmission);
}

async function activeSessions() {
  const db = canaryDb();
  const { data } = await db.from("track_calendar_sessions").select("*").eq("athlete_id", CANARY_ATHLETE_ID).eq("active", true).order("session_date");
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
  const db = canaryDb();
  const { data } = await db
    .from("track_programme_proposals")
    .select("*")
    .eq("athlete_id", CANARY_ATHLETE_ID)
    .eq("status", "proposed")
    .order("created_at", { ascending: false })
    .limit(5);
  return (data ?? []).find((row) => (row.proposal as { kind?: string } | null)?.kind !== "programme") ?? null;
}

export async function loadCanary(): Promise<CanaryView> {
  await ensureAthlete();
  const intake = await readIntake();
  const results = await readResults();
  const state = intake.goal ? evaluateTrackFoundation({ intake, results, asOf: "2026-11-17" }) : null;
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
  const proposal = phase === "home" ? await openProposal() : null;
  const acceptedLog = await latestAccepted();
  const feedback = await readFeedback();
  const checkins = await readCheckins();
  const clock = String((intake as TrackIntake & { clock?: string }).clock ?? "2026-11-17");
  const today = dayKey(clock);
  const homeSource = training.length ? training : sessions;
  const beforeTitles = new Map<string, string>();
  const beforeWeek = (acceptedLog?.before_week as Array<{ day_key?: string; title?: string }> | null) ?? [];
  for (const row of beforeWeek) {
    if (row.day_key && row.title) beforeTitles.set(row.day_key, row.title);
  }
  const next = nextWeek(feedback, checkins);
  const wall = wallBallEdge(results);
  return {
    name: CANARY_NAME,
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
    countdown: intake.event.eventDate ? `${intake.event.eventName ?? "Race"} in ${Math.round((Date.parse(intake.event.eventDate) - Date.parse("2026-11-17")) / 86_400_000)} days` : "",
    recommendation: proposal
      ? {
          proposalId: String(proposal.id),
          why: "Your energy and recovery were lower than your recent normal, so today can change.",
          todayTitle: String(homeSource.find((row) => row.day_key === today)?.title ?? "Today"),
          recommended: proposalActionTitle(proposal.proposal),
          also: String((proposal.proposal as { explanation?: string }).explanation ?? ""),
          canChoose: true,
        }
      : null,
    accepted: acceptedNote(acceptedLog),
    workload: workloadCards(homeSource, feedback),
    performance: performanceCards(state),
    checkIn: checkins[0] ? { recovery: Number(checkins[0].answers.recovery ?? 0), motivation: Number(checkins[0].answers.motivation ?? 0) } : null,
    nextWeek: next,
    wallBall: wall,
    holds: ["Sled push", "Sled pull", "Lunges", "Burpee broad jump", "Farmers"],
    painNote: await painCopy(),
    audit: await audit(),
  };
}

function acceptedNote(log: Record<string, unknown> | null): CanaryView["accepted"] {
  if (!log) return null;
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
    const done = feedback.find((row) => row.session_id === threshold.id);
    const actual = (done?.actuals as { minutes?: number } | null)?.minutes;
    cards.push({ label: "Threshold", planned: "25 min", completed: actual != null ? `${actual} min` : done ? "Completed" : null });
  }
  const long = sessions.find((row) => /long/i.test(String(row.title)));
  if (long) cards.push({ label: "Long run", planned: "65 min", completed: null });
  const hyrox = sessions.find((row) => /compromised|hyrox/i.test(String(row.title)));
  if (hyrox) {
    const done = feedback.find((row) => row.session_id === hyrox.id);
    cards.push({ label: "HYROX session", planned: String(hyrox.title), completed: done ? String((done.actuals as { note?: string } | null)?.note ?? "Logged") : null });
  }
  const bike = sessions.find((row) => /bike/i.test(String(row.title)));
  if (bike) cards.push({ label: "Bike", planned: "40 min", completed: null });
  return cards;
}

function performanceCards(state: ReturnType<typeof evaluateTrackFoundation> | null) {
  if (!state) return [];
  return [state.anchors.running.threshold, state.anchors.hyrox.anchor, state.anchors.ski, state.anchors.row]
    .filter((anchor) => anchor?.display)
    .map((anchor) => ({
      label: anchor!.label,
      display: anchor!.display,
      provenance: anchor!.provenance?.statement ?? "",
    }));
}

function nextWeek(feedback: Array<Record<string, unknown>>, checkins: Array<{ answers: Record<string, unknown> }>) {
  const strong = feedback.filter((row) => {
    const actuals = row.actuals as { note?: string } | null;
    return row.completion === "completed" && Number(row.rpe) <= 8 && actuals?.note === "threshold";
  });
  const record = {
    athleteId: CANARY_ATHLETE_ID,
    product: "active",
    intake: blankIntake(),
    results: [],
    sessions: [],
    versions: [],
    feedback: [],
    checkIns: checkins.map((row) => ({
      id: "check",
      weekOf: WEEK_START,
      recovery: Number(row.answers.recovery ?? 7),
      motivation: Number(row.answers.motivation ?? 7),
      lifeStress: Number(row.answers.lifeStress ?? 3),
      manageable: Number(row.answers.manageable ?? 8),
      persistentSoreness: Boolean(row.answers.soreness),
      availabilityChanged: Boolean(row.answers.availability),
      travel: Boolean(row.answers.travel),
      eventChange: Boolean(row.answers.event),
      note: null,
    })),
    adaptations: [],
    escalations: [],
    priorFamilyCompletions: strong.map(() => ({ familyId: "threshold_volume_a", title: "5 x 5 min Threshold", rpe: 7, completion: "completed" as const })),
  } as unknown as TrackAthleteRecord;
  const decision = recommendNextWeek(record);
  const family = getProgressionFamily("threshold_volume_a");
  const current = family?.variants.find((item) => item.title === "5 x 5 min Threshold");
  const next = family?.variants.find((item) => item.block_week === (current?.block_week ?? 0) + 1);
  return {
    decision: decision.decision,
    from: current?.title ?? "Threshold",
    to: decision.decision === "PROGRESS" ? next?.title ?? current?.title ?? "Threshold" : current?.title ?? "Threshold",
    why: decision.explanation,
    write: "read-only" as const,
  };
}

function wallBallEdge(results: BenchmarkResultInput[]) {
  const wall = results.find((row) => row.testId === "wall_ball");
  if (!wall) return null;
  const family = getProgressionFamily("wall_ball_durability_a");
  return {
    from: family?.variants[0]?.title ?? "Wall balls",
    to: family?.variants[1]?.title ?? "Wall balls",
    why: "A measured wall-ball result can move one published step. This preview is not written into the week.",
  };
}

async function readFeedback() {
  const db = canaryDb();
  const { data } = await db.from("track_session_feedback").select("*").eq("athlete_id", CANARY_ATHLETE_ID);
  return data ?? [];
}

async function readCheckins() {
  const db = canaryDb();
  const { data } = await db.from("track_weekly_checkins").select("answers, created_at").eq("athlete_id", CANARY_ATHLETE_ID).order("created_at", { ascending: false });
  return (data ?? []) as Array<{ answers: Record<string, unknown>; created_at: string }>;
}

async function latestAccepted() {
  const db = canaryDb();
  const { data } = await db.from("track_adaptation_log").select("*").eq("athlete_id", CANARY_ATHLETE_ID).eq("decision", "accepted").order("recorded_at", { ascending: false }).limit(1);
  return data?.[0] ?? null;
}

async function painCopy() {
  const db = canaryDb();
  const { data } = await db.from("track_escalations").select("id").eq("athlete_id", CANARY_ATHLETE_ID).eq("kind", "PAIN_REVIEW").limit(1);
  return data?.[0] ? "You reported pain. Keep today's plan until a coach has seen it. This is not a diagnosis." : null;
}

async function audit() {
  const db = canaryDb();
  const [intake, evidence, sessions, mornings, proposals, feedback, checkins] = await Promise.all([
    db.from("track_athlete_intake").select("created_at").eq("athlete_id", CANARY_ATHLETE_ID).maybeSingle(),
    db.from("track_benchmark_results").select("test_id, created_at").eq("athlete_id", CANARY_ATHLETE_ID).order("created_at"),
    db.from("track_calendar_sessions").select("kind, created_at").eq("athlete_id", CANARY_ATHLETE_ID).order("created_at").limit(1),
    db.from("track_morning_readiness").select("local_date, created_at").eq("athlete_id", CANARY_ATHLETE_ID).order("created_at"),
    db.from("track_programme_proposals").select("status, created_at").eq("athlete_id", CANARY_ATHLETE_ID).order("created_at"),
    db.from("track_session_feedback").select("created_at").eq("athlete_id", CANARY_ATHLETE_ID).order("created_at"),
    db.from("track_weekly_checkins").select("created_at").eq("athlete_id", CANARY_ATHLETE_ID).order("created_at"),
  ]);
  const rows: Array<{ label: string; at: string }> = [];
  if (intake.data?.created_at) rows.push({ label: "Onboarding saved", at: String(intake.data.created_at) });
  for (const row of evidence.data ?? []) rows.push({ label: `Evidence ${row.test_id}`, at: String(row.created_at) });
  if (sessions.data?.[0]) rows.push({ label: "Calendar started", at: String(sessions.data[0].created_at) });
  for (const row of mornings.data ?? []) rows.push({ label: `Morning ${row.local_date}`, at: String(row.created_at) });
  for (const row of proposals.data ?? []) rows.push({ label: `Recommendation ${row.status}`, at: String(row.created_at) });
  for (const row of feedback.data ?? []) rows.push({ label: "Session feedback", at: String(row.created_at) });
  for (const row of checkins.data ?? []) rows.push({ label: "Weekly check-in", at: String(row.created_at) });
  return rows;
}

export async function loadAdmin() {
  const view = await loadCanary();
  const db = canaryDb();
  const [escalations, adaptations, profile] = await Promise.all([
    db.from("track_escalations").select("kind, summary, status").eq("athlete_id", CANARY_ATHLETE_ID),
    db.from("track_adaptation_log").select("decision, before_revision, after_revision, policy_version").eq("athlete_id", CANARY_ATHLETE_ID),
    db.from("track_performance_profiles").select("readiness").eq("athlete_id", CANARY_ATHLETE_ID).maybeSingle(),
  ]);
  return {
    view,
    readiness: profile.data?.readiness ?? "NOT_READY",
    escalations: escalations.data ?? [],
    adaptations: adaptations.data ?? [],
  };
}
