"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  HyroxCard,
  HyroxEyebrow,
  HyroxH1,
  HyroxLead,
  HyroxPageShell,
  HyroxPrimaryButton,
  HyroxSection,
} from "@/components/hyrox-team/HyroxTeamUi";
import type { AssessmentFormValues } from "@/app/lib/hyroxAssessmentPayload";
import { AssessmentStepContent } from "./assessmentStepContent";
import {
  AssessmentFormProvider,
  emptyAssessmentValues,
  useAssessmentForm,
} from "./assessmentFormContext";
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

function AssessmentFormInner({
  apiBasePath,
  headingName,
  intro,
  successMessage,
  primaryAfterSubmitHref,
}: {
  apiBasePath: string;
  headingName: string;
  intro: string;
  successMessage: string;
  primaryAfterSubmitHref: string | null;
}) {
  const { values, setFields } = useAssessmentForm();
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  const step = STEPS[stepIndex]!;
  const isLast = stepIndex === STEPS.length - 1;

  const loadExisting = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiBasePath, { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.submitted && data.assessment?.raw_answers) {
        setFields(data.assessment.raw_answers as AssessmentFormValues);
        setSubmitted(true);
        setSubmittedAt(data.assessment.submitted_at ?? null);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [setFields]);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiBasePath, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        detail?: string;
        code?: string;
      };
      if (!res.ok || !data.success) {
        if (process.env.NODE_ENV === "development") {
          console.error("[athlete/assessment] submit failed", data);
        }
        const detail =
          process.env.NODE_ENV === "development" && data.detail
            ? `${data.error ?? "ASSESSMENT_SAVE_FAILED"}: ${data.detail}`
            : data.error === "ASSESSMENT_SAVE_FAILED"
              ? "Could not save assessment. Please try again."
              : (data.error ?? "Could not submit assessment.");
        setError(detail);
        return;
      }
      setSubmitted(true);
      setSubmittedAt(new Date().toISOString());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted && !submitting) {
    return (
      <HyroxPageShell maxWidth="max-w-[960px]">
        <HyroxSection>
          <HyroxCard className="border-emerald-500/25 bg-emerald-500/5 p-8 text-center">
            <p className="m-0 text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
              Assessment submitted
            </p>
            <h2 className="m-0 mt-4 text-2xl font-bold text-white">Thank you</h2>
            <p className="m-0 mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-300">{successMessage}</p>
            {submittedAt ? (
              <p className="m-0 mt-2 text-xs text-zinc-500">
                Last saved {new Date(submittedAt).toLocaleString()}
              </p>
            ) : null}
            <p className="m-0 mt-4 text-xs text-zinc-500">
              You can update your answers below and resubmit — we use your latest submission for coach review.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {primaryAfterSubmitHref ? (
                <Link
                  href={primaryAfterSubmitHref}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#F4D23C] px-6 text-sm font-black text-[#050505]"
                >
                  Go to Testing
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-zinc-600 px-6 text-sm font-semibold text-zinc-300"
              >
                Update assessment
              </button>
            </div>
          </HyroxCard>
        </HyroxSection>
      </HyroxPageShell>
    );
  }

  return (
    <HyroxPageShell maxWidth="max-w-[960px]">
      <HyroxSection>
        <HyroxEyebrow>Hyrox Team / Assessment</HyroxEyebrow>
        <HyroxH1 accent="assessment">{headingName}</HyroxH1>
        <HyroxLead>
          {intro}
        </HyroxLead>
      </HyroxSection>

      {loading ? <p className="px-1 text-sm text-zinc-500">Loading your saved answers…</p> : null}

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

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

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
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit()}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#f4d23c] px-6 text-sm font-black text-[#050505] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit assessment"}
            </button>
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

export default function AssessmentFormShell({
  apiBasePath = "/api/hyrox/athlete/assessment",
  headingName = "Athlete",
  intro = "This assessment gives us the data needed to build your Hyrox programme properly. The more detail you provide, the more accurately your programme can be built around your goal, schedule, strengths, weaknesses and recovery capacity.",
  successMessage = "Assessment submitted. Next step: complete your baseline testing.",
  primaryAfterSubmitHref = "/athlete/testing",
}: {
  apiBasePath?: string;
  headingName?: string;
  intro?: string;
  successMessage?: string;
  primaryAfterSubmitHref?: string | null;
}) {
  return (
    <AssessmentFormProvider initialValues={emptyAssessmentValues()}>
      <AssessmentFormInner
        apiBasePath={apiBasePath}
        headingName={headingName}
        intro={intro}
        successMessage={successMessage}
        primaryAfterSubmitHref={primaryAfterSubmitHref}
      />
    </AssessmentFormProvider>
  );
}
