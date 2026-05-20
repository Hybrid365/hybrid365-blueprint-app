"use client";

import type { CoachProgrammeStatus } from "@/app/lib/hyroxCoachProgrammeDraft";
import { ProgrammeStatusBadge } from "@/components/admin/hyrox-athletes/StatusBadge";

export function PublishBar({
  status,
  toast,
  onSaveDraft,
  onApprove,
  onPublish,
}: {
  status: CoachProgrammeStatus;
  toast: string | null;
  onSaveDraft: () => void;
  onApprove: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-2 mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur sm:-mx-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <ProgrammeStatusBadge status={status} />
          {toast ? (
            <p className="text-xs font-medium text-yellow-300/90">{toast}</p>
          ) : (
            <p className="text-xs text-zinc-500">Changes are local mock state only.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSaveDraft}
            className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-zinc-600 px-4 text-sm font-semibold text-zinc-200 hover:border-yellow-500/40"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-400/10 px-4 text-sm font-bold text-emerald-200 transition hover:bg-emerald-400/20"
          >
            Approve week
          </button>
          <button
            type="button"
            onClick={onPublish}
            className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-[#f4d23c] px-5 text-sm font-black text-[#050505] transition hover:opacity-90"
          >
            Publish to athlete dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
