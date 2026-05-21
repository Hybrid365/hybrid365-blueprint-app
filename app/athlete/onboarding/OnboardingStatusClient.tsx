"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AthleteNextStepCard,
  AthleteSecondaryLink,
} from "@/components/hyrox-team/AthleteNextStepCard";
import {
  HyroxEyebrow,
  HyroxH1,
  HyroxLead,
  HyroxPageShell,
  HyroxSection,
} from "@/components/hyrox-team/HyroxTeamUi";
import { TimelineSteps } from "@/components/hyrox-team/TimelineSteps";
import {
  buildOnboardingPipelineSteps,
  getAthleteNextAction,
  progressFromAthleteApiPayload,
  type AthleteOnboardingProgress,
} from "@/app/lib/hyroxAthleteOnboardingFlow";

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

export default function OnboardingStatusClient({
  athleteName,
  initialProgress,
}: {
  athleteName: string | null;
  initialProgress: AthleteOnboardingProgress | null;
}) {
  const [progress, setProgress] = useState<AthleteOnboardingProgress>(
    initialProgress ?? DEFAULT_PROGRESS
  );
  const [autoLinkNotice, setAutoLinkNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const msg = sessionStorage.getItem("hyrox_auto_link_notice");
      if (msg) {
        setAutoLinkNotice(msg);
        sessionStorage.removeItem("hyrox_auto_link_notice");
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [aRes, tRes, pRes] = await Promise.all([
          fetch("/api/hyrox/athlete/assessment", { credentials: "include" }),
          fetch("/api/hyrox/athlete/testing", { credentials: "include" }),
          fetch("/api/hyrox/athlete/programme", { credentials: "include" }),
        ]);
        const aData = aRes.ok ? await aRes.json() : {};
        const tData = tRes.ok ? await tRes.json() : {};
        const pData = pRes.ok ? await pRes.json() : {};
        if (cancelled) return;

        const optionalSubmittedCount = tData.benchmarks
          ? Object.keys(tData.benchmarks).filter(
              (id: string) =>
                !["5k", "ski", "row2k", "compromised"].includes(id) && tData.benchmarks[id]
            ).length
          : 0;

        setProgress(
          progressFromAthleteApiPayload({
            athleteStatus: aData.athleteStatus ?? tData.athleteStatus,
            assessmentSubmitted: aData.submitted,
            hasTesting: (tData.coreSubmittedCount ?? 0) > 0 || Boolean(tData.race),
            hasRaceResult: Boolean(tData.race),
            coreSubmittedCount: tData.coreSubmittedCount ?? 0,
            coreRequiredCount: tData.coreRequiredCount ?? 4,
            optionalSubmittedCount,
            programmeVisibility: pData.visibility,
            programmePublished: pData.published,
            programmeStatus: pData.programmeStatus,
          })
        );
      } catch {
        /* keep server-provided progress */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const nextAction = useMemo(() => getAthleteNextAction(progress), [progress]);
  const pipelineSteps = useMemo(() => buildOnboardingPipelineSteps(progress), [progress]);

  const statusLabel = progress.programmePublished
    ? "Programme live"
    : progress.programmeVisibility === "building"
      ? "Programme being built"
      : progress.hasAssessment && (progress.hasTesting || progress.hasRaceResult)
        ? "Coach review"
        : progress.hasAssessment
          ? "Baseline testing"
          : "Assessment";

  return (
    <HyroxPageShell maxWidth="max-w-[900px]">
      {autoLinkNotice ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-100/90">
          {autoLinkNotice}
        </div>
      ) : null}
      <HyroxSection>
        <HyroxEyebrow>Hyrox Team / Onboarding</HyroxEyebrow>
        <HyroxH1 accent="onboarding">{athleteName ? athleteName.split(" ")[0] : "Athlete"}</HyroxH1>
        <HyroxLead>
          Your Hyrox Team path in one place — see where you are, what&apos;s next, and which steps are still
          waiting on your coach.
        </HyroxLead>
        <p className="mt-4 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-zinc-300">
          Current status: <span className="ml-2 text-[#f4d23c]">{statusLabel}</span>
        </p>
      </HyroxSection>

      <HyroxSection clean>
        <AthleteNextStepCard action={nextAction} />
      </HyroxSection>

      <HyroxSection>
        <h2 className="m-0 text-xl font-black uppercase tracking-[-0.04em] text-white">Your pipeline</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Each step unlocks the next. Assessment and testing can be completed across multiple days — saved
          results stay on your profile.
        </p>
        <div className="mt-8">
          <TimelineSteps steps={pipelineSteps} />
        </div>
      </HyroxSection>

      <HyroxSection clean>
        <h2 className="m-0 text-lg font-black uppercase tracking-[-0.04em] text-white">Quick links</h2>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <AthleteSecondaryLink label="Assessment" href="/athlete/assessment" />
          <AthleteSecondaryLink label="Baseline testing" href="/athlete/testing" />
          <AthleteSecondaryLink label="Dashboard" href="/athlete/dashboard" />
          {progress.programmePublished ? (
            <AthleteSecondaryLink label="View programme" href="/athlete/programme" />
          ) : null}
        </div>
        <p className="mt-6 text-sm text-zinc-600">
          Programme hub, benchmarks and check-ins stay locked until your coach publishes your first block.{" "}
          <Link href="/athlete/dashboard" className="font-semibold text-zinc-400 hover:text-[#f4d23c]">
            Open dashboard →
          </Link>
        </p>
      </HyroxSection>

      <HyroxSection clean>
        <div className="rounded-2xl border border-[#f4d23c]/20 bg-zinc-950/80 p-6">
          <p className="m-0 text-xs font-black uppercase tracking-wide text-[#f4d23c]">Why the wait feels premium</p>
          <p className="m-0 mt-3 text-sm leading-relaxed text-zinc-400">
            Hybrid365 Hyrox Team programming is coach-reviewed. Your first block is manually checked before it
            goes live — so what you see in the app matches you, not a generic week pulled from a library.
          </p>
        </div>
      </HyroxSection>
    </HyroxPageShell>
  );
}
