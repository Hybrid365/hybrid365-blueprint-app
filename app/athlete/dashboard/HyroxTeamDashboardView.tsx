"use client";

import { useEffect, useState } from "react";
import HyroxTeamDashboardActive from "./HyroxTeamDashboardActive";
import type { AthleteOnboardingProgress } from "@/app/lib/hyroxAthleteOnboardingFlow";
import { progressFromAthleteApiPayload } from "@/app/lib/hyroxAthleteOnboardingFlow";
import type { AthleteProgrammeVisibility } from "@/app/lib/hyroxProgrammeServer";
import HyroxTeamDashboardLocked from "./HyroxTeamDashboardLocked";

type Props = {
  programmePublishedMock: boolean;
  programmePublishedLive?: boolean;
  programmeVisibility?: AthleteProgrammeVisibility;
  portalAthleteName?: string | null;
};

const DEFAULT_PROGRESS: AthleteOnboardingProgress = {
  athleteStatus: "assessment_required",
  hasAssessment: false,
  hasTesting: false,
  hasCoreTestingComplete: false,
  hasRaceResult: false,
  coreSubmittedCount: 0,
  coreRequiredCount: 4,
  optionalSubmittedCount: 0,
  optionalRequiredCount: 4,
  programmeVisibility: "coach_reviewing",
  programmePublished: false,
  programmeStatus: null,
};

export default function HyroxTeamDashboardView({
  programmePublishedMock,
  programmePublishedLive = false,
  programmeVisibility,
  portalAthleteName,
}: Props) {
  const [pipeline, setPipeline] = useState<AthleteOnboardingProgress>({
    ...DEFAULT_PROGRESS,
    programmeVisibility: programmeVisibility ?? "coach_reviewing",
  });

  useEffect(() => {
    if (programmePublishedMock || programmePublishedLive) return;
    (async () => {
      try {
        const [aRes, tRes, pRes] = await Promise.all([
          fetch("/api/hyrox/athlete/assessment"),
          fetch("/api/hyrox/athlete/testing"),
          fetch("/api/hyrox/athlete/programme"),
        ]);
        const aData = aRes.ok ? await aRes.json() : {};
        const tData = tRes.ok ? await tRes.json() : {};
        const pData = pRes.ok ? await pRes.json() : {};

        const optionalSubmittedCount = tData.benchmarks
          ? Object.keys(tData.benchmarks).filter(
              (id: string) =>
                !["5k", "ski", "row2k", "compromised"].includes(id) && tData.benchmarks[id]
            ).length
          : 0;

        setPipeline(
          progressFromAthleteApiPayload({
            athleteStatus: aData.athleteStatus ?? tData.athleteStatus,
            assessmentSubmitted: aData.submitted,
            hasTesting: (tData.coreSubmittedCount ?? 0) > 0 || Boolean(tData.race),
            hasRaceResult: Boolean(tData.race),
            coreSubmittedCount: tData.coreSubmittedCount ?? 0,
            coreRequiredCount: tData.coreRequiredCount ?? 4,
            optionalSubmittedCount,
            programmeVisibility: pData?.visibility ?? programmeVisibility,
            programmePublished:
              pData?.state === "published" ||
              Boolean(pData?.published ?? pData?.hasPublishedProgramme),
            programmeStatus: pData?.programmeStatus,
          })
        );
      } catch {
        /* keep defaults */
      }
    })();
  }, [programmePublishedMock, programmePublishedLive, programmeVisibility]);

  if (programmePublishedMock || programmePublishedLive) {
    return <HyroxTeamDashboardActive useLiveProgramme={programmePublishedLive} />;
  }
  return (
    <HyroxTeamDashboardLocked pipeline={pipeline} athleteDisplayName={portalAthleteName} />
  );
}
