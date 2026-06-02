"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Gauge,
  LineChart,
  Lock,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
  Users,
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

function FullMembershipBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/35 bg-yellow-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-200">
      <Lock className="h-3 w-3" />
      Full membership
    </span>
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
    description: "Structured 4-week blocks that unlock progressively across your 16-week membership.",
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
        <h2 className="text-2xl font-bold text-white md:text-3xl">Full membership features</h2>
        <p className="mt-2 text-zinc-400">
          Preview what unlocks when you join Hybrid365 — your free week is week one only.
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

export function ProgrammeBlocksSection() {
  const weeks = [
    {
      n: 1,
      unlocked: true,
      title: "Week 1 — unlocked",
      sub: "Your free week — full sessions below",
    },
    { n: 2, unlocked: false, title: "Week 2", sub: "Locked preview" },
    { n: 3, unlocked: false, title: "Week 3", sub: "Locked preview" },
    { n: 4, unlocked: false, title: "Week 4", sub: "Locked preview" },
  ] as const;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white md:text-xl">Your programme blocks</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Your free week is unlocked. Join the full Hybrid365 membership to continue progressing beyond
          week one.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Full members unlock structured training blocks, weekly check-ins, progress tracking and ongoing
          accountability.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {weeks.map((w) => (
          <div
            key={w.n}
            className={`relative rounded-2xl border p-4 ${
              w.unlocked
                ? "border-yellow-400/40 bg-yellow-400/10"
                : "border-zinc-800 bg-zinc-950/80"
            }`}
          >
            {!w.unlocked ? (
              <Lock className="absolute right-3 top-3 h-4 w-4 text-zinc-500" />
            ) : null}
            <p
              className={`text-xs font-bold uppercase tracking-wider ${
                w.unlocked ? "text-yellow-300" : "text-zinc-500"
              }`}
            >
              {w.unlocked ? "Unlocked" : "Locked"}
            </p>
            <p className="mt-2 text-lg font-bold text-white">Week {w.n}</p>
            <p className="mt-1 text-xs text-zinc-400">{w.sub}</p>
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

export function TelegramCommunitySection() {
  return (
    <section
      id="section-community"
      className="scroll-mt-20 rounded-3xl border border-yellow-500/25 bg-gradient-to-br from-yellow-400/[0.08] via-zinc-950 to-black p-6 md:p-8"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-yellow-400" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">
              Free community
            </p>
          </div>
          <h2 className="mt-3 text-2xl font-bold text-white">Join the Telegram group</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
            Join the free Telegram group for the Hybrid 75 Summer Challenge, weekly challenges, proof
            posts, accountability and to surround yourself with people who are training hard.
          </p>
        </div>
        <a
          href={FREE_WEEK_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300"
        >
          {HYBRID75_TELEGRAM_GROUP_LABEL}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
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
        Full members can track trends across habits, check-ins, training consistency and performance
        benchmarks.
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
          Want the full Hybrid365 experience?
        </h3>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">
          Your free week is the start. The full Hybrid365 membership gives you your complete personalised
          programme, progression, dashboard features, check-ins, tracking, coaching support and community
          accountability.
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
