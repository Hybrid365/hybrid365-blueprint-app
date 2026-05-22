"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  clearHyroxMockPreviewStorage,
  isHyroxAthleteMockPreviewAllowed,
  readHyroxMockPreviewEnabled,
  writeHyroxMockPreviewEnabled,
} from "@/app/lib/hyroxAthletePortalMock";
import type {
  AthleteProgrammeApiState,
  AthleteProgrammeVisibility,
} from "@/app/lib/hyroxProgrammeServer";
import {
  useAthleteLiveProgramme,
  type AthleteLiveProgrammePayload,
} from "./useAthleteLiveProgramme";

export type PortalAthleteSummary = {
  id: string;
  name: string;
  email: string | null;
  status: string;
};

export type PortalMatchSource = "user_id" | "email" | "none";

export type PortalLayoutAuth = {
  hasSession: boolean;
  email: string | null;
  userId: string | null;
  hasSupabaseAuthCookie: boolean;
};

type AthletePortalContextValue = {
  programmePublishedMock: boolean;
  setProgrammePublishedMock: (value: boolean) => void;
  allowMockPreview: boolean;
  hasLinkedAthlete: boolean;
  portalAthlete: PortalAthleteSummary | null;
  portalMatchSource: PortalMatchSource;
  programmePublishedLive: boolean;
  hasPublishedProgramme: boolean;
  programmeState: AthleteProgrammeApiState;
  programmeVisibility: AthleteProgrammeVisibility;
  useMockPreview: boolean;
  liveProgramme: AthleteLiveProgrammePayload | null;
  liveProgrammeLoading: boolean;
  programmeHubLive: boolean;
  reloadLiveProgramme: () => Promise<void>;
  layoutAuth: PortalLayoutAuth;
};

const AthletePortalContext = createContext<AthletePortalContextValue | null>(null);

const EMPTY_LAYOUT_AUTH: PortalLayoutAuth = {
  hasSession: false,
  email: null,
  userId: null,
  hasSupabaseAuthCookie: false,
};

export function AthletePortalProvider({
  children,
  hasLinkedAthlete = true,
  portalAthlete = null,
  portalMatchSource = "none",
  layoutAuth = EMPTY_LAYOUT_AUTH,
}: {
  children: React.ReactNode;
  hasLinkedAthlete?: boolean;
  portalAthlete?: PortalAthleteSummary | null;
  portalMatchSource?: PortalMatchSource;
  layoutAuth?: PortalLayoutAuth;
}) {
  const allowMockPreview = isHyroxAthleteMockPreviewAllowed();
  const [programmePublishedMock, setProgrammePublishedMockState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const {
    data: liveProgramme,
    loading: liveProgrammeLoading,
    reload: reloadLiveProgramme,
  } = useAthleteLiveProgramme(hasLinkedAthlete && hydrated);

  useEffect(() => {
    if (!allowMockPreview) {
      clearHyroxMockPreviewStorage();
      setProgrammePublishedMockState(false);
      setHydrated(true);
      return;
    }
    setProgrammePublishedMockState(readHyroxMockPreviewEnabled());
    setHydrated(true);
  }, [allowMockPreview]);

  const setProgrammePublishedMock = useCallback(
    (value: boolean) => {
      if (!allowMockPreview) return;
      setProgrammePublishedMockState(value);
      writeHyroxMockPreviewEnabled(value);
    },
    [allowMockPreview]
  );

  const programmePublishedLive = Boolean(liveProgramme?.published);
  const hasPublishedProgramme = programmePublishedLive;
  const programmeState: AthleteProgrammeApiState = liveProgramme?.state ?? "coach_reviewing";
  const programmeVisibility: AthleteProgrammeVisibility =
    liveProgramme?.visibility ?? "coach_reviewing";

  /** Clear dev mock when a real programme is published so athletes never stay on Alex Morgan data. */
  useEffect(() => {
    if (!hydrated || !programmePublishedLive) return;
    setProgrammePublishedMockState(false);
    clearHyroxMockPreviewStorage();
  }, [hydrated, programmePublishedLive]);

  /** Dev-only: mock preview when no live published programme. Never in production. */
  const useMockPreview =
    allowMockPreview && hydrated && programmePublishedMock && !programmePublishedLive;

  /** Full hub only for real published programme, or explicit dev mock preview. */
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
      allowMockPreview,
      sessionCount: liveProgramme?.sessions?.length ?? 0,
      dashboardMode: programmePublishedLive
        ? "live"
        : useMockPreview
          ? "mock"
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
    allowMockPreview,
    liveProgramme?.sessions?.length,
  ]);

  const value = useMemo(
    () => ({
      programmePublishedMock: hydrated && allowMockPreview ? programmePublishedMock : false,
      setProgrammePublishedMock,
      allowMockPreview,
      hasLinkedAthlete,
      portalAthlete,
      portalMatchSource,
      programmePublishedLive,
      hasPublishedProgramme,
      programmeState,
      programmeVisibility,
      useMockPreview,
      liveProgramme,
      liveProgrammeLoading,
      programmeHubLive,
      reloadLiveProgramme,
      layoutAuth,
    }),
    [
      hydrated,
      allowMockPreview,
      programmePublishedMock,
      setProgrammePublishedMock,
      hasLinkedAthlete,
      portalAthlete,
      portalMatchSource,
      programmePublishedLive,
      hasPublishedProgramme,
      programmeState,
      programmeVisibility,
      useMockPreview,
      liveProgramme,
      liveProgrammeLoading,
      programmeHubLive,
      reloadLiveProgramme,
      layoutAuth,
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

/**
 * Merges server-loaded programme/onboarding state into portal context so the hub
 * stays unlocked when the client programme API is slow or fails — without
 * downgrading a server-confirmed published programme.
 */
export function AthletePortalSeedProvider({
  children,
  serverProgrammePublished = false,
  serverProgramme = null,
}: {
  children: React.ReactNode;
  serverProgrammePublished?: boolean;
  serverProgramme?: AthleteLiveProgrammePayload | null;
}) {
  const parent = useAthletePortal();

  const value = useMemo(() => {
    const serverPublished =
      serverProgrammePublished ||
      Boolean(serverProgramme?.published) ||
      serverProgramme?.state === "published";
    const programmePublishedLive = parent.programmePublishedLive || serverPublished;
    const liveProgramme = parent.liveProgramme ?? serverProgramme ?? null;
    const programmeHubLive =
      programmePublishedLive || parent.useMockPreview || parent.programmeHubLive;

    return {
      ...parent,
      programmePublishedLive,
      hasPublishedProgramme: programmePublishedLive,
      programmeHubLive,
      liveProgramme,
      programmeState: liveProgramme?.state ?? parent.programmeState,
      programmeVisibility: liveProgramme?.visibility ?? parent.programmeVisibility,
    };
  }, [parent, serverProgrammePublished, serverProgramme]);

  return <AthletePortalContext.Provider value={value}>{children}</AthletePortalContext.Provider>;
}
