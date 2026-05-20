"use client";

import type { ValidationItem } from "@/app/lib/hyroxCoachProgrammeDraft";
import { DashCard, SectionHeading } from "@/components/hyrox-team/HyroxDashboardUi";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function ProgrammeValidationPanel({
  warnings,
  positives,
}: {
  warnings: ValidationItem[];
  positives: ValidationItem[];
}) {
  return (
    <DashCard>
      <SectionHeading title="Programme validation" />
      {warnings.length === 0 && positives.length === 0 ? (
        <p className="text-sm text-zinc-500">No validation items.</p>
      ) : null}
      {warnings.length > 0 ? (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-bold uppercase text-red-400/90">Warnings</p>
          <ul className="space-y-2">
            {warnings.map((w) => (
              <li
                key={w.id}
                className="flex gap-2 rounded-lg border border-red-500/25 bg-red-400/5 px-3 py-2 text-xs text-red-100/90"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                {w.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {positives.length > 0 ? (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase text-emerald-400/90">Checks passed</p>
          <ul className="space-y-2">
            {positives.map((p) => (
              <li
                key={p.id}
                className="flex gap-2 rounded-lg border border-emerald-500/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-100/90"
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                {p.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DashCard>
  );
}
