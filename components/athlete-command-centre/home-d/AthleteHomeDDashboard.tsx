"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  buildAthleteHomeDViewModel,
  type AthleteHomeDDay,
  type AthleteHomeDSessionCard,
  type HomeDCardStatus,
} from "@/app/lib/hyroxAthleteHomeDViewModel";
import { sessionDetailFromHyroxSession } from "@/app/lib/hyroxAthleteDashboardLive";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import { SessionDrawer } from "@/components/athlete-command-centre/SessionDrawer";
import { useAthleteDashboardLive } from "@/components/athlete-command-centre/useAthleteDashboardLive";
import { useAthleteAdminPreview } from "@/components/athlete-command-centre/athletePortalAdminPreview";
import { useAthletePortalOptional } from "@/components/athlete-command-centre/athletePortalContext";
import { AthletePortalNavLink } from "@/components/athlete-command-centre/AthletePortalNavLink";

function statusLabel(status: HomeDCardStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "partial":
      return "Partial";
    case "missed":
      return "Missed";
    case "unresolved":
      return "Not logged";
    default:
      return "Upcoming";
  }
}

function statusClass(status: HomeDCardStatus): string {
  switch (status) {
    case "completed":
      return "text-emerald-300/90";
    case "partial":
      return "text-amber-200/90";
    case "missed":
      return "text-zinc-400";
    case "unresolved":
      return "text-zinc-500";
    default:
      return "text-zinc-500";
  }
}

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

function WeekSelector({
  days,
  selectedId,
  onSelect,
}: {
  days: AthleteHomeDDay[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      data-home-d-week-selector=""
      className="sticky top-[var(--hybrid365-env-badge-height,0px)] z-20 -mx-4 border-b border-zinc-800/70 bg-black/95 px-1.5 py-1.5 backdrop-blur-md sm:-mx-6 sm:px-2"
    >
      <div className="grid grid-cols-7 gap-0">
        {days.map((day) => {
          const selected = day.id === selectedId;
          const count = day.sessions.length;
          return (
            <button
              key={day.id}
              type="button"
              data-home-d-day={day.id}
              onClick={() => onSelect(day.id)}
              className={`relative flex min-h-[48px] flex-col items-center justify-center rounded-lg px-0.5 py-1 text-center transition ${
                selected
                  ? "bg-zinc-900"
                  : day.isToday
                    ? "bg-zinc-950"
                    : "hover:bg-zinc-900/50"
              }`}
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  selected ? "text-zinc-300" : "text-zinc-600"
                }`}
              >
                {day.dow}
              </span>
              <span
                className={`mt-0.5 text-[15px] font-bold tabular-nums leading-none ${
                  selected ? "text-white" : "text-zinc-200"
                }`}
              >
                {day.dateNumber}
              </span>
              {selected ? (
                <span className="absolute inset-x-2 bottom-0.5 h-0.5 rounded-full bg-yellow-400" />
              ) : null}
              <span className="mt-1.5 flex h-1 items-center justify-center gap-0.5">
                {count === 0 ? (
                  <span className="h-1 w-1 rounded-full bg-transparent" />
                ) : (
                  Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span key={i} className="h-1 w-1 rounded-full bg-zinc-500" />
                  ))
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SessionCard({
  session,
  onOpen,
}: {
  session: AthleteHomeDSessionCard;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      data-home-d-session={session.id}
      onClick={onOpen}
      className="w-full rounded-2xl border border-zinc-800/90 bg-zinc-950 px-4 py-3 text-left transition hover:border-zinc-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            {session.slot}
            <span className="mx-1.5 text-zinc-700">·</span>
            {session.modalityLabel}
          </p>
          <p className="mt-1 text-[15px] font-semibold leading-snug tracking-tight text-white">
            {session.title}
          </p>
        </div>
        <span className={`shrink-0 pt-0.5 text-[11px] font-medium ${statusClass(session.status)}`}>
          {statusLabel(session.status)}
        </span>
      </div>
      {session.primaryTarget ? (
        <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-white">
          {session.primaryTarget}
        </p>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">Target set in session detail</p>
      )}
      {session.primaryDetail ? (
        <p className="mt-0.5 text-sm text-zinc-400">{session.primaryDetail}</p>
      ) : null}
      {session.duration ? (
        <p className="mt-2 text-xs text-zinc-500">{session.duration}</p>
      ) : null}
    </button>
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

  if (liveLoading && !liveProgramme) {
    return (
      <div data-home-d-live="" className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
        <div className="mt-6 h-14 animate-pulse rounded-2xl bg-zinc-900" />
        <div className="mt-4 space-y-3">
          <div className="h-28 animate-pulse rounded-2xl bg-zinc-900" />
          <div className="h-28 animate-pulse rounded-2xl bg-zinc-900" />
        </div>
      </div>
    );
  }

  if (liveError && !liveProgramme) {
    return (
      <div data-home-d-live="" className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6">
        <p className="text-sm font-semibold text-white">Could not load your programme</p>
        <p className="mt-2 text-sm text-zinc-400">{liveError}</p>
        <button
          type="button"
          onClick={() => void reloadLiveProgramme()}
          className="mt-4 rounded-full border border-zinc-600 px-4 py-2 text-xs font-bold text-zinc-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!vm.programmePublished) {
    return (
      <div data-home-d-live="" className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-500/80">
          Home
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          No programme published yet
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400">
          Your coach has not published a training week. Check back soon, or message your coach if
          you expected sessions this week.
        </p>
      </div>
    );
  }

  return (
    <div
      data-home-d-live=""
      className="mx-auto max-w-5xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-6 lg:pb-10 lg:pt-5"
    >
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-8 lg:items-start">
        <div className="min-w-0">
          <header className="mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Home
            </p>
            <h1 className="mt-1 text-[1.35rem] font-semibold tracking-tight text-white sm:text-2xl">
              {vm.athleteName}
            </h1>
            {vm.programmeContext ? (
              <p className="mt-1 text-[13px] text-zinc-400">
                Week {vm.programmeContext.weekNumber}
                <span className="mx-1.5 text-zinc-700">·</span>
                {vm.programmeContext.blockLabel}
                {vm.programmeContext.weekRole ? (
                  <>
                    <span className="mx-1.5 text-zinc-700">·</span>
                    {vm.programmeContext.weekRole}
                  </>
                ) : null}
                {vm.programmeContext.raceLabel ? (
                  <>
                    <span className="mx-1.5 text-zinc-700">·</span>
                    {vm.programmeContext.raceLabel}
                  </>
                ) : null}
              </p>
            ) : null}
          </header>

          {vm.weekDays.length ? (
            <WeekSelector
              days={vm.weekDays}
              selectedId={selectedId}
              onSelect={(id) => setSelectedDate(id)}
            />
          ) : null}

          <section className="mt-5">
            {selectedDay ? (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold text-white">{dayHeading(selectedDay)}</h2>
                  <p className="text-xs text-zinc-500">
                    {selectedDay.sessions.length === 0
                      ? "Rest / recovery"
                      : selectedDay.sessions.length === 1
                        ? "1 session"
                        : `${selectedDay.sessions.length} sessions`}
                  </p>
                </div>

                {selectedDay.sessions.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/50 px-4 py-6">
                    <p className="text-sm font-medium text-zinc-200">No training scheduled today.</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Use the week strip to check another day, or open Programme for the full week.
                    </p>
                    <AthletePortalNavLink
                      href="/athlete/programme"
                      className="mt-3 inline-flex text-xs font-bold text-yellow-400"
                    >
                      Open Programme
                    </AthletePortalNavLink>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {selectedDay.sessions.map((s) => (
                      <SessionCard key={s.id} session={s} onOpen={() => openSession(s.id)} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-zinc-400">No days available for this week.</p>
            )}
          </section>

          {/* Mobile secondary stack */}
          <div className="mt-7 space-y-3 lg:hidden">
            {vm.coachContext ? (
              <aside className="rounded-xl border border-zinc-800/80 px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {vm.coachContext.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
                  {vm.coachContext.body}
                </p>
              </aside>
            ) : null}
            {vm.performanceInsight ? (
              <aside className="rounded-xl border border-zinc-800/80 px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Insight
                </p>
                <p className="mt-1 text-xs text-zinc-500">{vm.performanceInsight.label}</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-white">
                  {vm.performanceInsight.value}
                </p>
                {vm.performanceInsight.detail ? (
                  <p className="mt-1 text-xs text-zinc-400">{vm.performanceInsight.detail}</p>
                ) : null}
              </aside>
            ) : null}
            {vm.progressSnapshot?.length ? (
              <aside className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                    Progress
                  </p>
                  <Link href="/athlete/progress" className="text-[11px] font-bold text-yellow-400">
                    View
                  </Link>
                </div>
                <ul className="mt-2 space-y-2">
                  {vm.progressSnapshot.map((m) => (
                    <li key={m.label} className="text-sm text-zinc-200">
                      <span className="text-zinc-500">{m.label}</span>
                      <span className="mt-0.5 block font-semibold tabular-nums">
                        {m.from} → {m.to}
                      </span>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
          </div>
        </div>

        <aside className="mt-8 hidden space-y-4 lg:mt-0 lg:block">
          {vm.coachContext ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                {vm.coachContext.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">{vm.coachContext.body}</p>
            </div>
          ) : null}
          {vm.performanceInsight ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Insight
              </p>
              <p className="mt-1 text-xs text-zinc-400">{vm.performanceInsight.label}</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-white">
                {vm.performanceInsight.value}
              </p>
              {vm.performanceInsight.detail ? (
                <p className="mt-1 text-xs text-yellow-400/90">{vm.performanceInsight.detail}</p>
              ) : null}
              <Link
                href="/athlete/benchmarks"
                className="mt-3 inline-flex text-[11px] font-bold text-yellow-400"
              >
                Performance
              </Link>
            </div>
          ) : null}
          {vm.progressSnapshot?.length ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Progress
                </p>
                <Link href="/athlete/progress" className="text-[11px] font-bold text-yellow-400">
                  View
                </Link>
              </div>
              <ul className="mt-3 space-y-2">
                {vm.progressSnapshot.map((m) => (
                  <li key={m.label}>
                    <p className="text-xs text-zinc-500">{m.label}</p>
                    <p className="text-sm font-semibold tabular-nums text-zinc-100">
                      {m.from} → {m.to}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
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
        onSessionUpdated={() => {
          void reloadLiveProgramme();
        }}
        onClose={() => {
          setSessionId(null);
          setDrawerSession(null);
          setSessionDetailOverride(null);
          void reloadLiveProgramme();
        }}
      />
    </div>
  );
}
