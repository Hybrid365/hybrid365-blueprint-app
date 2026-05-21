"use client";

import Link from "next/link";
import { HyroxPageShell } from "@/components/hyrox-team/HyroxTeamUi";
import { AthleteAppNav } from "./AthleteAppNav";
import { PreviewGateCard, ProgrammeWaitingCard } from "./athleteUi";
import { useAthletePortal } from "./athletePortalContext";

function MockPreviewBanner() {
  return (
    <div className="border-b border-amber-500/30 bg-amber-950/40 px-4 py-2 text-center text-xs font-semibold text-amber-200/90 sm:px-6">
      Mock preview — sample data only (Alex Morgan). Not your real programme.
    </div>
  );
}

export function AthletePortalShell({
  children,
  showNav = true,
}: {
  children: React.ReactNode;
  showNav?: boolean;
}) {
  const {
    setProgrammePublishedMock,
    allowMockPreview,
    hasLinkedAthlete,
    programmeHubLive,
    programmePublishedLive,
    useMockPreview,
  } = useAthletePortal();
  const navVisible = showNav && programmeHubLive;

  return (
    <HyroxPageShell maxWidth="max-w-7xl">
      {useMockPreview ? <MockPreviewBanner /> : null}
      <div className="sticky top-0 z-40 border-b border-zinc-800/90 bg-black/95 backdrop-blur-md">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90">
                Hybrid365 Hyrox Team
              </p>
              <p className="text-sm text-zinc-500">Athlete portal</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/logout?next=/athlete/login"
                className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                Sign out
              </Link>
              {allowMockPreview && hasLinkedAthlete && !programmePublishedLive ? (
                <label className="flex cursor-pointer items-center gap-2 rounded-full border border-amber-500/35 bg-amber-950/30 px-4 py-2 text-xs font-semibold text-amber-200/90 transition hover:border-amber-500/50">
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
          </div>
        </div>
        {navVisible ? <AthleteAppNav variant="desktop" /> : null}
      </div>

      <div className={`px-4 sm:px-6 ${navVisible ? "pb-24 pt-6 lg:pb-10" : "py-6"}`}>{children}</div>

      {navVisible ? <AthleteAppNav variant="mobile" /> : null}
    </HyroxPageShell>
  );
}

export function AthletePortalGate({ children }: { children: React.ReactNode }) {
  const { programmeHubLive, programmePublishedLive, hasLinkedAthlete, allowMockPreview } =
    useAthletePortal();

  if (programmePublishedLive || programmeHubLive) {
    return <>{children}</>;
  }

  if (hasLinkedAthlete) {
    return <ProgrammeWaitingCard />;
  }

  if (allowMockPreview) {
    return <PreviewGateCard />;
  }

  return <ProgrammeWaitingCard />;
}
