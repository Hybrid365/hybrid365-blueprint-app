"use client";

import { useCallback, useMemo, useState } from "react";
import {
  acceptProposalSession,
  rejectProposalSession,
} from "@/app/lib/hyroxWeekComposerPropose";
import type {
  ProposedComposerSession,
  WeekComposerMode,
  WeekComposerStructuredInstruction,
  WeekComposerWeekday,
  WeekProposal,
} from "@/app/lib/hyroxWeekComposerTypes";
import type { CoachDraftWeek } from "@/app/lib/hyroxCoachProgrammeDraft";
import { buildLibraryGapDashboard } from "@/app/lib/hyroxLibraryGapDashboard";
import { LibraryGapDashboardPanel } from "@/components/admin-hyrox-athletes/LibraryGapDashboardPanel";

const DAYS: WeekComposerWeekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type ComposerApplyOpenBuilderArgs = {
  draft: CoachDraftWeek;
  draftId: string | null;
  targetWeekNumber: number;
};

const ACTION_STYLE: Record<string, string> = {
  KEEP: "bg-zinc-800 text-zinc-300",
  REPEAT: "bg-zinc-800 text-zinc-200",
  PROGRESS: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40",
  REDUCE: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/40",
  MOVE: "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/40",
  REMOVE: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/40",
  REPLACE: "bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/40",
  CHANGE_TARGET: "bg-yellow-500/15 text-yellow-200 ring-1 ring-yellow-500/40",
  ADD: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/40",
};

function DiffLine({ session }: { session: ProposedComposerSession }) {
  const d = session.difference;
  if (d.kind === "unchanged") {
    return <p className="text-[11px] text-zinc-500">UNCHANGED · {d.after ?? "—"}</p>;
  }
  const label =
    d.kind === "progressed"
      ? "PROGRESSED"
      : d.kind === "reduced"
        ? "REDUCED"
        : d.kind === "moved"
          ? "MOVED"
          : d.kind === "target_change"
            ? "TARGET"
            : d.kind === "removed"
              ? "REMOVED"
              : d.kind.toUpperCase();
  return (
    <p className="text-[11px] text-zinc-300">
      <span className="font-semibold text-yellow-200/90">{label}</span>{" "}
      <span className="text-zinc-500">{d.before ?? "—"}</span>
      <span className="mx-1 text-zinc-600">→</span>
      <span className="text-zinc-200">{d.after ?? "—"}</span>
    </p>
  );
}

export function WeekComposerPanel({
  athleteId,
  suggestedWeek,
  onOpenProgrammeBuilder,
}: {
  athleteId: string;
  suggestedWeek?: number;
  /** After apply, coach can jump to Programme Builder to review/publish */
  onOpenProgrammeBuilder?: (args: ComposerApplyOpenBuilderArgs) => void;
}) {
  const [mode, setMode] = useState<WeekComposerMode>("next_week");
  const [sourceWeek, setSourceWeek] = useState(suggestedWeek ?? 1);
  const [freeText, setFreeText] = useState(
    "Keep the same weekly structure. Progress Tuesday threshold. Reduce Saturday HYROX slightly. Target 65–70 km. Sunday long run 90 minutes."
  );
  const [progressDays, setProgressDays] = useState<WeekComposerWeekday[]>(["Tue"]);
  const [reduceDays, setReduceDays] = useState<WeekComposerWeekday[]>(["Sat"]);
  const [keepDays, setKeepDays] = useState<WeekComposerWeekday[]>(["Sun"]);
  const [restDays, setRestDays] = useState<WeekComposerWeekday[]>([]);
  const [volMin, setVolMin] = useState("65");
  const [volMax, setVolMax] = useState("70");
  const [longRun, setLongRun] = useState("90");

  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<WeekProposal | null>(null);
  const [contextSummary, setContextSummary] = useState<{
    anchorsPresent: string[];
    painFlags: number;
    targetWeek: number;
    decisionAuthority: string;
  } | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [appliedDraft, setAppliedDraft] = useState<ComposerApplyOpenBuilderArgs | null>(null);

  const gapDashboard = useMemo(() => buildLibraryGapDashboard(proposal), [proposal]);

  const structured: Partial<WeekComposerStructuredInstruction> = useMemo(
    () => ({
      progressDays,
      reduceDays,
      keepDays,
      restDays,
      runVolumeKmMin: Number(volMin) || null,
      runVolumeKmMax: Number(volMax) || null,
      longRunMinutes: Number(longRun) || null,
    }),
    [progressDays, reduceDays, keepDays, restDays, volMin, volMax, longRun]
  );

  const toggleDay = (
    day: WeekComposerWeekday,
    list: WeekComposerWeekday[],
    setList: (d: WeekComposerWeekday[]) => void
  ) => {
    setList(list.includes(day) ? list.filter((x) => x !== day) : [...list, day]);
  };

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setApplyMessage(null);
    try {
      const res = await fetch(`/api/hyrox/athletes/${athleteId}/week-composer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          sourceWeekNumber: sourceWeek,
          freeText,
          structured,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Could not generate proposal.");
        setProposal(null);
        return;
      }
      setProposal(data.proposal as WeekProposal);
      setContextSummary(data.contextSummary);
    } catch {
      setError("Network error generating proposal.");
    } finally {
      setLoading(false);
    }
  }, [athleteId, mode, sourceWeek, freeText, structured]);

  const onReject = (proposalId: string) => {
    if (!proposal) return;
    setProposal(rejectProposalSession(proposal, proposalId));
  };

  const onAccept = (proposalId: string) => {
    if (!proposal) return;
    setProposal(acceptProposalSession(proposal, proposalId));
  };

  const applySelected = async (full: boolean) => {
    if (!proposal) return;
    setApplying(true);
    setError(null);
    setApplyMessage(null);
    setAppliedDraft(null);
    try {
      const accepted = full
        ? proposal.sessions.filter((s) => !s.locked).map((s) => s.proposalId)
        : proposal.sessions
            .filter((s) => s.acceptedByDefault || s.coachState === "accepted")
            .map((s) => s.proposalId);

      const rejected = proposal.sessions
        .filter((s) => s.coachState === "rejected")
        .map((s) => s.proposalId);

      const res = await fetch(`/api/hyrox/athletes/${athleteId}/week-composer/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal,
          acceptedProposalIds: accepted,
          rejectedProposalIds: rejected,
          persist: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setApplyMessage(data.error ?? "Apply failed.");
        return;
      }
      const openArgs: ComposerApplyOpenBuilderArgs = {
        draft: data.draftWeek as CoachDraftWeek,
        draftId: (data.draftId as string | null) ?? null,
        targetWeekNumber: (data.targetWeekNumber as number) ?? proposal.targetWeekNumber,
      };
      setAppliedDraft(openArgs);
      setApplyMessage(
        data.message ??
          `Applied ${data.appliedProposalIds?.length ?? 0} session(s) to DRAFT week ${openArgs.targetWeekNumber}. Publish separately.`
      );
    } catch {
      setError("Network error applying proposal.");
    } finally {
      setApplying(false);
    }
  };

  const openBuilder = () => {
    if (!appliedDraft) return;
    onOpenProgrammeBuilder?.(appliedDraft);
  };

  const byDay = useMemo(() => {
    const map = new Map<WeekComposerWeekday, ProposedComposerSession[]>();
    for (const d of DAYS) map.set(d, []);
    for (const s of proposal?.sessions ?? []) {
      map.get(s.day)?.push(s);
    }
    return map;
  }, [proposal]);

  return (
    <div className="space-y-5">
      <header className="border-b border-zinc-800 pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-500/80">
          Week Composer
        </p>
        <h2 className="mt-1 text-xl font-semibold text-zinc-100">Coach proposal surface</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          System proposes · you review · you apply to draft · you publish separately. Not a chatbot.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {(
              [
                ["next_week", "Next Week"],
                ["remaining_week", "Remaining Week"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  mode === id
                    ? "bg-yellow-400/15 text-yellow-200 ring-1 ring-yellow-500/40"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-2 text-xs text-zinc-400">
              Source week
              <input
                type="number"
                min={1}
                value={sourceWeek}
                onChange={(e) => setSourceWeek(Number(e.target.value) || 1)}
                className="w-16 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200"
              />
            </label>
          </div>

          <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Coach instruction
          </label>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
            placeholder="Keep structure. Progress Tuesday threshold…"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ConstraintDays
              label="PROGRESS"
              selected={progressDays}
              onToggle={(d) => toggleDay(d, progressDays, setProgressDays)}
            />
            <ConstraintDays
              label="REDUCE"
              selected={reduceDays}
              onToggle={(d) => toggleDay(d, reduceDays, setReduceDays)}
            />
            <ConstraintDays
              label="KEEP"
              selected={keepDays}
              onToggle={(d) => toggleDay(d, keepDays, setKeepDays)}
            />
            <ConstraintDays
              label="REST / no intensity"
              selected={restDays}
              onToggle={(d) => toggleDay(d, restDays, setRestDays)}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
            <label className="flex items-center gap-1">
              Run vol
              <input
                value={volMin}
                onChange={(e) => setVolMin(e.target.value)}
                className="w-12 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-zinc-200"
              />
              –
              <input
                value={volMax}
                onChange={(e) => setVolMax(e.target.value)}
                className="w-12 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-zinc-200"
              />
              km
            </label>
            <label className="flex items-center gap-1">
              Long run
              <input
                value={longRun}
                onChange={(e) => setLongRun(e.target.value)}
                className="w-12 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-zinc-200"
              />
              min
            </label>
          </div>

          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-bold text-zinc-950 disabled:opacity-50"
          >
            {loading ? "Composing…" : "Generate proposal"}
          </button>
        </section>

        <aside className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Athlete context (owned by app)
          </p>
          {contextSummary ? (
            <ul className="mt-2 space-y-1 text-xs text-zinc-400">
              <li>
                Target week <span className="text-zinc-200">{contextSummary.targetWeek}</span>
              </li>
              <li>
                Anchors{" "}
                <span className="text-zinc-200">
                  {contextSummary.anchorsPresent.join(", ") || "none set"}
                </span>
              </li>
              <li>
                Pain flags <span className="text-zinc-200">{contextSummary.painFlags}</span>
              </li>
              <li>
                Authority{" "}
                <span className="text-yellow-200">{contextSummary.decisionAuthority}</span> ·
                auto-apply forbidden
              </li>
            </ul>
          ) : (
            <p className="mt-2 text-xs text-zinc-600">
              Anchors, last week, execution, families, and adaptation load when you generate.
            </p>
          )}

          {proposal ? (
            <div className="mt-4 space-y-2 border-t border-zinc-800 pt-3">
              <VolumeRow
                label="Proposed run volume"
                value={proposal.proposedRunVolumeKm}
                unit="km"
              />
              <VolumeRow
                label="Previous / current"
                value={proposal.previousRunVolumeKm}
                unit="km"
              />
              <VolumeRow
                label="Change"
                value={proposal.runVolumeDeltaKm}
                unit="km"
                signed
              />
              <p className="text-[11px] text-zinc-500">
                Quality sessions: {proposal.qualitySessionCount}
              </p>
            </div>
          ) : null}
        </aside>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {proposal ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={applying}
              onClick={() => void applySelected(false)}
              className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-900 disabled:opacity-50"
            >
              Apply selected → draft
            </button>
            <button
              type="button"
              disabled={applying}
              onClick={() => void applySelected(true)}
              className="rounded-lg border border-zinc-600 px-3 py-2 text-xs font-semibold text-zinc-200 disabled:opacity-50"
            >
              Apply full proposal → draft
            </button>
            <span className="text-[11px] text-zinc-550 text-zinc-500">
              Never publishes automatically
            </span>
          </div>
          {applyMessage ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2">
              <p className="flex-1 text-xs text-emerald-100/90">{applyMessage}</p>
              {appliedDraft ? (
                <button
                  type="button"
                  onClick={openBuilder}
                  className="rounded-md bg-yellow-400 px-3 py-1.5 text-[11px] font-bold text-zinc-950"
                >
                  Open in Programme Builder
                </button>
              ) : null}
            </div>
          ) : null}

          <LibraryGapDashboardPanel dashboard={gapDashboard} />

          <div className="space-y-2">
            {DAYS.map((day) => {
              const sessions = byDay.get(day) ?? [];
              if (!sessions.length) {
                return (
                  <div
                    key={day}
                    className="grid grid-cols-[48px_1fr] gap-3 rounded-lg border border-zinc-900 px-3 py-2 opacity-40"
                  >
                    <span className="text-xs font-bold text-zinc-600">{day}</span>
                    <span className="text-xs text-zinc-700">—</span>
                  </div>
                );
              }
              return sessions.map((s) => (
                <div
                  key={s.proposalId}
                  className={`grid grid-cols-[48px_1fr_auto] gap-3 rounded-lg border px-3 py-2.5 ${
                    s.locked
                      ? "border-zinc-800 bg-zinc-950/40"
                      : s.coachState === "rejected"
                        ? "border-zinc-800 bg-zinc-950/60 opacity-70"
                        : "border-zinc-800 bg-zinc-950/90"
                  }`}
                >
                  <span className="pt-0.5 text-xs font-bold text-zinc-400">{day}</span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-zinc-100">
                        {s.title}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          ACTION_STYLE[s.action] ?? ACTION_STYLE.KEEP
                        }`}
                      >
                        {s.action}
                      </span>
                      {s.locked ? (
                        <span className="text-[10px] text-zinc-500">LOCKED</span>
                      ) : null}
                      {s.requiresCoachJudgement ? (
                        <span className="text-[10px] text-amber-300">Coach judgement</span>
                      ) : null}
                    </div>
                    {s.fromStageLabel || s.toStageLabel ? (
                      <p className="text-[11px] text-zinc-400">
                        {s.familyId ? "Family · " : ""}
                        {s.fromStageLabel ?? "—"}
                        {s.toStageLabel && s.toStageLabel !== s.fromStageLabel ? (
                          <>
                            <span className="mx-1 text-zinc-600">→</span>
                            {s.toStageLabel}
                          </>
                        ) : null}
                        {s.targetPreview ? (
                          <span className="ml-2 text-yellow-200/90">{s.targetPreview}</span>
                        ) : null}
                        {s.targetMissingReason ? (
                          <span className="ml-2 text-rose-300">{s.targetMissingReason}</span>
                        ) : null}
                      </p>
                    ) : null}
                    <DiffLine session={s} />
                    {s.reasons[0] ? (
                      <p className="text-[11px] text-zinc-500">
                        Why: {s.reasons.slice(0, 3).join(" · ")}
                      </p>
                    ) : null}
                    {s.athleteChangeMessage ? (
                      <p className="text-[10px] italic text-zinc-600">
                        Athlete msg (not sent): {s.athleteChangeMessage.title}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1">
                    {!s.locked ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onAccept(s.proposalId)}
                          className="rounded px-2 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/10"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject(s.proposalId)}
                          className="rounded px-2 py-1 text-[10px] font-semibold text-zinc-400 hover:bg-zinc-800"
                        >
                          Keep original
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ));
            })}
          </div>

          {proposal.libraryGaps.length ? (
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Session library gaps
              </p>
              <ul className="mt-1 space-y-1 text-xs text-zinc-400">
                {proposal.libraryGaps.map((g, i) => (
                  <li key={`${g.code}-${i}`}>
                    <span className="font-mono text-[10px] text-zinc-500">{g.code}</span>{" "}
                    {g.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ConstraintDays({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: WeekComposerWeekday[];
  onToggle: (d: WeekComposerWeekday) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onToggle(d)}
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              selected.includes(d)
                ? "bg-yellow-400/20 text-yellow-200 ring-1 ring-yellow-500/40"
                : "bg-zinc-900 text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

function VolumeRow({
  label,
  value,
  unit,
  signed,
}: {
  label: string;
  value: number | null;
  unit: string;
  signed?: boolean;
}) {
  const display =
    value == null
      ? "—"
      : signed && value > 0
        ? `+${value}`
        : String(value);
  return (
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <span className="text-zinc-500">{label}</span>
      <span className="font-semibold tabular-nums text-zinc-100">
        {display}
        {value != null ? ` ${unit}` : ""}
      </span>
    </div>
  );
}
