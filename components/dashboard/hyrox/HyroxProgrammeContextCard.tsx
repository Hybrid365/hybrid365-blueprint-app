"use client";

import { Flag } from "lucide-react";
import type { CommunityHyroxDetails } from "@/app/lib/communityHyroxAssessment";
import {
  getHyroxRaceCountdown,
  hasLimitedHyroxEquipment,
  hyroxCategoryLabel,
  hyroxEquipmentLabel,
  HYROX_ROLLOUT_COPY,
  stationWeaknessLabel,
} from "@/app/lib/communityHyroxDashboard";

type Props = {
  details: CommunityHyroxDetails;
};

export function HyroxProgrammeContextCard({ details }: Props) {
  const countdown = getHyroxRaceCountdown(details.race_date);
  const category = hyroxCategoryLabel(details.category);
  const limitedEquipment = hasLimitedHyroxEquipment(details);

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/[0.06] to-zinc-950/90 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
          <Flag className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-400/90">
            HYROX Track programme context
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            Your training should build the engine first, then layer in HYROX specificity through threshold
            running, strength endurance, station work and compromised running.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">{HYROX_ROLLOUT_COPY}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {countdown && !countdown.isPast ? (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200">
                {countdown.label}
              </span>
            ) : null}
            {details.race_date ? (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
                {details.race_date}
              </span>
            ) : null}
            {category ? (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
                {category}
              </span>
            ) : null}
            {details.station_weaknesses.slice(0, 3).map((w) => (
              <span
                key={w}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300"
              >
                {stationWeaknessLabel(w)}
              </span>
            ))}
          </div>

          {limitedEquipment ? (
            <p className="mt-3 text-xs leading-relaxed text-amber-200/75">
              Equipment limitations noted — substitutions will be used where HYROX kit is unavailable.
            </p>
          ) : details.equipment.length > 0 ? (
            <p className="mt-3 text-xs text-zinc-500">
              Equipment: {details.equipment.map(hyroxEquipmentLabel).join(" · ")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
