"use client";

import {
  BarChart3,
  Calendar,
  ClipboardCheck,
  Lock,
  Users,
} from "lucide-react";
import Hybrid75UpgradeCta from "@/components/free-week/Hybrid75UpgradeCta";
import { useFreePlan } from "@/components/free-week/FreePlanProvider";

function FeatureCard({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Calendar;
  title: string;
  copy: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-5">
      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
        <Lock className="h-3 w-3" />
        Full membership
      </div>
      <Icon className="h-6 w-6 text-[#F4D23C]" />
      <h3 className="mt-4 pr-24 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{copy}</p>
    </div>
  );
}

export default function Hybrid75UpgradeClient() {
  const { planJson } = useFreePlan();
  const cta = (planJson.cta as Record<string, string>) || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white md:text-4xl">Unlock the full Hybrid365 experience</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Your free week is the preview — full membership unlocks progression, tracking and community.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FeatureCard
          icon={Calendar}
          title="Full 16-week structured programme"
          copy="Progress beyond your free week with a complete 16-week personalised plan built around your goals, ability and schedule."
        />
        <FeatureCard
          icon={BarChart3}
          title="Advanced progress tracking"
          copy="Track run volume, strength work, session completion, habits, bodyweight trends, check-ins and benchmarks across the full block."
        />
        <FeatureCard
          icon={ClipboardCheck}
          title="Weekly check-ins"
          copy="Review your week, stay accountable and make better training decisions with structured coaching check-ins."
        />
        <FeatureCard
          icon={Users}
          title="Community + team accountability"
          copy="Keep following the Hybrid 75 structure with more accountability, coaching support, community and ongoing progression."
        />
      </div>

      <Hybrid75UpgradeCta />

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-yellow-300">Next step</p>
        <p className="mx-auto mt-3 max-w-xl text-zinc-400">
          {cta.body ||
            "Understand the Hybrid365 method — then decide if you want the full 16-week progression built for you."}
        </p>
      </div>
    </div>
  );
}
