"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const METRICS = [
  { label: "Run volume", value: "+35%", tone: "text-[#4ade80]" },
  { label: "Threshold time", value: "+100%", tone: "text-[#4ade80]" },
  { label: "Race readiness", value: "82%", tone: "text-[#f4d23c]" },
] as const;

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServer() {
  return true;
}

function ProgressSparkline({ animate }: { animate: boolean }) {
  return (
    <svg
      viewBox="0 0 120 32"
      className="h-8 w-full"
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="hero-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4d23c" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#f4d23c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 24 L20 20 L40 18 L60 14 L80 12 L100 8 L120 6 L120 32 L0 32 Z"
        fill="url(#hero-spark-fill)"
      />
      <path
        d="M0 24 L20 20 L40 18 L60 14 L80 12 L100 8 L120 6"
        fill="none"
        stroke="#f4d23c"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(animate && "homepage-sparkline-draw")}
        pathLength={100}
      />
    </svg>
  );
}

export function HomepageHeroProgressCard({ className }: { className?: string }) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer
  );

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/12 bg-[#0c0c0c]/95 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur-sm sm:p-3.5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">
            Performance Trend
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-white/80">Progress Tracking</p>
        </div>
        <span className="rounded-full border border-[#4ade80]/25 bg-[#4ade80]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#4ade80]">
          On track
        </span>
      </div>

      <div className="mt-2.5">
        <ProgressSparkline animate={!prefersReducedMotion} />
      </div>

      <ul className="mt-2.5 space-y-1.5">
        {METRICS.map((metric) => (
          <li key={metric.label} className="flex items-center justify-between gap-3 text-[10px]">
            <span className="text-white/50">{metric.label}</span>
            <span className={cn("font-bold tabular-nums", metric.tone)}>{metric.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
