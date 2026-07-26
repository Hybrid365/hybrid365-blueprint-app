"use client";

import { useEffect, useId, useState } from "react";
import type { ReadinessCategory } from "@/app/lib/hyrox-team/modules/today/readinessScore";
import { readinessCategoryChipClass } from "@/app/lib/hyrox-team/modules/today/readinessScore";

type Props = {
  score: number | null;
  category: ReadinessCategory | null;
  label: string;
  size?: number;
};

export function ReadinessRing({ score, category, label, size = 112 }: Props) {
  const gid = useId();
  const [display, setDisplay] = useState(0);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const target = score ?? 0;
    if (reduced) {
      setDisplay(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const from = display;
    const duration = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate on score change only
  }, [score, reduced]);

  const pct = Math.max(0, Math.min(100, display));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const color =
    category === "green"
      ? "#34d399"
      : category === "red"
        ? "#f87171"
        : category === "amber"
          ? "#fbbf24"
          : "#71717a";

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#27272a"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{
              transition: reduced ? undefined : "stroke-dashoffset 0.4s ease",
            }}
          />
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.85" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold tabular-nums text-white">
            {score == null ? "—" : display}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">indicator</p>
        </div>
      </div>
      {category ? (
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${readinessCategoryChipClass(category)}`}
        >
          {label}
        </span>
      ) : (
        <span className="text-xs text-zinc-500">{label}</span>
      )}
    </div>
  );
}
