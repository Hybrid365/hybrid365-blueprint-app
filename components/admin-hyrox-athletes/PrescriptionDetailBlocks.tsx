"use client";

import type { ResolvedSessionPrescription } from "@/src/lib/hyrox/types";

/**
 * Renders full resolved prescription blocks for coach tools (schedule cards, edit drawer).
 */
export function PrescriptionDetailBlocks({
  p,
  className = "",
}: {
  p: ResolvedSessionPrescription;
  className?: string;
}) {
  return (
    <div className={`space-y-2 text-[10px] leading-relaxed ${className}`}>
      <p className="text-zinc-300">{p.objective}</p>

      {p.warmup.length > 0 ? (
        <div>
          <p className="font-semibold uppercase tracking-wide text-zinc-500">Warm-up</p>
          <ul className="mt-0.5 space-y-0.5 text-zinc-400">
            {p.warmup.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {p.mainSet.length > 0 ? (
        <div>
          <p className="font-semibold uppercase tracking-wide text-zinc-500">Main set</p>
          <div className="mt-0.5 space-y-0.5 text-zinc-400">
            {p.mainSet.map((line, i) =>
              line === "—" ? (
                <div key={`div-${i}`} className="my-1.5 border-t border-zinc-800/80" />
              ) : (
                <p key={`line-${i}-${line.slice(0, 24)}`}>· {line}</p>
              )
            )}
          </div>
        </div>
      ) : null}

      {p.cooldown.length > 0 ? (
        <div>
          <p className="font-semibold uppercase tracking-wide text-zinc-500">Cool-down</p>
          <ul className="mt-0.5 space-y-0.5 text-zinc-400">
            {p.cooldown.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {p.whatToRecord.length > 0 ? (
        <div>
          <p className="font-semibold uppercase tracking-wide text-zinc-500">What to record</p>
          <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-zinc-400">
            {p.whatToRecord.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {p.coachNote ? (
        <div>
          <p className="font-semibold uppercase tracking-wide text-zinc-500">Coach note</p>
          <p className="mt-0.5 text-zinc-400">{p.coachNote}</p>
        </div>
      ) : null}

      {p.safetyNote ? (
        <div>
          <p className="font-semibold uppercase tracking-wide text-zinc-500">Safety</p>
          <p className="mt-0.5 text-orange-200/80">{p.safetyNote}</p>
        </div>
      ) : null}
    </div>
  );
}
