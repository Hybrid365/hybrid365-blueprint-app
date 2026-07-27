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
import {
  resolveTodaysSessions,
} from "@/app/lib/hyrox-team/modules/today/resolveTodaySessions";
import { localDateYmdInTimeZone } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import type { HyroxDailyReadinessRow } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import {
  fetchHyroxDailyReadinessAction,
  saveHyroxDailyReadinessAction,
} from "@/app/lib/hyroxDailyReadinessAction";
import { isHyroxTodayV2EnabledClient } from "@/app/lib/hyrox-team/modules/today/featureFlag";
import { isHyroxPerformanceHubEnabledClient } from "@/app/lib/hyrox-team/modules/performanceHub/featureFlag";
import { PageContent } from "../athleteUi";
import { SessionDrawer } from "../SessionDrawer";
import { useAthleteDashboardLive } from "../useAthleteDashboardLive";
import { useAthletePortalOptional } from "../athletePortalContext";
import { useAthleteAdminPreview } from "../athletePortalAdminPreview";
import { HomeAthleteHeader } from "./HomeAthleteHeader";
import { HomeMissionSection } from "./HomeMissionSection";
import { HomeWeeklyStateRow } from "./HomeWeeklyStateRow";
import { HomeCoachInsight } from "./HomeCoachInsight";
import { HomeProgressSnapshot } from "./HomeProgressSnapshot";
import { HomeUpcomingProgramme } from "./HomeUpcomingProgramme";

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

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | undefined>();
  const [drawerSession, setDrawerSession] = useState<HyroxSession | null>(null);
  const [drawerShowLogForm, setDrawerShowLogForm] = useState(false);
  const [sessionDetailOverride, setSessionDetailOverride] = useState<
    ReturnType<typeof sessionDetailFromHyroxSession> | null
  >(null);

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
  const checkInSub =
    useLive && dashboardLive
      ? dashboardLive.checkInSub
      : useMockData
        ? `Due ${MOCK_CHECK_IN.dueLabel}`
        : "Weekly check-ins unlock after your first training week";

  const coachFocus =
    useLive && dashboardLive
      ? dashboardLive.coachingFocus
      : useMockData
        ? MOCK_COACH_NOTES.currentFocus
        : "Your coach will share focus notes when your programme is live.";

  const programmeStartDate =
    liveProgramme?.programmeStartDate ?? liveProgramme?.athlete?.programme_start_date ?? null;
  const globalWeekNumber = liveProgramme?.liveGlobalWeek ?? a.currentWeek;
  const programmeWeeks = liveProgramme?.programmeWeeks?.map((w) => ({
    weekNumber: w.weekNumber,
    sessions: w.sessions,
  }));

  const todayYmd = localDateYmdInTimeZone(new Date(), timezone);
  const todaysMissionIds = useMemo(() => {
    if (!useLive || !programmeStartDate) return new Set<string>();
    const todays = resolveTodaysSessions({
      programmeStartDate,
      globalWeekNumber,
      sessions: weekSessions,
      todayYmd,
    });
    return new Set(todays.map((s) => s.id));
  }, [useLive, programmeStartDate, globalWeekNumber, weekSessions, todayYmd]);

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
          return true;
        }
        return false;
      } finally {
        setReadinessSaving(false);
      }
    },
    [athleteId, isReadOnly]
  );

  const block = HYROX_BLOCKS.find((b) => b.id === a.blockId)!;
  const insightText = coachFocus || weekRationale.whyMatters || weekRationale.coachNote;
  const focusTags = weekRationale.prioritise?.length
    ? weekRationale.prioritise
    : weekRationale.weekRole
      ? [weekRationale.weekRole]
      : [];

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

      {useLive && dashboardLive ? (
        <HomeMissionSection
          weekSessions={weekSessions}
          programmeStartDate={programmeStartDate}
          globalWeekNumber={globalWeekNumber}
          programmeWeeks={programmeWeeks}
          coachFocus={coachFocus}
          timezone={timezone}
          readOnly={isReadOnly}
          onOpenSession={openSession}
        />
      ) : useMockData ? (
        <HomeMissionSection
          weekSessions={weekSessions}
          programmeStartDate="2026-01-06"
          globalWeekNumber={1}
          coachFocus={coachFocus}
          readOnly={isReadOnly}
          onOpenSession={openSession}
        />
      ) : null}

      <HomeWeeklyStateRow
        todayV2Enabled={todayV2}
        readiness={readiness}
        readinessSaving={readinessSaving}
        readinessDisabled={isReadOnly}
        onSubmitReadiness={handleSubmitReadiness}
        weeklyCompletionPct={stats.weeklyCompletionPct}
        sessionsCompleted={stats.sessionsCompleted}
        sessionsPlanned={stats.sessionsPlanned}
        checkInStatus={checkInStatus}
        checkInSub={checkInSub}
        checkInDue={checkInDue}
        readOnly={isReadOnly}
      />

      <HomeCoachInsight
        insight={insightText}
        focusTags={focusTags}
        weekRole={weekRationale.weekRole}
        readOnly={isReadOnly}
      />

      <HomeProgressSnapshot
        performanceHubEnabled={performanceHub}
        legacyMetrics={legacyProgressMetrics}
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
