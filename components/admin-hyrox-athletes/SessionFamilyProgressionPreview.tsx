"use client";

import { describeStageStructure, listManualStageOptions } from "@/app/lib/hyroxSessionFamilyApply";
import type { SessionFamily } from "@/app/lib/hyroxSessionFamilyTypes";
import { coachStageShortLabel } from "@/app/lib/hyroxSessionFamilyAthleteCopy";

/**
 * Dense coach-facing family graph preview.
 * Default path down; alternate REPEAT / REDUCE / DELOAD branches listed.
 */
export function SessionFamilyProgressionPreview({
  family,
  highlightStageId,
}: {
  family: SessionFamily;
  highlightStageId?: string | null;
}) {
  const working = family.stages.filter(
    (s) => !s.key.startsWith("deload") && s.key !== "consolidation"
  );
  const consol = family.stages.find((s) => s.key === "consolidation");
  const deload = family.stages.find((s) => s.key.startsWith("deload"));

  return (
    <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-950/90 p-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-yellow-500/80">
        Progression preview
      </p>
      <p className="mt-0.5 text-[10px] text-zinc-500">{family.objective}</p>
      <div className="mt-2 space-y-1">
        {working.map((stage, i) => {
          const active = stage.id === highlightStageId;
          return (
            <div key={stage.id}>
              <div
                className={`rounded px-2 py-1.5 text-[11px] ${
                  active
                    ? "bg-yellow-400/10 text-yellow-100 ring-1 ring-yellow-500/35"
                    : "bg-zinc-900/80 text-zinc-300"
                }`}
              >
                <span className="font-semibold text-zinc-400">
                  {coachStageShortLabel(stage.key)}
                </span>
                <span className="mx-1 text-zinc-600">·</span>
                <span>{describeStageStructure(stage)}</span>
                {stage.intents[0] ? (
                  <span className="ml-1 text-[9px] uppercase text-zinc-600">
                    {stage.intents[0]}
                  </span>
                ) : null}
              </div>
              {i < working.length - 1 ? (
                <p className="py-0.5 text-center text-[10px] text-zinc-600">↓ PROGRESS</p>
              ) : null}
            </div>
          );
        })}
        {consol ? (
          <>
            <p className="py-0.5 text-center text-[10px] text-zinc-600">⇢ Consolidation</p>
            <div className="rounded bg-zinc-900/60 px-2 py-1 text-[11px] text-zinc-400">
              {coachStageShortLabel(consol.key)} · {describeStageStructure(consol)}
            </div>
          </>
        ) : null}
        {deload ? (
          <>
            <p className="py-0.5 text-center text-[10px] text-zinc-600">⇢ Deload</p>
            <div className="rounded bg-zinc-900/60 px-2 py-1 text-[11px] text-zinc-400">
              {coachStageShortLabel(deload.key)} · {describeStageStructure(deload)}
            </div>
          </>
        ) : null}
      </div>

      {highlightStageId ? (
        <AlternateBranches family={family} fromStageId={highlightStageId} />
      ) : null}
    </div>
  );
}

function AlternateBranches({
  family,
  fromStageId,
}: {
  family: SessionFamily;
  fromStageId: string;
}) {
  const options = listManualStageOptions(family, fromStageId).filter(
    (o) => o.action !== "PROGRESS"
  );
  if (!options.length) return null;
  return (
    <div className="mt-2 border-t border-zinc-800 pt-2">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
        From here
      </p>
      <ul className="mt-1 space-y-0.5 text-[10px] text-zinc-400">
        {options.slice(0, 6).map((o) => (
          <li key={`${o.action}-${o.toStageId}`}>
            <span className="font-semibold text-zinc-300">{o.action}</span>
            <span className="text-zinc-600"> → </span>
            {o.toStageLabel}
          </li>
        ))}
      </ul>
    </div>
  );
}
