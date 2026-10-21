/** Shared time, pace and split maths for HYROX benchmarks. Display formatting lives here too. */

const CLOCK_MM_SS = /^(\d+):([0-5]?\d(?:\.\d+)?)$/;
const CLOCK_H_MM_SS = /^(\d+):([0-5]?\d):([0-5]?\d(?:\.\d+)?)$/;

export const RUN_5K_KM = 5;
export const RUN_10K_KM = 10;
export const RUN_30_MIN_SECONDS = 1800;
export const ERG_2K_METRES = 2000;
export const ERG_1K_METRES = 1000;
export const ERG_SPLIT_METRES = 500;

export class BenchmarkMathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BenchmarkMathError";
  }
}

function assertFinitePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new BenchmarkMathError(`${label} must be greater than zero.`);
  }
  return value;
}

/** Parse `m:ss`, `mm:ss.s` or `h:mm:ss` into seconds. Rejects zero and malformed input. */
export function parseClockToSeconds(raw: string): number {
  const value = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!value || value.startsWith("-")) {
    throw new BenchmarkMathError("Enter a time like 17:42 or 1:04:14.");
  }

  const hms = CLOCK_H_MM_SS.exec(value);
  if (hms) {
    const hours = Number(hms[1]);
    const minutes = Number(hms[2]);
    const seconds = Number(hms[3]);
    if (minutes >= 60 || seconds >= 60) {
      throw new BenchmarkMathError("Minutes and seconds must be under 60.");
    }
    return assertFinitePositive(hours * 3600 + minutes * 60 + seconds, "Time");
  }

  const ms = CLOCK_MM_SS.exec(value);
  if (ms) {
    const minutes = Number(ms[1]);
    const seconds = Number(ms[2]);
    if (seconds >= 60) {
      throw new BenchmarkMathError("Seconds must be under 60.");
    }
    return assertFinitePositive(minutes * 60 + seconds, "Time");
  }

  throw new BenchmarkMathError("Enter a time like 17:42 or 1:04:14.");
}

/** Accept `3:40`, `3:40/km` or `1:49.5/500m`. */
export function parsePaceToSeconds(raw: string): number {
  const stripped = raw
    .trim()
    .toLowerCase()
    .replace(/\/\s*km$/i, "")
    .replace(/\/\s*500\s*m$/i, "")
    .trim();
  return parseClockToSeconds(stripped);
}

export function parsePositiveNumber(raw: string, label: string): number {
  const value = Number(String(raw).trim().replace(/w$/i, ""));
  return assertFinitePositive(value, label);
}

export function runPaceSecondsPerKm(totalSeconds: number, distanceKm: number): number {
  return assertFinitePositive(totalSeconds, "Time") / assertFinitePositive(distanceKm, "Distance");
}

export function paceFromThirtyMinuteTest(distanceKm: number): number {
  return RUN_30_MIN_SECONDS / assertFinitePositive(distanceKm, "Distance");
}

export function ergSplitSecondsPer500(totalSeconds: number, distanceMetres: number): number {
  const seconds = assertFinitePositive(totalSeconds, "Time");
  const distance = assertFinitePositive(distanceMetres, "Distance");
  return (seconds / distance) * ERG_SPLIT_METRES;
}

function padSeconds(seconds: number, decimals: number): string {
  const text = seconds.toFixed(decimals);
  const [whole, fraction] = text.split(".");
  const padded = whole.padStart(2, "0");
  return fraction ? `${padded}.${fraction}` : padded;
}

/** Format seconds as `m:ss`, `m:ss.s` or `h:mm:ss`. */
export function formatDuration(totalSeconds: number, options?: { decimals?: number; forceHours?: boolean }): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "—";
  const decimals = options?.decimals ?? 0;
  const factor = 10 ** decimals;
  const rounded = Math.round(totalSeconds * factor) / factor;
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded - hours * 3600) / 60);
  const seconds = rounded - hours * 3600 - minutes * 60;
  const secText = padSeconds(Number(seconds.toFixed(decimals)), decimals);
  if (hours > 0 || options?.forceHours) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${secText}`;
  }
  return `${minutes}:${secText}`;
}

export function formatPacePerKm(secondsPerKm: number): string {
  if (!Number.isFinite(secondsPerKm) || secondsPerKm <= 0) return "—";
  const decimals = Math.abs(secondsPerKm - Math.round(secondsPerKm)) < 0.05 ? 0 : 1;
  return `${formatDuration(secondsPerKm, { decimals })}/km`;
}

export function formatSplitPer500(secondsPer500: number): string {
  if (!Number.isFinite(secondsPer500) || secondsPer500 <= 0) return "—";
  return `${formatDuration(secondsPer500, { decimals: 1 })}/500m`;
}

export function formatWatts(watts: number): string {
  if (!Number.isFinite(watts) || watts <= 0) return "—";
  return `${Math.round(watts)} W`;
}
