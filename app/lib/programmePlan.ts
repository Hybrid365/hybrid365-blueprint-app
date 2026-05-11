/** True when plan_json has a non-empty schedule array (engine output). */
export function hasMeaningfulPlanJson(plan: unknown): boolean {
  if (plan == null) return false;
  if (typeof plan !== "object") return false;
  const p = plan as Record<string, unknown>;
  const schedule = p.schedule;
  return Array.isArray(schedule) && schedule.length > 0;
}
