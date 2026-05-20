"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/** When true, the athlete programme is treated as published (mock). Default: waiting / coach build. */
const STORAGE_KEY = "hyrox-athlete-programme-live-mock";
const LEGACY_MOCK_ACTIVE_KEY = "hyrox-athlete-mock-active";

type AthletePortalContextValue = {
  programmePublishedMock: boolean;
  setProgrammePublishedMock: (value: boolean) => void;
};

const AthletePortalContext = createContext<AthletePortalContextValue | null>(null);

export function AthletePortalProvider({ children }: { children: React.ReactNode }) {
  const [programmePublishedMock, setProgrammePublishedMockState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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

  const value = useMemo(
    () => ({
      programmePublishedMock: hydrated ? programmePublishedMock : false,
      setProgrammePublishedMock,
    }),
    [hydrated, programmePublishedMock, setProgrammePublishedMock]
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
