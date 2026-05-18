import type { StationWeakness } from "./types";

export type StationWeaknessRule = {
  weakness: StationWeakness;
  programmingActions: string[];
  sessionTags: string[];
  earlyBlockFocus: string;
  lateBlockFocus: string;
  addOnExample?: string;
};

export const STATION_WEAKNESS_RULES: StationWeaknessRule[] = [
  {
    weakness: "wall_balls",
    programmingActions: [
      "Add extra wall ball volume — often 10 min WB EMOM add-ons on suitable days",
      "Progress to wall balls under fatigue closer to race day",
      "Pair with compromised run builders in weeks 3–4 of block",
    ],
    sessionTags: ["wall_ball", "compromised"],
    earlyBlockFocus: "Technique + EMOM density, submax sets",
    lateBlockFocus: "WB → run rounds at race load",
    addOnExample: "10 min × 12–18 reps EMOM after aerobic day",
  },
  {
    weakness: "sled",
    programmingActions: [
      "Add extra sled volume across the week where equipment allows",
      "Integrate sled-specific work into leg strength sessions",
      "Keep frequent sled exposure — technique before load jumps",
    ],
    sessionTags: ["sled", "lower", "strength"],
    earlyBlockFocus: "Body position, light-moderate load repeats",
    lateBlockFocus: "Race load in compromised sessions",
    addOnExample: "4–6×50m push/pull in lower strength day",
  },
  {
    weakness: "sled_push_pull",
    programmingActions: [
      "Add extra sled volume across the week where equipment allows",
      "Integrate sled-specific work into leg strength sessions",
      "Keep frequent sled exposure — technique before load jumps",
    ],
    sessionTags: ["sled", "lower", "strength"],
    earlyBlockFocus: "Body position, light-moderate load repeats",
    lateBlockFocus: "Race load in compromised sessions",
    addOnExample: "4–6×50m push/pull in lower strength day",
  },
  {
    weakness: "burpees",
    programmingActions: [
      "Add burpee rhythm/volume work — not max fatigue early",
      "Progress to burpees under fatigue in compromised builders",
    ],
    sessionTags: ["burpee", "compromised"],
    earlyBlockFocus: "Controlled rhythm, small sets",
    lateBlockFocus: "Burpee broad jump into run",
  },
  {
    weakness: "lunges",
    programmingActions: [
      "Sandbag lunge benchmarks and run+lunge compromised builders",
      "Single-leg durability support in strength",
    ],
    sessionTags: ["lunges", "sandbag", "single_leg"],
    earlyBlockFocus: "Lunge pattern strength, moderate bag",
    lateBlockFocus: "100m lunge → 800m run repeats",
  },
  {
    weakness: "ski",
    programmingActions: ["SkiErg threshold 8×4", "Ski in mixed aerobic sessions"],
    sessionTags: ["ski", "threshold"],
    earlyBlockFocus: "Aerobic ski volume + technique",
    lateBlockFocus: "Ski at race pace into run",
  },
  {
    weakness: "row",
    programmingActions: ["RowErg threshold 8×4", "Row in compromised mini test"],
    sessionTags: ["row", "threshold"],
    earlyBlockFocus: "Row aerobic + threshold",
    lateBlockFocus: "Race-pace row into run",
  },
  {
    weakness: "farmers_carry",
    programmingActions: ["Grip + carry strength", "Farmer benchmark tracking"],
    sessionTags: ["carry", "grip", "farmer"],
    earlyBlockFocus: "Grip endurance, race distance practice",
    lateBlockFocus: "Heavy carries under fatigue",
  },
  {
    weakness: "running_under_fatigue",
    programmingActions: [
      "Prioritise compromised builders and race-pace repeats",
      "Maintain easy run frequency — don't drop aerobic base",
    ],
    sessionTags: ["compromised", "race_pace", "run"],
    earlyBlockFocus: "Short station → run",
    lateBlockFocus: "Full density compromised sessions",
  },
];

/**
 * If multiple weaknesses and limited time, rotate focus across 4-week block.
 * Week 1–2: primary weakness; Week 3: secondary; Week 4: deload + maintain.
 */
export function rotateStationFocusForBlock(
  weaknesses: StationWeakness[],
  blockWeek: 1 | 2 | 3 | 4
): StationWeakness[] {
  if (weaknesses.length <= 1) return weaknesses;
  const primary = weaknesses[0]!;
  const secondary = weaknesses[1];
  if (blockWeek === 4) return [primary];
  if (blockWeek <= 2) return [primary];
  return secondary ? [secondary, primary] : [primary];
}

export function getStationWeaknessRules(
  weaknesses: StationWeakness[]
): StationWeaknessRule[] {
  return STATION_WEAKNESS_RULES.filter((r) => weaknesses.includes(r.weakness));
}
