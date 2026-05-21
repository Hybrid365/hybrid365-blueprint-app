"use client";

import { useState } from "react";
import type { MemberSessionDrawerSession } from "@/app/lib/memberSessionTypes";

export type MemberSessionLogRecord = {
  id: string;
  week_number: number;
  session_key: string;
  session_title: string | null;
  session_day: string | null;
  completed: boolean;
  completed_at: string | null;
  rpe: number | null;
  notes: string | null;
};

export function useMemberSessionLogs(
  programmeInstanceId: string | null,
  initialSessionLogs: MemberSessionLogRecord[]
) {
  const [sessionLogs, setSessionLogs] = useState<Record<string, MemberSessionLogRecord>>(() =>
    Object.fromEntries(initialSessionLogs.map((log) => [log.session_key, log]))
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<MemberSessionDrawerSession | null>(null);
  const [draftRpe, setDraftRpe] = useState<number | null>(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedLog = selectedSession ? sessionLogs[selectedSession.sessionKey] : undefined;

  function openSessionDrawer(session: MemberSessionDrawerSession) {
    const existing = sessionLogs[session.sessionKey];
    setSelectedSession(session);
    setDraftRpe(existing?.rpe ?? null);
    setDraftNotes(existing?.notes ?? "");
    setSaveError(null);
    setDrawerOpen(true);
  }

  function closeSessionDrawer() {
    setDrawerOpen(false);
  }

  async function saveSessionLog(completed: boolean) {
    if (!selectedSession || !programmeInstanceId) return;
    setSaving(true);
    setSaveError(null);
    const optimistic: MemberSessionLogRecord = {
      id: sessionLogs[selectedSession.sessionKey]?.id ?? `optimistic-${selectedSession.sessionKey}`,
      week_number: selectedSession.weekNumber,
      session_key: selectedSession.sessionKey,
      session_title: selectedSession.title,
      session_day: selectedSession.day,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      rpe: draftRpe,
      notes: draftNotes.trim() || null,
    };
    const previous = sessionLogs[selectedSession.sessionKey];
    setSessionLogs((prev) => ({ ...prev, [selectedSession.sessionKey]: optimistic }));
    try {
      const res = await fetch("/api/dashboard/session-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programme_instance_id: programmeInstanceId,
          week_number: selectedSession.weekNumber,
          session_key: selectedSession.sessionKey,
          session_title: selectedSession.title,
          session_day: selectedSession.day,
          completed,
          rpe: draftRpe,
          notes: draftNotes,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Failed to save session");
      }
      const payload = (await res.json()) as { log: MemberSessionLogRecord };
      setSessionLogs((prev) => ({ ...prev, [selectedSession.sessionKey]: payload.log }));
      if (!completed) {
        setDrawerOpen(false);
      }
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
    draftRpe,
    setDraftRpe,
    draftNotes,
    setDraftNotes,
    saving,
    saveError,
    openSessionDrawer,
    closeSessionDrawer,
    saveSessionLog,
  };
}
