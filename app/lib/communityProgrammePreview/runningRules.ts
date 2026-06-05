import type { HyroxStationWeakness } from "@/app/lib/communityHyroxAssessment";
import type { CommunityPreviewInput, PreviewAbilityLevel } from "./types";

const RUNNING_WEAKNESS_VALUES: HyroxStationWeakness[] = ["running_between_stations"];

export function hasRunningWeakness(input: CommunityPreviewInput): boolean {
  if (input.emphasise_running_support) return true;
  if (input.station_weaknesses.some((w) => RUNNING_WEAKNESS_VALUES.includes(w))) {
    return true;
  }
  if (input.running_confidence != null && input.running_confidence <= 5) {
    return true;
  }
  if (input.compromised_running_confidence != null && input.compromised_running_confidence <= 5) {
    return true;
  }
  return false;
}

export function tempoRunWindow(level: PreviewAbilityLevel): { range: string; rpe: string; midMinutes: number } {
  switch (level) {
    case "beginner":
      return { range: "20–30 min", rpe: "4–5", midMinutes: 25 };
    case "intermediate":
      return { range: "30–40 min", rpe: "5–6", midMinutes: 35 };
    case "advanced":
      return { range: "35–50 min", rpe: "5–6", midMinutes: 42 };
  }
}

export function z2Window(
  level: PreviewAbilityLevel,
  kind: "bike" | "ski_row" | "mixed" | "mobility"
): { range: string; midMinutes: number; title: string } {
  if (kind === "mobility") {
    return { range: "10–20 min", midMinutes: 15, title: "Optional mobility" };
  }
  if (kind === "ski_row") {
    const range =
      level === "beginner" ? "20–40 min" : level === "intermediate" ? "20–45 min" : "20–45 min";
    return {
      range,
      midMinutes: level === "beginner" ? 30 : 32,
      title: "Optional easy SkiErg/RowErg",
    };
  }
  if (kind === "mixed") {
    const range =
      level === "beginner" ? "20–40 min" : level === "intermediate" ? "30–60 min" : "45–75 min";
    return { range, midMinutes: level === "beginner" ? 30 : level === "intermediate" ? 45 : 60, title: "Optional mixed aerobic flow" };
  }
  const range =
    level === "beginner" ? "20–40 min" : level === "intermediate" ? "30–60 min" : "45–75 min";
  return {
    range,
    midMinutes: level === "beginner" ? 30 : level === "intermediate" ? 45 : 60,
    title: "Optional Z1/Z2 bike",
  };
}

export const Z2_SKIP_WHEN =
  "Skip if soreness, poor sleep or fatigue is high.";

export function hasBikeWallBallEquipment(input: CommunityPreviewInput): boolean {
  const eq = input.hyrox_equipment;
  const hasBike =
    eq.includes("assault_bike") || eq.includes("rowerg") || eq.includes("skierg");
  const hasWallBall = eq.includes("wall_balls");
  return hasBike && hasWallBall;
}

export function shouldIncludeTuesdayBikeWallBall(input: CommunityPreviewInput): {
  include: boolean;
  asRequiredDouble: boolean;
  asOptional: boolean;
} {
  if (input.ability_level === "beginner") {
    return { include: false, asRequiredDouble: false, asOptional: false };
  }
  if (!hasBikeWallBallEquipment(input)) {
    return { include: false, asRequiredDouble: false, asOptional: false };
  }
  if (input.ability_level === "advanced" && input.double_session_availability) {
    return { include: true, asRequiredDouble: true, asOptional: false };
  }
  if (input.ability_level === "intermediate") {
    return {
      include: true,
      asRequiredDouble: false,
      asOptional: true,
    };
  }
  if (input.ability_level === "advanced") {
    return { include: true, asRequiredDouble: false, asOptional: true };
  }
  return { include: false, asRequiredDouble: false, asOptional: false };
}
