"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CopyWeekConflictMode,
  CopyWeekDestination,
} from "@/app/lib/hyroxCopyProgrammeWeek";

type Props = {
  open: boolean;
  sourceWeek: number;
  sourceSessionCount: number;
  athleteId: string;
  saving?: boolean;
  onClose: () => void;
  onCopy: (
    targetWeek: number,
    conflictMode: CopyWeekConflictMode | null
  ) => Promise<{ ok: boolean; error?: string; code?: string }>;
};

export function CopyWeekToModal({
  open,
  sourceWeek,
  sourceSessionCount,
  athleteId,
  saving,
  onClose,
  onCopy,
}: Props) {
  const [destinations, setDestinations] = useState<CopyWeekDestination[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetWeek, setTargetWeek] = useState<number | null>(null);
  const [conflictChoice, setConflictChoice] = useState<CopyWeekConflictMode | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setConflictChoice(null);
    setActionError(null);
    setTargetWeek(null);
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/hyrox/athletes/${athleteId}/programme-drafts/copy-week?sourceWeek=${sourceWeek}`
        );
        const data = (await res.json()) as {
          success?: boolean;
          error?: string;
          destinations?: CopyWeekDestination[];
        };
        if (cancelled) return;
        if (!res.ok || !data.success) {
          setLoadError(data.error ?? "Could not load destination weeks.");
          return;
        }
        const list = data.destinations ?? [];
        setDestinations(list);
        const preferred =
          list.find((d) => d.week === sourceWeek + 1 && !d.athleteHistory) ??
          list.find((d) => d.week === sourceWeek + 1);
        if (preferred) setTargetWeek(preferred.week);
      } catch {
        if (!cancelled) setLoadError("Network error loading destination weeks.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [athleteId, open, sourceWeek]);

  const selected = useMemo(
    () => destinations.find((d) => d.week === targetWeek) ?? null,
    [destinations, targetWeek]
  );

  if (!open) return null;

  const isPublishedTarget = Boolean(selected?.published);
  const needsDraftConflict = Boolean(
    selected &&
      !isPublishedTarget &&
      selected.hasProgramming
  );
  const needsPublishedChoice = Boolean(selected && isPublishedTarget);
  const conflictReady = (() => {
    if (!selected) return false;
    if (needsPublishedChoice) {
      return (
        conflictChoice === "replace" ||
        conflictChoice === "merge_empty_slots" ||
        conflictChoice === "seed_from_published"
      );
    }
    if (needsDraftConflict) {
      return conflictChoice === "replace" || conflictChoice === "merge_empty_slots";
    }
    return true;
  })();

  async function handleSubmit() {
    if (!targetWeek || !selected) return;
    setActionError(null);
    if (needsPublishedChoice && !conflictChoice) {
      setActionError("Choose how to create the editable Week draft revision.");
      return;
    }
    if (needsDraftConflict && !conflictChoice) {
      setActionError("Choose Cancel, Replace target draft, or Merge into empty slots.");
      return;
    }
    const mode = needsPublishedChoice || needsDraftConflict ? conflictChoice : null;
    const result = await onCopy(targetWeek, mode);
    if (!result.ok) {
      setActionError(result.error ?? "Duplicate failed.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/90">
          Week actions
        </p>
        <h2 className="mt-2 text-lg font-bold text-white">Duplicate week {sourceWeek}</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {sourceSessionCount} session{sourceSessionCount === 1 ? "" : "s"} copy into an unpublished
          draft. Same days/slots and Session Family stage. Live published weeks stay athlete-visible
          until you republish.
        </p>

        {loading ? <p className="mt-4 text-sm text-zinc-500">Loading weeks…</p> : null}
        {loadError ? (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {loadError}
          </p>
        ) : null}

        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
          {destinations.map((d) => {
            const active = targetWeek === d.week;
            const preferred = d.week === sourceWeek + 1;
            return (
              <label
                key={d.week}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${
                  active
                    ? "border-yellow-400/50 bg-yellow-400/10"
                    : "border-zinc-800 bg-zinc-900/60"
                } hover:border-zinc-600`}
              >
                <input
                  type="radio"
                  name="duplicate-target-week"
                  className="mt-1"
                  checked={active}
                  disabled={saving}
                  onChange={() => {
                    setTargetWeek(d.week);
                    setConflictChoice(d.published ? "replace" : null);
                    setActionError(null);
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">
                    Week {d.week}
                    {preferred ? (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-yellow-300/90">
                        next
                      </span>
                    ) : null}
                    <span className="ml-2 text-xs font-normal text-zinc-500">
                      Block {d.block} · W{d.cycle}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[11px] text-zinc-500">
                    {d.startYmd && d.endYmd ? `${d.startYmd} → ${d.endYmd}` : "Dates follow programme start"}
                    {d.published ? " · published (live)" : d.hasProgramming ? " · draft programming" : " · empty"}
                    {d.hasUnpublishedDraft ? " · editable draft exists" : ""}
                    {d.athleteHistory ? " · athlete activity on published" : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {selected && !isPublishedTarget ? (
          <p className="mt-4 rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200">
            <span className="font-semibold text-white">
              {sourceSessionCount} session{sourceSessionCount === 1 ? "" : "s"} will be copied to Week{" "}
              {selected.week}
            </span>
            <span className="mt-0.5 block text-[11px] text-zinc-500">
              Source Week {sourceWeek} unchanged. Result opens as a Week {selected.week} draft — never
              auto-published.
            </span>
          </p>
        ) : null}

        {needsPublishedChoice ? (
          <div className="mt-4 space-y-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-3">
            <p className="text-sm font-bold text-sky-100">
              WEEK {targetWeek} IS ALREADY PUBLISHED
            </p>
            <p className="text-xs text-sky-100/80">
              Create an editable draft revision? The currently published week remains live for the
              athlete until you republish.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <label className="flex items-start gap-2 text-sm text-sky-50">
                <input
                  type="radio"
                  name="duplicate-published"
                  className="mt-1"
                  checked={conflictChoice === "replace"}
                  onChange={() => setConflictChoice("replace")}
                  disabled={saving}
                />
                <span>
                  <span className="font-semibold">Replace draft with duplicated Week {sourceWeek}</span>
                  <span className="block text-[11px] text-sky-200/70">
                    Preferred — write Week {sourceWeek} into a new unpublished Week {targetWeek} draft.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm text-sky-50">
                <input
                  type="radio"
                  name="duplicate-published"
                  className="mt-1"
                  checked={conflictChoice === "seed_from_published"}
                  onChange={() => setConflictChoice("seed_from_published")}
                  disabled={saving}
                />
                <span>
                  <span className="font-semibold">Create draft from current published Week {targetWeek}</span>
                  <span className="block text-[11px] text-sky-200/70">
                    Start from what the athlete sees now (no Week {sourceWeek} duplicate).
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm text-sky-50">
                <input
                  type="radio"
                  name="duplicate-published"
                  className="mt-1"
                  checked={conflictChoice === "merge_empty_slots"}
                  onChange={() => setConflictChoice("merge_empty_slots")}
                  disabled={saving}
                />
                <span>
                  <span className="font-semibold">Merge duplicated Week {sourceWeek} into empty slots</span>
                  <span className="block text-[11px] text-sky-200/70">
                    Seed draft from published, then fill only free AM / Main / PM / Optional slots.
                  </span>
                </span>
              </label>
            </div>
          </div>
        ) : null}

        {needsDraftConflict ? (
          <div className="mt-4 space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3">
            <p className="text-sm font-bold text-amber-100">
              Week {targetWeek} already has a draft
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <label className="flex items-start gap-2 text-sm text-amber-50">
                <input
                  type="radio"
                  name="duplicate-conflict"
                  className="mt-1"
                  checked={conflictChoice === "replace"}
                  onChange={() => setConflictChoice("replace")}
                  disabled={saving}
                />
                <span className="font-semibold">Replace target draft</span>
              </label>
              <label className="flex items-start gap-2 text-sm text-amber-50">
                <input
                  type="radio"
                  name="duplicate-conflict"
                  className="mt-1"
                  checked={conflictChoice === "merge_empty_slots"}
                  onChange={() => setConflictChoice("merge_empty_slots")}
                  disabled={saving}
                />
                <span className="font-semibold">Merge into empty slots only</span>
              </label>
            </div>
          </div>
        ) : null}

        {actionError ? (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {actionError}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-zinc-600 px-4 py-2 text-xs font-bold text-zinc-200 hover:border-zinc-400"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !selected || !conflictReady}
            onClick={() => void handleSubmit()}
            className="rounded-full border border-yellow-500/40 bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wide text-zinc-950 disabled:opacity-40"
          >
            {saving
              ? "Working…"
              : conflictChoice === "seed_from_published"
                ? "Create draft revision"
                : conflictChoice === "merge_empty_slots"
                  ? "Merge empty slots"
                  : conflictChoice === "replace" && isPublishedTarget
                    ? "Create draft from Week " + sourceWeek
                    : conflictChoice === "replace"
                      ? "Replace draft"
                      : "Duplicate week"}
          </button>
        </div>
      </div>
    </div>
  );
}
