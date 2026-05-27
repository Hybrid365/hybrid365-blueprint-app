"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AthleteCheckInSummary,
  AthleteWeeklyCheckInView,
} from "@/app/lib/hyroxAthleteCheckInServer";
import type { CheckInSubmitInput } from "@/app/lib/hyroxAthleteCheckInServer";
import { useAthletePortal } from "./athletePortalContext";

type CheckInApiJson = {
  success?: boolean;
  error?: string;
  checkIn?: AthleteWeeklyCheckInView;
  summary?: AthleteCheckInSummary;
};

export function useAthleteWeeklyCheckIn(enabled: boolean) {
  const { useMockPreview } = useAthletePortal();
  const [checkIn, setCheckIn] = useState<AthleteWeeklyCheckInView | null>(null);
  const [summary, setSummary] = useState<AthleteCheckInSummary | null>(null);
  const [loading, setLoading] = useState(enabled && !useMockPreview);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || useMockPreview) {
      setCheckIn(null);
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hyrox/athlete/check-in", {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await res.json()) as CheckInApiJson;
      if (!res.ok || !json.success || !json.checkIn) {
        setError(json.error ?? "Could not load check-in.");
        setCheckIn(null);
        setSummary(null);
        return;
      }
      setCheckIn(json.checkIn);
      setSummary(json.summary ?? null);
    } catch {
      setError("Network error loading check-in.");
      setCheckIn(null);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, useMockPreview]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submit = useCallback(
    async (input: CheckInSubmitInput) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch("/api/hyrox/athlete/check-in", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const json = (await res.json()) as CheckInApiJson;
        if (!res.ok || !json.success || !json.checkIn) {
          setError(json.error ?? "Could not save check-in.");
          return false;
        }
        setCheckIn(json.checkIn);
        setSummary(json.summary ?? null);
        return true;
      } catch {
        setError("Network error saving check-in.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return {
    checkIn,
    summary,
    loading,
    saving,
    error,
    reload,
    submit,
    useMockPreview,
  };
}
