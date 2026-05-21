"use client";

import { Gauge, Heart, Timer } from "lucide-react";
import type { ErgIntensityGuide, RunPrescription } from "@/app/lib/runPrescription";

type Props = {
  runPrescription: RunPrescription;
  ergGuide?: ErgIntensityGuide;
  /** Shown when prescription was rebuilt from plan pace_guidance (older stored sessions). */
  showRegenerateHint?: boolean;
};

export function RunIntensityGuide({ runPrescription: rx, ergGuide, showRegenerateHint }: Props) {
  return (
    <div className="mt-6 rounded-2xl border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-zinc-900/90 to-zinc-950 p-5 shadow-lg shadow-yellow-500/5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-yellow-400">Your intensity guide</p>
        {rx.intensity_label ? (
          <span className="rounded-full border border-yellow-500/25 bg-yellow-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-yellow-200">
            {rx.intensity_label}
          </span>
        ) : null}
      </div>

      {rx.personalization_line ? (
        <p className="mt-2 text-sm font-medium text-yellow-200/90">{rx.personalization_line}</p>
      ) : null}

      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{rx.effort_description}</p>

      <div className="mt-5 space-y-3">
        {rx.pace_range ? (
          <div className="rounded-xl border border-yellow-500/20 bg-zinc-950/80 px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Target pace</p>
            <p className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
              {rx.pace_range}
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-400">
            {rx.pace_unavailable_note ?? "Pace target unavailable — use RPE and talk-test guidance."}
          </p>
        )}

        {rx.treadmill_speed_range ? (
          <div className="rounded-xl border border-yellow-500/20 bg-zinc-950/80 px-4 py-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
              <Timer className="h-3.5 w-3.5" />
              Treadmill speed
            </p>
            <p className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
              {rx.treadmill_speed_range}
            </p>
          </div>
        ) : null}

        {rx.hr_range ? (
          <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 px-4 py-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
              <Heart className="h-3.5 w-3.5" />
              HR guide
            </p>
            <p className="mt-1.5 text-lg font-semibold text-white">{rx.hr_range}</p>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-zinc-500">
            {rx.hr_add_note ?? "Add max HR in your assessment for HR-based targets."}
          </p>
        )}

        <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 px-4 py-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
            <Gauge className="h-3.5 w-3.5" />
            RPE
          </p>
          <p className="mt-1.5 text-lg font-semibold text-white">{rx.rpe}</p>
        </div>
      </div>

      {rx.coach_note ? (
        <p className="mt-4 border-t border-zinc-800/80 pt-4 text-sm leading-relaxed text-zinc-300">
          <span className="font-semibold text-zinc-200">Coaching note: </span>
          {rx.coach_note}
        </p>
      ) : null}

      {showRegenerateHint ? (
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
          Regenerate your programme after updating 5km time or max HR in your assessment to refresh speed
          targets on saved sessions.
        </p>
      ) : null}

      {ergGuide ? (
        <div className="mt-5 rounded-xl border border-blue-500/25 bg-blue-950/25 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-blue-300">Erg threshold</p>
          <p className="mt-2 text-sm text-zinc-300">{ergGuide.effort_description}</p>
          <p className="mt-2 text-base font-semibold text-white">{ergGuide.rpe}</p>
          {ergGuide.hr_range ? (
            <p className="mt-1 text-sm text-zinc-300">HR: {ergGuide.hr_range}</p>
          ) : null}
          <p className="mt-2 text-sm text-zinc-400">{ergGuide.coach_note}</p>
          {ergGuide.benchmark_note ? (
            <p className="mt-2 text-xs italic text-zinc-500">{ergGuide.benchmark_note}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
