"use client";

import type { ResolvedSessionPrescription } from "@/src/lib/hyrox/types";
import type { SandboxDaySession, SandboxSessionBlock } from "@/app/lib/hyroxProgrammeSandbox";

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "key" | "optional" | "support" | "am" | "pm" | "hard" | "easy" | "default";
}) {
  const styles: Record<string, string> = {
    key: "border-yellow-500/40 bg-yellow-400/15 text-yellow-300",
    optional: "border-sky-500/30 bg-sky-400/10 text-sky-200",
    support: "border-zinc-600 bg-zinc-800/80 text-zinc-300",
    am: "border-violet-500/30 bg-violet-400/10 text-violet-200",
    pm: "border-orange-500/30 bg-orange-400/10 text-orange-200",
    hard: "border-red-500/40 bg-red-400/10 text-red-200",
    easy: "border-emerald-500/30 bg-emerald-400/10 text-emerald-200",
    default: "border-zinc-700 text-zinc-400",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles[variant] ?? styles.default}`}
    >
      {children}
    </span>
  );
}

function badgeVariant(label: string): "key" | "optional" | "support" | "am" | "pm" | "hard" | "easy" | "default" {
  if (label === "Key Session") return "key";
  if (label === "Optional Add-On") return "optional";
  if (label === "Support Add-On") return "support";
  if (label === "AM") return "am";
  if (label === "PM") return "pm";
  if (label === "Hard Day") return "hard";
  if (label === "Easy Day") return "easy";
  return "default";
}

function intensityTarget(p: ResolvedSessionPrescription): string | null {
  return p.targetPace ?? p.targetSplit ?? p.targetLoad ?? null;
}

function PrescriptionSummary({ p }: { p: ResolvedSessionPrescription }) {
  const target = intensityTarget(p);
  return (
    <div className="mt-3 space-y-2 border-t border-zinc-800/80 pt-3 text-xs">
      <p className="text-zinc-300">
        <span className="font-semibold text-zinc-500">Objective: </span>
        {p.objective}
      </p>
      {target ? (
        <p className="text-zinc-400">
          <span className="font-semibold text-yellow-400/80">Target: </span>
          {target}
        </p>
      ) : null}
      {p.targetHRRange || p.fallbackHRGuide ? (
        <p className="text-zinc-400">
          <span className="font-semibold text-yellow-400/80">HR: </span>
          {p.targetHRRange ?? p.fallbackHRGuide}
        </p>
      ) : null}
      <p className="text-zinc-400">
        <span className="font-semibold text-yellow-400/80">RPE: </span>
        {p.rpeTarget}
      </p>
      <p className="text-zinc-400">
        <span className="font-semibold text-yellow-400/80">Main set: </span>
        {p.keySetSummary}
      </p>
      <p className="text-zinc-500">
        <span className="font-semibold text-zinc-600">Record: </span>
        {p.whatToRecord.slice(0, 4).join(" · ")}
        {p.whatToRecord.length > 4 ? "…" : ""}
      </p>
      <p className="italic text-zinc-500">{p.coachNote}</p>
    </div>
  );
}

function PrescriptionFullDetail({ p }: { p: ResolvedSessionPrescription }) {
  return (
    <div className="mt-3 space-y-3 border-t border-zinc-800 pt-3 text-xs">
      <p className="text-[10px] font-bold uppercase text-zinc-500">
        {p.progressionLabel} · {p.sessionLibraryId}
      </p>
      {p.warmup.length > 0 ? (
        <div>
          <p className="font-semibold text-yellow-400/80">Warm-up</p>
          <ul className="mt-1 space-y-0.5 text-zinc-400">
            {p.warmup.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div>
        <p className="font-semibold text-yellow-400/80">Main set</p>
        <ul className="mt-1 space-y-1 text-zinc-300">
          {p.mainSet.map((line) => (
            <li key={line}>· {line}</li>
          ))}
        </ul>
      </div>
      {p.cooldown.length > 0 ? (
        <div>
          <p className="font-semibold text-yellow-400/80">Cool-down</p>
          <ul className="mt-1 space-y-0.5 text-zinc-400">
            {p.cooldown.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {p.progressionNote ? (
        <p className="text-zinc-500">
          <span className="text-yellow-400/80">Progression: </span>
          {p.progressionNote}
        </p>
      ) : null}
      <p className="text-zinc-500">
        <span className="text-yellow-400/80">Safety: </span>
        {p.safetyNote}
      </p>
      {p.filmPrompt ? (
        <p className="text-purple-200/90">
          <span className="font-semibold text-purple-300/80">Film: </span>
          {p.filmPrompt}
        </p>
      ) : null}
      {p.equipmentRequired.length > 0 ? (
        <p className="text-zinc-600">
          Equipment: {p.equipmentRequired.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function SessionBlockCard({
  block,
  expanded,
  onToggleExpand,
}: {
  block: SandboxSessionBlock;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const p = block.prescription;

  return (
    <div
      className={`rounded-xl border p-4 ${
        block.isKeySession
          ? "border-yellow-500/35 bg-yellow-400/5"
          : block.isOptional
            ? "border-sky-500/25 bg-sky-950/30"
            : "border-zinc-800 bg-zinc-950/50"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap gap-1.5">
            {block.badges.map((b) => (
              <Badge key={b} variant={badgeVariant(b)}>
                {b}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-sm font-bold text-white">{block.title}</p>
        </div>
        <div className="text-right text-xs text-zinc-500">
          <p>{block.duration}</p>
          <p className="mt-0.5 max-w-[200px] text-[11px] leading-snug">{block.rpeHr}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        <span className="font-semibold text-zinc-500">Why: </span>
        {block.rationale}
      </p>
      {block.emom ? (
        <p className="mt-2 text-xs text-purple-200/90">
          Finisher: {block.emom.movement} · {block.emom.durationMinutes} min · {block.emom.repsOrLoad}
        </p>
      ) : null}
      {p ? <PrescriptionSummary p={p} /> : null}
      {p ? (
        <button
          type="button"
          onClick={onToggleExpand}
          className="mt-3 text-xs font-semibold text-yellow-400 hover:text-yellow-300"
        >
          {expanded ? "Hide full session detail ↑" : "Full session detail ↓"}
        </button>
      ) : null}
      {expanded && p ? <PrescriptionFullDetail p={p} /> : null}
    </div>
  );
}

export function SandboxDayScheduleCard({
  day,
  expandedBlockKey,
  onToggleBlock,
}: {
  day: SandboxDaySession;
  expandedBlockKey: string | null;
  onToggleBlock: (key: string | null) => void;
}) {
  if (day.intensity === "rest") {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 opacity-60">
        <p className="text-xs font-bold uppercase text-zinc-500">{day.day} — Rest</p>
        <p className="mt-1 text-sm text-zinc-400">{day.rationale}</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        day.hardDay ? "border-red-500/25" : "border-zinc-800"
      } ${day.isKeySession ? "ring-1 ring-yellow-500/20" : ""}`}
    >
      <div className="mb-4">
        <p className="text-xs font-bold uppercase text-yellow-400/80">{day.day}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge variant={day.hardDay ? "hard" : "easy"}>{day.hardEasyLabel}</Badge>
          {day.thresholdMinutes > 0 ? (
            <Badge variant="default">Threshold {day.thresholdMinutes} min</Badge>
          ) : null}
          {day.stationFocus ? <Badge variant="default">Station: {day.stationFocus}</Badge> : null}
        </div>
      </div>

      <div className="space-y-3">
        {day.sessions.map((block) => {
          const key = `${day.day}-${block.timeOfDay}-${block.title}`;
          return (
            <SessionBlockCard
              key={key}
              block={block}
              expanded={expandedBlockKey === key}
              onToggleExpand={() => onToggleBlock(expandedBlockKey === key ? null : key)}
            />
          );
        })}
      </div>
    </div>
  );
}
