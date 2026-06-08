"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  Droplets,
  Lock,
  Moon,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { HyroxFreeWeekMeta } from "@/app/lib/freeWeekChallengeMode";
import {
  HYROX_BLOCK_WEEKS,
  buildHyroxPerformanceProfile,
  buildHyroxSessionPreviews,
  buildHyroxWeekTracking,
  extractSessionTarget,
  extractSessionRpe,
  extractThresholdMainSet,
  hyroxOverviewCopy,
  hyroxSessionType,
} from "@/app/lib/hyroxFreeWeekDashboard";
import {
  getNextSession,
  parseFreePlanSchedule,
  sortSessionsByDay,
  type FreePlanSession,
} from "@/app/lib/freePlanDashboard";
import { FreePlanSessionCard } from "@/components/free-week/FreePlanSessionCard";
import SaveDashboardBanner from "@/components/free-week/SaveDashboardBanner";
import { HyroxInlineUpgradeStrip, HyroxLockedCard } from "@/components/free-week/hyrox/HyroxLockedCard";
import { HyroxWeekTrackingCards } from "@/components/free-week/hyrox/HyroxWeekTrackingCards";

const NAV = [
  { id: "hyrox-overview", label: "Overview" },
  { id: "hyrox-sessions", label: "Sessions" },
  { id: "hyrox-profile", label: "Profile" },
  { id: "hyrox-upgrade", label: "Upgrade" },
] as const;

const ACCENT = "#F4D23C";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 72;
  window.scrollTo({ top, behavior: "smooth" });
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-white md:text-2xl">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
    </div>
  );
}

function PerformanceBarRow({
  label,
  current,
  target12Week,
  estimated,
}: {
  label: string;
  current: number;
  target12Week: number;
  estimated: boolean;
}) {
  const fill = (current / 10) * 100;
  const marker = (target12Week / 10) * 100;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-white">{label}</span>
        <span className="text-zinc-500">
          {current}/10
          {estimated ? (
            <span className="ml-1 text-[10px] uppercase text-zinc-600">est.</span>
          ) : null}
        </span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-yellow-400/90 transition-all"
          style={{ width: `${fill}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/70"
          style={{ left: `${marker}%` }}
          title={`12-week goal: ${target12Week}/10`}
        />
      </div>
      <p className="mt-1 text-[10px] text-zinc-600">
        12-week goal: {target12Week}/10
      </p>
    </div>
  );
}

export default function HyroxFreeWeekDashboardClient({
  planId,
  planJson,
  hyroxMeta,
}: {
  planId: string;
  planJson: Record<string, unknown>;
  hyroxMeta: HyroxFreeWeekMeta;
}) {
  const profile = (planJson.profile as Record<string, unknown>) || {};
  const firstName = String(profile.first_name || planJson.first_name || "");
  const abilityLevel = String(profile.level || "intermediate");
  const trainingDays = String(profile.training_days || "—");
  const weeklyHours = String(profile.weekly_hours || "—");

  const sessions = useMemo(
    () => sortSessionsByDay(parseFreePlanSchedule(Array.isArray(planJson.schedule) ? planJson.schedule : [])),
    [planJson.schedule]
  );

  const nextSession = useMemo(() => getNextSession(sessions), [sessions]);
  const sessionPreviews = useMemo(() => buildHyroxSessionPreviews(sessions, hyroxMeta), [sessions, hyroxMeta]);

  const hasBenchmarks = Boolean(
    hyroxMeta.threshold_pace || hyroxMeta.ski_target || hyroxMeta.row_target
  );

  const performanceBars = useMemo(
    () =>
      buildHyroxPerformanceProfile({
        meta: hyroxMeta,
        abilityLevel,
        hasBenchmarks,
      }),
    [hyroxMeta, abilityLevel, hasBenchmarks]
  );

  const weekTracking = useMemo(
    () => buildHyroxWeekTracking(sessions, hyroxMeta),
    [sessions, hyroxMeta]
  );

  const thresholdPreview = useMemo(() => {
    const t = sessions.find((s) => s.tags.some((tag) => tag.includes("threshold")));
    return t ? extractThresholdMainSet(t) : null;
  }, [sessions]);

  const [activeWeek, setActiveWeek] = useState(1);
  const [activeTab, setActiveTab] = useState<string>(NAV[0].id);
  const [resolvedPlanUrl, setResolvedPlanUrl] = useState(`/plan/${planId}`);

  useEffect(() => {
    if (typeof window !== "undefined") setResolvedPlanUrl(window.location.href);
  }, [planId]);

  const handleNavClick = useCallback((id: string) => {
    setActiveTab(id);
    scrollToId(id);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    for (const tab of NAV) {
      const el = document.getElementById(tab.id);
      if (!el) continue;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) setActiveTab(tab.id);
          }
        },
        { rootMargin: "-80px 0px -55% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const { community_url, hyrox_team_url } = hyroxMeta.upgrade_cta;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="hidden shrink-0 items-center gap-2 py-3 sm:flex">
            <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-300">
              HYROX
            </span>
            <span className="text-xs text-zinc-500">Week 1 unlocked</span>
          </div>
          <div className="flex flex-1 items-center gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleNavClick(tab.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#F4D23C] text-black"
                    : "border border-white/10 bg-zinc-950 text-white/70 hover:border-[#F4D23C]/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-6 md:py-10">
        {/* OVERVIEW */}
        <section id="hyrox-overview" className="scroll-mt-20 space-y-6">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-[2rem] border border-yellow-400/20 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 md:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.14),transparent_35%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-yellow-400/40 bg-yellow-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-300">
                  HYROX Free Week
                </span>
                <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
                  Week 1 unlocked
                </span>
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-500">
                  Full 4-week block locked
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight md:text-4xl">
                {firstName ? `${firstName}, your ` : "Your "}
                <span className="text-yellow-400">HYROX athlete dashboard</span>
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-300 md:text-base">
                {hyroxOverviewCopy(hyroxMeta)}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { label: "Level", value: abilityLevel },
                  { label: "Days / week", value: trainingDays },
                  { label: "Weekly hours", value: weeklyHours },
                  { label: "Limiter", value: hyroxMeta.limiter },
                  { label: "Station focus", value: hyroxMeta.station_focus },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className="rounded-xl border border-zinc-800 bg-black/40 px-3 py-2.5"
                  >
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">{chip.label}</p>
                    <p className="mt-0.5 text-sm font-semibold capitalize text-white">{chip.value}</p>
                  </div>
                ))}
              </div>

              {(hyroxMeta.race_countdown_days != null || hyroxMeta.race_category) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {hyroxMeta.race_countdown_days != null ? (
                    <div className="rounded-xl border border-yellow-400/25 bg-yellow-400/5 px-4 py-2">
                      <p className="text-[10px] uppercase text-zinc-500">Race countdown</p>
                      <p className="text-lg font-bold text-yellow-300">
                        {hyroxMeta.race_countdown_days} days
                      </p>
                    </div>
                  ) : null}
                  {hyroxMeta.race_category ? (
                    <div className="rounded-xl border border-zinc-800 px-4 py-2">
                      <p className="text-[10px] uppercase text-zinc-500">Category</p>
                      <p className="text-sm font-semibold text-white">{hyroxMeta.race_category}</p>
                    </div>
                  ) : null}
                  {hyroxMeta.race_target_time ? (
                    <div className="rounded-xl border border-zinc-800 px-4 py-2">
                      <p className="text-[10px] uppercase text-zinc-500">Target time</p>
                      <p className="text-sm font-semibold text-white">{hyroxMeta.race_target_time}</p>
                    </div>
                  ) : null}
                </div>
              )}

              <HyroxWeekTrackingCards tracking={weekTracking} communityUrl={community_url} />
            </div>
          </div>

          <SaveDashboardBanner planUrl={resolvedPlanUrl} />

          {/* Block tabs W1–W4 */}
          <div>
            <SectionHeading
              title="Your HYROX Training Block"
              subtitle="Week 1 is live. Weeks 2–4 unlock with the full HYROX programme."
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {HYROX_BLOCK_WEEKS.map((w) => {
                const isActive = activeWeek === w.week;
                const isLocked = !w.unlocked;
                return (
                  <button
                    key={w.week}
                    type="button"
                    onClick={() => {
                      setActiveWeek(w.week);
                      if (isLocked) scrollToId("hyrox-upgrade");
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isActive && !isLocked
                        ? "border-yellow-400/50 bg-yellow-400/10"
                        : isLocked
                          ? "border-zinc-800 bg-zinc-950/60 opacity-80 hover:border-zinc-700"
                          : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">{w.label}</span>
                      {isLocked ? (
                        <Lock className="h-4 w-4 text-zinc-600" />
                      ) : (
                        <span className="text-[10px] font-bold uppercase text-green-400">Unlocked</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-yellow-300/90">{w.title}</p>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-500">{w.objective}</p>
                    {isLocked ? (
                      <p className="mt-2 text-[10px] font-medium text-zinc-600">
                        Unlock in HYROX Community or Team
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {activeWeek > 1 ? (
              <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-400">
                <Lock className="mr-2 inline h-4 w-4 text-zinc-600" />
                Week {activeWeek} unlocks with the full 4-week block inside the{" "}
                <a href={community_url} className="text-yellow-400 hover:underline">
                  HYROX community track
                </a>{" "}
                or{" "}
                <a href={hyrox_team_url} className="text-yellow-400 hover:underline">
                  HYROX Team coaching
                </a>
                .
              </div>
            ) : null}
          </div>

          {/* Next session */}
          {nextSession ? (
            <div className="rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-zinc-950 to-zinc-900 p-5 md:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
                Today&apos;s Focus
              </p>
              <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                    <Calendar className="h-4 w-4 text-yellow-400" />
                    <span className="font-semibold uppercase text-yellow-300">{nextSession.day}</span>
                    <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs">
                      {hyroxSessionType(nextSession)}
                    </span>
                  </div>
                  <h3 className="mt-2 text-2xl font-bold text-white">{nextSession.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{nextSession.intent}</p>
                  <p className="mt-3 text-sm">
                    <span className="text-zinc-500">Target RPE:</span>{" "}
                    <span className="font-semibold text-white">{extractSessionRpe(nextSession)}</span>
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="text-zinc-500">Target:</span>{" "}
                    <span className="font-semibold text-yellow-200">
                      {extractSessionTarget(nextSession, hyroxMeta)}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToId(nextSession.scrollId)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-300"
                >
                  View session
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          {/* Horizontal session strip */}
          <div>
            <SectionHeading
              title="Week 1 at a glance"
              subtitle="Swipe through your sessions — full detail below or in Sessions tab."
            />
            <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sessionPreviews.map((s) => (
                <button
                  key={s.scrollId}
                  type="button"
                  onClick={() => scrollToId(s.scrollId)}
                  className="flex w-[min(280px,78vw)] shrink-0 flex-col rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4 text-left transition hover:border-yellow-400/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-yellow-400">
                      {s.day}
                    </span>
                    {s.isKey ? (
                      <span className="rounded-full bg-yellow-400/15 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                        Key
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 font-semibold text-white">{s.title}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">{s.type}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{s.objective}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-zinc-500">
                    <span>{s.duration}</span>
                    <span>·</span>
                    <span>RPE {s.rpe}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-medium text-yellow-200/80">{s.target}</p>
                  <span className="mt-3 text-xs font-semibold text-yellow-400">View session →</span>
                </button>
              ))}
            </div>
          </div>

          <HyroxInlineUpgradeStrip communityUrl={community_url} teamUrl={hyrox_team_url} compact />
        </section>

        {/* SESSIONS — full Week 1 detail */}
        <section id="hyrox-sessions" className="scroll-mt-20 space-y-4">
          <SectionHeading
            title="Week 1 — Full sessions"
            subtitle="Complete coaching detail for your unlocked week."
          />

          <div className="space-y-4">
            {sessions.map((day) => (
              <FreePlanSessionCard
                key={day.scrollId}
                session={day}
                isHybrid75={false}
                allSessions={sessions}
              />
            ))}
          </div>

          <HyroxLockedCard
            title="Weeks 2–4 sessions"
            description="Unlock the full 4-week progression inside the HYROX community track or HYROX Team coaching."
            badge="Locked"
            showCta
            communityUrl={community_url}
            teamUrl={hyrox_team_url}
          />
        </section>

        {/* PROFILE — targets + ability bars + progress + habits + check-in */}
        <section id="hyrox-profile" className="scroll-mt-20 space-y-8">
          {/* Targets */}
          <div>
            <SectionHeading
              title="Your Training Targets"
              subtitle="Generated from your benchmarks where available — RPE overrides pace when needed."
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  label: "Threshold run",
                  value: hyroxMeta.threshold_pace,
                  fallback: "RPE 7–8 · controlled threshold",
                  icon: Activity,
                },
                {
                  label: "Easy aerobic",
                  value: hyroxMeta.easy_pace,
                  fallback: "Conversational · RPE 2–4",
                  icon: Zap,
                },
                {
                  label: "SkiErg",
                  value: hyroxMeta.ski_target,
                  fallback: "RPE 7–8 · record split",
                  icon: TrendingUp,
                },
                {
                  label: "RowErg",
                  value: hyroxMeta.row_target,
                  fallback: "RPE 7–8 · record split",
                  icon: TrendingUp,
                },
                {
                  label: "Saturday station focus",
                  value: hyroxMeta.station_focus,
                  fallback: "From your limiter selection",
                  icon: Target,
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
                >
                  <div className="flex items-center gap-2">
                    <card.icon className="h-4 w-4 text-yellow-400" />
                    <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                      {card.label}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-yellow-200">
                    {card.value ? `${card.value}` : card.fallback}
                  </p>
                  {!card.value && card.label !== "Saturday station focus" ? (
                    <p className="mt-2 text-xs text-zinc-600">
                      Complete benchmark testing inside the full HYROX programme for more accurate
                      targets.
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Performance profile */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 md:p-6">
            <SectionHeading
              title="HYROX Performance Profile"
              subtitle={
                hasBenchmarks
                  ? "Current levels from your assessment — 12-week goals shown on each bar."
                  : "Estimated from your assessment. Full benchmark profile unlocks with testing and check-ins."
              }
            />
            <div className="space-y-4">
              {performanceBars.map((bar) => (
                <PerformanceBarRow
                  key={bar.id}
                  label={bar.label}
                  current={bar.current}
                  target12Week={bar.target12Week}
                  estimated={bar.estimated}
                />
              ))}
            </div>
            {!hasBenchmarks ? (
              <p className="mt-4 rounded-xl border border-zinc-800 bg-black/30 px-4 py-3 text-xs text-zinc-500">
                Full benchmark profile unlocks with testing and check-ins inside the paid HYROX
                programme.
              </p>
            ) : null}
          </div>

          {/* Progress preview */}
          <div>
            <SectionHeading title="Progress Tracking Preview" />
            <div className="grid gap-3 md:grid-cols-2">
              <HyroxLockedCard
                title="Bodyweight trend"
                description="Bodyweight trend unlocks with weekly check-ins inside the full HYROX dashboard."
                badge="Preview"
              >
                <div className="h-16 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50" />
              </HyroxLockedCard>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Threshold progression</h3>
                  <BarChart3 className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-3 py-2">
                    <span className="text-zinc-400">Week 1</span>
                    <span className="font-medium text-white">
                      {thresholdPreview ?? hyroxMeta.threshold_pace ?? "RPE 7–8 threshold"}
                    </span>
                  </div>
                  {[2, 3, 4].map((w) => (
                    <div
                      key={w}
                      className="flex justify-between rounded-lg border border-zinc-800 px-3 py-2 text-zinc-600"
                    >
                      <span>Week {w}</span>
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
                <h3 className="font-semibold text-white">HYROX station focus</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-3 py-2">
                    <span className="text-zinc-400">Week 1</span>
                    <span className="font-medium text-white">{hyroxMeta.station_focus}</span>
                  </div>
                  {[2, 3, 4].map((w) => (
                    <div
                      key={w}
                      className="flex justify-between rounded-lg border border-zinc-800 px-3 py-2 text-zinc-600"
                    >
                      <span>Week {w}</span>
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <HyroxLockedCard
                title="Benchmark retesting"
                description="5k, 1km Ski, 1km Row and station tests — retesting and progression tracking unlock inside the full HYROX programme."
                showCta
                communityUrl={community_url}
                teamUrl={hyrox_team_url}
              />

              <HyroxLockedCard
                title="Completion consistency"
                description="Week 1 sessions are available now. Future-week completion tracking unlocks with membership."
                badge="Week 1 only"
              >
                <div className="flex gap-2">
                  <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-1 text-xs text-green-300">
                    W1 available
                  </span>
                  <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-600">
                    W2–W4 locked
                  </span>
                </div>
              </HyroxLockedCard>
            </div>
          </div>

          {/* Habits preview */}
          <div>
            <SectionHeading title="Daily Habits" />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Droplets, label: "Hydration" },
                { icon: Target, label: "Protein / nutrition" },
                { icon: Activity, label: "Mobility" },
                { icon: Zap, label: "Steps / daily movement" },
                { icon: Moon, label: "Sleep" },
                { icon: ClipboardCheck, label: "Session complete" },
              ].map((habit) => (
                <HyroxLockedCard
                  key={habit.label}
                  title={habit.label}
                  description="Habit tracking unlocks inside the full HYROX dashboard."
                  badge="Locked"
                  className="p-4"
                />
              ))}
            </div>
            <p className="mt-3 text-center text-sm text-zinc-500">
              Habit tracking keeps your training, recovery and consistency visible —{" "}
              <a href={community_url} className="text-yellow-400 hover:underline">
                unlock habit tracking
              </a>
            </p>
          </div>

          {/* Check-in preview */}
          <HyroxLockedCard
            title="Weekly Check-In"
            description="Track sleep, energy, stress, soreness, motivation, bodyweight, session feedback and niggles. Coach-reviewed weekly check-ins are available for HYROX Team members. Self-check-ins unlock inside the HYROX community track."
            showCta
            communityUrl={community_url}
            teamUrl={hyrox_team_url}
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["Sleep", "Energy", "Stress", "Soreness", "Motivation", "Bodyweight", "Feedback", "Niggles"].map(
                (f) => (
                  <span
                    key={f}
                    className="rounded-lg border border-dashed border-zinc-700 px-2 py-2 text-center text-xs text-zinc-600"
                  >
                    {f}
                  </span>
                )
              )}
            </div>
          </HyroxLockedCard>
        </section>

        {/* UPGRADE */}
        <section id="hyrox-upgrade" className="scroll-mt-20 space-y-6">
          <SectionHeading
            title="Unlock the full HYROX system"
            subtitle="Week 1 is your sample. The full athlete portal waits inside Hybrid365."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <a
              href={community_url}
              className="group rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-zinc-950 p-6 transition hover:border-yellow-400/50"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-yellow-400">
                HYROX Community
              </p>
              <h3 className="mt-2 text-xl font-bold text-white group-hover:text-yellow-100">
                Unlock the full HYROX training track
              </h3>
              <p className="mt-3 text-sm text-zinc-400">
                Structured self-led programming, full 4–12 week progression, community accountability
                and weekly programme structure.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-yellow-400">
                Join HYROX Track <ChevronRight className="h-4 w-4" />
              </span>
            </a>

            <a
              href={hyrox_team_url}
              className="group rounded-2xl border border-zinc-700 bg-zinc-950 p-6 transition hover:border-zinc-500"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">HYROX Team</p>
              <h3 className="mt-2 text-xl font-bold text-white">Apply for 1-1 HYROX coaching</h3>
              <p className="mt-3 text-sm text-zinc-400">
                Fully personalised programming, manual coach review, individual targets, weekly
                check-ins and athlete dashboard.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-white">
                Explore HYROX Team <ChevronRight className="h-4 w-4" />
              </span>
            </a>
          </div>

          <HyroxInlineUpgradeStrip communityUrl={community_url} teamUrl={hyrox_team_url} />
        </section>

        <footer className="border-t border-white/10 pt-8 text-center text-sm text-zinc-500">
          Plan ID: {planId} · Built using <span className="text-white">Hybrid</span>
          <span style={{ color: ACCENT }}>365</span> HYROX methodology
        </footer>
      </div>
    </main>
  );
}
