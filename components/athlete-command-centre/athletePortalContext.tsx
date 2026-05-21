"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  AthleteProgrammeApiState,
  AthleteProgrammeVisibility,
} from "@/app/lib/hyroxProgrammeServer";
import {
  useAthleteLiveProgramme,
  type AthleteLiveProgrammePayload,
} from "./useAthleteLiveProgramme";

/** When true, the athlete programme is treated as published (mock). Default: waiting / coach build. */
const STORAGE_KEY = "hyrox-athlete-programme-live-mock";
const LEGACY_MOCK_ACTIVE_KEY = "hyrox-athlete-mock-active";

export type PortalAthleteSummary = {
  id: string;
  name: string;
  email: string | null;
  status: string;
};

type AthletePortalContextValue = {
  programmePublishedMock: boolean;
  setProgrammePublishedMock: (value: boolean) => void;
  hasLinkedAthlete: boolean;
  portalAthlete: PortalAthleteSummary | null;
  programmePublishedLive: boolean;
  hasPublishedProgramme: boolean;
  programmeState: AthleteProgrammeApiState;
  programmeVisibility: AthleteProgrammeVisibility;
  useMockPreview: boolean;
  liveProgramme: AthleteLiveProgrammePayload | null;
  liveProgrammeLoading: boolean;
  programmeHubLive: boolean;
  reloadLiveProgramme: () => Promise<void>;
};

const AthletePortalContext = createContext<AthletePortalContextValue | null>(null);

export function AthletePortalProvider({
  children,
  hasLinkedAthlete = true,
  portalAthlete = null,
}: {
  children: React.ReactNode;
  hasLinkedAthlete?: boolean;
  portalAthlete?: PortalAthleteSummary | null;
}) {
  const [programmePublishedMock, setProgrammePublishedMockState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const {
    data: liveProgramme,
    loading: liveProgrammeLoading,
    reload: reloadLiveProgramme,
  } = useAthleteLiveProgramme(hasLinkedAthlete && hydrated);

  useEffect(() => {
    const next = sessionStorage.getItem(STORAGE_KEY);
    const legacy = sessionStorage.getItem(LEGACY_MOCK_ACTIVE_KEY);
    const live = next === "1" || legacy === "1";
    setProgrammePublishedMockState(live);
    setHydrated(true);
  }, []);

  const setProgrammePublishedMock = useCallback((value: boolean) => {
    setProgrammePublishedMockState(value);
    sessionStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  }, []);

  const programmePublishedLive = Boolean(liveProgramme?.published);
  const hasPublishedProgramme = programmePublishedLive;
  const programmeState: AthleteProgrammeApiState = liveProgramme?.state ?? "coach_reviewing";
  const programmeVisibility: AthleteProgrammeVisibility =
    liveProgramme?.visibility ?? "coach_reviewing";

  /** Mock preview only when no live published programme exists. */
  const useMockPreview = hydrated && programmePublishedMock && !programmePublishedLive;
  const programmeHubLive = hydrated && (programmePublishedLive || useMockPreview);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !hydrated) return;
    console.log("[athlete-portal]", {
      portalAthleteId: portalAthlete?.id ?? null,
      portalAthleteName: portalAthlete?.name ?? null,
      programmeState,
      hasPublishedProgramme,
      programmePublishedLive,
      useMockPreview,
      programmeHubLive,
      sessionCount: liveProgramme?.sessions?.length ?? 0,
      dashboardMode: programmeHubLive
        ? programmePublishedLive
          ? "live"
          : "mock"
        : "waiting",
    });
  }, [
    hydrated,
    portalAthlete,
    programmeState,
    hasPublishedProgramme,
    programmePublishedLive,
    useMockPreview,
    programmeHubLive,
    liveProgramme?.sessions?.length,
  ]);

  const value = useMemo(
    () => ({
      programmePublishedMock: hydrated ? programmePublishedMock : false,
      setProgrammePublishedMock,
      hasLinkedAthlete,
      portalAthlete,
      programmePublishedLive,
      hasPublishedProgramme,
      programmeState,
      programmeVisibility,
      useMockPreview,
      liveProgramme,
      liveProgrammeLoading,
      programmeHubLive,
      reloadLiveProgramme,
    }),
    [
      hydrated,
      programmePublishedMock,
      setProgrammePublishedMock,
      hasLinkedAthlete,
      portalAthlete,
      programmePublishedLive,
      hasPublishedProgramme,
      programmeState,
      programmeVisibility,
      useMockPreview,
      liveProgramme,
      liveProgrammeLoading,
      programmeHubLive,
      reloadLiveProgramme,
    ]
  );

  return <AthletePortalContext.Provider value={value}>{children}</AthletePortalContext.Provider>;
}

export function useAthletePortal() {
  const ctx = useContext(AthletePortalContext);
  if (!ctx) {
    throw new Error("useAthletePortal must be used within AthletePortalProvider");
  }
  return ctx;
}
