"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MOCK_BODYWEIGHT,
  MOCK_RUN_VOLUME_CHART,
  MOCK_THRESHOLD_CHART,
  MOCK_THRESHOLD_SUMMARY,
} from "@/app/lib/hyroxTeamDashboardMock";
import { CHART_COLORS, chartMargin, chartTooltipStyle } from "./chartTheme";

function ChartBox({ children, className = "h-52 w-full" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function ThresholdProgressionChart() {
  const data = MOCK_THRESHOLD_CHART;
  const target = MOCK_THRESHOLD_SUMMARY.targetMinutes;

  return (
    <ChartBox>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={chartMargin}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={["dataMin - 4", "dataMax + 6"]}
            tickFormatter={(v) => `${v}m`}
          />
          <Tooltip
            {...chartTooltipStyle()}
            formatter={(value: number, _n, item) => {
              const p = item.payload as { deload?: boolean };
              return [`${value} min${p.deload ? " · Deload" : ""}`, "Threshold"];
            }}
          />
          <ReferenceLine
            y={target}
            stroke={CHART_COLORS.yellow}
            strokeDasharray="4 4"
            strokeOpacity={0.4}
            label={{ value: `Target ${target}m`, position: "insideTopRight", fill: CHART_COLORS.yellow, fontSize: 10 }}
          />
          <Line
            type="monotone"
            dataKey="minutes"
            stroke={CHART_COLORS.yellow}
            strokeWidth={2.5}
            dot={({ cx, cy, payload }) => {
              const p = payload as { deload?: boolean };
              if (cx == null || cy == null) return <g />;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={p?.deload ? 4 : 5}
                  fill={p?.deload ? "#52525b" : CHART_COLORS.yellow}
                  stroke={p?.deload ? CHART_COLORS.axis : CHART_COLORS.yellow}
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 6, fill: CHART_COLORS.yellow }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function RunVolumeChart() {
  const data = MOCK_RUN_VOLUME_CHART;

  return (
    <ChartBox>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={chartMargin}>
          <defs>
            <linearGradient id="runVolFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[15, "auto"]}
            tickFormatter={(v) => `${v}km`}
          />
          <Tooltip
            {...chartTooltipStyle()}
            formatter={(value: number, _n, item) => {
              const p = item.payload as { race?: boolean; deload?: boolean; peak?: boolean };
              const label = p.race ? "Race week" : p.peak ? "Peak" : p.deload ? "Deload" : "Run volume";
              return [`${value} km`, label];
            }}
          />
          <Area
            type="monotone"
            dataKey="km"
            stroke={CHART_COLORS.blue}
            strokeWidth={2.5}
            fill="url(#runVolFill)"
            dot={({ cx, cy, payload }) => {
              const p = payload as { race?: boolean; deload?: boolean; peak?: boolean };
              if (cx == null || cy == null) return <g />;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={p?.race ? CHART_COLORS.yellow : p?.deload ? "#3f3f46" : CHART_COLORS.blue}
                  stroke={p?.race ? CHART_COLORS.yellow : CHART_COLORS.blue}
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 6, fill: CHART_COLORS.blue }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function BodyweightTrendChart() {
  const data = MOCK_BODYWEIGHT.series.map((p) => ({ week: `W${p.week}`, kg: p.kg }));
  const { min, max } = MOCK_BODYWEIGHT.targetRange;

  return (
    <ChartBox className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={chartMargin}>
          <ReferenceArea y1={min} y2={max} fill={CHART_COLORS.yellowMuted} strokeOpacity={0} />
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 1", "dataMax + 0.5"]} />
          <Tooltip {...chartTooltipStyle()} formatter={(v: number) => [`${v} kg`, "Bodyweight"]} />
          <Line
            type="monotone"
            dataKey="kg"
            stroke={CHART_COLORS.yellow}
            strokeWidth={2.5}
            dot={{ fill: CHART_COLORS.yellow, r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: CHART_COLORS.yellow }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}
