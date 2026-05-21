"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getRotatingDashboardMessage } from "@/app/lib/dashboardRotatingMessages";

export function DashboardRotatingMessage() {
  const message = getRotatingDashboardMessage();

  return (
    <section
      className="mb-8 rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 px-5 py-4 sm:px-6"
      aria-live="polite"
    >
      <div className="flex gap-3 sm:items-start">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 ring-1 ring-yellow-400/20">
          <Sparkles className="h-4 w-4 text-yellow-400/90" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Coach note</p>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-300 sm:text-[15px]">{message.text}</p>
          {message.cta ? (
            <Link
              href={message.cta.href}
              className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-yellow-500/25 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-400/15"
            >
              {message.cta.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
