"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { HyroxAthleteProfile } from "@/app/lib/hyroxAthleteProfileTypes";
import type {
  BlueprintCatalogEntry,
  BlueprintImportPreview,
  BlueprintConflictStrategy,
} from "@/app/lib/hyroxProgrammeBlueprintTypes";

type Props = {
  open: boolean;
  onClose: () => void;
  athleteId: string;
  selectedBlock: number;
  effectiveProfile: HyroxAthleteProfile;
  onImported: (targetBlock: number) => void;
};

export function ProgrammeBlueprintImportModal({
  open,
  onClose,
  athleteId,
  selectedBlock,
  effectiveProfile,
  onImported,
}: Props) {
  const [catalog, setCatalog] = useState<BlueprintCatalogEntry[]>([]);
  const [blueprintId, setBlueprintId] = useState<string>("");
  const [uploadText, setUploadText] = useState("");
  const [targetBlock, setTargetBlock] = useState(selectedBlock);
  const [preview, setPreview] = useState<BlueprintImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);
  const [athleteNameWarning, setAthleteNameWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTargetBlock(selectedBlock);
    setPreview(null);
    setError(null);
    setConfirmReplace(false);
    setConfirmApply(false);
    void (async () => {
      try {
        const res = await fetch("/api/hyrox/programme-blueprints");
        const data = await res.json();
        if (res.ok && data.success) {
          setCatalog(data.blueprints ?? []);
          const preferred =
            (data.blueprints as BlueprintCatalogEntry[] | undefined)?.find((b) =>
              b.id.includes("revised")
            ) ?? data.blueprints?.[0];
          if (preferred) setBlueprintId(preferred.id);
        }
      } catch {
        setError("Could not load blueprint catalog.");
      }
    })();
  }, [open, selectedBlock]);

  const conflictWeeks = useMemo(
    () =>
      preview?.weeks.filter((w) => w.conflict === "unpublished_content").map((w) => w.globalWeek) ??
      [],
    [preview]
  );

  const buildBody = useCallback(
    (action: "preview" | "apply") => {
      const body: Record<string, unknown> = {
        action,
        target_block: targetBlock,
        effective_profile: effectiveProfile,
      };
      if (uploadText.trim()) {
        body.blueprint = JSON.parse(uploadText);
      } else if (blueprintId) {
        body.blueprint_id = blueprintId;
      } else {
        throw new Error("Select a catalog blueprint or paste JSON.");
      }
      if (action === "apply") {
        const strategy: BlueprintConflictStrategy =
          preview?.requiresReplaceConfirmation && confirmReplace
            ? "replace_unpublished_confirmed"
            : "abort";
        body.conflict_strategy = strategy;
        body.confirm_apply = confirmApply === true;
        if (strategy === "replace_unpublished_confirmed") {
          body.confirm_replace_global_weeks = conflictWeeks;
        }
      }
      return body;
    },
    [
      blueprintId,
      confirmApply,
      confirmReplace,
      conflictWeeks,
      effectiveProfile,
      preview?.requiresReplaceConfirmation,
      targetBlock,
      uploadText,
    ]
  );

  const runPreview = useCallback(async () => {
    setBusy(true);
    setError(null);
    setPreview(null);
    setConfirmReplace(false);
    setConfirmApply(false);
    setAthleteNameWarning(null);
    try {
      const body = buildBody("preview");
      const res = await fetch(
        `/api/hyrox/athletes/${athleteId}/programme-drafts/import-blueprint`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Preview failed.");
        return;
      }
      setPreview(data.preview as BlueprintImportPreview);
      setAthleteNameWarning(
        typeof data.athleteNameWarning === "string" ? data.athleteNameWarning : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed.");
    } finally {
      setBusy(false);
    }
  }, [athleteId, buildBody]);

  const runApply = useCallback(async () => {
    if (!preview) {
      setError("Preview first.");
      return;
    }
    if (preview.blockedByPublished) {
      setError("Cannot import into a block with published weeks. Choose another block.");
      return;
    }
    if (preview.requiresReplaceConfirmation && !confirmReplace) {
      setError("Confirm replace of unpublished drafts, or choose another block.");
      return;
    }
    if (!confirmApply) {
      setError("Tick the final confirmation checkbox before applying.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = buildBody("apply");
      const res = await fetch(
        `/api/hyrox/athletes/${athleteId}/programme-drafts/import-blueprint`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Apply failed.");
        return;
      }
      onImported(targetBlock);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apply failed.");
    } finally {
      setBusy(false);
    }
  }, [
    athleteId,
    buildBody,
    confirmApply,
    confirmReplace,
    onClose,
    onImported,
    preview,
    targetBlock,
  ]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-10">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-700 bg-zinc-950 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              Programme Builder
            </p>
            <h2 className="text-lg font-semibold text-zinc-100">Import programme blueprint</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 px-5 py-4 text-sm text-zinc-300">
          <p className="text-xs text-zinc-500">
            Coach-only. Saves unpublished drafts only. Never publishes. Existing edited drafts are
            protected unless you explicitly confirm replace after preview.
          </p>

          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Catalog blueprint
            </span>
            <select
              value={blueprintId}
              onChange={(e) => {
                setBlueprintId(e.target.value);
                setUploadText("");
                setPreview(null);
              }}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              disabled={Boolean(uploadText.trim())}
            >
              <option value="">Select…</option>
              {catalog.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (v{b.version})
                </option>
              ))}
            </select>
          </label>

          {catalog.find((b) => b.id === blueprintId)?.changeSummary?.length ? (
            <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-400">
              {catalog
                .find((b) => b.id === blueprintId)!
                .changeSummary!.map((line) => (
                  <li key={line}>{line}</li>
                ))}
            </ul>
          ) : null}

          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Or paste blueprint JSON
            </span>
            <textarea
              value={uploadText}
              onChange={(e) => {
                setUploadText(e.target.value);
                setPreview(null);
              }}
              rows={4}
              placeholder='{ "id": "...", "name": "...", "version": "...", "weeks": [ ... ] }'
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-[11px] text-zinc-200"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Destination block
            </span>
            <input
              type="number"
              min={1}
              value={targetBlock}
              onChange={(e) => {
                setTargetBlock(Math.max(1, Number(e.target.value) || 1));
                setPreview(null);
              }}
              className="w-32 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void runPreview()}
              className="rounded-full border border-sky-500/40 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/20 disabled:opacity-50"
            >
              {busy ? "Working…" : "Preview import"}
            </button>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          ) : null}

          {preview ? (
            <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <p className="text-xs text-zinc-400">{preview.summary}</p>
              {athleteNameWarning ? (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  {athleteNameWarning}
                </p>
              ) : null}
              <div className="space-y-2">
                {preview.weeks.map((w) => (
                  <div
                    key={w.globalWeek}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-zinc-200">
                        Cycle W{w.cycle} · Global week {w.globalWeek}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          w.conflict === "none"
                            ? "bg-emerald-500/15 text-emerald-200"
                            : w.conflict === "published_snapshot"
                              ? "bg-red-500/15 text-red-200"
                              : "bg-amber-500/15 text-amber-200"
                        }`}
                      >
                        {w.conflict}
                      </span>
                    </div>
                    <p className="mt-1 text-zinc-500">
                      Blueprint {w.blueprintSessionCount} sessions · Existing{" "}
                      {w.existingSessionCount}
                      {w.existingDbStatus ? ` (${w.existingDbStatus})` : ""}
                    </p>
                    {w.added.length ? (
                      <p className="mt-1 text-emerald-300/90">
                        + {w.added.map((s) => `${s.day}: ${s.title}`).join("; ")}
                      </p>
                    ) : null}
                    {w.removed.length ? (
                      <p className="mt-1 text-red-300/90">
                        − {w.removed.map((s) => `${s.day}: ${s.title}`).join("; ")}
                      </p>
                    ) : null}
                    {w.changed.length ? (
                      <p className="mt-1 text-amber-200/90">
                        ~ {w.changed.map((c) => `${c.day}: ${c.from} → ${c.to}`).join("; ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              {preview.requiresReplaceConfirmation ? (
                <label className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  <input
                    type="checkbox"
                    checked={confirmReplace}
                    onChange={(e) => setConfirmReplace(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I reviewed the diffs and confirm replacing unpublished drafts for global weeks{" "}
                    [{conflictWeeks.join(", ")}]. Previous unpublished rows will be archived — not
                    published snapshots.
                  </span>
                </label>
              ) : null}

              <label className="flex items-start gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={confirmApply}
                  onChange={(e) => setConfirmApply(e.target.checked)}
                  className="mt-0.5"
                  disabled={preview.blockedByPublished}
                />
                <span>
                  Apply as unpublished drafts only. I will review in Programme Builder before any
                  publish.
                </span>
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || preview.blockedByPublished}
                  onClick={() => void runApply()}
                  className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  Apply unpublished import
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
