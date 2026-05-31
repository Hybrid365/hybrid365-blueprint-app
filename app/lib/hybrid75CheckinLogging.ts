import { getWeekStartDate } from "./hybrid75HabitLogging";

export type Hybrid75WeeklyCheckin = {
  id: string;
  plan_id: string;
  email: string | null;
  name: string | null;
  week_start: string;
  sessions_completed: number | null;
  proof_posts: number | null;
  energy_score: number | null;
  recovery_score: number | null;
  soreness_score: number | null;
  biggest_win: string | null;
  biggest_struggle: string | null;
  support_needed: string | null;
  interested_full_programme: boolean | null;
  created_at: string;
  updated_at: string;
};

export type Hybrid75CheckinUpsertPayload = {
  plan_id: string;
  email?: string;
  name?: string;
  week_start?: string;
  sessions_completed?: number | null;
  proof_posts?: number | null;
  energy_score?: number | null;
  recovery_score?: number | null;
  soreness_score?: number | null;
  biggest_win?: string | null;
  biggest_struggle?: string | null;
  support_needed?: string | null;
  interested_full_programme?: boolean | null;
};

export function resolveCheckinWeekStart(payload: Hybrid75CheckinUpsertPayload): string {
  return payload.week_start?.trim() || getWeekStartDate();
}

export function buildCheckinUpsertRow(payload: Hybrid75CheckinUpsertPayload) {
  const weekStart = resolveCheckinWeekStart(payload);

  return {
    plan_id: payload.plan_id.trim(),
    email: payload.email?.trim() || null,
    name: payload.name?.trim() || null,
    week_start: weekStart,
    sessions_completed:
      typeof payload.sessions_completed === "number" ? payload.sessions_completed : null,
    proof_posts: typeof payload.proof_posts === "number" ? payload.proof_posts : null,
    energy_score: typeof payload.energy_score === "number" ? payload.energy_score : null,
    recovery_score: typeof payload.recovery_score === "number" ? payload.recovery_score : null,
    soreness_score: typeof payload.soreness_score === "number" ? payload.soreness_score : null,
    biggest_win: payload.biggest_win?.trim() || null,
    biggest_struggle: payload.biggest_struggle?.trim() || null,
    support_needed: payload.support_needed?.trim() || null,
    interested_full_programme:
      typeof payload.interested_full_programme === "boolean"
        ? payload.interested_full_programme
        : null,
  };
}

export function validateScore(value: unknown, field: string): number | null {
  if (value == null || value === "") return null;
  if (typeof value !== "number" || value < 1 || value > 10) {
    throw new Error(`${field} must be 1-10`);
  }
  return value;
}
