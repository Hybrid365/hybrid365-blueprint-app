import {
  HYROX_CATEGORY_OPTIONS,
  HYROX_DIVISION_OPTIONS,
  HYROX_EQUIPMENT_OPTIONS,
  HYROX_STATION_WEAKNESS_OPTIONS,
  type CommunityHyroxDetails,
  type HyroxEquipmentAccess,
  type HyroxStationWeakness,
} from "@/app/lib/communityHyroxAssessment";

export const COMMUNITY_HYROX_POSITIONING =
  "Community HYROX Track = structured group HYROX programming and accountability. Premium HYROX Team is higher-touch coaching for athletes who want a dedicated race build.";

export const HYROX_ROLLOUT_COPY =
  "Your HYROX assessment data is now saved and will guide HYROX-specific programming as this track rolls out.";

const WEAKNESS_LABELS = Object.fromEntries(
  HYROX_STATION_WEAKNESS_OPTIONS.map((o) => [o.value, o.label])
) as Record<HyroxStationWeakness, string>;

const EQUIPMENT_LABELS = Object.fromEntries(
  HYROX_EQUIPMENT_OPTIONS.map((o) => [o.value, o.label])
) as Record<HyroxEquipmentAccess, string>;

const CATEGORY_LABELS = Object.fromEntries(
  HYROX_CATEGORY_OPTIONS.map((o) => [o.value, o.label])
);

const DIVISION_LABELS = Object.fromEntries(
  HYROX_DIVISION_OPTIONS.map((o) => [o.value, o.label])
);

export function stationWeaknessLabel(value: HyroxStationWeakness): string {
  return WEAKNESS_LABELS[value] ?? value;
}

export function hyroxEquipmentLabel(value: HyroxEquipmentAccess): string {
  return EQUIPMENT_LABELS[value] ?? value;
}

export function hyroxCategoryLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return CATEGORY_LABELS[value as keyof typeof CATEGORY_LABELS] ?? value;
}

export function hyroxDivisionLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return DIVISION_LABELS[value as keyof typeof DIVISION_LABELS] ?? value;
}

export type HyroxRaceCountdown = {
  daysRemaining: number;
  label: string;
  isPast: boolean;
};

export function getHyroxRaceCountdown(raceDate: string | null | undefined): HyroxRaceCountdown | null {
  if (!raceDate || !/^\d{4}-\d{2}-\d{2}$/.test(raceDate)) return null;
  const target = new Date(`${raceDate}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  const daysRemaining = Math.ceil(ms / 86_400_000);
  if (daysRemaining < 0) {
    return {
      daysRemaining,
      label: `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? "" : "s"} since race`,
      isPast: true,
    };
  }
  if (daysRemaining === 0) {
    return { daysRemaining: 0, label: "Race day", isPast: false };
  }
  return {
    daysRemaining,
    label: `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} to race`,
    isPast: false,
  };
}

export function hasLimitedHyroxEquipment(details: CommunityHyroxDetails): boolean {
  if (!details.equipment.length) return true;
  if (details.equipment.includes("no_hyrox_equipment")) return true;
  if (details.equipment.length === 1 && details.equipment.includes("dumbbells_only")) return true;
  const hyroxSpecific: HyroxEquipmentAccess[] = [
    "skierg",
    "rowerg",
    "sled",
    "wall_balls",
    "sandbag",
    "farmers_carry",
  ];
  const hasHyroxKit = details.equipment.some((e) => hyroxSpecific.includes(e));
  return !hasHyroxKit && !details.equipment.includes("full_gym");
}

export function deriveHyroxPriorityChips(details: CommunityHyroxDetails): string[] {
  const chips = new Set<string>(["Engine", "Threshold running"]);
  const w = details.station_weaknesses;

  if (w.some((x) => x === "compromised_running" || x === "running_between_stations")) {
    chips.add("Compromised running");
  }
  if (
    w.some((x) =>
      ["sled_push", "sled_pull", "wall_balls", "sandbag_lunges", "burpee_broad_jumps"].includes(x)
    )
  ) {
    chips.add("Strength endurance");
  }
  if (w.some((x) => x === "farmers_carry" || x === "wall_balls")) {
    chips.add("Grip / carries");
  }
  if (w.length > 0) {
    chips.add("Station weakness");
  }

  return Array.from(chips);
}

export function formatHyroxMetric(value: string | number | null | undefined, suffix = ""): string {
  if (value == null || value === "") return "Not logged yet";
  return `${value}${suffix}`;
}
