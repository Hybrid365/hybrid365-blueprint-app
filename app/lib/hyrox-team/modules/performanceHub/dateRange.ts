/**
 * Date-range helpers for Performance Hub (local calendar days).
 */

import { parseYmd, startOfLocalDay, toYmd } from "@/app/lib/hyroxProgrammeDates";
import type { HubRangeKey } from "@/app/lib/hyrox-team/modules/performanceHub/types";

export function resolveHubDateRange(
  key: HubRangeKey,
  today: Date = new Date()
): { startYmd: string; endYmd: string; label: string } {
  const end = startOfLocalDay(today);
  const endYmd = toYmd(end);

  if (key === "this_week") {
    const day = end.getDay(); // 0 Sun
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(end);
    monday.setDate(end.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      startYmd: toYmd(startOfLocalDay(monday)),
      endYmd: toYmd(startOfLocalDay(sunday)),
      label: "This week",
    };
  }

  const days = key === "last_4" ? 27 : 83; // inclusive window length - 1
  const start = new Date(end);
  start.setDate(end.getDate() - days);
  return {
    startYmd: toYmd(startOfLocalDay(start)),
    endYmd,
    label: key === "last_4" ? "Last 4 weeks" : "Last 12 weeks",
  };
}

export function ymdInRange(ymd: string, startYmd: string, endYmd: string): boolean {
  return ymd >= startYmd && ymd <= endYmd;
}

export function eachWeekStarts(startYmd: string, endYmd: string): string[] {
  const start = startOfLocalDay(parseYmd(startYmd));
  const end = startOfLocalDay(parseYmd(endYmd));
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const cursor = new Date(start);
  cursor.setDate(start.getDate() + mondayOffset);
  const weeks: string[] = [];
  while (cursor.getTime() <= end.getTime()) {
    weeks.push(toYmd(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

export function addDaysYmd(ymd: string, days: number): string {
  const d = startOfLocalDay(parseYmd(ymd));
  d.setDate(d.getDate() + days);
  return toYmd(d);
}
