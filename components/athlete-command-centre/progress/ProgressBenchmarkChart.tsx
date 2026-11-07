"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, chartMargin, chartTooltipStyle } from "@/components/athlete-command-centre/chartTheme";
import { usePrefersReducedMotion } from "@/components/athlete-command-centre/visual";
import type { HyroxAnalyticsBenchmarkPoint } from "@/app/lib/hyroxAthleteAnalytics";
import { formatPointDate, isLowerBetter } from "./progressMath";

type Props = {
  label: string;
  type: string;
  points: HyroxAnalyticsBenchmarkPoint[];
  empty: string;
};

export function ProgressBenchmarkChart({ label, type, points, empty }: Props) {
  const reduced = usePrefersReducedMotion();
  const lowerBetter = isLowerBetter(type);

  if (points.length === 0) {
    return <p className="mt-6 text-sm leading-relaxed text-zinc-400">{empty}</p>;
  }

  if (points.length === 1) {
    const only = points[0]!;
    return (
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-8 text-center">
        <p className="text-3xl font-bold tabular-nums tracking-tight text-white">{only.display}</p>
        <p className="mt-2 text-xs text-zinc-400">{formatPointDate(only.date)}</p>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
          Complete another {label} benchmark to unlock progression.
        </p>
      </div>
    );
  }

  const data = points.map((point) => ({
    date: point.date.slice(0, 10),
    label: formatPointDate(point.date),
    value: point.normalizedValue,
    display: point.display,
  }));

  const values = data.map((row) => row.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.12, lowerBetter ? 1 : 0.5);

  return (
    <div
      className="mt-4 h-56 w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 sm:h-64"
      role="img"
      aria-label={`${label} progression chart`}
      data-h365-progress-chart=""
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ ...chartMargin, left: 4, right: 12 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            reversed={lowerBetter}
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            width={44}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatAxisTick(type, value)}
          />
          <Tooltip
            {...chartTooltipStyle()}
            formatter={(_value: number, _name: string, item: { payload?: { display?: string } }) => [
              item.payload?.display ?? String(_value),
              label,
            ]}
            labelFormatter={(value) => String(value)}
          />
          <Line
            type="linear"
            dataKey="value"
            stroke={CHART_COLORS.yellow}
            strokeWidth={2}
            dot={{ r: 3.5, fill: CHART_COLORS.yellow, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART_COLORS.yellow, stroke: "#18181b", strokeWidth: 2 }}
            isAnimationActive={!reduced}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatAxisTick(type: string, value: number): string {
  if (isLowerBetter(type)) {
    const seconds = Math.round(value);
    if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    }
    return `${seconds}`;
  }
  if (type === "ftp") return `${Math.round(value)}`;
  return String(Math.round(value * 10) / 10);
}
