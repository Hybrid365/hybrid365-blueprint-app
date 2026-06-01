"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, Sparkles } from "lucide-react";
import type { CommunityWeeklyCheckInRecord } from "@/app/lib/communityWeeklyCheckIn";

type Props = {
  effectiveWeek: number;
  checkIn: CommunityWeeklyCheckInRecord | null;
  programmeGenerated: boolean;
};

export function WeeklyCheckInHomeCard({ effectiveWeek, checkIn, programmeGenerated }: Props) {
  if (!programmeGenerated) return null;

  const submitted = Boolean(checkIn?.submitted_at);
  const energy = checkIn?.energy_score;
  const recovery = checkIn?.recovery_score;
  const motivation = checkIn?.motivation_score;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-400/[0.12] via-zinc-900 to-zinc-950 shadow-lg shadow-black/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_100%_0%,rgba(250,204,21,0.15),transparent)]" />
      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/30">
              <ClipboardCheck className="h-5 w-5 text-yellow-400" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">
              Weekly check-in
            </p>
          </div>
          <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">
            {submitted ? "Check-in logged" : "Submit your weekly check-in"}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">
            {submitted
              ? "Your scores feed recovery trends and help keep your programme on track."
              : "Your check-in helps you review training, track recovery and keep the programme moving in the right direction."}
          </p>
          <p className="mt-2 text-xs font-medium text-zinc-500">
            Week {effectiveWeek} · {submitted ? "Submitted" : "Due"}
          </p>
          {submitted && (energy != null || recovery != null || motivation != null) ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {energy != null ? (
                <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-3 py-1 text-xs font-semibold text-white">
                  Energy {energy}/10
                </span>
              ) : null}
              {recovery != null ? (
                <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-3 py-1 text-xs font-semibold text-white">
                  Recovery {recovery}/10
                </span>
              ) : null}
              {motivation != null ? (
                <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-3 py-1 text-xs font-semibold text-white">
                  Motivation {motivation}/10
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <Link
          href="/dashboard/check-in"
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300"
        >
          {submitted ? (
            <>
              <Sparkles className="h-4 w-4" />
              View check-in insights
            </>
          ) : (
            <>
              Complete check-in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Link>
      </div>
    </section>
  );
}
