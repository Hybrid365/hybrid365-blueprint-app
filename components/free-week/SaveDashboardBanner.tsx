"use client";

import { Bookmark, Copy, Check } from "lucide-react";
import { useCallback, useState } from "react";

type SaveDashboardBannerProps = {
  planUrl: string;
  variant?: "banner" | "card";
};

export default function SaveDashboardBanner({ planUrl, variant = "banner" }: SaveDashboardBannerProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(planUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [planUrl]);

  const content = (
    <>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4D23C]/15">
          <Bookmark className="h-5 w-5 text-[#F4D23C]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            {variant === "banner" ? "Save this page — this is your challenge dashboard." : "Save your dashboard link"}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/65">
            Your Hybrid365 dashboard is unique to you. Save this link, bookmark it, or use the email we&apos;ve sent
            you to return to your plan during the challenge.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="block truncate rounded-lg border border-zinc-800 bg-black/50 px-3 py-2 text-xs text-zinc-400">
              {planUrl}
            </code>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#F4D23C]/35 bg-[#F4D23C]/10 px-4 py-2 text-sm font-semibold text-[#F4D23C] transition hover:bg-[#F4D23C]/15"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (variant === "card") {
    return (
      <div className="rounded-2xl border border-[#F4D23C]/25 bg-[#F4D23C]/5 p-5">{content}</div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#F4D23C]/30 bg-gradient-to-r from-[#F4D23C]/10 to-transparent p-4 sm:p-5">
      {content}
    </div>
  );
}
