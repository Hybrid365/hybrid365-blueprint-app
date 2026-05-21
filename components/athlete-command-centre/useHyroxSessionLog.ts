"use client";

import { useCallback, useState } from "react";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";

export type HyroxSessionLogForm = {
  completed: boolean;
  rpe: string;
  notes: string;
  modifications: string;
  score: string;
};

export type HyroxSessionLogSaveParams = {
  programmeSessionId: string;
  completed?: boolean;
  feedback?: Partial<HyroxSessionLogForm>;
};

type SaveResponse = {
  success?: boolean;
  error?: string;
  code?: string;
  message?: string;
  session?: HyroxSession;
};

export function useHyroxSessionLog() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const saveSessionLog = useCallback(async (params: HyroxSessionLogSaveParams) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/hyrox/athlete/session-log", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programmeSessionId: params.programmeSessionId,
          completed: params.completed,
          rpe: params.feedback?.rpe,
          notes: params.feedback?.notes,
          modifications: params.feedback?.modifications,
          score: params.feedback?.score,
        }),
      });
      const json = (await res.json()) as SaveResponse;
      if (!res.ok || !json.success) {
        setError(json.error ?? "Could not save session log.");
        return null;
      }
      setSuccessMessage(json.message ?? "Saved.");
      return json.session ?? null;
    } catch {
      setError("Network error — could not save. Try again.");
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    saving,
    error,
    successMessage,
    clearMessages,
    saveSessionLog,
    setSuccessMessage,
    setError,
  };
}
