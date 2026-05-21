import type { HyroxJson } from "@/app/lib/hyroxDatabaseTypes";

export type HyroxAthleteSessionFeedback = {
  rpe?: string | null;
  notes?: string | null;
  modifications?: string | null;
  score?: string | null;
  loggedAt?: string | null;
};

export function parseHyroxAthleteSessionFeedback(
  raw: HyroxJson | null | undefined
): HyroxAthleteSessionFeedback {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  return {
    rpe: o.rpe != null ? String(o.rpe) : null,
    notes: typeof o.notes === "string" ? o.notes : null,
    modifications: typeof o.modifications === "string" ? o.modifications : null,
    score: typeof o.score === "string" ? o.score : null,
    loggedAt: typeof o.loggedAt === "string" ? o.loggedAt : null,
  };
}

export function buildHyroxAthleteSessionFeedback(
  current: HyroxJson | null | undefined,
  patch: HyroxAthleteSessionFeedback
): HyroxJson {
  const base = parseHyroxAthleteSessionFeedback(current);
  return {
    ...base,
    ...patch,
    loggedAt: patch.loggedAt ?? new Date().toISOString(),
  } as HyroxJson;
}
