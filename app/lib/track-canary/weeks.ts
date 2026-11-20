import { addDays } from "@/app/lib/track-foundation/dates";
import { evaluateTrackFoundation } from "@/app/lib/track-foundation/pipeline";
import { resolveStationDomains } from "@/app/lib/track-foundation/stationEvidence";
import type { BenchmarkResultInput, DayKey, TrackIntake } from "@/app/lib/track-foundation/types";
import { mapAssessmentToProgrammeInput } from "@/app/lib/mapAssessmentToProgrammeInput";
import { generate12WeekProgramme } from "@/app/lib/generate12WeekProgramme";
import { getProgressionFamily } from "@/app/lib/progressionFamilies";
import { recommendNextWeek } from "@/app/lib/track-loop/progression";
import type { TrackAthleteRecord } from "@/app/lib/track-loop/store";
import {
  athleteWhy,
  composeNextWeek,
  nextBlockContract,
  publishedEdge,
  workloadDelta,
  type NextEdge,
  type TrackDecision,
  type WeekRow,
} from "@/app/lib/track-loop/nextWeekPlan";
import { CANARY_ATHLETE_ID, CANARY_EMAIL, CANARY_NAME, canaryDb } from "./db";

const WEEK_START = "2026-11-16";
const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PROGRAMME_KEY = `track-block-${CANARY_ATHLETE_ID}`;

export type NextWeekView = {
  decision: string;
  from: string;
  to: string;
  minutesFrom: string | null;
  minutesTo: string | null;
  why: string;
  starts: string;
  accepted: boolean;
  canAccept: boolean;
  acceptLabel: string | null;
  keepLabel: string | null;
};

export type ProgrammeSnapshot = {
  currentWeek: number;
  programmeWeeks: number;
  history: Array<{ day: string; summary: string }>;
  nextWeek: NextWeekView;
  impact: Array<{ label: string; current: string; next: string }>;
  stations: Array<{ label: string; evidence: "YES" | "NO"; graph: "YES" | "NO"; note: string }>;
  stationNeeded: boolean;
  previousCompleted: string[];
  nextTitles: Array<{ day: string; title: string }>;
  blockNote: string | null;
};

function minutesFromTitle(title: string | undefined): string | null {
  const match = title?.match(/(\d+)\s*[x×]\s*(\d+)\s*min/i);
  if (!match) return null;
  return `${Number(match[1]) * Number(match[2])} min`;
}

function dateFor(day: DayKey, start: string): string {
  return addDays(start, DAYS.indexOf(day));
}

function weekStart(weekNumber: number): string {
  return addDays(WEEK_START, (weekNumber - 1) * 7);
}

function emptyNext(): NextWeekView {
  return {
    decision: "KEEP",
    from: "Threshold",
    to: "Threshold",
    minutesFrom: null,
    minutesTo: null,
    why: "Next week is not ready yet.",
    starts: "",
    accepted: false,
    canAccept: false,
    acceptLabel: null,
    keepLabel: null,
  };
}

function programmeInput(intake: TrackIntake, results: BenchmarkResultInput[]) {
  const five = results.find((row) => row.testId === "run_5k");
  const race = results.find((row) => row.testId === "hyrox_race");
  return mapAssessmentToProgrammeInput({
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
}

function stageFor(familyId: string | null, title: string): number | null {
  if (!familyId) return null;
  const family = getProgressionFamily(familyId);
  return family?.variants.find((variant) => variant.title === title)?.block_week ?? null;
}

function payloadFor(
  day: {
    title: string;
    tags?: string[];
    progression_family?: string;
    progression_marker?: Record<string, unknown>;
    session?: { main?: string[]; notes?: string[] };
    run_prescription?: { pace_range: string | null; rpe: string; effort_description: string } | null;
  },
  weekNumber: number,
  blockNumber: number,
  weekRunKm: number | null
) {
  const family = day.progression_family ?? null;
  const tag = day.tags?.[0] ?? "";
  return {
    weekNumber,
    blockNumber,
    programmeKey: PROGRAMME_KEY,
    purpose: day.run_prescription?.effort_description ?? day.session?.notes?.[0] ?? "",
    main: day.session?.main ?? [],
    notes: day.session?.notes ?? [],
    family,
    stage: stageFor(family, day.title),
    marker: day.progression_marker ?? null,
    weekRunKm,
    pace: day.run_prescription?.pace_range ?? null,
    effort: day.run_prescription?.rpe ?? null,
    priority: tag === "threshold_run" || tag.startsWith("hybrid_") ? "key" : "supporting",
    stimulus: tag || "easy",
    hard: ["threshold_run", "hybrid_compromised", "hybrid_density", "strength_lower", "interval_run"].includes(tag),
    lowerBody: false,
    modality: tag.startsWith("hybrid_") ? "hyrox" : "run",
    anchor: tag === "long_run" || tag.startsWith("hybrid_"),
    load: [],
    race: "HYROX London Pro",
  };
}

function asRow(row: Record<string, unknown>): WeekRow {
  const instructions = Array.isArray(row.instructions) ? row.instructions.map(String) : [];
  return {
    day_key: String(row.day_key),
    session_date: String(row.session_date).slice(0, 10),
    title: String(row.title),
    kind: String(row.kind ?? "training"),
    instructions,
    payload: (row.payload as Record<string, unknown> | null) ?? {},
  };
}

async function materialise(intake: TrackIntake, results: BenchmarkResultInput[]) {
  const db = canaryDb();
  await db
    .from("track_calendar_sessions")
    .update({ week_number: 1, programme_key: PROGRAMME_KEY, week_state: "active" })
    .eq("athlete_id", CANARY_ATHLETE_ID)
    .eq("active", true)
    .eq("kind", "training")
    .is("week_number", null);
  await db
    .from("track_calendar_sessions")
    .update({ week_number: 1, programme_key: PROGRAMME_KEY, week_state: "history" })
    .eq("athlete_id", CANARY_ATHLETE_ID)
    .eq("active", false)
    .eq("kind", "training")
    .is("week_number", null);

  const { count } = await db
    .from("track_calendar_sessions")
    .select("id", { count: "exact", head: true })
    .eq("athlete_id", CANARY_ATHLETE_ID)
    .eq("week_number", 2);
  if ((count ?? 0) > 0) return;

  const programme = generate12WeekProgramme(programmeInput(intake, results));
  const rows = programme
    .filter((week) => week.week_number > 1)
    .flatMap((week) => {
      const volume = (week.plan_json as { run_volume_plan?: { targetKmMax?: number } }).run_volume_plan;
      const weekRunKm = typeof volume?.targetKmMax === "number" ? volume.targetKmMax : null;
      return week.plan_json.schedule.map((day) => ({
        athlete_id: CANARY_ATHLETE_ID,
        programme_version: 1,
        session_date: dateFor(day.day, weekStart(week.week_number)),
        day_key: day.day,
        title: day.title,
        kind: "training",
        status: "planned",
        active: false,
        instructions: day.session?.main ?? [],
        week_number: week.week_number,
        programme_key: PROGRAMME_KEY,
        week_state: "future",
        payload: payloadFor(day, week.week_number, week.block_number, weekRunKm),
      }));
    });
  const { error } = await db.from("track_calendar_sessions").insert(rows);
  if (error) throw new Error(error.message);
  await db.from("track_programme_proposals").insert({
    athlete_id: CANARY_ATHLETE_ID,
    readiness: "READY",
    proposal: {
      kind: "programme",
      weeks: 12,
      programmeKey: PROGRAMME_KEY,
      note: "Week 1 stayed as already accepted. Weeks 2–12 are the continuation from the same profile.",
    },
    published: false,
    status: "proposed",
    week_revision: 1,
    fingerprint: "programme-block-1",
  });
}

function labels(decision: TrackDecision): { acceptLabel: string | null; keepLabel: string | null } {
  if (decision === "DELOAD" || decision === "COACH_REQUIRED") return { acceptLabel: null, keepLabel: null };
  if (decision === "KEEP") return { acceptLabel: "Keep current progression", keepLabel: null };
  if (decision === "REPEAT") return { acceptLabel: "Repeat this week", keepLabel: "Keep the planned week" };
  if (decision === "REDUCE") return { acceptLabel: "Use the shorter week", keepLabel: "Keep the planned week" };
  return { acceptLabel: "Use next week", keepLabel: "Keep current progression" };
}

function dayName(iso: string): string {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return names[date.getUTCDay()] ?? iso.slice(0, 10);
}

function historyFrom(logs: Array<Record<string, unknown>>) {
  return logs.map((log) => {
    const proposal = (log.proposal as { fingerprint?: string; decision?: string } | null) ?? {};
    const fingerprint = proposal.fingerprint ?? "";
    const day = fingerprint.length >= 10 && fingerprint[4] === "-" ? dayName(fingerprint.slice(0, 10)) : dayName(String(log.recorded_at ?? log.accepted_at ?? ""));
    const action = fingerprint.split(":")[1] ?? "";
    if (log.source === "next_week" || proposal.decision) {
      return { day, summary: "Next week set" };
    }
    if (log.decision === "declined") return { day, summary: "Kept original plan" };
    if (action === "REPLACE_WITH_EASY_BIKE") return { day, summary: "Threshold moved due to low recovery" };
    return { day, summary: "Session adjusted" };
  });
}

export async function prepareProgramme(input: {
  intake: TrackIntake;
  results: BenchmarkResultInput[];
  clock: string;
  feedback: Array<Record<string, unknown>>;
  checkins: Array<{ answers: Record<string, unknown> }>;
  logs: Array<Record<string, unknown>>;
}): Promise<ProgrammeSnapshot> {
  const db = canaryDb();
  const { data: active } = await db
    .from("track_calendar_sessions")
    .select("*")
    .eq("athlete_id", CANARY_ATHLETE_ID)
    .eq("active", true)
    .eq("kind", "training");
  if (!active?.length) {
    return {
      currentWeek: 1,
      programmeWeeks: 1,
      history: [],
      nextWeek: emptyNext(),
      impact: [],
      stations: [],
      stationNeeded: false,
      previousCompleted: [],
      nextTitles: [],
      blockNote: null,
    };
  }

  await materialise(input.intake, input.results);
  await db.rpc("track_open_scheduled_week", { payload: { athlete_id: CANARY_ATHLETE_ID, as_of: input.clock } });

  const { data: currentRows } = await db
    .from("track_calendar_sessions")
    .select("*")
    .eq("athlete_id", CANARY_ATHLETE_ID)
    .eq("active", true)
    .eq("kind", "training")
    .order("session_date");
  const current = (currentRows ?? []).map((row) => asRow(row as Record<string, unknown>));
  const currentWeek = Number((currentRows?.[0] as { week_number?: number } | undefined)?.week_number ?? 1);
  const revision = (currentRows ?? []).reduce((max, row) => Math.max(max, Number((row as { programme_version?: number }).programme_version) || 0), 0);

  const { data: weekRows } = await db.from("track_calendar_sessions").select("week_number").eq("athlete_id", CANARY_ATHLETE_ID).eq("programme_key", PROGRAMME_KEY);
  const programmeWeeks = new Set((weekRows ?? []).map((row) => row.week_number)).size;

  const nextNumber = currentWeek + 1;
  const { data: scheduledRows } = await db
    .from("track_calendar_sessions")
    .select("*")
    .eq("athlete_id", CANARY_ATHLETE_ID)
    .eq("week_number", nextNumber)
    .eq("week_state", "scheduled")
    .order("session_date");
  const { data: futureRows } = await db
    .from("track_calendar_sessions")
    .select("*")
    .eq("athlete_id", CANARY_ATHLETE_ID)
    .eq("week_number", nextNumber)
    .eq("week_state", "future")
    .order("session_date");

  const state = evaluateTrackFoundation({ intake: input.intake, results: input.results, asOf: input.clock });
  const domains = resolveStationDomains(state.evidence, input.intake.equipment);
  const stations = domains.map((domain) => ({
    label: domain.label,
    evidence: domain.evidence ? ("YES" as const) : ("NO" as const),
    graph: domain.graph ? ("YES" as const) : ("NO" as const),
    note: domain.reason,
  }));
  const stationNeeded = domains.some((domain) => !domain.evidence);

  const { data: previousRows } = await db
    .from("track_calendar_sessions")
    .select("title, status")
    .eq("athlete_id", CANARY_ATHLETE_ID)
    .eq("week_number", currentWeek - 1)
    .eq("week_state", "history")
    .eq("status", "completed");
  const previousCompleted = (previousRows ?? []).map((row) => String(row.title));

  const block = nextBlockContract(currentWeek, domains.filter((domain) => !domain.evidence).map((domain) => domain.label));
  const history = historyFrom(input.logs);

  if (nextNumber > 12 || !(futureRows?.length || scheduledRows?.length)) {
    return {
      currentWeek,
      programmeWeeks,
      history,
      nextWeek: emptyNext(),
      impact: [],
      stations,
      stationNeeded,
      previousCompleted,
      nextTitles: [],
      blockNote: block.due ? block.proposal : null,
    };
  }

  if (scheduledRows?.length) {
    const scheduled = scheduledRows.map((row) => asRow(row as Record<string, unknown>));
    const threshold = scheduled.find((row) => /threshold/i.test(row.title));
    const currentThreshold = current.find((row) => /threshold/i.test(row.title));
    return {
      currentWeek,
      programmeWeeks: programmeWeeks || 12,
      history,
      nextWeek: {
        decision: "KEEP",
        from: currentThreshold?.title ?? "This week",
        to: threshold?.title ?? "Next week",
        minutesFrom: minutesFromTitle(currentThreshold?.title),
        minutesTo: minutesFromTitle(threshold?.title),
        why: "Next week is set. This week does not change until that Monday.",
        starts: scheduled[0]?.session_date ?? weekStart(nextNumber),
        accepted: true,
        canAccept: false,
        acceptLabel: null,
        keepLabel: null,
      },
      impact: workloadDelta(current, scheduled),
      stations,
      stationNeeded,
      previousCompleted,
      nextTitles: scheduled.map((row) => ({ day: row.day_key, title: row.title })),
      blockNote: block.due ? block.proposal : null,
    };
  }

  const source = (futureRows ?? []).map((row) => asRow(row as Record<string, unknown>));
  const sourceRevision = Number((futureRows?.[0] as { programme_version?: number } | undefined)?.programme_version ?? 1);
  const built = buildRecommendation({
    current,
    source,
    currentWeek,
    revision,
    sourceRevision,
    feedback: input.feedback,
    checkins: input.checkins,
    wallBallKnown: domains.some((domain) => domain.id === "wall_ball" && domain.evidence),
  });

  const { data: openRows } = await db
    .from("track_programme_proposals")
    .select("id, proposal, fingerprint")
    .eq("athlete_id", CANARY_ATHLETE_ID)
    .eq("status", "proposed")
    .order("created_at", { ascending: false });
  const existing = (openRows ?? []).find((row) => (row.proposal as { kind?: string } | null)?.kind === "next_week");
  if (!existing || existing.fingerprint !== built.fingerprint) {
    if (existing) {
      await db
        .from("track_programme_proposals")
        .update({
          proposal: built.proposal,
          fingerprint: built.fingerprint,
          week_revision: revision,
          readiness: "READY",
        })
        .eq("id", existing.id);
    } else {
      await db.from("track_programme_proposals").insert({
        athlete_id: CANARY_ATHLETE_ID,
        readiness: "READY",
        proposal: built.proposal,
        published: false,
        status: "proposed",
        week_revision: revision,
        fingerprint: built.fingerprint,
      });
    }
  }

  return {
    currentWeek,
    programmeWeeks: programmeWeeks || 12,
    history,
    nextWeek: built.view,
    impact: built.impact,
    stations,
    stationNeeded,
    previousCompleted,
    nextTitles: built.sessions.map((row) => ({ day: row.day_key, title: row.title })),
    blockNote: block.due ? block.proposal : null,
  };
}

function buildRecommendation(input: {
  current: WeekRow[];
  source: WeekRow[];
  currentWeek: number;
  revision: number;
  sourceRevision: number;
  feedback: Array<Record<string, unknown>>;
  checkins: Array<{ answers: Record<string, unknown> }>;
  wallBallKnown: boolean;
}) {
  const strong = input.feedback.filter((row) => {
    const actuals = row.actuals as { note?: string } | null;
    return row.completion === "completed" && Number(row.rpe) <= 8 && actuals?.note === "threshold";
  });
  const wallCompletions = input.feedback.filter((row) => {
    const actuals = row.actuals as { note?: string } | null;
    return row.completion === "completed" && Number(row.rpe) <= 8 && actuals?.note === "wall_ball";
  });
  const record = {
    athleteId: CANARY_ATHLETE_ID,
    product: "active",
    intake: {},
    results: [],
    sessions: [],
    versions: [],
    feedback: [],
    checkIns: input.checkins.map((row) => ({
      id: "check",
      weekOf: WEEK_START,
      recovery: Number(row.answers.recovery ?? 7),
      motivation: Number(row.answers.motivation ?? 7),
      lifeStress: Number(row.answers.lifeStress ?? 3),
      manageable: Number(row.answers.manageable ?? 8),
      persistentSoreness: Boolean(row.answers.soreness),
      availabilityChanged: false,
      travel: false,
      eventChange: false,
      note: null,
    })),
    adaptations: [],
    escalations: [],
    priorFamilyCompletions: strong.map(() => ({
      familyId: "threshold_volume_a",
      title: "5 x 5 min Threshold",
      rpe: 7,
      completion: "completed" as const,
    })),
  } as unknown as TrackAthleteRecord;

  let decision = recommendNextWeek(record).decision as TrackDecision;
  if (input.currentWeek % 4 === 0 || (input.currentWeek + 1) % 4 === 0) decision = "DELOAD";

  const edges: NextEdge[] = [];
  const currentThreshold = input.current.find((row) => row.payload.family === "threshold_volume_a" || /threshold/i.test(row.title));
  const earned = currentThreshold ? publishedEdge("threshold_volume_a", currentThreshold.title, "progress") : null;
  const sourceThreshold = input.source.find((row) => row.payload.family === "threshold_volume_a" || /threshold/i.test(row.title));
  let alreadyPlanned = false;
  if (decision === "PROGRESS" || decision === "REDUCE") {
    if (decision === "PROGRESS" && earned && sourceThreshold && sourceThreshold.title !== earned.to_title) {
      const edge = publishedEdge("threshold_volume_a", sourceThreshold.title, "progress");
      if (edge && edge.to_title === earned.to_title) edges.push(edge);
    }
    if (decision === "REDUCE" && sourceThreshold) {
      const edge = publishedEdge("threshold_volume_a", sourceThreshold.title, "reduce");
      if (edge) edges.push(edge);
    }
    const wall = input.source.find((row) => row.payload.family === "wall_ball_durability_a");
    if (input.wallBallKnown && wallCompletions.length >= 2 && wall && decision === "PROGRESS") {
      const wallEdge = publishedEdge("wall_ball_durability_a", wall.title, "progress");
      if (wallEdge) edges.push(wallEdge);
    }
    alreadyPlanned = decision === "PROGRESS" && edges.length === 0 && earned != null && sourceThreshold?.title === earned.to_title;
    if (edges.length === 0) decision = "KEEP";
  }

  const sessions =
    decision === "DELOAD" || decision === "COACH_REQUIRED"
      ? input.source
      : composeNextWeek({
          decision: decision as "KEEP" | "REPEAT" | "PROGRESS" | "REDUCE",
          source: input.source,
          current: input.current,
          edges,
        });
  const fingerprint = [
    decision,
    input.currentWeek + 1,
    input.revision,
    input.sourceRevision,
    strong.length,
    edges.map((edge) => `${edge.family_id}:${edge.from_block}>${edge.to_block}`).join(","),
  ].join("|");
  const thresholdNow = input.current.find((row) => /threshold/i.test(row.title));
  const thresholdNext = sessions.find((row) => /threshold/i.test(row.title));
  const minutes = (title: string | undefined) => {
    const match = title?.match(/(\d+)\s*[x×]\s*(\d+)\s*min/i);
    return match ? `${Number(match[1]) * Number(match[2])} min` : null;
  };
  const buttons = labels(decision);
  const view: NextWeekView = {
    decision,
    from: thresholdNow?.title ?? "This week",
    to: thresholdNext?.title ?? "Next week",
    minutesFrom: minutes(thresholdNow?.title),
    minutesTo: minutes(thresholdNext?.title),
    why: alreadyPlanned
      ? "Next week already has the next threshold session, so nothing further is added."
      : athleteWhy(decision, "threshold"),
    starts: sessions[0]?.session_date ?? weekStart(input.currentWeek + 1),
    accepted: false,
    canAccept: buttons.acceptLabel != null,
    acceptLabel: buttons.acceptLabel,
    keepLabel: buttons.keepLabel,
  };
  const proposal = {
    kind: "next_week",
    decision,
    week_number: input.currentWeek + 1,
    source_revision: input.sourceRevision,
    programme_key: PROGRAMME_KEY,
    edges,
    sessions,
    workload_before: workloadDelta(input.current, input.current),
    workload_after: workloadDelta(input.current, sessions),
    why: view.why,
  };
  return { proposal, fingerprint, view, sessions, impact: workloadDelta(input.current, sessions) };
}

export async function acceptNextWeek(choice: "recommended" | "keep") {
  const db = canaryDb();
  const intake = await readClock();
  const clock = intake.clock;
  const { data: proposalRows } = await db
    .from("track_programme_proposals")
    .select("*")
    .eq("athlete_id", CANARY_ATHLETE_ID)
    .eq("status", "proposed")
    .order("created_at", { ascending: false });
  const proposal = (proposalRows ?? []).find((row) => (row.proposal as { kind?: string } | null)?.kind === "next_week");
  if (!proposal) throw new Error("Next week is not ready.");
  const stored = proposal.proposal as { decision?: TrackDecision };
  let target = proposal;
  if (choice === "keep" && stored.decision && stored.decision !== "KEEP") {
    const keep: Record<string, unknown> = {
      ...(proposal.proposal as Record<string, unknown>),
      decision: "KEEP",
      edges: [],
    };
    const { data: future } = await db
      .from("track_calendar_sessions")
      .select("*")
      .eq("athlete_id", CANARY_ATHLETE_ID)
      .eq("week_number", (proposal.proposal as { week_number?: number }).week_number ?? 0)
      .eq("week_state", "future");
    keep.sessions = (future ?? []).map((row) => asRow(row as Record<string, unknown>));
    const fingerprint = `${proposal.fingerprint}|keep`;
    const { data: inserted, error } = await db
      .from("track_programme_proposals")
      .insert({
        athlete_id: CANARY_ATHLETE_ID,
        readiness: "READY",
        proposal: keep,
        published: false,
        status: "proposed",
        week_revision: proposal.week_revision,
        fingerprint,
      })
      .select("*")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "Could not keep the planned week.");
    target = inserted;
  }
  const { data: active } = await db
    .from("track_calendar_sessions")
    .select("week_number, programme_version")
    .eq("athlete_id", CANARY_ATHLETE_ID)
    .eq("active", true)
    .eq("kind", "training");
  const expectedWeek = Number(active?.[0]?.week_number ?? 0);
  const expectedRevision = (active ?? []).reduce((max, row) => Math.max(max, Number(row.programme_version) || 0), 0);
  const { error } = await db.rpc("track_accept_next_week", {
    payload: {
      athlete_id: CANARY_ATHLETE_ID,
      proposal_id: target.id,
      expected_revision: expectedRevision,
      expected_week: expectedWeek,
      fingerprint: target.fingerprint,
      as_of: clock,
    },
  });
  if (error) throw new Error(error.message);
  if (target.id !== proposal.id) {
    await db.from("track_programme_proposals").update({ status: "declined" }).eq("id", proposal.id);
  }
}

export async function saveStationBattery(input: {
  wallBallReps: string;
  sledPushMetres: string;
  sledPullMetres: string;
  farmersMetres: string;
  bbjMetres: string;
}) {
  const db = canaryDb();
  const intake = await readClock();
  const protocol = "One station session. Rest between stations. Record the number. This is not a race.";
  const rows = [
    { test_id: "wall_ball", result_value: input.wallBallReps, unit: "reps", details: { protocol, quality: "measured", reps: Number(input.wallBallReps) } },
    { test_id: "sled_push", result_value: input.sledPushMetres, unit: "m", details: { protocol, quality: "measured", metres: Number(input.sledPushMetres) } },
    { test_id: "sled_pull", result_value: input.sledPullMetres, unit: "m", details: { protocol, quality: "measured", metres: Number(input.sledPullMetres) } },
    { test_id: "farmers", result_value: input.farmersMetres, unit: "m", details: { protocol, quality: "measured", metres: Number(input.farmersMetres) } },
    { test_id: "bbj", result_value: input.bbjMetres, unit: "m", details: { protocol, quality: "measured", metres: Number(input.bbjMetres) } },
  ].filter((row) => row.result_value.trim());
  const { error } = await db.from("track_benchmark_results").insert(
    rows.map((row) => ({
      athlete_id: CANARY_ATHLETE_ID,
      test_id: row.test_id,
      result_value: row.result_value.trim(),
      unit: row.unit,
      tested_on: intake.clock,
      source: "training_test",
      notes: protocol,
      details: row.details,
    }))
  );
  if (error) throw new Error(error.message);
  const { data } = await db.from("track_benchmark_results").select("*").eq("athlete_id", CANARY_ATHLETE_ID);
  const { data: intakeRow } = await db.from("track_athlete_intake").select("intake").eq("athlete_id", CANARY_ATHLETE_ID).single();
  const full = (intakeRow?.intake as TrackIntake | null) ?? intake.intake;
  const results: BenchmarkResultInput[] = (data ?? []).map((row) => ({
    id: String(row.id),
    testId: String(row.test_id),
    resultValue: String(row.result_value),
    unit: String(row.unit),
    date: String(row.tested_on),
    source: row.source as BenchmarkResultInput["source"],
    notes: row.notes,
    details: row.details as BenchmarkResultInput["details"],
  }));
  const state = evaluateTrackFoundation({ intake: full, results, asOf: intake.clock });
  for (const anchor of state.anchors.stations) {
    await db.from("track_training_anchors").upsert(
      {
        athlete_id: CANARY_ATHLETE_ID,
        anchor_key: anchor.key,
        status: anchor.status,
        display_value: anchor.display,
        provenance: anchor.provenance ?? {},
        derived_at: new Date().toISOString(),
      },
      { onConflict: "athlete_id,anchor_key" }
    );
  }
}

async function readClock(): Promise<{ clock: string; intake: TrackIntake }> {
  const db = canaryDb();
  const { data } = await db.from("track_athlete_intake").select("intake").eq("athlete_id", CANARY_ATHLETE_ID).single();
  const intake = (data?.intake as (TrackIntake & { clock?: string }) | null) ?? ({ clock: "2026-11-19" } as TrackIntake & { clock?: string });
  return { clock: String(intake.clock ?? "2026-11-19"), intake };
}

export { PROGRAMME_KEY };
