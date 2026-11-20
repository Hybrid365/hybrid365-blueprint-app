import { TRACK_FOUNDATION_AS_OF } from "@/app/lib/track-foundation/dates";

/** Athlete-facing calendar. Production Track never reads a fixture clock. */
export const TRACK_PRODUCTION_TIME_ZONE = "Europe/London";

const FIXTURE_CLOCKS = new Set([TRACK_FOUNDATION_AS_OF, "2026-11-13", "2026-11-19"]);

export function productionCalendarDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TRACK_PRODUCTION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) throw new Error("Production Track clock could not be read.");
  return `${year}-${month}-${day}`;
}

/**
 * Production uses the real London calendar date.
 * Intake and fixture clocks stay available for QA, dev preview, and staging.
 */
export function resolveTrackClock(args: {
  production: boolean;
  intakeClock?: string | null;
  fixtureClock?: string | null;
  now?: Date;
}): string {
  if (args.production) return productionCalendarDate(args.now ?? new Date());
  const fixture = (args.intakeClock ?? args.fixtureClock ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fixture)) throw new Error("A non-production Track clock needs a fixture date.");
  return fixture;
}

export function productionClockLeakedFixture(resolved: string, now: Date = new Date()): boolean {
  const today = productionCalendarDate(now);
  return resolved !== today && FIXTURE_CLOCKS.has(resolved);
}
