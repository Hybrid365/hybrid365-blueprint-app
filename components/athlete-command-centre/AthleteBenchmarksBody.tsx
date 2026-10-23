"use client";

import { BenchmarksDashboardSection } from "./BenchmarksDashboardSection";
import { PerformanceProfileAthleteView } from "./PerformanceProfileAthleteView";
import { useAthleteAdminPreview } from "./athletePortalAdminPreview";
import { useAthletePortalOptional } from "./athletePortalContext";

export function AthleteBenchmarksBody() {
  const portal = useAthletePortalOptional();
  const preview = useAthleteAdminPreview();
  const enabled = Boolean(preview?.performanceProfileEnabled || portal?.performanceProfileEnabled);
  if (!enabled) return <BenchmarksDashboardSection />;
  return <PerformanceProfileAthleteView readOnly={Boolean(preview?.readOnly)} />;
}
