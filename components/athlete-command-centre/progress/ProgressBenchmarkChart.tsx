"use client";

import {
  CartesianGrid,
  Dot,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, chartTooltipStyle } from "@/components/athlete-command-centre/chartTheme";
import { usePrefersReducedMotion, visualMeta } from "@/components/athlete-command-centre/visual";
import type { HyroxAnalyticsBenchmarkPoint } from "@/app/lib/hyroxAthleteAnalytics";
import { formatPointDate, isLowerBetter } from "./progressMath";

type Props = {
  label: string;
  type: string;
  points: HyroxAnalyticsBenchmarkPoint[];
  empty: string;
};

type ChartRow = {
  date: string;
  label: string;
  value: number;
  display: string;
  isLatest: boolean;
};

export function ProgressBenchmarkChart({ label, type, points, empty }: Props) {
  const reduced = usePrefersReducedMotion();
  const lowerBetter = isLowerBetter(type);

  if (points.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 px-4 py-8">
        <div className="mx-auto h-24 max-w-sm border-b border-zinc-900">
          <div className="flex h-full items-end gap-3 px-2 pb-1">
            {[32, 44, 28, 52, 36].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm bg-zinc-900" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <p className={`mt-4 text-center text-sm text-zinc-400`}>{empty}</p>
      </div>
    );
  }

  if (points.length === 1) {
    const only = points[0]!;
    return (
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-7 sm:px-5">
        <div className="relative mx-auto h-28 max-w-md">
          <div className="absolute inset-x-0 bottom-8 border-t border-dashed border-zinc-800" />
          <div className="absolute inset-x-0 bottom-16 border-t border-zinc-900" />
          <div className="absolute bottom-7 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-yellow-400 shadow-[0_0_0_4px_rgba(250,204,21,0.15)]" />
        </div>
        <p className="text-center text-3xl font-bold tabular-nums tracking-tight text-white">
          {only.display}
        </p>
        <p className={`mt-2 text-center ${visualMeta}`}>{formatPointDate(only.date)}</p>
        <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-zinc-400">
          Complete another {label} benchmark to unlock progression.
        </p>
      </div>
    );
  }

  const data: ChartRow[] = points.map((point, index) => ({
    date: point.date.slice(0, 10),
    label: formatPointDate(point.date),
    value: point.normalizedValue,
    display: point.display,
    isLatest: index === points.length - 1,
  }));

  const values = data.map((row) => row.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.18, lowerBetter ? 2 : 1);

  return (
    <div
      className="mt-3 h-60 w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-950/95 p-2 sm:h-64 sm:p-3"
      role="img"
      aria-label={`${label} progression chart`}
      data-h365-progress-chart=""
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 14, right: 16, left: 2, bottom: 8 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="2 8" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            interval="preserveStartEnd"
            minTickGap={36}
            tickMargin={8}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            reversed={lowerBetter}
            tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
            width={48}
            tickCount={4}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatAxisTick(type, value)}
          />
          <Tooltip
            cursor={{ stroke: "rgba(250,204,21,0.25)", strokeWidth: 1 }}
            contentStyle={{
              ...chartTooltipStyle().contentStyle,
              borderRadius: "10px",
              padding: "8px 10px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
            }}
            labelStyle={{ color: CHART_COLORS.axis, fontSize: 11, marginBottom: 2 }}
            itemStyle={{ color: "#fafafa", fontSize: 12, fontVariantNumeric: "tabular-nums" }}
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
            strokeWidth={2.25}
            dot={<ProgressDot />}
            activeDot={{ r: 6, fill: CHART_COLORS.yellow, stroke: "#09090b", strokeWidth: 2 }}
            isAnimationActive={!reduced}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProgressDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartRow;
}) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  if (payload?.isLatest) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={7} fill="rgba(250,204,21,0.18)" />
        <circle cx={cx} cy={cy} r={4.5} fill={CHART_COLORS.yellow} stroke="#09090b" strokeWidth={1.5} />
      </g>
    );
  }
  return <Dot cx={cx} cy={cy} r={2.75} fill="rgba(250,204,21,0.45)" strokeWidth={0} />;
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
