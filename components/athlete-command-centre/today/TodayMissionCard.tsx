"use client";

import { useMemo, useState } from "react";
import type { HyroxSession, SessionDetail } from "@/app/lib/hyroxTeamDashboardMock";
import {
  resolveSessionCtaState,
  sessionCtaLabel,
  type SessionCtaState,
} from "@/app/lib/hyrox-team/modules/today/resolveTodaySessions";
import { sessionTypeStyle } from "@/components/hyrox-team/HyroxDashboardUi";
import { ChevronDown, Play } from "lucide-react";

function populated(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = String(value).trim();
  if (!t || t === "—" || t.toLowerCase() === "n/a") return null;
  return t;
}

function MetaRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 border-b border-zinc-800/60 py-1.5 text-sm last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-medium text-zinc-200">{value}</span>
    </div>
  );
}

function ListBlock({ title, lines }: { title: string; lines: string[] }) {
  const clean = lines.map((l) => l.trim()).filter(Boolean);
  if (!clean.length) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{title}</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-zinc-300">
        {clean.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

type Props = {
  session: HyroxSession;
  sessionIndex: number;
  sessionCount: number;
  detail: SessionDetail | null;
  isPrimary: boolean;
  onPrimaryAction: (session: HyroxSession, cta: SessionCtaState) => void;
  disabled?: boolean;
};

export function TodayMissionCard({
  session,
  sessionIndex,
  sessionCount,
  detail,
  isPrimary,
  onPrimaryAction,
  disabled,
}: Props) {
  const [expanded, setExpanded] = useState(isPrimary);
  const cta = resolveSessionCtaState(session);
  const planned = session.plannedTargets;
  const d = detail;

  const purpose = populated(d?.objective) || populated(session.intent) || populated(planned?.purpose);
  const duration =
    (d?.durationMin ? `${d.durationMin} min` : null) ||
    (planned?.estimatedDurationMinutes != null
      ? `${planned.estimatedDurationMinutes} min`
      : populated(session.duration));
  const targetPace =
    populated(d?.targetPaceLoad) ||
    populated(planned?.targetPace) ||
    populated(planned?.targetLoad) ||
    populated(planned?.targetSplit);
  const targetHr = populated(d?.hrZone) || populated(planned?.targetHR);
  const targetRpe =
    populated(d?.rpeTarget) || populated(planned?.targetRPE) || populated(session.rpeTarget);
  const coachNote = populated(d?.coachNote) || populated(session.coachNote);
  const executionNotes = populated(d?.coachPacingNote) || populated(d?.filmPrompt);

  const warmUp = d?.warmUp ?? [];
  const mainSet = d?.mainSet ?? [];
  const coolDown = d?.coolDown ?? [];

  const statusChip = useMemo(() => {
    if (session.status === "complete") return { text: "Complete", className: "text-emerald-400 border-emerald-500/30" };
    if (session.status === "missed") return { text: "Missed", className: "text-red-300 border-red-500/30" };
    if (session.status === "modified") return { text: "Modified", className: "text-amber-200 border-amber-500/30" };
    if (cta === "continue_logging") return { text: "In progress", className: "text-yellow-300 border-yellow-500/30" };
    return { text: isPrimary ? "Current" : "Upcoming", className: "text-zinc-400 border-zinc-700" };
  }, [session.status, cta, isPrimary]);

  const plannedCompleted =
    session.activityMetrics || session.loggedRpe
      ? [
          {
            label: "Pace / load",
            planned: targetPace,
            completed:
              populated(
                String(
                  (session.activityMetrics as { averagePace?: string; paceOrSplit?: string } | null)
                    ?.averagePace ??
                    (session.activityMetrics as { paceOrSplit?: string } | null)?.paceOrSplit ??
                    ""
                )
              ) || populated(session.logScore),
          },
          {
            label: "RPE",
            planned: targetRpe,
            completed: populated(session.loggedRpe),
          },
        ].filter((r) => r.planned || r.completed)
      : [];

  return (
    <article
      className={`rounded-2xl border bg-zinc-950/80 p-5 transition ${
        isPrimary
          ? "border-yellow-400/35 shadow-[0_0_0_1px_rgba(250,204,21,0.08)]"
          : "border-zinc-800"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {sessionCount > 1 ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/90">
              Session {sessionIndex + 1} of {sessionCount}
              {session.timeOfDay ? ` · ${session.timeOfDay}` : ""}
            </p>
          ) : (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/90">
              Today&apos;s mission
            </p>
          )}
          <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">{session.name}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs ${sessionTypeStyle(session.type)}`}>
              {session.type}
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs ${statusChip.className}`}>
              {statusChip.text}
            </span>
          </div>
        </div>
        <button
          type="button"
          disabled={disabled || !session.id}
          onClick={() => onPrimaryAction(session, cta)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cta === "start" || cta === "continue_logging" || cta === "log_partial" ? (
            <Play className="h-4 w-4" />
          ) : null}
          {sessionCtaLabel(cta)}
        </button>
      </div>

      {purpose ? (
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">
          <span className="font-semibold text-zinc-100">Why: </span>
          {purpose}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-0 sm:grid-cols-3">
        <MetaRow label="Duration" value={duration} />
        <MetaRow label="Target pace" value={targetPace} />
        <MetaRow label="Target HR" value={targetHr} />
        <MetaRow label="Target RPE" value={targetRpe} />
      </div>

      {plannedCompleted.length > 0 ? (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Planned vs completed
          </p>
          <ul className="mt-2 space-y-1">
            {plannedCompleted.map((row) => (
              <li key={row.label} className="grid grid-cols-3 gap-2 text-xs">
                <span className="text-zinc-500">{row.label}</span>
                <span className="text-zinc-400">{row.planned ?? "—"}</span>
                <span className="font-medium text-zinc-200">{row.completed ?? "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-zinc-800 px-3 py-2 text-left text-xs font-semibold text-zinc-300 hover:border-zinc-700"
      >
        <span>{expanded ? "Hide prescription detail" : "How to execute"}</span>
        <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded ? (
        <div className="mt-3 space-y-4 border-t border-zinc-800/80 pt-4">
          <ListBlock title="Warm-up" lines={warmUp} />
          <ListBlock title="Main work" lines={mainSet} />
          <ListBlock title="Cool-down" lines={coolDown} />
          {executionNotes ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Execution notes
              </p>
              <p className="mt-1 text-sm text-zinc-300">{executionNotes}</p>
            </div>
          ) : null}
          {coachNote ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-400/80">
                Coach notes
              </p>
              <p className="mt-1 text-sm text-zinc-300">{coachNote}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
