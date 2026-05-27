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
import { TimelineSteps } from "@/components/hyrox-team/TimelineSteps";
import { HyroxPaymentOptionCards } from "@/components/hyrox-team/HyroxPaymentOptionCards";
import { readHyroxStripeCheckoutLinks } from "@/components/hyrox-team/hyroxStripeCheckout";
import {
  FOUNDING_PRICE_NOTE,
  MINIMUM_COMMITMENT_NOTE,
} from "@/components/hyrox-team/hyroxTeamOfferCopy";
import {
  BarChart3,
  Camera,
  ClipboardList,
  Flag,
  LayoutDashboard,
  MessageSquare,
  Target,
  Users,
  Video,
  Zap,
} from "lucide-react";

/** Read Stripe links from runtime env (Vercel) rather than a stale static build. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment | Hybrid365 Hyrox Team",
  description:
    "Choose your Hyrox Team payment option — monthly, 12-week upfront, or 16-week build. Founding athlete rates for Team 001.",
};

const AFTER_PAYMENT = [
  { n: 1, title: "Payment confirmed", description: "Stripe receipt — your spot is reserved." },
  { n: 2, title: "Onboarding", description: "You’ll land on /athlete/onboarding (set as Stripe success URL)." },
  { n: 3, title: "Complete athlete assessment", description: "Coach-reviewed profile — not a generic template." },
  {
    n: 4,
    title: "Submit baseline testing or RoxFit splits",
    description: "Markers + optional recent HYROX race data.",
  },
  { n: 5, title: "Coach reviews your profile", description: "Manual review before anything is published." },
  { n: 6, title: "Dashboard unlocks", description: "Your programme appears when your coach publishes — not instantly." },
];

const INCLUDED = [
  { icon: Target, title: "Personalised Hyrox programming", desc: "Built from your assessment, schedule and race goal." },
  { icon: ClipboardList, title: "Weekly check-ins & coach feedback", desc: "Recovery, load and accountability every week." },
  { icon: LayoutDashboard, title: "Hybrid365 athlete dashboard", desc: "Sessions, benchmarks and progress in one hub." },
  { icon: Zap, title: "Baseline testing & benchmark tracking", desc: "Honest markers from day one through race week." },
  { icon: Users, title: "Team accountability", desc: "Small group standards — you are not training alone." },
  { icon: Users, title: "Team training sessions / meetups", desc: "In-person team sessions where schedule and location allow." },
  { icon: Flag, title: "Race strategy & race-week support", desc: "Pacing, fuelling and taper guidance when it counts." },
  { icon: Camera, title: "Documented athlete journey", desc: "Your process becomes a real Hybrid365 case study." },
  { icon: Video, title: "Race-day content", desc: "Prep and race-day capture where athletes opt in." },
  { icon: BarChart3, title: "Hyrox-specific resources", desc: "Station technique, sled work, wall balls and more." },
];

export default function HyroxTeamPaymentPage() {
  const checkoutLinks = readHyroxStripeCheckoutLinks();

  return (
    <HyroxPageShell maxWidth="max-w-[1100px]">
      <HyroxSection>
        <HyroxEyebrow>Team 001 / Payment</HyroxEyebrow>
        <HyroxH1 accent="your place">Secure</HyroxH1>
        <HyroxLead>
          A selective 12-week Hyrox athlete project — coached programming, team accountability, performance tracking,
          documented progress and race-day support. More than a PDF: your first block is manually checked before it goes
          live.
        </HyroxLead>
      </HyroxSection>

      <HyroxCard className="mb-5 border-zinc-800/90 bg-zinc-950/60">
        <p className="m-0 text-xs font-black uppercase tracking-wide text-[#f4d23c]">Minimum commitment</p>
        <p className="m-0 mt-3 text-sm leading-relaxed text-zinc-300">{MINIMUM_COMMITMENT_NOTE}</p>
        <p className="m-0 mt-4 text-sm leading-relaxed text-zinc-500">{FOUNDING_PRICE_NOTE}</p>
      </HyroxCard>

      <HyroxPaymentOptionCards links={checkoutLinks} />

      <HyroxSection clean className="!my-5">
        <HyroxCard className="border-[#f4d23c]/20 bg-zinc-950/80">
          <p className="m-0 text-xs font-black uppercase tracking-wide text-[#f4d23c]">After payment</p>
          <p className="m-0 mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">
            After payment, you&apos;ll be taken to onboarding to complete your assessment and testing. In production, set
            your Stripe Payment Link success URL to{" "}
            <span className="font-mono text-zinc-300">/athlete/onboarding</span> on this domain. Until then, you can open
            onboarding manually:
          </p>
          <Link
            href="/athlete/onboarding"
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 px-5 text-sm font-bold text-zinc-200 hover:border-zinc-500"
          >
            Open onboarding page →
          </Link>
        </HyroxCard>
      </HyroxSection>

      <HyroxSection clean className="!my-2">
        <p className="m-0 max-w-3xl text-sm leading-relaxed text-[#a9a9a9]">
          <span className="font-semibold text-zinc-300">How billing works:</span> Monthly is a minimum 3-month
          commitment — the right runway for assessment, programme build, coaching and documentation. The 12-week upfront
          option covers that minimum in one payment. The 16-week build is for athletes who need a longer, fuller
          base-to-race arc.
        </p>
      </HyroxSection>

      <HyroxSection>
        <h2 className="m-0 text-2xl font-black uppercase tracking-[-0.04em] text-white">What&apos;s included</h2>
        <p className="mt-3 max-w-2xl text-sm text-[#a9a9a9]">
          Everything in the athlete project — programming, data, team environment and content where you opt in.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INCLUDED.map((item) => (
            <HyroxCard key={item.title}>
              <item.icon className="mb-3 h-5 w-5 text-[#f4d23c]" />
              <h3 className="m-0 text-sm font-bold text-white">{item.title}</h3>
              <p className="m-0 mt-2 text-xs leading-relaxed text-[#a9a9a9]">{item.desc}</p>
            </HyroxCard>
          ))}
        </div>
      </HyroxSection>

      <HyroxSection clean>
        <h2 className="m-0 text-2xl font-black uppercase tracking-[-0.04em] text-white">More than a programme</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#cccccc] sm:text-base">
          This is not just a set of workouts. The Hybrid365 Hyrox Team is a coached athlete project built around
          programming, accountability, performance tracking, team sessions, and documenting the journey from baseline to
          race day.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Small team", desc: "Selective group — high standards, real coach access." },
            { title: "Heavy documentation", desc: "Testing, training and progress captured for proof and learning." },
            { title: "Athlete project", desc: "Built for Hyrox race day — not generic hybrid fitness." },
          ].map((c) => (
            <HyroxCard key={c.title}>
              <h3 className="m-0 text-sm font-bold text-white">{c.title}</h3>
              <p className="m-0 mt-2 text-xs leading-relaxed text-zinc-500">{c.desc}</p>
            </HyroxCard>
          ))}
        </div>
      </HyroxSection>

      <HyroxSection>
        <div className="flex items-start gap-3">
          <MessageSquare className="mt-1 h-6 w-6 shrink-0 text-[#f4d23c]" />
          <div>
            <h2 className="m-0 text-2xl font-black uppercase tracking-[-0.04em] text-white">
              Content & race-day documentation
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#a9a9a9]">
              For athletes comfortable being documented, parts of the process may be filmed or posted: baseline testing,
              training sessions, check-ins, progress updates, team meetups, race prep, race day and results. This is part
              of building the Hybrid365 athlete project and creating real case studies — always with your consent
              (captured in assessment).
            </p>
          </div>
        </div>
      </HyroxSection>

      <HyroxSection clean>
        <h2 className="m-0 text-2xl font-black uppercase tracking-[-0.04em] text-white">
          What happens after payment?
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-zinc-500">
          Stripe confirmation, then onboarding — assessment and testing before your coach publishes your programme.
        </p>
        <div className="mt-8">
          <TimelineSteps
            steps={AFTER_PAYMENT.map((s, i) => ({
              ...s,
              status: i === 0 ? ("complete" as const) : i === 1 ? ("current" as const) : ("upcoming" as const),
            }))}
          />
        </div>
      </HyroxSection>
    </HyroxPageShell>
  );
}
