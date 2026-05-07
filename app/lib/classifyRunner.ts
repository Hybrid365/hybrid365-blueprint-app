export type RunnerLabel =
  | "unknown"
  | "beginner"
  | "developing"
  | "intermediate"
  | "advanced"
  | "high-performance";

export type RunnerProfile = {
  raw: string;
  seconds: number | null;
  label: RunnerLabel;
  description: string;
  guidance: string;
};

/** Parse common 5km time strings to total seconds. Returns null if unusable. */
function parseFiveKTime(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;

  const colon = /^(\d+):(\d{1,2})$/.exec(s);
  if (colon) {
    const min = parseInt(colon[1], 10);
    const sec = parseInt(colon[2], 10);
    if (Number.isNaN(min) || Number.isNaN(sec) || sec > 59 || min > 300) return null;
    return min * 60 + sec;
  }

  const dot = /^(\d+)\.(\d{2})$/.exec(s);
  if (dot) {
    const min = parseInt(dot[1], 10);
    const sec = parseInt(dot[2], 10);
    if (Number.isNaN(min) || Number.isNaN(sec) || sec > 59 || min > 300) return null;
    return min * 60 + sec;
  }

  const minsWord = /^(\d+)\s*(?:mins?|minutes?)$/i.exec(s);
  if (minsWord) {
    const min = parseInt(minsWord[1], 10);
    if (Number.isNaN(min) || min <= 0 || min > 300) return null;
    return min * 60;
  }

  if (/^\d+$/.test(s)) {
    const min = parseInt(s, 10);
    if (Number.isNaN(min) || min <= 0 || min > 300) return null;
    return min * 60;
  }

  return null;
}

function tierFromSeconds(seconds: number): Pick<RunnerProfile, "label" | "description" | "guidance"> {
  // Boundaries (5km): high-performance < 16:30; advanced 16:30–18:29; intermediate 18:30–21:59;
  // developing 22:00–26:59; beginner ≥ 27:00
  const hpEnd = 16 * 60 + 30; // 990 — exclusive upper for high-performance (faster than this)
  const advEnd = 18 * 60 + 29; // 1109
  const intEnd = 21 * 60 + 59; // 1319
  const devEnd = 26 * 60 + 59; // 1619

  if (seconds < hpEnd) {
    return {
      label: "high-performance",
      description: "5km under 16:30 — elite amateur / emerging elite engine.",
      guidance:
        "Training lives in small margins: prioritise freshness, session quality, and recovery between hard work.",
    };
  }
  if (seconds <= advEnd) {
    return {
      label: "advanced",
      description: "5km between 16:30 and 18:29 — very strong, race-sharp running.",
      guidance:
        "This week rewards structure over volume: hit the key sessions fresh and keep easy days truly easy.",
    };
  }
  if (seconds <= intEnd) {
    return {
      label: "intermediate",
      description: "5km between 18:30 and 21:59 — solid club runner with room to sharpen.",
      guidance:
        "Emphasise aerobic strength and controlled quality; avoid stacking hard days without purpose.",
    };
  }
  if (seconds <= devEnd) {
    return {
      label: "developing",
      description: "5km between 22:00 and 26:59 — building fitness and pace control.",
      guidance:
        "Consistency beats hero sessions: grow the aerobic base before chasing top-end speed.",
    };
  }
  return {
    label: "beginner",
    description: "5km 27:00 or slower — early focus on durability and repeatable running.",
    guidance:
      "Walk-run, easy volume, and technique build the engine — intensity comes after the habits stick.",
  };
}

export function classifyRunner(five_k_time?: string): RunnerProfile {
  const raw = (five_k_time ?? "").trim();

  if (!raw) {
    return {
      raw: "",
      seconds: null,
      label: "unknown",
      description: "No 5km time provided.",
      guidance: "Add a recent 5km time (e.g. 25:30 or 25 minutes) so pacing guidance can match your level.",
    };
  }

  const seconds = parseFiveKTime(raw);
  if (seconds === null) {
    return {
      raw,
      seconds: null,
      label: "unknown",
      description: "That 5km time could not be read.",
      guidance: "Try formats like 25:30, 25.30, 25, or 25 minutes.",
    };
  }

  const tier = tierFromSeconds(seconds);
  return {
    raw,
    seconds,
    ...tier,
  };
}
