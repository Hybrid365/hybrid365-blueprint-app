/**
 * Charlie 1-1 — coach-authored unpublished 4-week block builder.
 *
 * Offline by default: builds CoachDraftWeek[] from SessionFamilies + Kieran library,
 * validates, writes blueprint JSON. Does NOT publish.
 *
 * Optional draft write (staging only) requires:
 *   CHARLIE_ATHLETE_ID=<uuid>
 *   CONFIRM_CHARLIE_DRAFT_WRITE=1
 *   HYROX_ENV=staging (or NEXT_PUBLIC_SUPABASE_URL pointing at staging)
 *
 * Never invents threshold/FTP/HR anchors. Missing anchors stay missing.
 *
 * Run: npx tsx scripts/build-charlie-1-1-unpublished-block.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { HyroxAthletePerformanceProfile } from "../app/lib/hyroxBenchmarkProfile";
import type { CoachAthlete } from "../app/lib/hyroxCoachMockAthletes";
import {
  computeWeeklySummary,
  createBlankCoachDraftSession,
  sessionFromLibrary,
  validateCoachDraft,
  type CoachDraftDay,
  type CoachDraftSession,
  type CoachDraftWeek,
} from "../app/lib/hyroxCoachProgrammeDraft";
import {
  BIKE_FTP_QUALITY_FAMILY_ID,
  BIKE_FTP_QUALITY_STAGE_IDS,
} from "../app/lib/families/bikeFtpQuality";
import {
  EASY_LONG_RUN_FAMILY_ID,
  EASY_LONG_RUN_STAGE_IDS,
} from "../app/lib/families/easyLongRunVolume";
import {
  HYROX_COMPROMISED_RUN_FAMILY_ID,
  HYROX_COMPROMISED_RUN_STAGE_IDS,
} from "../app/lib/families/hyroxCompromisedRun";
import {
  SKI_THRESHOLD_FAMILY_ID,
  SKI_THRESHOLD_STAGE_IDS,
} from "../app/lib/families/skiThresholdIntervals";
import {
  STRENGTH_UPPER_FOUNDATION_FAMILY_ID,
  STRENGTH_UPPER_FOUNDATION_STAGE_IDS,
} from "../app/lib/families/strengthUpperFoundation";
import {
  THRESHOLD_5MIN_FAMILY_ID,
  THRESHOLD_5MIN_STAGE_IDS,
} from "../app/lib/families/threshold5MinRepeats";
import type { HyroxAthleteRow } from "../app/lib/hyroxDatabaseTypes";
import { buildCoachAthleteStubFromLiveRow } from "../app/lib/hyroxLiveCoachAthlete";
import { insertProgrammeDraft } from "../app/lib/hyroxProgrammeServer";
import { getSessionFamily } from "../app/lib/hyroxSessionFamilyRegistry";
import { createCoachDraftSessionFromFamilyStage } from "../app/lib/hyroxSessionFamilyDraft";
import { buildEmptyCoachDraftWeekShell } from "../app/lib/hyroxSessionFamilyApply";
import type { StructuredWorkout } from "../app/lib/hyroxSessionFamilyTypes";
import type { DaySlotRole } from "../src/lib/hyrox/types";

const BLOCK_START = "2026-11-09"; // Monday
const PLACEHOLDER_ATHLETE_ID = "00000000-0000-4000-8000-charlie000001";
const T0 = "2026-11-08T20:00:00.000Z";

const COACH_NOTE = [
  "Charlie Block 1 (unpublished) — run-first HYROX build.",
  "Tue threshold / Thu non-impact quality / Sat compromised / Sun long aerobic / Mon rest.",
  "Do not invent pace or FTP targets — activate verified anchors before publish.",
  "Race venue conflict: assessment Manchester 22 Jan 2027 vs coach mention London — reconcile before race-specific taper.",
].join(" ");

const ATHLETE_NOTE =
  "Block 1 focuses on controlled threshold running, non-impact quality, and efficient running after stations. Easy days stay easy.";

function emptyProfile(): HyroxAthletePerformanceProfile {
  return {
    run5k: null,
    run10k: null,
    run30min: null,
    threshold: null,
    hyroxRun: null,
    ski2k: null,
    ski1k: null,
    row2k: null,
    ftp: null,
    hyroxRace: null,
    readiness: [],
  };
}

function charlieStub(athleteId: string): CoachAthlete {
  const base = buildCoachAthleteStubFromLiveRow(
    {
      id: athleteId,
      user_id: null,
      application_id: null,
      created_at: T0,
      updated_at: T0,
      name: "Charlie",
      email: "charlie@placeholder.hybrid365",
      status: "coach_reviewing",
      race_name: "HYROX (venue TBC)",
      race_date: "2027-01-22",
      race_category: "Open",
      target_time: null,
      current_block: 1,
      current_week: 1,
      programme_status: "not_started",
      payment_status: "pending",
      stripe_customer_id: null,
      stripe_subscription_id: null,
      coach_notes: null,
      programme_start_date: BLOCK_START,
      programme_length_weeks: 12,
      current_programme_block: 1,
      programme_started_at: null,
      programme_updated_at: null,
    } as HyroxAthleteRow,
    { hasAssessment: true, hasTesting: false }
  );

  return {
    ...base,
    weeksToRace: 10,
    classification: "strength_dominant_run_limited · experienced Open",
    raceGoal: "Improve run engine + compromised efficiency (PB context 1:03:53 reported)",
    blockFocus: "Run threshold + station economy under fatigue",
    mainLimiter: "running",
    secondaryLimiter: "burpee broad jumps / lunges / post-sled run",
    trainingDays: 6,
    weeklyHours: 9,
    weeklyRunKm: 30,
    programmePriorities: [
      "Threshold run durability (Tue)",
      "Non-impact quality (Thu)",
      "Compromised run after limiter stations (Sat)",
      "Controlled aerobic volume — no mileage spike",
    ],
    assessment: {
      ...base.assessment,
      runningProfile: "Reported 5K conflict 19:27 vs 20:50; 10K 43:42; volume 25–35 km/wk (hist peak 76)",
      strengthProfile: "Strong gym background — squat 150 / DL 195 reported; keep strength supportive",
      stationWeaknesses: ["burpee broad jumps", "sandbag lunges", "run after sled pull"],
      equipmentAccess: ["full gym", "Assault Bike", "SkiErg", "RowErg", "sled", "wall balls"],
      recoveryProfile: "No current injuries reported; Mon preferred rest; 8–10 h / 6 days",
      injuryRecovery: "None reported",
      nutritionBodyweight: "95 kg reported",
    },
    programmeInputs: {
      ...base.programmeInputs,
      abilityLevel: "advanced",
      raceTimeline: "10",
      trainingDays: 6,
      weeklyTrainingHours: 9,
      weeklyRunKm: 30,
      fiveKm: "",
      tenKm: "",
      mainLimiter: "running",
      stationWeaknesses: ["burpees", "lunges", "sled_pull"],
      programmeBlock: 1,
      blockWeek: 1,
      doubleSessionReadiness: "ready_aerobic_only",
      recoveryStatus: "good",
      saturdayAvailable: true,
      preferredLongAerobicDay: "Sun",
      equipment: { fullGym: true },
    },
    weeklyCoachNote: COACH_NOTE,
    keyFocus: "Run quality first; stations support race-specific durability",
    athleteFacingNote: ATHLETE_NOTE,
  };
}

function familySession(args: {
  familyId: string;
  stageId: string;
  draftId: string;
  title: string;
  sessionType: CoachDraftSession["sessionType"];
  isKey?: boolean;
  duration?: string;
  timeOfDay?: CoachDraftSession["timeOfDay"];
  rpe?: string;
}): CoachDraftSession {
  const family = getSessionFamily(args.familyId);
  if (!family) throw new Error(`Missing family ${args.familyId}`);
  return createCoachDraftSessionFromFamilyStage({
    family,
    stageId: args.stageId,
    profile: emptyProfile(),
    resolvedAt: T0,
    draftId: args.draftId,
    base: {
      timeOfDay: args.timeOfDay ?? "Main",
      badges: args.isKey ? ["Main", "Key Session"] : ["Main"],
      title: args.title,
      sessionType: args.sessionType,
      duration: args.duration ?? "55 min",
      intensity: args.rpe ?? "as prescribed",
      rpeHr: args.rpe ?? "—",
      isKeySession: Boolean(args.isKey),
      isOptional: false,
      rationale: family.objective,
      sessionId: `family:${args.familyId}`,
      prescription: null,
      sessionDetail: null,
    },
  });
}

function withCompromisedStation(
  session: CoachDraftSession,
  stationName: string,
  stationNote: string
): CoachDraftSession {
  if (!session.sessionFamily) return session;
  const workout = structuredClone(session.sessionFamily.structuredWorkout) as StructuredWorkout;
  for (const block of workout.blocks) {
    if (block.type === "station_round") {
      block.station = { name: stationName, note: stationNote };
    }
  }
  const next: CoachDraftSession = {
    ...session,
    title: `Compromised: ${stationName} → run`,
    coachNote: [
      session.coachNote,
      `Station focus: ${stationName}. ${stationNote}`,
      "Run quality after the station is the session — do not race the station.",
    ]
      .filter(Boolean)
      .join(" "),
    sessionFamily: {
      ...session.sessionFamily,
      structuredWorkout: workout,
    },
    editConfig: {
      ...session.editConfig,
      sessionName: `Compromised: ${stationName} → run`,
      coachNote: `Station: ${stationName}. ${stationNote}`,
      structuredWorkout: workout,
    },
  };
  return next;
}

function withContinuousMinutes(session: CoachDraftSession, minutes: number, title: string): CoachDraftSession {
  if (!session.sessionFamily) return session;
  const workout = structuredClone(session.sessionFamily.structuredWorkout) as StructuredWorkout;
  workout.blocks = [{ type: "continuous", work: { kind: "time", value: minutes * 60, unit: "sec" } }];
  return {
    ...session,
    title,
    duration: `${minutes} min`,
    sessionFamily: { ...session.sessionFamily, structuredWorkout: workout },
    editConfig: {
      ...session.editConfig,
      sessionName: title,
      durationMinutes: minutes,
      structuredWorkout: workout,
    },
    volumeMeta: {
      ...(session.volumeMeta ?? {
        durationMinutes: minutes,
        thresholdMinutes: 0,
        qualityRunMinutes: 0,
        runDistanceKm: Math.round((minutes / 60) * 10 * 10) / 10,
        ergMinutes: 0,
        bikeMinutes: 0,
        strengthMinutes: 0,
        stationVolume: 0,
        hardDay: false,
        impactType: "run",
        muscularStress: "low",
        stationStress: "none",
        isOptionalAddOn: false,
      }),
      durationMinutes: minutes,
      runDistanceKm: Math.round((minutes / 6) * 10) / 10,
      hardDay: false,
    },
  };
}

function scaleBikeWbIntermediate(session: CoachDraftSession): CoachDraftSession {
  const mainSet = [
    "Intermediate scale (Charlie W3 Thu):",
    "4 rounds:",
    "3 min Assault Bike @ controlled hard (RPE 7–8 — no invented watts)",
    "15 wall balls @ race height / coach load",
    "Rest 90 sec between rounds",
    "Priority: unbroken or planned breaks on WB under breathing demand.",
  ];
  return {
    ...session,
    duration: "45 min",
    coachNote: [
      session.coachNote,
      "Scaled intermediate — protect Saturday compromised. No watt invention without FTP anchor.",
    ]
      .filter(Boolean)
      .join(" "),
    prescription: session.prescription
      ? { ...session.prescription, mainSet, targetPace: null, targetLoad: "Race WB load (coach)" }
      : session.prescription,
    editConfig: {
      ...session.editConfig,
      mainSetLines: mainSet,
      durationMinutes: 45,
      coachNote: "Intermediate bike→WB; keep Saturday legs in mind.",
    },
  };
}

function annotateDay(day: CoachDraftDay, role: DaySlotRole, roleLabel: string, hard: boolean): void {
  day.role = role;
  day.roleLabel = roleLabel;
  day.hardDay = hard;
  day.hardEasyLabel = hard ? "Hard" : role === "rest" ? "Rest" : "Easy";
  day.isKeySession = day.sessions.some((s) => s.isKeySession);
  const mins = day.sessions.reduce((acc, s) => {
    const m = s.volumeMeta?.durationMinutes ?? (parseInt(String(s.duration).replace(/\D/g, ""), 10) || 0);
    return acc + m;
  }, 0);
  day.plannedMinutes = mins;
  day.duration = mins ? `${mins} min` : role === "rest" ? "Rest" : "";
  day.title = roleLabel;
  day.thresholdMinutes = day.sessions.reduce(
    (a, s) => a + (s.thresholdMinutes ?? s.volumeMeta?.thresholdMinutes ?? 0),
    0
  );
}

function estimateRunKm(draft: CoachDraftWeek): number {
  // Conservative coaching estimate from session roles (not invented GPS).
  let km = 0;
  for (const day of draft.days) {
    for (const s of day.sessions) {
      if (s.isOptional || s.volumeMeta?.isOptionalAddOn) continue;
      if (s.volumeMeta?.runDistanceKm && s.volumeMeta.runDistanceKm > 0) {
        km += s.volumeMeta.runDistanceKm;
        continue;
      }
      const familyId = s.sessionFamily?.familyId;
      if (familyId === THRESHOLD_5MIN_FAMILY_ID) {
        const reps =
          s.sessionFamily?.stageKey === "stage_1"
            ? 5
            : s.sessionFamily?.stageKey === "deload_a"
              ? 4
              : 6;
        km += 3.5 + reps * 1.15; // WU/CD + ~5 min reps
        continue;
      }
      if (familyId === HYROX_COMPROMISED_RUN_FAMILY_ID) {
        const rounds =
          s.sessionFamily?.stageKey === "stage_1"
            ? 4
            : s.sessionFamily?.stageKey === "deload_a"
              ? 3
              : 5;
        const runM =
          s.sessionFamily?.stageKey === "stage_3" || s.sessionFamily?.stageKey === "consolidation"
            ? 800
            : 400;
        km += 2.2 + (rounds * runM) / 1000;
        continue;
      }
      if (familyId === EASY_LONG_RUN_FAMILY_ID) {
        const mins = s.volumeMeta?.durationMinutes ?? (parseInt(String(s.duration).replace(/\D/g, ""), 10) || 60);
        km += Math.round((mins / 6) * 10) / 10;
        continue;
      }
      // Composed easy run / recovery run only (exclude bike/erg titles)
      const title = s.title.toLowerCase();
      if (
        (title.includes("easy aerobic run") || title.includes("easy recovery") || title.includes("long")) &&
        !title.includes("bike") &&
        !title.includes("ski") &&
        !title.includes("row")
      ) {
        const mins = s.volumeMeta?.durationMinutes ?? (parseInt(String(s.duration).replace(/\D/g, ""), 10) || 40);
        km += Math.round((mins / 6) * 10) / 10;
      }
    }
  }
  return Math.round(km * 10) / 10;
}

function buildWeek(athleteId: string, weekInBlock: 1 | 2 | 3 | 4, athlete: CoachAthlete): CoachDraftWeek {
  const shell = buildEmptyCoachDraftWeekShell({ athleteId, globalWeek: weekInBlock });
  const byDay = Object.fromEntries(shell.days.map((d) => [d.day, d])) as Record<string, CoachDraftDay>;

  // Monday — complete rest
  byDay.Mon!.sessions = [];
  annotateDay(byDay.Mon!, "rest", "Complete rest", false);
  byDay.Mon!.sessionType = "rest";

  // Tuesday — run threshold + complementary upper strength
  const tueStage =
    weekInBlock === 1
      ? THRESHOLD_5MIN_STAGE_IDS.s1
      : weekInBlock === 2
        ? THRESHOLD_5MIN_STAGE_IDS.s2
        : weekInBlock === 3
          ? THRESHOLD_5MIN_STAGE_IDS.s3
          : THRESHOLD_5MIN_STAGE_IDS.consol;

  const tueThreshold = familySession({
    familyId: THRESHOLD_5MIN_FAMILY_ID,
    stageId: tueStage,
    draftId: `charlie-w${weekInBlock}-tue-th`,
    title: "Threshold — 5 min repeats",
    sessionType: "run_development",
    isKey: true,
    duration: "60 min",
    timeOfDay: "AM",
    rpe: "RPE 7–8 · threshold (anchor pending)",
  });
  tueThreshold.coachNote = [
    tueThreshold.coachNote,
    "Charlie primary quality: sustainable threshold. Progress volume/recovery quality before pace.",
    "Threshold pace anchor not verified — prescribe effort/HR when coach activates; do not invent pace.",
  ].join(" ");

  const upperStage =
    weekInBlock <= 2 ? STRENGTH_UPPER_FOUNDATION_STAGE_IDS.s1 : STRENGTH_UPPER_FOUNDATION_STAGE_IDS.s2;
  const tueUpper = familySession({
    familyId: STRENGTH_UPPER_FOUNDATION_FAMILY_ID,
    stageId: weekInBlock === 4 ? STRENGTH_UPPER_FOUNDATION_STAGE_IDS.consol : upperStage,
    draftId: `charlie-w${weekInBlock}-tue-upper`,
    title: "Upper strength (support)",
    sessionType: "strength",
    isKey: false,
    duration: "40 min",
    timeOfDay: "PM",
    rpe: "RPE 6–7",
  });
  tueUpper.coachNote =
    "Supportive upper only — Charlie already strong. Loads coach-prescribed, leave 2–3 reps spare. Protect legs for Thu/Sat.";

  byDay.Tue!.sessions = [tueThreshold, tueUpper];
  annotateDay(byDay.Tue!, "hard_run", "Run threshold + upper support", true);

  // Wednesday — easy aerobic
  const wedMins = weekInBlock === 4 ? 35 : weekInBlock === 3 ? 45 : 40;
  const wedEasy = createBlankCoachDraftSession({
    sessionName: "Easy aerobic run",
    libraryCategory: "run_development",
    timeOfDay: "Main",
    duration: `${wedMins} min`,
    objective: "Conversational aerobic — flush Tuesday without adding fatigue.",
    rpeTarget: "RPE 3–4",
    hrZone: "Z2 if known — otherwise talk test",
    coachNote: "Keep it genuinely easy. If legs heavy, bike Z2 same duration.",
    warmUpLines: ["Start easy"],
    coolDownLines: ["Walk finish as needed"],
    customParts: [
      {
        id: `wed-easy-${weekInBlock}`,
        type: "run",
        title: "Easy run",
        instructions: "Conversational throughout",
        duration: `${wedMins} min`,
        rpe: "3–4",
        notes: "Talk test / Z2 if known",
      },
    ],
  });
  wedEasy.volumeMeta = {
    durationMinutes: wedMins,
    thresholdMinutes: 0,
    qualityRunMinutes: 0,
    runDistanceKm: Math.round((wedMins / 6) * 10) / 10,
    ergMinutes: 0,
    bikeMinutes: 0,
    strengthMinutes: 0,
    stationVolume: 0,
    hardDay: false,
    impactType: "run",
    muscularStress: "low",
    stationStress: "none",
    isOptionalAddOn: false,
  };
  const wedSessions: CoachDraftSession[] = [wedEasy];
  if (weekInBlock <= 3) {
    const wedBike = createBlankCoachDraftSession({
      sessionName: "Optional easy bike flush",
      libraryCategory: "easy_erg",
      timeOfDay: "Optional",
      duration: "25 min",
      objective: "Optional Z2 bike — only if recovery is green after the easy run.",
      rpeTarget: "RPE 2–3",
      coachNote: "Optional add-on. Skip entirely if legs or sleep are off. Not a fourth quality exposure.",
      warmUpLines: ["Easy spin"],
      coolDownLines: ["Off bike"],
      customParts: [
        {
          id: `wed-bike-opt-${weekInBlock}`,
          type: "assault_bike",
          title: "Easy bike",
          instructions: "Conversational spin only",
          duration: "25 min",
          rpe: "2–3",
        },
      ],
    });
    wedBike.isOptional = true;
    wedBike.isKeySession = false;
    wedBike.volumeMeta = {
      durationMinutes: 25,
      thresholdMinutes: 0,
      qualityRunMinutes: 0,
      runDistanceKm: 0,
      ergMinutes: 0,
      bikeMinutes: 25,
      strengthMinutes: 0,
      stationVolume: 0,
      hardDay: false,
      impactType: "bike",
      muscularStress: "low",
      stationStress: "none",
      isOptionalAddOn: true,
    };
    wedSessions.push(wedBike);
  }
  byDay.Wed!.sessions = wedSessions;
  annotateDay(byDay.Wed!, "easy_run", "Easy aerobic", false);

  // Thursday — non-impact quality / station endurance
  let thu: CoachDraftSession;
  if (weekInBlock === 1) {
    thu = familySession({
      familyId: BIKE_FTP_QUALITY_FAMILY_ID,
      stageId: BIKE_FTP_QUALITY_STAGE_IDS.s1,
      draftId: `charlie-w${weekInBlock}-thu`,
      title: "Assault Bike FTP quality",
      sessionType: "threshold_runs",
      isKey: true,
      duration: "50 min",
      rpe: "RPE 7–8 · ~90% FTP when anchored",
    });
    thu.coachNote =
      "Week 1 non-impact threshold — engine without run impact before first compromised Saturday. FTP missing → RPE/feel; do not invent watts.";
  } else if (weekInBlock === 2) {
    thu = familySession({
      familyId: SKI_THRESHOLD_FAMILY_ID,
      stageId: SKI_THRESHOLD_STAGE_IDS.s2,
      draftId: `charlie-w${weekInBlock}-thu`,
      title: "SkiErg threshold intervals",
      sessionType: "threshold_runs",
      isKey: true,
      duration: "50 min",
      rpe: "RPE 7–8",
    });
    thu.coachNote =
      "Use Charlie's SkiErg strength for quality minutes without impact. Ski 2k anchor missing — even effort, no invented split.";
  } else if (weekInBlock === 3) {
    const lib = sessionFromLibrary(athlete, "kieran-bike-wb", "Main");
    if (!lib) throw new Error("Missing kieran-bike-wb library entry");
    thu = scaleBikeWbIntermediate({
      ...lib,
      draftId: `charlie-w${weekInBlock}-thu`,
      isKeySession: true,
      badges: ["Main", "Key Session"],
    });
  } else {
    thu = familySession({
      familyId: BIKE_FTP_QUALITY_FAMILY_ID,
      stageId: BIKE_FTP_QUALITY_STAGE_IDS.deload,
      draftId: `charlie-w${weekInBlock}-thu`,
      title: "Assault Bike quality (consolidate)",
      sessionType: "threshold_runs",
      isKey: true,
      duration: "40 min",
      rpe: "RPE 6–7",
    });
    thu.coachNote = "Week 4 consolidate — shorter bike quality, leave freshness for Saturday assessment feel.";
  }
  byDay.Thu!.sessions = [thu];
  annotateDay(byDay.Thu!, "erg_threshold", "Non-impact quality", true);

  // Friday — recovery aerobic
  const friMins = weekInBlock === 4 ? 30 : 35;
  const friEasy = createBlankCoachDraftSession({
    sessionName: "Easy recovery aerobic",
    libraryCategory: "run_development",
    timeOfDay: "Main",
    duration: `${friMins} min`,
    objective: "Recovery before Saturday compromised — run or easy bike.",
    rpeTarget: "RPE 2–3",
    coachNote: "Prefer easy bike if residual fatigue from Thu. No station work.",
    warmUpLines: ["Easy start"],
    coolDownLines: ["Mobility 5 min optional"],
    customParts: [
      {
        id: `fri-easy-${weekInBlock}`,
        type: "recovery",
        title: "Easy run or bike",
        instructions: "Flush only — prefer bike if legs heavy",
        duration: `${friMins} min`,
        rpe: "2–3",
      },
    ],
  });
  friEasy.volumeMeta = {
    durationMinutes: friMins,
    thresholdMinutes: 0,
    qualityRunMinutes: 0,
    runDistanceKm: Math.round((friMins / 6.5) * 10) / 10,
    ergMinutes: 0,
    bikeMinutes: 0,
    strengthMinutes: 0,
    stationVolume: 0,
    hardDay: false,
    impactType: "mixed",
    muscularStress: "low",
    stationStress: "none",
    isOptionalAddOn: false,
  };
  byDay.Fri!.sessions = [friEasy];
  annotateDay(byDay.Fri!, "recovery", "Easy recovery", false);

  // Saturday — HYROX compromised (limiter stations rotate)
  const satStage =
    weekInBlock === 1
      ? HYROX_COMPROMISED_RUN_STAGE_IDS.s1
      : weekInBlock === 2
        ? HYROX_COMPROMISED_RUN_STAGE_IDS.s2
        : weekInBlock === 3
          ? HYROX_COMPROMISED_RUN_STAGE_IDS.s3
          : HYROX_COMPROMISED_RUN_STAGE_IDS.consol;

  const stationByWeek: Record<1 | 2 | 3 | 4, { name: string; note: string }> = {
    1: {
      name: "Sled pull",
      note: "Controlled race-relevant load — focus on posture reclaim in first 200m of the run (Charlie limiter).",
    },
    2: {
      name: "Burpee broad jumps",
      note: "Economy over spectacle — smooth rhythm. Charlie weakness station into run.",
    },
    3: {
      name: "Sandbag walking lunges",
      note: "Coach-prescribed load. Longer run-off (800m stage) — do not cook the lunges.",
    },
    4: {
      name: "Mixed light (WB or sled push)",
      note: "Consolidation dose — hold Stage 3 run structure, lighter station intent, assess run quality.",
    },
  };

  let sat = familySession({
    familyId: HYROX_COMPROMISED_RUN_FAMILY_ID,
    stageId: satStage,
    draftId: `charlie-w${weekInBlock}-sat`,
    title: "HYROX compromised running",
    sessionType: "compromised_running",
    isKey: true,
    duration: weekInBlock === 4 ? "50 min" : "60–70 min",
    rpe: "RPE 7–8",
  });
  sat = withCompromisedStation(sat, stationByWeek[weekInBlock].name, stationByWeek[weekInBlock].note);
  sat.coachNote = [
    sat.coachNote,
    "Not a race simulation. One primary station focus. Hyrox run pace anchor missing — control effort.",
  ].join(" ");
  byDay.Sat!.sessions = [sat];
  annotateDay(byDay.Sat!, "compromised_hybrid", "HYROX compromised running", true);

  // Sunday — long aerobic (genuinely easy)
  const sunMins = weekInBlock === 1 ? 60 : weekInBlock === 2 ? 68 : weekInBlock === 3 ? 70 : 55;
  let sun = familySession({
    familyId: EASY_LONG_RUN_FAMILY_ID,
    stageId:
      weekInBlock === 1 || weekInBlock === 4
        ? EASY_LONG_RUN_STAGE_IDS.s2
        : weekInBlock === 3
          ? EASY_LONG_RUN_STAGE_IDS.s3
          : EASY_LONG_RUN_STAGE_IDS.s2,
    draftId: `charlie-w${weekInBlock}-sun`,
    title: weekInBlock >= 3 && weekInBlock < 4 ? "Long aerobic run" : "Long easy run",
    sessionType: "run_development",
    isKey: false,
    duration: `${sunMins} min`,
    rpe: "RPE 3–4",
  });
  sun = withContinuousMinutes(sun, sunMins, sunMins >= 70 ? "Long aerobic run" : "Long easy run");
  sun.isKeySession = false;
  sun.coachNote =
    "Genuinely aerobic. No strides finish. Workload capped to protect recovery into next Tuesday threshold.";
  byDay.Sun!.sessions = [sun];
  annotateDay(byDay.Sun!, "long_aerobic", "Long aerobic run", false);

  shell.generatedAt = T0;
  return shell;
}

function overviewRow(week: CoachDraftWeek, athlete: CoachAthlete) {
  const summary = computeWeeklySummary(week, athlete);
  const validation = validateCoachDraft(week, athlete);
  return {
    week: week.week,
    block: week.block,
    plannedHours: summary.plannedHours,
    availableHours: summary.availableHours,
    estimatedRunKm: estimateRunKm(week),
    thresholdMinutes: summary.thresholdMinutes,
    hardDays: summary.hardDays,
    keySessions: week.days.flatMap((d) =>
      d.sessions
        .filter((s) => s.isKeySession)
        .map((s) => ({
          day: d.day,
          title: s.title,
          familyId: s.sessionFamily?.familyId ?? null,
          stageKey: s.sessionFamily?.stageKey ?? null,
          coachLibraryId: s.coachLibraryId ?? null,
          source: s.sessionFamily
            ? "session_family"
            : s.coachLibraryId
              ? "coach_library"
              : "composed",
        }))
    ),
    allSessions: week.days.map((d) => ({
      day: d.day,
      role: d.roleLabel,
      hard: d.hardDay,
      sessions: d.sessions.map((s) => ({
        title: s.title,
        duration: s.duration,
        timeOfDay: s.timeOfDay,
        key: s.isKeySession,
        familyId: s.sessionFamily?.familyId ?? null,
        stageKey: s.sessionFamily?.stageKey ?? null,
        coachLibraryId: s.coachLibraryId ?? null,
        source: s.sessionFamily ? "session_family" : s.coachLibraryId ? "coach_library" : "composed",
      })),
    })),
    validationWarnings: validation.warnings,
    validationPositives: validation.positives,
  };
}

async function maybeWriteDrafts(
  weeks: CoachDraftWeek[],
  athlete: CoachAthlete
): Promise<{ wrote: boolean; reason: string; draftIds?: string[]; reviewPath?: string }> {
  const athleteId = process.env.CHARLIE_ATHLETE_ID?.trim();
  const confirm = process.env.CONFIRM_CHARLIE_DRAFT_WRITE === "1";
  if (!athleteId || !confirm) {
    return {
      wrote: false,
      reason:
        "Draft DB write skipped — set CHARLIE_ATHLETE_ID and CONFIRM_CHARLIE_DRAFT_WRITE=1 against staging to insert unpublished drafts.",
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    return { wrote: false, reason: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." };
  }

  const stagingRef = process.env.HYROX_STAGING_SUPABASE_REF ?? "bfwboqaovirzjpxpwgty";
  if (!url.includes(stagingRef)) {
    return {
      wrote: false,
      reason: `Refusing write — Supabase URL is not staging (${stagingRef}). Production draft writes require explicit coach-authenticated admin path, not this script.`,
    };
  }

  const sb: SupabaseClient = createClient(url, key, { auth: { persistSession: false } });
  const { data: row, error } = await sb
    .from("hyrox_athletes")
    .select("*")
    .eq("id", athleteId)
    .maybeSingle();
  if (error) return { wrote: false, reason: `Athlete fetch failed: ${error.message}` };
  if (!row) return { wrote: false, reason: `No hyrox_athletes row for ${athleteId} on staging.` };

  const athleteRow = row as HyroxAthleteRow;
  if (athleteRow.programme_status === "published" || athleteRow.status === "programme_published") {
    return {
      wrote: false,
      reason: "Athlete already has a published programme — refusing scripted draft write. Use Programme Builder.",
    };
  }

  const stub = {
    ...athlete,
    id: athleteId,
    name: athleteRow.name,
    email: athleteRow.email,
  };
  const draftIds: string[] = [];

  for (const week of weeks) {
    week.athleteId = athleteId;
    const inserted = await insertProgrammeDraft(sb, {
      athlete: stub,
      athleteRow,
      mappedProfileId: null,
      draft: week,
      coachNote: COACH_NOTE,
      athleteFacingNote: ATHLETE_NOTE,
      changedBy: null,
    });
    draftIds.push(inserted.id);
  }

  return {
    wrote: true,
    reason: "Inserted unpublished drafts on staging only (status draft_generated).",
    draftIds,
    reviewPath: `/admin/hyrox-athletes/${athleteId}?tab=Programme%20Builder`,
  };
}

async function main() {
  const athleteId = process.env.CHARLIE_ATHLETE_ID?.trim() || PLACEHOLDER_ATHLETE_ID;
  const athlete = charlieStub(athleteId);
  const weeks = ([1, 2, 3, 4] as const).map((w) => buildWeek(athleteId, w, athlete));

  const overview = weeks.map((w) => overviewRow(w, athlete));
  const writeResult = await maybeWriteDrafts(weeks, athlete);

  const outDir =
    process.env.CHARLIE_BLUEPRINT_OUT ??
    join(
      process.env.HOME ?? ".",
      "Library/Application Support/Cursor/AgentStores/cursor_agent_stores/49b0eb60-ea98-425c-9949-c69e9efae070/files"
    );
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "charlie-block1-unpublished-blueprint.json");

  const payload = {
    meta: {
      athleteName: "Charlie",
      blockStart: BLOCK_START,
      block: 1,
      weeks: 4,
      unpublished: true,
      doctrine: "docs/hybrid365-hyrox-methodology.md",
      classification: "strength_dominant_run_limited (coach judgment)",
      phase: "late Far / early Mid (~10 weeks to 22 Jan 2027 if Manchester date holds)",
      anchors: {
        threshold_pace: "missing — do not invent",
        ftp_watts: "missing — do not invent",
        ski_2k: "missing — do not invent",
        hyrox_run_pace: "missing — do not invent",
        run_5k: "conflict 19:27 vs 20:50 — not activated",
        run_10k: "reported 43:42 — not activated as programming anchor",
      },
      conflicts: [
        "Race: assessment Manchester 22 Jan 2027 vs coach mention London",
        "5K results conflict — no threshold derived",
      ],
    },
    coachNote: COACH_NOTE,
    athleteFacingNote: ATHLETE_NOTE,
    overview,
    weeks,
    writeResult,
  };

  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  // Also write a slim report next to repo for quick open
  const repoOut = join(dirname(new URL(import.meta.url).pathname), "../tmp/charlie-block1-overview.json");
  mkdirSync(dirname(repoOut), { recursive: true });
  writeFileSync(
    repoOut,
    JSON.stringify({ meta: payload.meta, overview, writeResult, blueprintPath: outPath }, null, 2)
  );

  console.log(JSON.stringify({ ok: true, blueprintPath: outPath, repoOut, writeResult, overview }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
