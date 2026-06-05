import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getWhopJoinUrl } from "@/app/lib/hybrid365PublicLinks";

export const metadata: Metadata = {
  title: "Hybrid365 HYROX Track | HYROX Training Programme & Community",
  description:
    "Join the Hybrid365 HYROX Track for structured HYROX programming, dashboard access, check-ins, benchmarks and community accountability.",
};

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-[#F4D23C]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#F4D23C] text-sm font-semibold uppercase tracking-widest mb-4">
      {children}
    </p>
  );
}

function PrimaryCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center px-8 py-4 text-base font-bold uppercase tracking-wide bg-[#F4D23C] text-black rounded-full hover:bg-[#e5c535] transition-colors ${className}`}
    >
      {children}
    </a>
  );
}

function SecondaryCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center px-8 py-4 text-base font-bold uppercase tracking-wide border-2 border-white/20 text-white rounded-full hover:border-white/40 transition-colors ${className}`}
    >
      {children}
    </a>
  );
}

export default function HyroxCommunityPage() {
  const whopJoinUrl = getWhopJoinUrl();

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hyrox%201-RrQHeIBGbPULQkn43iJkPCK9mMN5SY.jpg"
            alt="HYROX athlete training"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        </div>

        <div className="relative z-10 px-5 md:px-8 py-20 md:py-28 w-full">
          <div className="max-w-4xl mx-auto">
            <SectionEyebrow>Hybrid365 HYROX Track</SectionEyebrow>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight leading-[1.05] text-balance">
              Train for HYROX with a programme{" "}
              <span className="text-[#F4D23C]">built around you.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl">
              Join the Hybrid365 HYROX Track and follow a progressive HYROX-specific programme
              built from your assessment, race goals, current fitness, equipment access and station
              weaknesses.
            </p>
            <p className="mt-4 inline-flex items-center rounded-full border border-[#F4D23C]/40 bg-[#F4D23C]/10 px-4 py-2 text-sm font-bold text-[#F4D23C]">
              £39.99/month
            </p>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/70">
              {[
                "HYROX-specific programme",
                "Assessment-based track",
                "Dashboard access",
                "Weekly check-ins",
                "Community accountability",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckIcon />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <PrimaryCta href={whopJoinUrl}>Join the HYROX Track</PrimaryCta>
              <SecondaryCta href="#whats-included">See what&apos;s included</SecondaryCta>
            </div>
          </div>
        </div>
      </section>

      {/* Credibility — real HYROX progression */}
      <section className="px-5 md:px-8 py-16 md:py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 overflow-hidden">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-0">
              <div className="p-6 md:p-10 lg:p-12">
                <SectionEyebrow>Built from real HYROX progression</SectionEyebrow>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-white leading-tight">
                  The system behind{" "}
                  <span className="text-[#F4D23C]">my HYROX progression.</span>
                </h2>
                <p className="mt-5 text-base md:text-lg text-white/75 leading-relaxed">
                  After starting with a{" "}
                  <span className="text-white font-semibold">1:08 Pro Solo</span>, I worked my way
                  down to{" "}
                  <span className="text-[#F4D23C] font-semibold">59:14</span> across{" "}
                  <span className="text-white font-semibold">7 HYROX races</span> by building the
                  engine first, improving threshold running, developing strength endurance and
                  learning how to run again under station fatigue.
                </p>
                <p className="mt-4 text-sm md:text-base text-white/55 leading-relaxed">
                  That same training philosophy now sits behind the Hybrid365 HYROX Track —
                  structured, progressive programming built around your assessment, race goals,
                  current ability, equipment and station weaknesses.
                </p>

                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: "1:08", label: "Pro Solo" },
                    { value: "7", label: "HYROX races" },
                    { value: "59:14", label: "Pro Solo" },
                    { value: "Sub-60", label: "Achieved" },
                  ].map((stat) => (
                    <div
                      key={stat.label + stat.value}
                      className="rounded-xl border border-[#F4D23C]/20 bg-[#F4D23C]/5 px-3 py-4 text-center"
                    >
                      <p className="text-xl md:text-2xl font-bold text-[#F4D23C]">{stat.value}</p>
                      <p className="mt-1 text-[10px] md:text-xs uppercase tracking-wide text-white/50 font-semibold">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 md:px-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 font-semibold mb-2">
                    From first Pro Solo to sub-60
                  </p>
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="text-lg md:text-2xl font-bold text-white/70 tabular-nums">1:08</span>
                    <div className="flex-1 relative h-px bg-white/15">
                      <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-white/20 via-[#F4D23C] to-[#F4D23C]" />
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#F4D23C] shadow-[0_0_12px_rgba(244,210,60,0.8)]" />
                    </div>
                    <span className="text-lg md:text-2xl font-bold text-[#F4D23C] tabular-nums">59:14</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <PrimaryCta href={whopJoinUrl} className="px-6 py-3 text-sm">
                    Join the HYROX Track
                  </PrimaryCta>
                  <a
                    href="#whats-included"
                    className="text-sm font-semibold text-white/60 hover:text-[#F4D23C] transition-colors underline-offset-4 hover:underline text-center sm:text-left"
                  >
                    See what&apos;s included
                  </a>
                </div>
              </div>

              <div className="relative min-h-[280px] lg:min-h-full border-t lg:border-t-0 lg:border-l border-white/10">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-white/10">
                  <div className="relative col-span-2 row-span-1 min-h-[160px]">
                    <Image
                      src="/images/hyrox-team/Hyrox-Result.jpg"
                      alt="HYROX race finish"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                  <div className="relative min-h-[140px]">
                    <Image
                      src="/images/hyrox-team/Sequence 01.00_45_14_14.Still017.jpg"
                      alt="HYROX training session"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/25" />
                  </div>
                  <div className="relative min-h-[140px]">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/running-kQauOENBwXFjdmCg7gGc5c577MJgeQ.jpg"
                      alt="Threshold running training"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 lg:bottom-6 lg:left-6 lg:right-6 pointer-events-none">
                  <span className="inline-flex items-center rounded-full border border-[#F4D23C]/30 bg-black/60 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#F4D23C]">
                    Same principles · Your assessment · Your race
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1 — Built for HYROX performance */}
      <section className="px-5 md:px-8 py-20 md:py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <SectionEyebrow>Built for HYROX performance</SectionEyebrow>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white">
                Not random workouts.
                <br />
                <span className="text-[#F4D23C]">A structured HYROX system.</span>
              </h2>
              <p className="mt-6 text-lg text-white/60 leading-relaxed">
                Not random workouts. Not generic conditioning. A structured HYROX training system
                built to develop the engine, stations and race-day durability you need.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Build the engine first",
                  "Controlled threshold running",
                  "Aerobic base through run, Ski, Row and Bike",
                  "Strength endurance for sleds, lunges and wall balls",
                  "Upper body and grip durability",
                  "Compromised running",
                  "Station weakness focus",
                  "4-week block progression",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckIcon />
                    <span className="text-white/75">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative aspect-[4/5] max-w-md mx-auto lg:max-w-none rounded-2xl overflow-hidden border border-white/10">
              <Image
                src="/images/hyrox-team/Hyrox-Result.jpg"
                alt="HYROX race performance"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-sm font-bold uppercase tracking-wide text-[#F4D23C]">
                  Race-day ready structure
                </p>
                <p className="mt-1 text-sm text-white/70">
                  Threshold, aerobic base, stations and compromised work — progressive blocks that
                  build toward your target.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 — Built from your assessment */}
      <section className="px-5 md:px-8 py-20 md:py-28 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <SectionEyebrow>Built from your assessment</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white text-balance">
              Your programme reflects{" "}
              <span className="text-[#F4D23C]">your HYROX needs.</span>
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-3xl mx-auto">
              When members join, they complete an assessment and choose{" "}
              <span className="text-white font-semibold">HYROX Specific</span>. Your programme is
              shaped around the information you give us, so the track you follow reflects your
              current level, goals and HYROX needs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Race date and target",
              "HYROX category",
              "5K / 10K running level",
              "Ski / Row benchmarks",
              "Station weaknesses",
              "Equipment access",
              "Training days and weekly availability",
              "Double-session availability",
              "Injury considerations",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]"
              >
                <CheckIcon />
                <span className="text-sm text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — What's included */}
      <section id="whats-included" className="px-5 md:px-8 py-20 md:py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <SectionEyebrow>What&apos;s included</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white">
              Everything in the{" "}
              <span className="text-[#F4D23C]">HYROX Track.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "HYROX-specific training track",
                desc: "Progressive programming built for HYROX — not a generic hybrid plan with HYROX sprinkled in.",
              },
              {
                title: "Assessment-based programme",
                desc: "Your plan is generated from your race goals, benchmarks, weaknesses and training setup.",
              },
              {
                title: "Progressive training blocks",
                desc: "Base, build, race prep and test phases across structured 4-week blocks.",
              },
              {
                title: "HYROX dashboard mode",
                desc: "Race countdown, track badge, station focus and HYROX-specific programme context.",
              },
              {
                title: "Race target & station tracking",
                desc: "Keep your race target and station weaknesses visible as you progress.",
              },
              {
                title: "Weekly check-ins",
                desc: "HYROX-specific check-in prompts to stay accountable week to week.",
              },
              {
                title: "HYROX benchmark guidance",
                desc: "Running and erg benchmarks to guide pacing and progression.",
              },
              {
                title: "Habit & progress tracking",
                desc: "Track adherence, habits and performance trends inside your dashboard.",
              },
              {
                title: "Community accountability",
                desc: "Train alongside Hybrid365 members with challenges and team accountability.",
              },
              {
                title: "Hybrid challenges",
                desc: "Monthly community challenges and leaderboards to keep momentum high.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 md:p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-[#F4D23C]/10 flex items-center justify-center">
                    <CheckIcon />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-white/50">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — How it works */}
      <section className="px-5 md:px-8 py-20 md:py-28 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <SectionEyebrow>How it works</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-white">
              From join to{" "}
              <span className="text-[#F4D23C]">race-day ready.</span>
            </h2>
          </div>

          <ol className="space-y-4">
            {[
              "Join Hybrid365 through Whop",
              "Log in to your dashboard",
              "Choose HYROX Specific in your assessment",
              "Add your race, benchmarks, weaknesses and equipment",
              "Your programme is built and unlocks within 12 hours",
              "Follow your weekly sessions, check in and stay accountable",
            ].map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-4 p-5 rounded-2xl border border-white/10 bg-white/[0.02]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4D23C] text-black font-bold text-sm">
                  {index + 1}
                </span>
                <p className="pt-2 text-white/80">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Section 5 — Dashboard preview */}
      <section className="px-5 md:px-8 py-20 md:py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <SectionEyebrow>Your HYROX dashboard</SectionEyebrow>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white">
                Built for{" "}
                <span className="text-[#F4D23C]">HYROX performance.</span>
              </h2>
              <p className="mt-6 text-lg text-white/60 leading-relaxed">
                Once you&apos;re in, your dashboard switches to HYROX mode — race context, station
                focus, programme sessions and check-ins all in one place.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Race countdown",
                  "HYROX track badge",
                  "Station focus chips",
                  "Threshold and aerobic volume",
                  "HYROX-specific programme sessions",
                  "Weekly check-in prompts",
                  "Testing benchmarks",
                  "Progress tracking",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckIcon />
                    <span className="text-white/75">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/90 overflow-hidden shadow-2xl">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white text-sm">HYROX Track</p>
                  <p className="text-xs text-white/50">Hybrid365 Dashboard</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold uppercase bg-[#F4D23C] text-black rounded-full">
                  HYROX Specific
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div className="rounded-xl border border-[#F4D23C]/25 bg-[#F4D23C]/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-[#F4D23C] font-semibold">
                    Race countdown
                  </p>
                  <p className="mt-1 text-2xl font-bold text-white">47 days</p>
                  <p className="text-xs text-white/50 mt-1">Target: 1:28:00 · Open</p>
                </div>

                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wide mb-2">
                    Station focus
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Wall balls", "Running between stations", "Sled push"].map((chip) => (
                      <span
                        key={chip}
                        className="px-2.5 py-1 text-xs rounded-full border border-[#F4D23C]/30 bg-[#F4D23C]/10 text-[#F4D23C]"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-xs text-white/50">Threshold volume</p>
                    <p className="text-lg font-bold text-[#F4D23C]">Moderate</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-xs text-white/50">Aerobic base</p>
                    <p className="text-lg font-bold text-white">High</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-white/50 uppercase tracking-wide">This week</p>
                  {[
                    "Threshold Run — 40 min",
                    "HYROX Legs + Grip",
                    "Compromised HYROX Session",
                  ].map((session) => (
                    <div
                      key={session}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5"
                    >
                      <span className="text-xs text-white/80">{session}</span>
                      <span className="text-[10px] uppercase font-semibold text-[#F4D23C]">Key</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                  <p className="text-xs text-amber-200/90">
                    Weekly check-in due — log training, benchmarks and how the week felt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 — Programme pillars */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/running-kQauOENBwXFjdmCg7gGc5c577MJgeQ.jpg"
            alt="HYROX running training"
            fill
            className="object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black" />
        </div>

        <div className="relative z-10 px-5 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <SectionEyebrow>What the programme is built around</SectionEyebrow>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white">
                HYROX training{" "}
                <span className="text-[#F4D23C]">pillars.</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Threshold run development", desc: "Controlled tempo and race-pace work" },
                { title: "Aerobic base & Z2 add-ons", desc: "Easy volume that builds the engine" },
                { title: "Ski / Row / Bike fitness", desc: "Erg work that transfers to stations" },
                { title: "Lower strength endurance", desc: "Sleds, lunges and HYROX leg durability" },
                { title: "Upper body & grip", desc: "Pull, carry and station resilience" },
                { title: "Compromised HYROX sessions", desc: "Race-specific fatigue and pacing" },
                { title: "Station weakness focus", desc: "Targeted work on your limiters" },
                { title: "Testing & progression", desc: "Benchmarks and block-to-block progress" },
              ].map((pillar) => (
                <div
                  key={pillar.title}
                  className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm"
                >
                  <h3 className="font-bold text-white text-sm uppercase tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/50">{pillar.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 7 — HYROX Track vs HYROX Team (subtle) */}
      <section className="px-5 md:px-8 py-20 md:py-28 bg-zinc-950 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <SectionEyebrow>Two paths</SectionEyebrow>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-white">
              HYROX Track vs HYROX Team
            </h2>
            <p className="mt-4 text-base text-white/60 max-w-2xl mx-auto">
              The HYROX Track gives you structured HYROX-specific programming inside the Hybrid365
              membership. If you later want higher-touch support, manual programme review and deeper
              individual coaching, the HYROX Team is the next step.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 md:p-8 rounded-2xl border-2 border-[#F4D23C]/40 bg-[#F4D23C]/5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#F4D23C] mb-2">
                HYROX Track
              </p>
              <p className="text-2xl font-bold text-white mb-4">£39.99/month</p>
              <ul className="space-y-2.5">
                {[
                  "Assessment-based HYROX programme",
                  "Dashboard and check-ins",
                  "Community accountability",
                  "Scalable structured programming",
                  "Great for athletes wanting specific HYROX structure",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-white/75">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
              <PrimaryCta href={whopJoinUrl} className="mt-8 w-full">
                Join the HYROX Track
              </PrimaryCta>
            </div>

            <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">
                HYROX Team
              </p>
              <p className="text-2xl font-bold text-white mb-4">Higher-ticket coaching</p>
              <ul className="space-y-2.5">
                {[
                  "More individual support",
                  "Manual review / deeper personalisation",
                  "Higher-touch coaching",
                  "Best for athletes wanting more direct coaching support",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-white/60">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/hyrox-team"
                className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 text-sm font-bold uppercase tracking-wide border border-white/20 text-white rounded-full hover:border-white/40 transition-colors"
              >
                Explore HYROX Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8 — Who this is for */}
      <section className="px-5 md:px-8 py-20 md:py-28 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <SectionEyebrow>Who this is for</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-white">
              Built for athletes who want{" "}
              <span className="text-[#F4D23C]">serious HYROX structure.</span>
            </h2>
          </div>

          <ul className="grid sm:grid-cols-2 gap-3">
            {[
              "Want to prepare for HYROX properly",
              "Want a programme specific to their race goals and ability",
              "Need structure — not random conditioning",
              "Want to improve running and stations",
              "Want accountability inside a community",
              "Want a serious programme in a community environment",
              "Want to become fitter, faster and stronger for race day",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]"
              >
                <CheckIcon />
                <span className="text-sm text-white/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Section 9 — Pricing / final CTA */}
      <section id="pricing" className="px-5 md:px-8 py-20 md:py-28 bg-zinc-950">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-[#F4D23C]/20 bg-gradient-to-b from-[#F4D23C]/5 to-transparent p-8 md:p-12 text-center">
            <SectionEyebrow>Join the Hybrid365 HYROX Track</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-white">
              Get access to Hybrid365.
              <br />
              <span className="text-[#F4D23C]">Choose HYROX Specific.</span>
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-xl mx-auto">
              Get access to the full Hybrid365 membership and choose HYROX Specific inside your
              assessment.
            </p>

            <div className="mt-8 flex items-baseline justify-center gap-2">
              <span className="text-5xl md:text-6xl font-bold text-white">£39.99</span>
              <span className="text-xl text-white/50">/month</span>
            </div>
            <p className="mt-2 text-sm text-white/40">Billed monthly. Cancel anytime.</p>

            <PrimaryCta href={whopJoinUrl} className="mt-10 px-12 py-5 text-lg">
              Join the HYROX Track
            </PrimaryCta>

            <p className="mt-8 text-sm text-white/40">
              Want higher-touch coaching later?{" "}
              <Link href="/hyrox-team" className="text-[#F4D23C]/80 hover:text-[#F4D23C] underline">
                The HYROX Team is the next step.
              </Link>
            </p>
          </div>
        </div>
      </section>

      <footer className="px-5 md:px-8 py-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Hybrid365. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm">
            <Link href="/community" className="text-white/40 hover:text-white/70 transition-colors">
              Full membership
            </Link>
            <Link href="/hyrox-team" className="text-white/40 hover:text-white/70 transition-colors">
              HYROX Team
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
