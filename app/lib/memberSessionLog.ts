"use client";

import { useState } from "react";
import type { MemberSessionDrawerSession } from "@/app/lib/memberSessionTypes";
import type { MemberSessionLogRecord, SessionLogStatus } from "@/app/lib/sessionLogTypes";
import { sessionLogStatusFromRecord } from "@/app/lib/sessionLogTypes";

export type { MemberSessionLogRecord };

export type SessionLogDraft = {
  session_status: SessionLogStatus;
  rpe: number | null;
  notes: string;
  duration_minutes: string;
  distance_km: string;
  average_pace: string;
  average_hr: string;
  load_notes: string;
  station_notes: string;
  proof_url: string;
  pain_or_tightness: string;
  erg_modality_notes: string;
  hyrox_weakest_part: string;
  hyrox_rounds: string;
};

function emptyDraft(): SessionLogDraft {
  return {
    session_status: "completed",
    rpe: null,
    notes: "",
    duration_minutes: "",
    distance_km: "",
    average_pace: "",
    average_hr: "",
    load_notes: "",
    station_notes: "",
    proof_url: "",
    pain_or_tightness: "",
    erg_modality_notes: "",
    hyrox_weakest_part: "",
    hyrox_rounds: "",
  };
}

function draftFromLog(log: MemberSessionLogRecord | undefined): SessionLogDraft {
  if (!log) return emptyDraft();
  const raw = (log.raw_log ?? {}) as Record<string, unknown>;
  return {
    session_status: sessionLogStatusFromRecord(log) ?? (log.completed ? "completed" : "partial"),
    rpe: log.rpe,
    notes: log.notes ?? "",
    duration_minutes: log.duration_minutes != null ? String(log.duration_minutes) : "",
    distance_km: log.distance_km != null ? String(log.distance_km) : "",
    average_pace: log.average_pace ?? "",
    average_hr: log.average_hr != null ? String(log.average_hr) : "",
    load_notes: log.load_notes ?? "",
    station_notes: log.station_notes ?? "",
    proof_url: log.proof_url ?? "",
    pain_or_tightness: log.pain_or_tightness ?? "",
    erg_modality_notes: typeof raw.erg_modality_notes === "string" ? raw.erg_modality_notes : "",
    hyrox_weakest_part: typeof raw.hyrox_weakest_part === "string" ? raw.hyrox_weakest_part : "",
    hyrox_rounds: typeof raw.hyrox_rounds === "string" ? raw.hyrox_rounds : "",
  };
}

function parseOptionalInt(value: string): number | null {
  const t = value.trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalFloat(value: string): number | null {
  const t = value.trim();
  if (!t) return null;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

export function useMemberSessionLogs(
  programmeInstanceId: string | null,
  initialSessionLogs: MemberSessionLogRecord[]
) {
  const [sessionLogs, setSessionLogs] = useState<Record<string, MemberSessionLogRecord>>(() =>
    Object.fromEntries(initialSessionLogs.map((log) => [log.session_key, log]))
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<MemberSessionDrawerSession | null>(null);
  const [draft, setDraft] = useState<SessionLogDraft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedLog = selectedSession ? sessionLogs[selectedSession.sessionKey] : undefined;

  function openSessionDrawer(session: MemberSessionDrawerSession) {
    const existing = sessionLogs[session.sessionKey];
    setSelectedSession(session);
    setDraft(draftFromLog(existing));
    setSaveError(null);
    setDrawerOpen(true);
  }

  function closeSessionDrawer() {
    setDrawerOpen(false);
  }

  function updateDraft<K extends keyof SessionLogDraft>(key: K, value: SessionLogDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function saveSessionLog(statusOverride?: SessionLogStatus) {
    if (!selectedSession || !programmeInstanceId) return;
    const sessionStatus = statusOverride ?? draft.session_status;
    setSaving(true);
    setSaveError(null);

    const raw_log: Record<string, unknown> = {};
    if (draft.erg_modality_notes.trim()) raw_log.erg_modality_notes = draft.erg_modality_notes.trim();
    if (draft.hyrox_weakest_part.trim()) raw_log.hyrox_weakest_part = draft.hyrox_weakest_part.trim();
    if (draft.hyrox_rounds.trim()) raw_log.hyrox_rounds = draft.hyrox_rounds.trim();

    const body = {
      programme_instance_id: programmeInstanceId,
      week_number: selectedSession.weekNumber,
      session_key: selectedSession.sessionKey,
      session_title: selectedSession.title,
      session_day: selectedSession.day,
      session_type: selectedSession.category,
      session_status: sessionStatus,
      rpe: draft.rpe,
      notes: draft.notes,
      duration_minutes: parseOptionalInt(draft.duration_minutes),
      distance_km: parseOptionalFloat(draft.distance_km),
      average_pace: draft.average_pace.trim() || null,
      average_hr: parseOptionalInt(draft.average_hr),
      load_notes: draft.load_notes.trim() || null,
      station_notes: draft.station_notes.trim() || null,
      proof_url: draft.proof_url.trim() || null,
      pain_or_tightness: draft.pain_or_tightness.trim() || null,
      raw_log,
    };

    const previous = sessionLogs[selectedSession.sessionKey];
    const optimistic: MemberSessionLogRecord = {
      id: previous?.id ?? `optimistic-${selectedSession.sessionKey}`,
      week_number: selectedSession.weekNumber,
      session_key: selectedSession.sessionKey,
      session_title: selectedSession.title,
      session_day: selectedSession.day,
      session_type: selectedSession.category,
      session_status: sessionStatus,
      completed: sessionStatus === "completed",
      completed_at: sessionStatus === "completed" ? new Date().toISOString() : null,
      rpe: draft.rpe,
      notes: draft.notes.trim() || null,
      duration_minutes: body.duration_minutes,
      distance_km: body.distance_km,
      average_pace: body.average_pace,
      average_hr: body.average_hr,
      load_notes: body.load_notes,
      station_notes: body.station_notes,
      proof_url: body.proof_url,
      pain_or_tightness: body.pain_or_tightness,
      raw_log,
    };

    setSessionLogs((prev) => ({ ...prev, [selectedSession.sessionKey]: optimistic }));

    try {
      const res = await fetch("/api/dashboard/session-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Failed to save session");
      }
      const payload = (await res.json()) as { log: MemberSessionLogRecord };
      setSessionLogs((prev) => ({ ...prev, [selectedSession.sessionKey]: payload.log }));
      setDrawerOpen(false);
    } catch (err) {
      setSessionLogs((prev) => {
        if (!previous) {
          const copy = { ...prev };
          delete copy[selectedSession.sessionKey];
          return copy;
        }
        return { ...prev, [selectedSession.sessionKey]: previous };
      });
      setSaveError(err instanceof Error ? err.message : "Unable to save session");
    } finally {
      setSaving(false);
    }
  }

  return {
    sessionLogs,
    setSessionLogs,
    drawerOpen,
    setDrawerOpen,
    selectedSession,
    selectedLog,
    draft,
    updateDraft,
    saving,
    saveError,
    openSessionDrawer,
    closeSessionDrawer,
    saveSessionLog,
    /** @deprecated use draft + saveSessionLog */
    draftRpe: draft.rpe,
    setDraftRpe: (v: number) => updateDraft("rpe", v),
    draftNotes: draft.notes,
    setDraftNotes: (v: string) => updateDraft("notes", v),
  };
}
