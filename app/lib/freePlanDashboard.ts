import type { Hybrid75PlanMeta } from "./freeWeekChallengeMode";

export type FreePlanSessionCategory =
  | "Run"
  | "Strength"
  | "Mobility"
  | "Hybrid"
  | "Recovery"
  | "Challenge"
  | "Conditioning";

export type Hybrid75SessionRole = "run" | "strength" | "mobility" | "challenge";

export type FreePlanSession = {
  scrollId: string;
  day: string;
  dayIndex: number;
  title: string;
  category: FreePlanSessionCategory;
  intent: string;
  tags: string[];
  timeCapMinutes?: number;
  session: {
    warm_up?: string[];
    main?: string[];
    cool_down?: string[];
    finish?: string[];
    notes?: string[];
  };
  challengeCta?: { label: string; url: string };
  hybrid75Role?: Hybrid75SessionRole;
};

export type FreePlanWeekMetrics = {
  runs: number;
  lifts: number;
  mobility: number;
  strength: number;
  conditioning: number;
  recovery: number;
  hybrid: number;
  challenge: number;
  totalSessions: number;
};

export type TrainingSplitSlice = {
  label: string;
  sessions: number;
  percentage: number;
  color: string;
};

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function dayIndex(day: string): number {
  const key = day.trim().slice(0, 3);
  const idx = DAY_ORDER.findIndex((d) => d.toLowerCase() === key.toLowerCase());
  return idx >= 0 ? idx : 99;
}

function asArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

function isChallengeSession(title: string, tags: string[]): boolean {
  const tagStr = tags.join(" ").toLowerCase();
  return (
    tagStr.includes("challenge_placeholder") ||
    tagStr.includes("hybrid_hard_challenge") ||
    title.toLowerCase().includes("hybrid hard weekly challenge")
  );
}

function isRestDay(title: string, tags: string[]): boolean {
  const lowered = title.toLowerCase();
  const tagStr = tags.join(" ").toLowerCase();
  return (
    lowered.includes("rest") ||
    lowered.includes("off day") ||
    (tagStr.includes("rest") && !tagStr.includes("mobility"))
  );
}

export function classifyFreePlanSession(
  title: string,
  tags: string[]
): { category: FreePlanSessionCategory; hybrid75Role?: Hybrid75SessionRole } {
  const tagStr = tags.join(" ").toLowerCase();
  const lowered = title.toLowerCase();

  if (isChallengeSession(title, tags)) {
    return { category: "Challenge", hybrid75Role: "challenge" };
  }

  if (tagStr.includes("hybrid75_run") || tagStr.includes("hybrid75_strength") || tagStr.includes("hybrid75_mobility")) {
    if (tagStr.includes("hybrid75_run")) return { category: "Run", hybrid75Role: "run" };
    if (tagStr.includes("hybrid75_strength")) return { category: "Strength", hybrid75Role: "strength" };
    if (tagStr.includes("hybrid75_mobility")) return { category: "Mobility", hybrid75Role: "mobility" };
  }

  if (isRestDay(title, tags)) return { category: "Recovery" };

  if (tagStr.includes("mobility") || lowered.includes("mobility")) {
    return { category: "Mobility", hybrid75Role: "mobility" };
  }

  if (
    tagStr.includes("run") ||
    lowered.includes("run") ||
    tagStr.includes("threshold") ||
    tagStr.includes("tempo") ||
    lowered.includes("threshold") ||
    lowered.includes("tempo")
  ) {
    return { category: "Run", hybrid75Role: "run" };
  }

  if (tagStr.includes("strength") || lowered.includes("strength") || lowered.includes("lift")) {
    return { category: "Strength", hybrid75Role: "strength" };
  }

  if (lowered.includes("aerobic") && (lowered.includes("jog") || tagStr.includes("aerobic"))) {
    return { category: "Run", hybrid75Role: "run" };
  }

  if (lowered.includes("recovery") || lowered.includes("rest")) {
    return { category: "Recovery" };
  }

  if (lowered.includes("hybrid")) {
    return { category: "Hybrid" };
  }

  return { category: "Conditioning" };
}

export function parseFreePlanSchedule(raw: unknown[]): FreePlanSession[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item, index) => {
    const row = item as Record<string, unknown>;
    const title = String(row.title || "Session");
    const tags = asArray(row.tags);
    const { category, hybrid75Role } = classifyFreePlanSession(title, tags);
    const session = (row.session as Record<string, unknown>) || {};
    const ctaRaw = row.hybrid75_cta;

    let challengeCta: FreePlanSession["challengeCta"];
    if (ctaRaw && typeof ctaRaw === "object") {
      const cta = ctaRaw as Record<string, unknown>;
      const label = typeof cta.label === "string" ? cta.label.trim() : "";
      const url = typeof cta.url === "string" ? cta.url.trim() : "";
      if (label && url) challengeCta = { label, url };
    }

    return {
      scrollId: `session-${index}`,
      day: String(row.day || "Day"),
      dayIndex: dayIndex(String(row.day || "")),
      title,
      category,
      intent: String(row.intent || "Execute this session with controlled effort and clean form."),
      tags,
      timeCapMinutes: typeof row.time_cap_minutes === "number" ? row.time_cap_minutes : undefined,
      session: {
        warm_up: asArray(session.warm_up),
        main: asArray(session.main),
        cool_down: asArray(session.cool_down),
        finish: asArray(session.finish),
        notes: asArray(session.notes),
      },
      challengeCta,
      hybrid75Role,
    };
  });
}

export function sortSessionsByDay(sessions: FreePlanSession[]): FreePlanSession[] {
  return [...sessions].sort((a, b) => a.dayIndex - b.dayIndex || a.title.localeCompare(b.title));
}

export function computeWeekMetrics(sessions: FreePlanSession[]): FreePlanWeekMetrics {
  const metrics: FreePlanWeekMetrics = {
    runs: 0,
    lifts: 0,
    mobility: 0,
    strength: 0,
    conditioning: 0,
    recovery: 0,
    hybrid: 0,
    challenge: 0,
    totalSessions: sessions.length,
  };

  for (const s of sessions) {
    switch (s.category) {
      case "Run":
        metrics.runs += 1;
        break;
      case "Strength":
        metrics.strength += 1;
        metrics.lifts += 1;
        break;
      case "Mobility":
        metrics.mobility += 1;
        break;
      case "Hybrid":
        metrics.hybrid += 1;
        metrics.conditioning += 1;
        break;
      case "Conditioning":
        metrics.conditioning += 1;
        break;
      case "Recovery":
        metrics.recovery += 1;
        break;
      case "Challenge":
        metrics.challenge += 1;
        break;
      default:
        break;
    }
  }

  return metrics;
}

export function metricsFromHybrid75Meta(meta: Hybrid75PlanMeta | null | undefined): Pick<
  FreePlanWeekMetrics,
  "runs" | "lifts" | "mobility"
> | null {
  if (!meta?.scheduled_counts) return null;
  return {
    runs: meta.scheduled_counts.runs,
    lifts: meta.scheduled_counts.lifts,
    mobility: meta.scheduled_counts.mobility,
  };
}

export function buildTrainingSplit(
  sessions: FreePlanSession[],
  isHybrid75: boolean
): TrainingSplitSlice[] {
  const metrics = computeWeekMetrics(sessions);

  if (isHybrid75) {
    const slices: TrainingSplitSlice[] = [
      { label: "Run", sessions: metrics.runs, percentage: 0, color: "bg-[#F4D23C]" },
      { label: "Lift", sessions: metrics.lifts, percentage: 0, color: "bg-white" },
      { label: "Mobility", sessions: metrics.mobility, percentage: 0, color: "bg-zinc-400" },
      { label: "Challenge", sessions: metrics.challenge, percentage: 0, color: "bg-amber-600" },
    ].filter((s) => s.sessions > 0);

    const total = slices.reduce((acc, s) => acc + s.sessions, 0) || 1;
    return slices.map((s) => ({ ...s, percentage: Math.round((s.sessions / total) * 100) }));
  }

  const standardSlices: TrainingSplitSlice[] = [
    { label: "Run", sessions: metrics.runs, percentage: 0, color: "bg-[#F4D23C]" },
    { label: "Strength", sessions: metrics.strength, percentage: 0, color: "bg-white" },
    {
      label: "Conditioning",
      sessions: metrics.conditioning + metrics.hybrid,
      percentage: 0,
      color: "bg-zinc-500",
    },
    {
      label: "Mobility / Recovery",
      sessions: metrics.mobility + metrics.recovery,
      percentage: 0,
      color: "bg-zinc-700",
    },
  ].filter((s) => s.sessions > 0);

  const total = standardSlices.reduce((acc, s) => acc + s.sessions, 0) || 1;
  return standardSlices.map((s) => ({ ...s, percentage: Math.round((s.sessions / total) * 100) }));
}

export function buildWeekGrid(sessions: FreePlanSession[]): Array<{
  day: string;
  label: string;
  category: FreePlanSessionCategory | "Rest";
  session?: FreePlanSession;
}> {
  const sorted = sortSessionsByDay(sessions);
  const byDay = new Map<number, FreePlanSession>();

  for (const s of sorted) {
    if (!byDay.has(s.dayIndex)) byDay.set(s.dayIndex, s);
  }

  return DAY_ORDER.map((day, index) => {
    const session = byDay.get(index);
    return {
      day,
      label: day,
      category: session?.category ?? "Rest",
      session,
    };
  });
}

export function getChallengeFocusLabel(
  session: FreePlanSession,
  sessions: FreePlanSession[]
): string | null {
  if (!session.hybrid75Role || session.hybrid75Role === "challenge") return null;

  const sorted = sortSessionsByDay(sessions);
  const roleSessions = sorted.filter((s) => s.hybrid75Role === session.hybrid75Role);
  const position = roleSessions.findIndex((s) => s.scrollId === session.scrollId) + 1;
  if (position <= 0) return null;

  const targets = { run: 3, strength: 3, mobility: 1 } as const;
  const labels = { run: "Run", strength: "Lift", mobility: "Mobility" } as const;

  return `Challenge focus: ${labels[session.hybrid75Role]} ${position} of ${targets[session.hybrid75Role]}`;
}

export function getNextSession(sessions: FreePlanSession[]): FreePlanSession | null {
  const sorted = sortSessionsByDay(sessions);
  return sorted[0] ?? null;
}

export const COMMUNITY_UPGRADE_URL = "https://plan.hybrid-365.com/community";
