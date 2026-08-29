"use client";

import { Calendar, Target, Timer } from "lucide-react";
import { resolveHyroxBlockMeta } from "@/app/lib/hyroxTeamDashboardMock";
import { getHyroxRaceCountdown } from "@/app/lib/communityHyroxDashboard";
import { eyebrowClass } from "../athleteUi";
import { timeAwareGreeting } from "./greeting";

type Props = {
  athleteName: string;
  statusLabel: string;
  blockId: number;
  blockName: string;
  currentWeek: number;
  totalWeeks: number;
  raceDate?: string | null;
  timezone?: string;
};

function weeksToRaceLabel(raceDate: string | null | undefined): string | null {
  const countdown = getHyroxRaceCountdown(raceDate);
  if (!countdown || countdown.isPast) return null;
  const weeks = Math.max(0, Math.ceil(countdown.daysRemaining / 7));
  return `${weeks} wk${weeks === 1 ? "" : "s"} to race`;
}

export function HomeAthleteHeader({
  athleteName,
  statusLabel,
  blockId,
  blockName,
  currentWeek,
  totalWeeks,
  raceDate,
  timezone,
}: Props) {
  const block = resolveHyroxBlockMeta(blockId);
  const firstName = athleteName.split(/\s+/)[0]?.toUpperCase() ?? athleteName.toUpperCase();
  const raceWeeks = weeksToRaceLabel(raceDate);

  return (
    <header className="border-b border-zinc-800/80 pb-5">
      <p className={eyebrowClass}>{timeAwareGreeting(timezone)}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{firstName}</h1>
        <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {raceWeeks ? (
          <Pill icon={Timer} label={raceWeeks} accent />
        ) : null}
        <Pill icon={Calendar} label={`Week ${currentWeek}/${totalWeeks}`} />
        <Pill icon={Target} label={`${block.name} · Block ${blockId}`} />
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-yellow-500/25 bg-yellow-400/10 text-xs font-bold text-yellow-200"
          aria-hidden
        >
          H3
        </span>
        <p className="text-xs text-zinc-500">
          <span className="font-semibold text-zinc-400">Hybrid365 Coach</span>
          <span className="text-zinc-600"> · </span>
          {blockName}
        </p>
      </div>
    </header>
  );
}

function Pill({
  icon: Icon,
  label,
  accent,
}: {
  icon: typeof Timer;
  label: string;
  accent?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        accent
          ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-200"
          : "border-zinc-700/80 text-zinc-400"
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
