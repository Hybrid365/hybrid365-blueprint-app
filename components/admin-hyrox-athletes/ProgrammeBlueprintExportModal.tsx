"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProgrammeBlueprintExportSelection } from "@/app/lib/hyroxProgrammeBlueprintTypes";
import { globalWeekForBlock } from "@/app/lib/hyroxCoachProgrammeDraft";

type Props = {
  open: boolean;
  onClose: () => void;
  athleteId: string;
  athleteDisplayName?: string | null;
  selectedBlock: number;
  currentGlobalWeek: number;
};

export function ProgrammeBlueprintExportModal({
  open,
  onClose,
  athleteId,
  athleteDisplayName,
  selectedBlock,
  currentGlobalWeek,
}: Props) {
  const blockWeeks = useMemo(
    () => ([1, 2, 3, 4] as const).map((c) => globalWeekForBlock(selectedBlock, c)),
    [selectedBlock]
  );

  const [selection, setSelection] = useState<ProgrammeBlueprintExportSelection>("selected_weeks");
  const [picked, setPicked] = useState<number[]>([]);
  const [athleteLabel, setAthleteLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setInfo(null);
    setSelection("selected_weeks");
    // Default: current week + next week in block when available (Hanzalah W1–W2 workflow)
    const idx = blockWeeks.indexOf(currentGlobalWeek);
    const defaults =
      idx >= 0
        ? blockWeeks.slice(idx, Math.min(idx + 2, blockWeeks.length))
        : blockWeeks.slice(0, 2);
    setPicked(defaults);
    setAthleteLabel(athleteDisplayName?.trim() && !athleteDisplayName.includes("@")
      ? athleteDisplayName.trim().slice(0, 80)
      : "");
  }, [open, blockWeeks, currentGlobalWeek, athleteDisplayName]);

  function toggleWeek(w: number) {
    setPicked((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort((a, b) => a - b)
    );
  }

  async function runExport() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      let global_weeks: number[] | undefined;
      if (selection === "current_week") {
        global_weeks = [currentGlobalWeek];
      } else if (selection === "selected_weeks") {
        if (picked.length === 0) throw new Error("Select at least one week.");
        global_weeks = picked;
      }

      const res = await fetch(
        `/api/hyrox/athletes/${encodeURIComponent(athleteId)}/programme-drafts/export-blueprint`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            block: selectedBlock,
            selection,
            global_weeks,
            athlete_label: athleteLabel.trim() || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Export failed.");
      }

      const blob = new Blob([JSON.stringify(data.document, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename ?? "hybrid365-programme-export.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      const prov = data.document?.export?.weekProvenance ?? [];
      const sources = prov
        .map(
          (p: { globalWeek: number; contentSource: string; sessionCount: number }) =>
            `W${p.globalWeek}: ${p.contentSource} (${p.sessionCount} sessions)`
        )
        .join(" · ");
      const importOk = data.document?.meta?.importCompatibleWhenFourWeeks === true;
      const sparse = data.document?.meta?.sparseSelection === true;
      setInfo(
        [
          `Downloaded ${data.document?.weeks?.length ?? 0} week(s).`,
          sources || "No session content in selection.",
          sparse
            ? "Some selected weeks had no exportable draft content — check provenance."
            : null,
          importOk
            ? "Import-compatible (4 weeks)."
            : "Partial export — for analysis in Cursor; not a full-block import file.",
        ]
          .filter(Boolean)
          .join(" ")
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">Export programme</h2>
            <p className="mt-1 text-xs text-zinc-400">
              Download structured CoachDraftWeek JSON for AI analysis or later blueprint import.
              Read-only — does not change drafts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Selection
            </legend>
            {(
              [
                ["current_week", `Current week (global ${currentGlobalWeek})`],
                ["selected_weeks", "Selected weeks"],
                ["entire_block", `Entire Block ${selectedBlock}`],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-zinc-200">
                <input
                  type="radio"
                  name="export-selection"
                  checked={selection === value}
                  onChange={() => setSelection(value)}
                />
                {label}
              </label>
            ))}
          </fieldset>

          {selection === "selected_weeks" ? (
            <div className="flex flex-wrap gap-2">
              {blockWeeks.map((w, i) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => toggleWeek(w)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    picked.includes(w)
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-100"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  Cycle {i + 1} · W{w}
                </button>
              ))}
            </div>
          ) : null}

          <label className="block space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Display label (optional, not email)
            </span>
            <input
              value={athleteLabel}
              onChange={(e) => setAthleteLabel(e.target.value)}
              placeholder="e.g. Hanzalah Azam"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
              maxLength={80}
            />
          </label>

          <p className="text-[11px] text-zinc-500">
            Export uses the Programme Builder preferred draft per week (unpublished working draft when
            present, otherwise published snapshot). Provenance in the file labels each source
            explicitly.
          </p>

          {error ? (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-100">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-100">
              {info}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-zinc-300 hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runExport()}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 font-semibold text-emerald-50 hover:bg-emerald-500/25 disabled:opacity-50"
            >
              {busy ? "Exporting…" : "Download JSON"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
