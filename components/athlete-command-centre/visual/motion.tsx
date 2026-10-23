"use client";

import { useSyncExternalStore } from "react";
import { MOTION_EASE, MOTION_MS } from "./tokens";

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

export { MOTION_MS };

export function motionStyle(reduced: boolean, extra?: React.CSSProperties): React.CSSProperties {
  if (reduced) return { ...extra };
  return {
    transitionProperty: "opacity, transform",
    transitionDuration: `${MOTION_MS.enter}ms`,
    transitionTimingFunction: MOTION_EASE,
    ...extra,
  };
}

export function FadeIn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <div
      className={className}
      data-h365-motion=""
      style={
        reduced
          ? undefined
          : {
              animation: `h365-fade-in ${MOTION_MS.enter}ms ${MOTION_EASE} both`,
            }
      }
    >
      {children}
    </div>
  );
}

export function MotionEnter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <FadeIn className={className}>{children}</FadeIn>;
}

export function CompletionConfirm({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  const reduced = usePrefersReducedMotion();
  if (!show) return null;
  return (
    <div
      role="status"
      data-h365-motion=""
      className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200"
      style={
        reduced
          ? undefined
          : {
              animation: `h365-fade-in ${MOTION_MS.base}ms ${MOTION_EASE} both`,
            }
      }
    >
      {children}
    </div>
  );
}

export function MotionConfirm({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduced = usePrefersReducedMotion();
  return (
    <div
      className={className}
      data-h365-motion=""
      style={
        reduced
          ? undefined
          : {
              animation: `h365-fade-in ${MOTION_MS.base}ms ${MOTION_EASE} both`,
            }
      }
    >
      {children}
    </div>
  );
}
