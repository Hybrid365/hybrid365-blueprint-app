"use client";

import { useRef, useState } from "react";
import { COACHING_ENQUIRY_SOURCE } from "@/app/lib/start/talkEnquiry";
import { TALK_COPY } from "@/app/lib/start/startCopy";
import { AttributedLink } from "./AttributedLink";
import {
  EnquiryField,
  EnquiryHoneypot,
  collectEnquiryAttribution,
  submitCoachingEnquiry,
} from "./coachingEnquiryFormUi";

export function TalkToKieranForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || submitting || submitted) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await submitCoachingEnquiry({
      first_name: String(form.get("first_name") ?? ""),
      instagram_handle: String(form.get("instagram_handle") ?? ""),
      main_goal: String(form.get("main_goal") ?? ""),
      email: String(form.get("email") ?? ""),
      hyrox_pb: String(form.get("hyrox_pb") ?? ""),
      next_race: String(form.get("next_race") ?? ""),
      company_website: String(form.get("company_website") ?? ""),
      source: COACHING_ENQUIRY_SOURCE.talkToKieran,
      attribution: collectEnquiryAttribution(),
    });

    if (!result.ok) {
      inFlight.current = false;
      setSubmitting(false);
      setError(result.error);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">
          {TALK_COPY.successTitle}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-[15px]">
          {TALK_COPY.successBody}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-white/40">{TALK_COPY.successNote}</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <AttributedLink
            href={TALK_COPY.trackHref}
            className="inline-flex min-h-[44px] items-center text-sm font-bold text-white/55 transition hover:text-white"
          >
            {TALK_COPY.trackCta}
          </AttributedLink>
          <span className="hidden text-white/20 sm:inline" aria-hidden>
            ·
          </span>
          <AttributedLink
            href={TALK_COPY.teamHref}
            className="inline-flex min-h-[44px] items-center text-sm font-bold text-white/55 transition hover:text-white"
          >
            {TALK_COPY.teamCta}
          </AttributedLink>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-5 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 sm:p-8">
      <EnquiryHoneypot />

      <EnquiryField label="First name" name="first_name" required placeholder="Kieran" />
      <EnquiryField
        label="Instagram @"
        name="instagram_handle"
        required
        placeholder="@yourhandle"
        hint={TALK_COPY.instagramHint}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
      <EnquiryField
        label="Main training goal"
        name="main_goal"
        required
        textarea
        placeholder="What are you working towards?"
      />
      <EnquiryField label="Email" name="email" type="email" placeholder="you@email.com" />
      <EnquiryField label="Current HYROX PB" name="hyrox_pb" placeholder="e.g. 1:15" />
      <EnquiryField label="Next race / race date" name="next_race" placeholder="e.g. London, March 2027" />

      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#f4d23c] px-6 text-sm font-black uppercase tracking-wide text-[#050505] transition hover:bg-[#e8c935] disabled:opacity-60"
      >
        {submitting ? "Sending…" : TALK_COPY.cta}
      </button>
    </form>
  );
}
