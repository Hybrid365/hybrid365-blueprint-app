"use client";

import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Loader2,
  Lock,
  Sparkles,
  Timer,
  XCircle,
} from "lucide-react";
import { AthleteSecondaryLink } from "@/components/hyrox-team/AthleteNextStepCard";
import { HyroxPrimaryButton } from "@/components/hyrox-team/HyroxTeamUi";
import type { AthleteOnboardingProgress } from "@/app/lib/hyroxAthleteOnboardingFlow";
import {
  buildDashboardStatusChecklist,
  getAthleteNextAction,
  getDashboardCtas,
} from "@/app/lib/hyroxAthleteOnboardingFlow";
import { LOCKED_PREVIEW_MODULES } from "@/app/lib/hyroxTeamDashboardMock";
import { DashCard, LockedPreviewCard } from "@/components/hyrox-team/HyroxDashboardUi";

type CardState = "complete" | "current" | "queued" | "locked";

export type DashboardPipelineInput = AthleteOnboardingProgress;

function buildStatusPipeline(input: AthleteOnboardingProgress) {
  const checklist = buildDashboardStatusChecklist(input);
  return [
    {
      key: "assessment",
      label: "Assessment submitted",
      description: "Profile captured for coach review.",
      state: (checklist.assessmentSubmitted ? "complete" : "current") as CardState,
    },
    {
      key: "testing",
      label: "Testing submitted",
      description: "Baseline tests and/or RoxFit race data on file.",
      state: (checklist.testingSubmitted
        ? "complete"
        : checklist.assessmentSubmitted
          ? "current"
          : "queued") as CardState,
    },
    {
      key: "coach",
      label: "Coach reviewing profile",
      description: "Your coach is reading your profile — not auto-processed.",
      state: (checklist.coachReviewing
        ? "current"
        : checklist.testingSubmitted && checklist.assessmentSubmitted
          ? "complete"
          : "queued") as CardState,
    },
    {
      key: "draft",
      label: "Programme being built",
      description: "First block built from your assessment — manually checked.",
      state: (checklist.programmeBeingBuilt
        ? "current"
        : checklist.coachReviewing
          ? "queued"
          : "queued") as CardState,
    },
    {
      key: "live",
      label: "Programme live",
      description: "Unlocks here when your coach publishes.",
      state: (checklist.programmeLive ? "complete" : "locked") as CardState,
    },
  ];
}

function StatusIcon({ state }: { state: CardState }) {
  if (state === "complete") {
    return <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />;
  }
  if (state === "current") {
    return <Loader2 className="h-5 w-5 animate-spin text-amber-300" aria-hidden />;
  }
  if (state === "queued") {
    return <Sparkles className="h-5 w-5 text-zinc-500" aria-hidden />;
  }
  return <Lock className="h-5 w-5 text-zinc-600" aria-hidden />;
}

function ChecklistRow({ label, yes }: { label: string; yes: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm text-zinc-400">
      {yes ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden />
      )}
      <span className={yes ? "text-zinc-300" : "text-zinc-500"}>{label}</span>
      <span className="ml-auto text-xs font-semibold uppercase text-zinc-600">{yes ? "Yes" : "No"}</span>
    </li>
  );
}

const DEFAULT_PIPELINE: AthleteOnboardingProgress = {
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

export default function HyroxTeamDashboardLocked({
  pipeline = DEFAULT_PIPELINE,
  athleteDisplayName,
}: {
  pipeline?: DashboardPipelineInput;
  athleteDisplayName?: string | null;
}) {
  const STATUS_PIPELINE = buildStatusPipeline(pipeline);
  const checklist = buildDashboardStatusChecklist(pipeline);
  const nextAction = getAthleteNextAction(pipeline);
  const ctas = getDashboardCtas(pipeline);

  const displayName = athleteDisplayName?.trim() || "Athlete";

  const heroTitle = checklist.programmeLive
    ? "Your programme is live."
    : checklist.programmeBeingBuilt
      ? "Your programme is being built."
      : checklist.coachReviewing
        ? "Your coach is reviewing your profile."
        : !checklist.assessmentSubmitted
          ? "Complete your assessment to get started."
          : !checklist.testingSubmitted
            ? "Submit your baseline testing."
            : "Your coach is reviewing your profile.";

  const heroCopy = checklist.programmeLive
    ? "Your training hub is active — open your programme for this week's sessions."
    : checklist.programmeBeingBuilt
      ? "Your first block is being manually built and reviewed before it goes live in this app."
      : checklist.coachReviewing || (checklist.assessmentSubmitted && checklist.testingSubmitted)
        ? "Your assessment and testing are on file. Your coach is reviewing your profile before building your first block — not an instant template."
        : !checklist.assessmentSubmitted
          ? "Your assessment gives your coach the information needed to map your profile and build your first block."
          : "You can complete baseline tests across multiple days. Saved results stay on your athlete profile.";

  return (
    <div className="space-y-8">
      <DashCard className="border-zinc-700/80 bg-gradient-to-br from-zinc-950 to-zinc-900/90">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-200">
              <Timer className="h-3.5 w-3.5" />
              {heroTitle}
            </span>
            <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">{displayName}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">{heroCopy}</p>
          </div>
          <div className="shrink-0 text-left lg:text-right">
            <p className="text-xs font-semibold uppercase text-zinc-500">Race</p>
            <p className="text-sm font-medium text-zinc-400">Set with your coach after programme publish</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <HyroxPrimaryButton href={ctas.primary.href}>{ctas.primary.buttonLabel}</HyroxPrimaryButton>
          {ctas.secondary ? (
            <AthleteSecondaryLink label={ctas.secondary.label} href={ctas.secondary.href} />
          ) : null}
        </div>
      </DashCard>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <DashCard>
          <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-zinc-500">Your status</h3>
          <ul className="m-0 mt-4 space-y-2">
            <ChecklistRow label="Assessment submitted" yes={checklist.assessmentSubmitted} />
            <ChecklistRow label="Testing submitted" yes={checklist.testingSubmitted} />
            <ChecklistRow label="Coach reviewing" yes={checklist.coachReviewing} />
            <ChecklistRow label="Programme being built" yes={checklist.programmeBeingBuilt} />
            <ChecklistRow label="Programme live" yes={checklist.programmeLive} />
          </ul>
        </DashCard>
        <DashCard>
          <h3 className="m-0 text-sm font-bold text-white">Next step</h3>
          <p className="m-0 mt-2 text-sm font-semibold text-[#f4d23c]">{nextAction.title}</p>
          <p className="m-0 mt-2 text-xs leading-relaxed text-zinc-500">{nextAction.copy}</p>
          <Link
            href="/athlete/onboarding"
            className="mt-4 inline-block text-xs font-semibold text-zinc-400 hover:text-[#f4d23c]"
          >
            Full onboarding timeline →
          </Link>
        </DashCard>
      </div>

      <div>
        <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-zinc-500">Pipeline status</h3>
        <p className="m-0 mt-1 max-w-2xl text-sm text-zinc-600">
          Coach-reviewed flow — each stage updates as your profile progresses.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STATUS_PIPELINE.map((s) => (
            <DashCard
              key={s.key}
              className={`!p-4 ${s.state === "current" ? "border-amber-500/30 bg-amber-500/[0.06]" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <StatusIcon state={s.state} />
              </div>
              <p className="m-0 mt-3 text-sm font-bold text-white">{s.label}</p>
              <p className="m-0 mt-1 text-[11px] leading-snug text-zinc-500">{s.description}</p>
            </DashCard>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <DashCard>
          <h3 className="m-0 text-lg font-bold text-white">Quick links</h3>
          <p className="m-0 mt-2 text-sm text-zinc-500">Finish or update your onboarding data while you wait.</p>
          <ul className="m-0 mt-4 space-y-2 text-sm">
            <li>
              <Link href="/athlete/assessment" className="font-semibold text-[#f4d23c] hover:underline">
                Athlete assessment →
              </Link>
            </li>
            <li>
              <Link href="/athlete/testing" className="font-semibold text-[#f4d23c] hover:underline">
                Baseline testing & RoxFit →
              </Link>
            </li>
            <li>
              <Link href="/athlete/onboarding" className="font-semibold text-zinc-400 hover:text-[#f4d23c]">
                Onboarding status →
              </Link>
            </li>
          </ul>
        </DashCard>

        <DashCard>
          <h3 className="m-0 text-sm font-bold text-white">What your coach is using</h3>
          <ul className="m-0 mt-3 space-y-1.5 text-xs text-zinc-500">
            <li>· Race goal, division and timeline</li>
            <li>· Weekly availability & equipment</li>
            <li>· Station profile & limiters</li>
            <li>· Baseline markers / RoxFit splits</li>
            <li>· First-block priorities — not a template week</li>
          </ul>
        </DashCard>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Locked until programme is published
        </h3>
        <p className="mb-4 max-w-2xl text-sm text-zinc-600">
          Your coach is building this section. Enable{" "}
          <span className="font-medium text-zinc-400">Programme live (mock)</span> above only to preview the full
          hub with sample data.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LOCKED_PREVIEW_MODULES.map((m) => (
            <LockedPreviewCard key={m.title} title={m.title} preview={m.preview} />
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { icon: LayoutDashboard, title: "Programme hub" },
            { icon: ClipboardList, title: "Check-in" },
            { icon: BarChart3, title: "Benchmarks" },
          ].map((item) => (
            <DashCard key={item.title} locked className="relative !p-4">
              <item.icon className="h-5 w-5 text-zinc-600" />
              <Lock className="absolute right-3 top-3 h-4 w-4 text-zinc-600" />
              <h4 className="m-0 mt-3 font-semibold text-zinc-500">{item.title}</h4>
              <p className="m-0 mt-1 text-xs text-zinc-600">Locked until programme is published</p>
            </DashCard>
          ))}
        </div>
      </section>
    </div>
  );
}
