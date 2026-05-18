import type { HyroxSessionDefinition } from "./types";
import { getSessionProgressionForWeek } from "./sessionProgression";

/** Per-session enrichments: film prompts, dashboard rationale, optional 4-week progression copy. */
const ENRICHMENTS: Partial<
  Record<
    string,
    Pick<HyroxSessionDefinition, "filmPrompt" | "prescriptionRationale" | "progressionExamples">
  >
> = {
  hyrox_run_threshold_6x6: {
    prescriptionRationale:
      "Builds threshold engine with controlled reps — pace from 5k/10k, governed by HR/RPE. Progress duration/rest before speed.",
    filmPrompt: null,
    progressionExamples: {
      week1: "4×6 min threshold · 2 min rest",
      week2: "5×6 min · 90s rest",
      week3: "6×6 min · 90s rest",
      week4: "4×6 min deload · 2 min rest",
    },
  },
  hyrox_run_easy: {
    prescriptionRationale:
      "Grey-zone protection — true easy aerobic between hard days. Supports Block 1 volume tolerance.",
    filmPrompt: null,
  },
  hyrox_compromised_mini_test: {
    prescriptionRationale:
      "Benchmark compromised running — sets race rhythm and run-after-station pacing from your data.",
    filmPrompt: "Film the final 1km run split for coach pacing feedback.",
    progressionExamples: {
      week1: "Scaled mini test",
      week2: "Standard test",
      week3: "Race-effort run split",
      week4: "Skip or short rhythm only",
    },
  },
  hyrox_compromised_run_wallballs: {
    prescriptionRationale:
      "Included because wall balls are a reported limiter — progresses from EMOM density to fatigued running.",
    filmPrompt: "Film one round: wall balls + run — breathing and break strategy.",
    progressionExamples: {
      week1: "WB EMOM add-on",
      week2: "WB EMOM density",
      week3: "WB → 800m run × 3",
      week4: "Short WB maintenance",
    },
  },
  hyrox_strength_lower_sled: {
    prescriptionRationale:
      "Sled limiter support — integrated leg strength with frequent sled exposure.",
    filmPrompt: "Film sled push side view — body angle and leg drive.",
    progressionExamples: {
      week1: "Technique load",
      week2: "Volume build",
      week3: "Race load sets",
      week4: "Technique deload",
    },
  },
  hyrox_strength_heavy_legs: {
    prescriptionRationale:
      "Hyrox leg endurance — tempo and higher reps, not max-strength DOMS before key runs.",
    filmPrompt: "Film tempo squat set 2 — depth and breathing rhythm.",
  },
  hyrox_strength_grip_carry: {
    prescriptionRationale:
      "Grip and carry capacity for farmers and station control — holds above race weight where safe.",
    filmPrompt: "Film max hold or carry turnaround for coach review.",
  },
  hyrox_erg_ski_threshold_8x4: {
    prescriptionRationale:
      "Low-impact threshold — adds engine minutes without extra run damage; ~5s faster than race pace target, HR-governed.",
    filmPrompt: null,
  },
};

export function enrichHyroxSession(session: HyroxSessionDefinition): HyroxSessionDefinition {
  const extra = ENRICHMENTS[session.id];
  if (!extra) return session;
  return {
    ...session,
    filmPrompt: extra.filmPrompt ?? session.filmPrompt,
    prescriptionRationale: extra.prescriptionRationale ?? session.prescriptionRationale,
    progressionExamples: extra.progressionExamples ?? session.progressionExamples,
  };
}

export function enrichHyroxSessionLibrary(
  sessions: HyroxSessionDefinition[]
): HyroxSessionDefinition[] {
  return sessions.map(enrichHyroxSession);
}

/** Merge block-week progression line into coach notes when template exists. */
export function withBlockWeekProgression(
  session: HyroxSessionDefinition,
  blockWeek: 1 | 2 | 3 | 4
): HyroxSessionDefinition {
  const line = getSessionProgressionForWeek(session.id, blockWeek);
  if (!line) return session;
  return {
    ...session,
    coachNotes: [...session.coachNotes, `Week ${blockWeek} progression: ${line}`],
  };
}

export function getFilmPrompt(session: HyroxSessionDefinition): string | null {
  return session.filmPrompt ?? ENRICHMENTS[session.id]?.filmPrompt ?? null;
}
