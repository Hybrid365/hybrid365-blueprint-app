"use client";

import { ChevronRight, Play } from "lucide-react";
import type { MemberSessionDrawerSession } from "@/app/lib/memberSessionTypes";

type Props = {
  nextSession: MemberSessionDrawerSession | null;
  programmeGenerated: boolean;
  onOpenSession: (session: MemberSessionDrawerSession) => void;
};

export function GoToNextSessionCta({ nextSession, programmeGenerated, onOpenSession }: Props) {
  if (!programmeGenerated) return null;

  return (
    <section className="mb-8">
      <div className="rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-yellow-400/[0.08] via-zinc-900 to-zinc-950 p-5 shadow-lg shadow-black/20 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400/90">Training</p>
        {nextSession ? (
          <>
            <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">{nextSession.title}</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {nextSession.day} · Week {nextSession.weekNumber}
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">{nextSession.intent}</p>
          </>
        ) : (
          <>
            <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">You&apos;re caught up</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              No upcoming sessions in your unlocked weeks — browse your programme or review progress.
            </p>
          </>
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={!nextSession}
            onClick={() => nextSession && onOpenSession(nextSession)}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Play className="h-5 w-5 shrink-0" />
            Go to next session
          </button>
          <button
            type="button"
            disabled={!nextSession}
            onClick={() => nextSession && onOpenSession(nextSession)}
            className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[11rem] sm:flex-none"
          >
            Open today&apos;s training
            <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
          </button>
        </div>
      </div>
    </section>
  );
}
