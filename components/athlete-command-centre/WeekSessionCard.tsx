"use client";

import { CheckCircle2 } from "lucide-react";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import { SessionStatusBadge, sessionTypeStyle } from "@/components/hyrox-team/HyroxDashboardUi";
import { btnPrimaryClass, btnSecondaryClass, formatRpeLabel } from "./athleteUi";
import { SessionTarget } from "./visual/SessionTarget";
import { visualTouch } from "./visual/tokens";

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

function populated(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  if (!t || t === "—" || t.toLowerCase() === "per programme prescription") return null;
  return t;
}

type Props = {
  session: HyroxSession;
  onView: () => void;
  onLog?: () => void;
};

export function WeekSessionCard({ session, onView, onLog }: Props) {
  const done = session.status === "complete";
  const keySession = session.priority === "Key";
  const tags = sessionTags(session);
  const coachNote = session.coachNote?.trim() ?? "";
  const coachPreview = coachNote.slice(0, 120) + (coachNote.length > 120 ? "…" : "");
  const hrRaw = session.detail?.hrZone?.trim() ?? "";
  const hrZone = hrRaw && hrRaw !== "—" && hrRaw !== "Per programme prescription" ? hrRaw : null;
  const pace = populated(session.detail?.targetPaceLoad) || populated(session.plannedTargets?.targetPace) || populated(session.plannedTargets?.targetSplit);

  return (
    <article
      className={`rounded-2xl border bg-zinc-950/80 shadow-sm shadow-black/10 ${
        done
          ? "border-zinc-800"
          : session.status === "modified"
            ? "border-amber-500/30"
            : session.status === "missed"
              ? "border-zinc-800"
              : keySession
                ? "border-yellow-400/35"
                : "border-zinc-800"
      }`}
    >
      <button type="button" onClick={onView} className="w-full min-h-11 p-4 text-left sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-zinc-800 bg-black">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{session.dayShort}</span>
            {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-zinc-300" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {session.dateLabel}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <h4 className="text-lg font-bold tracking-tight text-white">{session.name}</h4>
              {keySession ? (
                <span className="rounded-full border border-yellow-400/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-yellow-300">
                  Key session
                </span>
              ) : session.priority === "Optional" ? (
                <span className="rounded-full border border-zinc-700 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                  Optional add-on
                </span>
              ) : null}
              <SessionStatusBadge status={session.status} />
            </div>
            <p className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${sessionTypeStyle(session.type)}`}>
              {session.type}
            </p>
            {tags.length > 1 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.filter((t) => t !== session.type).map((t) => (
                  <span key={t} className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <SessionTarget label="Duration" value={session.duration} />
              <SessionTarget label="RPE" value={formatRpeLabel(session.rpeTarget)} />
              {pace ? <SessionTarget label="Pace / split" value={pace} /> : null}
              {hrZone ? <SessionTarget label="HR" value={hrZone} /> : null}
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-400">{session.intent}</p>
            {coachNote ? (
              <p className="mt-3 border-t border-zinc-800 pt-3 text-sm leading-relaxed text-zinc-400">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-yellow-400/80">Coach </span>
                {coachPreview}
              </p>
            ) : null}
          </div>
        </div>
      </button>
      <div className="flex gap-2 border-t border-zinc-800 px-4 py-3 sm:px-5">
        <button type="button" onClick={onView} className={`${btnPrimaryClass} ${visualTouch} flex-1 text-sm`}>
          View session
        </button>
        {onLog ? (
          <button type="button" onClick={onLog} className={`${btnSecondaryClass} ${visualTouch} flex-1 text-sm`}>
            Log result
          </button>
        ) : null}
      </div>
    </article>
  );
}
