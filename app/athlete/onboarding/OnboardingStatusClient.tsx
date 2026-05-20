"use client";

import {
  HyroxEyebrow,
  HyroxH1,
  HyroxLead,
  HyroxPageShell,
  HyroxPrimaryButton,
  HyroxSection,
} from "@/components/hyrox-team/HyroxTeamUi";
import { TimelineSteps, type TimelineStep } from "@/components/hyrox-team/TimelineSteps";
import Link from "next/link";

const ONBOARDING_STEPS: TimelineStep[] = [
  { n: 1, title: "Payment confirmed", status: "complete" },
  { n: 2, title: "Complete athlete assessment", status: "current", description: "Built from your profile — not a generic form dump." },
  {
    n: 3,
    title: "Submit baseline testing or recent RoxFit splits",
    status: "upcoming",
    description: "Markers + optional HYROX race data so pacing and stations are informed.",
  },
  { n: 4, title: "Coach reviews your profile", status: "upcoming", description: "Manual review — your first block is coach-checked." },
  { n: 5, title: "Programme is built", status: "upcoming", description: "Not an instant template. Your block is assembled after review." },
  { n: 6, title: "Dashboard unlocks", status: "upcoming", description: "When your programme goes live, your hub activates." },
];

export default function OnboardingStatusClient() {
  return (
    <HyroxPageShell maxWidth="max-w-[900px]">
      <HyroxSection>
        <HyroxEyebrow>Hyrox Team / Onboarding</HyroxEyebrow>
        <HyroxH1 accent="onboarding">Athlete</HyroxH1>
        <HyroxLead>
          Payment confirmed — you&apos;re cleared to start your profile. Nothing here is instant or generic: your
          assessment is coach-reviewed, and your first block is manually checked before it goes live in this app.
        </HyroxLead>
      </HyroxSection>

      <HyroxSection clean>
        <h2 className="m-0 text-xl font-black uppercase tracking-[-0.04em] text-white">What happens next</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500">
          After Stripe checkout, this is the path. Configure success URL in Stripe to land athletes here —{" "}
          <span className="font-medium text-zinc-400">/athlete/onboarding</span>
        </p>
        <div className="mt-8">
          <TimelineSteps steps={ONBOARDING_STEPS} />
        </div>
      </HyroxSection>

      <HyroxSection>
        <h2 className="m-0 text-lg font-black uppercase tracking-[-0.04em] text-white">Take the next steps</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Complete assessment and testing when you&apos;re ready. Your dashboard shows overall status until your
          programme is published by your coach.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <HyroxPrimaryButton href="/athlete/assessment">Complete assessment</HyroxPrimaryButton>
          <Link
            href="/athlete/testing"
            className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/[0.18] bg-white/[0.04] px-6 text-center text-sm font-black text-[#f6f6f6] transition hover:bg-white/[0.07]"
          >
            Submit testing
          </Link>
          <Link
            href="/athlete/dashboard"
            className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-6 text-center text-sm font-black text-zinc-300 transition hover:border-zinc-600"
          >
            View dashboard status
          </Link>
        </div>
      </HyroxSection>

      <HyroxSection clean>
        <div className="rounded-2xl border border-[#f4d23c]/20 bg-zinc-950/80 p-6">
          <p className="m-0 text-xs font-black uppercase tracking-wide text-[#f4d23c]">Why the wait feels premium</p>
          <p className="m-0 mt-3 text-sm leading-relaxed text-zinc-400">
            Hybrid365 Hyrox Team programming is coach-reviewed. Your first block is manually checked before it goes live —
            so what you see in the app matches you, not a generic week pulled from a library.
          </p>
        </div>
      </HyroxSection>
    </HyroxPageShell>
  );
}
