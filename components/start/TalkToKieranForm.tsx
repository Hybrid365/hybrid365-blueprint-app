"use client";

import { useState } from "react";
import { ATTRIBUTION_QUERY_KEYS } from "@/app/lib/start/attribution";
import { TALK_COPY } from "@/app/lib/start/startCopy";
import { AttributedLink } from "./AttributedLink";

const inputClasses =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#F4D23C]/50 focus:outline-none focus:ring-1 focus:ring-[#F4D23C]/50";

function collectAttribution() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const attribution: Record<string, string> = {
    landing_path: `${window.location.pathname}${window.location.search}`,
  };
  for (const key of ATTRIBUTION_QUERY_KEYS) {
    const value = params.get(key)?.trim();
    if (value) attribution[key] = value;
  }
  return attribution;
}

function Field({
  label,
  name,
  required,
  type = "text",
  placeholder,
  hint,
  textarea,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
  textarea?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-xs font-medium uppercase tracking-wider text-white/60">
        {label}
        {required ? <span className="ml-1 text-[#F4D23C]">*</span> : null}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          required={required}
          placeholder={placeholder}
          rows={4}
          className={`${inputClasses} resize-none`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={inputClasses}
          autoComplete={name === "email" ? "email" : name === "first_name" ? "given-name" : "off"}
        />
      )}
      {hint ? <p className="text-xs leading-relaxed text-white/45">{hint}</p> : null}
    </div>
  );
}

export function TalkToKieranForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      first_name: String(form.get("first_name") ?? ""),
      instagram_handle: String(form.get("instagram_handle") ?? ""),
      main_goal: String(form.get("main_goal") ?? ""),
      email: String(form.get("email") ?? ""),
      hyrox_pb: String(form.get("hyrox_pb") ?? ""),
      next_race: String(form.get("next_race") ?? ""),
      company_website: String(form.get("company_website") ?? ""),
      source: "talk_to_kieran",
      attribution: collectAttribution(),
    };

    try {
      const response = await fetch("/api/start/talk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;
      if (!response.ok || !json?.success) {
        setError(json?.error || "Couldn't send your details just yet. Please try again shortly.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Couldn't send your details just yet. Please try again shortly.");
    } finally {
      setSubmitting(false);
    }
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
      <div className="absolute left-[-10000px] h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor="company_website">Company website</label>
        <input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <Field label="First name" name="first_name" required placeholder="Kieran" />
      <Field
        label="Instagram @"
        name="instagram_handle"
        required
        placeholder="@yourhandle"
        hint={TALK_COPY.instagramHint}
      />
      <Field
        label="Main training goal"
        name="main_goal"
        required
        textarea
        placeholder="What are you working towards?"
      />
      <Field label="Email" name="email" type="email" placeholder="you@email.com" />
      <Field label="Current HYROX PB" name="hyrox_pb" placeholder="e.g. 1:15" />
      <Field label="Next race / race date" name="next_race" placeholder="e.g. London, March 2027" />

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
