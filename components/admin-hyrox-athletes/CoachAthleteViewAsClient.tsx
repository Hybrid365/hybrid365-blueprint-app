"use client";

import { useState } from "react";
import Link from "next/link";
import { CoachAdminShell } from "@/components/admin-hyrox-athletes/CoachAdminShell";
import { AdminPreviewBanner } from "@/components/admin-hyrox-athletes/AdminPreviewBanner";
import { AthletePortalAdminPreviewProvider } from "@/components/athlete-command-centre/athletePortalAdminPreview";
import { ProgrammePageView } from "@/components/athlete-command-centre/ProgrammePageView";
import HyroxTeamDashboardActive from "@/app/athlete/dashboard/HyroxTeamDashboardActive";
import { AthletePortalShell } from "@/components/athlete-command-centre/AthletePortalShell";
import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";

type PreviewTab = "dashboard" | "programme";

export default function CoachAthleteViewAsClient({
  athlete,
  programme,
}: {
  athlete: HyroxAthleteRow;
  programme: AthleteLiveProgrammePayload | null;
}) {
  const [tab, setTab] = useState<PreviewTab>("dashboard");

  if (!programme?.published) {
    return (
      <CoachAdminShell
        title={`Preview · ${athlete.name}`}
        backHref="/admin/hyrox-athletes/published-views"
        backLabel="Published views"
      >
        <p className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-6 text-sm text-zinc-300">
          This athlete has no published programme block yet. Publish a block from the coach
          workspace before using view-as preview.
        </p>
        <Link
          href={`/admin/hyrox-athletes/${athlete.id}?tab=Programme%20Builder`}
          className="mt-4 inline-block text-sm font-semibold text-yellow-300 hover:text-yellow-200"
        >
          Open coach workspace →
        </Link>
      </CoachAdminShell>
    );
  }

  const portalAthlete = {
    id: athlete.id,
    name: athlete.name,
    email: athlete.email,
    status: athlete.status,
  };

  return (
    <CoachAdminShell
      title={`Preview · ${athlete.name}`}
      backHref="/admin/hyrox-athletes/published-views"
      backLabel="Published views"
      actions={
        <Link
          href={`/admin/hyrox-athletes/${athlete.id}?tab=Programme%20Builder`}
          className="text-xs font-semibold text-zinc-500 hover:text-yellow-300"
        >
          Coach workspace →
        </Link>
      }
    >
      <AdminPreviewBanner athleteName={athlete.name} />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        {(["dashboard", "programme"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition ${
              tab === t
                ? "bg-yellow-400/15 text-yellow-200 ring-1 ring-yellow-500/40"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-black">
        <AthletePortalAdminPreviewProvider portalAthlete={portalAthlete} programme={programme}>
          {tab === "dashboard" ? (
            <AthletePortalShell adminPreviewMode>
              <HyroxTeamDashboardActive useLiveProgramme readOnly />
            </AthletePortalShell>
          ) : (
            <ProgrammePageView
              serverProgramme={programme}
              serverLoadVariant="ready"
              serverRenderDecision="programme"
              isAdminPreview
              readOnly
            />
          )}
        </AthletePortalAdminPreviewProvider>
      </div>
    </CoachAdminShell>
  );
}
