"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  ChevronRight,
  ClipboardList,
  Droplets,
  Dumbbell,
  UtensilsCrossed,
  Wind,
} from "lucide-react";
import Hybrid75ChallengeHub from "@/components/free-week/Hybrid75ChallengeHub";
import Hybrid75SessionLogModal from "@/components/free-week/Hybrid75SessionLogModal";
import SaveDashboardBanner from "@/components/free-week/SaveDashboardBanner";
import { FreePlanSessionCard } from "@/components/free-week/FreePlanSessionCard";
import { useFreePlan } from "@/components/free-week/FreePlanProvider";
import { useHybrid75ChallengeLogs } from "@/components/free-week/useHybrid75ChallengeLogs";
import { useHybrid75Habits } from "@/components/free-week/useHybrid75Habits";
import {
  isHybrid75LoggableSession,
  type Hybrid75ChallengeSessionLog,
} from "@/app/lib/hybrid75ChallengeLogging";
import {
  computeWeekMetrics,
  getChallengeFocusLabel,
  getNextSession,
  metricsFromHybrid75Meta,
  parseFreePlanSchedule,
  sortSessionsByDay,
  type FreePlanSession,
} from "@/app/lib/freePlanDashboard";

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? "border-[#F4D23C]/35 bg-[#F4D23C]/5" : "border-zinc-800 bg-zinc-950/70"
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-zinc-400">{sub}</p> : null}
    </div>
  );
}

export default function Hybrid75OverviewClient() {
  const { planId, planJson, hybrid75Meta, firstName, athleteEmail, athleteName } = useFreePlan();
  const profile = (planJson.profile as Record<string, unknown>) || {};
  const intro = Array.isArray(planJson.intro) ? (planJson.intro as string[]) : [];

  const challengeLogs = useHybrid75ChallengeLogs(planId, true);
  const habits = useHybrid75Habits(planId, true, athleteEmail, athleteName);
  const [logModalSession, setLogModalSession] = useState<FreePlanSession | null>(null);
  const [resolvedPlanUrl, setResolvedPlanUrl] = useState(`/plan/${planId}`);

  useEffect(() => {
    if (typeof window !== "undefined") setResolvedPlanUrl(window.location.href);
  }, [planId]);

  const sessions = useMemo(
    () => sortSessionsByDay(parseFreePlanSchedule(Array.isArray(planJson.schedule) ? planJson.schedule : [])),
    [planJson.schedule]
  );

  const metrics = useMemo(() => computeWeekMetrics(sessions), [sessions]);
  const hybridCounts = metricsFromHybrid75Meta(hybrid75Meta);
  const displayRuns = hybridCounts ? hybridCounts.runs : metrics.runs;
  const displayLifts = hybridCounts ? hybridCounts.lifts : metrics.lifts;
  const displayMobility = hybridCounts ? hybridCounts.mobility : metrics.mobility;

  const nextSession = useMemo(() => getNextSession(sessions), [sessions]);
  const challengeFocus = nextSession ? getChallengeFocusLabel(nextSession, sessions) : null;

  const handleSaveLog = useCallback(
    async (payload: Record<string, unknown>) => {
      await challengeLogs.saveLog(payload);
    },
    [challengeLogs]
  );

  const habitTrend = habits.summary?.weeklyTrends ?? [];
  const hydrateDays = habitTrend.find((r) => r.key === "hydrate")?.completedDays ?? 0;
  const eatCleanDays = habitTrend.find((r) => r.key === "eat_clean")?.completedDays ?? 0;
  const proofDays = habitTrend.find((r) => r.key === "proof")?.completedDays ?? 0;
  const mobilityDays = habitTrend.find((r) => r.key === "mobility")?.completedDays ?? 0;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black px-6 py-10 md:px-10 md:py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.12),transparent_30%)]" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-sm text-yellow-300">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            Hybrid 75 Summer Challenge
          </div>
          <p className="mt-5 text-sm uppercase tracking-[0.2em] text-zinc-500">
            Hybrid<span className="text-yellow-400">365</span>
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-extrabold tracking-tight md:text-5xl">
            {firstName ? `${firstName}, your ` : "Your "}
            <span className="text-yellow-400">Hybrid 75</span> Challenge Week
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
            Your free week is built around the Hybrid 75 rules — structured training, daily habits,
            and the weekend Hybrid Hard Challenge.
          </p>
        </div>
      </div>

      <SaveDashboardBanner planUrl={resolvedPlanUrl} />

      {nextSession ? (
        <SectionCard className="border-[#F4D23C]/25 bg-gradient-to-br from-zinc-950 to-zinc-900">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4D23C]">Next Session</p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                <Calendar className="h-4 w-4 text-[#F4D23C]" />
                <span className="font-medium uppercase tracking-wider text-[#F4D23C]">{nextSession.day}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-white/80">
                  {nextSession.category}
                </span>
                {challengeFocus ? (
                  <span className="rounded-full border border-[#F4D23C]/30 bg-[#F4D23C]/10 px-2.5 py-0.5 text-xs font-medium text-[#F4D23C]">
                    {challengeFocus}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white md:text-3xl">{nextSession.title}</h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
                {nextSession.intent}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
              <Link
                href={`/plan/${planId}/week#${nextSession.scrollId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4D23C] px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
              >
                View Session
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/plan/${planId}/habits`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Today&apos;s Habits
              </Link>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <div>
        <h2 className="text-2xl font-bold text-white md:text-3xl">Your week at a glance</h2>
        <p className="mt-2 text-zinc-400">Planned sessions mapped against Hybrid 75 targets.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Runs planned" value={`${displayRuns} / 3`} sub="Target: 3+ runs" highlight />
          <MetricCard label="Lifts planned" value={`${displayLifts} / 3`} sub="Target: 3 lifts (2 upper + 1 leg)" />
          <MetricCard label="Mobility planned" value={`${displayMobility} / 1`} sub="Target: 1–2 sessions" />
          <MetricCard
            label="Hybrid Hard challenge"
            value={`${metrics.challenge} / 1`}
            sub="Weekend placeholder"
            highlight={metrics.challenge > 0}
          />
        </div>
      </div>

      <Hybrid75ChallengeHub
        hybrid75={hybrid75Meta}
        completedCounts={{
          runs: challengeLogs.completedRuns,
          lifts: challengeLogs.completedLifts,
          mobility: challengeLogs.completedMobility,
          challenge: challengeLogs.completedChallenge,
        }}
        pendingPoints={challengeLogs.pendingPoints}
      />

      <SectionCard>
        <h3 className="mb-1 text-lg font-semibold text-white">Hybrid 75 challenge tracker</h3>
        <p className="mb-5 text-sm text-zinc-500">
          Log sessions with proof to earn points. Habits track accountability separately — they do
          not add leaderboard points automatically.
        </p>
        <div className="space-y-4">
          {[
            { label: "Runs", current: challengeLogs.completedRuns, target: 3, icon: Activity },
            { label: "Lifts", current: challengeLogs.completedLifts, target: 3, icon: Dumbbell },
            { label: "Mobility", current: challengeLogs.completedMobility, target: 1, icon: Wind },
            { label: "Hydration", current: hydrateDays, target: 7, suffix: "days", icon: Droplets },
            { label: "Clean eating", current: eatCleanDays, target: 7, suffix: "days", icon: UtensilsCrossed },
            {
              label: "Proof posted",
              current: Math.max(proofDays, challengeLogs.logs.filter((l) => l.proof_type !== "not_yet").length),
              target: 7,
              suffix: "days",
              icon: ClipboardList,
            },
          ].map((row) => (
            <div key={row.label}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <row.icon className="h-4 w-4 text-[#F4D23C]" />
                  {row.label}
                </div>
                <span className="text-sm font-semibold text-white">
                  {row.current}/{row.target}
                  {row.suffix ? ` ${row.suffix}` : ""}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-[#F4D23C] transition-all"
                  style={{
                    width: `${row.target > 0 ? Math.min(100, Math.round((row.current / row.target) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
          <p className="text-sm text-zinc-500">
            Mobility habit: {mobilityDays}/7 days · Overall habit consistency:{" "}
            {habits.summary?.overallCompletionPct ?? 0}%
          </p>
        </div>
      </SectionCard>

      <SectionCard>
        <h2 className="text-xl font-bold text-white">Your Hybrid Profile</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Name", value: firstName || "—" },
            { label: "Goal", value: String(profile.goal || "—") },
            { label: "Training days", value: String(profile.training_days || "—") },
            { label: "Level", value: String(profile.level || "—") },
          ].map((row) => (
            <div key={row.label} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">{row.label}</p>
              <p className="mt-1 font-semibold text-white">{row.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {intro.length > 0 ? (
        <SectionCard>
          <h2 className="text-xl font-bold text-white">Why this week looks like this</h2>
          <div className="mt-4 space-y-3 text-zinc-300">
            {intro.map((item, index) => (
              <p key={index} className="leading-7">
                <span className="text-yellow-400">•</span> {item}
              </p>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <Hybrid75SessionLogModal
        open={Boolean(logModalSession)}
        session={logModalSession}
        planId={planId}
        athleteName={athleteName}
        athleteEmail={athleteEmail}
        existingLog={
          logModalSession
            ? (challengeLogs.logsBySessionId[logModalSession.scrollId] as Hybrid75ChallengeSessionLog | undefined)
            : null
        }
        saving={challengeLogs.saving}
        onClose={() => setLogModalSession(null)}
        onSave={handleSaveLog}
      />
    </div>
  );
}
