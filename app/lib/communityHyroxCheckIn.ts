import { HYROX_STATION_WEAKNESS_OPTIONS, type HyroxStationWeakness } from "@/app/lib/communityHyroxAssessment";

export type CommunityHyroxCheckInDetails = {
  compromised_running_feel: number | null;
  weakest_station: HyroxStationWeakness | null;
  legs_recovery: string | null;
  running_after_stations_confidence: number | null;
  wall_ball_grip_lower_body_notes: string | null;
  race_confidence: number | null;
};

export function emptyHyroxCheckInDetails(): CommunityHyroxCheckInDetails {
  return {
    compromised_running_feel: null,
    weakest_station: null,
    legs_recovery: null,
    running_after_stations_confidence: null,
    wall_ball_grip_lower_body_notes: null,
    race_confidence: null,
  };
}

const WEAKNESS_VALUES = HYROX_STATION_WEAKNESS_OPTIONS.map((o) => o.value);

function toScoreOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 10) return null;
  return rounded;
}

function trimOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}

export function parseHyroxCheckInDetails(raw: unknown): CommunityHyroxCheckInDetails {
  const base = emptyHyroxCheckInDetails();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;
  const weakest =
    typeof o.weakest_station === "string" &&
    (WEAKNESS_VALUES as readonly string[]).includes(o.weakest_station)
      ? (o.weakest_station as HyroxStationWeakness)
      : null;

  return {
    compromised_running_feel: toScoreOrNull(o.compromised_running_feel),
    weakest_station: weakest,
    legs_recovery: trimOrNull(o.legs_recovery),
    running_after_stations_confidence: toScoreOrNull(o.running_after_stations_confidence),
    wall_ball_grip_lower_body_notes: trimOrNull(o.wall_ball_grip_lower_body_notes),
    race_confidence: toScoreOrNull(o.race_confidence),
  };
}

export function serializeHyroxCheckInDetails(
  details: CommunityHyroxCheckInDetails
): Record<string, unknown> {
  return {
    compromised_running_feel: details.compromised_running_feel,
    weakest_station: details.weakest_station,
    legs_recovery: details.legs_recovery,
    running_after_stations_confidence: details.running_after_stations_confidence,
    wall_ball_grip_lower_body_notes: details.wall_ball_grip_lower_body_notes,
    race_confidence: details.race_confidence,
  };
}

export function validateHyroxCheckInDetails(details: CommunityHyroxCheckInDetails): string | null {
  for (const [label, value] of [
    ["Compromised running feel", details.compromised_running_feel],
    ["Running after stations confidence", details.running_after_stations_confidence],
    ["HYROX race confidence", details.race_confidence],
  ] as const) {
    if (value != null && (value < 1 || value > 10)) {
      return `${label} must be between 1 and 10.`;
    }
  }
  return null;
}
