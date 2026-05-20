"use client";

import { useState } from "react";
import type { CoachDraftSession } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { ResolvedSessionPrescription } from "@/src/lib/hyrox/types";

function intensityTarget(p: ResolvedSessionPrescription | null): string | null {
  if (!p) return null;
  return p.targetPace ?? p.targetSplit ?? p.targetLoad ?? null;
}

export function DraftSessionCard({
  session,
  hardEasyLabel,
  onEdit,
  onMove,
  onReplace,
  onRemove,
}: {
  session: CoachDraftSession;
  hardEasyLabel: string;
  onEdit: () => void;
  onMove: () => void;
  onReplace: () => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const p = session.prescription;

  return (
    <div
      className={`rounded-xl border p-3 ${
        session.placementWarning
          ? "border-orange-500/40 bg-orange-400/5"
          : session.isKeySession
            ? "border-yellow-500/35 bg-yellow-400/5"
            : session.isOptional
              ? "border-sky-500/25 bg-sky-950/30"
              : "border-zinc-800 bg-zinc-950/60"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap gap-1">
            <span className="rounded-full border border-zinc-700 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400">
              {session.timeOfDay}
            </span>
            {session.badges.map((b) => (
              <span
                key={b}
                className="rounded-full border border-yellow-500/30 bg-yellow-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-yellow-200"
              >
                {b}
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-sm font-bold text-white">{session.title}</p>
          <p className="text-[10px] uppercase text-zinc-500">
            {session.sessionType.replace(/_/g, " ")} · {hardEasyLabel}
          </p>
        </div>
        <div className="text-right text-[11px] text-zinc-500">
          <p>{session.duration}</p>
          {session.thresholdMinutes ? (
            <p className="text-yellow-400/80">Threshold {session.thresholdMinutes} min</p>
          ) : null}
        </div>
      </div>

      {session.placementWarning ? (
        <p className="mt-2 text-[11px] text-orange-200/90">⚠ {session.placementWarning}</p>
      ) : null}

      <p className="mt-2 line-clamp-2 text-[11px] text-zinc-400">{session.rationale}</p>
      {p ? (
        <div className="mt-2 space-y-1 text-[11px] text-zinc-500">
          {intensityTarget(p) ? (
            <p>
              <span className="text-yellow-400/70">Target: </span>
              {intensityTarget(p)}
            </p>
          ) : null}
          <p>
            <span className="text-yellow-400/70">RPE/HR: </span>
            {session.rpeHr}
          </p>
          <p>
            <span className="text-zinc-600">Main: </span>
            {p.keySetSummary}
          </p>
        </div>
      ) : null}
      {session.coachNote ? (
        <p className="mt-2 text-[11px] italic text-violet-200/80">Coach: {session.coachNote}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <ActionBtn label="Edit" onClick={onEdit} />
        <ActionBtn label="Move" onClick={onMove} />
        <ActionBtn label="Replace" onClick={onReplace} />
        <ActionBtn label="Remove" onClick={onRemove} variant="danger" />
        {p ? (
          <ActionBtn
            label={expanded ? "Hide detail" : "Full detail"}
            onClick={() => setExpanded(!expanded)}
          />
        ) : null}
      </div>

      {expanded && p ? (
        <div className="mt-3 border-t border-zinc-800 pt-3 text-[11px] text-zinc-400">
          <p className="font-semibold text-zinc-300">{p.objective}</p>
          <ul className="mt-2 space-y-0.5">
            {p.mainSet.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
          <p className="mt-2 text-zinc-600">{p.safetyNote}</p>
        </div>
      ) : null}
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
        variant === "danger"
          ? "border-red-500/30 text-red-300 hover:bg-red-400/10"
          : "border-zinc-700 text-zinc-400 hover:border-yellow-500/30 hover:text-yellow-200"
      }`}
    >
      {label}
    </button>
  );
}
