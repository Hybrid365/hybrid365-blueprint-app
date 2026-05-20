import type { BlockWeekInCycle } from "./types";

/** 4-week in-block progression for key session families — same benefit, progressive stimulus. */
export type SessionProgressionTemplate = {
  sessionIds: string[];
  family: string;
  intent: string;
  weeks: Record<`week${BlockWeekInCycle}`, string>;
};

export const HYROX_SESSION_PROGRESSIONS: SessionProgressionTemplate[] = [
  {
    family: "threshold_run_5x5",
    sessionIds: ["hyrox_run_threshold_6x6", "hyrox_run_threshold_3x10"],
    intent: "Progress duration and reduce recovery before chasing pace.",
    weeks: {
      week1: "5×5 min @ threshold · 90s rest (thresholdMinutes ~25)",
      week2: "6×5 min @ threshold · 75s rest",
      week3: "6×6 min @ threshold · 60s rest",
      week4: "4×5 min deload · 90s rest — reduce overall threshold load",
    },
  },
  {
    family: "wall_ball_emom_addon",
    sessionIds: ["hyrox_compromised_run_wallballs"],
    intent: "Wall ball capacity — attach EMOM to strength/Hyrox hard day, not easy aerobic.",
    weeks: {
      week1: "10 min WB EMOM × 10–15 reps on strength endurance or Hyrox day",
      week2: "10 min WB EMOM × 12–15 · smoother breathing",
      week3: "30–40 WB then 800m run × 3 rounds (compromised builder)",
      week4: "8 min WB EMOM maintenance only (deload)",
    },
  },
  {
    family: "threshold_run_station_overload",
    sessionIds: ["hyrox_compromised_threshold_run_station_overload"],
    intent: "Saturday key — threshold reps into station overload; progress reps/rest then run/station volume.",
    weeks: {
      week1: "6×3 min @ 5k · 90s · then 600m+90s station+600m ×2 · 2 min between blocks",
      week2: "8×3 min · 75s rest · 750m+2 min station+750m ×2",
      week3: "8×3 min · 60s · 750m+3 min station+750m ×2 — record pace drop-off",
      week4: "5×3 min deload · 90s · 1 round station block only",
    },
  },
  {
    family: "compromised_rounds_progression",
    sessionIds: ["hyrox_compromised_mini_test", "hyrox_compromised_run_wallballs"],
    intent: "Compromised running — manipulate rounds, run distance, station volume, rest.",
    weeks: {
      week1: "3 rounds 600m run + station · 2 min rest",
      week2: "4 rounds 600m + station · 90s rest",
      week3: "4 rounds 800m + station · 90s rest",
      week4: "Reduced volume / technique deload — 2 rounds easy",
    },
  },
  {
    family: "compromised_mini_to_full",
    sessionIds: ["hyrox_compromised_mini_test", "hyrox_compromised_sled_burpee"],
    intent: "Compromised running — progress density before speed.",
    weeks: {
      week1: "Short stations → 600m run × 2 rounds",
      week2: "Moderate stations → 800m run × 3 rounds",
      week3: "Race-load stations → 1000m run × 3–4 rounds",
      week4: "2 rounds race rhythm only (deload volume)",
    },
  },
  {
    family: "sled_exposure",
    sessionIds: ["hyrox_strength_lower_sled", "hyrox_compromised_sled_burpee"],
    intent: "Sled — frequent exposure, integrate into leg days.",
    weeks: {
      week1: "Technique loads · 4×50m push/pull in strength session",
      week2: "Moderate load · 6×50m total volume",
      week3: "Race load · sled into compromised builder",
      week4: "Light technique only (deload)",
    },
  },
  {
    family: "leg_endurance_strength",
    sessionIds: ["hyrox_strength_heavy_legs", "hyrox_strength_single_leg"],
    intent: "Leg endurance — tempo, higher reps, breathing through sets.",
    weeks: {
      week1: "Tempo squat 3×10 · RDL 3×10 · controlled 90s rest",
      week2: "Add 1 set per lift OR +2 reps — no max singles",
      week3: "Density: slightly shorter rest, same loads",
      week4: "Reduce sets 30% — maintain movement quality",
    },
  },
];

const PROGRESSION_BY_SESSION_ID = new Map<string, SessionProgressionTemplate>();
for (const template of HYROX_SESSION_PROGRESSIONS) {
  for (const id of template.sessionIds) {
    PROGRESSION_BY_SESSION_ID.set(id, template);
  }
}

export function getSessionProgressionForWeek(
  sessionId: string,
  blockWeek: BlockWeekInCycle
): string | null {
  const template = PROGRESSION_BY_SESSION_ID.get(sessionId);
  if (!template) return null;
  return template.weeks[`week${blockWeek}`] ?? null;
}

export function getSessionProgressionTemplate(
  sessionId: string
): SessionProgressionTemplate | undefined {
  return PROGRESSION_BY_SESSION_ID.get(sessionId);
}

/** After week 4 deload, rotate stimulus or advance to next progression family. */
export function shouldRotateSessionStimulus(blockWeek: BlockWeekInCycle): boolean {
  return blockWeek === 4;
}
