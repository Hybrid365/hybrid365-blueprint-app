import type { Metadata } from "next";
import Link from "next/link";
import {
  HyroxCard,
  HyroxEyebrow,
  HyroxH1,
  HyroxLead,
  HyroxPageShell,
  HyroxSection,
} from "@/components/hyrox-team/HyroxTeamUi";
import { HyroxPaymentOptionCards } from "@/components/hyrox-team/HyroxPaymentOptionCards";
import { readHyroxStripeCheckoutLinks } from "@/components/hyrox-team/hyroxStripeCheckout";
import {
  FOUNDING_PRICE_NOTE,
  MINIMUM_COMMITMENT_NOTE,
  MONTHLY_COMMITMENT_DETAIL,
  MONTHLY_COMMITMENT_HEADLINE,
} from "@/components/hyrox-team/hyroxTeamOfferCopy";
import { TimelineSteps } from "@/components/hyrox-team/TimelineSteps";
import {
  BarChart3,
  ClipboardList,
  Flag,
  LayoutDashboard,
  MessageSquare,
  Target,
  Users,
  Zap,
} from "lucide-react";

/** Read Stripe links from runtime env (Vercel) rather than a stale static build. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accepted | Hybrid365 Hyrox Team",
  description: "You have been accepted into the Hybrid365 Hyrox Team — secure your place and begin onboarding.",
};

const NEXT_STEPS = [
  { n: 1, title: "Secure your place", description: "Monthly or upfront via Stripe — your links are sent when you're approved." },
  { n: 2, title: "Onboarding", description: "After payment, land on /athlete/onboarding — then assessment + testing." },
  { n: 3, title: "Complete athlete assessment", description: "Deep-dive profile so programming matches you — coach-reviewed, not generic." },
  { n: 4, title: "Complete baseline testing", description: "Markers + optional RoxFit race splits." },
  { n: 5, title: "Coach review", description: "Your data is read manually before anything is published." },
  { n: 6, title: "Dashboard unlock", description: "Programme appears when your coach publishes — not automatic on submit." },
];

const INCLUDED = [
  { icon: Target, title: "Personalised Hyrox programming", desc: "12-week block built around your race and profile." },
  { icon: ClipboardList, title: "Weekly check-ins", desc: "Recovery, load and accountability every week." },
  { icon: LayoutDashboard, title: "Athlete dashboard", desc: "Sessions, habits and progress in one place." },
  { icon: Zap, title: "Baseline testing", desc: "Structured markers before training ramps." },
  { icon: BarChart3, title: "Benchmark tracking", desc: "See strength, engine and race markers move." },
  { icon: MessageSquare, title: "Coach notes", desc: "Context and adjustments from your coach." },
  { icon: Users, title: "Team accountability", desc: "Small-group standards and shared intent." },
  { icon: Flag, title: "Race strategy support", desc: "Pacing and race-week guidance when it matters." },
];

export default function HyroxTeamAcceptedPage() {
  const checkoutLinks = readHyroxStripeCheckoutLinks();

  return (
    <HyroxPageShell>
      <HyroxSection>
        <HyroxEyebrow>Team 001 / Accepted</HyroxEyebrow>
        <HyroxH1 accent="Hyrox Team">
          You&apos;ve been accepted into the Hybrid365
        </HyroxH1>
        <HyroxLead>
          You&apos;ve been accepted into the Hybrid365 Hyrox Team. Secure your place, then complete your athlete
          assessment. This is selective 1-1 coaching inside a small team — your first block is coach-reviewed before it
          goes live, not scraped from a template library.
        </HyroxLead>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Secure your place below. <span className="font-medium text-zinc-300">{MONTHLY_COMMITMENT_HEADLINE}</span> — each
          athlete gets real coach time and project investment from day one, not a generic plan. Prefer full
          detail?{" "}
          <Link href="/hyrox-team/payment" className="font-semibold text-[#f4d23c] underline-offset-4 hover:underline">
            View all payment options →
          </Link>
        </p>
        <HyroxCard className="mt-6 max-w-3xl border-zinc-800/90">
          <p className="m-0 text-sm leading-relaxed text-zinc-300">{MINIMUM_COMMITMENT_NOTE}</p>
          <p className="m-0 mt-3 text-xs leading-relaxed text-zinc-500">{MONTHLY_COMMITMENT_DETAIL}</p>
          <p className="m-0 mt-4 text-xs leading-relaxed text-zinc-500">{FOUNDING_PRICE_NOTE}</p>
        </HyroxCard>
        <div className="mt-8">
          <HyroxPaymentOptionCards links={checkoutLinks} />
        </div>
      </HyroxSection>

      <HyroxSection clean>
        <h2 className="m-0 text-2xl font-black uppercase tracking-[-0.04em] text-white">Your next steps</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#a9a9a9]">
          Flow is intentional: payment → onboarding → assessment + testing → coach review → programme published to your
          dashboard.
        </p>
        <div className="mt-8">
          <TimelineSteps steps={NEXT_STEPS} />
        </div>
      </HyroxSection>

      <HyroxSection>
        <h2 className="m-0 text-2xl font-black uppercase tracking-[-0.04em] text-white">What&apos;s included</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INCLUDED.map((item) => (
            <HyroxCard key={item.title}>
              <item.icon className="mb-3 h-5 w-5 text-[#f4d23c]" />
              <h3 className="m-0 text-base font-bold text-white">{item.title}</h3>
              <p className="m-0 mt-2 text-sm leading-relaxed text-[#a9a9a9]">{item.desc}</p>
            </HyroxCard>
          ))}
        </div>
      </HyroxSection>

      <HyroxSection clean>
        <HyroxCard highlight className="max-w-3xl">
          <h3 className="m-0 text-lg font-black uppercase tracking-[-0.03em] text-white">Commitment note</h3>
          <p className="m-0 mt-3 text-sm leading-relaxed text-[#cccccc]">
            This is not a generic Hyrox plan pulled off a shelf. Your programme is manually built and checked after your
            athlete assessment and baseline testing are complete. That delay is the point — it&apos;s what makes the
            coaching bespoke.
          </p>
        </HyroxCard>
        <div className="mt-8">
          <Link
            href="/hyrox-team/payment"
            className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/[0.18] bg-white/[0.04] px-6 font-black tracking-[-0.02em] text-[#f6f6f6] transition hover:-translate-y-0.5 hover:opacity-90"
          >
            View payment details & pricing
          </Link>
        </div>
        <p className="mt-6 text-sm text-zinc-600">
          Configure Stripe success URL to <span className="font-mono text-zinc-400">/athlete/onboarding</span> when you
          wire live checkout.
        </p>
      </HyroxSection>
    </HyroxPageShell>
  );
}
