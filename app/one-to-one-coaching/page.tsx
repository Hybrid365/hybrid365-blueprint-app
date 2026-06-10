import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { HeroVisualCollage } from "@/components/one-to-one-coaching/HeroVisualCollage";
import { HybridCoachingJoinTeam } from "@/components/one-to-one-coaching/HybridCoachingJoinTeam";
import { HybridCoachingJourney } from "@/components/one-to-one-coaching/HybridCoachingJourney";
import { HybridCoachingPhoneGallery } from "@/components/one-to-one-coaching/HybridCoachingPhoneMockups";
import { HybridCoachingProofSection } from "@/components/one-to-one-coaching/HybridCoachingProofSection";
import { WhatsIncludedTickList } from "@/components/one-to-one-coaching/WhatsIncludedTickList";
import {
  APPLY_URL,
  Eyebrow,
  INSTAGRAM_URL,
  ListCard,
  PrimaryButton,
  SecondaryButton,
  Section,
  SectionHeader,
} from "@/components/one-to-one-coaching/landingUi";

export const metadata: Metadata = {
  title: "Hybrid365 1-1 Coaching | Stronger Faster Fitter",
  description:
    "Personalised 1-1 hybrid coaching to build lean muscle, improve strength, run faster and become a stronger, fitter, more athletic version of yourself.",
};

export default function OneToOneCoachingPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1320px]">
        {/* 1. Hero */}
        <Section className="grid min-h-0 items-center gap-10 lg:min-h-[680px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-[34px]">
          <div>
            <Eyebrow>Stronger. Faster. Fitter.</Eyebrow>
            <h1 className="my-6 text-[clamp(44px,8vw,96px)] font-black uppercase leading-[0.88] tracking-[-0.085em]">
              Build a body
              <br />
              <span className="text-[#f4d23c]">that performs.</span>
            </h1>
            <p className="m-0 max-w-[680px] text-[clamp(17px,2vw,22px)] leading-[1.42] text-[#dddddd]">
              1-1 coaching for people who want to build lean muscle, lift heavy, run fast and become
              the type of athlete who looks good because they can actually perform.
            </p>
            <p className="mt-4 max-w-[620px] text-sm leading-relaxed text-[#a9a9a9] md:text-base">
              Built from the same system I used to run a 16:00 5K, build lean muscle, lift heavy and
              develop hybrid performance.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["16:00 5K", "Lean muscle", "Heavy lifting", "Hybrid performance"].map((chip) => (
                <span
                  key={chip}
                  className="inline-flex min-h-[34px] items-center rounded-full border border-[#f4d23c]/30 bg-[#f4d23c]/10 px-3 text-[13px] font-extrabold text-[#f4d23c]"
                >
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-[30px] flex flex-wrap gap-3.5">
              <PrimaryButton href={APPLY_URL} className="w-full sm:w-auto">
                Apply for 1-1 coaching
              </PrimaryButton>
              <SecondaryButton href="#athlete-app" className="w-full sm:w-auto">
                See the athlete app
              </SecondaryButton>
            </div>
          </div>

          <HeroVisualCollage />
        </Section>

        {/* 2. Personal proof */}
        <Section clean id="proof">
          <HybridCoachingProofSection />
        </Section>

        {/* 3. Athlete app / iPhone previews */}
        <Section id="athlete-app">
          <SectionHeader
            title="Your coaching, inside the"
            highlight="Hybrid365 athlete app."
            description="This isn't a PDF plan. Your sessions, check-ins, targets, progress and resources live inside your athlete dashboard."
          />
          <HybridCoachingPhoneGallery />
        </Section>

        {/* 4. Who it's for */}
        <Section clean>
          <SectionHeader
            title="Is this"
            highlight="for you?"
            description="Selective coaching for hybrid athletes who want structure, standards and a body that performs."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <ListCard
              title="This is for you if…"
              items={[
                "You want to build lean muscle without losing fitness",
                "You want to run faster without becoming weak",
                "You want to lift heavy without feeling slow or unfit",
                "You want structure instead of random sessions",
                "You want to look athletic and actually be athletic",
                "You want a coach-led system balancing strength, running, conditioning and recovery",
                "You are willing to train hard and follow a process",
              ]}
            />
            <ListCard
              title="This is not for everyone."
              items={[
                "Not for people looking for a generic PDF plan",
                "Not for people who only want quick fat loss hacks",
                "Not for people who want random workouts",
                "Not for people who cannot follow check-ins or give feedback",
                "Not for people who want maximum bodybuilding with no performance work",
                "Not for people who want running only",
              ]}
            />
          </div>
        </Section>

        {/* 5. Coaching journey */}
        <Section id="journey">
          <SectionHeader
            title="Your Hybrid365"
            highlight="coaching journey"
            description="Application-based coaching with assessment, benchmarks, programming, app access, check-ins and ongoing adjustments."
          />
          <HybridCoachingJourney />
        </Section>

        {/* 6. Join the team */}
        <Section clean id="team">
          <HybridCoachingJoinTeam />
        </Section>

        {/* 7. What's included */}
        <Section id="included">
          <SectionHeader title="What's" highlight="included" />
          <WhatsIncludedTickList />
        </Section>

        {/* 8. Nutrition */}
        <Section clean id="nutrition">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionHeader
                title="Nutrition built for"
                highlight="performance & physique."
              />
              <p className="max-w-xl text-base leading-relaxed text-[#a9a9a9]">
                Your training only works if your nutrition supports it. You&apos;ll get access to the
                Hybrid365 nutrition library with 30+ recipes, cookbooks and practical guidance to
                support lean muscle, recovery and performance.
              </p>
              <ul className="mt-6 grid gap-2 text-sm text-zinc-300">
                {[
                  "Full nutrition library access",
                  "30+ recipes and cookbooks",
                  "High-protein meals",
                  "Meal prep options",
                  "Simple performance nutrition guidance",
                  "Support for leaning down, maintaining or adding muscle",
                  "Practical options for busy athletes",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[#f4d23c]">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative min-h-[320px] overflow-hidden rounded-[28px] border border-white/10">
              <Image
                src="/images/community/lean muscle phisique photo.jpg"
                alt="Performance nutrition and physique"
                fill
                className="object-cover brightness-[0.8]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#f4d23c]">
                  Nutrition library
                </p>
                <p className="mt-1 text-lg font-bold text-white">30+ recipes · cookbooks · meal prep</p>
              </div>
            </div>
          </div>
        </Section>

        {/* 9. Outcomes */}
        <Section clean>
          <SectionHeader title="What we're" highlight="working toward" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Build lean muscle",
              "Get stronger in the gym",
              "Run faster",
              "Improve conditioning",
              "Drop body fat without losing performance",
              "Build a more athletic physique",
              "Improve weekly consistency",
              "Understand your training targets",
              "Feel fitter across life and sport",
            ].map((outcome) => (
              <div
                key={outcome}
                className="rounded-2xl border border-[#f4d23c]/20 bg-[#f4d23c]/5 px-4 py-4 text-sm font-semibold text-white"
              >
                {outcome}
              </div>
            ))}
          </div>
        </Section>

        {/* 10. Pricing */}
        <Section id="pricing">
          <SectionHeader
            title="Coaching"
            highlight="investment"
            description="Application-based. Apply first — no payment on this page."
            centered
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/40 p-6">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Monthly</p>
              <p className="mt-3 text-4xl font-black text-white">
                £150<span className="text-lg font-bold text-zinc-500">/month</span>
              </p>
              <p className="mt-3 text-sm text-zinc-400">Ongoing coaching month to month.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/40 p-6">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">3 months</p>
              <p className="mt-3 text-4xl font-black text-white">£399</p>
              <p className="mt-1 text-sm font-semibold text-zinc-400">upfront</p>
              <p className="mt-3 text-sm text-zinc-400">12-week focused block.</p>
            </div>
            <div className="rounded-[24px] border border-[#f4d23c]/35 bg-[#f4d23c]/10 p-6">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#f4d23c]">
                Best value · 4 months
              </p>
              <p className="mt-3 text-4xl font-black text-white">£499</p>
              <p className="mt-1 text-sm font-semibold text-zinc-400">upfront</p>
              <p className="mt-3 text-sm text-zinc-300">Full 16-week transformation block.</p>
            </div>
          </div>
        </Section>

        {/* 11. Apply CTA */}
        <Section clean id="apply">
          <div className="text-center">
            <SectionHeader
              title="Apply for"
              highlight="1-1 coaching"
              description="Application-based so I can make sure the system is right for your goals, training history and standards."
              centered
            />
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <PrimaryButton href={APPLY_URL}>Apply for 1-1 coaching</PrimaryButton>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/15 px-6 text-sm font-bold text-white hover:border-white/30"
              >
                DM &quot;HYBRID&quot; on Instagram
              </a>
            </div>
            <p className="mx-auto mt-6 max-w-lg text-sm text-zinc-500">
              HYROX-specific 1-1 coaching?{" "}
              <Link href="/hyrox-team" className="text-[#f4d23c] hover:underline">
                See Hybrid365 Hyrox Team
              </Link>
            </p>
          </div>
        </Section>

        <footer className="py-10 text-center text-xs text-zinc-600">
          Hybrid365 · Refuse Average ·{" "}
          <Link href="/" className="hover:text-zinc-400">
            hybrid-365.com
          </Link>
        </footer>
      </div>
    </main>
  );
}
