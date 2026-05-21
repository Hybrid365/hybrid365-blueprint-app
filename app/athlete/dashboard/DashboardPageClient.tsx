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
  const {
    setProgrammePublishedMock,
    programmePublishedLive,
    programmeHubLive,
    programmeVisibility,
    hasLinkedAthlete,
    useMockPreview,
    portalAthlete,
  } = useAthletePortal();

  if (programmeHubLive) {
    return (
      <AthletePortalShell>
        <HyroxTeamDashboardView
          programmePublishedMock={useMockPreview}
          programmePublishedLive={programmePublishedLive}
          portalAthleteName={portalAthlete?.name}
        />
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
              Your Hyrox training hub — programme, benchmarks, check-ins and coach support unlock when your first block
              is published.
            </HyroxLead>
          </div>
          {hasLinkedAthlete && !programmePublishedLive ? (
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-400">
              <input
                type="checkbox"
                checked={useMockPreview}
                onChange={(e) => setProgrammePublishedMock(e.target.checked)}
                className="rounded border-zinc-600"
              />
              Programme live (mock preview)
            </label>
          ) : null}
        </div>
      </HyroxSection>

      <HyroxTeamDashboardView
        programmePublishedMock={false}
        programmePublishedLive={false}
        programmeVisibility={programmeVisibility}
      />
    </HyroxPageShell>
  );
}
