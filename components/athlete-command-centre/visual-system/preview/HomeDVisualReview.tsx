"use client";

import { useMemo, useState } from "react";
import type { AthleteHomeDDay } from "@/app/lib/hyroxAthleteHomeDViewModel";
import {
  homeDDaysToWeekDateNav,
  homeDSessionToCardViewModel,
  splitPrimarySecondarySessions,
} from "@/app/lib/visual-system/homeDSessionCardAdapter";
import { WeekDateNav } from "../navigation/WeekDateNav";
import { PrimarySessionCard } from "../sessions/PrimarySessionCard";
import { SecondarySessionRow } from "../sessions/SecondarySessionRow";
import { AthleteCoachNote } from "../primitives/CoachNote";
import { BenchmarkMicro } from "../primitives/BenchmarkMicro";
import { vsSurface } from "../tokens";
import {
  HOME_D_VISUAL_REVIEW_STATES,
  getHomeDVisualReviewFixture,
  type HomeDVisualReviewStateId,
} from "./homeDVisualReviewFixtures";

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

/**
 * Authless, read-only Home D visual review chrome.
 * Uses real visual-system components + synthetic fixtures only.
 * Never mounts session detail / never calls live APIs.
 */
export function HomeDVisualReview({
  initialState = "upcoming",
}: {
  initialState?: HomeDVisualReviewStateId;
}) {
  const [stateId, setStateId] = useState<HomeDVisualReviewStateId>(initialState);
  const fixture = useMemo(() => getHomeDVisualReviewFixture(stateId), [stateId]);
  const [selectedId, setSelectedId] = useState(fixture.selectedId);
  const [ctaNotice, setCtaNotice] = useState(false);

  const activeSelectedId = fixture.weekDays.some((d) => d.id === selectedId)
    ? selectedId
    : fixture.selectedId;

  const selectedDay =
    fixture.weekDays.find((d) => d.id === activeSelectedId) ?? fixture.weekDays[0]!;
  const split = splitPrimarySecondarySessions(selectedDay.sessions);
  const navDays = homeDDaysToWeekDateNav(fixture.weekDays);
  const hasSideContext = Boolean(fixture.coachContext || fixture.performanceInsight);

  const onOpenReadOnly = () => {
    setCtaNotice(true);
    window.setTimeout(() => setCtaNotice(false), 2200);
  };

  return (
    <div
      data-preview-athlete-home=""
      data-preview-state={stateId}
      className="min-h-screen bg-[var(--h365-background)] text-[var(--h365-text)]"
    >
      <div className="border-b border-[var(--h365-accent)]/40 bg-[var(--h365-accent)] px-3 py-1.5 text-center">
        <p className="label-caps text-[11px] font-semibold tracking-wide text-[var(--h365-background)]">
          Visual review · Staging preview · Read-only · Synthetic fixtures
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-6 lg:pb-10 lg:pt-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {HOME_D_VISUAL_REVIEW_STATES.map((id) => {
            const label = getHomeDVisualReviewFixture(id).label;
            const active = id === stateId;
            return (
              <button
                key={id}
                type="button"
                data-preview-state-tab={id}
                onClick={() => {
                  setStateId(id);
                  setSelectedId(getHomeDVisualReviewFixture(id).selectedId);
                  setCtaNotice(false);
                }}
                className={
                  active
                    ? "rounded-lg border border-[var(--h365-accent)] bg-[var(--h365-accent)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--h365-background)]"
                    : "rounded-lg border border-[var(--h365-border)] bg-[var(--h365-surface)] px-2.5 py-1.5 text-[11px] text-[var(--h365-text-muted)]"
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        {ctaNotice ? (
          <p
            className="mb-3 rounded-lg border border-[var(--h365-border)] bg-[var(--h365-surface)] px-3 py-2 text-xs text-[var(--h365-text-muted)]"
            role="status"
          >
            Read-only visual review — session detail and writes are disabled here.
          </p>
        ) : null}

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
              <h1 className="mt-1 font-display text-[1.65rem] font-bold uppercase leading-none tracking-tight sm:text-3xl">
                {fixture.athleteName}
              </h1>
              <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-[var(--h365-text-muted)]">
                {fixture.programmeLine}
              </p>
            </header>

            <div className="sticky top-[var(--hybrid365-env-badge-height,0px)] z-20 -mx-4 border-b border-[var(--h365-border)] bg-[var(--h365-background)]/95 px-2 py-1.5 backdrop-blur-md sm:-mx-6 sm:px-3">
              <WeekDateNav
                days={navDays}
                selectedId={activeSelectedId}
                onSelect={setSelectedId}
              />
            </div>

            <section className="mt-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
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
                <div className={`${vsSurface} mt-4 px-4 py-6`} data-preview-rest-day="">
                  <p className="font-display text-base font-semibold uppercase tracking-wide">
                    No training scheduled
                  </p>
                  <p className="mt-1 text-xs text-[var(--h365-text-muted)]">
                    Use the week strip to check another day, or open Programme for the full week.
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {split.primary ? (
                    <PrimarySessionCard
                      session={homeDSessionToCardViewModel(
                        split.primary,
                        fixture.liveById[split.primary.id] ?? null
                      )}
                      onOpen={onOpenReadOnly}
                    />
                  ) : null}
                  {split.secondary.map((s) => (
                    <SecondarySessionRow
                      key={s.id}
                      session={homeDSessionToCardViewModel(s, fixture.liveById[s.id] ?? null)}
                      onOpen={onOpenReadOnly}
                    />
                  ))}
                </div>
              )}
            </section>

            {hasSideContext ? (
              <div className="mt-7 space-y-3 lg:hidden">
                {fixture.coachContext ? (
                  <div className={`${vsSurface} px-4 py-4`}>
                    <AthleteCoachNote
                      note={fixture.coachContext.body}
                      label={fixture.coachContext.title || "Coach note"}
                    />
                  </div>
                ) : null}
                {fixture.performanceInsight ? (
                  <BenchmarkMicro
                    label={fixture.performanceInsight.label}
                    value={fixture.performanceInsight.value}
                    detail={fixture.performanceInsight.detail}
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          {hasSideContext ? (
            <aside className="mt-8 hidden space-y-4 lg:mt-0 lg:block">
              {fixture.coachContext ? (
                <div className={`${vsSurface} px-4 py-4`}>
                  <AthleteCoachNote
                    note={fixture.coachContext.body}
                    label={fixture.coachContext.title || "Coach note"}
                  />
                </div>
              ) : null}
              {fixture.performanceInsight ? (
                <BenchmarkMicro
                  label={fixture.performanceInsight.label}
                  value={fixture.performanceInsight.value}
                  detail={fixture.performanceInsight.detail}
                />
              ) : null}
            </aside>
          ) : null}
        </div>
      </div>

      <nav
        aria-label="Visual review navigation (non-functional)"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--h365-border)] bg-[var(--h365-background)]/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 px-2 py-2 text-center text-[10px] text-[var(--h365-text-muted)]">
          {["Home", "Programme", "Progress", "Performance", "More"].map((label, i) => (
            <li key={label}>
              <span
                className={
                  i === 0
                    ? "inline-flex flex-col items-center gap-1 font-semibold text-[var(--h365-accent)]"
                    : "inline-flex flex-col items-center gap-1"
                }
              >
                <span
                  className={
                    i === 0
                      ? "grid size-8 place-items-center rounded-full bg-[var(--h365-accent)] text-[var(--h365-background)]"
                      : "grid size-8 place-items-center rounded-full border border-[var(--h365-border)]"
                  }
                  aria-hidden
                >
                  {label.slice(0, 1)}
                </span>
                {label}
              </span>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
