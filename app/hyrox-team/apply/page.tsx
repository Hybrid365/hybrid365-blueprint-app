import type { Metadata } from "next";
import HyroxTeamApplyFormSection from "./HyroxTeamApplyFormSection";

export const metadata: Metadata = {
  title: "Apply | Hybrid365 Hyrox Team",
  description:
    "Apply for the first Hybrid365 Hyrox Team. A small, selective athlete project built around 1-1 Hyrox coaching, team accountability, documented progress and race-day performance.",
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white/80">
      {children}
    </span>
  );
}

function ExpectationCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-3 text-xs font-medium uppercase tracking-wider text-[#F4D23C]">
        {number} / {title}
      </div>
      <p className="text-sm leading-relaxed text-white/70">{description}</p>
    </div>
  );
}

export default function HyroxTeamApplyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="px-5 pb-16 pt-20 md:px-8 md:pb-24 md:pt-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-[#F4D23C]">
            Team 001 / Application
          </div>

          <h1 className="mb-6 text-4xl font-bold uppercase leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
            Apply for the
            <br />
            Hybrid365 Hyrox Team.
          </h1>

          <p className="mb-10 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
            A small, selective athlete project built around 1-1 Hyrox coaching, team accountability, documented progress
            and race-day performance.
          </p>

          <div className="flex flex-wrap gap-3">
            <Pill>5–6 athletes max</Pill>
            <Pill>Applications reviewed manually</Pill>
            <Pill>1-1 coaching inside a team</Pill>
            <Pill>Documented race build</Pill>
            <Pill>Refuse Average</Pill>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-2xl font-bold uppercase tracking-tight md:text-3xl">What We&apos;re Looking For.</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <ExpectationCard
              number="01"
              title="Intent"
              description="Serious about Hyrox. You're not here to dabble — you want to race, improve, and commit to the process."
            />
            <ExpectationCard
              number="02"
              title="Standards"
              description="Ready to be coached. You're open to feedback, willing to follow structure, and hold yourself accountable."
            />
            <ExpectationCard
              number="03"
              title="Story"
              description="Open to the journey. You're comfortable with your progress being documented and shared."
            />
          </div>
        </div>
      </section>

      <HyroxTeamApplyFormSection />
    </main>
  );
}
