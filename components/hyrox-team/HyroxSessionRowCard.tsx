"use client";

import { CheckCircle2, ChevronRight, Clock } from "lucide-react";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import { SessionStatusBadge, sessionTypeStyle } from "@/components/hyrox-team/HyroxDashboardUi";

function priorityStyle(p: HyroxSession["priority"]) {
  if (p === "Key") return "bg-yellow-400/25 text-yellow-300 border-yellow-400/40";
  if (p === "Supporting") return "bg-zinc-600/40 text-zinc-300 border-zinc-700/50";
  return "bg-zinc-700/50 text-zinc-400 border-zinc-800/60";
}

type Props = {
  session: HyroxSession;
  onView?: () => void;
};

export function HyroxSessionRowCard({ session, onView }: Props) {
  const completed = session.status === "complete";
  const modified = session.status === "modified";
  const missed = session.status === "missed";

  return (
    <div
      className={`flex items-stretch gap-4 rounded-2xl border p-5 transition-all sm:gap-5 sm:p-6 ${
        completed
          ? "border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400/40"
          : modified
            ? "border-amber-500/30 bg-amber-950/15 hover:border-amber-400/35"
            : missed
              ? "border-red-500/25 bg-red-950/10 hover:border-red-400/30"
              : "border-zinc-800 bg-zinc-900/90 hover:border-zinc-700/60 hover:bg-zinc-900"
      }`}
    >
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-800/80 sm:h-16 sm:w-16">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Day</span>
        <span className="text-sm font-bold text-white">{session.dayShort}</span>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-base font-semibold leading-snug text-white sm:text-lg">{session.name}</h4>
          {completed ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </span>
          ) : null}
          <SessionStatusBadge status={session.status} />
        </div>
        <p className="mt-1 text-sm text-zinc-500">{session.focus}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${sessionTypeStyle(session.type)}`}
          >
            {session.type}
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityStyle(session.priority)}`}>
            {session.priority}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-yellow-400/80" />
            {session.duration}
          </span>
          <span>RPE {session.rpeTarget}</span>
          {session.loggedRpe ? (
            <span className="text-emerald-400/90">Logged {session.loggedRpe}</span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center">
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-700/60 hover:bg-zinc-700 hover:text-white"
        >
          <span className="hidden sm:inline">
            {completed || modified ? "View log" : "View / log"}
          </span>
          <ChevronRight className="h-5 w-5 text-zinc-400" />
        </button>
      </div>
    </div>
  );
}
