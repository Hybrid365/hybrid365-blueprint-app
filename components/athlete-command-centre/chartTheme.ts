export const CHART_COLORS = {
  yellow: "#facc15",
  yellowMuted: "rgba(250, 204, 21, 0.35)",
  blue: "#3b82f6",
  grid: "#27272a",
  axis: "#71717a",
  tooltipBg: "#18181b",
  tooltipBorder: "#3f3f46",
};

export const chartMargin = { top: 8, right: 8, left: -8, bottom: 4 };

export function chartTooltipStyle() {
  return {
    contentStyle: {
      backgroundColor: CHART_COLORS.tooltipBg,
      border: `1px solid ${CHART_COLORS.tooltipBorder}`,
      borderRadius: "12px",
      fontSize: "12px",
      color: "#fafafa",
    },
    labelStyle: { color: CHART_COLORS.axis },
    itemStyle: { color: "#fafafa" },
  };
}
