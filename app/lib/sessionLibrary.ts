// app/lib/sessionLibrary.ts

export type GoalFocus = "running" | "hybrid" | "muscle";
export type AbilityLevel = "beginner" | "intermediate" | "advanced";
export type WeeklyHoursBand = "2-3" | "3-5" | "5-7" | "7-10" | "10+";
export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type SessionBlock = {
  warm_up?: string[];
  main: string[];
  cool_down?: string[];
  finish?: string[];
  notes?: string[];
};

export type DayPlan = {
  day: DayKey;
  title: string;
  intent?: string;
  session: SessionBlock;
  time_cap_minutes?: number;
  tags?: string[];
};

export type PlanJson = {
  intensity_split: {
    easy_percent: number;
    hard_percent: number;
  };
  schedule: DayPlan[];
  cta: {
    headline: string;
    body: string;
    button_url: string;
  };
};

export type Template = {
  id: string;
  title: string;
  tags: string[];
  time_cap_minutes?: number;
  build: (ability: AbilityLevel, hours: WeeklyHoursBand) => SessionBlock;
};

function bikeAddon(hours: WeeklyHoursBand): string[] {
  if (hours === "10+") return ["Optional: 30–45 min Z2 bike"];
  if (hours === "7-10") return ["Optional: 25–30 min Z2 bike"];
  if (hours === "5-7") return ["Optional: 20 min Z2 bike"];
  return [];
}

function scaleRounds(base: number, ability: AbilityLevel): number {
  if (ability === "beginner") return Math.max(3, base - 2);
  if (ability === "intermediate") return Math.max(4, base - 1);
  return base;
}

export const LOWER_STRENGTH: Template[] = [
  {
    id: "LS-A",
    title: "Lower Strength (Squat Bias)",
    tags: ["lower", "strength", "hard"],
    time_cap_minutes: 80,
    build: (ability, hours) => ({
      warm_up: ["8 min easy bike", "Dynamic hips/ankles", "2–3 ramp sets", ...bikeAddon(hours)],
      main: [
        ability === "beginner"
          ? "Back Squat — 3×6 @ controlled load"
          : "Back Squat — 4×6–8 @ ~70%",
        "Reverse Lunges — 3×8–10 each side",
        "RDL — 3×8–12",
        "Back Extensions — 2×12–15",
      ],
      notes: ["Leave 1–2 reps in reserve.", "Control the lowering phase."],
    }),
  },
  {
    id: "LS-B",
    title: "Lower Strength (Hinge Bias)",
    tags: ["lower", "strength", "hard"],
    time_cap_minutes: 85,
    build: (ability, hours) => ({
      warm_up: ["5–8 min row", "Glute activation", ...bikeAddon(hours)],
      main: [
        ability === "beginner"
          ? "Trap Bar Deadlift — 3×5 @ moderate load"
          : "Trap Bar Deadlift — 4×4–6",
        "Front Foot Elevated Split Squat — 3×8–10 each side",
        "Barbell Hip Thrust — 3×8–12",
        "Hamstring Curl — 3×10–15",
        "Standing Calf Raise — 3×12–15",
      ],
      notes: ["Explode on the way up.", "No grinding reps."],
    }),
  },
  {
    id: "LS-C",
    title: "Lower Strength (Hybrid Power)",
    tags: ["lower", "strength", "hybrid", "hard"],
    time_cap_minutes: 80,
    build: (_ability, hours) => ({
      warm_up: ["5 min ski or row", "Hip prep", ...bikeAddon(hours)],
      main: [
        "Front Squat — 4×5",
        "Walking Lunges — 3×20 steps",
        "Romanian Deadlift — 3×10",
        "Farmers Carry — 4×30m",
      ],
      finish: ["Optional: 3 rounds — 12 wall balls + 10 burpees"],
      notes: ["Keep mechanics crisp.", "Finisher should feel controlled, not reckless."],
    }),
  },
  {
    id: "LS-D",
    title: "Lower Strength (Unilateral Stability)",
    tags: ["lower", "strength", "stability", "moderate"],
    time_cap_minutes: 75,
    build: (_ability, hours) => ({
      warm_up: ["5–8 min bike", "Single leg activation", ...bikeAddon(hours)],
      main: [
        "Bulgarian Split Squat — 4×8 each leg",
        "Single Leg RDL — 3×8 each leg",
        "Step-Ups — 3×10 each leg",
        "Seated Calf Raises — 3×12–15",
      ],
      notes: ["Balance and control over load.", "Build durability for running."],
    }),
  },
  {
    id: "LS-E",
    title: "Lower Strength (Posterior Chain)",
    tags: ["lower", "strength", "posterior_chain", "moderate"],
    time_cap_minutes: 75,
    build: (_ability, hours) => ({
      warm_up: ["5 min row", "Hamstring + glute prep", ...bikeAddon(hours)],
      main: [
        "Romanian Deadlift — 4×6–8",
        "Hip Thrust — 4×8–10",
        "Hamstring Curl — 3×10–15",
        "Back Extensions — 3×12–15",
      ],
      finish: ["3 rounds — 15 KB swings + 10 reverse lunges"],
      notes: ["Strong hinge improves running efficiency and sled work."],
    }),
  },
];

export const UPPER_STRENGTH: Template[] = [
  {
    id: "US-A",
    title: "Upper Strength (Pull Dominant)",
    tags: ["upper", "strength", "moderate"],
    time_cap_minutes: 75,
    build: (_ability, hours) => ({
      warm_up: ["5–8 min easy row", "Shoulder/scap prep", ...bikeAddon(hours)],
      main: [
        "Weighted Pull-Ups — 4×8–10",
        "Incline DB Press — 3×6–8",
        "Chest Supported Row — 3×8–10",
        "Shoulder Press — 3×6–8",
        "Biceps Curls — 3×10–12",
      ],
      notes: ["Leave 1–2 reps in reserve.", "Full ROM on all pulling."],
    }),
  },
  {
    id: "US-B",
    title: "Upper Strength (Push Dominant)",
    tags: ["upper", "strength", "moderate"],
    time_cap_minutes: 75,
    build: (_ability, hours) => ({
      warm_up: ["6 min bike or row", "Band shoulder prep", ...bikeAddon(hours)],
      main: [
        "Bench Press — 4×5–6",
        "Neutral Grip Pull-Ups — 4×6–8",
        "Single Arm DB Row — 3×8–12 each side",
        "Arnold Press — 3×8–10",
        "Triceps Dips / Pushdowns — 3×10–12",
      ],
      notes: ["Strong scap control.", "Smooth tempo."],
    }),
  },
  {
    id: "US-C",
    title: "Upper Strength (Hybrid Engine)",
    tags: ["upper", "strength", "hybrid", "moderate"],
    time_cap_minutes: 80,
    build: (_ability, hours) => ({
      warm_up: ["5–8 min ski/row", "Shoulder prep", ...bikeAddon(hours)],
      main: [
        "DB Bench Press — 4×8",
        "Bent Over Row — 4×8",
        "Push Press — 3×5",
        "Chin-Ups — 3×AMRAP",
      ],
      finish: ["8-min EMOM — 8 push-ups + 8 DB snatches"],
      notes: ["Keep EMOM smooth.", "Quality reps only."],
    }),
  },
  {
    id: "US-D",
    title: "Upper Strength (Athletic Upper)",
    tags: ["upper", "strength", "power", "moderate"],
    time_cap_minutes: 75,
    build: (_ability, hours) => ({
      warm_up: ["5 min ski", "Band shoulder prep", ...bikeAddon(hours)],
      main: [
        "Push Press — 4×5",
        "Pull-Ups — 4×6–8",
        "DB Bench Press — 3×8",
        "Single Arm Row — 3×10",
      ],
      finish: ["3 rounds — 12 push-ups + 10 DB snatches"],
      notes: ["Explosive intent on push press.", "Stay athletic, not sloppy."],
    }),
  },
  {
    id: "US-E",
    title: "Upper Strength (Hyrox Specific)",
    tags: ["upper", "hyrox", "moderate"],
    time_cap_minutes: 75,
    build: (_ability, hours) => ({
      warm_up: ["5 min row", "Shoulder prep", ...bikeAddon(hours)],
      main: [
        "Wall Balls — 4×20",
        "DB Thrusters — 3×12",
        "Pull-Ups — 3×AMRAP",
        "Shoulder Press — 3×10",
      ],
      finish: ["6 min EMOM — 10 push-ups + 8 burpees"],
      notes: ["Build fatigue resistance for race scenarios."],
    }),
  },
];

export const QUALITY_RUNS: Template[] = [
  {
    id: "THR-A",
    title: "Threshold Intervals (4×2km LT1)",
    tags: ["run", "threshold", "hard"],
    time_cap_minutes: 75,
    build: (ability) => ({
      warm_up: ["1–2km easy jog", "3×20s strides"],
      main: [
        ability === "beginner"
          ? "3×1.5km @ LT1 threshold — 120s jog"
          : "4×2km @ LT1 threshold — 120s jog",
      ],
      cool_down: ["1–2km easy jog"],
      notes: ["Hard but repeatable.", "Do not sprint the final rep."],
    }),
  },
  {
    id: "THR-B",
    title: "Threshold Intervals (4×4min)",
    tags: ["run", "threshold", "hard"],
    time_cap_minutes: 60,
    build: (ability) => ({
      warm_up: ["1–2km easy jog", "3×20s strides"],
      main: [
        ability === "beginner"
          ? "3×4 min @ threshold — 90s jog"
          : "4×4 min @ threshold — 90s jog",
      ],
      cool_down: ["1km easy jog"],
      notes: ["Controlled hard effort.", "Finish like you could do one more rep."],
    }),
  },
  {
    id: "THR-C",
    title: "Threshold + Pace Change",
    tags: ["run", "threshold", "pace_change", "hard"],
    time_cap_minutes: 75,
    build: (ability) => ({
      warm_up: ["1–2km easy jog", "3×20s strides"],
      main: [
        ability === "beginner"
          ? "1.2km @ strong steady pace, 120s rest, 300m fast controlled, 60s rest ×3–4"
          : "1.2km @ 10km pace, 120s rest, 400m @ 5km pace, 60s rest ×4–6",
      ],
      cool_down: ["1–2km easy jog"],
      notes: ["Gear change under fatigue.", "Keep the fast reps controlled."],
    }),
  },
  {
    id: "RUN-BEG-A",
    title: "Controlled Intervals",
    tags: ["run", "beginner_friendly", "moderate"],
    time_cap_minutes: 55,
    build: () => ({
      warm_up: ["1–2km warm-up"],
      main: ["6×2 min moderate effort — 90s easy jog"],
      cool_down: ["1km cool-down"],
      notes: ["Should feel like 7/10 effort."],
    }),
  },
  {
    id: "RUN-BEG-B",
    title: "Tempo Intro",
    tags: ["run", "beginner_friendly", "moderate"],
    time_cap_minutes: 50,
    build: () => ({
      warm_up: ["1km easy"],
      main: ["10–15 min steady tempo"],
      cool_down: ["1km easy"],
      notes: ["Controlled pace, not race effort."],
    }),
  },
  {
    id: "RUN-BEG-C",
    title: "Fartlek Session",
    tags: ["run", "beginner_friendly", "moderate"],
    time_cap_minutes: 45,
    build: () => ({
      main: ["30 min continuous — 1 min faster / 2 min easy"],
      notes: ["Playful but controlled.", "Never feels like a race."],
    }),
  },
];

export const AEROBIC_BASE: Template[] = [
  {
    id: "AER-A",
    title: "Aerobic Base (Z2 Run + Strides)",
    tags: ["aerobic", "easy"],
    time_cap_minutes: 60,
    build: (ability) => ({
      main: [
        ability === "beginner" ? "30–40 min Z2 run" : "40–60 min Z2 run",
        "Then 6×20s strides",
      ],
      notes: ["Easy means easy.", "Strides are sharp, not sprinted."],
    }),
  },
  {
    id: "AER-B",
    title: "Aerobic Base (Bike Builder)",
    tags: ["aerobic", "bike", "easy"],
    time_cap_minutes: 75,
    build: (ability) => ({
      main: [
        ability === "beginner" ? "35–50 min continuous Z2 bike" : "45–75 min continuous Z2 bike",
        "Optional: every 10 min add 20s high cadence",
      ],
      notes: ["Low impact, high aerobic return."],
    }),
  },
  {
    id: "AER-C",
    title: "Aerobic Base (Mixed Session)",
    tags: ["aerobic", "easy"],
    time_cap_minutes: 55,
    build: () => ({
      main: ["20 min Z2 run", "20 min Z2 bike", "10 min mobility"],
      notes: ["Great for variety and managing impact."],
    }),
  },
  {
    id: "AER-D",
    title: "Aerobic Intervals (Controlled)",
    tags: ["aerobic", "moderate"],
    time_cap_minutes: 55,
    build: () => ({
      main: [
        "10 min Z2",
        "5×3 min slightly above Z2",
        "2 min easy between reps",
        "10 min easy",
      ],
      notes: ["Not threshold.", "Smooth aerobic pressure only."],
    }),
  },
  {
    id: "AER-E",
    title: "Easy Run + Drill Work",
    tags: ["aerobic", "mechanics", "easy"],
    time_cap_minutes: 55,
    build: (ability) => ({
      main: [
        ability === "beginner" ? "30–40 min Z2 run" : "30–50 min Z2 run",
        "Then: A-skips ×2 sets, B-skips ×2 sets, High knees ×2 sets",
      ],
      notes: ["Build mechanics and efficiency.", "Stay relaxed."],
    }),
  },
  {
    id: "AER-F",
    title: "Split Aerobic Day",
    tags: ["aerobic", "double_day", "easy"],
    time_cap_minutes: 60,
    build: () => ({
      main: ["AM: 20–30 min Z2 run", "PM: 30–45 min Z2 bike"],
      notes: ["Great for higher training hours.", "Both sessions must feel easy."],
    }),
  },
];

export const LONG_RUNS: Template[] = [
  {
    id: "LONG-A",
    title: "Long Aerobic Run",
    tags: ["long", "easy"],
    time_cap_minutes: 90,
    build: (ability, hours) => {
      const low = ability === "beginner" ? 30 : 40;
      const high = hours === "10+" ? 90 : hours === "7-10" ? 75 : 60;
      return {
        main: [`${low}–${high} min continuous @ Z2`],
        notes: ["Stay conversational.", "No surging."],
      };
    },
  },
  {
    id: "LONG-B",
    title: "Progressive Long Run",
    tags: ["long", "progressive", "moderate"],
    time_cap_minutes: 75,
    build: (ability) => ({
      main:
        ability === "beginner"
          ? ["2km easy", "2km steady", "2km steady + slightly quicker", "1–2km easy"]
          : ["2km WU", "2km -10s/km", "2km -5s/km", "2km @ 10km pace", "2km WD @ easy"],
      notes: ["Controlled build.", "Finish strong, not flat-out."],
    }),
  },
  {
    id: "LONG-C",
    title: "Long Run + Pick-Ups",
    tags: ["long", "easy"],
    time_cap_minutes: 70,
    build: (ability) => ({
      main: [
        ability === "beginner" ? "35–50 min Z2" : "40–60 min Z2",
        "Then 6×30s pick-ups",
      ],
      notes: ["Pick-ups are relaxed and smooth."],
    }),
  },
  {
    id: "LONG-D",
    title: "Negative Split Long Run",
    tags: ["long", "moderate"],
    time_cap_minutes: 75,
    build: (ability) => ({
      main: [
        ability === "beginner"
          ? "First half easy, second half slightly quicker"
          : "First half easy Z2, second half steady / controlled negative split",
      ],
      notes: ["Teaches control and finish strength."],
    }),
  },
  {
    id: "LONG-E",
    title: "Hybrid Long Session",
    tags: ["long", "hybrid", "moderate"],
    time_cap_minutes: 80,
    build: () => ({
      main: ["5km run", "1km ski or row", "5km run"],
      notes: ["Hybrid crossover session.", "Stay smooth across both runs."],
    }),
  },
  {
    id: "LONG-F",
    title: "Broken Long Run",
    tags: ["long", "moderate"],
    time_cap_minutes: 70,
    build: () => ({
      main: ["3km easy", "6km steady", "3km easy"],
      notes: ["Mentally easier but still effective."],
    }),
  },
];

export const COMPROMISED_HYROX: Template[] = [
  {
    id: "COMP-A",
    title: "Compromised Run (Ski Flow)",
    tags: ["hyrox", "hard"],
    time_cap_minutes: 65,
    build: (ability) => ({
      main: [
        "300m Ski",
        "10 Burpee to Plate",
        "10 Reverse Sandbag Lunges",
        "400m Run",
        "90s Rest",
        `Repeat ×${scaleRounds(8, ability)}`,
      ],
      notes: ["Keep run rhythm consistent.", "Don’t spike too early."],
    }),
  },
  {
    id: "COMP-B",
    title: "Compromised Run (Sled Builder)",
    tags: ["hyrox", "sled", "hard"],
    time_cap_minutes: 65,
    build: (ability) => ({
      main: [
        "15 Wall Balls",
        "20m Sled Push",
        "20m Lunges",
        "800m Run",
        "90s Rest",
        `Repeat ×${scaleRounds(5, ability)}`,
      ],
      notes: ["Maintain form on wall balls.", "Run immediately after sled."],
    }),
  },
  {
    id: "COMP-C",
    title: "Compromised Run (Row Builder)",
    tags: ["hyrox", "hard"],
    time_cap_minutes: 70,
    build: (ability) => ({
      main: [
        "500m Row",
        "30m Lunges",
        "20 Burpees",
        "1km Run",
        "90s Rest",
        `Repeat ×${scaleRounds(5, ability)}`,
      ],
      notes: ["Smooth transitions.", "Build repeatable engine."],
    }),
  },
  {
    id: "COMP-D",
    title: "Compromised Density Builder",
    tags: ["hyrox", "moderate"],
    time_cap_minutes: 45,
    build: () => ({
      main: [
        "10 min AMRAP — 250m row + 10 burpees",
        "Rest 2 min",
        "Repeat ×3",
      ],
      notes: ["Consistent output over reckless pace."],
    }),
  },
  {
    id: "COMP-E",
    title: "Compromised Strength Under Fatigue",
    tags: ["hyrox", "hard"],
    time_cap_minutes: 55,
    build: () => ({
      main: [
        "400m run",
        "20m sled push",
        "20 wall balls",
        "90s rest",
        "Repeat ×6",
      ],
      notes: ["Stay composed under load."],
    }),
  },
  {
    id: "COMP-F",
    title: "Compromised Engine Ladder",
    tags: ["hyrox", "moderate"],
    time_cap_minutes: 50,
    build: () => ({
      main: [
        "500m ski + 20 lunges + 10 burpees",
        "400m ski + 20 lunges + 10 burpees",
        "300m ski + 20 lunges + 10 burpees",
      ],
      notes: ["Descending volume, increasing pressure."],
    }),
  },
];

export const RECOVERY: Template[] = [
  {
    id: "REC-A",
    title: "Recovery & Mobility",
    tags: ["recovery", "easy"],
    time_cap_minutes: 45,
    build: (_ability, hours) => ({
      main: [
        "Light walk / easy cycle — 20–30 min",
        "Mobility flow — 15–20 min",
        "Core stability — plank, dead bug, side plank",
        "Glute activation — band walks, bridges",
        ...(hours === "10+" ? ["Optional: 30 min Z2 spin"] : []),
      ],
      notes: ["Leave feeling better than you started."],
    }),
  },
  {
    id: "REC-B",
    title: "Recovery (Lower Leg Durability)",
    tags: ["recovery", "durability", "easy"],
    time_cap_minutes: 35,
    build: () => ({
      main: [
        "3 rounds — calf raises x15, tib raises x20, single leg balance 30s",
        "20–30 min walk",
      ],
      notes: ["Excellent for injury prevention."],
    }),
  },
  {
    id: "REC-C",
    title: "Recovery (Mobility Reset)",
    tags: ["recovery", "mobility", "easy"],
    time_cap_minutes: 40,
    build: () => ({
      main: ["30 min mobility flow", "10 min breathing work"],
      notes: ["Reset the nervous system."],
    }),
  },
  {
    id: "REC-D",
    title: "Recovery (Active Flush)",
    tags: ["recovery", "easy"],
    time_cap_minutes: 40,
    build: () => ({
      main: ["15 min easy bike", "10 min mobility", "15 min walk"],
      notes: ["Flush fatigue out of the legs."],
    }),
  },
  {
    id: "REC-E",
    title: "Recovery (Foot & Ankle Strength)",
    tags: ["recovery", "durability", "easy"],
    time_cap_minutes: 30,
    build: () => ({
      main: [
        "3 rounds — single leg calf raises x15, tib raises x20, short foot hold 20s, heel walks 20m",
        "Optional: 20 min easy walk",
      ],
      notes: ["Massive for durability and ankle resilience."],
    }),
  },
];