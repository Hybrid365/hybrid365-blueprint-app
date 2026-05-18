"use client";

import { TRAILER_RUN_VOLUME_WEEKS, TRAILER_THRESHOLD_PACE } from "@/app/lib/trailerAssetsMock";

const ACCENT = "#F4D23C";

/** Section 3 — 12-week run volume line/area chart (SVG, no external deps). */
export function RunVolumeChart() {
  const w = 640;
  const h = 220;
  const pad = { t: 24, r: 16, b: 36, l: 44 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const maxKm = 44;
  const minKm = 18;

  const points = TRAILER_RUN_VOLUME_WEEKS.map((d, i) => {
    const x = pad.l + (i / (TRAILER_RUN_VOLUME_WEEKS.length - 1)) * innerW;
    const y = pad.t + innerH - ((d.km - minKm) / (maxKm - minKm)) * innerH;
    return { ...d, x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]!.x} ${pad.t + innerH} L ${points[0]!.x} ${pad.t + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Weekly running volume">
      <defs>
        <linearGradient id="runVolFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.35" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[20, 28, 36, 44].map((km) => {
        const y = pad.t + innerH - ((km - minKm) / (maxKm - minKm)) * innerH;
        return (
          <g key={km}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#27272a" strokeWidth="1" />
            <text x={pad.l - 8} y={y + 4} textAnchor="end" fill="#71717a" fontSize="10">
              {km}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#runVolFill)" />
      <path d={linePath} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.week}>
          {p.deload ? (
            <rect
              x={p.x - 14}
              y={pad.t}
              width={28}
              height={innerH}
              fill={ACCENT}
              opacity={0.06}
              rx={4}
            />
          ) : null}
          <circle
            cx={p.x}
            cy={p.y}
            r={p.deload ? 5 : 4}
            fill={p.deload ? "#18181b" : ACCENT}
            stroke={ACCENT}
            strokeWidth={2}
          />
          <text x={p.x} y={h - 10} textAnchor="middle" fill="#71717a" fontSize="9">
            W{p.week}
          </text>
          {p.deload ? (
            <text x={p.x} y={pad.t - 6} textAnchor="middle" fill={ACCENT} fontSize="8" fontWeight="600">
              DELOAD
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

/** Section 5 — threshold pace progression bar. */
export function ThresholdPaceChart() {
  const { startSec, endSec, start, end } = TRAILER_THRESHOLD_PACE;
  const range = startSec - endSec;
  const pct = 100;

  return (
    <div className="space-y-4">
      <div className="relative h-3 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-zinc-600 via-[#F4D23C] to-[#F4D23C]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Week 1</p>
          <p className="mt-0.5 text-lg font-bold text-zinc-400">{start}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#F4D23C]">
            −{range}s / km
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">12-week progression</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Week 12</p>
          <p className="mt-0.5 text-lg font-bold text-[#F4D23C]">{end}</p>
        </div>
      </div>
    </div>
  );
}
