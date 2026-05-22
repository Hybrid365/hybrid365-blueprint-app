"use client";

import { Lock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BLOCK_WEEK_FOCUS_LABELS } from "@/app/lib/hyroxCoachProgrammeDraft";
import { sessionDetailFromHyroxSession } from "@/app/lib/hyroxAthleteDashboardLive";
import {
  HYROX_BLOCKS,
  MOCK_ATHLETE,
  MOCK_WEEK_RATIONALE,
  MOCK_WEEK_SESSIONS,
  type HyroxSession,
} from "@/app/lib/hyroxTeamDashboardMock";
import {
  ATHLETE_PAGE_META,
  PageContent,
  PageHeader,
  SectionTitle,
  ProgressBar,
  eyebrowClass,
  athleteCard,
  athleteCardHighlight,
  athleteCardPadding,
} from "./athleteUi";
import { SessionDrawer } from "./SessionDrawer";
import { WeekSessionCard } from "./WeekSessionCard";
import { useAthleteDashboardLive } from "./useAthleteDashboardLive";
import { portalAthleteDisplayName } from "@/app/lib/hyroxAthletePortalDisplay";
import { useAthletePortal } from "./athletePortalContext";
import { resolveDefaultProgrammeWeekNumber } from "@/app/lib/hyroxAthleteProgrammeCalendar";
import type { AthleteWeekCalendarStatus } from "@/app/lib/hyroxAthleteProgrammeTypes";
import type { AthleteLiveProgrammePayload } from "./useAthleteLiveProgramme";

type WeekTabMode = "active" | "upcoming" | "past" | "not_generated" | "locked";

type WeekTab = {
  label: string;
  subtitle: string;
  dateRangeLabel: string | null;
  globalWeek: number;
  mode: WeekTabMode;
  generated: boolean;
};

const UPCOMING_COPY = "Upcoming — subject to coach review";
const PLANNED_COPY = "Planned — may be adjusted after check-ins.";

function calendarStatusToTabMode(status: AthleteWeekCalendarStatus | undefined): WeekTabMode {
  if (!status || status === "not_generated") return "not_generated";
  if (status === "locked") return "locked";
  if (status === "live") return "active";
  if (status === "past") return "past";
  return "upcoming";
}

function chipLabelForMode(mode: WeekTabMode): string {
  if (mode === "active") return "Live";
  if (mode === "past") return "Past";
  if (mode === "locked") return "Locked";
  if (mode === "not_generated") return "Not generated";
  return "Upcoming";
}

function upcomingSubcopy(mode: WeekTabMode): string {
  if (mode === "upcoming") return UPCOMING_COPY;
  if (mode === "active") return "";
  return PLANNED_COPY;
}

function countProgrammeSessions(programme: AthleteLiveProgrammePayload | null | undefined): number {
  if (!programme?.programmeWeeks?.length) return programme?.sessions?.length ?? 0;
  return programme.programmeWeeks.reduce((n, w) => n + (w.sessions?.length ?? 0), 0);
}

function ProgrammePageClientDebug({
  selectedSessionId,
  effectiveProgramme,
  effectivePublished,
  programmeSource,
  invalidSessionCleared,
}: {
  selectedSessionId: string | null;
  effectiveProgramme: AthleteLiveProgrammePayload | null | undefined;
  effectivePublished: boolean;
  programmeSource: "server" | "client" | "none";
  invalidSessionCleared: boolean;
}) {
  if (process.env.NODE_ENV !== "development") return null;

  const weekCount = effectiveProgramme?.programmeWeeks?.length ?? 0;
  const sessionCount = countProgrammeSessions(effectiveProgramme);

  return (
    <div className="mb-4 rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-3 py-2 text-[11px] text-zinc-400">
      <p className="font-semibold text-zinc-300">Dev — programme page client</p>
      <p>route: /athlete/programme · selectedSessionId: {selectedSessionId ?? "—"}</p>
      <p>
        programmeWeeks: {weekCount} · sessions: {sessionCount} · published:{" "}
        {effectivePublished ? "yes" : "no"} · source: {programmeSource}
      </p>
      {invalidSessionCleared ? (
        <p className="text-amber-300">Cleared invalid selected session id.</p>
      ) : null}
    </div>
  );
}

export function ProgrammePageView({
  serverProgramme = null,
  serverLoadVariant = "ready",
  serverRenderDecision = "programme",
}: {
  serverProgramme?: AthleteLiveProgrammePayload | null;
  serverLoadVariant?: "ready" | "no-session" | "not-linked";
  serverRenderDecision?: string;
}) {
  const {
    programmePublishedLive,
    liveProgramme,
    liveProgrammeLoading,
    liveProgrammeApiError,
    portalAthlete,
    useMockPreview,
    programmeHubLive,
    reloadLiveProgramme,
    serverProgrammePublishedSeed,
  } = useAthletePortal();
  const { dashboardLive } = useAthleteDashboardLive();

  const effectiveProgramme = liveProgramme ?? serverProgramme;
  const effectivePublished =
    programmePublishedLive || Boolean(serverProgramme?.published);
  const useLive = effectivePublished && !useMockPreview;
  const useMock = useMockPreview;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | undefined>();
  const [drawerSession, setDrawerSession] = useState<HyroxSession | null>(null);
  const [drawerShowLogForm, setDrawerShowLogForm] = useState(false);
  const [sessionDetailOverride, setSessionDetailOverride] = useState<
    ReturnType<typeof sessionDetailFromHyroxSession> | null
  >(null);
  const [invalidSessionMessage, setInvalidSessionMessage] = useState<string | null>(null);
  const [invalidSessionCleared, setInvalidSessionCleared] = useState(false);

  const programmeSource: "server" | "client" | "none" = liveProgramme
    ? "client"
    : serverProgramme
      ? "server"
      : "none";

  const blockId = useLive && dashboardLive ? dashboardLive.blockId : MOCK_ATHLETE.blockId;
  const block = HYROX_BLOCKS.find((b) => b.id === blockId)!;
  const programmeStartDate = useLive ? effectiveProgramme?.programmeStartDate ?? null : null;
  const liveGlobalWeek = useLive
    ? effectiveProgramme?.liveGlobalWeek ?? effectiveProgramme?.athlete.current_week ?? 1
    : MOCK_ATHLETE.currentWeek;

  const weekTabs: WeekTab[] = useMemo(() => {
    return block.weeks.map((globalWeek, i) => {
      const cycle = (i + 1) as 1 | 2 | 3 | 4;
      const bundle = useLive
        ? effectiveProgramme?.programmeWeeks?.find((b) => b.weekNumber === globalWeek)
        : null;
      const generated = Boolean(bundle?.generated && bundle.sessions.length > 0);
      const subtitle = bundle?.weekRole ?? BLOCK_WEEK_FOCUS_LABELS[cycle];
      const dateRangeLabel = bundle?.dateRangeLabel ?? null;

      let mode: WeekTabMode = "not_generated";
      if (useLive && bundle?.calendarStatus) {
        mode = calendarStatusToTabMode(bundle.calendarStatus);
      } else if (generated && useMock) {
        if (globalWeek === MOCK_ATHLETE.currentWeek) mode = "active";
        else if (globalWeek < MOCK_ATHLETE.currentWeek) mode = "past";
        else mode = "upcoming";
      } else if (generated) {
        mode = "upcoming";
      }

      return {
        label: `W${cycle}`,
        subtitle,
        dateRangeLabel,
        globalWeek,
        mode,
        generated,
      };
    });
  }, [block.weeks, useLive, useMock, effectiveProgramme?.programmeWeeks]);

  const defaultTab = useLive
    ? resolveDefaultProgrammeWeekNumber(
        effectiveProgramme?.programmeWeeks ?? [],
        [...block.weeks]
      )
    : weekTabs.find((t) => t.mode === "active")?.globalWeek ??
      weekTabs.find((t) => t.generated && t.mode === "upcoming")?.globalWeek ??
      weekTabs.find((t) => t.generated)?.globalWeek ??
      weekTabs[0]?.globalWeek ??
      1;
  const [selectedWeek, setSelectedWeek] = useState(defaultTab);

  useEffect(() => {
    setSelectedWeek(defaultTab);
  }, [defaultTab]);

  const selectedTab = weekTabs.find((t) => t.globalWeek === selectedWeek) ?? weekTabs[0];
  const selectedBundle = useLive
    ? effectiveProgramme?.programmeWeeks?.find((b) => b.weekNumber === selectedWeek)
    : null;

  const sessions = useLive && selectedBundle?.generated
    ? selectedBundle.sessions.map((s) => ({
        ...s,
        status:
          selectedTab?.mode === "past"
            ? ("complete" as const)
            : selectedTab?.mode === "active"
              ? s.status
              : ("upcoming" as const),
      }))
    : useMock
      ? MOCK_WEEK_SESSIONS
      : [];

  const rationale =
    useLive && selectedBundle?.weekRole
      ? {
          weekRole: selectedBundle.weekRole,
          whyMatters:
            selectedBundle.week?.athlete_facing_note ??
            effectiveProgramme?.weekRationale?.whyMatters ??
            "",
          prioritise: effectiveProgramme?.weekRationale?.prioritise ?? [],
          coachNote:
            selectedBundle.week?.coach_note ?? effectiveProgramme?.weekRationale?.coachNote ?? "",
        }
      : useLive && effectiveProgramme?.weekRationale
        ? effectiveProgramme.weekRationale
        : MOCK_WEEK_RATIONALE;

  const completed = sessions.filter((s) => s.status === "complete").length;
  const meta = ATHLETE_PAGE_META.programme;
  const athleteName = useLive
    ? effectiveProgramme?.athlete.name?.trim() || portalAthleteDisplayName(portalAthlete)
    : useMock
      ? MOCK_ATHLETE.name
      : portalAthleteDisplayName(portalAthlete);

  const weekLoggingEnabled =
    useLive && (selectedTab?.mode === "active" || selectedTab?.mode === "past");
  const weekLoggingBlockedMessage =
    selectedTab?.mode === "upcoming"
      ? "This session unlocks when the week goes live."
      : selectedTab?.mode === "locked"
        ? "This week unlocks when your coach publishes the next block."
        : selectedTab?.mode === "not_generated"
          ? "This week has not been published yet."
          : undefined;

  const allProgrammeSessionIds = useMemo(() => {
    if (!useLive || !effectiveProgramme?.programmeWeeks) return new Set<string>();
    const ids = new Set<string>();
    for (const week of effectiveProgramme.programmeWeeks) {
      for (const s of week.sessions ?? []) {
        if (s.id) ids.add(s.id);
      }
    }
    return ids;
  }, [useLive, effectiveProgramme?.programmeWeeks]);

  const openSession = useCallback(
    (id: string, title?: string, opts?: { showLogForm?: boolean }) => {
      const hit = sessions.find((s) => s.id === id) ?? null;
      if (useLive && !hit && !allProgrammeSessionIds.has(id)) {
        setInvalidSessionMessage("Session not found — that id is not in your published programme.");
        setInvalidSessionCleared(true);
        setSessionId(null);
        setDrawerSession(null);
        setDrawerShowLogForm(false);
        setSessionDetailOverride(null);
        return;
      }
      setInvalidSessionMessage(null);
      setInvalidSessionCleared(false);
      setSessionId(id);
      setSessionTitle(title);
      setDrawerShowLogForm(Boolean(opts?.showLogForm));
      setDrawerSession(hit);
      setSessionDetailOverride(hit ? sessionDetailFromHyroxSession(hit) : null);
    },
    [sessions, useLive, allProgrammeSessionIds]
  );

  const handleSessionUpdated = useCallback(
    async (updated: HyroxSession | null) => {
      if (updated) {
        setDrawerSession(updated);
        setSessionDetailOverride(sessionDetailFromHyroxSession(updated));
      }
      if (effectivePublished && !useMockPreview) {
        await reloadLiveProgramme();
      }
    },
    [effectivePublished, useMockPreview, reloadLiveProgramme]
  );

  const programmeVisible =
    serverRenderDecision === "programme" ||
    serverRenderDecision === "published-empty" ||
    programmeHubLive ||
    serverProgrammePublishedSeed ||
    Boolean(serverProgramme?.published) ||
    (useLive && Boolean(effectiveProgramme)) ||
    countProgrammeSessions(serverProgramme) > 0;
  const showMockWeek = useMock && !useLive;
  const showWeekSessions = (useLive && selectedTab?.generated) || showMockWeek;
  const missingStartDateWarning = useLive && programmeVisible && !programmeStartDate;
  const publishedNoSessions =
    useLive &&
    programmeVisible &&
    countProgrammeSessions(effectiveProgramme) === 0 &&
    !liveProgrammeLoading;

  return (
    <PageContent width="wide">
      <ProgrammePageClientDebug
        selectedSessionId={sessionId}
        effectiveProgramme={effectiveProgramme}
        effectivePublished={effectivePublished}
        programmeSource={programmeSource}
        invalidSessionCleared={invalidSessionCleared}
      />

      {serverLoadVariant !== "ready" && process.env.NODE_ENV === "development" ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-200/90">
          Server load variant was <span className="font-mono">{serverLoadVariant}</span> — rendering
          programme from layout-confirmed auth
          {portalAthlete?.id ? ` (athlete ${portalAthlete.id.slice(0, 8)}…)` : ""}.
        </p>
      ) : null}

      {liveProgrammeApiError && useLive ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-200/90">
          {liveProgrammeApiError}
          {serverProgramme ? " Showing server-loaded programme until API recovers." : ""}
        </p>
      ) : null}

      {invalidSessionMessage ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-200">
          {invalidSessionMessage}
        </p>
      ) : null}

      <PageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={
          useLive
            ? `Block ${blockId} · Week ${liveGlobalWeek}${programmeStartDate ? ` · starts ${programmeStartDate}` : ""} · ${athleteName}`
            : `${meta.subtitle} · Week ${MOCK_ATHLETE.currentWeek} of ${MOCK_ATHLETE.totalWeeks}`
        }
      />

      {useLive ? (
        <p className="-mt-4 text-xs text-zinc-500">
          Future weeks may be adjusted after check-ins. {PLANNED_COPY}
        </p>
      ) : null}

      {missingStartDateWarning && process.env.NODE_ENV === "development" ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-200/90">
          Programme start date missing — week status may be inaccurate. Coach should set a start
          date and re-publish the block.
        </p>
      ) : null}

      {liveProgrammeLoading && useLive && !effectiveProgramme ? (
        <p className="text-sm text-zinc-500">Loading programme…</p>
      ) : null}

      {publishedNoSessions ? (
        <div className={`${athleteCard} ${athleteCardPadding} mb-6`}>
          <p className={eyebrowClass}>Programme published</p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Programme published but no sessions were found for W1–W4. Your coach may need to
            publish session rows, or reload after a moment.
          </p>
        </div>
      ) : null}

      <div className={`${athleteCardHighlight} ${athleteCardPadding}`}>
        <p className={eyebrowClass}>
          Block {blockId} · {block.name}
          {selectedTab ? ` · ${selectedTab.subtitle}` : ""}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{rationale.whyMatters}</p>
        {showWeekSessions ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-zinc-400">
              {completed} of {sessions.length} sessions complete
            </span>
            <ProgressBar
              value={sessions.length ? Math.round((completed / sessions.length) * 100) : 0}
              className="h-2 max-w-xs flex-1"
            />
          </div>
        ) : null}
        {rationale.prioritise?.length ? (
          <ul className="mt-4 space-y-1.5">
            {rationale.prioritise.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-zinc-400">
                <span className="text-yellow-400">›</span>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-4 border-t border-zinc-800 pt-4 text-xs italic text-zinc-500">
          Coach: {rationale.coachNote}
        </p>
      </div>

      {programmeVisible ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {weekTabs.map((tab) => {
              const active = selectedWeek === tab.globalWeek;
              const chipLabel = chipLabelForMode(tab.mode);
              return (
                <button
                  key={tab.globalWeek}
                  type="button"
                  onClick={() => setSelectedWeek(tab.globalWeek)}
                  className={`flex min-w-[108px] shrink-0 flex-col rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-yellow-400/50 bg-yellow-400/10"
                      : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-sm font-bold text-white">{tab.label}</span>
                  <span className="text-[10px] text-zinc-500">{tab.subtitle}</span>
                  {tab.dateRangeLabel ? (
                    <span className="text-[10px] text-zinc-600">{tab.dateRangeLabel}</span>
                  ) : null}
                  <span
                    className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      tab.mode === "active"
                        ? "text-emerald-400"
                        : tab.mode === "past"
                          ? "text-zinc-500"
                          : tab.generated
                            ? "text-yellow-400/80"
                            : "text-zinc-600"
                    }`}
                  >
                    {chipLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {showWeekSessions ? (
            <section>
              <SectionTitle
                title={`${selectedTab?.subtitle ?? "Week"} · Week ${selectedWeek}`}
                description={`${completed} of ${sessions.length} complete${
                  selectedTab?.mode === "upcoming"
                    ? ` · ${UPCOMING_COPY}`
                    : selectedTab?.mode === "active"
                      ? " · live this week"
                      : selectedTab?.mode === "past"
                        ? " · past week"
                        : ""
                }`}
              />
              {selectedTab?.mode === "upcoming" ? (
                <p className="mb-3 text-xs text-zinc-500">{upcomingSubcopy(selectedTab.mode)}</p>
              ) : null}
              <div className="space-y-4">
                {sessions.map((session) => (
                  <WeekSessionCard
                    key={session.id}
                    session={session}
                    onView={() => openSession(session.id, session.name)}
                    onLog={
                      weekLoggingEnabled
                        ? () => openSession(session.id, session.name, { showLogForm: true })
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          ) : (
            <div className={`${athleteCard} ${athleteCardPadding}`}>
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 shrink-0 text-zinc-500" />
                <div>
                  <p className={eyebrowClass}>
                    {selectedTab?.mode === "locked" ? "Block not yet available" : "Week not generated yet"}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    {selectedTab?.mode === "locked"
                      ? `Weeks ${selectedTab.globalWeek}+ will unlock when your coach publishes the next 4-week block after your Block ${blockId} review.`
                      : `Your coach has not published sessions for ${selectedTab?.label ?? "this week"} (${selectedTab?.subtitle}) yet.`}
                  </p>
                  <p className="mt-3 text-xs text-zinc-500">{PLANNED_COPY}</p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={`${athleteCard} ${athleteCardPadding}`}>
          <p className={eyebrowClass}>Programme</p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Your programme is being built. You&apos;ll see your first block here once your coach
            publishes it.
          </p>
        </div>
      )}

      <SessionDrawer
        sessionId={sessionId}
        session={drawerSession}
        sessionTitle={sessionTitle}
        sessionDetail={sessionDetailOverride}
        loggingEnabled={weekLoggingEnabled}
        loggingBlockedMessage={weekLoggingBlockedMessage}
        useLiveApi={useLive && !useMock}
        initialShowLogForm={drawerShowLogForm}
        onSessionUpdated={(updated) => void handleSessionUpdated(updated)}
        onClose={() => {
          setSessionId(null);
          setDrawerSession(null);
          setDrawerShowLogForm(false);
          setSessionDetailOverride(null);
          setInvalidSessionMessage(null);
        }}
      />
    </PageContent>
  );
}
