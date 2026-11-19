import { getProgressionFamily } from "@/app/lib/progressionFamilies";

/**
 * Future-week edits stay on the published family graph.
 * Sled, lunges, burpee broad jump and farmers have no graph, so they are not stepped.
 */

export const TRACK_PROGRESSION_FAMILIES = ["threshold_volume_a", "wall_ball_durability_a"] as const;

export type TrackDecision = "KEEP" | "REPEAT" | "PROGRESS" | "REDUCE" | "DELOAD" | "COACH_REQUIRED";

export type WeekRow = {
  day_key: string;
  session_date: string;
  title: string;
  kind: string;
  instructions: string[];
  payload: Record<string, unknown>;
};

export type NextEdge = {
  family_id: (typeof TRACK_PROGRESSION_FAMILIES)[number];
  from_block: number;
  to_block: number;
  from_title: string;
  to_title: string;
  to_main: string[];
  to_value: number | null;
  unit: "min" | "reps";
};

export function publishedEdge(familyId: string, fromTitle: string, direction: "progress" | "reduce"): NextEdge | null {
  if (!TRACK_PROGRESSION_FAMILIES.includes(familyId as (typeof TRACK_PROGRESSION_FAMILIES)[number])) return null;
  const family = getProgressionFamily(familyId);
  const current = family?.variants.find((variant) => variant.title === fromTitle);
  if (!family || !current) return null;
  const toBlock = direction === "progress" ? current.block_week + 1 : current.block_week - 1;
  const next = family.variants.find((variant) => variant.block_week === toBlock);
  if (!next || toBlock < 1 || toBlock > 4) return null;
  const minutes = next.marker.threshold_total_minutes;
  const reps = next.marker.hyrox_station_density;
  const wall = familyId === "wall_ball_durability_a";
  return {
    family_id: familyId as NextEdge["family_id"],
    from_block: current.block_week,
    to_block: next.block_week,
    from_title: current.title,
    to_title: next.title,
    to_main: next.main,
    to_value: wall ? (typeof reps === "number" ? reps : null) : typeof minutes === "number" ? minutes : null,
    unit: wall ? "reps" : "min",
  };
}

export function applyEdges(rows: WeekRow[], edges: NextEdge[]): WeekRow[] {
  const pending = [...edges];
  return rows.map((row) => {
    const family = String(row.payload.family ?? "");
    const index = pending.findIndex((edge) => edge.family_id === family && edge.from_title === row.title);
    if (index < 0) return row;
    const edge = pending.splice(index, 1)[0]!;
    const load =
      edge.to_value == null
        ? row.payload.load
        : [
            {
              metricId: edge.unit === "min" ? "threshold_min" : "wall_balls",
              label: edge.unit === "min" ? "Threshold" : "Wall balls",
              value: edge.to_value,
              unit: edge.unit,
            },
          ];
    return {
      ...row,
      title: edge.to_title,
      instructions: edge.to_main,
      payload: {
        ...row.payload,
        family: edge.family_id,
        stage: edge.to_block,
        main: edge.to_main,
        marker: {
          ...(typeof row.payload.marker === "object" && row.payload.marker ? row.payload.marker : {}),
          ...(edge.unit === "min" ? { threshold_total_minutes: edge.to_value } : { hyrox_station_density: edge.to_value }),
        },
        load,
      },
    };
  });
}

export function composeNextWeek(input: {
  decision: "KEEP" | "REPEAT" | "PROGRESS" | "REDUCE";
  source: WeekRow[];
  current: WeekRow[];
  edges: NextEdge[];
}): WeekRow[] {
  if (input.decision === "KEEP") return input.source.map((row) => ({ ...row, payload: { ...row.payload } }));
  if (input.decision === "REPEAT") {
    const currentByDay = new Map(input.current.map((row) => [row.day_key, row]));
    return input.source.map((row) => {
      const today = currentByDay.get(row.day_key);
      if (!today) return { ...row, payload: { ...row.payload } };
      return {
        ...row,
        title: today.title,
        kind: today.kind,
        instructions: [...today.instructions],
        payload: { ...today.payload, weekNumber: row.payload.weekNumber, stage: today.payload.stage ?? null },
      };
    });
  }
  return applyEdges(input.source, input.edges);
}

export function athleteWhy(decision: TrackDecision, progressed: string | null): string {
  if (decision === "PROGRESS") {
    return progressed
      ? `Repeated successful ${progressed} sessions, and recovery stayed good.`
      : "Repeated successful sessions, and recovery stayed good.";
  }
  if (decision === "REPEAT") return "Next week repeats this week until recovery is clearly good.";
  if (decision === "REDUCE") return "Important sessions were missed, so next week takes a published step back.";
  if (decision === "DELOAD") return "This is a lighter week. It stays as written.";
  if (decision === "COACH_REQUIRED") return "Next week needs a coach before it changes.";
  return "Next week stays on the plan already written. One good session is not enough to add work.";
}

function thresholdMinutes(row: WeekRow): number | null {
  const marker = row.payload.marker as { threshold_total_minutes?: number } | undefined;
  if (typeof marker?.threshold_total_minutes === "number") return marker.threshold_total_minutes;
  const load = Array.isArray(row.payload.load) ? row.payload.load : [];
  const fromLoad = load.find((item) => (item as { metricId?: string }).metricId === "threshold_min") as { value?: number } | undefined;
  if (typeof fromLoad?.value === "number") return fromLoad.value;
  if (row.payload.family !== "threshold_volume_a" && !/threshold/i.test(row.title)) return null;
  const match = row.title.match(/(\d+)\s*[x×]\s*(\d+)\s*min/i);
  if (!match) return null;
  return Number(match[1]) * Number(match[2]);
}

function wallBallReps(row: WeekRow): number | null {
  if (row.payload.family !== "wall_ball_durability_a" && !/wall ball/i.test(row.title)) return null;
  const marker = row.payload.marker as { hyrox_station_density?: number } | undefined;
  if (typeof marker?.hyrox_station_density === "number") return marker.hyrox_station_density;
  const match = row.title.match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (!match) return null;
  return Number(match[1]) * Number(match[2]);
}

function weekRunKm(rows: WeekRow[]): number | null {
  for (const row of rows) {
    const value = row.payload.weekRunKm;
    if (typeof value === "number") return value;
  }
  return null;
}

export function workloadDelta(current: WeekRow[], next: WeekRow[]): Array<{ label: string; current: string; next: string }> {
  const lines: Array<{ label: string; current: string; next: string }> = [];
  const thresholdNow = current.reduce((sum, row) => sum + (thresholdMinutes(row) ?? 0), 0);
  const thresholdNext = next.reduce((sum, row) => sum + (thresholdMinutes(row) ?? 0), 0);
  const thresholdCount = current.filter((row) => thresholdMinutes(row) != null).length + next.filter((row) => thresholdMinutes(row) != null).length;
  if (thresholdCount > 0 && thresholdNow > 0 && thresholdNext > 0) {
    lines.push({ label: "Threshold", current: `${thresholdNow} min`, next: `${thresholdNext} min` });
  }
  const runNow = weekRunKm(current);
  const runNext = weekRunKm(next);
  if (runNow != null && runNext != null) {
    lines.push({ label: "Run volume", current: `${runNow} km`, next: `${runNext} km` });
  }
  const wallNow = current.reduce((sum, row) => sum + (wallBallReps(row) ?? 0), 0);
  const wallNext = next.reduce((sum, row) => sum + (wallBallReps(row) ?? 0), 0);
  if (wallNow > 0 && wallNext > 0) {
    lines.push({ label: "Wall balls", current: `${wallNow} reps`, next: `${wallNext} reps` });
  }
  return lines;
}

/** Week 12 ends a block. The next block is a proposal only. */
export function nextBlockContract(weekNumber: number, openDomains: string[]) {
  if (weekNumber !== 12) {
    return { due: false as const, published: false as const, persisted: false as const };
  }
  return {
    due: true as const,
    published: false as const,
    persisted: false as const,
    mutationEnabled: false as const,
    anchors: "Re-check the running anchor, the race anchor and any station that is no longer current.",
    reassessment: openDomains,
    proposal: "A following block can be drafted from the same generator. It is not published and it is not written.",
  };
}

export const GENERAL_HYBRID_THRESHOLD_FLAKE = {
  profile: "Beginner, general hybrid fitness, 3 days, no 5K.",
  symptom: "Some draws contain no session whose title or first tag says threshold, so a test that looks for that session finds nothing.",
  cause:
    "That profile does not use the HYROX Pro Tuesday / Saturday / Sunday anchors. Threshold is one of the flexible choices, and a draw can fill three days without it. When a session is labelled threshold, it still has a run prescription. The miss is the session, not an empty prescription.",
  status: "Separate Hybrid Performance blocker. The test is still running. This Track work does not change that generator path.",
} as const;
