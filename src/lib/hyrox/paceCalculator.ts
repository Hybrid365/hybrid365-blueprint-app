/**
 * Training pace zones from 5km / 10km benchmarks.
 * Coaching estimates — refine with real-world calibration and athlete feedback.
 */

import type { HyroxAbilityLevel, PaceZoneKey, PaceZones } from "./types";

const GUIDANCE_NOTE =
  "Coaching estimates from benchmark times. Adjust for terrain, heat, fatigue and RPE. If threshold pace pushes HR above threshold when fatigued, slow down — intensity beats forced pace.";

/** Parse "MM:SS" or "M:SS" or seconds number to total seconds. */
export function parseTimeToSeconds(timeString: string | number): number | null {
  if (typeof timeString === "number") {
    return Number.isFinite(timeString) && timeString > 0 ? timeString : null;
  }
  const trimmed = timeString.trim();
  if (!trimmed) return null;

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const n = Number(trimmed);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const parts = trimmed.split(":").map((p) => p.trim());
  if (parts.length === 2) {
    const m = Number(parts[0]);
    const s = Number(parts[1]);
    if (!Number.isFinite(m) || !Number.isFinite(s) || m < 0 || s < 0 || s >= 60) return null;
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    const s = Number(parts[2]);
    if (![h, m, s].every(Number.isFinite) || s >= 60 || m >= 60) return null;
    return h * 3600 + m * 60 + s;
  }
  return null;
}

function roundPaceSecToNearest5(secPerKm: number): number {
  return Math.round(secPerKm / 5) * 5;
}

/** Format seconds per km as min/km pace string (e.g. "4:35/km"). */
export function formatSecondsToPace(secondsPerKm: number): string {
  const clamped = Math.max(60, roundPaceSecToNearest5(secondsPerKm));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s.toString().padStart(2, "0")}/km`;
}

function zoneRange(baseSecPerKm: number, pctLow: number, pctHigh: number): string {
  const a = baseSecPerKm * pctLow;
  const b = baseSecPerKm * pctHigh;
  const faster = Math.min(a, b);
  const slower = Math.max(a, b);
  return `${formatSecondsToPace(faster).replace("/km", "")}–${formatSecondsToPace(slower)}`;
}

function buildZonesFromPacePerKm(baseSecPerKm: number, source: "5k" | "10k"): PaceZones & { source: string; note: string } {
  return {
    source: source === "5k" ? "5km_benchmark" : "10km_benchmark",
    note: GUIDANCE_NOTE,
    easy: zoneRange(baseSecPerKm, 1.22, 1.38),
    steady: zoneRange(baseSecPerKm, 1.1, 1.2),
    threshold: zoneRange(baseSecPerKm, 1.02, 1.08),
    tenK: zoneRange(baseSecPerKm, 1.04, 1.1),
    fiveK: formatSecondsToPace(baseSecPerKm),
    intervalVo2: zoneRange(baseSecPerKm, 0.96, 1.02),
    hyroxRaceRun: zoneRange(baseSecPerKm, 1.06, 1.12),
  };
}

/**
 * Zones from 5km total time (seconds).
 * Base pace = total / 5 km.
 */
/**
 * Estimate 10km total time from 5km when no 10k benchmark exists.
 * Uses ~2.1× 5k duration heuristic (slightly sub-linear) — refine with field data.
 */
export function estimate10kSecondsFrom5k(fiveKmTime: string | number): number | null {
  const fiveSec = parseTimeToSeconds(fiveKmTime);
  if (fiveSec == null) return null;
  return Math.round(fiveSec * 2.1);
}

/** Estimate 10km pace (/km) from 5km when only 5k is available. */
export function estimate10kPaceFrom5k(fiveKmTime: string | number): string | null {
  const tenSec = estimate10kSecondsFrom5k(fiveKmTime);
  if (tenSec == null) return null;
  return formatSecondsToPace(tenSec / 10);
}

export function calculatePaceZonesFrom5k(fiveKmTime: string | number): (PaceZones & { source: string; note: string }) | null {
  const totalSec = parseTimeToSeconds(fiveKmTime);
  if (totalSec == null || totalSec < 12 * 60 || totalSec > 60 * 60) return null;
  const secPerKm = totalSec / 5;
  return buildZonesFromPacePerKm(secPerKm, "5k");
}

/**
 * Zones from 10km total time (seconds).
 * Base pace = total / 10 km (used for steady/threshold anchors).
 */
export function calculatePaceZonesFrom10k(tenKmTime: string | number): (PaceZones & { source: string; note: string }) | null {
  const totalSec = parseTimeToSeconds(tenKmTime);
  if (totalSec == null || totalSec < 28 * 60 || totalSec > 120 * 60) return null;
  const secPerKm = totalSec / 10;
  return buildZonesFromPacePerKm(secPerKm, "10k");
}

/**
 * Estimated average Hyrox race run pace from 5km fitness + level.
 * Hyrox running is slower than 5k pace due to fatigue — multiplier by level.
 */
export function calculateHyroxRunPaceEstimate(
  fiveKmTime: string | number,
  athleteLevel: HyroxAbilityLevel = "intermediate"
): string | null {
  const totalSec = parseTimeToSeconds(fiveKmTime);
  if (totalSec == null) return null;
  const fiveKPaceSec = totalSec / 5;

  const multipliers: Record<HyroxAbilityLevel, number> = {
    beginner: 1.14,
    intermediate: 1.1,
    advanced: 1.08,
    pro: 1.06,
  };

  const racePaceSec = fiveKPaceSec * multipliers[athleteLevel];
  return formatSecondsToPace(racePaceSec);
}

/** Merge 5k and 10k zones — prefer 5k for interval/5k, 10k for steady/threshold if both provided. */
export function calculatePaceZones(
  fiveKmTime?: string | number | null,
  tenKmTime?: string | number | null
): (PaceZones & { source: string; note: string; hyroxRaceRunEstimate?: string }) | null {
  const z5 = fiveKmTime != null ? calculatePaceZonesFrom5k(fiveKmTime) : null;
  let z10 = tenKmTime != null ? calculatePaceZonesFrom10k(tenKmTime) : null;
  if (!z10 && fiveKmTime != null) {
    const estimated10k = estimate10kSecondsFrom5k(fiveKmTime);
    if (estimated10k != null) z10 = calculatePaceZonesFrom10k(estimated10k);
  }
  if (!z5 && !z10) return null;

  const base = z5 ?? z10!;
  const level: HyroxAbilityLevel = "intermediate";
  const hyroxEstimate =
    fiveKmTime != null ? calculateHyroxRunPaceEstimate(fiveKmTime, level) : undefined;

  if (z5 && z10) {
    return {
      ...z5,
      source: "5k_and_10k",
      steady: z10.steady,
      threshold: z10.threshold,
      tenK: z10.tenK,
      hyroxRaceRunEstimate: hyroxEstimate ?? z5.hyroxRaceRun,
    };
  }

  return { ...base, hyroxRaceRunEstimate: hyroxEstimate ?? undefined };
}

export function getZonePace(
  zones: PaceZones,
  key: PaceZoneKey
): string {
  return zones[key];
}
