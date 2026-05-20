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
import { HyroxStripePayButton } from "@/components/hyrox-team/HyroxStripeCheckoutButtons";
import {
  BUILD_16WEEK_COMMITMENT_LINE,
  BUILD_16WEEK_VALUE_BADGE,
  BUILD_16WEEK_VALUE_LINE,
  FOUNDING_PRICE_NOTE,
  MINIMUM_COMMITMENT_NOTE,
  MONTHLY_COMMITMENT_DETAIL,
  MONTHLY_COMMITMENT_HEADLINE,
  MONTHLY_COMMITMENT_INVESTMENT,
  UPFRONT_COMMITMENT_LINE,
} from "@/components/hyrox-team/hyroxTeamOfferCopy";
import {
  BarChart3,
  Camera,
  Check,
  ClipboardList,
  Flag,
  LayoutDashboard,
  MessageSquare,
  Target,
  Users,
  Video,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Payment | Hybrid365 Hyrox Team",
  description:
    "Choose your Hyrox Team payment option — monthly, 12-week upfront, or 16-week build. Founding athlete rates for Team 001.",
};

const CORE_BENEFITS = [
  "12-week Hyrox Team block",
  "Personalised Hyrox programming",
  "Weekly check-ins & coach feedback",
  "Hybrid365 athlete dashboard",
  "Baseline testing & benchmark tracking",
];

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

      <div className="grid gap-5 lg:grid-cols-3">
        <HyroxCard className="flex flex-col">
          <span className="w-fit rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-400">
            Founding athlete rate
          </span>
          <p className="m-0 mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#f4d23c]">Pay monthly</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-white">
            £150<span className="text-lg font-semibold text-zinc-500">/month</span>
          </p>
          <p className="m-0 mt-2 text-sm font-semibold text-zinc-200">{MONTHLY_COMMITMENT_HEADLINE}</p>
          <p className="m-0 mt-1 text-sm text-zinc-500">3 months · total £450</p>
          <p className="m-0 mt-4 text-xs leading-relaxed text-zinc-400">{MONTHLY_COMMITMENT_DETAIL}</p>
          <ul className="m-0 mt-4 flex-1 space-y-1.5 border-t border-zinc-800/80 pt-4">
            {MONTHLY_COMMITMENT_INVESTMENT.map((item) => (
              <li key={item} className="text-[11px] leading-snug text-zinc-500">
                · {item}
              </li>
            ))}
          </ul>
          <ul className="mt-5 space-y-2.5 border-t border-zinc-800/80 pt-5">
            {CORE_BENEFITS.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f4d23c]" />
                {b}
              </li>
            ))}
          </ul>
          <HyroxStripePayButton tier="monthly" className="mt-8 w-full">
            Pay monthly — £150/month
          </HyroxStripePayButton>
        </HyroxCard>

        <HyroxCard className="relative flex flex-col">
          <span className="absolute right-5 top-5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-300">
            Save £51 vs monthly
          </span>
          <p className="m-0 mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#f4d23c]">12-week upfront</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-white">£399</p>
          <p className="m-0 mt-2 text-sm font-semibold text-emerald-300/90">{UPFRONT_COMMITMENT_LINE}</p>
          <p className="m-0 mt-1 text-sm text-zinc-500">One payment · full 12-week Hyrox Team block</p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {CORE_BENEFITS.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f4d23c]" />
                {b}
              </li>
            ))}
          </ul>
          <HyroxStripePayButton tier="upfront" className="mt-8 w-full">
            Pay upfront — £399 · 12 weeks
          </HyroxStripePayButton>
        </HyroxCard>

        <HyroxCard highlight className="relative flex flex-col">
          <span className="absolute right-5 top-5 rounded-full border border-[#f4d23c]/40 bg-[#f4d23c]/15 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#f4d23c]">
            {BUILD_16WEEK_VALUE_BADGE}
          </span>
          <span className="w-fit rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-400">
            Extended 1-1 build
          </span>
          <p className="m-0 mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#f4d23c]">16-week build</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-white">£549</p>
          <p className="m-0 mt-2 text-sm font-semibold text-[#f4d23c]/90">{BUILD_16WEEK_VALUE_LINE}</p>
          <p className="m-0 mt-3 text-xs leading-relaxed text-zinc-400">{BUILD_16WEEK_COMMITMENT_LINE}</p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {CORE_BENEFITS.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f4d23c]" />
                {b}
              </li>
            ))}
            <li className="flex gap-2 text-sm text-zinc-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f4d23c]" />
              16-week base-to-race progression
            </li>
          </ul>
          <HyroxStripePayButton tier="sixteenWeek" className="mt-8 w-full">
            Pay upfront — £549 · 16 weeks
          </HyroxStripePayButton>
        </HyroxCard>
      </div>

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
