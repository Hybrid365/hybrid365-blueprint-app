/** HYROX-specific free-week lead magnet input (not Hyrox Team 1-1). */

export type HyroxFreeWeekAbility = "beginner" | "intermediate" | "advanced";

export type HyroxFreeWeekLimiter =
  | "running"
  | "stations"
  | "strength"
  | "engine"
  | "body_composition"
  | "recovery"
  | "consistency"
  | "not_sure";

export type HyroxStationWeakness =
  | "wall_balls"
  | "sled_push"
  | "sled_pull"
  | "burpee_broad_jump"
  | "sandbag_lunges"
  | "farmers_carry"
  | "skierg"
  | "rowerg"
  | "running_between_stations";

export type HyroxFreeWeekInput = {
  days_per_week: number;
  weekly_hours_band: string;
  ability_level: HyroxFreeWeekAbility;
  equipment: string[];
  preferred_days?: string[];
  double_sessions?: boolean;
  five_k_time?: string;
  ten_k_time?: string;
  notes?: string;
  /** Race */
  race_booked?: boolean;
  race_date?: string;
  race_category?: string;
  race_pb?: string;
  race_target_time?: string;
  race_goal?: string;
  /** Running */
  weekly_run_volume_km?: string;
  easy_run_pace?: string;
  longest_recent_run?: string;
  hyrox_race_run_pace?: string;
  max_hr?: number | null;
  threshold_hr?: number | null;
  uses_hr_monitor?: boolean;
  running_limiter?: string;
  /** Stations */
  strongest_stations?: string[];
  weakest_stations?: HyroxStationWeakness[];
  station_improve_most?: string;
  wall_ball_rating?: number | null;
  sled_push_rating?: number | null;
  sled_pull_rating?: number | null;
  burpee_rating?: number | null;
  lunge_rating?: number | null;
  grip_rating?: number | null;
  ski_rating?: number | null;
  row_rating?: number | null;
  /** Erg benchmarks (optional) */
  ski_1k_time?: string;
  row_1k_time?: string;
  ski_threshold_split?: string;
  row_threshold_split?: string;
  bike_threshold_watts?: string;
  /** Station load */
  wall_ball_weight?: string;
  wall_ball_unbroken?: number | null;
  sled_access?: boolean;
  farmers_weight?: string;
  sandbag_weight?: string;
  /** Recovery / body */
  injuries?: string;
  running_niggles?: string;
  sleep_quality?: number | null;
  stress_level?: number | null;
  recovery_confidence?: number | null;
  movements_to_avoid?: string;
  /** Goals */
  main_limiter?: HyroxFreeWeekLimiter;
  bodyweight_kg?: number | null;
  body_composition_goal?: string;
  main_goal?: string;
};

export const HYROX_STATION_OPTIONS: { value: HyroxStationWeakness; label: string }[] = [
  { value: "wall_balls", label: "Wall balls" },
  { value: "sled_push", label: "Sled push" },
  { value: "sled_pull", label: "Sled pull" },
  { value: "burpee_broad_jump", label: "Burpee broad jump" },
  { value: "sandbag_lunges", label: "Sandbag lunges" },
  { value: "farmers_carry", label: "Farmers carry / grip" },
  { value: "skierg", label: "SkiErg" },
  { value: "rowerg", label: "RowErg" },
  { value: "running_between_stations", label: "Running between stations" },
];

export const HYROX_EQUIPMENT_OPTIONS = [
  "Full gym",
  "Commercial gym",
  "Home gym",
  "Treadmill",
  "Track / outdoor running",
  "SkiErg",
  "RowErg",
  "Bike / Assault bike",
  "Sled push/pull",
  "Wall balls",
  "Farmers handles / DBs",
  "Sandbag",
  "Pull-up bar",
  "Dumbbells only",
] as const;

export function emptyHyroxFreeWeekInput(): HyroxFreeWeekInput {
  return {
    days_per_week: 5,
    weekly_hours_band: "5-7",
    ability_level: "intermediate",
    equipment: ["Full gym"],
    race_booked: false,
    weakest_stations: [],
    strongest_stations: [],
    main_limiter: "not_sure",
    sled_access: true,
  };
}
