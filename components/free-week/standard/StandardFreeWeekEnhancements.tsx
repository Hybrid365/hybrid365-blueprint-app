"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Flame,
  Gauge,
  LineChart,
  Lock,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { COMMUNITY_UPGRADE_URL } from "@/app/lib/freePlanDashboard";
import {
  FREE_WEEK_TELEGRAM_URL,
  HYBRID75_TELEGRAM_GROUP_LABEL,
} from "@/app/lib/freeWeekChallengeMode";

const ACCENT = "#F4D23C";

export const STANDARD_FREE_WEEK_NAV = [
  { id: "section-overview", label: "Home" },
  { id: "section-this-week", label: "Week" },
  { id: "section-community", label: "Community" },
  { id: "section-progress", label: "Progress" },
  { id: "section-upgrade", label: "Upgrade" },
] as const;

const START_HERE_STEPS = [
  "Join the Telegram group",
  "Check your week of training",
  "Complete your sessions and log them after completion",
  "Track your weekly progress in the Progress section",
  "Post training proof / questions inside the community",
  "Unlock your full personalised Hybrid365 programme and member dashboard",
] as const;

const COMMUNITY_BULLETS = [
  { icon: Target, label: "Accountability", desc: "Show up, post proof, stay honest." },
  { icon: Flame, label: "Training proof", desc: "Share sessions and effort in public." },
  { icon: Zap, label: "Weekly challenge energy", desc: "Hybrid 75 updates and weekly pushes." },
  { icon: Users, label: "Like-minded athletes", desc: "Surround yourself with people training hard." },
  { icon: Trophy, label: "Support and standards", desc: "Ask questions, get pushed, raise the bar." },
] as const;

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 72;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

function FullMembershipBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/35 bg-yellow-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-200">
      <Lock className="h-3 w-3" />
      Full membership
    </span>
  );
}

/** Three quick actions — visible immediately after hero on mobile */
export function StandardQuickActionsBar() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <a
        href={FREE_WEEK_TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
      >
        <MessageCircle className="h-4 w-4 shrink-0" />
        Join Telegram
      </a>
      <button
        type="button"
        onClick={() => scrollToSection("section-this-week")}
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-300 transition hover:bg-yellow-400/15"
      >
        View This Week
        <ArrowRight className="h-4 w-4 shrink-0" />
      </button>
      <a
        href={COMMUNITY_UPGRADE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition hover:border-zinc-600"
      >
        Unlock Full Programme
        <ArrowRight className="h-4 w-4 shrink-0" />
      </a>
    </div>
  );
}

/** Compact Telegram CTA for top of Home — under hero / next session */
export function TelegramCtaTop() {
  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-400/[0.1] via-zinc-950 to-black p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-yellow-400" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">Step 1 — Community</p>
          </div>
          <h2 className="mt-2 text-lg font-bold text-white md:text-xl">
            Join the free Hybrid365 Telegram group
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            Surround yourself with people training hard, posting proof and pushing standards.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            This is where we post challenge updates, accountability prompts, training proof and community
            support.
          </p>
        </div>
        <a
          href={FREE_WEEK_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-yellow-400/15 transition hover:bg-yellow-300"
        >
          {HYBRID75_TELEGRAM_GROUP_LABEL}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

/** Start here — numbered steps + embedded CTAs */
export function StartHereCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-yellow-400/25 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_0%_0%,rgba(250,204,21,0.1),transparent)]" />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">Your launchpad</p>
        <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">Start here</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:text-base">
          Your free week is ready. Follow these steps to get the most from it.
        </p>

        <ol className="mt-6 space-y-3">
          {START_HERE_STEPS.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-400/15 text-sm font-bold text-yellow-300 ring-1 ring-yellow-400/30">
                {index + 1}
              </span>
              <span className="pt-1 text-sm leading-relaxed text-zinc-200 md:text-base">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a
            href={FREE_WEEK_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 sm:flex-none sm:px-5"
          >
            Join Telegram
          </a>
          <button
            type="button"
            onClick={() => scrollToSection("section-this-week")}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-yellow-400/35 bg-yellow-400/10 px-4 py-2.5 text-sm font-bold text-yellow-300 transition hover:bg-yellow-400/15 sm:flex-none sm:px-5"
          >
            View My Week
          </button>
          <a
            href={COMMUNITY_UPGRADE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white transition hover:border-zinc-600 sm:flex-none sm:px-5"
          >
            Unlock Full Hybrid365
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function LockedFeaturePreviewCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BarChart3;
  title: string;
  description: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(250,204,21,0.08),transparent)]" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 ring-1 ring-yellow-400/25">
          <Icon className="h-5 w-5 text-yellow-400" />
        </div>
        <FullMembershipBadge />
      </div>
      <h3 className="relative mt-4 text-base font-semibold text-white">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
      <Link
        href={COMMUNITY_UPGRADE_URL}
        className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold text-yellow-300 hover:text-yellow-200"
      >
        Unlock with Hybrid365
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

const MEMBERSHIP_FEATURES = [
  {
    icon: Target,
    title: "Habit Tracker",
    description: "Daily hydration, nutrition, steps, sleep and mobility — stacked into weekly consistency scores.",
  },
  {
    icon: ClipboardCheck,
    title: "Weekly Check-Ins",
    description: "Structured recovery, energy and adherence check-ins that keep your programme honest.",
  },
  {
    icon: Gauge,
    title: "Testing & Benchmarks",
    description: "Log benchmarks and retest progress across engine, strength and hybrid performance.",
  },
  {
    icon: LineChart,
    title: "Progress Trends",
    description: "See training consistency, check-in scores and performance trends over time.",
  },
  {
    icon: Sparkles,
    title: "Full Programme Blocks",
    description: "Structured training blocks that unlock progressively across your full membership.",
  },
  {
    icon: Trophy,
    title: "Community Challenges",
    description: "Monthly challenges, leaderboards and proof-based accountability with the team.",
  },
  {
    icon: Users,
    title: "Coaching Support & Accountability",
    description: "Coaching resources, programme rationale and community accountability beyond week one.",
  },
] as const;

export function MembershipFeaturePreviewsSection() {
  return (
    <section id="section-features" className="scroll-mt-20 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white md:text-3xl">Unlock your full Hybrid365 programme</h2>
        <p className="mt-2 text-zinc-400">
          Your free week is the start — preview what full members get on the member dashboard.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {MEMBERSHIP_FEATURES.map((item) => (
          <LockedFeaturePreviewCard
            key={item.title}
            icon={item.icon}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </section>
  );
}

/** Week 1 unlocked indicator — shown above sessions */
export function ProgrammeWeekOneUnlocked() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400/20 text-lg font-bold text-yellow-300">
        1
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-yellow-300">Unlocked</p>
        <p className="font-semibold text-white">Week 1 — your free week</p>
        <p className="text-xs text-zinc-400">All sessions below are ready to train</p>
      </div>
    </div>
  );
}

/** W2–W4 locked previews — below Week 1 sessions */
export function ProgrammeLockedWeeksPreview() {
  const lockedWeeks = [
    { n: 2, title: "Week 2" },
    { n: 3, title: "Week 3" },
    { n: 4, title: "Week 4" },
  ] as const;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">Continue with full membership</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Your free week is unlocked. Join the full Hybrid365 membership to continue progressing beyond
          week one.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Full members unlock structured training blocks, weekly check-ins, progress tracking and ongoing
          accountability.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {lockedWeeks.map((w) => (
          <div
            key={w.n}
            className="relative rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4"
          >
            <Lock className="absolute right-3 top-3 h-4 w-4 text-zinc-500" />
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Locked</p>
            <p className="mt-2 text-lg font-bold text-white">{w.title}</p>
            <p className="mt-1 text-xs text-zinc-500">Full membership</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-center text-sm text-zinc-400">
        <Lock className="mx-auto mb-2 h-4 w-4 text-zinc-500" />
        Full programme blocks locked — weeks 2–4 unlock with membership
      </div>
    </div>
  );
}

export function WeekSessionsActionNote() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm leading-relaxed text-zinc-300">
      <span className="font-semibold text-yellow-300">This week:</span> Complete these sessions, then use
      the{" "}
      <button
        type="button"
        onClick={() => scrollToSection("section-progress")}
        className="font-semibold text-yellow-300 underline-offset-2 hover:underline"
      >
        Progress
      </button>{" "}
      section to track your consistency.
    </div>
  );
}

/** Full Community tab section */
export function TelegramCommunitySection() {
  return (
    <section
      id="section-community"
      className="scroll-mt-20 space-y-6 rounded-3xl border border-yellow-500/25 bg-gradient-to-br from-yellow-400/[0.08] via-zinc-950 to-black p-6 md:p-8"
    >
      <div>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-yellow-400" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">Community</p>
        </div>
        <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">Train with the group</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
          This group is for people taking part in the Hybrid 75 Summer Challenge, free-week users and
          anyone who wants to surround themselves with hard workers.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Use the group to post proof, ask questions, stay accountable and be around people who are
          actually putting the work in.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COMMUNITY_BULLETS.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
          >
            <item.icon className="h-5 w-5 text-yellow-400" />
            <p className="mt-3 text-sm font-semibold text-white">{item.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{item.desc}</p>
          </div>
        ))}
      </div>

      <a
        href={FREE_WEEK_TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300 sm:w-auto"
      >
        {HYBRID75_TELEGRAM_GROUP_LABEL}
        <ArrowRight className="h-4 w-4" />
      </a>
    </section>
  );
}

const LOCKED_PROGRESS_ITEMS = [
  { icon: Target, label: "Habit trend graph", hint: "Weekly consistency %" },
  { icon: ClipboardCheck, label: "Check-in score trends", hint: "Energy · recovery · motivation" },
  { icon: Gauge, label: "Benchmark testing", hint: "Engine · strength markers" },
  { icon: BarChart3, label: "Bodyweight & progress", hint: "Trend lines over blocks" },
] as const;

export function LockedProgressPreviews() {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-zinc-400">
        Full members unlock deeper trend tracking, weekly check-ins and performance benchmarks.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {LOCKED_PROGRESS_ITEMS.map((item) => (
          <div
            key={item.label}
            className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <item.icon className="h-5 w-5 text-yellow-400/80" />
              <Lock className="h-4 w-4 text-zinc-600" />
            </div>
            <p className="mt-3 text-sm font-semibold text-white">{item.label}</p>
            <p className="mt-1 text-xs text-zinc-500">{item.hint}</p>
            <div className="mt-4 flex h-16 items-end gap-1 opacity-40">
              {[40, 55, 48, 62, 58, 70, 65].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-yellow-400/30"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StandardUpgradeSection() {
  return (
    <div className="rounded-3xl border border-yellow-400/30 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-6 text-center md:p-8">
      <Sparkles className="mx-auto h-8 w-8" style={{ color: ACCENT }} />
      <h3 className="mt-4 text-2xl font-bold text-white md:text-3xl">
        Unlock your full Hybrid365 programme
      </h3>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">
        Your free week gives you the start. The full Hybrid365 membership gives you your complete
        personalised programme, progressive training blocks, full dashboard features, check-ins, habit
        tracking, coaching support and community accountability.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={COMMUNITY_UPGRADE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
        >
          Unlock Full Hybrid365
          <ArrowRight className="h-4 w-4" />
        </a>
        <Link
          href="/community"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600"
        >
          View membership
        </Link>
      </div>
    </div>
  );
}
