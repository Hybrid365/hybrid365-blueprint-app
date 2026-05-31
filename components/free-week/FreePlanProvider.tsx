"use client";

import { createContext, useContext, useMemo } from "react";
import type { Hybrid75PlanMeta } from "@/app/lib/freeWeekChallengeMode";

export type FreePlanContextValue = {
  planId: string;
  planJson: Record<string, unknown>;
  isHybrid75: boolean;
  hybrid75Meta: Hybrid75PlanMeta | null;
  firstName: string;
  athleteEmail: string;
  athleteName: string;
};

const FreePlanContext = createContext<FreePlanContextValue | null>(null);

export function FreePlanProvider({
  planId,
  planJson,
  isHybrid75,
  hybrid75Meta,
  children,
}: {
  planId: string;
  planJson: Record<string, unknown>;
  isHybrid75: boolean;
  hybrid75Meta: Hybrid75PlanMeta | null;
  children: React.ReactNode;
}) {
  const value = useMemo(() => {
    const profile = (planJson.profile as Record<string, unknown>) || {};
    const firstName = String(profile.first_name || planJson.first_name || "");
    const athleteEmail = String(profile.email || planJson.email || "");
    const athleteName = firstName || athleteEmail.split("@")[0] || "Athlete";

    return {
      planId,
      planJson,
      isHybrid75,
      hybrid75Meta,
      firstName,
      athleteEmail,
      athleteName,
    };
  }, [planId, planJson, isHybrid75, hybrid75Meta]);

  return <FreePlanContext.Provider value={value}>{children}</FreePlanContext.Provider>;
}

export function useFreePlan() {
  const ctx = useContext(FreePlanContext);
  if (!ctx) throw new Error("useFreePlan must be used within FreePlanProvider");
  return ctx;
}

export function useOptionalFreePlan() {
  return useContext(FreePlanContext);
}
