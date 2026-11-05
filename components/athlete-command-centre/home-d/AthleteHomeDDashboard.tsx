"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  buildAthleteHomeDViewModel,
  type AthleteHomeDDay,
} from "@/app/lib/hyroxAthleteHomeDViewModel";
import { sessionDetailFromHyroxSession } from "@/app/lib/hyroxAthleteDashboardLive";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import {
  homeDDaysToWeekDateNav,
  homeDSessionToCardViewModel,
  splitPrimarySecondarySessions,
} from "@/app/lib/visual-system/homeDSessionCardAdapter";
import { SessionDrawer } from "@/components/athlete-command-centre/SessionDrawer";
import { useAthleteDashboardLive } from "@/components/athlete-command-centre/useAthleteDashboardLive";
import { useAthleteAdminPreview } from "@/components/athlete-command-centre/athletePortalAdminPreview";
import { useAthletePortalOptional } from "@/components/athlete-command-centre/athletePortalContext";
import { AthletePortalNavLink } from "@/components/athlete-command-centre/AthletePortalNavLink";
import { WeekDateNav } from "@/components/athlete-command-centre/visual-system/navigation/WeekDateNav";
import { PrimarySessionCard } from "@/components/athlete-command-centre/visual-system/sessions/PrimarySessionCard";
import { SecondarySessionRow } from "@/components/athlete-command-centre/visual-system/sessions/SecondarySessionRow";
import { AthleteCoachNote } from "@/components/athlete-command-centre/visual-system/primitives/CoachNote";
import { BenchmarkMicro } from "@/components/athlete-command-centre/visual-system/primitives/BenchmarkMicro";
import { vsSurface } from "@/components/athlete-command-centre/visual-system/tokens";

function dayHeading(day: AthleteHomeDDay): string {
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

function HomeDWeekStrip({
  days,
  selectedId,
  onSelect,
}: {
  days: AthleteHomeDDay[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const navDays = homeDDaysToWeekDateNav(days);
  return (
    <div
      data-home-d-week-selector=""
      className="sticky top-[var(--hybrid365-env-badge-height,0px)] z-20 -mx-4 border-b border-[var(--h365-border)] bg-[var(--h365-background)]/95 px-2 py-1.5 backdrop-blur-md sm:-mx-6 sm:px-3"
    >
      <WeekDateNav
        days={navDays}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </div>
  );
}

function SideContext({
  coachContext,
  performanceInsight,
  progressSnapshot,
}: {
  coachContext: ReturnType<typeof buildAthleteHomeDViewModel>["coachContext"];
  performanceInsight: ReturnType<typeof buildAthleteHomeDViewModel>["performanceInsight"];
  progressSnapshot: ReturnType<typeof buildAthleteHomeDViewModel>["progressSnapshot"];
}) {
  return (
    <>
      {coachContext ? (
        <div className={`${vsSurface} px-4 py-4`}>
          <AthleteCoachNote note={coachContext.body} label={coachContext.title || "Coach note"} />
        </div>
      ) : null}
      {performanceInsight ? (
        <BenchmarkMicro
          label={performanceInsight.label}
          value={performanceInsight.value}
          detail={performanceInsight.detail}
          href="/athlete/benchmarks"
        />
      ) : null}
      {progressSnapshot?.length ? (
        <div className={`${vsSurface} px-4 py-4`}>
          <div className="flex items-center justify-between">
            <p className="label-caps text-[var(--h365-text-muted)]">Progress</p>
            <Link
              href="/athlete/progress"
              className="text-[11px] font-semibold text-[var(--h365-accent)]"
            >
              View
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {progressSnapshot.map((m) => (
              <li key={m.label}>
                <p className="text-xs text-[var(--h365-text-muted)]">{m.label}</p>
                <p className="text-sm font-semibold tabular-nums num text-[var(--h365-text)]">
                  {m.from} → {m.to}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

export function AthleteHomeDDashboard({ readOnly = false }: { readOnly?: boolean }) {
  const adminPreview = useAthleteAdminPreview();
  const portal = useAthletePortalOptional();
  const liveProgramme = adminPreview?.liveProgramme ?? portal?.liveProgramme ?? null;
  const liveLoading = adminPreview ? false : Boolean(portal?.liveProgrammeLoading);
  const liveError = adminPreview ? null : portal?.liveProgrammeApiError ?? null;
  const { benchmarkSnapshot, reloadLiveProgramme, readOnly: dashReadOnly } =
    useAthleteDashboardLive();
  const isReadOnly = readOnly || dashReadOnly;

  const vm = useMemo(
    () =>
      buildAthleteHomeDViewModel({
        programme: liveProgramme,
        benchmarkSnapshot,
      }),
    [liveProgramme, benchmarkSnapshot]
  );

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedId = selectedDate ?? vm.defaultSelectedDateYmd;
  const selectedDay =
    vm.weekDays.find((d) => d.id === selectedId) ?? vm.weekDays[0] ?? null;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [drawerSession, setDrawerSession] = useState<HyroxSession | null>(null);
  const [sessionDetailOverride, setSessionDetailOverride] = useState<ReturnType<
    typeof sessionDetailFromHyroxSession
  > | null>(null);

  const openSession = (cardId: string) => {
    const session = liveProgramme?.sessions.find((s) => s.id === cardId) ?? null;
    if (!session) return;
    setSessionId(session.id);
    setDrawerSession(session);
    setSessionDetailOverride(sessionDetailFromHyroxSession(session));
  };

  const programmePublishedLive = Boolean(
    adminPreview?.programmePublishedLive ?? portal?.programmePublishedLive
  );
  const useMockPreview = adminPreview ? false : Boolean(portal?.useMockPreview);

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
    [programmePublishedLive, useMockPreview, isReadOnly, reloadLiveProgramme]
  );

  const split = selectedDay
    ? splitPrimarySecondarySessions(selectedDay.sessions)
    : { primary: null, secondary: [], rule: "slot_order_first" as const };

  const liveById = (id: string) =>
    liveProgramme?.sessions.find((s) => s.id === id) ?? null;

  if (liveLoading && !liveProgramme) {
    return (
      <div
        data-home-d-live=""
        className="mx-auto max-w-3xl px-4 py-10 sm:px-6"
        style={{ background: "transparent", color: "var(--h365-text)" }}
      >
        <div className="h-4 w-32 animate-pulse rounded bg-[var(--h365-surface-raised)]" />
        <div className="mt-6 h-14 animate-pulse rounded-xl bg-[var(--h365-surface)]" />
        <div className="mt-4 space-y-3">
          <div className="h-28 animate-pulse rounded-xl bg-[var(--h365-surface)]" />
          <div className="h-28 animate-pulse rounded-xl bg-[var(--h365-surface)]" />
        </div>
      </div>
    );
  }

  if (liveError && !liveProgramme) {
    return (
      <div
        data-home-d-live=""
        className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6"
      >
        <p className="font-display text-lg font-semibold uppercase tracking-wide text-[var(--h365-text)]">
          Could not load your programme
        </p>
        <p className="mt-2 text-sm text-[var(--h365-text-muted)]">{liveError}</p>
        <button
          type="button"
          onClick={() => void reloadLiveProgramme()}
          className="mt-4 h-11 rounded-lg border border-[var(--h365-border)] px-4 text-xs font-semibold text-[var(--h365-text)]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!vm.programmePublished) {
    return (
      <div
        data-home-d-live=""
        className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6"
      >
        <p className="label-caps text-[var(--h365-accent)]">Home</p>
        <h1 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-[var(--h365-text)]">
          No programme published yet
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--h365-text-muted)]">
          Your coach has not published a training week. Check back soon, or message your coach if
          you expected sessions this week.
        </p>
      </div>
    );
  }

  const hasSideContext = Boolean(
    vm.coachContext ||
      vm.performanceInsight ||
      (vm.progressSnapshot && vm.progressSnapshot.length > 0)
  );

  return (
    <div
      data-home-d-live=""
      data-home-d-visual="v0-batch-1"
      className="mx-auto max-w-5xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-6 lg:pb-10 lg:pt-5"
      style={{ color: "var(--h365-text)" }}
    >
      <div
        className={
          hasSideContext
            ? "lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start lg:gap-8"
            : undefined
        }
      >
        <div className="min-w-0">
          <header className="mb-2">
            <p className="label-caps text-[var(--h365-text-muted)]">Home</p>
            <h1 className="mt-1 font-display text-[1.65rem] font-bold uppercase leading-none tracking-tight text-[var(--h365-text)] sm:text-3xl">
              {vm.athleteName}
            </h1>
            {vm.programmeContext ? (
              <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-[var(--h365-text-muted)]">
                Week {vm.programmeContext.weekNumber}
                <span className="mx-1.5 text-[var(--h365-border)]">·</span>
                {vm.programmeContext.blockLabel}
                {vm.programmeContext.weekRole ? (
                  <>
                    <span className="mx-1.5 text-[var(--h365-border)]">·</span>
                    {vm.programmeContext.weekRole}
                  </>
                ) : null}
                {vm.programmeContext.raceLabel &&
                vm.programmeContext.raceLabel.trim().length <= 42 ? (
                  <>
                    <span className="mx-1.5 text-[var(--h365-border)]">·</span>
                    {vm.programmeContext.raceLabel}
                  </>
                ) : null}
              </p>
            ) : null}
          </header>

          {vm.weekDays.length ? (
            <HomeDWeekStrip
              days={vm.weekDays}
              selectedId={selectedId}
              onSelect={(id) => setSelectedDate(id)}
            />
          ) : null}

          <section className="mt-5">
            {selectedDay ? (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-[var(--h365-text)]">
                    {dayHeading(selectedDay)}
                  </h2>
                  <p className="text-xs text-[var(--h365-text-muted)]">
                    {selectedDay.sessions.length === 0
                      ? "No session"
                      : selectedDay.sessions.length === 1
                        ? "1 session"
                        : `${selectedDay.sessions.length} sessions`}
                  </p>
                </div>

                {selectedDay.sessions.length === 0 ? (
                  <div
                    className={`${vsSurface} mt-4 px-4 py-6`}
                    data-home-d-rest-day=""
                  >
                    <p className="font-display text-base font-semibold uppercase tracking-wide text-[var(--h365-text)]">
                      No training scheduled
                    </p>
                    <p className="mt-1 text-xs text-[var(--h365-text-muted)]">
                      Use the week strip to check another day, or open Programme for the full week.
                    </p>
                    <AthletePortalNavLink
                      href="/athlete/programme"
                      className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-[var(--h365-accent)]"
                    >
                      Open Programme
                    </AthletePortalNavLink>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {split.primary ? (
                      <PrimarySessionCard
                        session={homeDSessionToCardViewModel(
                          split.primary,
                          liveById(split.primary.id)
                        )}
                        onOpen={() => openSession(split.primary!.id)}
                      />
                    ) : null}
                    {split.secondary.map((s) => (
                      <SecondarySessionRow
                        key={s.id}
                        session={homeDSessionToCardViewModel(s, liveById(s.id))}
                        onOpen={() => openSession(s.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--h365-text-muted)]">
                No days available for this week.
              </p>
            )}
          </section>

          {hasSideContext ? (
            <div className="mt-7 space-y-3 lg:hidden">
              <SideContext
                coachContext={vm.coachContext}
                performanceInsight={vm.performanceInsight}
                progressSnapshot={vm.progressSnapshot}
              />
            </div>
          ) : null}
        </div>

        {hasSideContext ? (
          <aside className="mt-8 hidden space-y-4 lg:mt-0 lg:block">
            <SideContext
              coachContext={vm.coachContext}
              performanceInsight={vm.performanceInsight}
              progressSnapshot={vm.progressSnapshot}
            />
          </aside>
        ) : null}
      </div>

      <SessionDrawer
        sessionId={sessionId}
        session={drawerSession}
        sessionTitle={drawerSession?.name}
        sessionDetail={sessionDetailOverride}
        loggingEnabled={programmePublishedLive && !useMockPreview && !isReadOnly}
        loggingBlockedMessage={
          isReadOnly ? "Session logging is disabled in admin preview mode." : undefined
        }
        useLiveApi={programmePublishedLive && !useMockPreview && !isReadOnly}
        onSessionUpdated={(updated) => {
          void handleSessionUpdated(updated);
        }}
        onClose={() => {
          setSessionId(null);
          setDrawerSession(null);
          setSessionDetailOverride(null);
          if (programmePublishedLive && !useMockPreview && !isReadOnly) {
            void reloadLiveProgramme();
          }
        }}
      />
    </div>
  );
}
