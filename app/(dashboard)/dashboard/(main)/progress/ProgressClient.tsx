"use client";

import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  LineChart,
  Lock,
  Minus,
  Moon,
  Scale,
  Target,
  Timer,
  TrendingUp,
  TrendingDown,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import { DashboardSubnav } from "@/components/DashboardSubnav";
import {
  COMMUNITY_BUILD_PROGRAMME,
  COMMUNITY_COMPLETE_ATHLETE_PROFILE,
} from "@/components/dashboard/communityOnboardingCopy";
import type {
  BodyweightTrend,
  GroupedBenchmark,
  ProgrammeWeekLike,
  RecoveryTrendRow,
} from "@/app/lib/progressMetrics";
import { isTimeLowerIsBetterBenchmark } from "@/app/lib/progressMetrics";
import { isStrengthBenchmarkType } from "@/app/lib/benchmarkCoreAreas";
import type { BenchmarkSnapshotItem } from "@/app/lib/dashboardWeekTracking";
import { BenchmarkSnapshotStrip } from "@/components/dashboard/BenchmarkSnapshotStrip";
import { HyroxProgressPanel } from "@/components/dashboard/hyrox/HyroxProgressPanel";
import { RunningVolumeProgressCard } from "@/components/dashboard/RunningVolumeProgressCard";
import { emptyHyroxDetails } from "@/app/lib/communityHyroxAssessment";
import type { RunningVolumeLog } from "@/app/lib/runningVolumeProgress";

type AdherenceSnapshot = {
  completedUnlocked: number;
  totalUnlockedSlots: number;
  unlockedPercentage: number;
  currentWeekCompleted: number;
  currentWeekTotal: number;
  currentWeekPercentage: number;
  completedByWeek: Record<number, { completed: number; total: number }>;
};

type KeySessionSnapshot = {
  completed: number;
  total: number;
  percentage: number;
};

type RpeSnapshot = {
  average: number | null;
  latest: number | null;
  count: number;
};

type Props = {
  email: string;
  programmeInstanceId: string | null;
  programmeGenerated: boolean;
  programmeTitle: string;
  viewerDisplayName: string;
  weeks: ProgrammeWeekLike[];
  effectiveWeek: number;
  adherence: AdherenceSnapshot;
  keySessions: KeySessionSnapshot;
  bodyweightTrend: BodyweightTrend;
  avgRpe: RpeSnapshot;
  groupedBenchmarks: GroupedBenchmark[];
  hasStrengthBenchmarks: boolean;
  recoveryTrends: RecoveryTrendRow[];
  checkInsSubmitted: number;
  latestBodyweightKg: number | null;
  benchmarkSnapshot: BenchmarkSnapshotItem[];
  isHyroxTrack?: boolean;
  hyroxDetails?: import("@/app/lib/communityHyroxAssessment").CommunityHyroxDetails;
  benchmarkTests?: { test_type: string | null; test_time: string | null; test_value: number | null; tested_at: string | null }[];
  latestHyroxCheckIn?: import("@/app/lib/communityHyroxCheckIn").CommunityHyroxCheckInDetails | null;
  runningVolumeLogs: RunningVolumeLog[];
};

function TrendGlyph({ trend, label }: { trend: "up" | "down" | "flat" | "none"; label: string }) {
  if (trend === "up")
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-400" title={label}>
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    );
  if (trend === "down")
    return (
      <span className="inline-flex items-center gap-0.5 text-amber-400" title={label}>
        <ArrowDownRight className="h-3.5 w-3.5" />
      </span>
    );
  if (trend === "flat")
    return (
      <span className="inline-flex items-center text-zinc-500" title={label}>
        <Minus className="h-3.5 w-3.5" />
      </span>
    );
  return <span className="text-zinc-600" title={label}>—</span>;
}

function benchmarkIcon(type: GroupedBenchmark["type"]) {
  switch (type) {
    case "1km SkiErg":
      return <Wind className="h-5 w-5 text-yellow-400/90" />;
    case "1km Row":
      return <Waves className="h-5 w-5 text-yellow-400/90" />;
    case "Bodyweight":
      return <Scale className="h-5 w-5 text-yellow-400/90" />;
    case "5km time trial":
    case "3km time trial":
    case "Hyrox race":
    case "Challenge workout":
      return <Timer className="h-5 w-5 text-yellow-400/90" />;
    case "Wall ball test":
      return <Activity className="h-5 w-5 text-yellow-400/90" />;
    default:
      if (isStrengthBenchmarkType(type)) {
        return <Dumbbell className="h-5 w-5 text-yellow-400/90" />;
      }
      return <Target className="h-5 w-5 text-yellow-400/90" />;
  }
}

function BenchmarkTrendBadge({ b }: { b: GroupedBenchmark }) {
  if (!b.logged || b.numericChange == null || b.type === "Bodyweight") return null;
  if (isTimeLowerIsBetterBenchmark(b.type)) {
    if (b.numericChange > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
          <TrendingUp className="h-3 w-3" /> faster
        </span>
      );
    }
    if (b.numericChange < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-200">
          <TrendingDown className="h-3 w-3" /> slower
        </span>
      );
    }
    return null;
  }
  if (isStrengthBenchmarkType(b.type) || b.type === "Wall ball test" || b.type === "Other") {
    if (b.numericChange > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
          <TrendingUp className="h-3 w-3" /> up
        </span>
      );
    }
    if (b.numericChange < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-200">
          <TrendingDown className="h-3 w-3" /> down
        </span>
      );
    }
  }
  return null;
}

function BodyweightSpark({ series }: { series: { week: number; kg: number }[] }) {
  if (series.length < 2) {
    return (
      <div className="mt-4 flex h-24 items-end justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/60">
        {series.length === 1 ? (
          <div className="flex w-full max-w-xs items-end justify-center gap-2 px-4 pb-3">
            <div
              className="w-8 rounded-t-md bg-yellow-400/50"
              style={{ height: `${40 + (series[0]!.kg % 20)}%` }}
              title={`Week ${series[0]!.week}`}
            />
          </div>
        ) : (
          <p className="px-4 py-6 text-center text-xs text-zinc-500">Add another check-in to see a trend line.</p>
        )}
      </div>
    );
  }
  const kgs = series.map((s) => s.kg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  const span = Math.max(0.001, max - min);
  return (
    <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
      <div className="flex h-28 items-end gap-1">
        {series.map((pt) => {
          const hPx = 10 + ((pt.kg - min) / span) * 90;
          return (
            <div key={`${pt.week}-${pt.kg}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className="w-full max-w-[14px] rounded-t-md bg-gradient-to-t from-yellow-500/30 to-yellow-400/80"
                style={{ height: `${hPx}px` }}
                title={`Week ${pt.week}: ${pt.kg} kg`}
              />
              <span className="text-[9px] font-medium text-zinc-500">W{pt.week}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProgressClient({
  email: _email,
  programmeInstanceId,
  programmeGenerated,
  programmeTitle,
  viewerDisplayName,
  weeks,
  effectiveWeek,
  adherence,
  keySessions,
  bodyweightTrend,
  avgRpe,
  groupedBenchmarks,
  hasStrengthBenchmarks,
  recoveryTrends,
  checkInsSubmitted,
  latestBodyweightKg,
  benchmarkSnapshot,
  isHyroxTrack = false,
  hyroxDetails,
  benchmarkTests = [],
  latestHyroxCheckIn,
  runningVolumeLogs,
}: Props) {
  void _email;
  const hasProgramme = Boolean(programmeInstanceId) && programmeGenerated;
  const progPct =
    adherence.totalUnlockedSlots > 0
      ? Math.round((100 * adherence.completedUnlocked) / adherence.totalUnlockedSlots)
      : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="pb-8 md:pb-10">
        <div className="mx-auto max-w-5xl px-4 pt-8 md:px-8 md:pt-10">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">
              Hybrid365
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Progress</h1>
          <p className="mt-1 text-sm text-zinc-500">
            <span className="text-zinc-400">{viewerDisplayName}</span>
            <span className="mx-2 text-zinc-700">·</span>
            Track the work — consistency tells the truth.
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
            Track your consistency, recovery and performance across the 12-week programme.
          </p>

          <div className="mt-4">
            <DashboardSubnav variant="zinc" />
          </div>
        </div>

        {!programmeInstanceId || !programmeGenerated ? (
          <div className="mx-auto mt-10 max-w-5xl px-4 md:px-8">
            <div className="rounded-2xl border border-yellow-400/25 bg-gradient-to-br from-yellow-400/[0.07] to-zinc-900/90 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/25">
                <LineChart className="h-6 w-6 text-yellow-400" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-white">Progress unlocks with your programme</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">
                Track the work: this view fills as you complete sessions and weekly check-ins. Complete your Athlete
                Profile, build your personalised programme from the dashboard, then come back — the graph tells the truth
                week by week.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/assessment"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
                >
                  {COMMUNITY_COMPLETE_ATHLETE_PROFILE}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-600"
                >
                  {COMMUNITY_BUILD_PROGRAMME}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-5xl space-y-10 px-4 pb-16 md:px-8">
            <p className="text-sm text-zinc-500">
              <span className="text-zinc-400">{programmeTitle}</span>
              <span className="mx-2 text-zinc-700">·</span>
              Current week <span className="font-semibold text-white">{effectiveWeek}</span>
            </p>

            {isHyroxTrack ? (
              <HyroxProgressPanel
                details={hyroxDetails ?? emptyHyroxDetails()}
                benchmarkTests={benchmarkTests}
                latestHyroxCheckIn={latestHyroxCheckIn}
              />
            ) : null}

            <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-5 sm:p-6">
              <BenchmarkSnapshotStrip items={benchmarkSnapshot} />
            </section>

            {/* A — Hero summary */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Programme completion",
                  value:
                    adherence.totalUnlockedSlots > 0
                      ? `${adherence.completedUnlocked}/${adherence.totalUnlockedSlots}`
                      : "—",
                  sub: adherence.totalUnlockedSlots > 0 ? `${progPct}% of unlocked sessions` : "No unlocked weeks yet",
                  icon: Target,
                },
                {
                  label: "This week adherence",
                  value:
                    adherence.currentWeekTotal > 0
                      ? `${adherence.currentWeekCompleted}/${adherence.currentWeekTotal}`
                      : "—",
                  sub:
                    adherence.currentWeekTotal > 0
                      ? `${adherence.currentWeekPercentage}% this week`
                      : "Unlock or open this week’s plan",
                  icon: Activity,
                },
                {
                  label: "Check-ins completed",
                  value: String(checkInsSubmitted),
                  sub: "Weekly recovery & load signals",
                  icon: ClipboardList,
                },
                {
                  label: "Latest bodyweight",
                  value: latestBodyweightKg != null ? `${latestBodyweightKg} kg` : "—",
                  sub: "From your last check-in",
                  icon: Scale,
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-zinc-800/90 bg-zinc-900/70 p-5 shadow-sm shadow-black/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/12 ring-1 ring-yellow-400/20">
                      <card.icon className="h-5 w-5 text-yellow-400" />
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{card.value}</p>
                  <p className="mt-1 text-xs text-zinc-500">{card.sub}</p>
                </div>
              ))}
            </section>

            {/* B — Adherence */}
            <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/12 ring-1 ring-yellow-400/20">
                    <BarChart3 className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Session adherence</h2>
                    <p className="text-sm text-zinc-500">Unlocked weeks only — matches your live schedule.</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-zinc-400">Completed</span>
                  <span className="font-semibold text-white">
                    {adherence.completedUnlocked} / {adherence.totalUnlockedSlots}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all"
                    style={{ width: `${progPct}%` }}
                  />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                  {adherence.totalUnlockedSlots === 0
                    ? "Once a week is unlocked, your session targets appear here."
                    : progPct >= 80
                      ? "Strong consistency — keep stacking sessions and protect recovery between hard days."
                      : "Keep stacking sessions — complete Priority 1 work first, then fill the rest as energy allows."}
                </p>
                {keySessions.total > 0 ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    Key (Priority 1) sessions:{" "}
                    <span className="font-medium text-zinc-300">
                      {keySessions.completed}/{keySessions.total} ({keySessions.percentage}%)
                    </span>
                  </p>
                ) : null}
              </div>
            </section>

            <RunningVolumeProgressCard
              sessionLogs={runningVolumeLogs}
              effectiveWeek={effectiveWeek}
              isHyroxTrack={isHyroxTrack}
            />

            <div className="grid gap-10 lg:grid-cols-2">
              {/* C — Bodyweight */}
              <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <Scale className="h-5 w-5 text-yellow-400" />
                  <h2 className="text-lg font-bold text-white">Bodyweight trend</h2>
                </div>
                {bodyweightTrend.entries === 0 ? (
                  <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 text-center">
                    <p className="text-sm text-zinc-400">
                      Bodyweight trend appears after your first weekly check-in with a weight entry.
                    </p>
                    <Link
                      href="/dashboard"
                      className="mt-4 inline-flex text-sm font-semibold text-yellow-400 hover:text-yellow-300"
                    >
                      Open dashboard to check in →
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">First</p>
                        <p className="mt-1 text-lg font-bold text-white">{bodyweightTrend.firstKg} kg</p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Latest</p>
                        <p className="mt-1 text-lg font-bold text-white">{bodyweightTrend.latestKg} kg</p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Change</p>
                        <p className="mt-1 text-lg font-bold text-white">
                          {bodyweightTrend.deltaKg == null
                            ? "—"
                            : `${bodyweightTrend.deltaKg >= 0 ? "+" : ""}${bodyweightTrend.deltaKg} kg`}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-center text-xs text-zinc-500">{bodyweightTrend.entries} check-ins with weight</p>
                    <BodyweightSpark series={bodyweightTrend.series} />
                  </div>
                )}
              </section>

              {/* D — Recovery */}
              <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-yellow-400" />
                  <h2 className="text-lg font-bold text-white">Recovery trends</h2>
                </div>
                {checkInsSubmitted === 0 ? (
                  <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 text-center text-sm text-zinc-400">
                    No check-ins yet. Your Sunday check-in captures sleep, energy, and recovery — it only takes a
                    minute.
                  </div>
                ) : (
                  <ul className="mt-5 space-y-3">
                    {recoveryTrends.map((row) => (
                      <li
                        key={row.key}
                        className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3"
                      >
                        <span className="text-sm font-medium text-zinc-300">{row.label}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {row.latest != null ? (row.key === "sleep_hours" ? `${row.latest} h` : `${row.latest}/10`) : "—"}
                          </span>
                          <TrendGlyph
                            trend={row.trend}
                            label={
                              row.previous != null
                                ? `vs previous ${row.previous}`
                                : "Need another entry for trend"
                            }
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* E — RPE */}
            <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-white">RPE & training response</h2>
              </div>
              {avgRpe.count === 0 ? (
                <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 text-center">
                  <p className="text-sm text-zinc-400">
                    Log RPE after sessions from the dashboard — it helps us see how the programme is landing week to
                    week.
                  </p>
                </div>
              ) : (
                <div className="mt-6 flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Average RPE</p>
                    <p className="mt-1 text-3xl font-bold text-white">{avgRpe.average}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Latest RPE</p>
                    <p className="mt-1 text-3xl font-bold text-white">{avgRpe.latest ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Logs</p>
                    <p className="mt-1 text-3xl font-bold text-white">{avgRpe.count}</p>
                  </div>
                  <p className="min-w-[200px] flex-1 text-sm leading-relaxed text-zinc-400">
                    RPE helps us understand how the programme is landing. Steady RPE with improving pace or quality
                    usually means you are adapting well.
                  </p>
                </div>
              )}
            </section>

            {/* F — Benchmarks */}
            <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Dumbbell className="h-5 w-5 text-yellow-400" />
                  <h2 className="text-lg font-bold text-white">Benchmark progress</h2>
                </div>
                <Link
                  href="/dashboard/testing"
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-semibold text-yellow-400 transition hover:border-yellow-500/40 hover:bg-yellow-400/5"
                >
                  Update in Testing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-6 space-y-4">
                {!hasStrengthBenchmarks ? (
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 text-sm leading-relaxed text-zinc-400">
                    Add a strength marker so your progress reflects more than just running and ergs — pull-ups,
                    push-ups, squat or bench numbers, or a carry all count.
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                {groupedBenchmarks.map((b) => (
                  <div
                    key={b.type}
                    className="rounded-2xl border border-zinc-800/80 bg-zinc-950/50 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400/10">
                          {benchmarkIcon(b.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{b.type}</p>
                          <p className="text-xs text-zinc-500">{b.entryCount} result{b.entryCount === 1 ? "" : "s"}</p>
                        </div>
                      </div>
                      {b.logged ? <BenchmarkTrendBadge b={b} /> : null}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">Latest</p>
                        <p className="mt-0.5 font-semibold text-white">{b.latestDisplay}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">Baseline</p>
                        <p className="mt-0.5 text-zinc-300">{b.baselineDisplay}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-zinc-500">
                      Change: <span className="font-medium text-zinc-300">{b.changeLabel}</span>
                    </p>
                  </div>
                ))}
                </div>
              </div>
            </section>

            {/* G — Journey */}
            <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <LineChart className="h-5 w-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-white">12-week journey</h2>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {weeks.map((w) => {
                  const unlocked = Boolean(w.is_unlocked);
                  const stats = adherence.completedByWeek[w.week_number];
                  const done = stats?.completed ?? 0;
                  const tot = stats?.total ?? 0;
                  const isCurrent = w.week_number === effectiveWeek;
                  return (
                    <div
                      key={w.week_number}
                      className={`flex min-w-[4.5rem] flex-1 flex-col items-center rounded-xl border px-2 py-3 text-center sm:min-w-[5.5rem] ${
                        unlocked
                          ? isCurrent
                            ? "border-yellow-400/50 bg-yellow-400/10"
                            : "border-zinc-700 bg-zinc-950/60"
                          : "border-zinc-800/60 bg-zinc-950/30 opacity-50"
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        Week {w.week_number}
                      </span>
                      {unlocked ? (
                        <>
                          <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-400/90" />
                          <span className="mt-1 text-[11px] text-zinc-400">
                            {tot > 0 ? `${done}/${tot}` : "—"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="mt-1 h-4 w-4 text-zinc-600" />
                          <span className="mt-1 text-[10px] text-zinc-600">Locked</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {hasProgramme && adherence.totalUnlockedSlots > 0 && adherence.completedUnlocked === 0 ? (
          <div className="mx-auto mt-6 max-w-5xl px-4 md:px-8">
            <div className="rounded-xl border border-yellow-500/15 bg-yellow-400/[0.04] p-4 text-center text-sm leading-relaxed text-zinc-300">
              Your progress graph builds as you complete sessions and check-ins. Open a session from the dashboard, train
              with intent, then mark it complete — the picture sharpens every week.
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
