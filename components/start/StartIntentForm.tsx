"use client";

import { useRef, useState } from "react";
import {
  COACHING_ENQUIRY_SOURCE,
  FIRST_HYROX_LEVEL_VALUE,
} from "@/app/lib/start/talkEnquiry";
import { START_INTENT_COPY } from "@/app/lib/start/startCopy";
import {
  EnquiryField,
  EnquiryHoneypot,
  collectEnquiryAttribution,
  enquiryInputClasses,
  submitCoachingEnquiry,
} from "./coachingEnquiryFormUi";

type HyroxLevel = "first" | "pb" | "";

export function StartIntentForm({ onSuccess }: { onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hyroxLevel, setHyroxLevel] = useState<HyroxLevel>("");
  const inFlight = useRef(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || submitting) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const level = String(form.get("hyrox_level") ?? "") as HyroxLevel;
    const pbValue = String(form.get("hyrox_pb") ?? "").trim();

    if (level !== "first" && level !== "pb") {
      inFlight.current = false;
      setSubmitting(false);
      setError("Please add your current HYROX level.");
      return;
    }
    if (level === "pb" && !pbValue) {
      inFlight.current = false;
      setSubmitting(false);
      setError("Please add your current HYROX PB.");
      return;
    }

    const result = await submitCoachingEnquiry({
      first_name: String(form.get("first_name") ?? ""),
      instagram_handle: String(form.get("instagram_handle") ?? ""),
      main_goal: String(form.get("main_goal") ?? ""),
      hyrox_pb: level === "first" ? FIRST_HYROX_LEVEL_VALUE : pbValue,
      next_race: String(form.get("next_race") ?? ""),
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

  const levelCard = (value: "first" | "pb", label: string) => {
    const selected = hyroxLevel === value;
    return (
      <label
        className={
          selected
            ? "flex min-h-[52px] cursor-pointer items-center rounded-xl border border-[#f4d23c]/70 bg-[#f4d23c]/10 px-4 text-sm font-semibold text-white"
            : "flex min-h-[52px] cursor-pointer items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/75"
        }
      >
        <input
          type="radio"
          name="hyrox_level"
          value={value}
          required
          checked={selected}
          onChange={() => setHyroxLevel(value)}
          className="sr-only"
        />
        {label}
      </label>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
      <EnquiryHoneypot />
      <div className="space-y-5 p-6 pb-4 sm:p-8">
        <EnquiryField label="First name" name="first_name" required placeholder="Kieran" />
        <EnquiryField
          label="Instagram @"
          name="instagram_handle"
          required
          placeholder="@yourhandle"
          hint={START_INTENT_COPY.instagramHint}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <EnquiryField
          label="Main goal"
          name="main_goal"
          required
          placeholder={START_INTENT_COPY.goalPlaceholder}
        />

        <fieldset className="space-y-3">
          <legend className="block text-xs font-medium uppercase tracking-wider text-white/60">
            Current HYROX level
            <span className="ml-1 text-[#F4D23C]">*</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {levelCard("first", START_INTENT_COPY.firstHyroxLabel)}
            {levelCard("pb", START_INTENT_COPY.hasPbLabel)}
          </div>
          {hyroxLevel === "pb" ? (
            <input
              id="hyrox_pb"
              name="hyrox_pb"
              type="text"
              required
              placeholder={START_INTENT_COPY.pbPlaceholder}
              className={enquiryInputClasses}
              autoComplete="off"
            />
          ) : null}
        </fieldset>

        <EnquiryField
          label="Next race"
          name="next_race"
          placeholder={START_INTENT_COPY.racePlaceholder}
        />

        {error ? (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="sticky bottom-0 border-t border-white/10 bg-[#0a0a0a]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-8 sm:pt-0">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#f4d23c] px-6 text-sm font-black uppercase tracking-wide text-[#050505] transition hover:bg-[#e8c935] disabled:opacity-60"
        >
          {submitting ? START_INTENT_COPY.submitting : START_INTENT_COPY.cta}
        </button>
      </div>
    </form>
  );
}
