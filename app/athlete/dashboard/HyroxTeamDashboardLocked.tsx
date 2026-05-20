"use client";

import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Loader2,
  Lock,
  Sparkles,
  Timer,
} from "lucide-react";
import { LOCKED_PREVIEW_MODULES, MOCK_ATHLETE } from "@/app/lib/hyroxTeamDashboardMock";
import { DashCard, LockedPreviewCard } from "@/components/hyrox-team/HyroxDashboardUi";

type CardState = "complete" | "current" | "queued" | "locked";

const STATUS_PIPELINE: {
  key: string;
  label: string;
  description: string;
  state: CardState;
}[] = [
  {
    key: "assessment",
    label: "Assessment submitted",
    description: "Profile captured for coach review.",
    state: "complete",
  },
  {
    key: "testing",
    label: "Testing submitted",
    description: "Baseline tests and/or RoxFit race data on file.",
    state: "complete",
  },
  {
    key: "coach",
    label: "Coach reviewing",
    description: "Your coach is reading your profile — not auto-processed.",
    state: "current",
  },
  {
    key: "draft",
    label: "Programme draft",
    description: "First block built from your assessment — manually checked.",
    state: "queued",
  },
  {
    key: "live",
    label: "Programme live",
    description: "Unlocks here when your coach publishes.",
    state: "locked",
  },
];

function StatusIcon({ state }: { state: CardState }) {
  if (state === "complete") {
    return <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />;
  }
  if (state === "current") {
    return <Loader2 className="h-5 w-5 animate-spin text-amber-300" aria-hidden />;
  }
  if (state === "queued") {
    return <Sparkles className="h-5 w-5 text-zinc-500" aria-hidden />;
  }
  return <Lock className="h-5 w-5 text-zinc-600" aria-hidden />;
}

export default function HyroxTeamDashboardLocked() {
  return (
    <div className="space-y-8">
      <DashCard className="border-zinc-700/80 bg-gradient-to-br from-zinc-950 to-zinc-900/90">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-200">
              <Timer className="h-3.5 w-3.5" />
              Your programme is being built.
            </span>
            <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">{MOCK_ATHLETE.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Your assessment and testing have been submitted. Your coach is reviewing your profile and building your
              first training block. This is not an instant template — your programme is manually reviewed before it
              appears here.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500">
              Built from your assessment, not a generic calendar. When your coach publishes your block, this dashboard
              switches to your live programme automatically (in production). Use the mock toggle above only to preview the
              full hub.
            </p>
          </div>
          <div className="shrink-0 text-left lg:text-right">
            <p className="text-xs font-semibold uppercase text-zinc-500">Race countdown</p>
            <p className="text-2xl font-bold text-white">{MOCK_ATHLETE.raceCountdownWeeks} weeks</p>
            <p className="mt-1 text-sm text-zinc-500">{MOCK_ATHLETE.race}</p>
          </div>
        </div>
      </DashCard>

      <div>
        <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-zinc-500">Pipeline status</h3>
        <p className="m-0 mt-1 max-w-2xl text-sm text-zinc-600">
          Coach-reviewed flow — each stage updates when your profile progresses (mocked for demo).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STATUS_PIPELINE.map((s) => (
            <DashCard
              key={s.key}
              className={`!p-4 ${
                s.state === "current" ? "border-amber-500/30 bg-amber-500/[0.06]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <StatusIcon state={s.state} />
              </div>
              <p className="m-0 mt-3 text-sm font-bold text-white">{s.label}</p>
              <p className="m-0 mt-1 text-[11px] leading-snug text-zinc-500">{s.description}</p>
            </DashCard>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <DashCard>
          <h3 className="m-0 text-lg font-bold text-white">Quick links</h3>
          <p className="m-0 mt-2 text-sm text-zinc-500">While you wait, finish or update your onboarding data.</p>
          <ul className="m-0 mt-4 space-y-2 text-sm">
            <li>
              <Link href="/athlete/assessment" className="font-semibold text-[#f4d23c] hover:underline">
                Athlete assessment →
              </Link>
            </li>
            <li>
              <Link href="/athlete/testing" className="font-semibold text-[#f4d23c] hover:underline">
                Baseline testing & RoxFit →
              </Link>
            </li>
            <li>
              <Link href="/athlete/onboarding" className="font-semibold text-zinc-400 hover:text-[#f4d23c]">
                Onboarding timeline →
              </Link>
            </li>
          </ul>
        </DashCard>

        <DashCard>
          <h3 className="m-0 text-sm font-bold text-white">What your coach is using</h3>
          <ul className="m-0 mt-3 space-y-1.5 text-xs text-zinc-500">
            <li>· Race goal, division and timeline</li>
            <li>· Weekly availability & equipment</li>
            <li>· Station profile & limiters</li>
            <li>· Baseline markers / RoxFit splits</li>
            <li>· First-block priorities — not a template week</li>
          </ul>
        </DashCard>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Locked preview — your active dashboard
        </h3>
        <p className="mb-4 max-w-2xl text-sm text-zinc-600">
          These modules unlock when your coach publishes your programme. Enable{" "}
          <span className="font-medium text-zinc-400">Programme live (mock)</span> above to explore the full experience
          with sample data.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LOCKED_PREVIEW_MODULES.map((m) => (
            <LockedPreviewCard key={m.title} title={m.title} preview={m.preview} />
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { icon: LayoutDashboard, title: "Programme hub" },
            { icon: ClipboardList, title: "Check-in" },
            { icon: BarChart3, title: "Benchmarks" },
          ].map((item) => (
            <DashCard key={item.title} locked className="relative !p-4">
              <item.icon className="h-5 w-5 text-zinc-600" />
              <Lock className="absolute right-3 top-3 h-4 w-4 text-zinc-600" />
              <h4 className="m-0 mt-3 font-semibold text-zinc-500">{item.title}</h4>
              <p className="m-0 mt-1 text-xs text-zinc-600">Unlocks when your programme is published</p>
            </DashCard>
          ))}
        </div>
      </section>
    </div>
  );
}
