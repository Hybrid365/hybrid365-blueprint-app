"use client";

import { ShieldAlert } from "lucide-react";

export function AdminPreviewBanner({ athleteName }: { athleteName: string }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/35 bg-amber-950/30 px-4 py-4 md:px-5">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
      <div>
        <p className="text-sm font-bold text-amber-100">Admin preview mode</p>
        <p className="mt-1 text-sm leading-relaxed text-amber-100/85">
          You are viewing <span className="font-semibold text-white">{athleteName}</span>
          &apos;s dashboard as it appears after publish. No athlete data can be changed from this
          page — session logging, check-ins and edits are disabled.
        </p>
      </div>
    </div>
  );
}
