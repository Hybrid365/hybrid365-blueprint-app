"use client";

import type { CoachProgrammeStatus } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { PublishReadiness } from "./useCoachBlockProgramme";

export function CoachPublishPanel({
  status,
  isLive,
  saving,
  generationScope,
  publishReadiness,
  unsavedChanges,
  lastSavedAt,
  approveDisabled,
  onPreview,
  onSaveDraft,
  onApproveWeek,
  onApproveBlock,
  onPublish,
}: {
  status: CoachProgrammeStatus;
  isLive?: boolean;
  saving?: boolean;
  generationScope: string;
  publishReadiness: PublishReadiness;
  unsavedChanges?: boolean;
  lastSavedAt?: string | null;
  approveDisabled?: boolean;
  onPreview: () => void;
  onSaveDraft: () => void | Promise<void>;
  onApproveWeek: () => void | Promise<void>;
  onApproveBlock: () => void | Promise<void>;
  onPublish: () => void | Promise<void>;
}) {
  const showBlockApprove = generationScope === "block_4";

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <h2 className="text-sm font-bold text-white">Publish workflow</h2>
      <p className="mt-1 text-[11px] text-zinc-500">
        {isLive ? "Saves to Supabase — athlete sees only published weeks." : "Local mock state only"}
      </p>

      <p
        className={`mt-3 rounded-lg border px-3 py-2 text-xs leading-relaxed ${
          publishReadiness.canPublish
            ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-100"
            : "border-amber-500/25 bg-amber-950/20 text-amber-100/90"
        }`}
      >
        {publishReadiness.reason}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={onPreview}
          className="rounded-full border border-yellow-500/40 bg-yellow-400/10 py-2 text-xs font-bold text-yellow-200"
        >
          Preview selected week (athlete view)
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void onSaveDraft()}
          className="rounded-full border border-zinc-600 py-2 text-xs font-semibold text-zinc-200 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          disabled={saving || approveDisabled}
          onClick={() => void onApproveWeek()}
          className="rounded-full border border-emerald-500/40 bg-emerald-400/10 py-2 text-xs font-bold text-emerald-200 disabled:opacity-50"
        >
          Approve selected week
        </button>
        {showBlockApprove ? (
          <button
            type="button"
            disabled={saving || approveDisabled}
            onClick={() => void onApproveBlock()}
            className="rounded-full border border-emerald-500/50 bg-emerald-500/15 py-2 text-xs font-bold text-emerald-100 disabled:opacity-50"
          >
            Approve full block (W1–W4)
          </button>
        ) : null}
        <button
          type="button"
          disabled={saving || !publishReadiness.canPublish}
          onClick={() => void onPublish()}
          className="rounded-full bg-yellow-400 py-2.5 text-xs font-black text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {publishReadiness.buttonLabel}
        </button>
      </div>

      <p className="mt-2 text-[10px] text-zinc-600">Workflow status: {status.replace(/_/g, " ")}</p>
      {unsavedChanges ? (
        <p className="mt-1 text-[10px] font-semibold text-amber-300">
          Unsaved programme edits — save before approve/publish.
        </p>
      ) : lastSavedAt ? (
        <p className="mt-1 text-[10px] text-zinc-500">
          Last saved {new Date(lastSavedAt).toLocaleString()}
        </p>
      ) : null}
      {approveDisabled ? (
        <p className="mt-1 text-[10px] text-amber-400/80">Generate programme draft first.</p>
      ) : null}
    </section>
  );
}
