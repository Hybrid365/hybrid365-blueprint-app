"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Hybrid75ChallengeSessionLog } from "@/app/lib/hybrid75ChallengeLogging";
import {
  countCompletedByType,
  sumPendingPoints,
  sumPointsByStatus,
} from "@/app/lib/hybrid75ChallengeLogging";

type UseHybrid75ChallengeLogsResult = {
  logs: Hybrid75ChallengeSessionLog[];
  logsBySessionId: Record<string, Hybrid75ChallengeSessionLog>;
  loading: boolean;
  saving: boolean;
  configured: boolean;
  error: string | null;
  pendingPoints: number;
  approvedPoints: number;
  totalPoints: number;
  completedRuns: number;
  completedLifts: number;
  completedMobility: number;
  completedChallenge: number;
  refresh: () => Promise<void>;
  saveLog: (payload: Record<string, unknown>) => Promise<Hybrid75ChallengeSessionLog | null>;
};

export function useHybrid75ChallengeLogs(planId: string, enabled: boolean): UseHybrid75ChallengeLogsResult {
  const [logs, setLogs] = useState<Hybrid75ChallengeSessionLog[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !planId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/free-week/challenge-logs?plan_id=${encodeURIComponent(planId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load logs");
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setConfigured(data.configured !== false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [enabled, planId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveLog = useCallback(
    async (payload: Record<string, unknown>) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch("/api/free-week/challenge-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save log");

        const saved = data.log as Hybrid75ChallengeSessionLog;
        setLogs((prev) => {
          const next = prev.filter((log) => log.session_id !== saved.session_id);
          return [...next, saved];
        });
        return saved;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save log");
        return null;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const logsBySessionId = useMemo(() => {
    const map: Record<string, Hybrid75ChallengeSessionLog> = {};
    for (const log of logs) map[log.session_id] = log;
    return map;
  }, [logs]);

  const pendingPoints = useMemo(() => sumPendingPoints(logs), [logs]);
  const approvedPoints = useMemo(() => sumPointsByStatus(logs, "approved"), [logs]);

  return {
    logs,
    logsBySessionId,
    loading,
    saving,
    configured,
    error,
    pendingPoints,
    approvedPoints,
    totalPoints: pendingPoints + approvedPoints,
    completedRuns: countCompletedByType(logs, "run"),
    completedLifts: countCompletedByType(logs, "lift"),
    completedMobility: countCompletedByType(logs, "mobility"),
    completedChallenge: countCompletedByType(logs, "challenge"),
    refresh,
    saveLog,
  };
}
