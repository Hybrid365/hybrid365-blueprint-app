"use client";

import { useMemo, useState } from "react";
import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import type { CoachDraftSession } from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  applyManualStageChangeToSession,
  describeStageStructure,
  listManualStageOptions,
} from "@/app/lib/hyroxSessionFamilyApply";
import { getSessionFamily } from "@/app/lib/hyroxSessionFamilyRegistry";
import { resolveSessionFamilyStage } from "@/app/lib/hyroxSessionFamilyResolve";

function formatPace(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}/km`;
}

export function ChangeStageModal({
  open,
  session,
  profile,
  onClose,
  onConfirm,
}: {
  open: boolean;
  session: CoachDraftSession | null;
  profile: HyroxAthletePerformanceProfile | null;
  onClose: () => void;
  onConfirm: (next: CoachDraftSession) => void | Promise<void>;
}) {
  const family = session?.sessionFamily
    ? getSessionFamily(session.sessionFamily.familyId)
    : null;
  const options = useMemo(() => {
    if (!family || !session?.sessionFamily) return [];
    return listManualStageOptions(family, session.sessionFamily.stageId);
  }, [family, session?.sessionFamily]);

  const [selectedKey, setSelectedKey] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const selected = options.find((o) => `${o.action}:${o.toStageId}` === selectedKey) ?? options[0];

  const preview = useMemo(() => {
    if (!family || !selected || !profile) return null;
    return resolveSessionFamilyStage({
      family,
      stageId: selected.toStageId,
      profile,
      resolvedAt: new Date().toISOString(),
    });
  }, [family, selected, profile]);

  if (!open || !session?.sessionFamily || !family) return null;

  const currentStage = family.stages.find((s) => s.id === session.sessionFamily!.stageId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <header className="border-b border-zinc-800 px-4 py-3">
          <h3 className="text-sm font-bold text-white">Change stage</h3>
          <p className="text-[11px] text-zinc-500">
            Coach selects explicitly. No automatic progression.
          </p>
        </header>

        <div className="space-y-3 p-4">
          <div className="rounded border border-zinc-800 bg-zinc-900/50 p-2.5 text-xs text-zinc-300">
            <p className="font-bold text-zinc-100">{family.name}</p>
            <p className="mt-1">
              Current: {currentStage?.label ?? session.sessionFamily.stageLabel}
            </p>
            {currentStage ? (
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {describeStageStructure(currentStage)}
              </p>
            ) : null}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Valid transitions
            </p>
            <div className="mt-1 max-h-56 space-y-1 overflow-y-auto">
              {options.map((opt) => {
                const key = `${opt.action}:${opt.toStageId}`;
                const active = (selectedKey || `${options[0]?.action}:${options[0]?.toStageId}`) === key;
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer gap-2 rounded border px-2 py-1.5 text-xs ${
                      active
                        ? "border-violet-500/50 bg-violet-400/10 text-violet-50"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-300"
                    }`}
                  >
                    <input
                      type="radio"
                      className="mt-0.5"
                      checked={active}
                      onChange={() => setSelectedKey(key)}
                    />
                    <span>
                      <span className="font-bold">
                        {opt.action} → {opt.toStageLabel}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-zinc-500">
                        {opt.structureLine}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {preview ? (
            <div className="rounded border border-zinc-800 bg-zinc-900/40 p-2.5 text-xs">
              <p className="text-[10px] font-bold uppercase text-zinc-500">Preview</p>
              <p className="mt-1 text-zinc-200">{preview.humanSummary}</p>
              <p className="mt-1 font-mono text-[11px] text-yellow-200/90">
                {preview.slots[0]?.expression} → {formatPace(preview.slots[0]?.resolvedValue)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-orange-300">
              Profile required to preview resolved pace.
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-zinc-800 px-4 py-3">
          <button
            type="button"
            className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected || !profile || busy}
            className="rounded border border-violet-500/50 bg-violet-400/15 px-3 py-1.5 text-xs font-bold text-violet-100 disabled:opacity-40"
            onClick={async () => {
              if (!selected || !profile || !family) return;
              setBusy(true);
              try {
                const next = applyManualStageChangeToSession({
                  session,
                  family,
                  nextStageId: selected.toStageId,
                  profile,
                  resolvedAt: new Date().toISOString(),
                });
                await onConfirm(next);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Updating…" : "Apply stage"}
          </button>
        </footer>
      </div>
    </div>
  );
}
