"use client";

import { useCallback, useState } from "react";
import { saveHyroxAthleteSessionLogAction } from "@/app/lib/hyroxAthleteSessionLogAction";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import { useAthletePortal } from "./athletePortalContext";

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

function authFailureMessage(serverAuthConfirmed: boolean, detail?: string): string {
  if (serverAuthConfirmed) {
    return (
      detail ??
      "Could not save — your portal session is active but the save request failed. Reload and try again."
    );
  }
  return detail ?? "Not signed in";
}

async function saveViaApi(params: HyroxSessionLogSaveParams): Promise<SaveResponse> {
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
  return (await res.json()) as SaveResponse;
}

export function useHyroxSessionLog() {
  const { serverAuthConfirmed } = useAthletePortal();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastVia, setLastVia] = useState<"server" | "api" | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const saveSessionLog = useCallback(
    async (params: HyroxSessionLogSaveParams) => {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      setLastVia(null);

      const applyApiFallback = async (serverError?: string) => {
        const apiJson = await saveViaApi(params);
        if (apiJson.success) {
          setLastVia("api");
          setSuccessMessage(apiJson.message ?? "Saved.");
          return apiJson.session ?? null;
        }
        setError(authFailureMessage(serverAuthConfirmed, apiJson.error ?? serverError));
        return null;
      };

      try {
        const serverResult = await saveHyroxAthleteSessionLogAction({
          programmeSessionId: params.programmeSessionId,
          completed: params.completed,
          rpe: params.feedback?.rpe,
          notes: params.feedback?.notes,
          modifications: params.feedback?.modifications,
          score: params.feedback?.score,
        });

        if (serverResult.success) {
          setLastVia("server");
          setSuccessMessage(serverResult.message ?? "Saved.");
          return serverResult.session ?? null;
        }

        if (serverResult.code === "NO_AUTH" && serverAuthConfirmed) {
          return applyApiFallback(serverResult.error);
        }

        setError(serverResult.error ?? "Could not save session log.");
        return null;
      } catch {
        if (serverAuthConfirmed) {
          try {
            return await applyApiFallback();
          } catch {
            setError("Network error — could not save. Try again.");
            return null;
          }
        }
        setError("Network error — could not save. Try again.");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [serverAuthConfirmed]
  );

  return {
    saving,
    error,
    successMessage,
    clearMessages,
    saveSessionLog,
    setSuccessMessage,
    setError,
    lastVia,
  };
}
