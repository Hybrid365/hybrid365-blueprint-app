/**
 * HYROX Team Programming System — progression family registry.
 * Coach library sessions reference these IDs via progressionFamily.
 */

import type { ProgrammingProgressionFamily } from "./types";

export const PROGRAMMING_PROGRESSION_FAMILIES: ProgrammingProgressionFamily[] = [
  // ——— HYROX Volume Builders ———
  {
    id: "sled_capacity_builder",
    name: "Sled Capacity Builder",
    pillar: "hyrox_volume_builders",
    stationFamily: "sled",
    description:
      "Progressive sled push/pull volume for local muscular endurance and station repeatability — not max load testing.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "wall_ball_density_builder",
    name: "Wall Ball Density Builder",
    pillar: "hyrox_volume_builders",
    stationFamily: "wall_ball",
    description: "Build unbroken sets and density under controlled fatigue without race simulation.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "burpee_economy_builder",
    name: "Burpee Economy Builder",
    pillar: "hyrox_volume_builders",
    stationFamily: "burpee",
    description: "Improve burpee rhythm, economy and density at sub-max effort.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "lunge_durability_builder",
    name: "Lunge Durability Builder",
    pillar: "hyrox_volume_builders",
    stationFamily: "lunge",
    description: "Single-leg durability and walking lunge capacity with controlled DOMS management.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "carry_capacity_builder",
    name: "Carry Capacity Builder",
    pillar: "hyrox_volume_builders",
    stationFamily: "carry",
    description: "Farmers / suitcase carry capacity and grip under aerobic demand.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "mixed_station_flow_builder",
    name: "Mixed Station Flow Builder",
    pillar: "hyrox_volume_builders",
    stationFamily: "mixed",
    description: "Multi-station flow for movement efficiency and transition practice at builder intensity.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "erg_flow_builder",
    name: "Erg Flow Builder",
    pillar: "hyrox_volume_builders",
    stationFamily: "erg",
    description: "Ski/Row/Bike continuous flow for aerobic station support without race pace.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "station_density_builder",
    name: "Station Density Builder",
    pillar: "hyrox_volume_builders",
    stationFamily: "mixed",
    description: "Higher density station work with short recoveries — still builder, not race sim.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "station_emom_builder",
    name: "Station EMOM Builder",
    pillar: "hyrox_volume_builders",
    stationFamily: "mixed",
    description: "Clock-driven station volume with predictable density and easy progressions.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "grip_station_builder",
    name: "Grip Station Builder",
    pillar: "hyrox_volume_builders",
    stationFamily: "grip",
    description: "Grip and carry support for farmers, sled pull and hanging durability.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },

  // ——— Running Development ———
  {
    id: "easy_aerobic_run",
    name: "Easy Aerobic Run",
    pillar: "running_development",
    description: "Conversational Z1–low Z2 aerobic volume.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "long_aerobic_run",
    name: "Long Aerobic Run",
    pillar: "running_development",
    description: "Long aerobic durability with controlled finishing effort.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "threshold_lt1",
    name: "Threshold LT1",
    pillar: "running_development",
    description: "Steady threshold / upper aerobic quality below hard LT2.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "threshold_lt2",
    name: "Threshold LT2",
    pillar: "running_development",
    description: "Classic threshold intervals for race engine.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "vo2_run",
    name: "VO2 Run",
    pillar: "running_development",
    description: "Short VO2 intervals — advanced athletes only as written.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "race_pace_run",
    name: "Race Pace Run",
    pillar: "running_development",
    description: "Controlled HYROX race-pace exposures.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "compromised_running",
    name: "Compromised Running",
    pillar: "running_development",
    description: "Station-to-run compromised exposures — separate from volume builders.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },

  // ——— Strength Endurance ———
  {
    id: "quad_endurance",
    name: "Quad Endurance",
    pillar: "strength_endurance",
    description: "Tempo / higher-rep quad endurance that supports stations without max strength DOMS.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "posterior_chain_endurance",
    name: "Posterior Chain Endurance",
    pillar: "strength_endurance",
    description: "Hamstring / glute / hinge endurance for sled and run support.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "grip_endurance",
    name: "Grip Endurance",
    pillar: "strength_endurance",
    description: "Dedicated grip endurance block.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "upper_push_endurance",
    name: "Upper Push Endurance",
    pillar: "strength_endurance",
    description: "Pressing endurance for wall balls and race posture.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "upper_pull_endurance",
    name: "Upper Pull Endurance",
    pillar: "strength_endurance",
    description: "Pulling endurance for sled pull and ski support.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "single_leg_durability",
    name: "Single Leg Durability",
    pillar: "strength_endurance",
    description: "Single-leg durability for lunges and run economy.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },

  // ——— Hybrid Engine ———
  {
    id: "bike_engine",
    name: "Bike Engine",
    pillar: "hybrid_engine",
    description: "Bike aerobic / threshold development with low run impact.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "row_engine",
    name: "Row Engine",
    pillar: "hybrid_engine",
    description: "RowErg continuous and interval engine work.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "ski_engine",
    name: "Ski Engine",
    pillar: "hybrid_engine",
    description: "SkiErg continuous and interval engine work.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
  {
    id: "mixed_erg_engine",
    name: "Mixed Erg Engine",
    pillar: "hybrid_engine",
    description: "Mixed Ski/Row/Bike aerobic engine sessions.",
    levels: ["level_1", "level_2", "level_3", "deload", "advanced"],
  },
];

export function getProgressionFamily(
  id: string | null | undefined
): ProgrammingProgressionFamily | null {
  if (!id) return null;
  return PROGRAMMING_PROGRESSION_FAMILIES.find((f) => f.id === id) ?? null;
}

export function listProgressionFamiliesByPillar(
  pillar: ProgrammingProgressionFamily["pillar"]
): ProgrammingProgressionFamily[] {
  return PROGRAMMING_PROGRESSION_FAMILIES.filter((f) => f.pillar === pillar);
}
