"use client";

import type { HyroxSession, SessionDetail } from "@/app/lib/hyroxTeamDashboardMock";
import {
  resolveSessionCtaState,
  sessionCtaLabel,
  type SessionCtaState,
} from "@/app/lib/hyrox-team/modules/today/resolveTodaySessions";
import { resolveCompactSessionTargets } from "@/app/lib/hyrox-team/modules/home/resolveCompactSessionTargets";
import { sessionTypeStyle } from "@/components/hyrox-team/HyroxDashboardUi";
import { Play } from "lucide-react";

function populated(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = String(value).trim();
  if (!t || t === "—" || t.toLowerCase() === "n/a") return null;
  return t;
}

type Props = {
  session: HyroxSession;
  sessionIndex?: number;
  sessionCount?: number;
  detail: SessionDetail | null;
  sectionLabel: string;
  missionVariant?: "today" | "next";
  disabled?: boolean;
  onPrimaryAction: (session: HyroxSession, cta: SessionCtaState) => void;
};

export function HomeCompactSessionCard({
  session,
  sessionIndex = 0,
  sessionCount = 1,
  detail,
  sectionLabel,
  missionVariant = "today",
  disabled,
  onPrimaryAction,
}: Props) {
  const cta = resolveSessionCtaState(session);
  const planned = session.plannedTargets;
  const d = detail;

  const purpose = populated(d?.objective) || populated(session.intent) || populated(planned?.purpose);
  const duration =
    (d?.durationMin ? `${d.durationMin} min` : null) ||
    (planned?.estimatedDurationMinutes != null
      ? `${planned.estimatedDurationMinutes} min`
      : populated(session.duration));

  const targets = resolveCompactSessionTargets(session, d);

  const statusLabel =
    session.status === "complete"
      ? "Complete"
      : session.status === "missed"
        ? "Missed"
        : cta === "continue_logging"
          ? "In progress"
          : "Upcoming";

  const ctaText =
    missionVariant === "next" && cta === "start"
      ? "View session"
      : sessionCtaLabel(cta).toUpperCase();

  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-yellow-400/90">
            {sectionLabel}
            {sessionCount > 1 ? ` · ${sessionIndex + 1}/${sessionCount}` : ""}
          </p>
          <h3 className="mt-1 line-clamp-2 text-base font-bold text-white">{session.name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${sessionTypeStyle(session.type)}`}>
              {session.type}
            </span>
            {duration ? <span className="text-[10px] text-zinc-500">{duration}</span> : null}
            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">
              {statusLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          disabled={disabled || !session.id}
          onClick={() => onPrimaryAction(session, cta)}
          className="shrink-0 rounded-lg bg-yellow-400 px-3 py-2 text-[10px] font-bold text-zinc-950 hover:bg-yellow-300 disabled:opacity-50"
        >
          <span className="flex items-center gap-1">
            {(cta === "start" || cta === "continue_logging") && <Play className="h-3 w-3" />}
            {ctaText}
          </span>
        </button>
      </div>

      {purpose ? (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-400">{purpose}</p>
      ) : null}

      {targets.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {targets.map((t) => (
            <div key={t.label} className="text-xs">
              <span className="text-zinc-500">{t.label} </span>
              <span className="font-medium text-zinc-200">{t.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
