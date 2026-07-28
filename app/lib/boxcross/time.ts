/**
 * BoxCross Ski Challenge — time parse/format (supports tenths).
 */

/** Parse "M:SS", "MM:SS", "M:SS.t", "MM:SS.t", "H:MM:SS", or raw ms → milliseconds. */
export function parseSkiTimeToMs(input: string | number): number | null {
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input <= 0) return null;
    return Math.round(input);
  }

  const raw = input.trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    const asInt = Number(raw);
    // Treat bare integers under 100000 as milliseconds only if explicitly long;
    // prefer interpreting as whole seconds when small (e.g. "222").
    if (asInt > 0 && asInt < 1000) return asInt * 1000;
    if (asInt >= 1000) return asInt;
    return null;
  }

  const match = raw.match(/^(\d+):([0-5]?\d)(?:\.(\d{1,3}))?$/);
  if (!match) return null;

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const frac = match[3] ?? "0";
  // Pad/truncate fractional to milliseconds
  const msPart = Number((frac + "000").slice(0, 3));
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;

  return minutes * 60_000 + seconds * 1000 + msPart;
}

/** Format milliseconds as M:SS.t (e.g. 3:42.6). Tenths always shown. */
export function formatSkiTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const totalTenths = Math.round(ms / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

export function normalizeAthleteKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
