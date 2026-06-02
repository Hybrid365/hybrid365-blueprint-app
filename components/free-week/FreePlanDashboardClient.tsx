"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Droplets,
  Dumbbell,
  Lock,
  Sparkles,
  Target,
  Users,
  UtensilsCrossed,
  Wind,
} from "lucide-react";
import Hybrid75ChallengeHub from "@/components/free-week/Hybrid75ChallengeHub";
import Hybrid75Leaderboard from "@/components/free-week/Hybrid75Leaderboard";
import Hybrid75SessionLogModal from "@/components/free-week/Hybrid75SessionLogModal";
import SaveDashboardBanner from "@/components/free-week/SaveDashboardBanner";
import { FreePlanSessionCard } from "@/components/free-week/FreePlanSessionCard";
import { useHybrid75ChallengeLogs } from "@/components/free-week/useHybrid75ChallengeLogs";
import type { Hybrid75PlanMeta } from "@/app/lib/freeWeekChallengeMode";
import {
  isHybrid75LoggableSession,
  type Hybrid75ChallengeSessionLog,
} from "@/app/lib/hybrid75ChallengeLogging";
import {
  buildTrainingSplit,
  buildWeekGrid,
  COMMUNITY_UPGRADE_URL,
  computeWeekMetrics,
  getChallengeFocusLabel,
  getNextSession,
  metricsFromHybrid75Meta,
  parseFreePlanSchedule,
  sortSessionsByDay,
  type FreePlanSession,
} from "@/app/lib/freePlanDashboard";
import {
  LockedProgressPreviews,
  MembershipFeaturePreviewsSection,
  ProgrammeLockedWeeksPreview,
  ProgrammeWeekOneUnlocked,
  STANDARD_FREE_WEEK_NAV,
  StandardQuickActionsBar,
  StandardUpgradeSection,
  StartHereCard,
  TelegramCommunitySection,
  TelegramCtaTop,
  WeekSessionsActionNote,
} from "@/components/free-week/standard/StandardFreeWeekEnhancements";

type FreePlanDashboardClientProps = {
  planId: string;
  planJson: Record<string, unknown>;
  isHybrid75: boolean;
  hybrid75Meta: Hybrid75PlanMeta | null;
};

type NavTab = { id: string; label: string };

const ACCENT = "#F4D23C";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 72;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

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

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-bold text-white md:text-3xl">{title}</h2>
      {subtitle ? <p className="mt-2 text-zinc-400">{subtitle}</p> : null}
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

function renderList(items?: string[]) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-2 text-zinc-300">
      {items.map((item, i) => (
        <li key={i} className="leading-7">
          <span className="text-yellow-400">-</span> {item}
        </li>
      ))}
    </ul>
  );
}

export default function FreePlanDashboardClient({
  planId,
  planJson,
  isHybrid75,
  hybrid75Meta,
}: FreePlanDashboardClientProps) {
  const profile = (planJson.profile as Record<string, unknown>) || {};
  const firstName = String(profile.first_name || planJson.first_name || "");
  const athleteEmail = String(profile.email || planJson.email || "");
  const athleteName = firstName || athleteEmail.split("@")[0] || "Athlete";
  const intro = Array.isArray(planJson.intro) ? (planJson.intro as string[]) : [];
  const cta = (planJson.cta as Record<string, string>) || {};

  const challengeLogs = useHybrid75ChallengeLogs(planId, isHybrid75);
  const [logModalSession, setLogModalSession] = useState<FreePlanSession | null>(null);

  const sessions = useMemo(
    () => sortSessionsByDay(parseFreePlanSchedule(Array.isArray(planJson.schedule) ? planJson.schedule : [])),
    [planJson.schedule]
  );

  const metrics = useMemo(() => computeWeekMetrics(sessions), [sessions]);
  const hybridCounts = metricsFromHybrid75Meta(hybrid75Meta);
  const displayRuns = isHybrid75 && hybridCounts ? hybridCounts.runs : metrics.runs;
  const displayLifts = isHybrid75 && hybridCounts ? hybridCounts.lifts : metrics.lifts;
  const displayMobility = isHybrid75 && hybridCounts ? hybridCounts.mobility : metrics.mobility;

  const nextSession = useMemo(() => getNextSession(sessions), [sessions]);
  const trainingSplit = useMemo(() => buildTrainingSplit(sessions, isHybrid75), [sessions, isHybrid75]);
  const weekGrid = useMemo(() => buildWeekGrid(sessions), [sessions]);

  const navTabs: NavTab[] = useMemo(
    () =>
      isHybrid75
        ? [
            { id: "section-overview", label: "Overview" },
            { id: "section-this-week", label: "This Week" },
            { id: "section-challenge", label: "Challenge" },
            { id: "section-leaderboard", label: "Leaderboard" },
            { id: "section-progress", label: "Progress" },
            { id: "section-upgrade", label: "Upgrade" },
          ]
        : STANDARD_FREE_WEEK_NAV.map((tab) => ({ id: tab.id, label: tab.label })),
    [isHybrid75]
  );

  const [activeTab, setActiveTab] = useState(navTabs[0]?.id ?? "section-overview");

  const handleNavClick = useCallback((id: string) => {
    setActiveTab(id);
    scrollToId(id);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const options: IntersectionObserverInit = {
      rootMargin: "-80px 0px -55% 0px",
      threshold: 0,
    };

    for (const tab of navTabs) {
      const el = document.getElementById(tab.id);
      if (!el) continue;
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveTab(tab.id);
        }
      }, options);
      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [navTabs]);

  const challengeFocus =
    nextSession && isHybrid75 ? getChallengeFocusLabel(nextSession, sessions) : null;

  const handleSaveLog = useCallback(
    async (payload: Record<string, unknown>) => {
      await challengeLogs.saveLog(payload);
    },
    [challengeLogs]
  );

  const [resolvedPlanUrl, setResolvedPlanUrl] = useState(`/plan/${planId}`);
  useEffect(() => {
    if (typeof window !== "undefined") setResolvedPlanUrl(window.location.href);
  }, [planId]);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Sticky nav */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex items-center gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleNavClick(tab.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#F4D23C] text-black"
                    : "border border-white/10 bg-zinc-950 text-white/70 hover:border-[#F4D23C]/40 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {/* OVERVIEW */}
        <section id="section-overview" className="scroll-mt-20 space-y-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black px-6 py-10 md:px-10 md:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.12),transparent_30%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-sm text-yellow-300">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                {isHybrid75 ? "Hybrid 75 Summer Challenge" : "Hybrid365 Free Week"}
              </div>
              <p className="mt-5 text-sm uppercase tracking-[0.2em] text-zinc-500">
                Hybrid<span className="text-yellow-400">365</span>
              </p>
              <h1 className="mt-3 max-w-4xl text-3xl font-extrabold tracking-tight md:text-5xl">
                {isHybrid75 ? (
                  <>
                    {firstName ? `${firstName}, your ` : "Your "}
                    <span className="text-yellow-400">Hybrid 75</span> Challenge Week
                  </>
                ) : (
                  <>
                    {firstName ? `${firstName}, here’s your ` : "Your "}
                    First Week Inside <span className="text-yellow-400">Hybrid365</span>
                  </>
                )}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
                {isHybrid75
                  ? "Your free week is built around the Hybrid 75 rules — structured training, daily habits, and the weekend Hybrid Hard Challenge."
                  : "Your free week is ready — train hard, join the community, then unlock your full personalised programme."}
              </p>
              {!isHybrid75 ? (
                <p className="mt-3 text-sm font-medium text-yellow-300/90">
                  {sessions.length} sessions planned this week · instant access
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-2 text-sm">
                {[
                  { label: "Goal", value: String(profile.goal || "—") },
                  { label: "Days", value: String(profile.training_days || "—") },
                  { label: "Level", value: String(profile.level || "—") },
                ].map((chip) => (
                  <span
                    key={chip.label}
                    className="rounded-full border border-zinc-800 bg-zinc-950/70 px-4 py-2 text-zinc-300"
                  >
                    {chip.label}: <span className="font-medium text-white">{chip.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {!isHybrid75 ? (
            <>
              <StandardQuickActionsBar />
              <TelegramCtaTop />
            </>
          ) : null}

          {isHybrid75 ? <SaveDashboardBanner planUrl={resolvedPlanUrl} /> : null}

          {/* Next Session */}
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
                  {nextSession.timeCapMinutes ? (
                    <p className="mt-2 text-sm text-zinc-500">Time cap: {nextSession.timeCapMinutes} min</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                  <button
                    type="button"
                    onClick={() => scrollToId(nextSession.scrollId)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4D23C] px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
                  >
                    View Session
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToId("section-this-week")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                  >
                    Go to Weekly Schedule
                  </button>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {!isHybrid75 ? <StartHereCard /> : null}

          {/* Weekly structure metrics */}
          <div>
            <SectionHeading
              title="Your week at a glance"
              subtitle={
                isHybrid75
                  ? "Planned sessions mapped against Hybrid 75 targets."
                  : "Session mix for your free week — head to Week to start training."
              }
            />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {isHybrid75 ? (
                <>
                  <MetricCard label="Runs planned" value={`${displayRuns} / 3`} sub="Target: 3+ runs" highlight />
                  <MetricCard label="Lifts planned" value={`${displayLifts} / 3`} sub="Target: 3 lifts (2 upper + 1 leg)" />
                  <MetricCard label="Mobility planned" value={`${displayMobility} / 1`} sub="Target: 1–2 sessions" />
                  <MetricCard
                    label="Hybrid Hard challenge"
                    value={`${metrics.challenge} / 1`}
                    sub="Weekend placeholder"
                    highlight={metrics.challenge > 0}
                  />
                </>
              ) : (
                <>
                  <MetricCard label="Runs planned" value={String(metrics.runs)} />
                  <MetricCard label="Strength sessions" value={String(metrics.strength)} />
                  <MetricCard label="Conditioning" value={String(metrics.conditioning + metrics.hybrid)} />
                  <MetricCard label="Mobility / recovery" value={String(metrics.mobility + metrics.recovery)} />
                </>
              )}
            </div>
          </div>

          {/* Profile summary */}
          <SectionCard>
            <SectionHeading title="Your Hybrid Profile" subtitle="Inputs used to build this week." />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Name", value: firstName || "—" },
                { label: "Goal", value: String(profile.goal || "—") },
                { label: "Training days", value: String(profile.training_days || "—") },
                { label: "Level", value: String(profile.level || "—") },
                { label: "Weekly hours", value: String(profile.weekly_hours || "—") },
                { label: "Equipment", value: String(profile.equipment || "—") },
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
              <SectionHeading
                title="Why this week looks like this"
                subtitle="Sessions selected to match where you’re at."
              />
              <div className="space-y-3 text-zinc-300">
                {intro.map((item, index) => (
                  <p key={index} className="leading-7">
                    <span className="text-yellow-400">•</span> {item}
                  </p>
                ))}
              </div>
            </SectionCard>
          ) : null}

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-5 md:p-7">
            <p className="text-sm uppercase tracking-[0.2em] text-yellow-300">Extra coaching support</p>
            <h3 className="mt-2 text-xl font-bold text-white md:text-2xl">Keep an eye on your inbox this week</h3>
            <p className="mt-3 max-w-2xl leading-relaxed text-zinc-300">
              Hybrid365 coaching emails with tips on executing sessions properly and getting more from your week.
            </p>
          </div>
        </section>

        {/* THIS WEEK */}
        <section id="section-this-week" className="scroll-mt-20 mt-12 space-y-6">
          <SectionHeading
            title={isHybrid75 ? "This week’s schedule" : "Your programme week"}
            subtitle={
              isHybrid75
                ? "Tap through each session — full coaching detail below."
                : "Week 1 is unlocked — full sessions below. Weeks 2–4 unlock with membership."
            }
          />

          {!isHybrid75 ? (
            <>
              <WeekSessionsActionNote />
              <ProgrammeWeekOneUnlocked />
            </>
          ) : null}

          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-yellow-300">Quick note from Kieran</p>
            <div className="overflow-hidden rounded-2xl border border-zinc-800">
              <iframe
                src="https://www.youtube.com/embed/dMOMVcctNns"
                title="Hybrid365 Coaching Intro"
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          <div className="space-y-4">
            {sessions.map((day) => (
              <FreePlanSessionCard
                key={day.scrollId}
                session={day}
                isHybrid75={isHybrid75}
                allSessions={sessions}
                sessionLog={isHybrid75 ? challengeLogs.logsBySessionId[day.scrollId] : undefined}
                onLogSession={isHybrid75 && isHybrid75LoggableSession(day) ? () => setLogModalSession(day) : undefined}
              />
            ))}
          </div>

          {!isHybrid75 ? (
            <SectionCard>
              <ProgrammeLockedWeeksPreview />
            </SectionCard>
          ) : null}
        </section>

        {/* CHALLENGE */}
        {isHybrid75 ? (
          <section id="section-challenge" className="scroll-mt-20 mt-12">
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
          </section>
        ) : null}

        {isHybrid75 ? (
          <section id="section-leaderboard" className="scroll-mt-20 mt-12">
            <Hybrid75Leaderboard
              planId={planId}
              athleteName={athleteName}
              pendingPoints={challengeLogs.pendingPoints}
              approvedPoints={challengeLogs.approvedPoints}
              totalPoints={challengeLogs.totalPoints}
            />
          </section>
        ) : null}

        {!isHybrid75 ? (
          <section className="scroll-mt-20 mt-12">
            <TelegramCommunitySection />
          </section>
        ) : null}

        {/* PROGRESS */}
        <section id="section-progress" className="scroll-mt-20 mt-12 space-y-6">
          <SectionHeading
            title={isHybrid75 ? "Progress preview" : "Track this week’s consistency"}
            subtitle={
              isHybrid75
                ? "Planned week preview — live completion tracking unlocks with full membership."
                : "Sessions planned, training split and your 7-day grid — deeper trends unlock with membership."
            }
          />

          {!isHybrid75 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard
                label="Sessions planned"
                value={String(sessions.length)}
                sub="This free week"
                highlight
              />
              <MetricCard label="Runs" value={String(metrics.runs)} />
              <MetricCard label="Strength" value={String(metrics.strength)} />
              <MetricCard
                label="Conditioning"
                value={String(metrics.conditioning + metrics.hybrid)}
              />
            </div>
          ) : null}

          {/* Training split bar */}
          <SectionCard>
            <h3 className="mb-4 text-lg font-semibold text-white">Training split</h3>
            <div className="mb-4 flex h-4 overflow-hidden rounded-full bg-zinc-800">
              {trainingSplit.map((slice) => (
                <div
                  key={slice.label}
                  className={`${slice.color} transition-all`}
                  style={{ width: `${slice.percentage}%` }}
                  title={`${slice.label}: ${slice.sessions} sessions`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {trainingSplit.map((slice) => (
                <div key={slice.label} className="flex items-center gap-2 text-sm">
                  <span className={`h-3 w-3 rounded-full ${slice.color}`} />
                  <span className="text-zinc-400">{slice.label}</span>
                  <span className="ml-auto font-semibold text-white">{slice.percentage}%</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 7-day grid */}
          <SectionCard>
            <h3 className="mb-4 text-lg font-semibold text-white">7-day consistency grid</h3>
            <p className="mb-4 text-sm text-zinc-500">Planned week preview — one snapshot of your structured week.</p>
            <div className="grid grid-cols-7 gap-2">
              {weekGrid.map((cell) => (
                <div key={cell.day} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{cell.label}</span>
                  <div
                    className={`flex h-14 w-full flex-col items-center justify-center rounded-xl border px-1 text-center ${
                      cell.category === "Rest"
                        ? "border-zinc-800 bg-zinc-950/50 text-zinc-600"
                        : cell.category === "Run"
                        ? "border-[#F4D23C]/30 bg-[#F4D23C]/10 text-[#F4D23C]"
                        : cell.category === "Challenge"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                        : "border-white/10 bg-white/[0.04] text-white/80"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase leading-tight">
                      {cell.category === "Rest" ? "—" : cell.category.slice(0, 4)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Hybrid 75 challenge tracker */}
          {isHybrid75 ? (
            <SectionCard>
              <h3 className="mb-1 text-lg font-semibold text-white">Hybrid 75 challenge tracker</h3>
              <p className="mb-5 text-sm text-zinc-500">
                Log sessions with proof to earn points. Points are manually approved at the end of each week.
              </p>
              {!challengeLogs.configured ? (
                <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Session logging storage is not configured in this environment yet.
                </p>
              ) : null}
              <div className="space-y-4">
                {[
                  { label: "Runs", current: challengeLogs.completedRuns, target: 3, icon: Activity },
                  { label: "Lifts", current: challengeLogs.completedLifts, target: 3, icon: Dumbbell },
                  { label: "Mobility", current: challengeLogs.completedMobility, target: 1, icon: Wind },
                  { label: "Hydration", current: 0, target: 7, suffix: "days", icon: Droplets },
                  { label: "Clean eating", current: 0, target: 7, suffix: "days", icon: UtensilsCrossed },
                  { label: "Proof posted", current: challengeLogs.logs.filter((l) => l.proof_type !== "not_yet").length, target: 7, suffix: "sessions", icon: CheckCircle2 },
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
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span className="text-sm text-white/80">Weekly challenge</span>
                  <span className="rounded-full border border-[#F4D23C]/35 bg-[#F4D23C]/10 px-3 py-1 text-xs font-semibold text-[#F4D23C]">
                    {challengeLogs.completedChallenge > 0 ? "Logged" : "Pending"}
                  </span>
                </div>
                <div className="rounded-xl border border-[#F4D23C]/25 bg-[#F4D23C]/5 px-4 py-3 text-sm text-white/80">
                  Pending points: <span className="font-bold text-[#F4D23C]">{challengeLogs.pendingPoints}</span>
                  {" · "}
                  Approved points: <span className="font-bold text-white">{challengeLogs.approvedPoints}</span>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {!isHybrid75 ? (
            <SectionCard>
              <h3 className="mb-1 text-lg font-semibold text-white">Full member tracking</h3>
              <LockedProgressPreviews />
            </SectionCard>
          ) : null}
        </section>

        {/* UPGRADE */}
        <section id="section-upgrade" className="scroll-mt-20 mt-12 space-y-6">
          {isHybrid75 ? (
            <SectionHeading
              title="Unlock the full Hybrid365 experience"
              subtitle="Your free week is the preview — full membership unlocks progression, tracking and community."
            />
          ) : (
            <MembershipFeaturePreviewsSection />
          )}

          {isHybrid75 ? (
          <div id="section-upgrade-features" className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Calendar,
                title: "Full 16-week structured programme",
                copy: "Progress beyond your free week with a complete 16-week plan built around your goals, ability and schedule.",
              },
              {
                icon: BarChart3,
                title: "Advanced progress tracking",
                copy: "Track run volume, strength work, session completion, bodyweight trends, check-ins and benchmarks across the full block.",
              },
              {
                icon: ClipboardCheck,
                title: "Weekly check-ins",
                copy: "Review your week, stay accountable and make better training decisions with structured check-ins.",
              },
              {
                icon: Users,
                title: "Community + challenge continuation",
                copy: isHybrid75
                  ? "Keep following the Hybrid 75 structure with more accountability, community support and ongoing progression."
                  : "Join the Hybrid365 community for accountability, coaching resources and ongoing progression.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-5"
              >
                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  <Lock className="h-3 w-3" />
                  Full membership
                </div>
                <item.icon className="h-6 w-6 text-[#F4D23C]" />
                <h3 className="mt-4 pr-24 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.copy}</p>
              </div>
            ))}
          </div>
          ) : null}

          {isHybrid75 ? (
          <SectionCard className="border-[#F4D23C]/30 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 text-center">
              <>
                <Sparkles className="mx-auto h-8 w-8 text-[#F4D23C]" />
                <h3 className="mt-4 text-2xl font-bold text-white md:text-3xl">Want the full 16-week version?</h3>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">
                  Your free week is the starting point. The full Hybrid365 programme gives you 16 weeks of
                  personalised structure, progression, tracking, coaching support and team accountability.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href={COMMUNITY_UPGRADE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F4D23C] px-6 py-3.5 text-sm font-bold text-black transition hover:opacity-90"
                  >
                    Unlock the Full 16-Week Programme
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => scrollToId("section-upgrade-features")}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                  >
                    See What&apos;s Included
                  </button>
                </div>
              </>
          </SectionCard>
          ) : (
            <StandardUpgradeSection />
          )}

          {isHybrid75 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-yellow-300">Next step</p>
            <p className="mx-auto mt-3 max-w-xl text-zinc-400">
              {cta.body ||
                "Understand the Hybrid365 method — then decide if you want the full progression built for you."}
            </p>
          </div>
          ) : null}
        </section>

        <footer className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-zinc-500">
          Plan ID: {planId} · Built using <span className="text-white">Hybrid</span>
          <span style={{ color: ACCENT }}>365</span> principles.
        </footer>
      </div>

      {isHybrid75 ? (
        <Hybrid75SessionLogModal
          open={Boolean(logModalSession)}
          session={logModalSession}
          planId={planId}
          athleteName={athleteName}
          athleteEmail={athleteEmail}
          existingLog={logModalSession ? challengeLogs.logsBySessionId[logModalSession.scrollId] : null}
          saving={challengeLogs.saving}
          onClose={() => setLogModalSession(null)}
          onSave={handleSaveLog}
        />
      ) : null}
    </main>
  );
}
