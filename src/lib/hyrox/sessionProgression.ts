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
    family: "threshold_run_6x6",
    sessionIds: ["hyrox_run_threshold_6x6"],
    intent: "Threshold — correct intensity, not forced pace.",
    weeks: {
      week1: "4×6 min @ threshold · 2 min rest — establish rhythm",
      week2: "5×6 min @ threshold · 90s rest",
      week3: "6×6 min @ threshold · 90s rest — reduce rest before adding speed",
      week4: "4×6 min @ threshold (deload volume) · 2 min rest",
    },
  },
  {
    family: "wall_ball_emom_addon",
    sessionIds: ["hyrox_compromised_run_wallballs"],
    intent: "Wall ball capacity — EMOM add-on early, fatigue integration late.",
    weeks: {
      week1: "10 min WB EMOM × 12–15 reps (category ball) after easy day",
      week2: "10 min WB EMOM × 15–18 · tighter rest",
      week3: "30–40 WB then 800m run × 3 rounds (compromised builder)",
      week4: "8 min WB EMOM maintenance only (deload)",
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
