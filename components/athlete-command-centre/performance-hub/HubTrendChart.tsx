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
import type { WeeklyTrendPoint } from "@/app/lib/hyrox-team/modules/performanceHub/types";

type Props = {
  title: string;
  description: string;
  data: WeeklyTrendPoint[];
  dataKey: keyof WeeklyTrendPoint;
  unit: string;
  color?: string;
};

export function HubTrendChart({
  title,
  description,
  data,
  dataKey,
  unit,
  color = CHART_COLORS.yellow,
}: Props) {
  const series = data
    .map((d) => ({
      label: d.weekLabel,
      value: typeof d[dataKey] === "number" ? (d[dataKey] as number) : null,
    }))
    .filter((d) => d.value != null);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      {series.length < 2 ? (
        <p className="mt-8 text-center text-sm text-zinc-500">
          Not enough structured data yet for this chart.
        </p>
      ) : (
        <div className="mt-3 h-48 w-full min-w-0" role="img" aria-label={`${title} trend chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={chartMargin}>
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} />
              <YAxis
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                width={36}
                unit={unit ? ` ${unit}` : undefined}
              />
              <Tooltip
                {...chartTooltipStyle()}
                formatter={(value: number) => [`${value}${unit ? ` ${unit}` : ""}`, title]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color }}
                isAnimationActive={!reduced}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
