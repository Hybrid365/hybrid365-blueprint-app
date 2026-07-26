"use client";

import HyroxTeamDashboardActive from "@/app/athlete/dashboard/HyroxTeamDashboardActive";
import { ProgrammePageView } from "@/components/athlete-command-centre/ProgrammePageView";
import { ProgressDashboardSection } from "@/components/athlete-command-centre/ProgressDashboardSection";
import { PerformanceHubExperience } from "@/components/athlete-command-centre/performance-hub/PerformanceHubExperience";
import { CheckInPageView } from "@/components/athlete-command-centre/CheckInPageView";
import { PerformanceTestingPageView } from "@/components/athlete-command-centre/PerformanceTestingPageView";
import { CoachNotesPageView } from "@/components/athlete-command-centre/CoachNotesPageView";
import { ResourcesPageView } from "@/components/athlete-command-centre/ResourcesPageView";
import { RacePrepPageView } from "@/components/athlete-command-centre/RacePrepPageView";
import { BenchmarksDashboardSection } from "@/components/athlete-command-centre/BenchmarksDashboardSection";
import {
  ATHLETE_PAGE_META,
  PageContent,
  PageHeader,
} from "@/components/athlete-command-centre/athleteUi";
import { AthletePortalAdminPreviewProvider } from "@/components/athlete-command-centre/athletePortalAdminPreview";
import { AdminPreviewBanner } from "@/components/admin-hyrox-athletes/AdminPreviewBanner";
import { PreviewAthleteNav } from "@/components/admin-hyrox-athletes/PreviewAthleteNav";
import { HyroxPageShell } from "@/components/hyrox-team/HyroxTeamUi";
import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import type {
  AthleteCheckInSummary,
  AthleteWeeklyCheckInView,
} from "@/app/lib/hyroxAthleteCheckInServer";
import type { HyroxDailyReadinessRow } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import { previewPathForAthlete } from "@/app/lib/hyroxAdminAthletePreviewPaths";
import { isHyroxPerformanceHubEnabledClient } from "@/app/lib/hyrox-team/modules/performanceHub/featureFlag";
import Link from "next/link";

export type PreviewSection =
  | ""
  | "programme"
  | "progress"
  | "check-in"
  | "performance-testing"
  | "benchmarks"
  | "coach-notes"
  | "race-prep"
  | "resources"
  | "testing";

export default function CoachAthletePreviewClient({
  athlete,
  programme,
  section,
  todayV2Enabled,
  performanceHubEnabled,
  athleteTimezone,
  initialCheckIn = null,
  initialCheckInSummary = null,
  initialReadiness = null,
}: {
  athlete: HyroxAthleteRow;
  programme: AthleteLiveProgrammePayload | null;
  section: PreviewSection;
  todayV2Enabled: boolean;
  performanceHubEnabled: boolean;
  athleteTimezone: string;
  initialCheckIn?: AthleteWeeklyCheckInView | null;
  initialCheckInSummary?: AthleteCheckInSummary | null;
  initialReadiness?: HyroxDailyReadinessRow | null;
}) {
  const basePath = previewPathForAthlete(athlete.id);
  const adminReturnHref = `/admin/hyrox-athletes/${athlete.id}`;
  const exitHref = `/admin/hyrox-athletes/${athlete.id}/preview/exit`;
  const portalAthlete = {
    id: athlete.id,
    name: athlete.name,
    email: athlete.email,
    status: athlete.status,
  };

  const hubOn = isHyroxPerformanceHubEnabledClient(performanceHubEnabled);

  if (!programme?.published) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-white">
        <h1 className="text-xl font-bold">No published programme</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Publish a programme block before previewing this athlete&apos;s portal.
        </p>
        <Link
          href={`${adminReturnHref}?tab=Programme%20Builder`}
          className="mt-6 inline-flex rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950"
        >
          Open Programme Builder
        </Link>
      </div>
    );
  }

  let body: React.ReactNode;
  switch (section) {
    case "programme":
      body = (
        <ProgrammePageView
          serverProgramme={programme}
          serverLoadVariant="ready"
          serverRenderDecision="programme"
          isAdminPreview
          readOnly
        />
      );
      break;
    case "progress":
      body = hubOn ? (
        <PerformanceHubExperience />
      ) : (
        <PageContent width="wide">
          <PageHeader
            eyebrow={ATHLETE_PAGE_META.progress.eyebrow}
            title={ATHLETE_PAGE_META.progress.title}
            subtitle={ATHLETE_PAGE_META.progress.subtitle}
          />
          <ProgressDashboardSection />
        </PageContent>
      );
      break;
    case "check-in":
      body = (
        <CheckInPageView
          initialCheckIn={initialCheckIn}
          initialSummary={initialCheckInSummary}
          readOnlyPreview
        />
      );
      break;
    case "performance-testing":
    case "testing":
      body = (
        <PerformanceTestingPageView
          mode="coach_preview"
          athleteId={athlete.id}
          athleteName={athlete.name}
          athleteStatus={athlete.status}
          readOnly
          backToAdminHref={adminReturnHref}
        />
      );
      break;
    case "benchmarks":
      body = (
        <PageContent>
          <PageHeader
            eyebrow={ATHLETE_PAGE_META.benchmarks.eyebrow}
            title={ATHLETE_PAGE_META.benchmarks.title}
            subtitle={ATHLETE_PAGE_META.benchmarks.subtitle}
          />
          <BenchmarksDashboardSection />
        </PageContent>
      );
      break;
    case "coach-notes":
      body = <CoachNotesPageView />;
      break;
    case "race-prep":
      body = <RacePrepPageView />;
      break;
    case "resources":
      body = <ResourcesPageView />;
      break;
    default:
      body = <HyroxTeamDashboardActive useLiveProgramme readOnly />;
  }

  return (
    <AthletePortalAdminPreviewProvider
      portalAthlete={portalAthlete}
      programme={programme}
      todayV2Enabled={todayV2Enabled}
      performanceHubEnabled={performanceHubEnabled}
      athleteTimezone={athleteTimezone}
      previewBasePath={basePath}
      adminReturnHref={adminReturnHref}
      initialReadiness={initialReadiness}
    >
      <div className="min-h-screen bg-black text-white">
        <AdminPreviewBanner
          athleteName={athlete.name}
          athleteEmail={athlete.email}
          athleteId={athlete.id}
          adminReturnHref={adminReturnHref}
          exitHref={exitHref}
        />
        <HyroxPageShell maxWidth="max-w-7xl">
          <div className="sticky top-[4.75rem] z-20 border-b border-zinc-800/90 bg-black/95 backdrop-blur-md sm:top-[3.75rem]">
            <div className="px-4 py-3 sm:px-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90">
                Hybrid365 Hyrox Team
              </p>
              <p className="text-sm text-zinc-500">Athlete portal preview</p>
            </div>
            <PreviewAthleteNav basePath={basePath} variant="desktop" />
          </div>
          <div className="min-w-0 overflow-x-hidden px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
            <div className="mx-auto max-w-5xl">{body}</div>
          </div>
          <PreviewAthleteNav basePath={basePath} variant="mobile" />
        </HyroxPageShell>
      </div>
    </AthletePortalAdminPreviewProvider>
  );
}
