"use client";

import Link from "next/link";
import {
  HyroxEyebrow,
  HyroxH1,
  HyroxLead,
  HyroxPageShell,
  HyroxSection,
} from "@/components/hyrox-team/HyroxTeamUi";
import { useAthletePortal } from "@/components/athlete-command-centre/athletePortalContext";
import { AthletePortalShell } from "@/components/athlete-command-centre/AthletePortalShell";
import { HyroxAthletePortalDebugPanel } from "@/components/athlete-command-centre/HyroxAthletePortalDebugPanel";
import type { AthleteOnboardingProgress } from "@/app/lib/hyroxAthleteOnboardingFlow";
import HyroxTeamDashboardView from "./HyroxTeamDashboardView";

export default function DashboardPageClient({
  initialProgress = null,
  serverAuthConfirmed = false,
  dataSource = "unknown",
  resolvedAthleteId = null,
}: {
  initialProgress?: AthleteOnboardingProgress | null;
  serverAuthConfirmed?: boolean;
  dataSource?: string;
  resolvedAthleteId?: string | null;
}) {
  const {
    setProgrammePublishedMock,
    allowMockPreview,
    programmePublishedLive,
    programmeHubLive,
    programmeVisibility,
    hasLinkedAthlete,
    useMockPreview,
    portalAthlete,
  } = useAthletePortal();

  const serverProgrammePublished = Boolean(initialProgress?.programmePublished);
  const showLiveHub =
    serverAuthConfirmed && (programmeHubLive || serverProgrammePublished);

  if (showLiveHub) {
    return (
      <AthletePortalShell>
        <HyroxAthletePortalDebugPanel />
        {process.env.NODE_ENV === "development" ? (
          <p className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400">
            Dashboard data source: {dataSource} · athlete id: {resolvedAthleteId ?? "—"} ·
            serverAuthConfirmed: {serverAuthConfirmed ? "yes" : "no"}
          </p>
        ) : null}
        <HyroxTeamDashboardView
          programmePublishedMock={useMockPreview}
          programmePublishedLive={programmePublishedLive || serverProgrammePublished}
          portalAthleteName={portalAthlete?.name}
          initialProgress={initialProgress}
        />
      </AthletePortalShell>
    );
  }

  return (
    <HyroxPageShell maxWidth="max-w-7xl">
      <HyroxAthletePortalDebugPanel />
      <HyroxSection className="!py-6 sm:!py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <HyroxEyebrow>Hyrox Team / Dashboard</HyroxEyebrow>
            <HyroxH1 accent="portal">{portalAthlete?.name ?? "Athlete"}</HyroxH1>
            <HyroxLead>
              Your Hyrox training hub — programme, benchmarks, check-ins and coach support unlock when your first block
              is published.
            </HyroxLead>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/logout?next=/athlete/login"
              className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              Sign out
            </Link>
          {allowMockPreview && hasLinkedAthlete && !programmePublishedLive ? (
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-amber-500/35 bg-amber-950/30 px-4 py-2.5 text-xs font-semibold text-amber-200/90">
              <input
                type="checkbox"
                checked={useMockPreview}
                onChange={(e) => setProgrammePublishedMock(e.target.checked)}
                className="rounded border-zinc-600"
              />
              Programme live (mock preview — dev only)
            </label>
          ) : null}
          </div>
        </div>
      </HyroxSection>

      <HyroxTeamDashboardView
        programmePublishedMock={false}
        programmePublishedLive={serverProgrammePublished}
        programmeVisibility={programmeVisibility}
        portalAthleteName={portalAthlete?.name}
        initialProgress={initialProgress}
      />
    </HyroxPageShell>
  );
}
