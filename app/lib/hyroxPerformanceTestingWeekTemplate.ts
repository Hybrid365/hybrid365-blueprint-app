/**
 * Builds a standard CoachDraftWeek for Hybrid365 Performance Testing — Test Week 1.
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
  PERFORMANCE_TEST_DEFINITIONS,
  PERFORMANCE_TEST_WEEK_ID,
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
    },
  };
}

function buildDayShell(
  day: string,
  title: string,
  roleLabel: string,
  role: CoachDraftDay["role"] = "testing"
): Omit<CoachDraftDay, "sessions"> {
  return {
    day,
    role,
    roleLabel,
    title,
    sessionType: "testing",
    intensity: "varied",
    duration: "varies",
    rpeHr: "varies",
    isKeySession: true,
    hardDay: day === "Mon" || day === "Fri" || day === "Sun",
    hardEasyLabel: "Test day",
    thresholdMinutes: 0,
    qualityRunMinutes: day === "Mon" ? 30 : 0,
    plannedMinutes: 60,
    rationale: title,
    optionalAddOn: null,
    emom: null,
    stationFocus: day === "Sat" ? "Station diagnostics" : null,
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
      ...buildDayShell("Mon", "5 km Run Test", "Performance test"),
      sessions: [
        buildPerformanceTestSession({
          day: "Mon",
          timeOfDay: "Main",
          testType: "five_k_run",
          title: "5 km Run Test",
        }),
      ],
    },
    {
      ...buildDayShell("Tue", "Easy Recovery", "Recovery", "recovery"),
      sessions: [
        buildPerformanceTestSession({
          day: "Tue",
          timeOfDay: "Main",
          testType: "recovery_day",
          title: "Easy Recovery",
        }),
      ],
    },
    {
      ...buildDayShell("Wed", "Rest, Mobility and Technique", "Technique"),
      sessions: [
        buildPerformanceTestSession({
          day: "Wed",
          timeOfDay: "Main",
          testType: "mobility_technique",
          title: "Rest, Mobility and Technique",
        }),
      ],
    },
    {
      ...buildDayShell("Thu", "Controlled Strength Assessment", "Strength test"),
      sessions: [
        buildPerformanceTestSession({
          day: "Thu",
          timeOfDay: "Main",
          testType: "strength_assessment",
          title: "Controlled Strength Assessment",
        }),
      ],
    },
    {
      ...buildDayShell("Fri", "2 km SkiErg + 2 km RowErg", "Engine tests"),
      sessions: [
        buildPerformanceTestSession({
          day: "Fri",
          timeOfDay: "AM",
          testType: "ski_2k",
          title: "2 km SkiErg Test",
        }),
        buildPerformanceTestSession({
          day: "Fri",
          timeOfDay: "PM",
          testType: "row_2k",
          title: "2 km RowErg Test",
        }),
      ],
    },
    {
      ...buildDayShell("Sat", "Station Diagnostics and Dead Hang", "Station tests"),
      sessions: [
        buildPerformanceTestSession({
          day: "Sat",
          timeOfDay: "Main",
          testType: "sled_push",
          title: "Sled Push Assessment",
        }),
        buildPerformanceTestSession({
          day: "Sat",
          timeOfDay: "Main",
          testType: "sled_pull",
          title: "Sled Pull Assessment",
        }),
        buildPerformanceTestSession({
          day: "Sat",
          timeOfDay: "Main",
          testType: "wall_ball",
          title: "Wall-Ball Durability",
        }),
        buildPerformanceTestSession({
          day: "Sat",
          timeOfDay: "Main",
          testType: "farmers_carry",
          title: "Farmer's Carry",
        }),
        buildPerformanceTestSession({
          day: "Sat",
          timeOfDay: "Main",
          testType: "dead_hang",
          title: "Dead Hang Test",
        }),
      ],
    },
    {
      ...buildDayShell("Sun", "Compromised Sled-Running Test", "Compromised test"),
      sessions: [
        buildPerformanceTestSession({
          day: "Sun",
          timeOfDay: "Main",
          testType: "compromised_sled_run",
          title: "Compromised Sled-Running Test",
        }),
      ],
    },
  ];

  return {
    athleteId: athlete.id,
    block: athlete.programmeBlock,
    week: globalWeekForBlock(athlete.programmeBlock, blockWeek),
    generatedAt: new Date().toISOString(),
    days,
  };
}

export function draftHasSessions(draft: CoachDraftWeek): boolean {
  return draft.days.some((d) => d.sessions.length > 0);
}
