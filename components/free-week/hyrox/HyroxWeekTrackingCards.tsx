"use client";

import Link from "next/link";
import { Activity, ClipboardCheck, Lock, Minus, Moon, Target, TrendingUp } from "lucide-react";
import type { HyroxWeekTracking } from "@/app/lib/hyroxFreeWeekDashboard";

function ProgressRing({
  percent,
  muted = false,
  size = 44,
}: {
  percent: number;
  muted?: boolean;
  size?: number;
}) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-zinc-800"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={muted ? "text-zinc-600" : "text-yellow-400"}
      />
    </svg>
  );
}

function TrackingCard({
  icon: Icon,
  title,
  value,
  sub,
  copy,
  locked = false,
  ringPercent,
  ringMuted = false,
  barPercent,
  footer,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  sub?: string;
  copy: string;
  locked?: boolean;
  ringPercent?: number;
  ringMuted?: boolean;
  barPercent?: number;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-w-[168px] flex-col rounded-xl border border-zinc-800 bg-black/50 p-3.5 md:min-w-0">
      {locked ? (
        <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-0.5 rounded-full border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
          <Lock className="h-2.5 w-2.5" />
          Preview
        </span>
      ) : null}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950">
          <Icon className="h-4 w-4 text-yellow-400/90" />
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{title}</p>
          <p className="mt-0.5 truncate text-sm font-bold text-white">{value}</p>
          {sub ? <p className="text-[10px] font-medium text-yellow-300/80">{sub}</p> : null}
        </div>
        {ringPercent != null ? (
          <ProgressRing percent={ringPercent} muted={ringMuted || locked} />
        ) : null}
      </div>
      {barPercent != null ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full ${locked ? "bg-zinc-600" : "bg-yellow-400/80"}`}
            style={{ width: `${Math.min(100, barPercent)}%` }}
          />
        </div>
      ) : null}
      <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-500">{copy}</p>
      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}

export function HyroxWeekTrackingCards({
  tracking,
  communityUrl,
}: {
  tracking: HyroxWeekTracking;
  communityUrl: string;
}) {
  const completionPercent =
    tracking.sessionTotal > 0
      ? Math.round((tracking.sessionCompleted / tracking.sessionTotal) * 100)
      : 0;

  const thresholdBarPercent =
    tracking.thresholdMinutes != null
      ? Math.min(100, Math.round((tracking.thresholdMinutes / 40) * 100))
      : 35;

  const sleepRingPercent =
    tracking.sleepLabel === "Good"
      ? 75
      : tracking.sleepLabel === "Average"
        ? 55
        : tracking.sleepLabel === "Limited"
          ? 35
          : 20;

  return (
    <div className="mt-6 border-t border-zinc-800/80 pt-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
          This Week Tracking
        </p>
        <span className="text-[10px] text-zinc-600">Week 1 · preview mode</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-5 md:overflow-visible [&::-webkit-scrollbar]:hidden">
        <TrackingCard
          icon={Moon}
          title="Sleep Score"
          value={tracking.sleepLocked ? "Preview" : tracking.sleepLabel}
          sub={tracking.sleepLabel !== "Unknown" ? `Assessment: ${tracking.sleepLabel}` : undefined}
          copy="Track weekly sleep trends inside the full HYROX dashboard."
          locked
          ringPercent={sleepRingPercent}
          ringMuted
        />

        <TrackingCard
          icon={Target}
          title="Session Completion"
          value={
            tracking.sessionTotal > 0
              ? `${tracking.sessionCompleted}/${tracking.sessionTotal}`
              : "Week 1 starts now"
          }
          sub={
            tracking.sessionTotal > 0
              ? `${tracking.sessionCompleted} of ${tracking.sessionTotal} planned sessions completed`
              : undefined
          }
          copy="Completion tracking unlocks inside the full HYROX dashboard. Log sessions to track consistency across your training block."
          locked
          ringPercent={completionPercent}
          ringMuted
        />

        <TrackingCard
          icon={ClipboardCheck}
          title="Weekly Check-In"
          value="Locked"
          copy="Weekly check-ins track sleep, soreness, bodyweight, stress, energy and training feedback. Coach-reviewed check-ins are available for HYROX Team members."
          locked
          footer={
            <Link
              href={communityUrl}
              className="text-[11px] font-semibold text-yellow-400 hover:underline"
            >
              Unlock check-ins →
            </Link>
          }
        />

        <TrackingCard
          icon={Activity}
          title="Threshold Volume"
          value={
            tracking.thresholdMinutes != null
              ? `${tracking.thresholdMinutes} min planned`
              : "Planned this week"
          }
          sub={
            tracking.thresholdSessionCount > 0
              ? `${tracking.thresholdSessionCount} threshold session${tracking.thresholdSessionCount === 1 ? "" : "s"}`
              : undefined
          }
          copy="Planned threshold work from your Week 1 HYROX sessions."
          barPercent={thresholdBarPercent}
        />

        <TrackingCard
          icon={TrendingUp}
          title="Progression"
          value="Week 2 locked"
          sub="Change from last week"
          copy="Week-to-week changes unlock with the full 4-week HYROX block. Change from last week unlocks once your full block starts."
          locked
          footer={
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600">
              <Minus className="h-3 w-3" />
              Locked until Week 2
            </span>
          }
        />
      </div>
    </div>
  );
}
