"use client";

import { createContext, useContext, useMemo } from "react";
import type { AthleteLiveProgrammePayload } from "./useAthleteLiveProgramme";
import type { PortalAthleteSummary } from "./athletePortalContext";
import type {
  AthleteProgrammeApiState,
  AthleteProgrammeVisibility,
} from "@/app/lib/hyroxProgrammeServer";
import type { HyroxDailyReadinessRow } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";

export type AdminAthletePreviewContextValue = {
  mode: "admin-athlete-preview";
  isAdminPreview: true;
  readOnly: true;
  portalAthlete: PortalAthleteSummary;
  liveProgramme: AthleteLiveProgrammePayload | null;
  programmePublishedLive: boolean;
  programmeHubLive: boolean;
  programmeState: AthleteProgrammeApiState;
  programmeVisibility: AthleteProgrammeVisibility;
  useMockPreview: false;
  liveProgrammeLoading: false;
  /** Athlete-specific feature seeds (not force-enabled for admin). */
  todayV2Enabled: boolean;
  performanceHubEnabled: boolean;
  /** Server-seeded Home V2 allow-list (not force-enabled for admin). */
  homeV2Enabled: boolean;
  /** IANA timezone for Today/Hub date math — never the admin browser TZ. */
  athleteTimezone: string;
  previewBasePath: string;
  adminReturnHref: string;
  /** Server-seeded readiness for Today V2 display in preview. */
  initialReadiness: HyroxDailyReadinessRow | null;
};

const AdminPreviewContext = createContext<AdminAthletePreviewContextValue | null>(null);

export function AthletePortalAdminPreviewProvider({
  children,
  portalAthlete,
  programme,
  todayV2Enabled = false,
  performanceHubEnabled = false,
  homeV2Enabled = false,
  athleteTimezone = "Europe/London",
  previewBasePath,
  adminReturnHref,
  initialReadiness = null,
}: {
  children: React.ReactNode;
  portalAthlete: PortalAthleteSummary;
  programme: AthleteLiveProgrammePayload | null;
  todayV2Enabled?: boolean;
  performanceHubEnabled?: boolean;
  homeV2Enabled?: boolean;
  athleteTimezone?: string;
  previewBasePath: string;
  adminReturnHref: string;
  initialReadiness?: HyroxDailyReadinessRow | null;
}) {
  const value = useMemo((): AdminAthletePreviewContextValue => {
    const published = Boolean(programme?.published);
    return {
      mode: "admin-athlete-preview",
      isAdminPreview: true,
      readOnly: true,
      portalAthlete,
      liveProgramme: programme,
      programmePublishedLive: published,
      programmeHubLive: published,
      programmeState: programme?.state ?? "coach_reviewing",
      programmeVisibility: programme?.visibility ?? "coach_reviewing",
      useMockPreview: false,
      liveProgrammeLoading: false,
      todayV2Enabled,
      performanceHubEnabled,
      homeV2Enabled,
      athleteTimezone,
      previewBasePath,
      adminReturnHref,
      initialReadiness,
    };
  }, [
    portalAthlete,
    programme,
    todayV2Enabled,
    performanceHubEnabled,
    homeV2Enabled,
    athleteTimezone,
    previewBasePath,
    adminReturnHref,
    initialReadiness,
  ]);

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
