/**
 * Pace zones derived from a recent 5km race/effort time (% of 5km pace per km).
 * Percentages apply to time-per-km (higher % = slower pace).
 */

export type PaceGuidance = {
  source: "submitted_5k";
  units: "min/km";
  five_k_pace: string;
  zones: {
    easy: string;
    steady: string;
    tempo: string;
    threshold: string;
    interval: string;
    /** Hyrox-style race running between stations (when 5km anchor exists). */
    hyrox_race?: string;
  };
  note: string;
};

/** Plausible submitted 5km range for pace guidance (12:00–60:00). */
const MIN_FIVEK_TOTAL_SEC = 12 * 60;
const MAX_FIVEK_TOTAL_SEC = 60 * 60;

const GUIDANCE_NOTE =
  "Use these as guidance, not strict rules. Effort, terrain, fatigue and conditions still matter.";

function roundPaceSecToNearest5(secPerKm: number): number {
  return Math.round(secPerKm / 5) * 5;
}

function formatMinKm(secPerKmRounded: number): string {
  const clamped = Math.max(60, secPerKmRounded);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatPacePerKm(secPerKm: number): string {
  return `${formatMinKm(roundPaceSecToNearest5(secPerKm))}/km`;
}

/**
 * Zone bounds as multipliers on 5km pace (sec/km). Returns "faster–slower/km"
 * (smaller time first), each rounded to nearest 5s.
 */
function zoneRangeSecPerKm(baseSecPerKm: number, pctLow: number, pctHigh: number): string {
  const a = baseSecPerKm * pctLow;
  const b = baseSecPerKm * pctHigh;
  const fasterSec = roundPaceSecToNearest5(Math.min(a, b));
  const slowerSec = roundPaceSecToNearest5(Math.max(a, b));
  return `${formatMinKm(fasterSec)}–${formatMinKm(slowerSec)}/km`;
}

export function computePaceGuidanceFromFiveKSeconds(seconds: number): PaceGuidance | null {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  if (seconds < MIN_FIVEK_TOTAL_SEC || seconds > MAX_FIVEK_TOTAL_SEC) return null;

  const baseSecPerKm = seconds / 5;

  return {
    source: "submitted_5k",
    units: "min/km",
    five_k_pace: formatPacePerKm(baseSecPerKm),
    zones: {
      /** Conservative easy band — effort matters more than hitting the top of the range. */
      easy: zoneRangeSecPerKm(baseSecPerKm, 1.32, 1.55),
      steady: zoneRangeSecPerKm(baseSecPerKm, 1.12, 1.22),
      tempo: zoneRangeSecPerKm(baseSecPerKm, 1.06, 1.12),
      threshold: zoneRangeSecPerKm(baseSecPerKm, 1.02, 1.08),
      interval: zoneRangeSecPerKm(baseSecPerKm, 0.97, 1.02),
      hyrox_race: zoneRangeSecPerKm(baseSecPerKm, 1.06, 1.12),
    },
    note: GUIDANCE_NOTE,
  };
}

/**
 * Short run-only coaching line for plan JSON (non-library, additive).
 * `sessionType` is SessionTemplate.type from the session library.
 */
/** Parse "M:SS–M:SS/km" (or hyphen) into sec/km bounds (faster = lower seconds). */
export function parsePaceRangeToSecBounds(
  paceRange: string
): { fastSec: number; slowSec: number } | null {
  const m = paceRange.trim().match(/(\d+):(\d{2})\s*[–-]\s*(\d+):(\d{2})\s*\/\s*km/i);
  if (!m) return null;
  const a = Number(m[1]) * 60 + Number(m[2]);
  const b = Number(m[3]) * 60 + Number(m[4]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < 60 || b < 60) return null;
  return { fastSec: Math.min(a, b), slowSec: Math.max(a, b) };
}

/** Convert pace (sec/km) to treadmill speed (km/h), rounded to 0.1. */
export function paceSecPerKmToTreadmillKmh(secPerKm: number): number {
  if (!Number.isFinite(secPerKm) || secPerKm <= 0) return 0;
  return Math.round((3600 / secPerKm) * 10) / 10;
}

/** Display treadmill range from a pace range string, e.g. "12.0–12.6 km/h". */
export function treadmillSpeedRangeFromPaceRange(paceRange: string | null | undefined): string | null {
  if (!paceRange?.trim()) return null;
  const bounds = parsePaceRangeToSecBounds(paceRange);
  if (!bounds) return null;
  const fastKmh = paceSecPerKmToTreadmillKmh(bounds.fastSec);
  const slowKmh = paceSecPerKmToTreadmillKmh(bounds.slowSec);
  const low = Math.min(fastKmh, slowKmh);
  const high = Math.max(fastKmh, slowKmh);
  return `${low.toFixed(1)}–${high.toFixed(1)} km/h`;
}

export function runSessionPaceNote(sessionType: string, g: PaceGuidance): string | null {
  switch (sessionType) {
    case "aerobic_run":
      return `Pace guide: based on your submitted 5km, easy aerobic work sits around ${g.zones.easy}. Use RPE and control first.`;
    case "long_run":
      return `Pace guide: based on your submitted 5km, keep this long run genuinely easy (${g.zones.easy}). Conversational effort — if tired, run slower than the range.`;
    case "tempo_run":
      return `Pace guide: based on your submitted 5km, this session should sit around your tempo range of ${g.zones.tempo}. Use RPE and control first.`;
    case "threshold_run":
      return `Pace guide: based on your submitted 5km, this session should sit around your threshold range of ${g.zones.threshold}. Use RPE and control first.`;
    case "interval_run":
      return `Pace guide: based on your submitted 5km, quality reps sit around your interval / 5km-work range of ${g.zones.interval}. Use RPE and control first.`;
    default:
      return `Pace guide: based on your submitted 5km (anchor ${g.five_k_pace}), scale effort by feel between easy and threshold. Use RPE and control first.`;
  }
}
