export type PerformanceTestingViewMode = "athlete" | "coach_preview";

export function performanceTestingApiBase(
  mode: PerformanceTestingViewMode,
  athleteId?: string
): string {
  if (mode === "coach_preview") {
    if (!athleteId) {
      throw new Error("athleteId is required for coach preview API.");
    }
    return `/api/hyrox/athletes/${athleteId}/performance-testing`;
  }
  return "/api/hyrox/athlete/performance-testing";
}
