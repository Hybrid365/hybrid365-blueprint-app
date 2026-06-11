"use client";

import Link from "next/link";
import { Calendar, CheckCircle2, Clock, Dumbbell, Gauge, Play, Target } from "lucide-react";
import type { TodayOrNextSessionResult } from "@/app/lib/memberNextSession";
import type { MemberSessionLogRecord } from "@/app/lib/sessionLogTypes";
import { resolveSessionDisplayState, SESSION_DISPLAY_LABELS } from "@/app/lib/sessionLogTypes";
import type { MemberSessionDrawerSession } from "@/app/lib/memberSessionTypes";

type Props = {
  todayResult: TodayOrNextSessionResult;
  sessionLog: MemberSessionLogRecord | undefined;
  trackLabel: string;
  isHyroxTrack?: boolean;
  onViewSession: (session: MemberSessionDrawerSession) => void;
  onLogResult: (session: MemberSessionDrawerSession) => void;
};

function statusBadgeStyle(state: ReturnType<typeof resolveSessionDisplayState>): string {
  switch (state) {
    case "complete":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "partial":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "skipped":
      return "border-zinc-600 bg-zinc-800/60 text-zinc-400";
    case "today":
      return "border-yellow-400/40 bg-yellow-400/10 text-yellow-300";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-400";
  }
}

export function DashboardTodayCard({
  todayResult,
  sessionLog,
  trackLabel,
  isHyroxTrack,
  onViewSession,
  onLogResult,
}: Props) {
  const { session, isTodayMatch, isRestDay } = todayResult;
  const displayState = session
    ? resolveSessionDisplayState({
        log: sessionLog,
        isTodaySession: isTodayMatch,
      })
    : null;

  const eyebrow = isTodayMatch
    ? "Today's session"
    : isRestDay
      ? "Recovery day"
      : session
        ? "Next session"
        : "Training";

  return (
    <section className="mb-8">
      <div className="overflow-hidden rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-yellow-400/[0.08] via-zinc-900 to-zinc-950 p-5 shadow-lg shadow-black/20 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400/90">
            {eyebrow}
          </p>
          <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-300">
            {trackLabel}
          </span>
        </div>

        {session ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-yellow-400/90">{session.day}</span>
              <span className="text-sm text-zinc-500">· Week {session.weekNumber}</span>
              {displayState ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeStyle(displayState)}`}
                >
                  {displayState === "complete" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : null}
                  {SESSION_DISPLAY_LABELS[displayState]}
                </span>
              ) : null}
            </div>

            <h2 className="mt-2 text-xl font-bold leading-tight text-white sm:text-2xl">
              {session.title}
            </h2>

            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400">{session.intent}</p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-yellow-400/80" />
                {session.duration}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="h-4 w-4 text-yellow-400/80" />
                {session.rpeGuide}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Target className="h-4 w-4 text-yellow-400/80" />
                {session.priorityCategoryLabel}
              </span>
              {session.category ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                  <Dumbbell className="h-3 w-3" />
                  {session.category}
                </span>
              ) : null}
            </div>

            {isHyroxTrack && session.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {session.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-yellow-500/20 bg-yellow-400/5 px-2 py-0.5 text-[10px] font-medium text-yellow-200/80"
                  >
                    {tag.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            ) : null}

            {isRestDay && !isTodayMatch ? (
              <p className="mt-4 text-sm text-zinc-500">
                No session scheduled today — here&apos;s your next priority session.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">You&apos;re caught up</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              No upcoming sessions in your unlocked weeks. Review your programme or log any extra
              training in your weekly check-in.
            </p>
          </>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={!session}
            onClick={() => session && onViewSession(session)}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Play className="h-5 w-5 shrink-0" />
            View session
          </button>
          <button
            type="button"
            disabled={!session}
            onClick={() => session && onLogResult(session)}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-yellow-500/35 bg-yellow-400/10 px-5 py-3.5 text-sm font-bold text-yellow-200 transition hover:bg-yellow-400/15 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {sessionLog ? "Edit log" : "Log result"}
          </button>
          <Link
            href="/dashboard/programme"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-3.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 sm:min-w-[11rem]"
          >
            <Calendar className="h-4 w-4 shrink-0 opacity-70" />
            View programme
          </Link>
        </div>
      </div>
    </section>
  );
}
