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
import type { AthletePortalAuthSource } from "@/app/lib/hyroxAthletePortalSnapshot";
import {
  useAthleteLiveProgramme,
  type AthleteLiveProgrammePayload,
} from "./useAthleteLiveProgramme";

export type AthleteRouteAuthDebug = {
  authSource: AthletePortalAuthSource;
  athleteId: string | null;
  route: string;
  wouldRedirectToLogin: boolean;
  serverProgrammePublishedSeed?: boolean;
  publishedSessionsCount?: number;
};

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
  /** Layout resolved linked paid athlete — client API must not downgrade auth. */
  serverAuthConfirmed: boolean;
  serverProgrammePublishedSeed: boolean;
  programmePublishedLive: boolean;
  hasPublishedProgramme: boolean;
  programmeState: AthleteProgrammeApiState;
  programmeVisibility: AthleteProgrammeVisibility;
  useMockPreview: boolean;
  liveProgramme: AthleteLiveProgrammePayload | null;
  liveProgrammeLoading: boolean;
  liveProgrammeApiError: string | null;
  programmeHubLive: boolean;
  reloadLiveProgramme: () => Promise<void>;
  layoutAuth: PortalLayoutAuth;
  /** Short-lived server-signed token for mutations when cookie auth fails (Hyrox only). */
  portalMutationToken: string | null;
  portalAuthSource: AthletePortalAuthSource;
  routeAuthDebug: AthleteRouteAuthDebug | null;
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
  serverAuthConfirmed = false,
  serverProgrammePublishedSeed = false,
  portalMutationToken = null,
  portalAuthSource = "none",
  routeAuthDebug = null,
}: {
  children: React.ReactNode;
  hasLinkedAthlete?: boolean;
  portalAthlete?: PortalAthleteSummary | null;
  portalMatchSource?: PortalMatchSource;
  layoutAuth?: PortalLayoutAuth;
  serverAuthConfirmed?: boolean;
  serverProgrammePublishedSeed?: boolean;
  portalMutationToken?: string | null;
  portalAuthSource?: AthletePortalAuthSource;
  routeAuthDebug?: AthleteRouteAuthDebug | null;
}) {
  const allowMockPreview = isHyroxAthleteMockPreviewAllowed();
  const [programmePublishedMock, setProgrammePublishedMockState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const {
    data: liveProgramme,
    loading: liveProgrammeLoading,
    error: liveProgrammeApiError,
    reload: reloadLiveProgramme,
  } = useAthleteLiveProgramme(hasLinkedAthlete && hydrated, {
    preserveDataOnAuthFailure: serverAuthConfirmed,
  });

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

  const clientProgrammePublished = Boolean(liveProgramme?.published);
  const programmePublishedLive =
    clientProgrammePublished || serverProgrammePublishedSeed;
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

  /** Hub live from server seed immediately; client API must not downgrade when auth is confirmed. */
  const programmeHubLive =
    (serverAuthConfirmed && serverProgrammePublishedSeed) ||
    (hydrated && (programmePublishedLive || useMockPreview));

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
      serverAuthConfirmed,
      serverProgrammePublishedSeed,
      programmePublishedLive,
      hasPublishedProgramme,
      programmeState,
      programmeVisibility,
      useMockPreview,
      liveProgramme,
      liveProgrammeLoading,
      liveProgrammeApiError,
      programmeHubLive,
      reloadLiveProgramme,
      layoutAuth,
      portalMutationToken,
      portalAuthSource,
      routeAuthDebug,
    }),
    [
      hydrated,
      allowMockPreview,
      programmePublishedMock,
      setProgrammePublishedMock,
      hasLinkedAthlete,
      portalAthlete,
      portalMatchSource,
      serverAuthConfirmed,
      serverProgrammePublishedSeed,
      programmePublishedLive,
      hasPublishedProgramme,
      programmeState,
      programmeVisibility,
      useMockPreview,
      liveProgramme,
      liveProgrammeLoading,
      liveProgrammeApiError,
      programmeHubLive,
      reloadLiveProgramme,
      layoutAuth,
      portalMutationToken,
      portalAuthSource,
      routeAuthDebug,
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

export function useAthletePortalOptional() {
  return useContext(AthletePortalContext);
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
  serverPortalAthlete = null,
}: {
  children: React.ReactNode;
  serverProgrammePublished?: boolean;
  serverProgramme?: AthleteLiveProgrammePayload | null;
  /** Programme page server loader — unlocks portal gate when layout auth is uncertain. */
  serverPortalAthlete?: PortalAthleteSummary | null;
}) {
  const parent = useAthletePortal();

  const value = useMemo(() => {
    const serverPublished =
      serverProgrammePublished ||
      Boolean(serverProgramme?.published) ||
      serverProgramme?.state === "published";
    const programmePublishedLive = parent.programmePublishedLive || serverPublished;
    const liveProgramme = parent.liveProgramme ?? serverProgramme ?? null;
    const portalAthlete = parent.portalAthlete ?? serverPortalAthlete ?? null;
    const hasLinkedAthlete = parent.hasLinkedAthlete || Boolean(serverPortalAthlete?.id);
    const programmeHubLive =
      (parent.serverAuthConfirmed && (serverPublished || parent.serverProgrammePublishedSeed)) ||
      programmePublishedLive ||
      parent.useMockPreview;

    return {
      ...parent,
      portalAthlete,
      hasLinkedAthlete,
      serverProgrammePublishedSeed:
        serverPublished || parent.serverProgrammePublishedSeed,
      programmePublishedLive,
      hasPublishedProgramme: programmePublishedLive,
      programmeHubLive,
      liveProgramme,
      programmeState: liveProgramme?.state ?? parent.programmeState,
      programmeVisibility: liveProgramme?.visibility ?? parent.programmeVisibility,
    };
  }, [parent, serverProgrammePublished, serverProgramme, serverPortalAthlete]);

  return <AthletePortalContext.Provider value={value}>{children}</AthletePortalContext.Provider>;
}
