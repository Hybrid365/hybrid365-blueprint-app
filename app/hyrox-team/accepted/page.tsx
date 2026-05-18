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
  ClipboardList,
  Flag,
  LayoutDashboard,
  MessageSquare,
  Target,
  Users,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Accepted | Hybrid365 Hyrox Team",
  description: "You have been accepted into the Hybrid365 Hyrox Team — secure your place and begin onboarding.",
};

const NEXT_STEPS = [
  { n: 1, title: "Secure your place", description: "Choose monthly or upfront payment to confirm your spot." },
  { n: 2, title: "Complete athlete assessment", description: "Deep-dive profile so programming matches your goal and schedule." },
  { n: 3, title: "Complete baseline testing", description: "Run, erg and station markers for accurate progress tracking." },
  { n: 4, title: "Coach review", description: "Your data is reviewed before anything is built." },
  { n: 5, title: "Dashboard unlock", description: "Programme, benchmarks and check-ins go live in your athlete hub." },
  { n: 6, title: "Start training", description: "Execute Week 1 with structure, accountability and coach support." },
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
  return (
    <HyroxPageShell>
      <HyroxSection>
        <HyroxEyebrow>Team 001 / Accepted</HyroxEyebrow>
        <HyroxH1 accent="Hyrox Team">
          You&apos;ve been accepted into the Hybrid365
        </HyroxH1>
        <HyroxLead>
          This is a selective 12-week Hyrox athlete project — not a generic template. A small group, high standards,
          personalised programming and full accountability from assessment through race day.
        </HyroxLead>
        <div className="mt-8">
          <HyroxPrimaryButton href="/hyrox-team/payment">Secure your place</HyroxPrimaryButton>
        </div>
      </HyroxSection>

      <HyroxSection clean>
        <h2 className="m-0 text-2xl font-black uppercase tracking-[-0.04em] text-white">Your next steps</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#a9a9a9]">
          Follow the path below. Each step unlocks the next — your programme is built manually after assessment and
          testing.
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
            This is not a generic Hyrox plan pulled off a shelf. Your programme is manually built after your athlete
            assessment and baseline testing are complete and reviewed. That process takes time — and it&apos;s what makes
            the coaching worth it.
          </p>
        </HyroxCard>
        <div className="mt-8">
          <HyroxPrimaryButton href="/hyrox-team/payment">Continue to payment</HyroxPrimaryButton>
        </div>
      </HyroxSection>
    </HyroxPageShell>
  );
}
