"use client";

import { createContext, useContext, useMemo } from "react";
import type { AthleteLiveProgrammePayload } from "./useAthleteLiveProgramme";
import type { PortalAthleteSummary } from "./athletePortalContext";
import type {
  AthleteProgrammeApiState,
  AthleteProgrammeVisibility,
} from "@/app/lib/hyroxProgrammeServer";

type AdminPreviewContextValue = {
  isAdminPreview: true;
  portalAthlete: PortalAthleteSummary;
  liveProgramme: AthleteLiveProgrammePayload | null;
  programmePublishedLive: boolean;
  programmeHubLive: boolean;
  programmeState: AthleteProgrammeApiState;
  programmeVisibility: AthleteProgrammeVisibility;
  useMockPreview: false;
  liveProgrammeLoading: false;
};

const AdminPreviewContext = createContext<AdminPreviewContextValue | null>(null);

export function AthletePortalAdminPreviewProvider({
  children,
  portalAthlete,
  programme,
}: {
  children: React.ReactNode;
  portalAthlete: PortalAthleteSummary;
  programme: AthleteLiveProgrammePayload | null;
}) {
  const value = useMemo((): AdminPreviewContextValue => {
    const published = Boolean(programme?.published);
    return {
      isAdminPreview: true,
      portalAthlete,
      liveProgramme: programme,
      programmePublishedLive: published,
      programmeHubLive: published,
      programmeState: programme?.state ?? "coach_reviewing",
      programmeVisibility: programme?.visibility ?? "coach_reviewing",
      useMockPreview: false,
      liveProgrammeLoading: false,
    };
  }, [portalAthlete, programme]);

  return <AdminPreviewContext.Provider value={value}>{children}</AdminPreviewContext.Provider>;
}

export function useAthleteAdminPreview() {
  return useContext(AdminPreviewContext);
}

export function useAthletePortalOrAdminPreview() {
  const admin = useAthleteAdminPreview();
  if (admin) return { ...admin, readOnly: true as const };
  return null;
}
