"use client";

import { useState } from "react";
import Link from "next/link";

const APPLICATION_API = "/api/hyrox/applications";

function FormField({
  label,
  name,
  type = "text",
  required = true,
  textarea = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  placeholder?: string;
}) {
  const inputClasses =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#F4D23C]/50 focus:outline-none focus:ring-1 focus:ring-[#F4D23C]/50 transition-colors";

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-xs font-medium uppercase tracking-wider text-white/60">
        {label}
        {required && <span className="ml-1 text-[#F4D23C]">*</span>}
      </label>

      {textarea ? (
        <textarea
          id={name}
          name={name}
          required={required}
          placeholder={placeholder}
          rows={4}
          className={inputClasses + " resize-none"}
        />
      ) : (
        <input id={name} name={name} type={type} required={required} placeholder={placeholder} className={inputClasses} />
      )}
    </div>
  );
}

export default function HyroxTeamApplyFormSection() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const fields: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === "string" && !key.startsWith("_")) {
        fields[key] = value;
      }
    });

    if (!fields.name?.trim()) {
      setError("Full name is required.");
      setSubmitting(false);
      return;
    }
    if (!fields.email?.trim()) {
      setError("Email is required.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(APPLICATION_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(fields),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !data.success) {
        if (process.env.NODE_ENV === "development" && data.detail) {
          console.error("[hyrox-team/apply] submission failed:", data.error, data.detail);
        }
        setError(
          data.error === "APPLICATION_INSERT_FAILED"
            ? "Could not save your application. Please try again shortly."
            : typeof data.error === "string"
              ? data.error
              : "Something went wrong. Please try again."
        );
        return;
      }
      setSubmitted(true);
      form.reset();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="border-t border-white/10 px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#f4d23c]/30 bg-gradient-to-br from-[#f4d23c]/[0.08] to-zinc-950/80 p-8 md:p-10 text-center">
          <p className="m-0 text-xs font-medium uppercase tracking-[0.2em] text-[#F4D23C]">Application received</p>
          <h2 className="m-0 mt-4 text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">
            We&apos;ll be in touch
          </h2>
          <p className="m-0 mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75">
            Application received. We&apos;ll review your application and contact successful applicants with next steps.
          </p>
          <p className="m-0 mt-6 text-sm leading-relaxed text-white/50">
            This is a manual review — you won&apos;t be redirected to payment. If you&apos;re a strong fit for Team
            001, you&apos;ll hear from us directly.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/hyrox-team"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/[0.18] bg-white/[0.04] px-6 text-sm font-black text-white transition hover:bg-white/[0.08]"
            >
              Back to Hyrox Team
            </Link>
            <Link
              href="/free-week"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#F4D23C] px-6 text-sm font-black text-black transition hover:opacity-90"
            >
              Free training week
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="border-t border-white/10 px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <input type="hidden" name="_subject" value="New Hybrid365 Hyrox Team Application" />
            <input type="hidden" name="source" value="Hybrid365 Hyrox Team Application Page" />

            {error ? (
              <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
            ) : null}

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
              <h3 className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-[#F4D23C]">Personal Details</h3>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Full Name" name="name" placeholder="Your full name" />
                <FormField label="Email Address" name="email" type="email" placeholder="your@email.com" />
                <FormField label="Instagram Handle" name="instagram" placeholder="@yourhandle" required={false} />
                <FormField label="Location" name="location" placeholder="City, Country" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
              <h3 className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-[#F4D23C]">Current Fitness</h3>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Current Hyrox Experience" name="hyrox_experience" placeholder="e.g. 2 races, Pro division" />
                <FormField label="Current Hyrox PB / Result" name="hyrox_pb" placeholder="e.g. 1:12:34" />
                <FormField label="Current 5km Time" name="five_km_time" placeholder="e.g. 22:30" />
                <FormField label="Upcoming Race / Target Event" name="upcoming_race" placeholder="e.g. Hyrox London, March 2025" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
              <h3 className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-[#F4D23C]">Training</h3>

              <div className="space-y-5">
                <FormField
                  label="Current Weekly Training"
                  name="weekly_training"
                  textarea
                  placeholder="Describe your typical training week — frequency, type of sessions, duration..."
                />
                <FormField
                  label="Main Goal"
                  name="main_goal"
                  textarea
                  placeholder="What's your primary goal for Hyrox? Time target, division, personal challenge..."
                />
                <FormField
                  label="Biggest Weakness / Limiter"
                  name="weakness"
                  textarea
                  placeholder="What holds you back the most? Running, specific stations, pacing, recovery..."
                />
                <FormField
                  label="Training History, Injuries, Equipment Notes"
                  name="training_history"
                  textarea
                  required={false}
                  placeholder="Anything we should know about your background, injury history, or gym setup..."
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
              <h3 className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-[#F4D23C]">Team Fit</h3>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="documented" className="block text-xs font-medium uppercase tracking-wider text-white/60">
                    Are you happy for your progress to be documented?
                    <span className="ml-1 text-[#F4D23C]">*</span>
                  </label>

                  <select
                    id="documented"
                    name="documented"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F4D23C]/50 focus:outline-none focus:ring-1 focus:ring-[#F4D23C]/50 transition-colors"
                  >
                    <option value="" className="bg-black">
                      Select an option
                    </option>
                    <option value="yes" className="bg-black">
                      Yes
                    </option>
                    <option value="no" className="bg-black">
                      No
                    </option>
                    <option value="maybe" className="bg-black">
                      Open to discussing
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="team_training" className="block text-xs font-medium uppercase tracking-wider text-white/60">
                    Can you attend occasional team training sessions?
                    <span className="ml-1 text-[#F4D23C]">*</span>
                  </label>

                  <select
                    id="team_training"
                    name="team_training"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F4D23C]/50 focus:outline-none focus:ring-1 focus:ring-[#F4D23C]/50 transition-colors"
                  >
                    <option value="" className="bg-black">
                      Select an option
                    </option>
                    <option value="yes" className="bg-black">
                      Yes
                    </option>
                    <option value="no" className="bg-black">
                      No
                    </option>
                    <option value="depending_on_location" className="bg-black">
                      Depending on location
                    </option>
                  </select>
                </div>

                <FormField
                  label="Why do you want to join the first Hybrid365 Hyrox Team?"
                  name="why_join"
                  textarea
                  placeholder="What draws you to this project? What would being part of this team mean for you?"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  id="consent"
                  name="consent"
                  required
                  className="mt-1 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 checked:border-[#F4D23C] checked:bg-[#F4D23C] focus:outline-none focus:ring-2 focus:ring-[#F4D23C]/50"
                />

                <label htmlFor="consent" className="cursor-pointer text-sm leading-relaxed text-white/70">
                  I understand this is an application for a selective athlete project. I consent to my information being
                  reviewed by the Hybrid365 team and understand that submitting this form does not guarantee a place on
                  the team.
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#F4D23C] px-8 py-4 text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-[#F4D23C]/90 focus:outline-none focus:ring-2 focus:ring-[#F4D23C] focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              >
                {submitting ? "Sending…" : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xl font-bold uppercase tracking-wide text-white/50 md:text-2xl">This is for athletes ready to work.</p>
        </div>
      </section>
    </>
  );
}
