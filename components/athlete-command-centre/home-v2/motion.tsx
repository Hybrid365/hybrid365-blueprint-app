"use client";

import { useSyncExternalStore } from "react";

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, () => false);
}

/** Measured results render immediately. Do not count up from zero. */
export function CountUp({
  value,
  suffix = "",
  className = "",
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  return (
    <span className={`tabular-nums ${className}`}>
      {value}
      {suffix}
    </span>
  );
}

export function AnimatedProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className={`h-2 overflow-hidden rounded-full bg-zinc-950 ${className}`}>
      <div
        className="h-full rounded-full bg-yellow-400"
        style={{
          width: `${pct}%`,
          transition: reduced ? undefined : "width 180ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}
