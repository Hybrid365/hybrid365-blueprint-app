"use client";

import type { ValidationItem } from "@/app/lib/hyroxCoachProgrammeDraft";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function ProgrammeValidationPanel({
  warnings,
  positives,
}: {
  warnings: ValidationItem[];
  positives: ValidationItem[];
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <h2 className="text-sm font-bold text-white">Validation</h2>
      {warnings.length > 0 && (
        <ul className="mt-3 space-y-2">
          <p className="text-[10px] font-bold uppercase text-red-400/80">Warnings</p>
          {warnings.map((w) => (
            <li
              key={w.id}
              className="flex gap-2 rounded-lg border border-red-500/25 bg-red-400/5 px-2 py-1.5 text-[11px] text-red-100/90"
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              {w.message}
            </li>
          ))}
        </ul>
      )}
      {positives.length > 0 && (
        <ul className="mt-3 space-y-2">
          <p className="text-[10px] font-bold uppercase text-emerald-400/80">Checks passed</p>
          {positives.map((p) => (
            <li
              key={p.id}
              className="flex gap-2 rounded-lg border border-emerald-500/20 bg-emerald-400/5 px-2 py-1.5 text-[11px] text-emerald-100/90"
            >
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
              {p.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
