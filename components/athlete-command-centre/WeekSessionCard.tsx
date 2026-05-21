"use client";

import { CheckCircle2, Clock, Heart } from "lucide-react";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import { getSessionDetail } from "@/app/lib/hyroxTeamDashboardMock";
import { SessionStatusBadge, sessionTypeStyle } from "@/components/hyrox-team/HyroxDashboardUi";
import { btnPrimaryClass, btnSecondaryClass } from "./athleteUi";

function sessionTags(session: HyroxSession): string[] {
  if (session.type === "Run" && session.name.toLowerCase().includes("threshold")) {
    return ["Running", "Threshold"];
  }
  if (session.type === "Hybrid") return ["Hyrox", "Strength"];
  if (session.type === "Strength") return ["Strength"];
  if (session.type === "Run") return ["Running"];
  if (session.type === "Aerobic") return ["Running", "Aerobic"];
  return [session.type];
}

function priorityStyle(p: HyroxSession["priority"]) {
  if (p === "Key") return "border-yellow-400/40 bg-yellow-400/15 text-yellow-300";
  return "border-zinc-700 text-zinc-400";
}

type Props = {
  session: HyroxSession;
  onView: () => void;
  onLog?: () => void;
};

export function WeekSessionCard({ session, onView, onLog }: Props) {
  const done = session.status === "complete";
  const mockDetail = getSessionDetail(session.id);
  const tags = sessionTags(session);
  const coachNote = session.coachNote?.trim() || mockDetail.coachNote;
  const coachPreview = coachNote.slice(0, 120) + (coachNote.length > 120 ? "…" : "");
  const hrZone = mockDetail.hrZone !== "—" ? mockDetail.hrZone : null;

  return (
    <article
      className={`group rounded-2xl border shadow-sm shadow-black/10 transition duration-200 ${
        done
          ? "border-emerald-500/35 bg-emerald-950/15 hover:border-emerald-500/50"
          : session.status === "modified"
            ? "border-amber-500/30 bg-amber-950/10 hover:border-amber-500/40"
            : session.status === "missed"
              ? "border-red-500/25 bg-red-950/10"
              : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700"
      }`}
    >
      <button type="button" onClick={onView} className="w-full p-4 text-left sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950">
            <span className="text-[10px] font-semibold uppercase text-zinc-500">{session.dayShort}</span>
            {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {session.dateLabel}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h4 className="text-base font-bold text-white sm:text-lg">{session.name}</h4>
              {session.priority === "Key" ? (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${priorityStyle("Key")}`}>
                  Key session
                </span>
              ) : session.priority === "Optional" ? (
                <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  Optional add-on
                </span>
              ) : null}
              <SessionStatusBadge status={session.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${sessionTypeStyle(session.type)}`}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-yellow-400/80" />
                {session.duration}
              </span>
              <span>RPE {session.rpeTarget}</span>
              {hrZone ? (
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 text-red-400/80" />
                  {hrZone}
                </span>
              ) : null}
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{session.intent}</p>
            <p className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-2.5 py-2 text-xs text-zinc-400">
              <span className="font-semibold text-yellow-400/80">Coach: </span>
              {coachPreview}
            </p>
          </div>
        </div>
      </button>
      <div className="flex gap-2 border-t border-zinc-800/80 px-4 pb-4 pt-3 sm:px-5">
        <button
          type="button"
          onClick={onView}
          className={`${btnPrimaryClass} flex-1 !min-h-0 py-2.5 text-xs`}
        >
          View session
        </button>
        {onLog ? (
          <button
            type="button"
            onClick={onLog}
            className={`${btnSecondaryClass} flex-1 !min-h-0 py-2.5 text-xs`}
          >
            Log result
          </button>
        ) : null}
      </div>
    </article>
  );
}
