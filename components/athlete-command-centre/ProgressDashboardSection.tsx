"use client";

import { Activity, Dumbbell, Flame, Target, Zap } from "lucide-react";
import {
  MOCK_BODYWEIGHT,
  MOCK_PERFORMANCE_METRICS,
  MOCK_PROGRESS_COPY,
  MOCK_PROGRESS_INTERPRETATION,
  MOCK_PROGRESS_STATS,
  MOCK_RUN_VOLUME_SUMMARY,
  MOCK_THRESHOLD_SUMMARY,
  MOCK_TRAINING_LOAD,
} from "@/app/lib/hyroxTeamDashboardMock";
import {
  BodyweightTrendChart,
  RunVolumeChart,
  ThresholdProgressionChart,
} from "./DashboardCharts";
import {
  MethodologyChip,
  SectionTitle,
  athleteCard,
  athleteCardHighlight,
  athleteCardPadding,
  eyebrowClass,
} from "./athleteUi";

export function ProgressDashboardSection() {
  const m = MOCK_PERFORMANCE_METRICS;
  const stats = MOCK_PROGRESS_STATS;
  const load = MOCK_TRAINING_LOAD;
  const th = MOCK_THRESHOLD_SUMMARY;
  const rv = MOCK_RUN_VOLUME_SUMMARY;
  const bw = MOCK_BODYWEIGHT;
  const copy = MOCK_PROGRESS_COPY;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {["Aerobic base", "Threshold volume", "Deload week", "Run volume", "Race specificity", "Recovery-led adjustments"].map(
          (tag) => (
            <MethodologyChip key={tag}>{tag}</MethodologyChip>
          )
        )}
      </div>

      <div className={`${athleteCardHighlight} ${athleteCardPadding}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={eyebrowClass}>Race readiness</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-white">{m.raceReadiness.value}%</p>
            <p className="mt-1 text-sm font-medium text-emerald-400">{m.raceReadiness.delta}</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
            <MiniMetric icon={Flame} label="Consistency" value={`${m.consistency.value}%`} />
            <MiniMetric icon={Activity} label="Running" value={`+${m.runningFitness.value}%`} />
            <MiniMetric icon={Dumbbell} label="Strength" value={`+${m.strengthEndurance.value}%`} />
            <MiniMetric icon={Zap} label="Stations" value={`+${m.stationTolerance.value}%`} />
          </div>
        </div>
      </div>

      <div className={`${athleteCard} ${athleteCardPadding} border-orange-500/20`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-400" />
            <span className="font-semibold text-white">Compromised running</span>
          </div>
          <span className="text-xs font-semibold text-orange-400">{m.compromisedRunning.improvement}</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-950">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400"
            style={{ width: `${m.compromisedRunning.currentPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {m.compromisedRunning.currentPct}% of fresh pace · Target {m.compromisedRunning.targetPct}%
        </p>
      </div>

      <div className={`${athleteCard} ${athleteCardPadding}`}>
        <SectionTitle title="Training load overview" description={load.weekStatusLabel} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <LoadCell label="Training hours" value={`${load.weeklyHours}h`} sub={`/ ${load.weeklyHoursPlanned}h`} />
          <LoadCell label="Run distance" value={`${load.weeklyRunKm} km`} sub={`/ ${load.weeklyRunKmPlanned} km`} />
          <LoadCell label="Threshold min" value={`${load.thresholdMinutes}`} sub={`/ ${load.thresholdMinutesPlanned} min`} accent />
          <LoadCell label="Easy aerobic" value={`${load.easyAerobicMinutes} min`} sub={`/ ${load.easyAerobicMinutesPlanned} min`} />
          <LoadCell label="Strength sessions" value={`${load.strengthSessions}`} sub={`/ ${load.strengthSessionsPlanned}`} />
          <LoadCell label="Hyrox sessions" value={`${load.hyroxSessions}`} sub={`/ ${load.hyroxSessionsPlanned}`} />
          <LoadCell label="Completion" value={`${load.sessionCompletionPct}%`} sub={`${load.sessionsCompleted}/${load.sessionsPlanned}`} highlight />
          <LoadCell label="Block week" value={`W${load.blockWeek}`} sub={load.blockPhase} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Threshold progression" badge={`Target ${th.targetMinutes}m`}>
          <ThresholdProgressionChart />
          <p className="mt-3 text-xs italic leading-relaxed text-zinc-500">{copy.thresholdInterpretation}</p>
        </ChartCard>
        <ChartCard title="Weekly run volume" badge={`Peak ${rv.peakKm} km · W${rv.peakWeek}`}>
          <RunVolumeChart />
          <p className="mt-3 text-xs italic leading-relaxed text-zinc-500">{copy.runVolumeNote}</p>
        </ChartCard>
      </div>

      <ChartCard title="Bodyweight trend" badge={`${bw.currentKg} kg · within range`}>
        <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
          <span className="text-zinc-500">
            Start <strong className="mt-0.5 block text-white">{bw.startKg} kg</strong>
          </span>
          <span className="text-zinc-500">
            Current <strong className="mt-0.5 block text-yellow-400">{bw.currentKg} kg</strong>
          </span>
          <span className="text-zinc-500">
            Range{" "}
            <strong className="mt-0.5 block text-white">
              {bw.targetRange.min}–{bw.targetRange.max}
            </strong>
          </span>
        </div>
        <BodyweightTrendChart />
        <p className="mt-3 text-xs italic leading-relaxed text-zinc-500">{copy.bodyweightNote}</p>
      </ChartCard>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Weekly completion" value={`${stats.weeklyCompletionPct}%`} />
        <StatCard label="Check-in streak" value={`${stats.checkInStreak} wks`} />
        <StatCard label="Avg RPE" value={String(stats.avgSessionRpe)} />
        <StatCard label="Run volume" value={`${stats.weeklyRunKm} km`} />
      </div>

      <section>
        <SectionTitle title="Coach interpretation" description="What your data means this block" />
        <div className="grid gap-3 sm:grid-cols-3">
          {MOCK_PROGRESS_INTERPRETATION.map((c) => (
            <article key={c.title} className={`${athleteCard} p-4`}>
              <p className={`${eyebrowClass} !text-yellow-400/80`}>{c.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{c.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
      <Icon className="h-3.5 w-3.5 text-zinc-500" />
      <p className="mt-1 text-[10px] font-semibold uppercase text-zinc-500">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function LoadCell({
  label,
  value,
  sub,
  accent,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3">
      <p className="text-[10px] font-semibold uppercase text-zinc-500">{label}</p>
      <p className={`text-sm font-bold ${highlight || accent ? "text-yellow-400" : "text-white"}`}>{value}</p>
      <p className="text-[10px] text-zinc-600">{sub}</p>
    </div>
  );
}

function ChartCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className={`${athleteCard} ${athleteCardPadding}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-white">{title}</h3>
        {badge ? (
          <span className="rounded-full border border-zinc-700 px-2.5 py-0.5 text-[10px] text-zinc-400">{badge}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${athleteCard} p-4`}>
      <p className="text-[10px] font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}
