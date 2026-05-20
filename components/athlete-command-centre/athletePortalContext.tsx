"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hyrox-athlete-mock-active";

type AthletePortalContextValue = {
  mockActive: boolean;
  setMockActive: (value: boolean) => void;
};

const AthletePortalContext = createContext<AthletePortalContextValue | null>(null);

export function AthletePortalProvider({ children }: { children: React.ReactNode }) {
  const [mockActive, setMockActiveState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMockActiveState(sessionStorage.getItem(STORAGE_KEY) === "1");
    setHydrated(true);
  }, []);

  const setMockActive = useCallback((value: boolean) => {
    setMockActiveState(value);
    sessionStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  }, []);

  const value = useMemo(
    () => ({ mockActive: hydrated ? mockActive : false, setMockActive }),
    [hydrated, mockActive, setMockActive]
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
