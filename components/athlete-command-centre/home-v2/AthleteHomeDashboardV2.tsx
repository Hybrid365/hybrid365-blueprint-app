"use client";

import { useCallback, useMemo, useState } from "react";
import {
  HYROX_BLOCKS,
  MOCK_ATHLETE,
  MOCK_CHECK_IN,
  MOCK_COACH_NOTES,
  MOCK_PROGRESS_STATS,
  MOCK_WEEK_RATIONALE,
  MOCK_WEEK_SESSIONS,
  type HyroxSession,
} from "@/app/lib/hyroxTeamDashboardMock";
import { sessionDetailFromHyroxSession } from "@/app/lib/hyroxAthleteDashboardLive";
import { portalAthleteDisplayName } from "@/app/lib/hyroxAthletePortalDisplay";
import { resolveUpcomingProgrammeSessions } from "@/app/lib/hyrox-team/modules/home/resolveUpcomingSessions";
import { buildHomeDailyDataChecklist, buildHomePainAlert } from "@/app/lib/hyrox-team/modules/home/buildHomeDailyDataChecklist";
import { resolveTodaysSessions } from "@/app/lib/hyrox-team/modules/today/resolveTodaySessions";
import { localDateYmdInTimeZone } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import type { HyroxDailyReadinessRow } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import {
  acknowledgeHyroxCoachNoteTodayAction,
  fetchHyroxDailyReadinessAction,
  saveHyroxDailyReadinessAction,
} from "@/app/lib/hyroxDailyReadinessAction";
import { isHyroxTodayV2EnabledClient } from "@/app/lib/hyrox-team/modules/today/featureFlag";
import { isHyroxPerformanceHubEnabledClient } from "@/app/lib/hyrox-team/modules/performanceHub/featureFlag";
import { PageContent } from "../athleteUi";
import { SessionDrawer } from "../SessionDrawer";
import { TodayReadinessCard } from "../today/TodayReadinessCard";
import { useAthleteDashboardLive } from "../useAthleteDashboardLive";
import { useAthletePortalOptional } from "../athletePortalContext";
import { useAthleteAdminPreview } from "../athletePortalAdminPreview";
import { HomeAthleteHeader } from "./HomeAthleteHeader";
import { HomeMissionSection } from "./HomeMissionSection";
import { HomeCoachInsight } from "./HomeCoachInsight";
import { HomeUpcomingProgramme } from "./HomeUpcomingProgramme";
import { HomePerformanceStatus } from "./HomePerformanceStatus";
import { HomeDailyDataChecklist } from "./HomeDailyDataChecklist";
import { HomeProgressInsights } from "./HomeProgressInsights";
import { useHomePerformanceHub } from "./useHomePerformanceHub";

const EMPTY_WEEK_RATIONALE = {
  weekRole: "Training week",
  whyMatters: "",
  prioritise: [] as string[],
  coachNote: "",
};

export function AthleteHomeDashboardV2({
  useLiveProgramme = false,
  readOnly = false,
}: {
  useLiveProgramme?: boolean;
  readOnly?: boolean;
}) {
  const portal = useAthletePortalOptional();
  const adminPreview = useAthleteAdminPreview();
  const {
    portalAthlete,
    useMockPreview,
    liveProgrammeLoading,
    programmePublishedLive,
    reloadLiveProgramme,
    liveProgramme,
    todayV2Enabled: todayV2Seed,
    performanceHubEnabled: performanceHubSeed,
  } = adminPreview
    ? {
        portalAthlete: adminPreview.portalAthlete,
        useMockPreview: false as const,
        liveProgrammeLoading: false as const,
        programmePublishedLive: adminPreview.programmePublishedLive,
        reloadLiveProgramme: async () => {},
        liveProgramme: adminPreview.liveProgramme,
        todayV2Enabled: adminPreview.todayV2Enabled,
        performanceHubEnabled: adminPreview.performanceHubEnabled,
      }
    : portal ?? {
        portalAthlete: null,
        useMockPreview: false,
        liveProgrammeLoading: false,
        programmePublishedLive: false,
        reloadLiveProgramme: async () => {},
        liveProgramme: null,
        todayV2Enabled: false,
        performanceHubEnabled: false,
      };

  const todayV2 = isHyroxTodayV2EnabledClient(todayV2Seed);
  const performanceHub = isHyroxPerformanceHubEnabledClient(performanceHubSeed);
  const timezone =
    adminPreview?.athleteTimezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";

  const { dashboardLive, readOnly: dashboardReadOnly } = useAthleteDashboardLive();
  const isReadOnly = readOnly || dashboardReadOnly;
  const useLive = useLiveProgramme && Boolean(dashboardLive);
  const showLiveLoading = useLiveProgramme && liveProgrammeLoading && !dashboardLive;
  const useMockData = useMockPreview;

  const { hub, loading: hubLoading, error: hubError } = useHomePerformanceHub(performanceHub);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | undefined>();
  const [drawerSession, setDrawerSession] = useState<HyroxSession | null>(null);
  const [drawerShowLogForm, setDrawerShowLogForm] = useState(false);
  const [sessionDetailOverride, setSessionDetailOverride] = useState<
    ReturnType<typeof sessionDetailFromHyroxSession> | null
  >(null);
  const [readinessPanelOpen, setReadinessPanelOpen] = useState(false);
  const [ackSaving, setAckSaving] = useState(false);

  const [readiness, setReadiness] = useState<HyroxDailyReadinessRow | null>(
    adminPreview?.initialReadiness ?? null
  );
  const [readinessSaving, setReadinessSaving] = useState(false);
  const [readinessKey, setReadinessKey] = useState<string | null>(null);

  const athleteId = adminPreview?.portalAthlete.id ?? portalAthlete?.id ?? null;
  const loadKey = `${athleteId ?? "none"}:${isReadOnly ? "ro" : "rw"}:${timezone}:home`;
  if (todayV2 && athleteId && readinessKey !== loadKey) {
    setReadinessKey(loadKey);
    if (adminPreview) {
      if (adminPreview.initialReadiness) {
        setReadiness(adminPreview.initialReadiness);
      } else {
        void fetch(
          `/api/hyrox/athletes/${encodeURIComponent(athleteId)}/today-snapshot?timezone=${encodeURIComponent(timezone)}&includeReadiness=1`,
          { credentials: "include" }
        )
          .then((res) => res.json())
          .then((json: { success?: boolean; readiness?: HyroxDailyReadinessRow | null }) => {
            if (json.success) setReadiness(json.readiness ?? null);
          })
          .catch(() => {});
      }
    } else if (!isReadOnly) {
      void fetchHyroxDailyReadinessAction({
        expectedAthleteId: athleteId,
        timezone,
      }).then((res) => {
        if (res.success) setReadiness(res.readiness ?? null);
      });
    }
  }

  const a = useLive && dashboardLive
    ? {
        name: dashboardLive.athleteName,
        statusLabel: dashboardLive.statusLabel,
        blockId: dashboardLive.blockId,
        currentWeek: dashboardLive.currentWeek,
        totalWeeks: dashboardLive.totalWeeks,
      }
    : useMockData
      ? {
          ...MOCK_ATHLETE,
          name: portalAthleteDisplayName(portalAthlete),
          statusLabel: MOCK_ATHLETE.status,
        }
      : {
          name: portalAthleteDisplayName(portalAthlete),
          statusLabel: showLiveLoading ? "Loading programme…" : "Programme live",
          blockId: 1 as 1 | 2 | 3,
          currentWeek: 1,
          totalWeeks: 12,
        };

  const weekRationale =
    useLive && dashboardLive
      ? dashboardLive.weekRationale
      : useMockData
        ? MOCK_WEEK_RATIONALE
        : EMPTY_WEEK_RATIONALE;

  const weekSessions = useMemo(
    () =>
      useLive && dashboardLive
        ? dashboardLive.sortedSessions
        : useMockData
          ? MOCK_WEEK_SESSIONS
          : [],
    [useLive, dashboardLive, useMockData]
  );

  const stats = useMemo(
    () =>
      useLive && dashboardLive
        ? {
            weeklyCompletionPct: dashboardLive.weeklyCompletionPct,
            sessionsCompleted: dashboardLive.sessionsCompleted,
            sessionsPlanned: dashboardLive.sessionsPlanned,
          }
        : useMockData
          ? MOCK_PROGRESS_STATS
          : { weeklyCompletionPct: 0, sessionsCompleted: 0, sessionsPlanned: 0 },
    [useLive, dashboardLive, useMockData]
  );

  const checkInDue =
    useLive && dashboardLive ? dashboardLive.checkInDue : useMockData && MOCK_CHECK_IN.status === "Due";
  const checkInStatus =
    useLive && dashboardLive ? dashboardLive.checkInStatus : useMockData ? MOCK_CHECK_IN.status : "After Week 1";
  const checkInComplete = !checkInDue && !checkInStatus.toLowerCase().includes("needs");

  const coachFocus =
    useLive && dashboardLive
      ? dashboardLive.coachingFocus
      : useMockData
        ? MOCK_COACH_NOTES.currentFocus
        : "";

  const programmeStartDate =
    liveProgramme?.programmeStartDate ?? liveProgramme?.athlete?.programme_start_date ?? null;
  const globalWeekNumber = liveProgramme?.liveGlobalWeek ?? a.currentWeek;
  const programmeWeeks = liveProgramme?.programmeWeeks?.map((w) => ({
    weekNumber: w.weekNumber,
    sessions: w.sessions,
  }));

  const todayYmd = localDateYmdInTimeZone(new Date(), timezone);
  const todaysSessions = useMemo(
    () =>
      resolveTodaysSessions({
        programmeStartDate: programmeStartDate ?? (useMockData ? "2026-01-06" : null),
        globalWeekNumber,
        sessions: weekSessions,
        todayYmd,
      }),
    [programmeStartDate, globalWeekNumber, weekSessions, todayYmd, useMockData]
  );

  const todaysMissionIds = useMemo(
    () => new Set(todaysSessions.map((s) => s.id)),
    [todaysSessions]
  );

  const upcoming = useMemo(() => {
    if (!useLive || !programmeStartDate || !programmeWeeks?.length) {
      return useMockData
        ? weekSessions
            .filter((s) => s.status === "upcoming")
            .slice(0, 4)
            .map((session) => ({ session, ymd: "" }))
        : [];
    }
    return resolveUpcomingProgrammeSessions({
      programmeStartDate,
      programmeWeeks,
      todayYmd,
      limit: 5,
      excludeSessionIds: todaysMissionIds,
    });
  }, [
    useLive,
    programmeStartDate,
    programmeWeeks,
    todayYmd,
    todaysMissionIds,
    useMockData,
    weekSessions,
  ]);

  const dailyDataItems = useMemo(
    () =>
      buildHomeDailyDataChecklist({
        todayV2Enabled: todayV2,
        readiness,
        todaysSessions,
        coachNoteReviewed: Boolean(readiness?.coach_note_reviewed_at),
        hasCoachNote: Boolean(coachFocus?.trim()),
        checkInDue,
        checkInComplete,
      }),
    [todayV2, readiness, todaysSessions, coachFocus, checkInDue, checkInComplete]
  );

  const painAlert = useMemo(
    () => buildHomePainAlert({ readiness, todaysSessions }),
    [readiness, todaysSessions]
  );

  const legacyProgressMetrics = useMemo(() => {
    if (performanceHub) return [];
    return [
      {
        label: "Weekly completion",
        value: `${stats.weeklyCompletionPct}%`,
        sub: `${stats.sessionsCompleted}/${stats.sessionsPlanned} sessions`,
      },
      {
        label: "Consistency",
        value: `${stats.weeklyCompletionPct}%`,
        sub: "This week's sessions",
      },
    ];
  }, [performanceHub, stats]);

  const openSession = useCallback(
    (session: HyroxSession, opts?: { showLogForm?: boolean }) => {
      if (!session.id) return;
      setSessionId(session.id);
      setSessionTitle(session.name);
      setDrawerShowLogForm(Boolean(opts?.showLogForm));
      setDrawerSession(session);
      setSessionDetailOverride(sessionDetailFromHyroxSession(session));
    },
    []
  );

  const openPrimarySession = useCallback(() => {
    const primary =
      todaysSessions[0] ??
      weekSessions.find((s) => s.status !== "complete") ??
      weekSessions[0];
    if (primary) openSession(primary);
  }, [todaysSessions, weekSessions, openSession]);

  const handleSessionUpdated = useCallback(
    async (updated: HyroxSession | null) => {
      if (updated) {
        setDrawerSession(updated);
        setSessionDetailOverride(sessionDetailFromHyroxSession(updated));
      }
      if (programmePublishedLive && !useMockPreview && !isReadOnly) {
        await reloadLiveProgramme();
      }
    },
    [programmePublishedLive, useMockPreview, reloadLiveProgramme, isReadOnly]
  );

  const handleSubmitReadiness = useCallback(
    async (input: Parameters<typeof saveHyroxDailyReadinessAction>[0]) => {
      if (!athleteId || isReadOnly) return false;
      setReadinessSaving(true);
      try {
        const res = await saveHyroxDailyReadinessAction({
          ...input,
          expectedAthleteId: athleteId,
        });
        if (res.success && res.readiness) {
          setReadiness(res.readiness);
          setReadinessPanelOpen(false);
          return true;
        }
        return false;
      } finally {
        setReadinessSaving(false);
      }
    },
    [athleteId, isReadOnly]
  );

  const handleAckCoachNote = useCallback(async () => {
    if (!athleteId || isReadOnly) return;
    setAckSaving(true);
    try {
      const res = await acknowledgeHyroxCoachNoteTodayAction({
        expectedAthleteId: athleteId,
        timezone,
      });
      if (res.success && res.readiness) setReadiness(res.readiness);
    } finally {
      setAckSaving(false);
    }
  }, [athleteId, isReadOnly, timezone]);

  const block = HYROX_BLOCKS.find((b) => b.id === a.blockId)!;
  const insightText = coachFocus || weekRationale.whyMatters || weekRationale.coachNote;
  const focusTags = weekRationale.prioritise?.length
    ? weekRationale.prioritise
    : weekRationale.weekRole
      ? [weekRationale.weekRole]
      : [];

  const missionProps = {
    weekSessions,
    programmeStartDate: programmeStartDate ?? (useMockData ? "2026-01-06" : null),
    globalWeekNumber,
    programmeWeeks,
    coachFocus,
    timezone,
    readOnly: isReadOnly,
    onOpenSession: openSession,
  };

  return (
    <PageContent width="full" className="!max-w-none space-y-6 sm:space-y-8">
      {showLiveLoading ? (
        <p className="text-sm text-zinc-500">Loading your programme…</p>
      ) : null}

      <HomeAthleteHeader
        athleteName={a.name}
        statusLabel={a.statusLabel}
        blockId={a.blockId}
        blockName={block.name}
        currentWeek={a.currentWeek}
        totalWeeks={a.totalWeeks}
        raceDate={liveProgramme?.athlete?.race_date}
        timezone={timezone}
      />

      <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
        <HomePerformanceStatus
          readiness={readiness}
          todayV2Enabled={todayV2}
          weeklyCompletionPct={stats.weeklyCompletionPct}
          sessionsCompleted={stats.sessionsCompleted}
          sessionsPlanned={stats.sessionsPlanned}
          hub={hub}
          hubLoading={hubLoading}
          performanceHubEnabled={performanceHub}
        />

        <div className="lg:col-span-5 space-y-4">
          <HomeDailyDataChecklist
            items={dailyDataItems}
            painAlert={painAlert}
            readOnly={isReadOnly}
            onReadinessAction={() => setReadinessPanelOpen(true)}
            onSessionAction={openPrimarySession}
            onCoachAck={() => void handleAckCoachNote()}
            acknowledgingCoach={ackSaving}
          />

          {(useLive && dashboardLive) || useMockData ? (
            <HomeMissionSection {...missionProps} />
          ) : null}
        </div>
      </div>

      {readinessPanelOpen && todayV2 && !isReadOnly ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-white">Morning readiness</p>
            <button
              type="button"
              onClick={() => setReadinessPanelOpen(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Close
            </button>
          </div>
          <TodayReadinessCard
            readiness={readiness}
            saving={readinessSaving}
            disabled={isReadOnly}
            onSubmit={handleSubmitReadiness}
          />
        </div>
      ) : null}

      <HomeProgressInsights
        performanceHubEnabled={performanceHub}
        hub={hub}
        hubLoading={hubLoading}
        hubError={hubError}
        legacyMetrics={legacyProgressMetrics}
        readOnly={isReadOnly}
      />

      <HomeCoachInsight
        insight={insightText}
        focusTags={focusTags}
        readOnly={isReadOnly}
      />

      <HomeUpcomingProgramme
        sessions={upcoming}
        onOpenSession={openSession}
        readOnly={isReadOnly}
      />

      <SessionDrawer
        sessionId={sessionId}
        session={drawerSession}
        sessionTitle={sessionTitle}
        sessionDetail={sessionDetailOverride}
        loggingEnabled={useLive && !useMockData && !isReadOnly}
        loggingBlockedMessage={
          isReadOnly ? "Session logging is disabled in admin preview mode." : undefined
        }
        useLiveApi={useLive && !useMockData && !isReadOnly}
        initialShowLogForm={drawerShowLogForm}
        onSessionUpdated={(updated) => void handleSessionUpdated(updated)}
        onClose={() => {
          setSessionId(null);
          setDrawerSession(null);
          setDrawerShowLogForm(false);
          setSessionDetailOverride(null);
        }}
      />
    </PageContent>
  );
}
