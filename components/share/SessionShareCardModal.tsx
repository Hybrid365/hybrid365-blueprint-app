"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { SessionShareCard, type SessionShareCardProps } from "./SessionShareCard";
import { buildSessionSharePlaintext } from "@/app/lib/sessionShareCardText";

type Props = {
  open: boolean;
  onClose: () => void;
  card: SessionShareCardProps;
};

export function SessionShareCardModal({ open, onClose, card }: Props) {
  const [copied, setCopied] = useState(false);
  const plain = buildSessionSharePlaintext(card);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [plain]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close share card"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 m-4 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">Share</p>
            <h2 className="mt-1 text-lg font-bold text-white">Your session card</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Screenshot this card and add it to your story. Tag @hybrid.365 so we can repost you.
        </p>

        <div className="mt-6 flex justify-center">
          <SessionShareCard {...card} />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCopy}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:border-yellow-500/40 hover:bg-zinc-800"
          >
            {copied ? "Copied!" : "Copy session text"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-yellow-400 py-3 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 sm:px-8"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
