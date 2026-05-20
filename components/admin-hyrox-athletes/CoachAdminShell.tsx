"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { HyroxPageShell } from "@/components/hyrox-team/HyroxTeamUi";
import { ArrowLeft } from "lucide-react";

export function CoachAdminShell({
  children,
  title,
  backHref = "/admin/hyrox-athletes",
  backLabel = "Athletes",
  actions,
}: {
  children: ReactNode;
  title?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <HyroxPageShell maxWidth="max-w-[1600px]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-yellow-500/40 hover:text-yellow-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/80">
              Hybrid365 Hyrox Team · Coach
            </p>
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              {title ?? "Athlete roster"}
            </h1>
          </div>
        </div>
        {actions}
      </header>
      {children}
    </HyroxPageShell>
  );
}
