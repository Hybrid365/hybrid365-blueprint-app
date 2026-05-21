"use client";

import { HelpCircle, X } from "lucide-react";

const COMMUNITY_URL = "https://plan.hybrid-365.com/community";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ProgrammeRefreshRequestModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="programme-refresh-title"
        className="relative w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl shadow-black/50"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 ring-1 ring-yellow-400/25">
            <HelpCircle className="h-5 w-5 text-yellow-400" aria-hidden />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 id="programme-refresh-title" className="mt-4 text-lg font-bold text-white">
          Request programme refresh
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          Message Kieran in Telegram or Whop with what changed — for example goal, 5km time, max HR, equipment,
          availability or injuries.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          We&apos;ll help decide whether your programme should be refreshed. Your current plan, session logs and
          check-ins stay as they are until we confirm a refresh.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <a
            href={COMMUNITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
          >
            Open community / Telegram
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-600 px-4 py-3 text-sm font-semibold text-zinc-200 hover:border-zinc-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
