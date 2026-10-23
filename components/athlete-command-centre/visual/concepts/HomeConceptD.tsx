"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Activity, CalendarDays, Home, MoreHorizontal, Target, X } from "lucide-react";
import { CoachMark, PrototypeBanner } from "./chrome";
import {
  HOME_D_INSIGHTS,
  HOME_D_NAV,
  HOME_D_WEEK,
  type HomeDDay,
  type HomeDSession,
} from "./homeDFixture";
import { IntervalTimeline, TrajectoryChart } from "./viz";
import { usePrefersReducedMotion } from "../motion";
import { MOTION_EASE, MOTION_MS, visualEyebrow, visualMeta, visualTouch } from "../tokens";

const NAV_ICON = {
  home: Home,
  programme: CalendarDays,
  progress: Activity,
  performance: Target,
  more: MoreHorizontal,
} as const;

function formatMinutes(value: number | null): string {
  if (value == null) return "—";
  const hours = Math.floor(value / 60);
  const mins = Math.round(value % 60);
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${value} min`;
}

function dayTitle(day: HomeDDay): string {
  const name = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" }[
    day.dow
  ];
  return day.isToday ? `Today · ${name}` : name ?? day.dow;
}

function subscribeDesktop(callback: () => void) {
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function useDesktopLayout(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false
  );
}

function dayContext(day: HomeDDay): string {
  if (day.sessions.length === 0) return "Rest / Recovery";
  if (day.sessions.length === 1) return "1 session planned";
  return `${day.sessions.length} sessions planned`;
}

export function HomeConceptD() {
  const reduced = usePrefersReducedMotion();
  const desktop = useDesktopLayout();
  const [published, setPublished] = useState(true);
  const [dayId, setDayId] = useState<HomeDDay["id"]>("fri");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nav, setNav] = useState<(typeof HOME_D_NAV)[number]["id"]>("home");
  const [moreOpen, setMoreOpen] = useState(false);

  const day = useMemo(
    () => HOME_D_WEEK.find((item) => item.id === dayId) ?? HOME_D_WEEK[4],
    [dayId]
  );
  const session = day.sessions.find((item) => item.id === sessionId) ?? null;
  const ms = reduced ? 0 : MOTION_MS.base;

  return (
    <article
      data-concept-frame=""
      data-home-d=""
      className="mx-auto w-full max-w-[430px] overflow-hidden rounded-[28px] border border-zinc-800 bg-black text-white shadow-[0_24px_80px_rgba(0,0,0,0.4)] lg:max-w-6xl"
    >
      <div className="border-b border-zinc-800 px-4 py-3 sm:px-5">
        <PrototypeBanner />
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className={visualEyebrow}>Concept D</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-white">
              Weekly training command centre
            </h2>
          </div>
          <button
            type="button"
            data-home-d-published=""
            onClick={() => setPublished((value) => !value)}
            className={`${visualTouch} rounded-full border border-zinc-700 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400`}
          >
            {published ? "Published week" : "No programme"}
          </button>
        </div>
        <p className={`mt-1 ${visualMeta}`}>Visual-lab prototype. Demo values only. Not live Home.</p>
      </div>

      {!desktop ? (
      <div>
        <div className="relative h-[780px]">
          <div
            data-home-d-scroll=""
            className="h-full overflow-y-auto px-4 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] pt-4"
          >
            <HomeDBody
              published={published}
              day={day}
              dayId={dayId}
              onSelectDay={(id) => {
                setSessionId(null);
                setDayId(id);
              }}
              onOpenSession={setSessionId}
              durationMs={ms}
            />
          </div>
          <HomeDNav
            active={nav}
            moreOpen={moreOpen}
            onSelect={(id) => {
              setNav(id);
              setMoreOpen(id === "more" ? (open) => !open : false);
            }}
          />
          {session ? (
            <HomeDDrawer session={session} durationMs={ms} onClose={() => setSessionId(null)} />
          ) : null}
        </div>
      </div>
      ) : (
      <div className="grid grid-cols-[220px_minmax(0,1fr)_320px] gap-0">
        <aside className="border-r border-zinc-800 px-4 py-6">
          <p className={visualEyebrow}>Hybrid365</p>
          <p className="mt-2 text-sm text-zinc-300">{HOME_D_INSIGHTS.athleteName}</p>
          <nav className="mt-8 space-y-1">
            {HOME_D_NAV.map((item) => {
              const Icon = NAV_ICON[item.id];
              const selected = nav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setNav(item.id)}
                  className={`${visualTouch} flex w-full items-center gap-3 rounded-lg px-2 text-sm ${
                    selected ? "text-white" : "text-zinc-400"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${selected ? "text-yellow-400" : ""}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 px-8 py-6">
          <HomeDBody
            published={published}
            day={day}
            dayId={dayId}
            onSelectDay={(id) => {
              setSessionId(null);
              setDayId(id);
            }}
            onOpenSession={setSessionId}
            durationMs={ms}
            desktop
          />
        </div>
        <aside className="border-l border-zinc-800 px-6 py-6">
          {published && day.coachNote ? (
            <div className="mb-8">
              <CoachMark label={`From ${HOME_D_INSIGHTS.coachName}`}>
                <p>{day.coachNote}</p>
              </CoachMark>
            </div>
          ) : null}
          <HomeDInsights compact />
        </aside>
      </div>
      )}
    </article>
  );
}

function HomeDBody({
  published,
  day,
  dayId,
  onSelectDay,
  onOpenSession,
  durationMs,
  desktop = false,
}: {
  published: boolean;
  day: HomeDDay;
  dayId: HomeDDay["id"];
  onSelectDay: (id: HomeDDay["id"]) => void;
  onOpenSession: (id: string) => void;
  durationMs: number;
  desktop?: boolean;
}) {
  return (
    <div>
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-tight text-white">Hybrid365</p>
          <p className={visualMeta}>{HOME_D_INSIGHTS.weekLabel}</p>
        </div>
        <p className={`${visualMeta} tabular-nums`}>23 Oct</p>
      </header>

      <WeekSelector selected={dayId} published={published} onSelect={onSelectDay} />

      <div
        key={published ? dayId : "empty"}
        data-h365-motion=""
        style={{
          transitionProperty: "opacity",
          transitionDuration: `${durationMs}ms`,
          transitionTimingFunction: MOTION_EASE,
        }}
      >
        <div className="mt-5">
          <h3 className="text-lg font-semibold tracking-tight text-white">{dayTitle(day)}</h3>
          <p className={`mt-0.5 ${visualMeta}`}>{published ? dayContext(day) : "No programme published"}</p>
        </div>

        {!published ? (
          <p className="mt-8 text-sm leading-relaxed text-zinc-400">
            No programme published for this week yet.
          </p>
        ) : day.sessions.length === 0 ? (
          <div className="mt-8">
            <p className="text-sm text-zinc-200">No programmed training today.</p>
            <p className={`mt-2 ${visualMeta}`}>Rest / Recovery. Nothing extra was prescribed.</p>
          </div>
        ) : (
          <ol className={`mt-5 ${day.sessions.length > 1 ? "relative space-y-0" : "space-y-4"}`}>
            {day.sessions.map((item, index) => (
              <li key={item.id} className="relative">
                {day.sessions.length > 1 ? (
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-[3px] top-0 w-px bg-zinc-800"
                  />
                ) : null}
                {day.sessions.length > 1 ? (
                  <span
                    aria-hidden
                    className="absolute left-0 top-3 h-[7px] w-[7px] rounded-full bg-yellow-400"
                  />
                ) : null}
                <div className={day.sessions.length > 1 ? "pl-5" : ""}>
                  {index > 0 ? <div className="border-t border-zinc-800" /> : null}
                  <SessionPreview session={item} onOpen={() => onOpenSession(item.id)} />
                </div>
              </li>
            ))}
          </ol>
        )}

        {published && day.coachNote && !desktop ? (
          <div className="mt-8">
            <CoachMark label={`From ${HOME_D_INSIGHTS.coachName}`}>
              <p>{day.coachNote}</p>
            </CoachMark>
          </div>
        ) : null}

        {!desktop ? (
          <div className="mt-10 border-t border-zinc-800 pt-8">
            <HomeDInsights />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WeekSelector({
  selected,
  published,
  onSelect,
}: {
  selected: HomeDDay["id"];
  published: boolean;
  onSelect: (id: HomeDDay["id"]) => void;
}) {
  return (
    <div className="mt-5 grid w-full max-w-[390px] grid-cols-7 gap-0" role="tablist" aria-label="Training week">
      {HOME_D_WEEK.map((day) => {
        const active = day.id === selected;
        const count = published ? day.sessions.length : 0;
        return (
          <button
            key={day.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-home-d-day={day.id}
            onClick={() => onSelect(day.id)}
            className={`${visualTouch} flex flex-col items-center justify-start gap-0.5 px-0 pt-1`}
          >
            <span className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${active ? "text-white" : "text-zinc-500"}`}>
              {day.dow}
            </span>
            <span
              className={`text-[15px] font-semibold tabular-nums leading-none ${
                active ? "text-white" : day.isToday ? "text-yellow-400" : "text-zinc-300"
              }`}
            >
              {day.date}
            </span>
            <span className={`mt-1 h-0.5 w-5 ${active ? "bg-yellow-400" : "bg-transparent"}`} />
            <span className="mt-1 flex h-2 items-center justify-center gap-0.5">
              {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                <span key={i} className="h-1 w-1 rounded-full bg-zinc-500" />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SessionPreview({ session, onOpen }: { session: HomeDSession; onOpen: () => void }) {
  return (
    <button type="button" data-home-d-session={session.id} onClick={onOpen} className="w-full py-4 text-left">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
        {session.slot} · {session.modalityLabel}
        {session.status === "completed" ? " · Completed" : ""}
      </p>
      <p className="mt-1.5 text-lg font-semibold tracking-tight text-white">{session.title}</p>
      <p className="mt-1 text-[22px] font-bold tabular-nums leading-none tracking-tight text-white">
        {session.primaryTarget}
      </p>
      <p className="mt-1.5 text-sm tabular-nums text-zinc-300">{session.primaryDetail}</p>
      <p className={`mt-1 ${visualMeta}`}>
        {session.duration}
        {session.actual ? ` · ${session.actual}` : ""}
      </p>
      {session.intent ? <p className={`mt-2 ${visualMeta}`}>{session.intent}</p> : null}
    </button>
  );
}

function HomeDInsights({ compact = false }: { compact?: boolean }) {
  const i = HOME_D_INSIGHTS;
  const runDelta =
    i.runDeltaKm == null ? null : i.runDeltaKm === 0 ? "Same as last week" : `${i.runDeltaKm > 0 ? "+" : ""}${i.runDeltaKm} km vs last week`;

  return (
    <section data-home-d-insights="">
      <p className={visualEyebrow}>My insights</p>
      <p className={`mt-1 ${visualMeta}`}>From logged sessions this week. Demo values only.</p>

      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Weekly running</p>
        <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-white">
          {i.runKm == null ? "—" : `${i.runKm} km`}
        </p>
        {runDelta ? <p className={`mt-1 ${visualMeta}`}>{runDelta}</p> : null}
        <div className="mt-3">
          <TrajectoryChart values={[...i.runSeries]} labels={[...i.runSeriesLabels]} unit="km" />
        </div>
      </div>

      <div className={`mt-8 grid gap-6 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Training time</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">{formatMinutes(i.durationMinutes)}</p>
          <p className={`mt-1 ${visualMeta}`}>
            {i.completedSessions} / {i.plannedSessions} sessions
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">5K progress</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">{i.fiveK ?? "—"}</p>
          <p className={`mt-1 ${visualMeta}`}>
            {i.fiveKDeltaSec != null ? `↓ ${i.fiveKDeltaSec} sec vs first stored` : "No series yet"}
          </p>
        </div>
      </div>
    </section>
  );
}

function HomeDNav({
  active,
  moreOpen,
  onSelect,
}: {
  active: (typeof HOME_D_NAV)[number]["id"];
  moreOpen: boolean;
  onSelect: (id: (typeof HOME_D_NAV)[number]["id"]) => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20">
      {moreOpen ? (
        <div className="mx-3 mb-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
          <p className={visualEyebrow}>More</p>
          <p className="mt-2">Races</p>
          <p className="mt-1">Check-in</p>
        </div>
      ) : null}
      <nav
        data-home-d-nav=""
        className="border-t border-zinc-800 bg-black/95 px-1 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur"
      >
        <ul className="grid grid-cols-5">
          {HOME_D_NAV.map((item) => {
            const Icon = NAV_ICON[item.id];
            const selected = active === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  data-home-d-nav-item={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`${visualTouch} flex w-full flex-col items-center justify-center gap-1 py-2`}
                >
                  <Icon className={`h-5 w-5 ${selected ? "text-yellow-400" : "text-zinc-500"}`} />
                  <span className={`text-[10px] font-medium ${selected ? "text-zinc-100" : "text-zinc-500"}`}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function HomeDDrawer({
  session,
  durationMs,
  onClose,
}: {
  session: HomeDSession;
  durationMs: number;
  onClose: () => void;
}) {
  return (
    <div data-home-d-drawer="" className="absolute inset-0 z-30">
      <button type="button" aria-label="Close session" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <aside
        className="absolute inset-y-0 right-0 flex w-[min(100%,24rem)] flex-col overflow-y-auto border-l border-zinc-800 bg-zinc-950 px-5 py-5"
        style={{
          transitionProperty: "transform, opacity",
          transitionDuration: `${durationMs}ms`,
          transitionTimingFunction: MOTION_EASE,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={visualEyebrow}>
              {session.slot} · {session.modalityLabel}
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-white">{session.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${visualTouch} flex items-center justify-center rounded-full border border-zinc-700 text-zinc-400`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-6 text-sm font-semibold text-zinc-200">{session.purpose}</p>
        <p className="mt-4 text-4xl font-bold tabular-nums tracking-tight text-white">{session.primaryTarget}</p>
        <p className={`mt-1 ${visualMeta}`}>
          {session.primaryDetail} · {session.duration}
        </p>
        <div className="mt-6">
          <p className={visualEyebrow}>Structure</p>
          <div className="mt-3">
            <IntervalTimeline steps={session.structure} />
          </div>
        </div>
        <dl className="mt-6 space-y-2">
          {session.prescriptions.map((row) => (
            <div key={row.label} className="flex justify-between gap-3 border-b border-zinc-800 pb-2">
              <dt className="text-xs text-zinc-400">{row.label}</dt>
              <dd className="text-sm tabular-nums text-white">{row.value}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-6 space-y-1 text-sm text-zinc-300">
          {session.guidance.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className={`mt-8 ${visualMeta}`}>Prototype drawer. Close returns to the same day.</p>
      </aside>
    </div>
  );
}
