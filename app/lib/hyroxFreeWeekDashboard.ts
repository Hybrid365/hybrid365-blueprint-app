import type { HyroxFreeWeekMeta } from "./freeWeekChallengeMode";
import type { FreePlanSession } from "./freePlanDashboard";

export const HYROX_BLOCK_WEEKS = [
  {
    week: 1,
    label: "W1",
    title: "Foundation",
    objective: "Assessment week — establish threshold, erg base and station exposure.",
    unlocked: true,
  },
  {
    week: 2,
    label: "W2",
    title: "Build",
    objective: "Build threshold volume + station work tolerance.",
    unlocked: false,
  },
  {
    week: 3,
    label: "W3",
    title: "Peak",
    objective: "Peak HYROX-specific work and compromised running.",
    unlocked: false,
  },
  {
    week: 4,
    label: "W4",
    title: "Deload",
    objective: "Deload + benchmark review and retesting.",
    unlocked: false,
  },
] as const;

export type HyroxPerformanceBar = {
  id: string;
  label: string;
  current: number;
  target12Week: number;
  estimated: boolean;
  locked: boolean;
};

export type HyroxSessionPreview = {
  day: string;
  title: string;
  type: string;
  objective: string;
  duration: string;
  rpe: string;
  target: string;
  scrollId: string;
  isKey: boolean;
};

function clamp(n: number, min = 1, max = 10): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function levelBaseline(level: string | undefined): number {
  if (level === "advanced") return 7;
  if (level === "beginner") return 4;
  return 6;
}

function noteField(notes: string[] | undefined, prefix: string): string | null {
  if (!notes?.length) return null;
  const hit = notes.find((n) => n.toLowerCase().startsWith(prefix.toLowerCase()));
  return hit ? hit.replace(/^[^:]+:\s*/i, "").trim() : null;
}

export function extractSessionRpe(session: FreePlanSession): string {
  const fromNotes = noteField(session.session.notes, "RPE target");
  if (fromNotes) return fromNotes;
  const tagStr = session.tags.join(" ").toLowerCase();
  if (tagStr.includes("threshold") || tagStr.includes("compromised")) return "7–8";
  if (tagStr.includes("easy") || tagStr.includes("recovery")) return "2–4";
  if (tagStr.includes("strength")) return "6–8";
  return "6–7";
}

export function extractSessionTarget(
  session: FreePlanSession,
  meta: HyroxFreeWeekMeta
): string {
  const paceGuide = noteField(session.session.notes, "Pace guide");
  if (paceGuide) return paceGuide;

  const tagStr = session.tags.join(" ").toLowerCase();
  if (tagStr.includes("threshold") && meta.threshold_pace) {
    return `${meta.threshold_pace} or RPE 7–8`;
  }
  if (tagStr.includes("erg") || tagStr.includes("ski")) {
    return meta.ski_target ? `${meta.ski_target} or RPE 7–8` : "RPE 7–8";
  }
  if (tagStr.includes("row")) {
    return meta.row_target ? `${meta.row_target} or RPE 7–8` : "RPE 7–8";
  }
  if (tagStr.includes("compromised")) {
    return `Station focus: ${meta.station_focus}`;
  }
  if (tagStr.includes("easy")) {
    return meta.easy_pace ? `${meta.easy_pace} or RPE 2–4` : "RPE 2–4 · conversational";
  }
  return "RPE-guided";
}

export function hyroxSessionType(session: FreePlanSession): string {
  const tagStr = session.tags.join(" ").toLowerCase();
  if (tagStr.includes("threshold")) return "Threshold run";
  if (tagStr.includes("compromised")) return "Compromised HYROX";
  if (tagStr.includes("erg")) return "Erg development";
  if (tagStr.includes("legs")) return "HYROX legs";
  if (tagStr.includes("upper")) return "Upper / grip";
  if (tagStr.includes("easy") || tagStr.includes("recovery")) return "Easy aerobic";
  if (tagStr.includes("strength")) return "Strength endurance";
  return session.category;
}

export function buildHyroxSessionPreviews(
  sessions: FreePlanSession[],
  meta: HyroxFreeWeekMeta
): HyroxSessionPreview[] {
  return sessions.map((s) => ({
    day: s.day,
    title: s.title,
    type: hyroxSessionType(s),
    objective: s.intent,
    duration: s.timeCapMinutes ? `${s.timeCapMinutes} min` : "—",
    rpe: extractSessionRpe(s),
    target: extractSessionTarget(s, meta),
    scrollId: s.scrollId,
    isKey: s.tags.some((t) => t.includes("threshold") || t.includes("compromised") || t.includes("key")),
  }));
}

export function extractThresholdMainSet(session: FreePlanSession): string | null {
  const main = session.session.main;
  if (!main?.length) return null;
  const thresholdLine = main.find((l) => /×|x|min|threshold/i.test(l));
  return thresholdLine ?? main[0] ?? null;
}

export function buildHyroxPerformanceProfile(args: {
  meta: HyroxFreeWeekMeta;
  abilityLevel?: string;
  hasBenchmarks: boolean;
}): HyroxPerformanceBar[] {
  const { meta, abilityLevel, hasBenchmarks } = args;
  const base = levelBaseline(abilityLevel);
  const weaknesses = new Set((meta.station_weaknesses ?? []).map((s) => s.toLowerCase()));

  let running = base;
  if (meta.threshold_pace) running += 1;
  if (meta.limiter.toLowerCase() === "running") running -= 1;

  let engine = base;
  if (meta.ski_target || meta.row_target) engine += 1;
  if (meta.limiter.toLowerCase() === "engine") engine -= 1;

  let recovery = 6;
  if (meta.limiter.toLowerCase() === "recovery") recovery -= 2;

  const bars: HyroxPerformanceBar[] = [
    {
      id: "running_speed",
      label: "Running speed",
      current: clamp(running),
      target12Week: clamp(running + 2),
      estimated: !meta.threshold_pace,
      locked: !meta.threshold_pace,
    },
    {
      id: "aerobic_engine",
      label: "Aerobic engine",
      current: clamp(engine),
      target12Week: clamp(engine + 2),
      estimated: !(meta.ski_target || meta.row_target),
      locked: !(meta.ski_target || meta.row_target),
    },
    {
      id: "strength_endurance",
      label: "Strength endurance",
      current: clamp(base + (meta.limiter.toLowerCase() === "strength" ? -1 : 0)),
      target12Week: clamp(base + 3),
      estimated: !hasBenchmarks,
      locked: false,
    },
    {
      id: "sled_power",
      label: "Sled power",
      current: clamp(
        base -
          (weaknesses.has("sled push") || weaknesses.has("sled pull") ? 2 : 0)
      ),
      target12Week: clamp(base + 2),
      estimated: !hasBenchmarks,
      locked: weaknesses.has("sled push") || weaknesses.has("sled pull"),
    },
    {
      id: "wall_balls",
      label: "Wall balls",
      current: clamp(base - (weaknesses.has("wall balls") ? 2 : 0)),
      target12Week: clamp(base + 3),
      estimated: !hasBenchmarks,
      locked: weaknesses.has("wall balls"),
    },
    {
      id: "grip_carries",
      label: "Grip / carries",
      current: clamp(
        base - (weaknesses.has("farmers carry") || weaknesses.has("grip") ? 2 : 0)
      ),
      target12Week: clamp(base + 3),
      estimated: !hasBenchmarks,
      locked: weaknesses.has("farmers carry"),
    },
    {
      id: "recovery",
      label: "Recovery",
      current: clamp(recovery),
      target12Week: clamp(recovery + 2),
      estimated: true,
      locked: false,
    },
    {
      id: "hyrox_specificity",
      label: "HYROX specificity",
      current: clamp(base + (meta.station_focus ? 0 : -1)),
      target12Week: clamp(base + 3),
      estimated: true,
      locked: false,
    },
  ];

  return bars;
}

export function hyroxOverviewCopy(meta: HyroxFreeWeekMeta): string {
  if (meta.personalisation_lines?.[0]) return meta.personalisation_lines[0];
  return "Your free HYROX week has been built using your assessment responses and HYROX training goal.";
}

export type HyroxWeekTracking = {
  sleepLabel: "Good" | "Average" | "Limited" | "Unknown";
  sleepLocked: boolean;
  sessionTotal: number;
  sessionCompleted: number;
  thresholdMinutes: number | null;
  thresholdSessionCount: number;
};

function parseIntervalWorkMinutes(line: string): number | null {
  const match = line.match(/(\d+)\s*[×x]\s*(\d+)\s*min/i);
  if (!match) return null;
  const reps = Number(match[1]);
  const mins = Number(match[2]);
  if (!Number.isFinite(reps) || !Number.isFinite(mins) || reps <= 0 || mins <= 0) return null;
  return reps * mins;
}

/** Sum planned threshold work minutes from tagged threshold sessions only. */
export function computePlannedThresholdMinutes(sessions: FreePlanSession[]): number | null {
  let total = 0;
  let found = false;

  for (const session of sessions) {
    const isThreshold = session.tags.some((t) => t.toLowerCase().includes("threshold"));
    if (!isThreshold) continue;

    for (const line of session.session.main ?? []) {
      const workMinutes = parseIntervalWorkMinutes(line);
      if (workMinutes != null) {
        total += workMinutes;
        found = true;
        break;
      }
    }
  }

  return found ? total : null;
}

export function deriveSleepRecoveryLabel(meta: HyroxFreeWeekMeta): HyroxWeekTracking["sleepLabel"] {
  const blob = [
    meta.limiter,
    ...(meta.personalisation_lines ?? []),
  ]
    .join(" ")
    .toLowerCase();

  if (blob.includes("limited recovery") || meta.limiter.toLowerCase() === "recovery") {
    return "Limited";
  }
  if (blob.includes("good sleep") || blob.includes("sleep quality")) {
    return "Good";
  }
  if (blob.includes("average")) {
    return "Average";
  }
  return "Unknown";
}

export function buildHyroxWeekTracking(
  sessions: FreePlanSession[],
  meta: HyroxFreeWeekMeta
): HyroxWeekTracking {
  const thresholdSessions = sessions.filter((s) =>
    s.tags.some((t) => t.toLowerCase().includes("threshold"))
  );

  return {
    sleepLabel: deriveSleepRecoveryLabel(meta),
    sleepLocked: true,
    sessionTotal: sessions.length,
    sessionCompleted: 0,
    thresholdMinutes: computePlannedThresholdMinutes(sessions),
    thresholdSessionCount: thresholdSessions.length,
  };
}
