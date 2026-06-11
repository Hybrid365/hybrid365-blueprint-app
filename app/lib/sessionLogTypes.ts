/** Paid community session log — shared types and helpers. */

export const SESSION_LOG_STATUSES = ["completed", "partial", "skipped", "moved"] as const;
export type SessionLogStatus = (typeof SESSION_LOG_STATUSES)[number];

export const SESSION_LOG_SELECT =
  "id, week_number, session_key, session_title, session_day, programme_week_id, session_type, session_status, completed, completed_at, rpe, notes, duration_minutes, distance_km, average_pace, average_hr, load_notes, station_notes, proof_url, pain_or_tightness, raw_log, created_at, updated_at";

export type MemberSessionLogRecord = {
  id: string;
  week_number: number;
  session_key: string;
  session_title: string | null;
  session_day: string | null;
  programme_week_id?: string | null;
  session_type?: string | null;
  session_status?: SessionLogStatus | null;
  completed: boolean;
  completed_at: string | null;
  rpe: number | null;
  notes: string | null;
  duration_minutes?: number | null;
  distance_km?: number | null;
  average_pace?: string | null;
  average_hr?: number | null;
  load_notes?: string | null;
  station_notes?: string | null;
  proof_url?: string | null;
  pain_or_tightness?: string | null;
  raw_log?: Record<string, unknown> | null;
};

export type SessionLogUpsertPayload = {
  programme_instance_id: string;
  programme_week_id?: string | null;
  week_number: number;
  session_key: string;
  session_title: string;
  session_day: string;
  session_type?: string | null;
  session_status: SessionLogStatus;
  completed?: boolean;
  rpe?: number | null;
  notes?: string | null;
  duration_minutes?: number | null;
  distance_km?: number | null;
  average_pace?: string | null;
  average_hr?: number | null;
  load_notes?: string | null;
  station_notes?: string | null;
  proof_url?: string | null;
  pain_or_tightness?: string | null;
  raw_log?: Record<string, unknown> | null;
};

export function resolveCompletedFromStatus(status: SessionLogStatus): boolean {
  return status === "completed";
}

export function isSessionLogComplete(
  log: { completed?: boolean; session_status?: SessionLogStatus | string | null } | null | undefined
): boolean {
  if (!log) return false;
  if (log.session_status === "completed") return true;
  if (log.session_status === "partial" || log.session_status === "skipped" || log.session_status === "moved") {
    return false;
  }
  return Boolean(log.completed);
}

export function sessionLogStatusFromRecord(
  log: { completed?: boolean; session_status?: SessionLogStatus | string | null } | null | undefined
): SessionLogStatus | null {
  if (!log) return null;
  const s = log.session_status;
  if (s && SESSION_LOG_STATUSES.includes(s as SessionLogStatus)) return s as SessionLogStatus;
  if (log.completed) return "completed";
  return null;
}

export type SessionDisplayState = "complete" | "partial" | "skipped" | "moved" | "today" | "upcoming";

export function resolveSessionDisplayState(args: {
  log: MemberSessionLogRecord | undefined;
  isTodaySession: boolean;
}): SessionDisplayState {
  const status = sessionLogStatusFromRecord(args.log);
  if (status === "completed") return "complete";
  if (status === "partial") return "partial";
  if (status === "skipped") return "skipped";
  if (status === "moved") return "moved";
  if (args.isTodaySession) return "today";
  return "upcoming";
}

export const SESSION_DISPLAY_LABELS: Record<SessionDisplayState, string> = {
  complete: "Complete",
  partial: "Partial",
  skipped: "Skipped",
  moved: "Moved",
  today: "Today",
  upcoming: "Upcoming",
};
