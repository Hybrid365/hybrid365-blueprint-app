import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";
import type { PortalAthleteSummary } from "@/components/athlete-command-centre/athletePortalContext";
import {
  buildHyroxProgrammeCalendarContext,
  resolveProgrammeCheckInSummary,
  resolveProgrammeNextSession,
  resolveProgrammeRaceReadiness,
  resolveProgrammeWeeklyFocusLabel,
  upcomingSessionsForCalendarWeek,
  type ProgrammeNextSessionState,
} from "@/app/lib/hyroxAthleteProgrammeCalendar";
import { formatProgrammeDayLabel, sortProgrammeSessions, type ResolvedNextSession } from "@/app/lib/hyroxAthleteProgrammeSort";
import { HYROX_BLOCKS } from "@/app/lib/hyroxTeamDashboardMock";
import type { BenchmarkSnapshotItem } from "@/app/lib/dashboardWeekTracking";
import type { HyroxSession, SessionDetail } from "@/app/lib/hyroxTeamDashboardMock";
export type HyroxWeekTrackingLive = {
  sessionsCompleted: number;
  sessionsPlanned: number;
  runsCompleted: number;
  runsPlanned: number;
  weeklyRunKm: string;
  weeklyRunKmTarget: string;
  strengthCompleted: number;
  strengthPlanned: number;
  hybridCompleted: number;
  hybridPlanned: number;
  checkInComplete: boolean;
  checkInSub: string;
  weeklyCompletionPct: number;
  modifiedSessions: number;
  missedSessions: number;
  consistencyLabel: string;
};

export type MetricSummary = {
  label: string;
  value: string;
  sub?: string;
  awaiting?: boolean;
};

export type AthleteDashboardLiveView = {
  athleteName: string;
  statusLabel: string;
  raceLabel: string;
  targetTime: string;
  blockId: 1 | 2 | 3;
  blockName: string;
  currentWeek: number;
  totalWeeks: number;
  weeklyCompletionPct: number;
  sessionsCompleted: number;
  sessionsPlanned: number;
  nextSession: ResolvedNextSession | null;
  nextSessionState: ProgrammeNextSessionState;
  nextSessionMessage: string | null;
  weeklyFocusLabel: string;
  displayWeekInBlock: number;
  missingProgrammeStartDate: boolean;
  upcomingThisWeek: HyroxSession[];
  weekRationale: {
    weekRole: string;
    whyMatters: string;
    prioritise: string[];
    coachNote: string;
  };
  coachingFocus: string;
  checkInStatus: string;
  checkInSub: string;
  checkInDue: boolean;
  raceReadiness: MetricSummary;
  consistency: MetricSummary;
  benchmarkSnapshot: BenchmarkSnapshotItem[];
  thresholdSummary: MetricSummary;
  runVolumeSummary: MetricSummary;
  bodyweightSummary: MetricSummary;
  chartsAvailable: boolean;
  sortedSessions: HyroxSession[];
  benchmarksLoading: boolean;
  benchmarksError: string | null;
  weekTracking: HyroxWeekTrackingLive;
};

function countSessions(sessions: HyroxSession[], types: HyroxSession["type"][]) {
  const planned = sessions.filter((s) => types.includes(s.type)).length;
  const completed = sessions.filter((s) => types.includes(s.type) && s.status === "complete").length;
  return { completed, planned };
}

function buildWeekTrackingFromSessions(
  sessions: HyroxSession[],
  weeklyCompletionPct: number,
  checkInSub: string
): HyroxWeekTrackingLive {
  const all = { completed: sessions.filter((s) => s.status === "complete").length, planned: sessions.length };
  const runs = countSessions(sessions, ["Run", "Aerobic"]);
  const strength = countSessions(sessions, ["Strength"]);
  const hybrid = countSessions(sessions, ["Hybrid"]);
  return {
    sessionsCompleted: all.completed,
    sessionsPlanned: all.planned,
    runsCompleted: runs.completed,
    runsPlanned: runs.planned,
    weeklyRunKm: "—",
    weeklyRunKmTarget: "—",
    strengthCompleted: strength.completed,
    strengthPlanned: strength.planned,
    hybridCompleted: hybrid.completed,
    hybridPlanned: hybrid.planned,
    checkInComplete: false,
    checkInSub,
    weeklyCompletionPct,
    modifiedSessions: sessions.filter((s) => s.status === "modified").length,
    missedSessions: sessions.filter((s) => s.status === "missed").length,
    consistencyLabel: `${weeklyCompletionPct}% of this week's sessions complete`,
  };
}

const TEST_LABELS: Record<string, string> = {
  "5k": "5km Run",
  ski: "1km SkiErg",
  row2k: "2km Row",
  compromised: "Mini Compromised",
  farmer_hold: "Farmer Hold",
  sandbag_lunge: "Sandbag Lunge",
  wall_ball: "Wall Ball",
  sled_exposure: "Sled Exposure",
};

function formatBenchmarkValue(submission: { kind?: string; totalTime?: string; time?: string }): string {
  if ("totalTime" in submission && submission.totalTime) return submission.totalTime;
  if ("time" in submission && submission.time) return submission.time;
  return "Submitted";
}

export function buildBenchmarkSnapshotFromTesting(
  benchmarks: Record<string, { submission?: Record<string, unknown> }>
): BenchmarkSnapshotItem[] {
  const order = ["5k", "ski", "row2k", "compromised", "farmer_hold", "sandbag_lunge", "wall_ball"];
  const items: BenchmarkSnapshotItem[] = [];
  for (const id of order) {
    const hit = benchmarks[id];
    if (!hit?.submission) continue;
    const sub = hit.submission as { kind?: string; totalTime?: string; time?: string };
    items.push({
      label: TEST_LABELS[id] ?? id,
      latest: formatBenchmarkValue(sub),
      change: null,
      logged: true,
    });
  }
  return items.slice(0, 4);
}

export type LiveBenchmarkTrackerRow = {
  id: string;
  name: string;
  baseline: string;
  latest: string;
  target: string;
  change: string;
  progressPct: number;
  positive: boolean;
};

export function buildLiveBenchmarkTracker(
  benchmarks: Record<string, { submission?: Record<string, unknown> }>
): LiveBenchmarkTrackerRow[] {
  const order: Array<{ id: string; name: string }> = [
    { id: "5k", name: "5km Run" },
    { id: "ski", name: "1km SkiErg" },
    { id: "row2k", name: "2km Row" },
    { id: "compromised", name: "Mini Compromised Test" },
    { id: "farmer_hold", name: "Farmer Hold" },
    { id: "sandbag_lunge", name: "Sandbag Lunge" },
    { id: "wall_ball", name: "Wall Ball" },
    { id: "sled_exposure", name: "Sled Exposure" },
  ];
  return order
    .filter((o) => benchmarks[o.id]?.submission)
    .map((o) => {
      const sub = benchmarks[o.id]!.submission as { totalTime?: string; time?: string };
      const latest = formatBenchmarkValue(sub);
      return {
        id: o.id,
        name: o.name,
        baseline: "—",
        latest,
        target: "Coach to set target",
        change: "Submitted",
        progressPct: 0,
        positive: false,
      };
    });
}

/** Resolved session or status message for dashboard cards when week/block is complete. */
export function nextSessionDisplayForDashboard(
  live: AthleteDashboardLiveView
): ResolvedNextSession & { actionable: boolean } {
  if (live.nextSession) {
    return { ...live.nextSession, actionable: true };
  }
  const label =
    live.nextSessionMessage ??
    (live.nextSessionState === "upcoming" ? "Upcoming session" : "No session scheduled");
  const sub =
    live.nextSessionState === "upcoming"
      ? "Starts with your programme"
      : live.nextSessionState === "block_complete"
        ? "Coach will publish your next block"
        : "";
  return {
    sessionId: "",
    name: label,
    day: "",
    dateLabel: sub,
    type: "Recovery",
    duration: "—",
    rpeTarget: "—",
    objective: sub,
    coachNote: "",
    priority: "Supporting",
    actionable: false,
  };
}

export function sessionDetailFromHyroxSession(session: HyroxSession): SessionDetail {
  const prescriptionNote = session.coachNote?.trim();
  return {
    sessionId: session.id,
    weekLabel: formatProgrammeDayLabel(session.day, session.timeOfDay),
    categoryTag: session.focus || session.type,
    objective: session.intent,
    durationMin: parseInt(session.duration, 10) || 45,
    rpeTarget: session.rpeTarget.replace(/[^0-9]/g, "") || "7",
    hrZone: "Per programme prescription",
    targetPaceLoad: "See session prescription",
    tags: [session.type, session.focus].filter(Boolean),
    warmUp: ["Follow coach warm-up guidance in session notes"],
    mainSet: [session.intent],
    coolDown: ["Easy flush 5–10 min"],
    coachNote:
      prescriptionNote ||
      "Complete at prescribed RPE. Log honestly in your weekly check-in when available.",
    recordFields: ["Session RPE", "Duration", "Notes"],
  };
}

export function buildAthleteDashboardLiveView(params: {
  portalAthlete: PortalAthleteSummary | null;
  liveProgramme: AthleteLiveProgrammePayload | null;
  programmePublishedLive: boolean;
  benchmarkSnapshot?: BenchmarkSnapshotItem[];
  benchmarksLoading?: boolean;
  benchmarksError?: string | null;
}): AthleteDashboardLiveView | null {
  if (!params.programmePublishedLive || !params.liveProgramme) return null;

  const lp = params.liveProgramme;
  const programmeWeeks = lp.programmeWeeks ?? [];

  const calendar = buildHyroxProgrammeCalendarContext({
    programmeStartDate: lp.programmeStartDate,
    programmeLengthWeeks: lp.programmeLengthWeeks,
    programmeWeeks,
    currentBlock: lp.athlete.current_block,
  });

  const activeBundle = calendar.activeWeekBundle;
  const sessionSource = activeBundle?.sessions?.length
    ? activeBundle.sessions
    : (lp.sessions ?? []);
  const sortedSessions = sortProgrammeSessions(sessionSource);
  const completed = sortedSessions.filter((s) => s.status === "complete").length;
  const planned = sortedSessions.length;
  const weeklyCompletionPct = planned ? Math.round((completed / planned) * 100) : 0;

  const nextResolution = resolveProgrammeNextSession({
    programmeStartDate: calendar.programmeStartDate,
    programmeWeeks,
    activeWeekBundle: activeBundle,
    beforeProgrammeStart: calendar.beforeProgrammeStart,
  });
  const nextSession = nextResolution.session;
  const upcomingThisWeek = upcomingSessionsForCalendarWeek(
    sortedSessions,
    nextSession,
    3
  );

  const blockId = Math.min(
    calendar.blockNumber,
    3
  ) as 1 | 2 | 3;
  const block = HYROX_BLOCKS.find((b) => b.id === blockId) ?? HYROX_BLOCKS[0];

  const bundleRationale = activeBundle?.week
    ? {
        weekRole: activeBundle.weekRole,
        whyMatters:
          activeBundle.week.athlete_facing_note ??
          lp.weekRationale?.whyMatters ??
          "",
        prioritise: lp.weekRationale?.prioritise ?? [],
        coachNote: activeBundle.week.coach_note ?? lp.weekRationale?.coachNote ?? "",
      }
    : (lp.weekRationale ?? {
        weekRole: resolveProgrammeWeeklyFocusLabel(calendar),
        whyMatters: "",
        prioritise: [] as string[],
        coachNote: "",
      });

  const checkIn = resolveProgrammeCheckInSummary(calendar);
  const raceReadiness = resolveProgrammeRaceReadiness(calendar);
  const weeklyFocusLabel = resolveProgrammeWeeklyFocusLabel(calendar);

  const raceParts = [lp.athlete.race_name, lp.athlete.race_category].filter(Boolean);
  const athleteName =
    lp.athlete.name?.trim() ||
    params.portalAthlete?.name?.trim() ||
    "Athlete";

  const benchmarkSnapshot = params.benchmarkSnapshot ?? [];

  if (process.env.NODE_ENV === "development" && calendar.missingStartDate) {
    console.warn(
      "[hyrox/dashboard] programme_start_date missing — week calendar and next session may be inaccurate."
    );
  }

  return {
    athleteName,
    statusLabel: calendar.beforeProgrammeStart ? "Programme upcoming" : "Programme live",
    raceLabel: raceParts.length ? raceParts.join(" · ") : "Race TBC",
    targetTime: lp.athlete.target_time ?? "—",
    blockId,
    blockName: block.name,
    currentWeek: calendar.blockWeekInCycle,
    totalWeeks: calendar.programmeLengthWeeks,
    weeklyCompletionPct,
    sessionsCompleted: completed,
    sessionsPlanned: planned,
    nextSession,
    nextSessionState: nextResolution.state,
    nextSessionMessage: nextResolution.message,
    weeklyFocusLabel,
    displayWeekInBlock: calendar.blockWeekInCycle,
    missingProgrammeStartDate: calendar.missingStartDate,
    upcomingThisWeek,
    weekRationale: {
      weekRole: weeklyFocusLabel,
      whyMatters: bundleRationale.whyMatters,
      prioritise: bundleRationale.prioritise ?? [],
      coachNote: bundleRationale.coachNote,
    },
    coachingFocus:
      bundleRationale.coachNote ||
      bundleRationale.whyMatters ||
      "Follow this week's sessions — log RPE honestly for your coach.",
    checkInStatus: checkIn.status,
    checkInSub: checkIn.sub,
    checkInDue: checkIn.due,
    raceReadiness,
    consistency: {
      label: "Consistency",
      value: `${weeklyCompletionPct}%`,
      sub: `${completed}/${planned} sessions this week`,
    },
    benchmarkSnapshot,
    benchmarksLoading: params.benchmarksLoading ?? false,
    benchmarksError: params.benchmarksError ?? null,
    weekTracking: buildWeekTrackingFromSessions(
      sortedSessions,
      weeklyCompletionPct,
      checkIn.sub
    ),
    thresholdSummary: {
      label: "Threshold minutes",
      value: "Awaiting data",
      sub: "Logged after sessions with threshold work",
      awaiting: true,
    },
    runVolumeSummary: {
      label: "Run volume",
      value: "Awaiting data",
      sub: "Tracked from completed run sessions",
      awaiting: true,
    },
    bodyweightSummary: {
      label: "Bodyweight",
      value: "Awaiting data",
      sub: "From weekly check-ins",
      awaiting: true,
    },
    chartsAvailable: false,
    sortedSessions,
  };
}
