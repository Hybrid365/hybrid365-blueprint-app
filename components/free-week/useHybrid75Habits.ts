"use client";

import { useCallback, useEffect, useState } from "react";
import type { Hybrid75HabitKey, Hybrid75HabitSummary } from "@/app/lib/hybrid75HabitLogging";

export function useHybrid75Habits(
  planId: string,
  enabled: boolean,
  athleteEmail?: string,
  athleteName?: string
) {
  const [summary, setSummary] = useState<Hybrid75HabitSummary | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<Hybrid75HabitKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !planId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/free-week/habits?plan_id=${encodeURIComponent(planId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load habits");
      setConfigured(data.configured !== false);
      setSummary(data.summary ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load habits");
    } finally {
      setLoading(false);
    }
  }, [enabled, planId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleHabit = useCallback(
    async (habitKey: Hybrid75HabitKey, completed: boolean) => {
      if (!enabled || !planId) return;
      setSavingKey(habitKey);
      setError(null);
      try {
        const res = await fetch("/api/free-week/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: planId,
            habit_key: habitKey,
            completed,
            email: athleteEmail,
            name: athleteName,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save habit");
        setSummary(data.summary ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save habit");
      } finally {
        setSavingKey(null);
      }
    },
    [enabled, planId, athleteEmail, athleteName]
  );

  return {
    summary,
    configured,
    loading,
    savingKey,
    error,
    refresh,
    toggleHabit,
  };
}
