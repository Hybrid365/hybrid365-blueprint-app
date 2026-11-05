"use client";

import { useSyncExternalStore } from "react";

/** v0 ease — cubic-bezier(0.2, 0, 0, 1) as Motion array. */
export const VS_EASE = [0.2, 0, 0, 1] as const;

export const VS_DURATION = {
  fast: 0.15,
  normal: 0.18,
  medium: 0.2,
  reveal: 0.32,
} as const;

function subscribe(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function snapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

/** Instant transition when reduced motion is preferred. */
export function vsTransition(
  reduced: boolean,
  duration: number = VS_DURATION.normal
) {
  if (reduced) return { duration: 0 };
  return { duration, ease: VS_EASE };
}
