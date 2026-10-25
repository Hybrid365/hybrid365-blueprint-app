"use client";

import { useEffect, useMemo, useState } from "react";
import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import type { WeekdayName } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { SandboxTimeOfDay } from "@/app/lib/hyroxProgrammeSandbox";
import {
  formatRecoveriesWithSuffix,
  formatRepeatBlock,
} from "@/app/lib/hyroxSessionFamilyFormat";
import {
  formatStageKeyShort,
  listPilotSessionFamilies,
  proposeDefaultProgressionStages,
  type ProgressionBlockLength,
  type ProgressionWeekProposal,
} from "@/app/lib/hyroxSessionFamilyProposal";
import { resolveSessionFamilyStage } from "@/app/lib/hyroxSessionFamilyResolve";
import type { SessionFamily, SessionFamilyStage } from "@/app/lib/hyroxSessionFamilyTypes";

const WEEKDAYS: WeekdayName[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS: SandboxTimeOfDay[] = ["AM", "Main", "PM"];

function formatPace(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}/km`;
}

function stageStructureLine(stage: SessionFamilyStage): string {
  const block = stage.structuredWorkout.blocks.find((b) => b.type === "repeat");
  if (!block || block.type !== "repeat") return stage.label;
  return `${formatRepeatBlock(block)} · ${formatRecoveriesWithSuffix(block.recoveries)}`;
}

export type ProgressionAssignmentApplyPayload = {
  family: SessionFamily;
  proposals: ProgressionWeekProposal[];
  day: WeekdayName;
  slot: SandboxTimeOfDay;
  overridePaceSecondsPerKm: number | null;
  overrideReason: string;
  resolvedAt: string;
};

export function ProgressionAssignmentModal({
  open,
  onClose,
  onApply,
  profile,
  defaultDay = "Wed",
  defaultSlot = "AM",
}: {
  open: boolean;
  onClose: () => void;
  onApply: (payload: ProgressionAssignmentApplyPayload) => void | Promise<void>;
  profile: HyroxAthletePerformanceProfile | null;
  defaultDay?: WeekdayName;
  defaultSlot?: SandboxTimeOfDay;
}) {
  const families = useMemo(() => listPilotSessionFamilies(), []);
  const [familyId, setFamilyId] = useState(families[0]?.id ?? "");
  const family = families.find((f) => f.id === familyId) ?? families[0] ?? null;

  const [entryStageId, setEntryStageId] = useState(family?.defaultEntryStageId ?? "");
  const [blockLength, setBlockLength] = useState<ProgressionBlockLength>(4);
  const [day, setDay] = useState<WeekdayName>(defaultDay);
  const [slot, setSlot] = useState<SandboxTimeOfDay>(defaultSlot);
  const [proposals, setProposals] = useState<ProgressionWeekProposal[]>([]);
  const [overrideText, setOverrideText] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!open || !family) return;
    setFamilyId(family.id);
    setEntryStageId(family.defaultEntryStageId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when modal opens / family id changes
  }, [open, family?.id, family?.defaultEntryStageId]);

  useEffect(() => {
    if (!family || !entryStageId) return;
    try {
      setProposals(
        proposeDefaultProgressionStages({
          family,
          entryStageId,
          blockLength,
        })
      );
    } catch {
      setProposals([]);
    }
  }, [family, entryStageId, blockLength]);

  const [resolvedAtTick, setResolvedAtTick] = useState(0);
  useEffect(() => {
    if (open) setResolvedAtTick((n) => n + 1);
  }, [open, familyId, entryStageId, blockLength, overrideText]);
  const resolvedAt = useMemo(
    () => new Date().toISOString(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when assignment inputs change
    [resolvedAtTick]
  );

  const overrideSeconds = useMemo(() => {
    const t = overrideText.trim();
    if (!t) return null;
    const m = t.match(/^(\d+):(\d{2})$/);
    if (m) return Number(m[1]) * 60 + Number(m[2]);
    const n = Number(t);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [overrideText]);

  const weekResolutions = useMemo(() => {
    if (!family || !profile) return [];
    return proposals.map((p) => {
      const stage = family.stages.find((s) => s.id === p.stageId);
      const resolution = resolveSessionFamilyStage({
        family,
        stageId: p.stageId,
        profile,
        resolvedAt,
        overrides:
          overrideSeconds != null
            ? [{ slot: "run", value: overrideSeconds, unit: "s/km" }]
            : undefined,
      });
      return { proposal: p, stage, resolution };
    });
  }, [family, profile, proposals, resolvedAt, overrideSeconds]);

  const missingThreshold = !profile?.threshold?.paceSecondsPerKm;
  const blocked =
    missingThreshold && overrideSeconds == null
      ? true
      : weekResolutions.some((w) => !w.resolution.publishable);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <div>
            <h2 className="text-sm font-bold tracking-wide text-white">Add progression</h2>
            <p className="text-[11px] text-zinc-500">
              Pilot · Session family assignment · coach approves every stage
            </p>
          </div>
          <button
            type="button"
            className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
            onClick={onClose}
          >
            Close
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[340px_1fr]">
          <div className="space-y-4 overflow-y-auto border-b border-zinc-800 p-4 lg:border-b-0 lg:border-r">
            <section>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                1 · Session family
              </p>
              <select
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
                value={family?.id ?? ""}
                onChange={(e) => setFamilyId(e.target.value)}
              >
                {families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              {family ? (
                <p className="mt-1.5 text-[11px] text-zinc-400">
                  {family.objective}. {family.description}
                </p>
              ) : null}
            </section>

            <section>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                2 · Starting stage
              </p>
              <div className="mt-1 max-h-48 space-y-1 overflow-y-auto">
                {family?.stages.map((stage) => (
                  <label
                    key={stage.id}
                    className={`flex cursor-pointer gap-2 rounded border px-2 py-1.5 text-xs ${
                      entryStageId === stage.id
                        ? "border-yellow-500/50 bg-yellow-400/10 text-yellow-50"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-300"
                    }`}
                  >
                    <input
                      type="radio"
                      className="mt-0.5"
                      checked={entryStageId === stage.id}
                      onChange={() => setEntryStageId(stage.id)}
                    />
                    <span>
                      <span className="font-bold">
                        {formatStageKeyShort(stage.key)} · {stage.label}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-zinc-500">
                        {stage.intents.join(" · ")}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  3 · Block length
                </p>
                <div className="mt-1 flex gap-2">
                  {([3, 4] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`rounded border px-3 py-1.5 text-xs font-bold ${
                        blockLength === n
                          ? "border-yellow-500/50 bg-yellow-400/15 text-yellow-100"
                          : "border-zinc-700 text-zinc-400"
                      }`}
                      onClick={() => setBlockLength(n)}
                    >
                      {n} weeks
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  4 · Day / slot
                </p>
                <div className="mt-1 flex gap-1">
                  <select
                    className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-1.5 py-1.5 text-xs text-white"
                    value={day}
                    onChange={(e) => setDay(e.target.value as WeekdayName)}
                  >
                    {WEEKDAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-1.5 text-xs text-white"
                    value={slot}
                    onChange={(e) => setSlot(e.target.value as SandboxTimeOfDay)}
                  >
                    {SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded border border-zinc-800 bg-zinc-900/50 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Athlete target
              </p>
              {missingThreshold ? (
                <p className="mt-1 text-xs text-orange-300">
                  Threshold pace unavailable. This progression requires an active threshold
                  benchmark or a coach override. Do not estimate.
                </p>
              ) : (
                <p className="mt-1 text-xs text-zinc-300">
                  Anchor threshold{" "}
                  <span className="font-mono text-yellow-200">
                    {formatPace(profile?.threshold?.paceSecondsPerKm)}
                  </span>
                  {" · "}
                  Rule <span className="font-mono">@THRESHOLD +5s/km</span>
                </p>
              )}
              <label className="mt-2 block text-[10px] text-zinc-500">
                Coach override (m:ss/km, optional)
                <input
                  className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs text-white"
                  placeholder="e.g. 3:52"
                  value={overrideText}
                  onChange={(e) => setOverrideText(e.target.value)}
                />
              </label>
              <label className="mt-1.5 block text-[10px] text-zinc-500">
                Override reason (internal, optional)
                <input
                  className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-white"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </label>
            </section>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden">
            <div className="border-b border-zinc-800 px-4 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Generated block preview · edit stages before apply
              </p>
              <p className="text-[11px] text-zinc-500">
                Proposal only. Stages are independent of calendar week numbers.
              </p>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {weekResolutions.map(({ proposal, stage, resolution }, idx) => (
                <div
                  key={proposal.offset}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-white">{proposal.label}</span>
                    <span className="text-[10px] text-zinc-500">
                      {day} {slot}
                    </span>
                    <select
                      className="ml-auto rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-[11px] text-zinc-200"
                      value={proposal.stageId}
                      onChange={(e) => {
                        const stageId = e.target.value;
                        setProposals((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, stageId } : p))
                        );
                      }}
                    >
                      {family?.stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {formatStageKeyShort(s.key)} — {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-200">
                    {stage ? stageStructureLine(stage) : proposal.stageId}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-yellow-200/90">
                    {resolution.slots[0]?.expression ?? "—"} →{" "}
                    {formatPace(resolution.slots[0]?.resolvedValue)}
                    {resolution.slots[0]?.source === "coach_override" ? " (coach override)" : ""}
                  </p>
                  {!resolution.publishable ? (
                    <p className="mt-1 text-[11px] text-orange-300">
                      {resolution.slots[0]?.publishBlockReason ?? "Not publishable"}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-zinc-800 px-5 py-3">
          <p className="text-[11px] text-zinc-500">
            {blocked
              ? "Blocked until threshold anchor or coach override is available."
              : "Inserts draft sessions into consecutive weeks starting from the selected week tab."}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={blocked || !family || applying || proposals.length === 0}
              className="rounded border border-yellow-500/50 bg-yellow-400/15 px-3 py-1.5 text-xs font-bold text-yellow-100 disabled:opacity-40"
              onClick={async () => {
                if (!family) return;
                setApplying(true);
                try {
                  await onApply({
                    family,
                    proposals,
                    day,
                    slot,
                    overridePaceSecondsPerKm: overrideSeconds,
                    overrideReason,
                    resolvedAt,
                  });
                } finally {
                  setApplying(false);
                }
              }}
            >
              {applying ? "Applying…" : "Apply to drafts"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
