/** Parse plan_json when PostgREST returns jsonb as a string. */
export function normalizePlanJson(plan: unknown): unknown {
  if (plan == null) return null;
  if (typeof plan === "string") {
    const trimmed = plan.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return null;
    }
  }
  return plan;
}

/** True when plan_json has a non-empty schedule array (engine output). */
export function hasMeaningfulPlanJson(plan: unknown): boolean {
  const normalized = normalizePlanJson(plan);
  if (normalized == null || typeof normalized !== "object") return false;
  const p = normalized as Record<string, unknown>;
  const schedule = p.schedule;
  return Array.isArray(schedule) && schedule.length > 0;
}
