"use client";

import { useEffect, useMemo, useState } from "react";
import type { CopyWeekDestination } from "@/app/lib/hyroxCopyProgrammeWeek";

type Props = {
  open: boolean;
  sourceWeek: number;
  sourceSessionCount: number;
  athleteId: string;
  saving?: boolean;
  onClose: () => void;
  onCopy: (targetWeek: number, replace: boolean) => Promise<{ ok: boolean; error?: string; code?: string }>;
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
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setConfirmReplace(false);
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
        setDestinations(data.destinations ?? []);
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

  const blocked = Boolean(selected && (selected.athleteHistory || selected.published));
  const needsReplace = Boolean(selected?.hasProgramming && selected.replaceAllowed);

  async function handleSubmit() {
    if (!targetWeek || !selected) return;
    setActionError(null);
    if (blocked) {
      setActionError(
        selected.athleteHistory
          ? "This week contains athlete activity and cannot be replaced."
          : "This week already contains published sessions and cannot be replaced."
      );
      return;
    }
    if (needsReplace && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    const result = await onCopy(targetWeek, needsReplace);
    if (!result.ok) {
      if (result.code === "TARGET_HAS_PROGRAMMING") {
        setConfirmReplace(true);
      }
      setActionError(result.error ?? "Copy failed.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/90">
          Copy week to…
        </p>
        <h2 className="mt-2 text-lg font-bold text-white">
          Copy week {sourceWeek} to:
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {sourceSessionCount} programmed session{sourceSessionCount === 1 ? "" : "s"} will be
          copied as a new unpublished draft. The source week is not changed.
        </p>

        {loading ? <p className="mt-4 text-sm text-zinc-500">Loading weeks…</p> : null}
        {loadError ? (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {loadError}
          </p>
        ) : null}

        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
          {destinations.map((d) => {
            const disabled = d.athleteHistory || d.published;
            const active = targetWeek === d.week;
            return (
              <label
                key={d.week}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${
                  active
                    ? "border-yellow-400/50 bg-yellow-400/10"
                    : "border-zinc-800 bg-zinc-900/60"
                } ${disabled ? "opacity-55" : "hover:border-zinc-600"}`}
              >
                <input
                  type="radio"
                  name="copy-target-week"
                  className="mt-1"
                  checked={active}
                  disabled={saving}
                  onChange={() => {
                    setTargetWeek(d.week);
                    setConfirmReplace(false);
                    setActionError(null);
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">
                    Week {d.week}
                    <span className="ml-2 text-xs font-normal text-zinc-500">
                      Block {d.block} · W{d.cycle}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[11px] text-zinc-500">
                    {d.startYmd && d.endYmd ? `${d.startYmd} → ${d.endYmd}` : "Dates follow programme start"}
                    {d.hasProgramming ? " · contains programming" : " · empty"}
                    {d.published ? " · published" : ""}
                    {d.athleteHistory ? " · athlete activity" : ""}
                  </span>
                  {disabled ? (
                    <span className="mt-1 block text-[11px] text-red-300">
                      {d.athleteHistory
                        ? "This week contains athlete activity and cannot be replaced."
                        : "Published week — copy blocked."}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>

        {needsReplace && confirmReplace ? (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3">
            <p className="text-sm font-bold text-amber-100">
              REPLACE WEEK {targetWeek} PROGRAMMING?
            </p>
            <p className="mt-1 text-xs text-amber-200/80">
              This will replace the coach-programmed sessions in Week {targetWeek}. Athlete history
              and completed session data will not be moved.
            </p>
          </div>
        ) : needsReplace ? (
          <p className="mt-4 text-sm text-amber-200">
            TARGET WEEK ALREADY CONTAINS PROGRAMMING. Copy requires explicit replace.
          </p>
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
            disabled={saving || !selected || blocked}
            onClick={() => void handleSubmit()}
            className="rounded-full border border-yellow-500/40 bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wide text-zinc-950 disabled:opacity-40"
          >
            {saving
              ? "Copying…"
              : needsReplace && confirmReplace
                ? "Replace week"
                : "Copy week"}
          </button>
        </div>
      </div>
    </div>
  );
}
