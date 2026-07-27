"use client";

import { useCallback, useState } from "react";
import type { PerformanceHubPayload } from "@/app/lib/hyrox-team/modules/performanceHub/types";
import { useAthletePortalOptional } from "../athletePortalContext";
import { useAthleteAdminPreview } from "../athletePortalAdminPreview";

export function useHomePerformanceHub(enabled: boolean) {
  const portal = useAthletePortalOptional();
  const adminPreview = useAthleteAdminPreview();
  const athleteId = adminPreview?.portalAthlete.id ?? portal?.portalAthlete?.id ?? null;
  const timezone =
    adminPreview?.athleteTimezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";

  const [hub, setHub] = useState<PerformanceHubPayload | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const fetchKey = `${athleteId ?? "none"}:home-hub:${timezone}`;

  const load = useCallback(async () => {
    if (!athleteId || !enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = adminPreview
        ? `/api/hyrox/athletes/${encodeURIComponent(athleteId)}/performance-hub-summary?full=1&range=this_week&timezone=${encodeURIComponent(timezone)}`
        : `/api/hyrox/athlete/performance-hub?range=this_week&timezone=${encodeURIComponent(timezone)}&expectedAthleteId=${encodeURIComponent(athleteId)}`;
      const res = await fetch(url, { credentials: "include" });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        hub?: PerformanceHubPayload;
      };
      if (!res.ok || !json.success || !json.hub) {
        setHub(null);
        setError(json.error ?? "Could not load performance data.");
        return;
      }
      setHub(json.hub);
    } catch {
      setHub(null);
      setError("Could not load performance data.");
    } finally {
      setLoading(false);
    }
  }, [athleteId, enabled, adminPreview, timezone]);

  if (enabled && athleteId && loadedKey !== fetchKey) {
    setLoadedKey(fetchKey);
    void load();
  }

  return { hub, loading, error, athleteId, timezone, reload: load };
}
