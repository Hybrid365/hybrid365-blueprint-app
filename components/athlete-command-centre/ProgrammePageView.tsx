"use client";

import { Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BLOCK_WEEK_FOCUS_LABELS } from "@/app/lib/hyroxCoachProgrammeDraft";
import { sessionDetailFromHyroxSession } from "@/app/lib/hyroxAthleteDashboardLive";
import {
  MOCK_ATHLETE,
  MOCK_WEEK_RATIONALE,
  MOCK_WEEK_SESSIONS,
  resolveHyroxBlockMeta,
  type HyroxSession,
} from "@/app/lib/hyroxTeamDashboardMock";
import { SessionDrawer } from "./SessionDrawer";
import { useAthleteDashboardLive } from "./useAthleteDashboardLive";
import { portalAthleteDisplayName } from "@/app/lib/hyroxAthletePortalDisplay";
import { useAthleteAdminPreview } from "./athletePortalAdminPreview";
import { useAthletePortalOptional } from "./athletePortalContext";
import { resolveDefaultProgrammeWeekNumber } from "@/app/lib/hyroxAthleteProgrammeCalendar";
import {
  buildAthleteProgrammeWeekChipMeta,
  calendarStatusToChipMode,
  resolveEffectiveProgrammeStartYmd,
} from "@/app/lib/hyroxAthleteProgrammeWeekChip";
import type { AthleteWeekCalendarStatus } from "@/app/lib/hyroxAthleteProgrammeTypes";
import type { AthleteLiveProgrammePayload } from "./useAthleteLiveProgramme";
import {
  groupProgrammeSessionsByDay,
  hyroxSessionToProgrammeCardViewModel,
} from "@/app/lib/visual-system/programmeSessionCardAdapter";
import { ProgrammeSessionRow } from "./visual-system/sessions/ProgrammeSessionRow";
import { AthleteCoachNote } from "./visual-system/primitives/CoachNote";
import {
  usePrefersReducedMotion,
  vsTransition,
  VS_DURATION,
} from "./visual-system/motion";

type WeekTabMode = "active" | "upcoming" | "past" | "not_generated" | "locked";

type WeekTab = {
  label: string;
  subtitle: string;
  dateRangeLabel: string | null;
  globalWeek: number;
  mode: WeekTabMode;
  generated: boolean;
  sessionCount: number;
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
  if (mode === "not_generated") return "Coming soon";
  return "Upcoming";
}

function countProgrammeSessions(programme: AthleteLiveProgrammePayload | null | undefined): number {
  if (!programme?.programmeWeeks?.length) return programme?.sessions?.length ?? 0;
  return programme.programmeWeeks.reduce((n, w) => n + (w.sessions?.length ?? 0), 0);
}

function dayHeading(day: { dow: string; dateLabel: string; isToday: boolean }): string {
  const names: Record<string, string> = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
  };
  const name = names[day.dow] ?? day.dow;
  return day.isToday ? `Today · ${name}` : name;
}

export function ProgrammePageView({
  serverProgramme = null,
  serverLoadVariant = "ready",
  serverRenderDecision = "programme",
  isAdminPreview = false,
  readOnly = false,
}: {
  serverProgramme?: AthleteLiveProgrammePayload | null;
  serverLoadVariant?: "ready" | "no-session" | "not-linked";
  serverRenderDecision?: string;
  isAdminPreview?: boolean;
  readOnly?: boolean;
}) {
  const adminPreview = useAthleteAdminPreview();
  const portal = useAthletePortalOptional();
  const {
    programmePublishedLive = false,
    liveProgramme = null,
    liveProgrammeLoading = false,
    liveProgrammeApiError = null,
    portalAthlete = null,
    useMockPreview = false,
    programmeHubLive = false,
    reloadLiveProgramme = async () => {},
    serverProgrammePublishedSeed = false,
  } = portal ?? {};
  const { dashboardLive } = useAthleteDashboardLive();
  const reduced = usePrefersReducedMotion();

  const previewMode = isAdminPreview || Boolean(adminPreview) || readOnly;

  const effectiveProgramme =
    adminPreview?.liveProgramme ?? liveProgramme ?? serverProgramme;
  const effectivePublished =
    adminPreview?.programmePublishedLive ||
    programmePublishedLive ||
    Boolean(serverProgramme?.published);
  const useLive = effectivePublished && !useMockPreview && Boolean(effectiveProgramme);
  const useMock = useMockPreview && !previewMode;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | undefined>();
  const [drawerSession, setDrawerSession] = useState<HyroxSession | null>(null);
  const [drawerShowLogForm, setDrawerShowLogForm] = useState(false);
  const [sessionDetailOverride, setSessionDetailOverride] = useState<
    ReturnType<typeof sessionDetailFromHyroxSession> | null
  >(null);
  const [invalidSessionMessage, setInvalidSessionMessage] = useState<string | null>(null);

  const blockId = useLive && dashboardLive ? dashboardLive.blockId : MOCK_ATHLETE.blockId;
  const block = resolveHyroxBlockMeta(blockId);
  const programmeStartDate = useLive
    ? resolveEffectiveProgrammeStartYmd(
        effectiveProgramme?.programmeStartDate,
        effectiveProgramme?.athlete?.programme_start_date,
        effectiveProgramme?.programmeWeeks
      )
    : null;
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

      const chipMeta =
        useLive && bundle
          ? buildAthleteProgrammeWeekChipMeta({
              bundle,
              weekNumber: globalWeek,
              programmeStartYmd: programmeStartDate,
            })
          : null;

      const dateRangeLabel = chipMeta?.dateRangeLabel ?? bundle?.dateRangeLabel ?? null;
      const sessionCount = bundle?.generated ? (bundle.sessions?.length ?? 0) : 0;

      let mode: WeekTabMode = "not_generated";
      if (useLive && chipMeta) {
        mode = calendarStatusToChipMode(chipMeta.calendarStatus);
      } else if (useLive && bundle?.calendarStatus) {
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
        sessionCount,
      };
    });
  }, [block.weeks, useLive, useMock, effectiveProgramme?.programmeWeeks, programmeStartDate]);

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

  // Honest statuses — never remap past → complete or upcoming → upcoming.
  const sessions: HyroxSession[] =
    useLive && selectedBundle?.generated
      ? selectedBundle.sessions
      : useMock
        ? MOCK_WEEK_SESSIONS
        : [];

  const weekStartYmd =
    selectedBundle?.weekStartDate?.trim() ||
    selectedBundle?.week?.week_start_date?.trim() ||
    null;

  const dayGroups = useMemo(
    () => groupProgrammeSessionsByDay(sessions, { weekStartYmd }),
    [sessions, weekStartYmd]
  );

  const rationale =
    useLive && selectedBundle
      ? {
          weekRole: selectedBundle.weekRole ?? "",
          whyMatters: selectedBundle.week?.athlete_facing_note?.trim() ?? "",
        }
      : useMock
        ? {
            weekRole: MOCK_WEEK_RATIONALE.weekRole,
            whyMatters: MOCK_WEEK_RATIONALE.whyMatters,
          }
        : { weekRole: "", whyMatters: "" };

  const completed = sessions.filter((s) => s.status === "complete").length;
  const athleteName = useLive
    ? effectiveProgramme?.athlete.name?.trim() || portalAthleteDisplayName(portalAthlete)
    : useMock
      ? MOCK_ATHLETE.name
      : portalAthleteDisplayName(portalAthlete);

  const weekLoggingEnabled =
    !previewMode && useLive && (selectedTab?.mode === "active" || selectedTab?.mode === "past");
  const weekLoggingBlockedMessage = previewMode
    ? "Session logging is disabled in admin preview mode."
    : selectedTab?.mode === "upcoming"
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
        setInvalidSessionMessage("That session isn't available in your programme right now.");
        setSessionId(null);
        setDrawerSession(null);
        setDrawerShowLogForm(false);
        setSessionDetailOverride(null);
        return;
      }
      setInvalidSessionMessage(null);
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
      if (previewMode) return;
      if (updated) {
        setDrawerSession(updated);
        setSessionDetailOverride(sessionDetailFromHyroxSession(updated));
      }
      if (effectivePublished && !useMockPreview) {
        await reloadLiveProgramme();
      }
    },
    [previewMode, effectivePublished, useMockPreview, reloadLiveProgramme]
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
    <div
      data-programme-visual="v0-parity"
      className="mx-auto max-w-6xl pb-2 pt-1 lg:pb-4 lg:pt-2"
      style={{ color: "var(--h365-text)" }}
    >
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

      <header className="mb-4">
        <p className="text-[11px] font-semibold tracking-tight text-[var(--h365-text)]">
          Hybrid365
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--h365-accent)]/90">
          Programme
        </p>
        <h1 className="mt-1 font-display text-[1.65rem] font-bold uppercase leading-none tracking-tight text-[var(--h365-text)] sm:text-3xl">
          Your training week
        </h1>
        <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-[var(--h365-text-muted)]">
          {useLive
            ? `Block ${blockId} · Week ${liveGlobalWeek}${
                programmeStartDate ? ` · starts ${programmeStartDate}` : ""
              } · ${athleteName}`
            : `Week ${MOCK_ATHLETE.currentWeek} of ${MOCK_ATHLETE.totalWeeks} · ${athleteName}`}
        </p>
        {useLive ? (
          <p className="mt-1.5 text-xs text-[var(--h365-text-muted)]">{PLANNED_COPY}</p>
        ) : null}
      </header>

      {missingStartDateWarning && process.env.NODE_ENV === "development" ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-200/90">
          Programme start date missing — week status may be inaccurate. Coach should set a start
          date and re-publish the block.
        </p>
      ) : null}

      {liveProgrammeLoading && useLive && !effectiveProgramme ? (
        <p className="text-sm text-[var(--h365-text-muted)]">Loading programme…</p>
      ) : null}

      {publishedNoSessions ? (
        <div className="mb-6 rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)] px-4 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--h365-accent)]/90">
            Programme
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--h365-text-muted)]">
            Your programme is live, but no sessions are showing yet. Check back shortly or contact
            your coach if this persists.
          </p>
        </div>
      ) : null}

      {programmeVisible ? (
        <>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Programme weeks"
            data-programme-week-chips=""
          >
            {weekTabs.map((tab) => {
              const active = selectedWeek === tab.globalWeek;
              const chipLabel = chipLabelForMode(tab.mode);
              return (
                <button
                  key={tab.globalWeek}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedWeek(tab.globalWeek)}
                  className={`flex min-h-11 min-w-[7.25rem] shrink-0 flex-col justify-center rounded-xl border px-3.5 py-2.5 text-left transition-colors duration-150 ${
                    active
                      ? "border-[var(--h365-accent)]/45 bg-[var(--h365-accent)]/10"
                      : "border-[var(--h365-border)] bg-[var(--h365-surface)] hover:border-[var(--h365-text-muted)]/40"
                  }`}
                >
                  <span className="text-sm font-bold text-[var(--h365-text)]">{tab.label}</span>
                  <span className="truncate text-[10px] text-[var(--h365-text-muted)]">
                    {tab.subtitle}
                  </span>
                  {tab.dateRangeLabel ? (
                    <span className="truncate text-[10px] text-[var(--h365-text-muted)]/80">
                      {tab.dateRangeLabel}
                    </span>
                  ) : null}
                  <span
                    className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      tab.mode === "active"
                        ? "text-[var(--h365-accent)]"
                        : tab.mode === "past"
                          ? "text-[var(--h365-text-muted)]"
                          : tab.generated
                            ? "text-[var(--h365-accent)]/80"
                            : "text-[var(--h365-text-muted)]/70"
                    }`}
                  >
                    {chipLabel}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedWeek}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={vsTransition(reduced, VS_DURATION.normal)}
              className="mt-5"
            >
              {showWeekSessions ? (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-[var(--h365-text)]">
                        {selectedTab?.subtitle ?? "Week"} · Week {selectedWeek}
                      </h2>
                      <p className="mt-0.5 text-xs text-[var(--h365-text-muted)]">
                        {completed} of {sessions.length} complete
                        {selectedTab?.mode === "upcoming"
                          ? ` · ${UPCOMING_COPY}`
                          : selectedTab?.mode === "active"
                            ? " · live this week"
                            : selectedTab?.mode === "past"
                              ? " · past week"
                              : ""}
                      </p>
                    </div>
                    {sessions.length > 0 ? (
                      <p className="text-xs tabular-nums text-[var(--h365-text-muted)] num">
                        {Math.round((completed / sessions.length) * 100)}%
                      </p>
                    ) : null}
                  </div>

                  {sessions.length > 0 ? (
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--h365-surface-raised)]">
                      <div
                        className="h-full rounded-full bg-[var(--h365-accent)] transition-[width] duration-200"
                        style={{
                          width: `${sessions.length ? Math.round((completed / sessions.length) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  ) : null}

                  {rationale.whyMatters ? (
                    <div className="mt-5">
                      <AthleteCoachNote
                        note={rationale.whyMatters}
                        label={
                          rationale.weekRole
                            ? `Week strategy · ${rationale.weekRole}`
                            : "Week strategy"
                        }
                      />
                    </div>
                  ) : null}

                  {selectedTab?.mode === "upcoming" ? (
                    <p className="mt-3 text-xs text-[var(--h365-text-muted)]">{UPCOMING_COPY}</p>
                  ) : null}

                  <div className="mt-6 space-y-6">
                    {dayGroups.map((day) => (
                      <section key={day.id} data-programme-day={day.id}>
                        <div className="mb-2.5 flex items-baseline justify-between gap-3">
                          <h3 className="text-sm font-semibold tracking-tight text-[var(--h365-text)]">
                            {dayHeading(day)}
                          </h3>
                          <p className="text-[11px] text-[var(--h365-text-muted)]">
                            {day.sessions.length === 0
                              ? "Rest"
                              : day.sessions.length === 1
                                ? "1 session"
                                : `${day.sessions.length} sessions`}
                          </p>
                        </div>
                        {day.sessions.length === 0 ? (
                          <p
                            className="rounded-xl border border-[var(--h365-border)]/70 bg-transparent px-3.5 py-3 text-sm text-[var(--h365-text-muted)]"
                            data-programme-rest-day=""
                          >
                            No training scheduled
                          </p>
                        ) : (
                          <div className="space-y-2.5">
                            {day.sessions.map((session) => {
                              const card = hyroxSessionToProgrammeCardViewModel(session);
                              return (
                                <ProgrammeSessionRow
                                  key={session.id}
                                  session={card}
                                  onOpen={() => openSession(session.id, session.name)}
                                  onLog={
                                    weekLoggingEnabled
                                      ? () =>
                                          openSession(session.id, session.name, {
                                            showLogForm: true,
                                          })
                                      : undefined
                                  }
                                />
                              );
                            })}
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)] px-4 py-5">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 shrink-0 text-[var(--h365-text-muted)]" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--h365-accent)]/90">
                        {selectedTab?.mode === "locked"
                          ? "Block not yet available"
                          : "Week not generated yet"}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--h365-text-muted)]">
                        {selectedTab?.mode === "locked"
                          ? `Weeks ${selectedTab.globalWeek}+ will unlock when your coach publishes the next 4-week block after your Block ${blockId} review.`
                          : `Your coach has not published sessions for ${selectedTab?.label ?? "this week"} (${selectedTab?.subtitle}) yet.`}
                      </p>
                      <p className="mt-3 text-xs text-[var(--h365-text-muted)]">{PLANNED_COPY}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      ) : (
        <div className="rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)] px-4 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--h365-accent)]/90">
            Programme
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--h365-text-muted)]">
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
        useLiveApi={useLive && !useMock && !previewMode}
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
    </div>
  );
}
