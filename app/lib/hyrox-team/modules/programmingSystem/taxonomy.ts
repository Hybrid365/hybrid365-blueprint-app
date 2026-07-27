/**
 * HYROX Team Programming System — pillar / subcategory taxonomy.
 * Descriptive only; coaches filter via LibraryCategory + subcategory strings.
 */

export const PROGRAMMING_PILLAR_TAXONOMY = {
  running_development: {
    label: "Running Development",
    families: [
      "Easy Aerobic",
      "Long Aerobic",
      "Threshold LT1",
      "Threshold LT2",
      "VO2",
      "Race Pace",
      "Compromised Running",
    ],
  },
  hyrox_volume_builders: {
    label: "HYROX Volume Builders",
    purpose:
      "Movement efficiency, local muscular endurance and station repeatability — not maximal conditioning or race simulation.",
    families: [
      "Sled Builders",
      "Wall Ball Builders",
      "Burpee Builders",
      "Lunge Builders",
      "Carry Builders",
      "Mixed Station Builders",
      "Erg Flow Builders",
    ],
  },
  strength_endurance: {
    label: "Strength Endurance",
    families: [
      "Quad Endurance",
      "Posterior Chain",
      "Grip",
      "Upper Push",
      "Upper Pull",
      "Single Leg Durability",
    ],
  },
  hybrid_engine: {
    label: "Hybrid Engine",
    families: ["Bike", "Row", "Ski", "Mixed Ergs", "Threshold", "Continuous", "Recovery"],
  },
} as const;
