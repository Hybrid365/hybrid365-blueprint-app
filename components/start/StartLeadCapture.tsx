"use client";

import { useRef, useState } from "react";
import { COACHING_ENQUIRY_SOURCE } from "@/app/lib/start/talkEnquiry";
import { START_GOALS, START_LEAD_COPY, type StartGoalId } from "@/app/lib/start/startCopy";
import {
  EnquiryField,
  EnquiryHoneypot,
  collectEnquiryAttribution,
  submitCoachingEnquiry,
} from "./coachingEnquiryFormUi";
import { StartFunnelCard } from "./StartFunnelCard";

export function StartLeadCapture({
  goalId,
  onBack,
  onSuccess,
}: {
  goalId: StartGoalId;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const goal = START_GOALS[goalId];
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || submitting) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await submitCoachingEnquiry({
      first_name: String(form.get("first_name") ?? ""),
      email: String(form.get("email") ?? ""),
      instagram_handle: String(form.get("instagram_handle") ?? ""),
      main_goal: goal.enquiryGoal,
      company_website: String(form.get("company_website") ?? ""),
      source: COACHING_ENQUIRY_SOURCE.startFunnel,
      attribution: collectEnquiryAttribution(),
    });

    if (!result.ok) {
      inFlight.current = false;
      setSubmitting(false);
      setError(result.error);
      return;
    }

    onSuccess();
  }

  return (
    <StartFunnelCard step={2}>
      <button
        type="button"
        onClick={onBack}
        className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/38 transition hover:text-white/70"
      >
        {START_LEAD_COPY.back}
      </button>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f4d23c]">
        {goal.title}
      </p>
      <h1 className="mt-1.5 font-black uppercase leading-[0.92] tracking-[-0.04em] text-white text-[clamp(1.25rem,4.8vw,1.85rem)]">
        {START_LEAD_COPY.kicker}
        <br />
        {START_LEAD_COPY.headline}
      </h1>
      <p className="mt-2 max-w-[42ch] text-[12px] leading-snug text-white/48 sm:text-[13px]">
        {START_LEAD_COPY.supporting}
      </p>

      <form onSubmit={handleSubmit} className="relative mt-4 sm:mt-5">
        <EnquiryHoneypot />
        <div className="space-y-3">
          <EnquiryField
            label="First name"
            name="first_name"
            required
            placeholder="First name"
          />
          <EnquiryField
            label="Email"
            name="email"
            type="email"
            required
            placeholder="Email"
          />
          <EnquiryField
            label="Instagram"
            name="instagram_handle"
            required
            placeholder="Instagram"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-md bg-[#f4d23c] px-6 text-[13px] font-black uppercase tracking-[0.08em] text-[#111] transition hover:bg-[#e8c935] disabled:opacity-60"
          >
            {submitting ? START_LEAD_COPY.submitting : START_LEAD_COPY.cta}
          </button>
          <p className="text-center text-[10px] text-white/32">{START_LEAD_COPY.privacy}</p>
        </div>
      </form>
    </StartFunnelCard>
  );
}
