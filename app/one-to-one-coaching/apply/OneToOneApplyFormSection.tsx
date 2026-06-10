"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FormCheckbox,
  FormField,
  FormSection,
} from "@/components/one-to-one-coaching/ApplyFormUi";

const APPLICATION_API = "/api/hybrid-1-1/applications";

const BODY_COMP_GOALS = [
  { value: "lean_down", label: "Lean down" },
  { value: "maintain", label: "Maintain" },
  { value: "add_muscle", label: "Add muscle" },
  { value: "not_sure", label: "Not sure" },
];

const PERFORMANCE_GOALS = [
  { value: "strength", label: "Strength" },
  { value: "running", label: "Running" },
  { value: "conditioning", label: "Conditioning" },
  { value: "general_athleticism", label: "General athleticism" },
  { value: "all_round_hybrid", label: "All-round hybrid" },
];

export default function OneToOneApplyFormSection() {
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
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#f4d23c]/30 bg-gradient-to-br from-[#f4d23c]/[0.08] to-zinc-950/80 p-8 text-center md:p-10">
          <p className="m-0 text-xs font-medium uppercase tracking-[0.2em] text-[#F4D23C]">
            Application submitted
          </p>
          <h2 className="m-0 mt-4 text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">
            Application submitted.
          </h2>
          <p className="m-0 mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75">
            You&apos;ve applied for Hybrid365 1-1 Coaching. I&apos;ll review your answers and come
            back to you if it looks like the right fit.
          </p>
          <p className="m-0 mt-4 text-sm leading-relaxed text-white/60">
            Next step: keep an eye on your email or Instagram DMs.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/one-to-one-coaching"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#F4D23C] px-6 text-sm font-black text-black transition hover:opacity-90"
            >
              Back to 1-1 coaching
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/[0.18] bg-white/[0.04] px-6 text-sm font-black text-white transition hover:bg-white/[0.08]"
            >
              Back to homepage
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-white/10 px-5 py-16 md:px-8 md:py-24">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        <FormSection title="1. Personal details">
          <FormField label="Full name" name="full_name" required className="sm:col-span-2" />
          <FormField label="Email" name="email" type="email" required />
          <FormField label="Phone" name="phone" type="tel" />
          <FormField label="Instagram handle" name="instagram" placeholder="@username" />
          <FormField label="Age" name="age" type="number" placeholder="e.g. 32" />
          <FormField label="Location" name="location" placeholder="City, country" />
          <FormField label="Occupation" name="occupation" className="sm:col-span-2" />
        </FormSection>

        <FormSection title="2. Goal">
          <FormField
            label="Main goal"
            name="main_goal"
            required
            textarea
            className="sm:col-span-2"
            placeholder="What do you want to achieve with 1-1 coaching?"
          />
          <FormField
            label="Body composition goal"
            name="body_composition_goal"
            options={BODY_COMP_GOALS}
          />
          <FormField
            label="Performance goal"
            name="performance_goal"
            options={PERFORMANCE_GOALS}
          />
          <FormField
            label="Target outcome in the next 12–16 weeks"
            name="target_outcome"
            textarea
            className="sm:col-span-2"
          />
          <FormField
            label="Why do you want 1-1 coaching?"
            name="reason_for_applying"
            required
            textarea
            className="sm:col-span-2"
          />
        </FormSection>

        <FormSection title="3. Training background">
          <FormField label="Current training split" name="current_training_split" className="sm:col-span-2" />
          <FormField label="Training age" name="training_age" placeholder="e.g. 3 years" />
          <FormField
            label="Current weekly training days"
            name="current_weekly_training_days"
            required
            placeholder="e.g. 4–5 days"
          />
          <FormField label="Current weekly training hours" name="current_weekly_training_hours" />
          <FormField label="Current running volume (if any)" name="current_running_volume" />
          <FormField label="Gym / strength training experience" name="gym_strength_experience" textarea className="sm:col-span-2" />
          <FormField label="Conditioning / cardio experience" name="conditioning_experience" textarea className="sm:col-span-2" />
          <FormField
            label="Any sports or events you're training for?"
            name="sports_events"
            textarea
            className="sm:col-span-2"
          />
        </FormSection>

        <FormSection title="4. Benchmarks (optional)">
          <FormField label="Recent 5K time" name="five_k_time" placeholder="e.g. 22:30" />
          <FormField label="Recent 10K time" name="ten_k_time" />
          <FormField label="Easy run pace" name="easy_run_pace" />
          <FormField label="Current bodyweight" name="bodyweight" />
          <FormField label="Squat (if known)" name="squat" />
          <FormField label="Deadlift (if known)" name="deadlift" />
          <FormField label="Bench (if known)" name="bench" />
          <FormField label="Pull-up / weighted pull-up" name="pull_up" />
          <FormField
            label="Progress photos available?"
            name="progress_photos_available"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
          <FormField
            label="Conditioning benchmarks"
            name="conditioning_benchmarks"
            textarea
            className="sm:col-span-2"
          />
        </FormSection>

        <FormSection title="5. Availability">
          <FormField label="Days available to train" name="days_available" className="sm:col-span-2" />
          <FormField label="Preferred training days" name="preferred_training_days" />
          <FormField
            label="Can you do double sessions?"
            name="double_sessions"
            options={[
              { value: "yes", label: "Yes" },
              { value: "sometimes", label: "Sometimes" },
              { value: "no", label: "No" },
            ]}
          />
          <FormField label="Gym access / home gym" name="gym_access" className="sm:col-span-2" />
          <FormField label="Equipment available" name="equipment_available" className="sm:col-span-2" />
          <FormField label="Work schedule / major commitments" name="work_schedule" textarea className="sm:col-span-2" />
        </FormSection>

        <FormSection title="6. Nutrition & lifestyle">
          <FormField label="Current nutrition approach" name="current_nutrition_approach" textarea className="sm:col-span-2" />
          <FormField label="Biggest nutrition struggle" name="biggest_nutrition_struggle" className="sm:col-span-2" />
          <FormField label="Sleep quality" name="sleep_quality" />
          <FormField label="Stress level" name="stress_level" />
          <FormField label="Recovery confidence" name="recovery_confidence" />
          <FormField label="Alcohol / social commitments (if relevant)" name="alcohol_social" className="sm:col-span-2" />
        </FormSection>

        <FormSection title="7. Injuries & limitations">
          <FormField label="Current injuries" name="current_injuries" textarea className="sm:col-span-2" />
          <FormField label="Previous major injuries" name="previous_injuries" textarea className="sm:col-span-2" />
          <FormField label="Movements to avoid" name="movements_to_avoid" className="sm:col-span-2" />
          <FormField label="Running / gym limitations" name="limitations" textarea className="sm:col-span-2" />
        </FormSection>

        <FormSection title="8. Coaching fit">
          <FormField
            label="What do you need most from a coach?"
            name="need_most_from_coach"
            textarea
            className="sm:col-span-2"
          />
          <FormField
            label="Willing to complete weekly check-ins?"
            name="weekly_checkins_willing"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
          <FormField
            label="Willing to track bodyweight / progress / benchmarks?"
            name="track_progress_willing"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
          <FormField
            label="Happy to use the athlete dashboard?"
            name="athlete_dashboard_happy"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
          <FormField
            label="Interested in team training meet-ups when available?"
            name="team_meetups_interest"
            options={[
              { value: "yes", label: "Yes" },
              { value: "maybe", label: "Maybe" },
              { value: "no", label: "No" },
            ]}
          />
          <FormField
            label="Anything else I should know?"
            name="anything_else"
            textarea
            className="sm:col-span-2"
          />
        </FormSection>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <h2 className="mb-5 text-sm font-black uppercase tracking-[0.12em] text-[#F4D23C]">
            9. Consent
          </h2>
          <div className="space-y-3">
            <FormCheckbox
              name="consent_information_accurate"
              required
              label="I confirm the information I've provided is accurate."
            />
            <FormCheckbox
              name="consent_contact"
              required
              label="I consent to be contacted about my application via email or Instagram."
            />
            <FormCheckbox
              name="consent_content_documentation"
              label="I'm open to sharing progress photos or training content for coaching feedback (optional)."
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/50">
            Application-based · No payment on this page · Selective coaching
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#F4D23C] px-8 text-sm font-black uppercase tracking-wide text-black transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </div>
      </form>
    </section>
  );
}
