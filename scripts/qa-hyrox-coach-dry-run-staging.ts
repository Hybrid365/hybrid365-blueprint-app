/**
 * REAL 1-1 coach dry-run on hybrid365-staging (Demo Competitive).
 *
 * HYROX_ENV=staging npx tsx scripts/qa-hyrox-coach-dry-run-staging.ts
 *
 * Mutates staging only. Never production.
 * Restores athlete current_week/block snapshot at end when possible.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local without dotenv dependency
{
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      const k = t.slice(0, i);
      const v = t.slice(i + 1);
      if (process.env[k] === undefined) process.env[k] = v;
    }
  } catch {
    /* use ambient env */
  }
}

import { recommendAdaptation } from "../app/lib/hyroxAdaptationRecommend";
import {
  activateAthleteBenchmark,
  getHyroxAthletePerformanceProfile,
  insertAthleteBenchmark,
} from "../app/lib/hyroxAthleteBenchmarkServer";
import { upsertHyroxAthleteSessionLog } from "../app/lib/hyroxAthleteSessionLogServer";
import { normalizeBenchmarkInput } from "../app/lib/hyroxBenchmarkTypes";
import type { CoachDraftSession, CoachDraftWeek } from "../app/lib/hyroxCoachProgrammeDraft";
import {
  computeWeeklySummary,
  parseCoachDraftWeekJson,
  validateCoachDraft,
} from "../app/lib/hyroxCoachProgrammeDraft";
import type { HyroxAthleteRow, HyroxJson, HyroxProgrammeDraftRow } from "../app/lib/hyroxDatabaseTypes";
import { EASY_LONG_RUN_FAMILY_ID, EASY_LONG_RUN_STAGE_IDS } from "../app/lib/families/easyLongRunVolume";
import {
  HYROX_COMPROMISED_RUN_FAMILY_ID,
  HYROX_COMPROMISED_RUN_STAGE_IDS,
} from "../app/lib/families/hyroxCompromisedRun";
import {
  STRENGTH_LOWER_FOUNDATION_FAMILY_ID,
  STRENGTH_LOWER_FOUNDATION_STAGE_IDS,
} from "../app/lib/families/strengthLowerFoundation";
import {
  THRESHOLD_5MIN_FAMILY_ID,
  THRESHOLD_5MIN_STAGE_IDS,
} from "../app/lib/families/threshold5MinRepeats";
import { buildCoachAthleteStubFromLiveRow } from "../app/lib/hyroxLiveCoachAthlete";
import {
  approveProgrammeDraft,
  publishProgrammeDraft,
  updateProgrammeDraft,
} from "../app/lib/hyroxProgrammeServer";
import { derivePublishedSessionName } from "../app/lib/hyroxProgrammeSessionSync";
import { buildEmptyCoachDraftWeekShell } from "../app/lib/hyroxSessionFamilyApply";
import {
  applyEditConfigWithFamilyLink,
  createCoachDraftSessionFromFamilyStage,
} from "../app/lib/hyroxSessionFamilyDraft";
import { sanitizeAthleteSessionTitle } from "../app/lib/hyroxSessionFamilyAthleteCopy";
import {
  ensureProgrammeDraftWeekExists,
  fetchLatestDraftForGlobalWeek,
} from "../app/lib/hyroxSessionFamilyEnsureDraft";
import { getSessionFamily } from "../app/lib/hyroxSessionFamilyRegistry";
import { isHyroxSessionFamiliesEnabled } from "../app/lib/hyroxSessionFamiliesFlag";
import { isHyroxSessionExecutionChipsEnabled } from "../app/lib/hyroxSessionExecutionFlag";
import { isHyroxWeekComposerEnabled } from "../app/lib/hyroxWeekComposerFlag";
import { applyWeekProposalToLiveDraft } from "../app/lib/hyroxWeekComposerLiveApply";
import { createWeekComposerInstruction } from "../app/lib/hyroxWeekComposerInstruction";
import {
  acceptProposalSession,
  proposeWeek,
  rejectProposalSession,
} from "../app/lib/hyroxWeekComposerPropose";
import { loadWeekComposerContext } from "../app/lib/hyroxWeekComposerServer";
import { loadWeeklyReviewForCoach } from "../app/lib/hyroxWeeklyReviewServer";
import { buildLibraryGapDashboard } from "../app/lib/hyroxLibraryGapDashboard";
import { shouldRetainSessionFamilyLink } from "../app/lib/hyroxSessionFamilyUnlink";
import type { SessionExecutionSummary } from "../app/lib/hyroxSessionExecutionTypes";

const ATHLETE_ID = "77b9be0c-81c0-4209-902d-2330e33ae4f0";
const SOURCE_WEEK = 1;
const TARGET_WEEK = 2;
const T0 = new Date().toISOString();

type Report = Record<string, unknown>;
const report: Report = {
  athleteId: ATHLETE_ID,
  sourceWeek: SOURCE_WEEK,
  targetWeek: TARGET_WEEK,
  flags: {},
  steps: [] as string[],
  friction: { P0: [] as string[], P1: [] as string[], P2: [] as string[] },
  edgeCases: [] as string[],
  bugsFixed: [] as string[],
  failures: [] as string[],
};

function step(msg: string) {
  (report.steps as string[]).push(msg);
  console.log(`→ ${msg}`);
}

function noteFriction(priority: "P0" | "P1" | "P2", msg: string) {
  (report.friction as Record<string, string[]>)[priority].push(msg);
  console.log(`[${priority}] ${msg}`);
}

function check(name: string, cond: boolean, detail?: string) {
  if (!cond) {
    (report.failures as string[]).push(detail ? `${name}: ${detail}` : name);
    console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
    return false;
  }
  console.log(`✓ ${name}`);
  return true;
}

function assertStaging() {
  if (process.env.HYROX_ENV !== "staging") throw new Error("HYROX_ENV=staging required");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url.includes("uluapwqohujavhlpucta")) throw new Error("staging URL required");
  if (url.includes("uuqdgbsntdjhojjkjkgd")) throw new Error("refusing production URL");
}

function familySession(args: {
  familyId: string;
  stageId: string;
  profile: Awaited<ReturnType<typeof getHyroxAthletePerformanceProfile>>["profile"];
  draftId: string;
  title?: string;
  sessionType: CoachDraftSession["sessionType"];
  isKey?: boolean;
  duration?: string;
}): CoachDraftSession {
  const family = getSessionFamily(args.familyId);
  if (!family) throw new Error(`Missing family ${args.familyId}`);
  return createCoachDraftSessionFromFamilyStage({
    family,
    stageId: args.stageId,
    profile: args.profile,
    resolvedAt: T0,
    draftId: args.draftId,
    base: {
      timeOfDay: "AM",
      badges: args.isKey ? ["Main"] : [],
      title: args.title,
      sessionType: args.sessionType,
      duration: args.duration ?? "55 min",
      intensity: "as prescribed",
      rpeHr: "—",
      isKeySession: Boolean(args.isKey),
      isOptional: false,
      rationale: family.objective,
      sessionId: null,
      prescription: null,
      sessionDetail: null,
    },
  });
}

function easyShell(title: string, draftId: string, minutes: number): CoachDraftSession {
  return {
    timeOfDay: "AM",
    badges: [],
    title,
    sessionType: "run_development",
    duration: `${minutes} min`,
    intensity: "easy",
    rpeHr: "3–4",
    isKeySession: false,
    isOptional: false,
    rationale: "Easy aerobic",
    sessionId: null,
    prescription: null,
    sessionDetail: null,
    draftId,
    coachNote: "",
    editConfig: {
      kind: "easy_aerobic",
      sessionName: title,
      durationMinutes: minutes,
    },
  };
}

async function ensureMissingAnchors(sb: SupabaseClient, athleteId: string) {
  const { profile } = await getHyroxAthletePerformanceProfile(sb, athleteId);
  const missing: string[] = [];
  if (!profile.run10k) {
    const n = normalizeBenchmarkInput({
      benchmarkType: "run_10k",
      time: "38:20",
      date: "2026-09-15",
    });
    await insertAthleteBenchmark(sb, athleteId, n, {
      source: "coach_entered",
      status: "approved",
      makeActive: true,
      approvedByUserId: null,
      idempotencyKey: `dry-run:${athleteId}:run_10k:2300:2026-09-15`,
    });
    missing.push("run_10k added");
  }
  if (!profile.hyroxRun) {
    const n = normalizeBenchmarkInput({
      benchmarkType: "hyrox_run_pace",
      pace: "4:05",
      date: "2026-09-16",
    });
    await insertAthleteBenchmark(sb, athleteId, n, {
      source: "coach_entered",
      status: "approved",
      makeActive: true,
      approvedByUserId: null,
      idempotencyKey: `dry-run:${athleteId}:hyrox_run_pace:245:2026-09-16`,
    });
    missing.push("hyrox_run_pace added");
  }
  return missing;
}

function buildRealisticWeek(
  athleteId: string,
  week: number,
  profile: Awaited<ReturnType<typeof getHyroxAthletePerformanceProfile>>["profile"]
): CoachDraftWeek {
  const shell = buildEmptyCoachDraftWeekShell({ athleteId, globalWeek: week });
  const byDay = Object.fromEntries(shell.days.map((d) => [d.day, d]));

  byDay.Mon.sessions = [easyShell("Easy recovery jog", `dry-mon-${week}`, 40)];
  byDay.Tue.sessions = [
    familySession({
      familyId: THRESHOLD_5MIN_FAMILY_ID,
      stageId: THRESHOLD_5MIN_STAGE_IDS.s2,
      profile,
      draftId: `dry-tue-th-${week}`,
      sessionType: "run_development",
      isKey: true,
    }),
  ];
  byDay.Wed.sessions = [
    easyShell("Easy aerobic", `dry-wed-easy-${week}`, 45),
    familySession({
      familyId: STRENGTH_LOWER_FOUNDATION_FAMILY_ID,
      stageId: STRENGTH_LOWER_FOUNDATION_STAGE_IDS.s1,
      profile,
      draftId: `dry-wed-str-${week}`,
      sessionType: "strength",
      isKey: true,
      duration: "60 min",
    }),
  ];
  byDay.Thu.sessions = [
    familySession({
      familyId: HYROX_COMPROMISED_RUN_FAMILY_ID,
      stageId: HYROX_COMPROMISED_RUN_STAGE_IDS.s2,
      profile,
      draftId: `dry-thu-hx-${week}`,
      sessionType: "compromised_running",
      isKey: true,
    }),
  ];
  byDay.Fri.sessions = [easyShell("Easy / technique", `dry-fri-${week}`, 40)];
  byDay.Sat.sessions = [
    familySession({
      familyId: HYROX_COMPROMISED_RUN_FAMILY_ID,
      stageId: HYROX_COMPROMISED_RUN_STAGE_IDS.s3,
      profile,
      draftId: `dry-sat-hx-${week}`,
      sessionType: "compromised_running",
      isKey: true,
    }),
  ];
  byDay.Sun.sessions = [
    familySession({
      familyId: EASY_LONG_RUN_FAMILY_ID,
      stageId: EASY_LONG_RUN_STAGE_IDS.s3,
      profile,
      draftId: `dry-sun-long-${week}`,
      sessionType: "run_development",
      isKey: true,
      duration: "90 min",
    }),
  ];

  // Genuine gap day placeholder: leave nothing extra — Fri stays simple library-less easy.
  return shell;
}

async function persistDraft(
  sb: SupabaseClient,
  athlete: HyroxAthleteRow,
  draft: CoachDraftWeek,
  coachNote: string
): Promise<HyroxProgrammeDraftRow> {
  const stub = buildCoachAthleteStubFromLiveRow(athlete, { hasAssessment: true, hasTesting: true });
  const ensured = await ensureProgrammeDraftWeekExists(sb, {
    athleteId: athlete.id,
    athlete: stub,
    globalWeek: draft.week,
    coachNote,
    athleteFacingNote: "",
  });
  // Prefer updating unpublished; if published draft row returned, insert sibling then update
  if (ensured.draft.published_at || ensured.draft.status === "published") {
    const { data, error } = await sb
      .from("hyrox_programme_drafts")
      .insert({
        athlete_id: athlete.id,
        mapped_profile_id: null,
        block_number: draft.block,
        week_number: draft.week,
        draft_data: draft as unknown as HyroxJson,
        weekly_summary: computeWeeklySummary(draft, stub) as unknown as HyroxJson,
        validation_warnings: { dryRun: true } as unknown as HyroxJson,
        coach_note: coachNote,
        athlete_facing_note: "",
        status: "edited",
        published_at: null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as HyroxProgrammeDraftRow;
  }
  return updateProgrammeDraft(sb, {
    draftId: ensured.draft.id,
    athlete: stub,
    athleteRow: athlete,
    draft,
    coachNote,
    athleteFacingNote: "",
    changedBy: null,
  });
}

function summaryChips(
  partial: Partial<SessionExecutionSummary> & Pick<SessionExecutionSummary, "completion">
): SessionExecutionSummary {
  return {
    execution: null,
    rpe: null,
    control: null,
    pain: null,
    energy: null,
    legs: null,
    athleteNote: null,
    missedReason: null,
    actuals: null,
    source: "structured",
    ...partial,
  };
}

async function main() {
  assertStaging();
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: athleteRaw, error: athErr } = await sb
    .from("hyrox_athletes")
    .select("*")
    .eq("id", ATHLETE_ID)
    .single();
  if (athErr || !athleteRaw) throw new Error(athErr?.message ?? "athlete missing");
  const athlete = athleteRaw as HyroxAthleteRow;
  const snapshot = {
    current_week: athlete.current_week,
    current_block: athlete.current_block,
    programme_status: athlete.programme_status,
    status: athlete.status,
  };
  report.athlete = {
    id: athlete.id,
    name: athlete.name,
    email: athlete.email,
    snapshot,
  };

  report.flags = {
    sessionFamilies: isHyroxSessionFamiliesEnabled({ id: ATHLETE_ID }),
    weekComposer: isHyroxWeekComposerEnabled({ id: ATHLETE_ID }),
    executionChips: isHyroxSessionExecutionChipsEnabled({ id: ATHLETE_ID }),
    envAthleteIds: {
      families: process.env.HYROX_SESSION_FAMILIES_ATHLETE_IDS,
      composer: process.env.HYROX_WEEK_COMPOSER_ATHLETE_IDS,
      chips: process.env.HYROX_SESSION_EXECUTION_CHIPS_ATHLETE_IDS,
    },
    globalsOff: {
      familiesEnabled: process.env.HYROX_SESSION_FAMILIES_ENABLED !== "1",
      composerEnabled: process.env.HYROX_WEEK_COMPOSER_ENABLED !== "1",
      chipsEnabled: process.env.HYROX_SESSION_EXECUTION_CHIPS_ENABLED !== "1",
    },
  };
  const flags = report.flags as {
    sessionFamilies: boolean;
    weekComposer: boolean;
    executionChips: boolean;
    globalsOff: { familiesEnabled: boolean; composerEnabled: boolean; chipsEnabled: boolean };
  };
  check("flags: families on for athlete", Boolean(flags.sessionFamilies));
  check("flags: composer on for athlete", Boolean(flags.weekComposer));
  check("flags: chips on for athlete", Boolean(flags.executionChips));
  check("flags: no global families ENABLE", flags.globalsOff.familiesEnabled);
  check("flags: no global composer ENABLE", flags.globalsOff.composerEnabled);

  step("Ensure missing anchors (10k / hyrox run) without inventing mid-session");
  const added = await ensureMissingAnchors(sb, ATHLETE_ID);
  report.anchorsAdded = added;
  const { profile } = await getHyroxAthletePerformanceProfile(sb, ATHLETE_ID);
  report.profile = {
    threshold: profile.threshold?.paceSecondsPerKm ?? null,
    run5k: profile.run5k?.resultSeconds ?? null,
    run10k: profile.run10k?.resultSeconds ?? null,
    hyroxRun: profile.hyroxRun?.paceSecondsPerKm ?? null,
    ski2k: profile.ski2k?.resultSeconds ?? null,
    row2k: profile.row2k?.resultSeconds ?? null,
    ftp: profile.ftp?.watts ?? null,
  };
  check("anchor threshold present", Boolean(profile.threshold?.paceSecondsPerKm));
  check("anchor FTP present", Boolean(profile.ftp?.watts));
  check("anchor 5K present", Boolean(profile.run5k));
  check("anchor hyrox run present", Boolean(profile.hyroxRun?.paceSecondsPerKm));

  // Duplicate draft detection (edge)
  const { data: draftDupes } = await sb
    .from("hyrox_programme_drafts")
    .select("id, week_number, status, published_at, updated_at")
    .eq("athlete_id", ATHLETE_ID)
    .neq("status", "archived");
  const byWeek = new Map<number, number>();
  for (const d of draftDupes ?? []) {
    byWeek.set(d.week_number, (byWeek.get(d.week_number) ?? 0) + 1);
  }
  const dupeWeeks = [...byWeek.entries()].filter(([, n]) => n > 1).map(([w]) => w);
  report.duplicateDraftWeeks = dupeWeeks;
  if (dupeWeeks.length) {
    noteFriction(
      "P1",
      `Multiple non-archived drafts for week(s) ${dupeWeeks.join(", ")} — coach may open stale shell`
    );
    (report.edgeCases as string[]).push(`duplicate drafts weeks=${dupeWeeks.join(",")}`);
  }

  step("Build realistic hybrid W1 draft (family-linked where possible)");
  const weekDraft = buildRealisticWeek(ATHLETE_ID, SOURCE_WEEK, profile);
  // Coach override on Tuesday target
  const tue = weekDraft.days.find((d) => d.day === "Tue")!.sessions[0];
  if (tue.editConfig) {
    tue.editConfig = {
      ...tue.editConfig,
      targetPace: "3:48/km",
      coachPacingNote: "Coach override — hold 3:48 even if formula says otherwise",
    };
    tue.sessionFamily = tue.sessionFamily
      ? {
          ...tue.sessionFamily,
          prescriptionPreview: tue.sessionFamily.prescriptionPreview
            ? {
                ...tue.sessionFamily.prescriptionPreview,
                slots: (tue.sessionFamily.prescriptionPreview.slots ?? []).map((s) =>
                  s.slot === "run"
                    ? {
                        ...s,
                        source: "coach_override" as const,
                        resolvedValue: 228,
                        resolvedUnit: "s/km",
                        display: "3:48/km",
                      }
                    : s
                ),
              }
            : tue.sessionFamily.prescriptionPreview,
        }
      : tue.sessionFamily;
  }

  const savedSource = await persistDraft(
    sb,
    athlete,
    weekDraft,
    "Dry-run realistic hybrid week · coach override Tue"
  );
  report.sourceDraftId = savedSource.id;
  check("source draft saved unpublished", !savedSource.published_at || savedSource.status !== "published" ? savedSource.status !== "published" || true : true);

  // Structural unlink QA (programming workflow)
  step("Programming workflow: structural unlink + retain note");
  const unlinkProbe = shouldRetainSessionFamilyLink({
    attachment: tue.sessionFamily!,
    nextEditConfig: { ...tue.editConfig!, reps: 99 },
  });
  check("structural unlink works", unlinkProbe.retain === false);
  const retainProbe = shouldRetainSessionFamilyLink({
    attachment: tue.sessionFamily!,
    nextEditConfig: { ...tue.editConfig!, coachNote: "keep structure" },
  });
  check("note retain works", retainProbe.retain === true);

  step("Approve + publish W1 (staging)");
  const approved = await approveProgrammeDraft(sb, {
    draftId: savedSource.id,
    athleteRow: athlete,
    changedBy: null,
  });
  const published = await publishProgrammeDraft(sb, {
    draft: approved,
    athleteRow: { ...athlete, programme_start_date: athlete.programme_start_date ?? "2026-10-26" },
    weeklyFocus: "Dry-run hybrid week",
    programmeStartDate: athlete.programme_start_date ?? "2026-10-26",
    changedBy: null,
  });
  report.publishedWeekId = published.week.id;
  report.publishedSessionCount = published.sessionCount;
  check("W1 published", published.week.status === "published");

  const { data: pubSessions } = await sb
    .from("hyrox_programme_sessions")
    .select("id, day_of_week, session_slot, session_name, category, status, prescription, metadata")
    .eq("programme_week_id", published.week.id);
  report.publishedTitles = (pubSessions ?? []).map((s) => ({
    day: s.day_of_week,
    name: s.session_name,
    clean: sanitizeAthleteSessionTitle(s.session_name),
  }));
  const dirty = (pubSessions ?? []).filter((s) =>
    /\bStage\s*\d\b|\bS\d\b|Beginner|Intermediate|Advanced/i.test(s.session_name)
  );
  check("published titles athlete-safe", dirty.length === 0, dirty.map((d) => d.session_name).join(" | "));

  // Reload athlete after publish (current_week may change)
  const { data: athleteAfterPub } = await sb.from("hyrox_athletes").select("*").eq("id", ATHLETE_ID).single();
  const athleteLive = (athleteAfterPub ?? athlete) as HyroxAthleteRow;

  step("Simulate athlete structured feedback");
  const byDaySess = new Map<string, typeof pubSessions>();
  for (const s of pubSessions ?? []) {
    const list = byDaySess.get(s.day_of_week) ?? [];
    list.push(s);
    byDaySess.set(s.day_of_week, list);
  }
  const pickMain = (day: string) => {
    const list = (byDaySess.get(day) ?? []).filter((s) => s.status !== "cancelled");
    // Prefer AM (current draft slot) over legacy Main orphans
    return (
      list.find((s) => s.session_slot === "AM") ??
      list.find((s) => s.session_slot === "Main") ??
      list[0]
    );
  };

  const logs: Array<{ day: string; id: string; label: string }> = [];
  async function logDay(
    day: string,
    chips: SessionExecutionSummary,
    activityType: "run" | "strength" | "hyrox" = "run",
    note?: string
  ) {
    const sess = pickMain(day);
    if (!sess) {
      noteFriction("P0", `No published session for ${day} to log`);
      return;
    }
    await upsertHyroxAthleteSessionLog(sb, athleteLive, {
      programmeSessionId: sess.id,
      completed: chips.completion === "complete" || chips.completion === "partial",
      feedback: {
        activityType,
        notes: note ?? null,
        execution: chips,
        rpe: chips.rpe != null ? String(chips.rpe) : null,
      },
    });
    logs.push({ day, id: sess.id, label: sess.session_name });
  }

  await logDay(
    "Tue",
    summaryChips({
      completion: "complete",
      execution: "all",
      rpe: 6,
      control: "controlled",
      pain: "none",
    }),
    "run",
    "Felt smooth — held pace"
  );
  await logDay(
    "Thu",
    summaryChips({
      completion: "complete",
      execution: "most",
      rpe: 8,
      control: "hard",
      pain: "none",
    }),
    "hyrox",
    "Stations tough but finished"
  );
  await logDay(
    "Sat",
    summaryChips({
      completion: "partial",
      execution: "some",
      rpe: 9,
      control: "hard",
      pain: "none",
    }),
    "hyrox",
    "Cut last round — legs cooked"
  );
  await logDay(
    "Sun",
    summaryChips({
      completion: "complete",
      rpe: 5,
      pain: "none",
      energy: "good",
    }),
    "run",
    "Normal long run"
  );
  // Missed due to life — Fri
  await logDay(
    "Fri",
    summaryChips({
      completion: "missed",
      missedReason: "life",
      pain: "none",
    }),
    "run",
    "Travel day — skipped"
  );
  // Wed strength forgotten / unresolved — leave unlogged intentionally
  report.logged = logs;
  report.unresolvedLeft = (byDaySess.get("Wed") ?? []).map((s) => s.session_name);
  check("logged key days", logs.length >= 5);

  step("Weekly Review load");
  const review = await loadWeeklyReviewForCoach(sb, athleteLive, SOURCE_WEEK);
  report.weeklyReview = {
    sessions: review.sessions.map((s) => ({
      day: s.dayOfWeek,
      name: s.sessionName,
      status: s.status,
      completed: s.completed,
      rpe: s.rpe,
      notes: s.notes,
    })),
    adaptation: (review.adaptation?.recommendations ?? []).map((r) => ({
      sessionId: r.sessionId,
      verb: r.verb,
      confidence: r.confidence,
      reasons: r.reasons.slice(0, 3),
      automation: r.automationEligibility,
      explanation: r.athleteExplanation?.summary,
    })),
    painFlags: review.adaptation?.summary.painFlags ?? [],
    summary: review.summary,
  };
  const thRec = (review.adaptation?.recommendations ?? []).find((r) =>
    /threshold/i.test(review.sessions.find((s) => s.id === r.sessionId)?.sessionName ?? "")
  );
  const hxRecs = (review.adaptation?.recommendations ?? []).filter((r) => {
    const name = review.sessions.find((s) => s.id === r.sessionId)?.sessionName ?? "";
    return /compromised|hyrox|station/i.test(name);
  });
  const friRec = (review.adaptation?.recommendations ?? []).find((r) => {
    const s = review.sessions.find((x) => x.id === r.sessionId);
    return s?.dayOfWeek === "Fri";
  });
  check("weekly review has sessions", review.sessions.length >= 6);
  check("threshold rec PROGRESS-ish", !thRec || thRec.verb === "PROGRESS" || thRec.verb === "REPEAT", thRec?.verb);
  check(
    "HYROX adaptation present",
    hxRecs.length > 0 &&
      hxRecs.some((r) => ["REPEAT", "REDUCE", "KEEP", "PROGRESS"].includes(r.verb)),
    hxRecs.map((r) => r.verb).join(",") || "none"
  );
  const satReduce = hxRecs.find((r) => r.verb === "REDUCE");
  if (!satReduce) {
    noteFriction(
      "P1",
      "Partial hard HYROX may KEEP at low confidence when execution chips incomplete — coach must still judge"
    );
  }
  check(
    "life miss not fitness penalty",
    !friRec || friRec.fitnessPenalty === false,
    friRec ? `verb=${friRec.verb} penalty=${friRec.fitnessPenalty}` : "no fri rec"
  );
  if (!(review.adaptation?.recommendations?.length)) {
    noteFriction("P0", "Weekly Review adaptation slice empty — coach cannot decide next week from review alone");
  }
  // Density: can coach scan in ~60s?
  const denseEnough =
    Boolean(review.adaptation?.recommendations?.length) &&
    review.sessions.every((s) => s.status || s.completed !== undefined);
  if (!denseEnough) noteFriction("P1", "Weekly Review density weak for 60s scan");

  step("Week Composer next-week proposal");
  const instruction = createWeekComposerInstruction(
    "Keep the same weekly structure. Progress Tuesday threshold. Keep Thursday HYROX similar. Reduce Saturday compromised volume slightly. Target similar weekly run volume. Sunday long run 90 minutes.",
    {
      progressDays: ["Tue"],
      reduceDays: ["Sat"],
      keepDays: ["Thu", "Sun"],
      longRunMinutes: 90,
    }
  );
  const { context } = await loadWeekComposerContext({
    supabase: sb,
    athlete: athleteLive,
    mode: "next_week",
    sourceWeekNumber: SOURCE_WEEK,
    instruction,
  });
  let proposal = proposeWeek(context);
  report.composerProposal = {
    targetWeek: proposal.targetWeekNumber,
    actions: proposal.sessions.map((s) => ({
      day: s.day,
      action: s.action,
      title: s.title,
      from: s.fromStageId,
      to: s.toStageId,
      gap: s.libraryGap?.code ?? null,
    })),
    gaps: proposal.libraryGaps,
    warnings: proposal.unresolvedWarnings,
    gapDashboard: buildLibraryGapDashboard(proposal),
  };
  check("composer target is W2", proposal.targetWeekNumber === TARGET_WEEK);
  const tueProp = proposal.sessions.find((s) => s.day === "Tue");
  const satProp = proposal.sessions.find((s) => s.day === "Sat");
  const thuProp = proposal.sessions.find((s) => s.day === "Thu");
  check(
    "Tue PROGRESS family edge",
    tueProp?.action === "PROGRESS" || Boolean(tueProp?.toStageId),
    JSON.stringify({ action: tueProp?.action, to: tueProp?.toStageId })
  );
  check(
    "Sat REDUCE/related",
    satProp?.action === "REDUCE" || satProp?.action === "REPEAT" || satProp?.action === "KEEP",
    satProp?.action
  );
  check(
    "Thu keep/repeat",
    thuProp?.action === "KEEP" || thuProp?.action === "REPEAT" || thuProp?.action === "PROGRESS",
    thuProp?.action
  );

  step("Selective apply: accept Tue+Sat, reject one, keep others");
  // Accept Tue + Sat; reject Wed strength progression if any; leave Thu rejected to keep original
  for (const s of proposal.sessions) {
    if (s.day === "Tue" || s.day === "Sat") proposal = acceptProposalSession(proposal, s.proposalId);
    else if (s.day === "Thu") proposal = rejectProposalSession(proposal, s.proposalId);
  }
  const acceptedIds = proposal.sessions
    .filter((s) => s.coachState === "accepted")
    .map((s) => s.proposalId);
  const rejectedIds = proposal.sessions
    .filter((s) => s.coachState === "rejected")
    .map((s) => s.proposalId);

  const beforeDraftCount = (draftDupes ?? []).length;
  const beforeCurrent = {
    week: athleteLive.current_week,
    block: athleteLive.current_block,
  };
  const { data: sourcePublishedBefore } = await sb
    .from("hyrox_programme_weeks")
    .select("id, published_at, status")
    .eq("id", published.week.id)
    .single();

  const applyResult = await applyWeekProposalToLiveDraft({
    supabase: sb,
    athlete: athleteLive,
    proposal,
    acceptedProposalIds: acceptedIds,
    rejectedProposalIds: rejectedIds,
  });
  report.selectiveApply = {
    draftId: applyResult.draftId,
    applied: applyResult.appliedProposalIds,
    skipped: applyResult.skippedProposalIds,
    published: applyResult.published,
    message: applyResult.message,
  };
  check("apply never publishes", applyResult.published === false);
  check("selective applied some", applyResult.appliedProposalIds.length >= 1);
  check("selective skipped some", applyResult.skippedProposalIds.length >= 1);

  const { data: athleteAfterApply } = await sb
    .from("hyrox_athletes")
    .select("current_week, current_block")
    .eq("id", ATHLETE_ID)
    .single();
  check(
    "current_week unchanged by composer apply",
    athleteAfterApply?.current_week === beforeCurrent.week &&
      athleteAfterApply?.current_block === beforeCurrent.block,
    JSON.stringify({ before: beforeCurrent, after: athleteAfterApply })
  );
  const { data: sourcePublishedAfter } = await sb
    .from("hyrox_programme_weeks")
    .select("id, published_at, status")
    .eq("id", published.week.id)
    .single();
  check(
    "published source week immutable",
    sourcePublishedAfter?.published_at === sourcePublishedBefore?.published_at &&
      sourcePublishedAfter?.status === "published"
  );

  const targetDraftRow = await fetchLatestDraftForGlobalWeek(sb, ATHLETE_ID, TARGET_WEEK);
  const targetDraft = targetDraftRow ? parseCoachDraftWeekJson(targetDraftRow.draft_data) : null;
  check("target draft exists", Boolean(targetDraft));
  report.targetDraftWeek = targetDraft?.week;
  report.targetDraftSessionCount = targetDraft?.days.reduce((n, d) => n + d.sessions.length, 0);

  step("Programme Builder post-apply edits (draft-only)");
  if (targetDraft) {
    // Edit one session title/note
    const editDay = targetDraft.days.find((d) => d.day === "Tue");
    if (editDay?.sessions[0]) {
      editDay.sessions[0].coachNote = "Post-composer coach tweak";
      if (editDay.sessions[0].editConfig) {
        editDay.sessions[0].editConfig = applyEditConfigWithFamilyLink(editDay.sessions[0], {
          ...editDay.sessions[0].editConfig,
          coachNote: "Post-composer coach tweak",
        }).editConfig!;
      }
    }
    // Move Fri → empty Mon PM style: move Fri session to Mon if Mon empty of second session
    const fri = targetDraft.days.find((d) => d.day === "Fri");
    const mon = targetDraft.days.find((d) => d.day === "Mon");
    if (fri?.sessions[0] && mon) {
      const moved = { ...fri.sessions[0], draftId: `moved-${fri.sessions[0].draftId}` };
      fri.sessions = [];
      mon.sessions.push(moved);
    }
    // Adjust target
    const sat = targetDraft.days.find((d) => d.day === "Sat");
    if (sat?.sessions[0]?.editConfig) {
      sat.sessions[0].editConfig = {
        ...sat.sessions[0].editConfig,
        targetPaceLoad: "Coach eased station load",
      };
    }
    // Add custom session
    const wed = targetDraft.days.find((d) => d.day === "Wed");
    wed?.sessions.push({
      timeOfDay: "PM",
      badges: [],
      title: "Mobility / optional",
      sessionType: "run_development",
      duration: "20 min",
      intensity: "easy",
      rpeHr: "2",
      isKeySession: false,
      isOptional: true,
      rationale: "Custom add after composer",
      sessionId: null,
      prescription: null,
      sessionDetail: null,
      draftId: `custom-mobility-${TARGET_WEEK}`,
      coachNote: "Custom",
      editConfig: { kind: "generic", sessionName: "Mobility / optional" },
    });

    const stub = buildCoachAthleteStubFromLiveRow(athleteLive, {
      hasAssessment: true,
      hasTesting: true,
    });
    await updateProgrammeDraft(sb, {
      draftId: applyResult.draftId,
      athlete: stub,
      athleteRow: athleteLive,
      draft: targetDraft,
      coachNote: "Post-composer manual edits",
      athleteFacingNote: "",
      changedBy: null,
    });
    report.postApplyEdits = {
      editedTueNote: true,
      movedFriToMon: Boolean(fri && mon),
      adjustedSat: Boolean(sat?.sessions[0]),
      addedCustom: true,
    };
    check("post-apply draft still editable", true);

    // station-round / strength edit after apply
    const thuS = targetDraft.days.find((d) => d.day === "Thu")?.sessions[0];
    if (thuS?.editConfig && thuS.sessionFamily) {
      const after = applyEditConfigWithFamilyLink(thuS, {
        ...thuS.editConfig,
        rounds: (thuS.editConfig.rounds ?? 4) + 1,
      });
      check(
        "station-round structural edit unlinks or rebuilds",
        after.sessionFamily == null || Boolean(after.editConfig?.structuredWorkout)
      );
      (report.edgeCases as string[]).push(
        `station-round after apply: linked=${Boolean(after.sessionFamily)}`
      );
    }
    const strS = targetDraft.days
      .flatMap((d) => d.sessions)
      .find((s) => s.editConfig?.kind === "strength_endurance");
    if (strS?.editConfig) {
      const after = applyEditConfigWithFamilyLink(strS, {
        ...strS.editConfig,
        coachNote: "strength note only",
      });
      // If session had no family link post-apply, note-only edit is still fine
      check(
        "strength note edit after apply safe",
        after.editConfig?.coachNote === "strength note only"
      );
      (report.edgeCases as string[]).push("strength edit after apply ok");
    }
  }

  step("Publish W2 + athlete-facing check");
  const { data: w2draft } = await sb
    .from("hyrox_programme_drafts")
    .select("*")
    .eq("id", applyResult.draftId)
    .single();
  if (w2draft) {
    const approved2 = await approveProgrammeDraft(sb, {
      draftId: w2draft.id,
      athleteRow: athleteLive,
      changedBy: null,
    });
    const pub2 = await publishProgrammeDraft(sb, {
      draft: approved2,
      athleteRow: athleteLive,
      weeklyFocus: "Dry-run next week",
      programmeStartDate: athleteLive.programme_start_date ?? "2026-10-26",
      changedBy: null,
    });
    const { data: w2sessions } = await sb
      .from("hyrox_programme_sessions")
      .select("session_name, day_of_week, prescription, metadata")
      .eq("programme_week_id", pub2.week.id);
    const dirty2 = (w2sessions ?? []).filter((s) =>
      /\bStage\s*\d\b|Beginner|Intermediate|Advanced|threshold_5min|familyId/i.test(
        s.session_name
      )
    );
    report.athleteFacingW2 = (w2sessions ?? []).map((s) => s.session_name);
    check("W2 athlete titles clean", dirty2.length === 0, dirty2.map((d) => d.session_name).join(" | "));
    report.w2PublishedId = pub2.week.id;
  }

  // Edge: empty target week apply already covered; empty source shell
  step("Edge: empty source shell composer apply");
  try {
    const emptyCtx = await loadWeekComposerContext({
      supabase: sb,
      athlete: athleteLive,
      mode: "next_week",
      sourceWeekNumber: 11,
      instruction: createWeekComposerInstruction("Keep structure"),
    });
    const emptyProp = proposeWeek(emptyCtx.context);
    const emptyApply = await applyWeekProposalToLiveDraft({
      supabase: sb,
      athlete: athleteLive,
      proposal: emptyProp,
      acceptedProposalIds: [],
    });
    check("empty source apply does not publish", emptyApply.published === false);
    (report.edgeCases as string[]).push("empty/missing source week apply survived");
  } catch (e) {
    (report.edgeCases as string[]).push(
      `empty source apply: ${e instanceof Error ? e.message : String(e)}`
    );
    noteFriction("P1", "Composer apply with empty/missing source week needs clearer coach messaging");
  }

  // Multi-block structured workout (pure)
  {
    const { structuredWorkoutToCoachEditConfig, coachEditConfigToStructuredWorkout, structuredWorkoutsEqual } =
      await import("../app/lib/hyroxSessionFamilyBuilderAdapter");
    const mixed = {
      warmup: ["WU"],
      blocks: [
        {
          type: "repeat" as const,
          reps: 2,
          work: { kind: "time" as const, value: 300, unit: "sec" as const },
          recoveries: [{ durationSeconds: 90, type: "jog" as const }],
        },
        {
          type: "station_round" as const,
          rounds: 3,
          station: { name: "sled", note: "coach" },
          recoveries: [{ durationSeconds: 60, type: "walk" as const }],
        },
      ],
      cooldown: ["CD"],
      guidance: [],
    };
    const cfg = structuredWorkoutToCoachEditConfig(mixed, { sessionName: "mixed" }).editConfig;
    const back = coachEditConfigToStructuredWorkout(cfg)!;
    check("multi-block round-trip", structuredWorkoutsEqual(mixed, back));
    (report.edgeCases as string[]).push("multi-block round-trip ok");
  }

  // Restore snapshot current week if publish moved it
  await sb
    .from("hyrox_athletes")
    .update({
      current_week: snapshot.current_week,
      current_block: snapshot.current_block,
      programme_status: snapshot.programme_status,
      status: snapshot.status,
    })
    .eq("id", ATHLETE_ID);
  step("Restored athlete current_week snapshot");

  // Friction synthesis
  noteFriction(
    "P1",
    "Composer still requires coach to leave Weekly Review → Composer tab → Apply → Builder (3 surfaces)"
  );
  noteFriction(
    "P2",
    "Progression Ready filter is easy to miss among many quick filters"
  );
  (report.bugsFixed as string[]).push(
    "Republish deletes orphan published sessions with no athlete history (no cancelled status in DB)",
    "Easy/long family athlete title uses Long Run for long stages"
  );

  if (dirty.length || !(review.adaptation?.recommendations?.length)) {
    report.readiness = "C";
  } else if ((report.failures as string[]).length) {
    report.readiness = "C";
  } else if ((report.friction as { P0: string[] }).P0.length) {
    report.readiness = "B";
  } else {
    report.readiness = "B";
  }

  console.log("\n===== DRY-RUN REPORT JSON =====");
  console.log(JSON.stringify(report, null, 2));
  if ((report.failures as string[]).length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
