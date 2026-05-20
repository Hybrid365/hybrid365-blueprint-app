"use client";

import { Calendar, ClipboardCheck, Target, Timer, TrendingUp } from "lucide-react";
import {
  HYROX_BLOCKS,
  MOCK_ATHLETE,
  MOCK_CHECK_IN,
  MOCK_NEXT_SESSION,
  MOCK_PERFORMANCE_METRICS,
  MOCK_PROGRESS_STATS,
} from "@/app/lib/hyroxTeamDashboardMock";
import { athleteCard, athleteCardPadding, eyebrowClass, ProgressBar } from "./athleteUi";

export function CommandCentreHeader() {
  const a = MOCK_ATHLETE;
  const stats = MOCK_PROGRESS_STATS;
  const block = HYROX_BLOCKS.find((b) => b.id === a.blockId)!;
  const checkInDue = MOCK_CHECK_IN.status === "Due";
  const m = MOCK_PERFORMANCE_METRICS;

  return (
    <header className={`${athleteCard} ${athleteCardPadding}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className={eyebrowClass}>Athlete command centre</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{a.name}</h1>
            <span className="rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              {a.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {a.race} · Target {a.targetTime}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Pill icon={Timer} label={`${a.raceCountdownWeeks} wks to race`} accent />
          <Pill icon={Calendar} label={`Week ${a.currentWeek}/${a.totalWeeks}`} />
          <Pill icon={Target} label={block.name} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Weekly completion" value={`${stats.weeklyCompletionPct}%`} sub={`${stats.sessionsCompleted}/${stats.sessionsPlanned} sessions`} highlight />
        <StatTile
          label="Check-in"
          value={MOCK_CHECK_IN.status}
          sub={`Due ${MOCK_CHECK_IN.dueLabel}`}
          warn={checkInDue}
        />
        <StatTile label="Phase" value={a.blockPhase} sub={`Block ${a.blockId} · ${block.name}`} />
        <StatTile
          label="Race readiness"
          value={`${m.raceReadiness.value}%`}
          sub={m.raceReadiness.delta}
          icon={TrendingUp}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-400/5 px-4 py-3">
          <p className="text-[10px] font-bold uppercase text-yellow-400/80">Coaching focus</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-300">{a.coachingFocus}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
          <p className="text-[10px] font-bold uppercase text-zinc-500">Next key session</p>
          <p className="mt-1 font-semibold text-white">{MOCK_NEXT_SESSION.name}</p>
          <p className="text-xs text-zinc-500">
            {MOCK_NEXT_SESSION.day} · {MOCK_NEXT_SESSION.duration} · RPE {MOCK_NEXT_SESSION.rpeTarget}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs text-zinc-500">
          <span>Weekly completion</span>
          <span className="font-semibold text-yellow-400">{stats.weeklyCompletionPct}%</span>
        </div>
        <ProgressBar value={stats.weeklyCompletionPct} />
      </div>
    </header>
  );
}

function Pill({ icon: Icon, label, accent }: { icon: typeof Timer; label: string; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        accent ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-200" : "border-zinc-700 text-zinc-400"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function StatTile({
  label,
  value,
  sub,
  highlight,
  warn,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
  warn?: boolean;
  icon?: typeof TrendingUp;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
      <p className="text-[10px] font-semibold uppercase text-zinc-500">{label}</p>
      <p className={`mt-1 flex items-center gap-1.5 text-lg font-bold ${highlight ? "text-yellow-400" : warn ? "text-amber-300" : "text-white"}`}>
        {Icon ? <Icon className="h-4 w-4 text-emerald-400" /> : null}
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-zinc-500">{sub}</p>
    </div>
  );
}
