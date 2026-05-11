"use client";

import { Check } from "lucide-react";
import type { SessionSharePlaintextInput } from "@/app/lib/sessionShareCardText";

export type SessionShareCardProps = SessionSharePlaintextInput & {
  className?: string;
};

/**
 * Screenshot-friendly story overlay (~9:16). Parent can wrap in fixed width.
 */
export function SessionShareCard({
  className = "",
  weekNumber,
  day,
  title,
  categoryLabel,
  duration,
  priorityLabel,
  mainWorkLines,
  completed,
  rpe,
  preview,
}: SessionShareCardProps) {
  const dayUpper = day.trim().toUpperCase();
  const showComplete = completed && !preview;

  return (
    <div
      className={`flex aspect-[9/16] w-full max-w-[280px] flex-col rounded-3xl border border-yellow-500/25 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-5 shadow-2xl shadow-black/60 sm:max-w-[300px] sm:p-6 ${className}`}
    >
      <div className="shrink-0 border-b border-yellow-500/20 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-yellow-400/95">Hybrid365</p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Week {weekNumber} / {dayUpper}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden pt-4">
        <h2 className="text-lg font-bold leading-snug text-white sm:text-xl">{title}</h2>
        <p className="mt-2 text-xs font-medium capitalize text-zinc-400">{categoryLabel}</p>
        <p className="mt-1 text-sm text-zinc-300">
          {duration} · {priorityLabel}
        </p>

        {mainWorkLines.length > 0 ? (
          <div className="mt-4 rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Main work</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-snug text-zinc-200">
              {mainWorkLines.map((line) => (
                <li key={line} className="break-words">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 space-y-2 border-t border-zinc-800/80 pt-4">
        {showComplete ? (
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
            COMPLETED
          </div>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Today&apos;s session</p>
        )}

        {showComplete && rpe != null ? (
          <p className="text-sm font-semibold text-white">
            RPE <span className="text-yellow-400">{rpe}</span>
            <span className="text-zinc-500">/10</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
