"use client";

import { BarChart3 } from "lucide-react";
import { athleteCard, athleteCardPadding, eyebrowClass } from "./athleteUi";

type Props = {
  title?: string;
  message?: string;
  className?: string;
};

export function ChartDataPlaceholder({
  title = "Chart pending",
  message = "This graph starts once you complete your first week or check-in.",
  className = "h-36",
}: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 px-4 text-center ${className}`}
    >
      <BarChart3 className="h-8 w-8 text-zinc-600" aria-hidden />
      <p className={`${eyebrowClass} mt-3 !text-zinc-500`}>{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">{message}</p>
    </div>
  );
}

export function ChartSectionPlaceholder({
  heading,
  message,
}: {
  heading: string;
  message?: string;
}) {
  return (
    <div className={`${athleteCard} ${athleteCardPadding}`}>
      <p className="text-sm font-semibold text-white">{heading}</p>
      <ChartDataPlaceholder
        className="mt-4 h-44"
        message={
          message ??
          "This graph starts once you complete your first training week and log sessions."
        }
      />
    </div>
  );
}
