"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BenchmarkSnapshotItem } from "@/app/lib/dashboardWeekTracking";
import {
  buildAthleteDashboardLiveView,
  type AthleteDashboardLiveView,
} from "@/app/lib/hyroxAthleteDashboardLive";
import { useAthleteAdminPreview } from "./athletePortalAdminPreview";
import { useAthletePortalOptional } from "./athletePortalContext";

export function useAthleteDashboardLive() {
  const adminPreview = useAthleteAdminPreview();
  const portal = useAthletePortalOptional();
  const portalAthlete = adminPreview?.portalAthlete ?? portal?.portalAthlete ?? null;
  const liveProgramme = adminPreview?.liveProgramme ?? portal?.liveProgramme ?? null;
  const programmePublishedLive =
    adminPreview?.programmePublishedLive ?? portal?.programmePublishedLive ?? false;
  const useMockPreview = adminPreview ? false : Boolean(portal?.useMockPreview);
  const reloadLiveProgramme = portal?.reloadLiveProgramme ?? (async () => {});
  const readOnly = Boolean(adminPreview);

  const [benchmarkSnapshot, setBenchmarkSnapshot] = useState<BenchmarkSnapshotItem[] | null>(null);
  const [benchmarksLoading, setBenchmarksLoading] = useState(false);
  const [benchmarksError, setBenchmarksError] = useState<string | null>(null);

  const useLive =
    programmePublishedLive && !useMockPreview && Boolean(liveProgramme);

  const reloadBenchmarks = useCallback(async () => {
    if (!useLive || readOnly) {
      setBenchmarkSnapshot(null);
      setBenchmarksError(null);
      return;
    }
    setBenchmarksLoading(true);
    setBenchmarksError(null);
    try {
      const res = await fetch("/api/hyrox/athlete/testing", { credentials: "include" });
      const json = (await res.json()) as {
        snapshot?: BenchmarkSnapshotItem[];
        error?: string;
      };
      if (!res.ok) {
        setBenchmarksError(json.error ?? "Could not load benchmark results.");
        setBenchmarkSnapshot(null);
        return;
      }
      setBenchmarkSnapshot(json.snapshot ?? []);
    } catch {
      setBenchmarksError("Network error loading benchmarks.");
      setBenchmarkSnapshot(null);
    } finally {
      setBenchmarksLoading(false);
    }
  }, [useLive, readOnly]);

  useEffect(() => {
    void reloadBenchmarks();
  }, [reloadBenchmarks]);

  const dashboardLive: AthleteDashboardLiveView | null = useMemo(() => {
    if (!useLive) return null;
    return buildAthleteDashboardLiveView({
      portalAthlete,
      liveProgramme,
      programmePublishedLive: true,
      weeklyCheckIn: liveProgramme?.weeklyCheckIn ?? null,
      benchmarkSnapshot: benchmarkSnapshot ?? undefined,
      benchmarksLoading,
      benchmarksError,
    });
  }, [
    useLive,
    portalAthlete,
    liveProgramme,
    benchmarkSnapshot,
    benchmarksLoading,
    benchmarksError,
  ]);

  return {
    useLive,
    dashboardLive,
    useMockPreview,
    benchmarkSnapshot,
    benchmarksLoading,
    benchmarksError,
    reloadBenchmarks,
    reloadLiveProgramme,
    readOnly,
  };
}
