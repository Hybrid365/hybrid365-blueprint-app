"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BenchmarkSnapshotItem } from "@/app/lib/dashboardWeekTracking";
import {
  buildAthleteDashboardLiveView,
  type AthleteDashboardLiveView,
} from "@/app/lib/hyroxAthleteDashboardLive";
import { useAthletePortal } from "./athletePortalContext";

export function useAthleteDashboardLive() {
  const { portalAthlete, liveProgramme, programmePublishedLive, useMockPreview, reloadLiveProgramme } =
    useAthletePortal();

  const [benchmarkSnapshot, setBenchmarkSnapshot] = useState<BenchmarkSnapshotItem[] | null>(null);
  const [benchmarksLoading, setBenchmarksLoading] = useState(false);
  const [benchmarksError, setBenchmarksError] = useState<string | null>(null);

  const useLive = programmePublishedLive && !useMockPreview;

  const reloadBenchmarks = useCallback(async () => {
    if (!useLive) {
      setBenchmarkSnapshot(null);
      setBenchmarksError(null);
      return;
    }
    setBenchmarksLoading(true);
    setBenchmarksError(null);
    try {
      const res = await fetch("/api/hyrox/athlete/testing");
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
  }, [useLive]);

  useEffect(() => {
    void reloadBenchmarks();
  }, [reloadBenchmarks]);

  const dashboardLive: AthleteDashboardLiveView | null = useMemo(() => {
    if (!useLive) return null;
    return buildAthleteDashboardLiveView({
      portalAthlete,
      liveProgramme,
      programmePublishedLive: true,
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
  };
}
