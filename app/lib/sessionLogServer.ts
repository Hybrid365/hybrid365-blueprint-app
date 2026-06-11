import {
  resolveCompletedFromStatus,
  SESSION_LOG_SELECT,
  SESSION_LOG_STATUSES,
  type MemberSessionLogRecord,
  type SessionLogStatus,
  type SessionLogUpsertPayload,
} from "@/app/lib/sessionLogTypes";

export { SESSION_LOG_SELECT };

export function parseSessionLogStatus(value: unknown): SessionLogStatus | null {
  if (typeof value !== "string") return null;
  return SESSION_LOG_STATUSES.includes(value as SessionLogStatus)
    ? (value as SessionLogStatus)
    : null;
}

export function buildSessionLogUpsertRow(
  userId: string,
  payload: SessionLogUpsertPayload
): Record<string, unknown> {
  const status =
    parseSessionLogStatus(payload.session_status) ??
    (payload.completed ? "completed" : "partial");
  const completed =
    payload.completed !== undefined ? payload.completed : resolveCompletedFromStatus(status);

  return {
    user_id: userId,
    programme_instance_id: payload.programme_instance_id,
    programme_week_id: payload.programme_week_id ?? null,
    week_number: payload.week_number,
    session_key: payload.session_key,
    session_title: payload.session_title,
    session_day: payload.session_day,
    session_type: payload.session_type?.trim() || null,
    session_status: status,
    completed,
    completed_at: completed ? new Date().toISOString() : null,
    rpe: payload.rpe ?? null,
    notes: payload.notes?.trim() || null,
    duration_minutes: payload.duration_minutes ?? null,
    distance_km: payload.distance_km ?? null,
    average_pace: payload.average_pace?.trim() || null,
    average_hr: payload.average_hr ?? null,
    load_notes: payload.load_notes?.trim() || null,
    station_notes: payload.station_notes?.trim() || null,
    proof_url: payload.proof_url?.trim() || null,
    pain_or_tightness: payload.pain_or_tightness?.trim() || null,
    raw_log: payload.raw_log && typeof payload.raw_log === "object" ? payload.raw_log : {},
  };
}

export function validateSessionLogPayload(
  payload: Partial<SessionLogUpsertPayload>
): { ok: true; data: SessionLogUpsertPayload } | { ok: false; error: string } {
  if (!payload.programme_instance_id) return { ok: false, error: "programme_instance_id is required" };
  if (!payload.session_key) return { ok: false, error: "session_key is required" };
  if (!payload.session_title) return { ok: false, error: "session_title is required" };
  if (!payload.session_day) return { ok: false, error: "session_day is required" };
  if (typeof payload.week_number !== "number") return { ok: false, error: "week_number is required" };
  if (payload.week_number < 1 || payload.week_number > 12) return { ok: false, error: "Invalid week_number" };

  const status =
    parseSessionLogStatus(payload.session_status) ??
    (typeof payload.completed === "boolean"
      ? payload.completed
        ? "completed"
        : "partial"
      : null);
  if (!status) return { ok: false, error: "session_status is required" };

  if (payload.rpe != null && (payload.rpe < 1 || payload.rpe > 10)) {
    return { ok: false, error: "rpe must be 1-10" };
  }
  if (payload.average_hr != null && (payload.average_hr < 40 || payload.average_hr > 230)) {
    return { ok: false, error: "average_hr out of range" };
  }

  return {
    ok: true,
    data: {
      programme_instance_id: payload.programme_instance_id,
      programme_week_id: payload.programme_week_id ?? null,
      week_number: payload.week_number,
      session_key: payload.session_key,
      session_title: payload.session_title,
      session_day: payload.session_day,
      session_type: payload.session_type ?? null,
      session_status: status,
      completed: payload.completed,
      rpe: payload.rpe ?? null,
      notes: payload.notes ?? null,
      duration_minutes: payload.duration_minutes ?? null,
      distance_km: payload.distance_km ?? null,
      average_pace: payload.average_pace ?? null,
      average_hr: payload.average_hr ?? null,
      load_notes: payload.load_notes ?? null,
      station_notes: payload.station_notes ?? null,
      proof_url: payload.proof_url ?? null,
      pain_or_tightness: payload.pain_or_tightness ?? null,
      raw_log: payload.raw_log ?? {},
    },
  };
}

export type { MemberSessionLogRecord };
