"use client";

import { Activity, ClipboardCheck, Moon, Target, TrendingUp } from "lucide-react";
import type { HyroxWeekTracking } from "@/app/lib/hyroxFreeWeekDashboard";

type MetricButtonProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  badge: string;
  subLabel: string;
  onClick: () => void;
};

function MetricButton({ icon: Icon, title, value, badge, subLabel, onClick }: MetricButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-[148px] shrink-0 flex-col rounded-xl border border-zinc-800 bg-zinc-950/90 px-3.5 py-3 text-left transition hover:border-yellow-400/40 hover:bg-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400 md:min-w-0"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-black group-hover:border-yellow-400/30">
          <Icon className="h-3.5 w-3.5 text-yellow-400" />
        </div>
        <span className="shrink-0 rounded-full border border-zinc-700 bg-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
          {badge}
        </span>
      </div>
      <p className="mt-2.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">{title}</p>
      <p className="mt-0.5 text-base font-bold leading-tight text-white">{value}</p>
      <p className="mt-1 text-[10px] text-zinc-600">{subLabel}</p>
    </button>
  );
}

export function HyroxWeekTrackingCards({
  tracking,
  onNavigate,
}: {
  tracking: HyroxWeekTracking;
  onNavigate: (sectionId: string) => void;
}) {
  const sessionValue =
    tracking.sessionTotal > 0 ? `${tracking.sessionCompleted}/${tracking.sessionTotal}` : "0/0";

  const thresholdValue =
    tracking.thresholdMinutes != null ? `${tracking.thresholdMinutes} min` : "Planned";

  return (
    <div className="mt-6 border-t border-zinc-800/80 pt-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
          This Week Tracking
        </p>
        <span className="text-[10px] text-zinc-600">Week 1</span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-5 md:gap-3 md:overflow-visible [&::-webkit-scrollbar]:hidden">
        <MetricButton
          icon={Moon}
          title="Sleep"
          value="Preview"
          badge="Preview"
          subLabel="Weekly trend"
          onClick={() => onNavigate("hyrox-progress")}
        />

        <MetricButton
          icon={Target}
          title="Sessions"
          value={sessionValue}
          badge="Week 1"
          subLabel="Planned sessions"
          onClick={() => onNavigate("hyrox-sessions")}
        />

        <MetricButton
          icon={ClipboardCheck}
          title="Check-in"
          value="Locked"
          badge="Full dashboard"
          subLabel="Weekly review"
          onClick={() => onNavigate("hyrox-checkin")}
        />

        <MetricButton
          icon={Activity}
          title="Threshold"
          value={thresholdValue}
          badge="Week 1"
          subLabel="Volume this week"
          onClick={() => onNavigate("hyrox-targets")}
        />

        <MetricButton
          icon={TrendingUp}
          title="Progression"
          value="Week 2 locked"
          badge="Upgrade"
          subLabel="4-week block"
          onClick={() => onNavigate("hyrox-block")}
        />
      </div>
    </div>
  );
}
