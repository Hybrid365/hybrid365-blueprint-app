"use client";

import {
  LAUNCH_BODYWEIGHT_WEEKS,
  LAUNCH_RUN_VOLUME_WEEKS,
  LAUNCH_THRESHOLD_RUN_WEEKS,
} from "@/app/lib/trailerTeamLaunchMock";

const ACCENT = "#F4D23C";

export function ThresholdRunVolumeChart({ compact = false }: { compact?: boolean }) {
  const w = compact ? 400 : 640;
  const h = compact ? 160 : 220;
  const pad = { t: 28, r: 12, b: 32, l: 40 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const maxMin = 58;
  const minMin = 0;

  const points = LAUNCH_THRESHOLD_RUN_WEEKS.filter((d) => !d.race).map((d, i, arr) => {
    const x = pad.l + (i / (arr.length - 1)) * innerW;
    const y = pad.t + innerH - ((d.min - minMin) / (maxMin - minMin)) * innerH;
    return { ...d, x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Threshold run volume">
      {[0, 24, 36, 48].map((m) => {
        const y = pad.t + innerH - ((m - minMin) / (maxMin - minMin)) * innerH;
        return (
          <g key={m}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#27272a" strokeWidth="1" />
            <text x={pad.l - 6} y={y + 3} textAnchor="end" fill="#71717a" fontSize="9">
              {m}
            </text>
          </g>
        );
      })}
      <path d={linePath} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.week}>
          {p.deload ? (
            <rect x={p.x - 12} y={pad.t} width={24} height={innerH} fill={ACCENT} opacity={0.06} rx={3} />
          ) : null}
          <circle cx={p.x} cy={p.y} r={4} fill={ACCENT} stroke="#18181b" strokeWidth={2} />
          <text x={p.x} y={h - 8} textAnchor="middle" fill="#71717a" fontSize="8">
            W{p.week}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function LaunchRunVolumeBarChart({ compact = false }: { compact?: boolean }) {
  const w = compact ? 360 : 640;
  const h = compact ? 160 : 200;
  const pad = { t: 16, r: 8, b: 28, l: 36 };
  const barW = (w - pad.l - pad.r) / LAUNCH_RUN_VOLUME_WEEKS.length - 4;
  const maxKm = 46;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Weekly run volume">
      {LAUNCH_RUN_VOLUME_WEEKS.map((d, i) => {
        if (d.race) return null;
        const x = pad.l + i * (barW + 4);
        const barH = ((d.km || 8) / maxKm) * (h - pad.t - pad.b);
        const y = h - pad.b - barH;
        return (
          <g key={d.week}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill={d.deload ? "#3f3f46" : ACCENT}
              opacity={d.deload ? 0.5 : 0.85}
              rx={3}
            />
            <text x={x + barW / 2} y={h - 8} textAnchor="middle" fill="#71717a" fontSize="8">
              {d.week}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function BodyweightLineChart({ compact = false }: { compact?: boolean }) {
  const w = compact ? 360 : 560;
  const h = compact ? 140 : 180;
  const pad = { t: 20, r: 12, b: 28, l: 40 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const rangeLow = 81;
  const rangeHigh = 83;
  const minKg = 81.5;
  const maxKg = 85.5;

  const points = LAUNCH_BODYWEIGHT_WEEKS.map((d, i) => {
    const x = pad.l + (i / (LAUNCH_BODYWEIGHT_WEEKS.length - 1)) * innerW;
    const y = pad.t + innerH - ((d.kg - minKg) / (maxKg - minKg)) * innerH;
    return { ...d, x, y };
  });

  const yLow = pad.t + innerH - ((rangeLow - minKg) / (maxKg - minKg)) * innerH;
  const yHigh = pad.t + innerH - ((rangeHigh - minKg) / (maxKg - minKg)) * innerH;
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Bodyweight tracking">
      <rect
        x={pad.l}
        y={yHigh}
        width={innerW}
        height={yLow - yHigh}
        fill={ACCENT}
        opacity={0.08}
      />
      <path d={linePath} fill="none" stroke={ACCENT} strokeWidth="2" />
      {points.map((p) => (
        <circle key={p.week} cx={p.x} cy={p.y} r={3.5} fill={ACCENT} />
      ))}
    </svg>
  );
}

export function ScoreRing({ value, label, delta }: { value: number; label: string; delta?: string | null }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center text-center">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#27272a" strokeWidth="6" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="#F4D23C"
          strokeWidth="6"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <p className="-mt-12 text-lg font-bold text-white">{value}%</p>
      <p className="mt-8 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      {delta ? <p className="mt-0.5 text-xs text-emerald-400">{delta}</p> : null}
    </div>
  );
}
