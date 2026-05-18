import type { Metadata } from "next";
import {
  HyroxCard,
  HyroxEyebrow,
  HyroxH1,
  HyroxLead,
  HyroxPageShell,
  HyroxPrimaryButton,
  HyroxSection,
} from "@/components/hyrox-team/HyroxTeamUi";
import { TimelineSteps } from "@/components/hyrox-team/TimelineSteps";
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
  description: "Choose your Hyrox Team payment option — monthly or upfront for the 12-week coaching block.",
};

const CORE_BENEFITS = [
  "12-week Hyrox Team block",
  "Personalised Hyrox programming",
  "Weekly check-ins & coach feedback",
  "Hybrid365 athlete dashboard",
  "Baseline testing & benchmark tracking",
];

const AFTER_PAYMENT = [
  { n: 1, title: "Payment confirmed" },
  { n: 2, title: "Create / login to athlete account" },
  { n: 3, title: "Complete athlete assessment" },
  { n: 4, title: "Complete baseline testing" },
  { n: 5, title: "Coach review" },
  { n: 6, title: "Programme & dashboard unlocked" },
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
          documented progress and race-day support. This is more than a PDF plan.
        </HyroxLead>
      </HyroxSection>

      <div className="grid gap-5 lg:grid-cols-2">
        <HyroxCard className="flex flex-col">
          <span className="w-fit rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-400">
            Founding athlete rate
          </span>
          <p className="m-0 mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#f4d23c]">Pay monthly</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-white">
            £150<span className="text-lg font-semibold text-zinc-500">/month</span>
          </p>
          <p className="m-0 mt-1 text-sm text-zinc-500">3 months · total £450</p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {CORE_BENEFITS.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f4d23c]" />
                {b}
              </li>
            ))}
          </ul>
          <HyroxPrimaryButton className="mt-8 w-full">Start Monthly Plan</HyroxPrimaryButton>
        </HyroxCard>

        <HyroxCard highlight className="relative flex flex-col">
          <span className="absolute right-5 top-5 rounded-full border border-[#f4d23c]/40 bg-[#f4d23c]/15 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#f4d23c]">
            Best value · Save £51
          </span>
          <p className="m-0 text-xs font-black uppercase tracking-[0.14em] text-[#f4d23c]">Pay upfront</p>
          <p className="mt-4 text-4xl font-black tracking-tight text-white">£399</p>
          <p className="m-0 mt-1 text-sm text-emerald-400/90">One payment · full 12-week block</p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {CORE_BENEFITS.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f4d23c]" />
                {b}
              </li>
            ))}
          </ul>
          <HyroxPrimaryButton className="mt-8 w-full">Pay Upfront & Secure Place</HyroxPrimaryButton>
        </HyroxCard>
      </div>

      <HyroxSection clean className="!my-5">
        <p className="m-0 max-w-3xl text-sm leading-relaxed text-[#a9a9a9]">
          <span className="font-semibold text-zinc-300">Note:</span> This is a 12-week coaching block. Monthly payments
          are spread across the block rather than a casual month-to-month plan.
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
        <div className="mt-8">
          <TimelineSteps
            steps={AFTER_PAYMENT.map((s) => ({
              ...s,
              status: s.n === 1 ? ("current" as const) : ("upcoming" as const),
            }))}
          />
        </div>
      </HyroxSection>
    </HyroxPageShell>
  );
}
