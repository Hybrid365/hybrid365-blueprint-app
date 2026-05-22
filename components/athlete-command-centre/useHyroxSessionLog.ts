"use client";

import { useCallback, useState } from "react";
import { saveHyroxAthleteSessionLogAction } from "@/app/lib/hyroxAthleteSessionLogAction";
import type { HyroxMutationAuthDebug } from "@/app/lib/hyroxAthleteMutationAuth";
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
  source?: string;
  reason?: string;
};

export type SessionLogAttemptDebug = {
  lastLogAttemptVia: "server" | "api" | "none";
  serverActionResult: "success" | "error" | "no-auth" | "not-attempted";
  apiResult: "success" | "error" | "no-auth" | "not-attempted";
  serverError?: string;
  apiError?: string;
  sessionId?: string;
};

function formatSaveError(
  via: "server" | "api",
  serverAuthConfirmed: boolean,
  portalAthleteId: string | null,
  detail?: string,
  code?: string
): string {
  const prefix = via === "server" ? "Server action" : "API";
  if (serverAuthConfirmed && portalAthleteId) {
    return (
      `${prefix} could not save (portal shows athlete ${portalAthleteId.slice(0, 8)}…). ` +
      (detail ?? "Auth/session mismatch.") +
      (code ? ` [${code}]` : "") +
      " Try reloading the page."
    );
  }
  if (detail?.includes("Not signed in")) {
    return `${prefix}: not signed in${code ? ` (${code})` : ""}.`;
  }
  return detail ?? `${prefix}: could not save session log.`;
}

async function saveViaApi(
  params: HyroxSessionLogSaveParams,
  expectedAthleteId: string | null
): Promise<SaveResponse> {
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
      expectedAthleteId,
    }),
  });
  const json = (await res.json()) as SaveResponse;
  if (!res.ok && !json.error) {
    return { success: false, error: `HTTP ${res.status}`, code: "HTTP_ERROR", source: "api" };
  }
  return { ...json, source: "api" };
}

export function useHyroxSessionLog() {
  const { serverAuthConfirmed, portalAthlete } = useAthletePortal();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastVia, setLastVia] = useState<"server" | "api" | null>(null);
  const [attemptDebug, setAttemptDebug] = useState<SessionLogAttemptDebug>({
    lastLogAttemptVia: "none",
    serverActionResult: "not-attempted",
    apiResult: "not-attempted",
  });
  const [serverAuthDebug, setServerAuthDebug] = useState<HyroxMutationAuthDebug | null>(
    null
  );

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

      const debugBase: SessionLogAttemptDebug = {
        lastLogAttemptVia: "none",
        serverActionResult: "not-attempted",
        apiResult: "not-attempted",
        sessionId: params.programmeSessionId,
      };

      const runApiFallback = async (
        serverError?: string,
        serverCode?: string
      ): Promise<HyroxSession | null> => {
        const apiJson = await saveViaApi(params, portalAthlete?.id ?? null);
        if (apiJson.success) {
          setLastVia("api");
          setAttemptDebug({
            ...debugBase,
            lastLogAttemptVia: "api",
            serverActionResult:
              serverCode === "NO_AUTH" || serverCode === "NO_USER"
                ? "no-auth"
                : "error",
            apiResult: "success",
            serverError,
            apiError: undefined,
          });
          setSuccessMessage(apiJson.message ?? "Saved.");
          return apiJson.session ?? null;
        }

        const apiIsAuth =
          apiJson.code === "NO_AUTH" ||
          apiJson.reason === "NO_AUTH_SESSION" ||
          apiJson.error === "Not signed in";

        setAttemptDebug({
          ...debugBase,
          lastLogAttemptVia: "api",
          serverActionResult:
            serverCode === "NO_AUTH" || serverCode === "NO_USER"
              ? "no-auth"
              : "error",
          apiResult: apiIsAuth ? "no-auth" : "error",
          serverError,
          apiError: apiJson.error,
        });

        setError(
          formatSaveError(
            "api",
            serverAuthConfirmed,
            portalAthlete?.id ?? null,
            apiJson.error ?? serverError,
            apiJson.code ?? apiJson.reason
          )
        );
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
          expectedAthleteId: portalAthlete?.id ?? null,
        });

        setServerAuthDebug(serverResult.authDebug ?? null);

        if (serverResult.success) {
          setLastVia("server");
          setAttemptDebug({
            ...debugBase,
            lastLogAttemptVia: "server",
            serverActionResult: "success",
            apiResult: "not-attempted",
          });
          setSuccessMessage(serverResult.message ?? "Saved.");
          return serverResult.session ?? null;
        }

        const serverIsAuth =
          serverResult.code === "NO_AUTH" ||
          serverResult.code === "NO_USER" ||
          serverResult.code === "NO_ATHLETE";

        if (serverIsAuth || serverAuthConfirmed) {
          return runApiFallback(serverResult.error, serverResult.code);
        }

        setAttemptDebug({
          ...debugBase,
          lastLogAttemptVia: "server",
          serverActionResult: "error",
          serverError: serverResult.error,
        });
        setError(serverResult.error ?? "Could not save session log.");
        return null;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Server action failed";
        if (serverAuthConfirmed) {
          return runApiFallback(`[server action throw] ${message}`, "THROW");
        }
        setAttemptDebug({
          ...debugBase,
          lastLogAttemptVia: "none",
          serverActionResult: "error",
          serverError: message,
        });
        setError(`Server action failed: ${message}`);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [serverAuthConfirmed, portalAthlete?.id]
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
    attemptDebug,
    serverAuthDebug,
  };
}
