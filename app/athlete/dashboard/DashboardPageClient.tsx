"use client";

import {
  HyroxEyebrow,
  HyroxH1,
  HyroxLead,
  HyroxPageShell,
  HyroxSection,
} from "@/components/hyrox-team/HyroxTeamUi";
import { useAthletePortal } from "@/components/athlete-command-centre/athletePortalContext";
import { AthletePortalShell } from "@/components/athlete-command-centre/AthletePortalShell";
import HyroxTeamDashboardView from "./HyroxTeamDashboardView";

export default function DashboardPageClient() {
  const { mockActive, setMockActive } = useAthletePortal();

  if (mockActive) {
    return (
      <AthletePortalShell>
        <HyroxTeamDashboardView mockActive />
      </AthletePortalShell>
    );
  }

  return (
    <HyroxPageShell maxWidth="max-w-7xl">
      <HyroxSection className="!py-6 sm:!py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <HyroxEyebrow>Hyrox Team / Dashboard</HyroxEyebrow>
            <HyroxH1 accent="portal">Athlete</HyroxH1>
            <HyroxLead>
              Your Hyrox training hub — programme, benchmarks, check-ins and coach support.
            </HyroxLead>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-400">
            <input
              type="checkbox"
              checked={mockActive}
              onChange={(e) => setMockActive(e.target.checked)}
              className="rounded border-zinc-600"
            />
            Preview active dashboard (mock)
          </label>
        </div>
      </HyroxSection>

      <HyroxTeamDashboardView mockActive={false} />
    </HyroxPageShell>
  );
}
