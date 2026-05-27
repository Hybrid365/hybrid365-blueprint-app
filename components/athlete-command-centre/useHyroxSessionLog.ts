"use client";

import { useCallback, useState } from "react";
import { saveHyroxAthleteSessionLogAction } from "@/app/lib/hyroxAthleteSessionLogAction";
import type { HyroxMutationActorDebug } from "@/app/lib/hyroxAthleteMutationActor";
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
  via?: string;
  reason?: string;
  cookieAuth?: string;
  h365AthleteSession?: string;
  tokenAuth?: string;
  sessionBelongsToAthlete?: boolean;
  saved?: boolean;
};

export type SessionLogAttemptDebug = {
  lastLogAttemptVia:
    | "server"
    | "api-cookie"
    | "h365-athlete-session"
    | "api-signed-token"
    | "none";
  serverActionResult: "success" | "error" | "no-auth" | "not-attempted";
  cookieAuth: "succeeded" | "failed" | "not-attempted";
  h365AthleteSession: "valid" | "invalid" | "missing" | "not-attempted";
  tokenAuth:
    | "missing"
    | "invalid"
    | "expired"
    | "mismatch"
    | "succeeded"
    | "not-needed"
    | "not-attempted";
  serverError?: string;
  apiError?: string;
  sessionId?: string;
  sessionBelongsToAthlete?: boolean;
};

function formatStructuredError(debug: SessionLogAttemptDebug, detail: string): string {
  if (process.env.NODE_ENV !== "development") {
    return detail;
  }
  return [
    detail,
    `cookieAuth: ${debug.cookieAuth}`,
    `h365AthleteSession: ${debug.h365AthleteSession}`,
    `tokenAuth: ${debug.tokenAuth}`,
    `via: ${debug.lastLogAttemptVia}`,
    debug.sessionId ? `session: ${debug.sessionId}` : null,
    debug.sessionBelongsToAthlete !== undefined
      ? `sessionBelongsToAthlete: ${debug.sessionBelongsToAthlete ? "yes" : "no"}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function mapApiVia(via?: string): SessionLogAttemptDebug["lastLogAttemptVia"] {
  if (via === "h365-athlete-session") return "h365-athlete-session";
  if (via === "api-signed-token") return "api-signed-token";
  return "api-cookie";
}

async function saveViaApi(
  params: HyroxSessionLogSaveParams,
  expectedAthleteId: string | null,
  portalMutationToken: string | null
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
      portalMutationToken,
    }),
  });
  const json = (await res.json()) as SaveResponse;
  if (!res.ok && !json.error) {
    return {
      success: false,
      error: `HTTP ${res.status}`,
      code: "HTTP_ERROR",
      via: json.via ?? "api-cookie",
    };
  }
  return json;
}

export function useHyroxSessionLog() {
  const { serverAuthConfirmed, portalAthlete, portalMutationToken } = useAthletePortal();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastVia, setLastVia] = useState<SessionLogAttemptDebug["lastLogAttemptVia"]>("none");
  const [attemptDebug, setAttemptDebug] = useState<SessionLogAttemptDebug>({
    lastLogAttemptVia: "none",
    serverActionResult: "not-attempted",
    cookieAuth: "not-attempted",
    h365AthleteSession: "not-attempted",
    tokenAuth: "not-attempted",
  });
  const [serverAuthDebug, setServerAuthDebug] = useState<HyroxMutationActorDebug | null>(
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
      setLastVia("none");

      const debugBase: SessionLogAttemptDebug = {
        lastLogAttemptVia: "none",
        serverActionResult: "not-attempted",
        cookieAuth: "not-attempted",
        h365AthleteSession: "not-attempted",
        tokenAuth: portalMutationToken ? "not-attempted" : "missing",
        sessionId: params.programmeSessionId,
      };

      const applyApiResult = (
        apiJson: SaveResponse,
        serverError?: string,
        serverCode?: string
      ): HyroxSession | null => {
        const via = mapApiVia(apiJson.via);
        const h365Status =
          (apiJson.h365AthleteSession as SessionLogAttemptDebug["h365AthleteSession"]) ??
          (via === "h365-athlete-session" ? "valid" : "not-attempted");

        if (apiJson.success) {
          setLastVia(via);
          setAttemptDebug({
            ...debugBase,
            lastLogAttemptVia: via,
            serverActionResult:
              serverCode === "NO_AUTH" || serverCode === "NO_USER"
                ? "no-auth"
                : "error",
            cookieAuth:
              apiJson.cookieAuth === "succeeded"
                ? "succeeded"
                : apiJson.cookieAuth === "failed"
                  ? "failed"
                  : via === "h365-athlete-session" || via === "api-signed-token"
                    ? "failed"
                    : "succeeded",
            h365AthleteSession: h365Status,
            tokenAuth:
              (apiJson.tokenAuth as SessionLogAttemptDebug["tokenAuth"]) ?? "not-needed",
            sessionBelongsToAthlete: apiJson.sessionBelongsToAthlete ?? true,
          });
          setSuccessMessage(
            process.env.NODE_ENV === "development"
              ? via === "h365-athlete-session"
                ? `${apiJson.message ?? "Saved."} (h365 athlete session)`
                : via === "api-signed-token"
                  ? `${apiJson.message ?? "Saved."} (signed portal token)`
                  : (apiJson.message ?? "Session saved.")
              : "Session saved."
          );
          return apiJson.session ?? null;
        }

        const cookieFailed =
          apiJson.cookieAuth === "failed" || apiJson.code === "NO_AUTH";
        const tokenFailed =
          apiJson.tokenAuth === "invalid" ||
          apiJson.tokenAuth === "expired" ||
          apiJson.tokenAuth === "mismatch" ||
          apiJson.tokenAuth === "missing";

        setLastVia(via);
        setAttemptDebug({
          ...debugBase,
          lastLogAttemptVia: via,
          serverActionResult:
            serverCode === "NO_AUTH" || serverCode === "NO_USER"
              ? "no-auth"
              : "error",
          cookieAuth: cookieFailed ? "failed" : "not-attempted",
          h365AthleteSession: h365Status,
          tokenAuth: (apiJson.tokenAuth as SessionLogAttemptDebug["tokenAuth"]) ?? "invalid",
          serverError,
          apiError: apiJson.error,
          sessionBelongsToAthlete: apiJson.sessionBelongsToAthlete ?? false,
        });

        const userMessage = apiJson.error ?? serverError ?? "Could not save session log.";
        setError(
          process.env.NODE_ENV === "development"
            ? formatStructuredError(
                {
                  ...debugBase,
                  lastLogAttemptVia: via,
                  cookieAuth: cookieFailed ? "failed" : "not-attempted",
                  h365AthleteSession: h365Status,
                  tokenAuth:
                    (apiJson.tokenAuth as SessionLogAttemptDebug["tokenAuth"]) ?? "invalid",
                },
                userMessage
              )
            : userMessage
        );
        return null;
      };

      const runApiWithToken = async (
        serverError?: string,
        serverCode?: string
      ): Promise<HyroxSession | null> => {
        const apiJson = await saveViaApi(
          params,
          portalAthlete?.id ?? null,
          portalMutationToken
        );
        return applyApiResult(apiJson, serverError, serverCode);
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
          const serverVia =
            serverResult.via === "h365-athlete-session"
              ? "h365-athlete-session"
              : "server";
          setLastVia(serverVia);
          setAttemptDebug({
            ...debugBase,
            lastLogAttemptVia: serverVia,
            serverActionResult: "success",
            cookieAuth:
              serverResult.via === "supabase-cookie" ? "succeeded" : "failed",
            h365AthleteSession:
              serverResult.via === "h365-athlete-session" ? "valid" : "not-attempted",
            tokenAuth: "not-needed",
          });
          setSuccessMessage(
            process.env.NODE_ENV === "development"
              ? serverResult.via === "h365-athlete-session"
                ? `${serverResult.message ?? "Saved."} (h365 athlete session)`
                : (serverResult.message ?? "Session saved.")
              : "Session saved."
          );
          return serverResult.session ?? null;
        }

        const serverIsAuth =
          serverResult.code === "NO_AUTH" ||
          serverResult.code === "NO_USER" ||
          serverResult.code === "NO_ATHLETE";

        if (serverAuthConfirmed || serverIsAuth) {
          return runApiWithToken(serverResult.error, serverResult.code);
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
        if (serverAuthConfirmed && portalMutationToken) {
          return runApiWithToken(`[server action throw] ${message}`, "THROW");
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
    [serverAuthConfirmed, portalAthlete?.id, portalMutationToken]
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
