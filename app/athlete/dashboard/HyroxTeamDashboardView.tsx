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
  const [apiLoadError, setApiLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (programmePublishedMock || programmePublishedLive) return;
    (async () => {
      setApiLoadError(null);
      try {
        const [aRes, tRes, pRes] = await Promise.all([
          fetch("/api/hyrox/athlete/assessment"),
          fetch("/api/hyrox/athlete/testing"),
          fetch("/api/hyrox/athlete/programme"),
        ]);
        const aData = (await aRes.json()) as Record<string, unknown>;
        const tData = (await tRes.json()) as Record<string, unknown>;
        const pData = (await pRes.json()) as Record<string, unknown>;

        const errors: string[] = [];
        if (!aRes.ok) errors.push(`assessment: ${(aData.error as string) ?? aRes.status}`);
        if (!tRes.ok) errors.push(`testing: ${(tData.error as string) ?? tRes.status}`);
        if (!pRes.ok) errors.push(`programme: ${(pData.error as string) ?? pRes.status}`);
        if (errors.length) {
          setApiLoadError(errors.join(" · "));
        }

        const benchmarks = tData.benchmarks as Record<string, unknown> | undefined;
        const optionalSubmittedCount = benchmarks
          ? Object.keys(benchmarks).filter(
              (id: string) =>
                !["5k", "ski", "row2k", "compromised"].includes(id) && benchmarks[id]
            ).length
          : 0;

        setPipeline(
          progressFromAthleteApiPayload({
            athleteStatus: (aData.athleteStatus as string) ?? (tData.athleteStatus as string),
            assessmentSubmitted: Boolean(aData.submitted),
            hasTesting: ((tData.coreSubmittedCount as number) ?? 0) > 0 || Boolean(tData.race),
            hasRaceResult: Boolean(tData.race),
            coreSubmittedCount: (tData.coreSubmittedCount as number) ?? 0,
            coreRequiredCount: (tData.coreRequiredCount as number) ?? 4,
            optionalSubmittedCount,
            programmeVisibility: (pData?.visibility as AthleteProgrammeVisibility) ?? programmeVisibility,
            programmePublished:
              pData?.state === "published" ||
              Boolean(pData?.published ?? pData?.hasPublishedProgramme),
            programmeStatus: (pData?.programmeStatus as string) ?? null,
          })
        );
      } catch {
        setApiLoadError("Network error loading athlete status.");
      }
    })();
  }, [programmePublishedMock, programmePublishedLive, programmeVisibility]);

  if (programmePublishedMock || programmePublishedLive) {
    return <HyroxTeamDashboardActive useLiveProgramme={programmePublishedLive} />;
  }
  return (
    <HyroxTeamDashboardLocked
      pipeline={pipeline}
      athleteDisplayName={portalAthleteName}
      apiLoadError={apiLoadError}
    />
  );
}
