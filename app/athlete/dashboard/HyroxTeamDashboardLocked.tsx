"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Timer,
  User,
} from "lucide-react";
import { LOCKED_PREVIEW_MODULES, MOCK_ATHLETE } from "@/app/lib/hyroxTeamDashboardMock";
import { DashCard, LockedPreviewCard } from "@/components/hyrox-team/HyroxDashboardUi";
import { TimelineSteps } from "@/components/hyrox-team/TimelineSteps";

export default function HyroxTeamDashboardLocked() {
  return (
    <div className="space-y-8">
      <DashCard className="border-amber-500/25 bg-gradient-to-br from-amber-950/30 to-zinc-950">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-300">
              <Timer className="h-3.5 w-3.5" />
              Coach review in progress
            </span>
            <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">{MOCK_ATHLETE.name}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
              Your assessment and baseline testing are being reviewed. Your first Hyrox block is being built
              manually — the full athlete dashboard unlocks when programming is ready.
            </p>
          </div>
          <div className="shrink-0 text-left lg:text-right">
            <p className="text-xs font-semibold uppercase text-zinc-500">Race countdown</p>
            <p className="text-2xl font-bold text-white">{MOCK_ATHLETE.raceCountdownWeeks} weeks</p>
            <p className="mt-1 text-sm text-zinc-500">{MOCK_ATHLETE.race}</p>
          </div>
        </div>
      </DashCard>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <DashCard>
          <h3 className="m-0 text-lg font-bold text-white">Status timeline</h3>
          <div className="mt-6">
            <TimelineSteps
              steps={[
                { n: 1, title: "Application accepted", status: "complete" },
                { n: 2, title: "Payment confirmed", status: "complete" },
                { n: 3, title: "Athlete assessment", status: "complete" },
                { n: 4, title: "Baseline testing", status: "current", description: "2 of 9 submitted" },
                { n: 5, title: "Coach review", status: "upcoming" },
                { n: 6, title: "Dashboard unlock", status: "upcoming" },
              ]}
            />
          </div>
        </DashCard>

        <div className="space-y-4">
          <DashCard>
            <div className="flex items-center justify-between">
              <h3 className="m-0 text-sm font-bold text-white">Assessment</h3>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="m-0 mt-2 text-xs text-zinc-500">Submitted · under review</p>
            <Link href="/athlete/assessment" className="mt-3 inline-block text-xs font-semibold text-[#f4d23c]">
              View / edit →
            </Link>
          </DashCard>

          <DashCard>
            <div className="flex items-center justify-between">
              <h3 className="m-0 text-sm font-bold text-white">Baseline testing</h3>
              <span className="text-xs font-semibold text-amber-300">In progress</span>
            </div>
            <p className="m-0 mt-2 text-xs text-zinc-500">Coach reviewing markers as you submit</p>
            <Link href="/athlete/testing" className="mt-3 inline-block text-xs font-semibold text-[#f4d23c]">
              Complete tests →
            </Link>
          </DashCard>

          <DashCard>
            <h3 className="m-0 text-sm font-bold text-white">What coach is reviewing</h3>
            <ul className="m-0 mt-3 space-y-1.5 text-xs text-zinc-500">
              <li>· Race goal & category fit</li>
              <li>· Weekly availability & equipment</li>
              <li>· Station strengths / weaknesses</li>
              <li>· Run volume progression path</li>
              <li>· Limiters & first-block priorities</li>
            </ul>
          </DashCard>
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Locked preview — your active dashboard
        </h3>
        <p className="mb-4 max-w-2xl text-sm text-zinc-600">
          These modules unlock after coach review. Toggle &quot;Preview active dashboard&quot; above to explore the full
          experience with mock data.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LOCKED_PREVIEW_MODULES.map((m) => (
            <LockedPreviewCard key={m.title} title={m.title} preview={m.preview} />
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { icon: LayoutDashboard, title: "Programme hub" },
            { icon: BarChart3, title: "Benchmarks" },
            { icon: ClipboardList, title: "Check-in" },
            { icon: MessageSquare, title: "Coach notes" },
            { icon: BookOpen, title: "Resources" },
            { icon: User, title: "Profile" },
          ].map((item) => (
            <DashCard key={item.title} locked className="relative !p-4">
              <item.icon className="h-5 w-5 text-zinc-600" />
              <Lock className="absolute right-3 top-3 h-4 w-4 text-zinc-600" />
              <h4 className="m-0 mt-3 font-semibold text-zinc-500">{item.title}</h4>
              <p className="m-0 mt-1 text-xs text-zinc-600">Unlocks after coach review</p>
            </DashCard>
          ))}
        </div>
      </section>
    </div>
  );
}
