/**
 * Builds a standard CoachDraftWeek for Hybrid365 Performance Testing — Test Week 1 (Version 2).
 *
 * Newly created weeks always use performanceTestingVersion: 2 and include full
 * ResolvedSessionPrescription details for Programme Builder View + athlete SessionDrawer.
 *
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
  PERFORMANCE_TEST_WEEK_ID,
  PERFORMANCE_TESTING_VERSION,
  type PerformanceTestType,
} from "@/app/lib/hyroxPerformanceTestingTypes";
import {
  PERFORMANCE_TESTING_SESSION_DETAILS,
  buildResolvedPrescriptionFromTestingDetail,
  detailKeyForPerformanceTestType,
  fillMissingFieldsFromTestingDetail,
  mainSetHasCompromisedHyroxSequence,
  type PerformanceTestingDetailKey,
} from "@/app/lib/hyroxPerformanceTestingSessionDetails";

export const PERFORMANCE_TESTING_WEEK_TEMPLATE_NAME =
  "Hybrid365 Performance Testing — Test Week 1";

function nextDraftId(): string {
  return `pt-${crypto.randomUUID().slice(0, 8)}`;
}

function detailForKey(key: PerformanceTestingDetailKey) {
  return PERFORMANCE_TESTING_SESSION_DETAILS[key];
}

function buildPerformanceTestEditConfig(
  testType: PerformanceTestType,
  detailKey: PerformanceTestingDetailKey
): CoachSessionEditConfig {
  const detail = detailForKey(detailKey);
  return {
    kind: "performance_test",
    sessionName: detail.title,
    testType,
    protocol: [...detail.warmup, "—", ...detail.mainSet, "—", ...detail.cooldown].join("\n"),
    requiredFields: detail.whatToRecord,
    optionalFields: [],
    scalingNotes: detail.scaling.join("\n"),
    filmPrompt: detail.filmPrompt,
    coachNote: detail.coachNote,
    objective: detail.purpose,
    rpeTarget: detail.rpeTarget,
    whatToRecord: detail.whatToRecord,
    performanceTestWeekId: PERFORMANCE_TEST_WEEK_ID,
    warmUpLines: detail.warmup,
    mainSetLines: detail.mainSet,
    coolDownLines: detail.cooldown,
    coachPacingNote: detail.pacingNote,
  };
}

function buildPerformanceTestSession(params: {
  timeOfDay: SandboxTimeOfDay;
  testType: PerformanceTestType;
  detailKey?: PerformanceTestingDetailKey;
}): CoachDraftSession {
  const detailKey = params.detailKey ?? params.testType;
  const detail = detailForKey(detailKey);
  const badges: CoachDraftSession["badges"] = [
    ...(params.timeOfDay === "AM"
      ? (["AM"] as const)
      : params.timeOfDay === "PM"
        ? (["PM"] as const)
        : (["Main"] as const)),
    "Performance Test",
  ];

  const sessionLibraryId = `performance_test_${params.testType}`;
  const prescription = buildResolvedPrescriptionFromTestingDetail(detail, sessionLibraryId);
  const editConfig = buildPerformanceTestEditConfig(params.testType, detailKey);

  return {
    draftId: nextDraftId(),
    timeOfDay: params.timeOfDay,
    badges,
    title: detail.title,
    sessionType: "testing",
    duration: detail.duration,
    intensity: detail.rpeTarget,
    rpeHr: detail.rpeTarget,
    isKeySession: detail.hardDay,
    isOptional: false,
    rationale: detail.purpose,
    sessionId: sessionLibraryId,
    prescription,
    sessionDetail: null,
    thresholdMinutes: undefined,
    emom: null,
    coachNote: detail.coachNote,
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
  detailKey: "recovery_day" | "mobility_technique" | "saturday_recovery";
}): CoachDraftSession {
  const detail = detailForKey(params.detailKey);
  const sessionLibraryId = `performance_test_${params.detailKey}`;
  const prescription = buildResolvedPrescriptionFromTestingDetail(detail, sessionLibraryId);

  return {
    draftId: nextDraftId(),
    timeOfDay: params.timeOfDay,
    badges: ["Main"],
    title: detail.title,
    sessionType: "tempo_aerobic_quality",
    duration: detail.duration,
    intensity: detail.rpeTarget,
    rpeHr: detail.rpeTarget,
    isKeySession: false,
    isOptional: false,
    rationale: detail.purpose,
    sessionId: sessionLibraryId,
    prescription,
    sessionDetail: null,
    thresholdMinutes: undefined,
    emom: null,
    coachNote: detail.coachNote,
    editConfig: {
      kind: "easy_aerobic",
      sessionName: detail.title,
      objective: detail.purpose,
      warmUpLines: detail.warmup,
      mainSetLines: detail.mainSet,
      coolDownLines: detail.cooldown,
      whatToRecord: detail.whatToRecord,
      rpeTarget: detail.rpeTarget,
      durationMinutes: detail.durationMinutes,
      hrZone: "Z1–Z2",
      coachNote: detail.coachNote,
      filmPrompt: detail.filmPrompt,
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
      ...buildDayShell("Mon", "5km Run Performance Test", "Performance test"),
      sessions: [
        buildPerformanceTestSession({
          timeOfDay: "Main",
          testType: "five_k_run",
        }),
      ],
    },
    {
      ...buildDayShell("Tue", "Easy Aerobic Recovery", "Recovery", "recovery", { hardDay: false }),
      sessions: [
        buildRecoveryProgrammeSession({
          timeOfDay: "Main",
          detailKey: "recovery_day",
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
          detailKey: "mobility_technique",
        }),
      ],
    },
    {
      ...buildDayShell("Thu", "AM SkiErg + PM RowErg", "Engine tests"),
      sessions: [
        buildPerformanceTestSession({
          timeOfDay: "AM",
          testType: "ski_2k",
        }),
        buildPerformanceTestSession({
          timeOfDay: "PM",
          testType: "row_2k",
        }),
      ],
    },
    {
      ...buildDayShell("Fri", "Controlled Strength Assessment", "Strength test"),
      sessions: [
        buildPerformanceTestSession({
          timeOfDay: "Main",
          testType: "strength_assessment",
        }),
      ],
    },
    {
      ...buildDayShell("Sat", "Recovery and HYROX Benchmark Preparation", "Recovery", "recovery", {
        hardDay: false,
        stationFocus: null,
      }),
      sessions: [
        buildRecoveryProgrammeSession({
          timeOfDay: "Main",
          detailKey: "saturday_recovery",
        }),
      ],
    },
    {
      ...buildDayShell("Sun", "Hybrid365 Compromised HYROX Benchmark", "Compromised test", "testing", {
        hardDay: true,
        stationFocus: "Continuous HYROX simulation",
      }),
      sessions: [
        buildPerformanceTestSession({
          timeOfDay: "Main",
          testType: "compromised_hyrox_benchmark",
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
    performanceTestingVersion: PERFORMANCE_TESTING_VERSION,
  };
}

export function draftHasSessions(draft: CoachDraftWeek): boolean {
  return draft.days.some((d) => d.sessions.length > 0);
}

function resolveDetailKeyForSession(session: CoachDraftSession): PerformanceTestingDetailKey | null {
  const testType =
    session.performanceMetadata?.performanceTestType ??
    session.editConfig?.testType ??
    (session.sessionId?.startsWith("performance_test_")
      ? session.sessionId.replace("performance_test_", "")
      : null);

  const title = session.title.toLowerCase();

  if (
    testType === "saturday_recovery" ||
    title.includes("benchmark preparation") ||
    (title.includes("recovery") && title.includes("preparation"))
  ) {
    return "saturday_recovery";
  }
  if (
    testType === "recovery_day" ||
    title.includes("easy aerobic recovery") ||
    title === "easy recovery" ||
    (title.includes("easy recovery") && !title.includes("preparation"))
  ) {
    return "recovery_day";
  }
  if (
    testType === "mobility_technique" ||
    title.includes("mobility and technique") ||
    title.includes("rest, mobility")
  ) {
    return "mobility_technique";
  }

  const fromType = detailKeyForPerformanceTestType(testType);
  if (fromType) return fromType;

  const sid = session.sessionId ?? "";
  if (sid.includes("saturday_recovery")) return "saturday_recovery";
  if (sid.includes("recovery_day")) return "recovery_day";
  if (sid.includes("mobility_technique")) return "mobility_technique";

  if (title.includes("5km") || title.includes("5 km")) return "five_k_run";
  if (title.includes("skierg") || title.includes("ski erg")) return "ski_2k";
  if (title.includes("rowerg") || title.includes("row erg")) return "row_2k";
  if (title.includes("strength assessment")) return "strength_assessment";
  if (title.includes("compromised hyrox") || title.includes("hyrox benchmark")) {
    return "compromised_hyrox_benchmark";
  }

  return null;
}

function sessionNeedsDetailHydration(session: CoachDraftSession): boolean {
  const p = session.prescription;
  const cfg = session.editConfig;
  const isSunday =
    session.performanceMetadata?.performanceTestType === "compromised_hyrox_benchmark" ||
    session.editConfig?.testType === "compromised_hyrox_benchmark" ||
    Boolean(session.sessionId?.includes("compromised_hyrox_benchmark")) ||
    session.title.toLowerCase().includes("compromised hyrox");

  if (isSunday) {
    const main = p?.mainSet ?? cfg.mainSetLines ?? [];
    if (!mainSetHasCompromisedHyroxSequence(main)) return true;
  }

  return (
    !p ||
    !p.mainSet?.length ||
    !p.warmup?.length ||
    !cfg.mainSetLines?.length ||
    !cfg.warmUpLines?.length
  );
}

/**
 * Fill missing Performance Testing prescription details on a draft week.
 * Only fills empty fields — does not overwrite coach-edited content.
 * Skips Version 1 legacy weeks unless forceV2Template is true.
 */
export function hydrateMissingPerformanceTestingDetails(
  draft: CoachDraftWeek,
  options?: { forceV2Template?: boolean }
): { draft: CoachDraftWeek; hydratedCount: number; skippedLegacy: boolean } {
  const version = draft.performanceTestingVersion;
  const looksLikeV1 = draft.days.some((d) =>
    d.sessions.some(
      (s) =>
        s.performanceMetadata?.performanceTestType === "compromised_sled_run" ||
        s.performanceMetadata?.performanceTestType === "sled_push" ||
        s.editConfig?.testType === "compromised_sled_run"
    )
  );

  if (looksLikeV1 && version !== PERFORMANCE_TESTING_VERSION && !options?.forceV2Template) {
    return { draft, hydratedCount: 0, skippedLegacy: true };
  }

  let hydratedCount = 0;
  const days = draft.days.map((day) => ({
    ...day,
    sessions: day.sessions.map((session) => {
      const detailKey = resolveDetailKeyForSession(session);
      if (!detailKey) return session;
      if (!sessionNeedsDetailHydration(session) && !options?.forceV2Template) {
        // Still fill any individually missing fields
      }
      const before = JSON.stringify({
        p: session.prescription?.mainSet ?? [],
        w: session.editConfig.warmUpLines ?? [],
        m: session.editConfig.mainSetLines ?? [],
        hasSeq: mainSetHasCompromisedHyroxSequence(
          session.prescription?.mainSet ?? session.editConfig.mainSetLines
        ),
      });
      const detail = detailForKey(detailKey);
      const sessionLibraryId =
        session.sessionId ?? `performance_test_${detailKey}`;
      const next = fillMissingFieldsFromTestingDetail(session, detail, sessionLibraryId);
      const after = JSON.stringify({
        p: next.prescription?.mainSet ?? [],
        w: next.editConfig.warmUpLines ?? [],
        m: next.editConfig.mainSetLines ?? [],
        hasSeq: mainSetHasCompromisedHyroxSequence(
          next.prescription?.mainSet ?? next.editConfig.mainSetLines
        ),
      });
      if (before !== after) hydratedCount += 1;
      return next;
    }),
  }));

  return {
    draft: {
      ...draft,
      days,
      performanceTestingVersion: draft.performanceTestingVersion ?? PERFORMANCE_TESTING_VERSION,
    },
    hydratedCount,
    skippedLegacy: false,
  };
}

export function draftLooksLikePerformanceTestingWeek(draft: CoachDraftWeek): boolean {
  if (draft.performanceTestingVersion === 1 || draft.performanceTestingVersion === 2) return true;
  return draft.days.some((d) =>
    d.sessions.some(
      (s) =>
        s.performanceMetadata?.isPerformanceTest === true ||
        s.editConfig?.kind === "performance_test" ||
        Boolean(s.sessionId?.startsWith("performance_test_"))
    )
  );
}
