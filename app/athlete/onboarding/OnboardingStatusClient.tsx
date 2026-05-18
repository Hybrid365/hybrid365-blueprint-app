"use client";

import Link from "next/link";
import {
  HyroxCard,
  HyroxEyebrow,
  HyroxH1,
  HyroxLead,
  HyroxPageShell,
  HyroxPrimaryButton,
  HyroxSection,
} from "@/components/hyrox-team/HyroxTeamUi";
import { TimelineSteps, type TimelineStep } from "@/components/hyrox-team/TimelineSteps";

/** Mock onboarding progress — replace with API later. */
const MOCK_STEPS: TimelineStep[] = [
  { n: 1, title: "Application accepted", status: "complete" },
  { n: 2, title: "Payment confirmed", status: "complete" },
  { n: 3, title: "Athlete assessment", status: "current", description: "In progress — complete your profile." },
  { n: 4, title: "Baseline testing", status: "upcoming" },
  { n: 5, title: "Coach review", status: "upcoming" },
  { n: 6, title: "Dashboard unlock", status: "upcoming" },
];

export default function OnboardingStatusClient() {
  const assessmentComplete = false;

  return (
    <HyroxPageShell maxWidth="max-w-[900px]">
      <HyroxSection>
        <HyroxEyebrow>Hyrox Team / Onboarding</HyroxEyebrow>
        <HyroxH1 accent="onboarding">Athlete</HyroxH1>
        <HyroxLead>
          Track where you are in the setup process. Your programme will not unlock instantly — it is built manually from
          your assessment and baseline data after coach review.
        </HyroxLead>
      </HyroxSection>

      <HyroxSection clean>
        <h2 className="m-0 text-xl font-black uppercase tracking-[-0.04em] text-white">Your progress</h2>
        <div className="mt-8">
          <TimelineSteps steps={MOCK_STEPS} />
        </div>
      </HyroxSection>

      <HyroxSection>
        <HyroxCard highlight>
          <h3 className="m-0 text-base font-bold text-white">Why there&apos;s a wait</h3>
          <p className="m-0 mt-2 text-sm leading-relaxed text-[#a9a9a9]">
            Hybrid365 Hyrox Team programming is not auto-generated on payment. Your assessment answers and baseline test
            results are reviewed, then your first training block is built around your goal, schedule, strengths and
            recovery capacity. You&apos;ll get a message when your dashboard unlocks.
          </p>
        </HyroxCard>

        {!assessmentComplete ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <HyroxPrimaryButton href="/athlete/assessment">Complete athlete assessment</HyroxPrimaryButton>
            <Link
              href="/athlete/testing"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/[0.18] bg-white/[0.04] px-6 text-sm font-black text-[#f6f6f6]"
            >
              Baseline testing
            </Link>
          </div>
        ) : null}
      </HyroxSection>
    </HyroxPageShell>
  );
}
