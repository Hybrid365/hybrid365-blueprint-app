"use client";

import { useState } from "react";
import {
  HyroxCard,
  HyroxEyebrow,
  HyroxH1,
  HyroxLead,
  HyroxPageShell,
  HyroxPrimaryButton,
  HyroxSection,
} from "@/components/hyrox-team/HyroxTeamUi";
import { AssessmentStepContent } from "./assessmentStepContent";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  { id: "details", title: "Athlete details" },
  { id: "race", title: "Race goal" },
  { id: "experience", title: "Previous Hyrox experience" },
  { id: "training", title: "Current training" },
  { id: "availability", title: "Weekly availability" },
  { id: "equipment", title: "Equipment access" },
  { id: "running", title: "Running profile" },
  { id: "strength", title: "Strength profile" },
  { id: "stations", title: "Hyrox station profile" },
  { id: "injury", title: "Injury and recovery" },
  { id: "nutrition", title: "Nutrition and body composition" },
  { id: "coaching", title: "Coaching style" },
  { id: "consent", title: "Content / documentation consent" },
  { id: "submit", title: "Submit" },
] as const;

export default function AssessmentFormShell() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex]!;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <HyroxPageShell maxWidth="max-w-[960px]">
      <HyroxSection>
        <HyroxEyebrow>Hyrox Team / Assessment</HyroxEyebrow>
        <HyroxH1 accent="assessment">Athlete</HyroxH1>
        <HyroxLead>
          This assessment gives us the data needed to build your Hyrox programme properly. The more detail you provide,
          the more accurately your programme can be built around your goal, schedule, strengths, weaknesses and recovery
          capacity.
        </HyroxLead>
      </HyroxSection>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="m-0 text-sm text-zinc-500">
          Step {stepIndex + 1} of {STEPS.length} · {step.title}
        </p>
        <div className="h-2 min-w-[120px] max-w-md flex-1 overflow-hidden rounded-full bg-zinc-900">
          <div
            className="h-full rounded-full bg-[#f4d23c] transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-6 hidden gap-2 overflow-x-auto pb-2 sm:flex">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStepIndex(i)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              i === stepIndex
                ? "border-[#f4d23c]/50 bg-[#f4d23c]/15 text-[#f4d23c]"
                : i < stepIndex
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <HyroxSection clean className="!my-0">
        <h2 className="m-0 text-xl font-black uppercase tracking-[-0.03em] text-white">{step.title}</h2>
        <HyroxCard className="mt-6">
          <AssessmentStepContent stepId={step.id} />
        </HyroxCard>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-zinc-700 px-5 text-sm font-semibold text-zinc-300 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          {isLast ? (
            <HyroxPrimaryButton type="submit">Submit assessment</HyroxPrimaryButton>
          ) : (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#f4d23c] px-6 text-sm font-black text-[#050505]"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </HyroxSection>
    </HyroxPageShell>
  );
}
