/**
 * Builds a standard CoachDraftWeek for Hybrid365 Performance Testing — Test Week 1 (Version 2).
 *
 * Newly created weeks always use performanceTestingVersion: 2.
 * Do not mutate already-published Version 1 weeks.
 */

import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import {
  globalWeekForBlock,
  type CoachDraftDay,
  type CoachDraftSession,
  type CoachDraftWeek,
  type CoachSessionEditConfig,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import type { SandboxTimeOfDay } from "@/app/lib/hyroxProgrammeSandbox";
import {
  COMPROMISED_HYROX_PACING_GUIDANCE,
  PERFORMANCE_TEST_DEFINITIONS,
  PERFORMANCE_TEST_WEEK_ID,
  PERFORMANCE_TESTING_VERSION,
  type PerformanceTestType,
} from "@/app/lib/hyroxPerformanceTestingTypes";

export const PERFORMANCE_TESTING_WEEK_TEMPLATE_NAME =
  "Hybrid365 Performance Testing — Test Week 1";

function nextDraftId(): string {
  return `pt-${crypto.randomUUID().slice(0, 8)}`;
}

function buildPerformanceTestEditConfig(
  testType: PerformanceTestType,
  title: string
): CoachSessionEditConfig {
  const def = PERFORMANCE_TEST_DEFINITIONS[testType];
  return {
    kind: "performance_test",
    sessionName: title,
    testType,
    protocol: def.protocol.join("\n"),
    requiredFields: def.requiredFields.map((f) => f.label),
    optionalFields: def.optionalFields.map((f) => f.label),
    scalingNotes: def.scalingNotes.join("\n"),
    filmPrompt: def.videoPrompt,
    coachNote: def.coachNote,
    objective: def.purpose,
    rpeTarget: def.stressLevel,
    whatToRecord: [...def.requiredFields.map((f) => f.label), ...def.optionalFields.map((f) => f.label)],
    performanceTestWeekId: PERFORMANCE_TEST_WEEK_ID,
  };
}

function buildPerformanceTestSession(params: {
  day: string;
  timeOfDay: SandboxTimeOfDay;
  testType: PerformanceTestType;
  title?: string;
}): CoachDraftSession {
  const def = PERFORMANCE_TEST_DEFINITIONS[params.testType];
  const title = params.title ?? def.title;
  const badges: CoachDraftSession["badges"] = [
    ...(params.timeOfDay === "AM"
      ? (["AM"] as const)
      : params.timeOfDay === "PM"
        ? (["PM"] as const)
        : (["Main"] as const)),
    "Performance Test",
  ];

  const editConfig = buildPerformanceTestEditConfig(params.testType, title);

  return {
    draftId: nextDraftId(),
    timeOfDay: params.timeOfDay,
    badges,
    title,
    sessionType: "testing",
    duration: def.estimatedDuration,
    intensity: def.stressLevel,
    rpeHr: def.stressLevel,
    isKeySession: true,
    isOptional: false,
    rationale: def.purpose,
    sessionId: `performance_test_${params.testType}`,
    prescription: null,
    sessionDetail: null,
    thresholdMinutes: undefined,
    emom: null,
    coachNote: def.coachNote ?? "",
    editConfig,
    showDetail: false,
    performanceMetadata: {
      isPerformanceTest: true,
      performanceTestType: params.testType,
      performanceTestWeekId: PERFORMANCE_TEST_WEEK_ID,
      performanceTestingVersion: PERFORMANCE_TESTING_VERSION,
    },
  };
}

/** Recovery / prep programme sessions — no formal performance-test result required. */
function buildRecoveryProgrammeSession(params: {
  timeOfDay: SandboxTimeOfDay;
  title: string;
  duration: string;
  protocol: string[];
  objective: string;
}): CoachDraftSession {
  return {
    draftId: nextDraftId(),
    timeOfDay: params.timeOfDay,
    badges: ["Main"],
    title: params.title,
    sessionType: "tempo_aerobic_quality",
    duration: params.duration,
    intensity: "Easy",
    rpeHr: "2–4",
    isKeySession: false,
    isOptional: false,
    rationale: params.objective,
    sessionId: null,
    prescription: null,
    sessionDetail: null,
    thresholdMinutes: undefined,
    emom: null,
    coachNote: "Programme-session completion only — no formal performance-test result required.",
    editConfig: {
      kind: "easy_aerobic",
      sessionName: params.title,
      objective: params.objective,
      mainSetLines: params.protocol,
      whatToRecord: ["Completion", "RPE", "Notes"],
      rpeTarget: "2–4",
      durationMinutes: 45,
      hrZone: "Z1–Z2",
    },
    showDetail: false,
  };
}

function buildDayShell(
  day: string,
  title: string,
  roleLabel: string,
  role: CoachDraftDay["role"] = "testing",
  options?: { hardDay?: boolean; stationFocus?: string | null }
): Omit<CoachDraftDay, "sessions"> {
  const hardDay =
    options?.hardDay ?? (day === "Mon" || day === "Thu" || day === "Fri" || day === "Sun");
  return {
    day,
    role,
    roleLabel,
    title,
    sessionType: role === "recovery" ? "tempo_aerobic_quality" : "testing",
    intensity: "varied",
    duration: "varies",
    rpeHr: "varies",
    isKeySession: role !== "recovery",
    hardDay,
    hardEasyLabel: hardDay ? "Test day" : "Recovery",
    thresholdMinutes: 0,
    qualityRunMinutes: day === "Mon" ? 30 : 0,
    plannedMinutes: 60,
    rationale: title,
    optionalAddOn: null,
    emom: null,
    stationFocus: options?.stationFocus ?? null,
    equipment: [],
    sessionId: null,
    prescription: null,
    sessionDetail: null,
  };
}

export function buildPerformanceTestingWeek1Draft(athlete: CoachAthlete): CoachDraftWeek {
  const blockWeek = Math.min(4, Math.max(1, athlete.blockWeek)) as 1 | 2 | 3 | 4;

  const days: CoachDraftDay[] = [
    {
      ...buildDayShell("Mon", "5km Run Test", "Performance test"),
      sessions: [
        buildPerformanceTestSession({
          day: "Mon",
          timeOfDay: "Main",
          testType: "five_k_run",
          title: "5km Run Test",
        }),
      ],
    },
    {
      ...buildDayShell("Tue", "Easy Recovery", "Recovery", "recovery", { hardDay: false }),
      sessions: [
        buildRecoveryProgrammeSession({
          timeOfDay: "Main",
          title: "Easy Recovery",
          duration: "30–60 min",
          objective: "Recover from the run test with easy aerobic work and mobility.",
          protocol: [
            "30–60 minutes Zone 1/2 aerobic work",
            "Bike, easy SkiErg, RowErg or mixed aerobic work",
            "Mobility",
            "No hard efforts",
          ],
        }),
      ],
    },
    {
      ...buildDayShell("Wed", "Rest, Mobility and Technique", "Technique", "recovery", {
        hardDay: false,
      }),
      sessions: [
        buildRecoveryProgrammeSession({
          timeOfDay: "Main",
          title: "Rest, Mobility and Technique",
          duration: "20–40 min or rest",
          objective: "Full rest or very light recovery with optional technique practice.",
          protocol: [
            "Full rest or very light recovery work",
            "Mobility",
            "Optional technique practice",
            "Optional movement filming for coach review",
          ],
        }),
      ],
    },
    {
      ...buildDayShell("Thu", "AM SkiErg + PM RowErg", "Engine tests"),
      sessions: [
        buildPerformanceTestSession({
          day: "Thu",
          timeOfDay: "AM",
          testType: "ski_2k",
          title: "2km SkiErg Test",
        }),
        buildPerformanceTestSession({
          day: "Thu",
          timeOfDay: "PM",
          testType: "row_2k",
          title: "2km RowErg Test",
        }),
      ],
    },
    {
      ...buildDayShell("Fri", "Controlled Strength Assessment", "Strength test"),
      sessions: [
        buildPerformanceTestSession({
          day: "Fri",
          timeOfDay: "Main",
          testType: "strength_assessment",
          title: "Controlled Strength Assessment",
        }),
      ],
    },
    {
      ...buildDayShell("Sat", "Recovery and Preparation", "Recovery", "recovery", {
        hardDay: false,
        stationFocus: null,
      }),
      sessions: [
        buildRecoveryProgrammeSession({
          timeOfDay: "Main",
          title: "Recovery and Preparation",
          duration: "Rest or 30–45 min",
          objective: "Prepare for Sunday without hard station testing.",
          protocol: [
            "Complete rest or 30–45 minutes very easy aerobic work",
            "Mobility",
            "Optional light HYROX movement practice",
            "No hard station testing",
            "No formal result submission required",
          ],
        }),
      ],
    },
    {
      ...buildDayShell("Sun", "Hybrid365 Compromised HYROX Benchmark", "Compromised test", "testing", {
        hardDay: true,
        stationFocus: "Continuous HYROX simulation",
      }),
      sessions: [
        {
          ...buildPerformanceTestSession({
            day: "Sun",
            timeOfDay: "Main",
            testType: "compromised_hyrox_benchmark",
            title: "Hybrid365 Compromised HYROX Benchmark",
          }),
          coachNote: COMPROMISED_HYROX_PACING_GUIDANCE,
        },
      ],
    },
  ];

  return {
    athleteId: athlete.id,
    block: athlete.programmeBlock,
    week: globalWeekForBlock(athlete.programmeBlock, blockWeek),
    generatedAt: new Date().toISOString(),
    days,
    performanceTestingVersion: PERFORMANCE_TESTING_VERSION,
  };
}

export function draftHasSessions(draft: CoachDraftWeek): boolean {
  return draft.days.some((d) => d.sessions.length > 0);
}
