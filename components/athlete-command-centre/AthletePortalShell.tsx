"use client";

import { HyroxPageShell } from "@/components/hyrox-team/HyroxTeamUi";
import { AthleteAppNav } from "./AthleteAppNav";
import { PreviewGateCard } from "./athleteUi";
import { useAthletePortal } from "./athletePortalContext";

export function AthletePortalShell({
  children,
  showNav = true,
}: {
  children: React.ReactNode;
  showNav?: boolean;
}) {
  const { programmePublishedMock, setProgrammePublishedMock } = useAthletePortal();
  const navVisible = showNav && programmePublishedMock;

  return (
    <HyroxPageShell maxWidth="max-w-7xl">
      <div className="sticky top-0 z-40 border-b border-zinc-800/90 bg-black/95 backdrop-blur-md">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90">
                Hybrid365 Hyrox Team
              </p>
              <p className="text-sm text-zinc-500">Athlete portal</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-400 transition hover:border-zinc-600">
              <input
                type="checkbox"
                checked={programmePublishedMock}
                onChange={(e) => setProgrammePublishedMock(e.target.checked)}
                className="rounded border-zinc-600"
              />
              Programme live (mock)
            </label>
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
  const { programmePublishedMock } = useAthletePortal();

  if (!programmePublishedMock) {
    return <PreviewGateCard />;
  }

  return <>{children}</>;
}
