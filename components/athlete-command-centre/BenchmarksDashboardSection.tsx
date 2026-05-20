"use client";

import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { MOCK_BENCHMARKS_TRACKER } from "@/app/lib/hyroxTeamDashboardMock";
import {
  SectionTitle,
  athleteCardInteractive,
  athleteCardPadding,
  btnPrimaryClass,
} from "./athleteUi";

export function BenchmarksDashboardSection() {
  const improved = MOCK_BENCHMARKS_TRACKER.filter((b) => b.positive && b.progressPct > 0).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/25 px-5 py-4 text-sm text-zinc-300">
        <span className="text-2xl font-bold text-emerald-400">{improved}</span>
        <span>
          of <strong className="text-white">{MOCK_BENCHMARKS_TRACKER.length}</strong> benchmarks trending positively
        </span>
      </div>

      <section>
        <SectionTitle
          title="Test results"
          description="Baseline → latest → target across your Hyrox markers"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {MOCK_BENCHMARKS_TRACKER.map((b) => (
            <article key={b.id} className={`${athleteCardInteractive} ${athleteCardPadding}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-white">{b.name}</h3>
                {b.positive && b.progressPct > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    {b.change.includes("+") || b.change.includes("faster") || b.change.includes("Heavier") ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {b.change}
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500">{b.change}</span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-zinc-950/50 py-2">
                  <p className="text-[10px] font-semibold uppercase text-zinc-500">Baseline</p>
                  <p className="mt-1 font-semibold text-zinc-300">{b.baseline}</p>
                </div>
                <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/5 py-2">
                  <p className="text-[10px] font-semibold uppercase text-yellow-400/80">Latest</p>
                  <p className="mt-1 font-bold text-white">{b.latest}</p>
                </div>
                <div className="rounded-lg bg-zinc-950/50 py-2">
                  <p className="text-[10px] font-semibold uppercase text-zinc-500">Target</p>
                  <p className="mt-1 font-semibold text-yellow-400/90">{b.target}</p>
                </div>
              </div>
              {b.progressPct > 0 ? (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-[10px] text-zinc-500">
                    <span>Progress to target</span>
                    <span className="font-semibold text-yellow-400">{b.progressPct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-950">
                    <div className="h-full rounded-full bg-yellow-400" style={{ width: `${b.progressPct}%` }} />
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <div className="flex justify-center border-t border-zinc-800/80 pt-6">
        <Link href="/athlete/testing" className={btnPrimaryClass}>
          Update tests →
        </Link>
      </div>
    </div>
  );
}
