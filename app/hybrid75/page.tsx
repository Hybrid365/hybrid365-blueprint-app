import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Droplets,
  Dumbbell,
  ExternalLink,
  Flame,
  Lock,
  MessageCircle,
  Target,
  Trophy,
  Users,
  UtensilsCrossed,
  Wind,
  Zap,
} from "lucide-react";
import Hybrid75DashboardPreview from "@/components/hybrid75/Hybrid75DashboardPreview";
import { Hybrid75HeroVsl } from "@/components/hybrid75/Hybrid75HeroVsl";
import {
  FREE_WEEK_TELEGRAM_URL,
  HYBRID75_TELEGRAM_GROUP_LABEL,
} from "@/app/lib/freeWeekChallengeMode";
import { COMMUNITY_UPGRADE_URL } from "@/app/lib/freePlanDashboard";

export const metadata: Metadata = {
  title: "Hybrid 75 Summer Challenge | Hybrid365",
  description:
    "Join the free Hybrid365 Hybrid 75 Summer Challenge. Generate your personalised challenge week, complete weekly Hybrid Hard workouts, compete on the leaderboard and upgrade to the full 16-week programme.",
};

const CHALLENGE_START_URL = "/free-week?challenge=hybrid75";

const RULES = [
  { icon: Activity, text: "Run 3x per week" },
  { icon: Dumbbell, text: "Lift 3x per week" },
  { icon: Zap, text: "Complete the weekly Hybrid Hard Challenge" },
  { icon: Wind, text: "Mobility 1–2x per week" },
  { icon: Droplets, text: "Hydrate 3–4L daily" },
  { icon: UtensilsCrossed, text: "Eat clean" },
  { icon: CheckCircle2, text: "Log it and prove it" },
] as const;

const FLOW_STEPS = [
  {
    step: "01",
    title: "Join the free Telegram group",
    body: "Get challenge updates, weekly workouts, leaderboard info and accountability from day one.",
  },
  {
    step: "02",
    title: "Get your first personalised week for free",
    body: "Built around Hybrid 75 rules: 3 runs, 3 lifts, mobility and the weekly challenge — matched to your schedule.",
  },
  {
    step: "03",
    title: "Follow your Hybrid365 dashboard",
    body: "See your next session, weekly structure, challenge targets and exactly what to complete each day.",
  },
  {
    step: "04",
    title: "Complete the weekly Hybrid Hard Challenge",
    body: "Test yourself every weekend. Post proof, submit your score and climb the leaderboard.",
  },
  {
    step: "05",
    title: "Want the full structure? Unlock the full 16-week personalised programme",
    body: "Follow the complete Hybrid365 system with progression, tracking and community support — become the fittest, fastest and strongest you've ever been.",
  },
] as const;

const INCLUDED = [
  "Personalised free challenge week",
  "Hybrid365 dashboard access",
  "Challenge target tracking",
  "Weekly Hybrid Hard Challenge slot",
  "Telegram accountability group",
  "Leaderboard + prize opportunities",
] as const;

const COMMUNITY_BULLETS = [
  { icon: MessageCircle, text: "Free Telegram accountability group" },
  { icon: CheckCircle2, text: "Post proof of your sessions" },
  { icon: Flame, text: "Push each other through the summer" },
  { icon: Users, text: "Train alongside like-minded athletes" },
] as const;

const LEADERBOARD_POINTS = [
  "Earn consistency points for completed sessions with proof",
  "Earn challenge points for completing the weekly Hybrid Hard workout",
  "Timed workouts may include bonus points for top performers",
  "Prizes available throughout the challenge",
] as const;

const DEFAULT_WEEK = [
  "Mon · Upper Strength A",
  "Tue · Quality Run",
  "Wed · Upper Strength B",
  "Thu · Hybrid Leg Endurance",
  "Fri · Easy Run + Mobility",
  "Sat · Hybrid Hard Challenge",
  "Sun · Easy Long Run",
] as const;

const PROOF_STATS = [
  { accent: "16:30", rest: "5K" },
  { accent: "Sub-60", rest: "HYROX Pro Solo" },
  { accent: "Still lifting heavy", rest: "" },
  { accent: "Built lean muscle", rest: "" },
] as const;

function PrimaryCta({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={CHALLENGE_START_URL}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4D23C] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-black transition hover:opacity-90 sm:px-8 sm:text-base ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function TelegramCta({ className = "" }: { className?: string }) {
  return (
    <a
      href={FREE_WEEK_TELEGRAM_URL}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:border-[#F4D23C]/40 hover:bg-white/[0.08] sm:px-8 sm:text-base ${className}`}
    >
      {HYBRID75_TELEGRAM_GROUP_LABEL}
      <ExternalLink className="h-4 w-4 opacity-70" />
    </a>
  );
}

function UpgradeCta({ className = "" }: { className?: string }) {
  return (
    <a
      href={COMMUNITY_UPGRADE_URL}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4D23C] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-black transition hover:opacity-90 sm:px-8 sm:text-base ${className}`}
    >
      Unlock the Full 16-Week Programme
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

/** High-intent secondary CTA — visible near hero/VSL without overpowering the free week. */
function HeroFullProgrammeBanner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[#F4D23C]/30 bg-gradient-to-br from-zinc-950/95 via-zinc-900/70 to-black p-4 shadow-[0_0_32px_rgba(244,210,60,0.06)] sm:p-5 ${className}`}
    >
      <span className="inline-flex rounded-full border border-[#F4D23C]/35 bg-[#F4D23C]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F4D23C]">
        Best results
      </span>
      <h3 className="mt-3 text-base font-bold leading-snug text-white sm:text-lg">
        Want your full 16-week personalised programme?
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-white/65">
        Join the full Hybrid365 team for complete structure, coaching support, accountability and progression.
      </p>
      <a
        href={COMMUNITY_UPGRADE_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#F4D23C]/45 bg-[#F4D23C]/10 px-4 py-3 text-sm font-semibold text-[#F4D23C] transition hover:border-[#F4D23C]/65 hover:bg-[#F4D23C]/15 sm:w-auto"
      >
        Join the Full Hybrid365 Team
        <ExternalLink className="h-4 w-4 opacity-90" />
      </a>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#F4D23C]">{children}</p>
  );
}

function SectionHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl lg:text-4xl ${className}`}
    >
      {children}
    </h2>
  );
}

function CtaRow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${className}`}>
      <PrimaryCta>Generate My Free Challenge Week</PrimaryCta>
      <TelegramCta />
    </div>
  );
}

export default function Hybrid75LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(244,210,60,0.16),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(244,210,60,0.06),transparent_45%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-black" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-14">
            {/* Copy — first on mobile */}
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#F4D23C]/35 bg-[#F4D23C]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#F4D23C] sm:text-xs">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F4D23C]" />
                Free Summer Challenge
              </div>

              <h1 className="text-[2rem] font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
                Hybrid 75
                <br />
                <span className="text-[#F4D23C]">Summer Challenge</span>
              </h1>

              <p className="mt-4 text-base font-semibold leading-snug text-white/95 sm:text-lg lg:text-xl">
                Run 3x per week. Lift 3x per week. Complete the weekly Hybrid Hard Challenge. Track your progress.
                Compete on the leaderboard.
              </p>

              <p className="mt-3 text-sm leading-relaxed text-white/65 sm:text-base">
                Generate your free personalised challenge week, join the Telegram group, post proof, and start
                building momentum.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <PrimaryCta className="w-full sm:w-auto">Generate My Free Challenge Week</PrimaryCta>
                <TelegramCta className="w-full sm:w-auto" />
              </div>

              <p className="mt-5 text-xs leading-relaxed text-white/45 sm:text-sm">
                <span className="text-white/55">Built from a system used to run</span>{" "}
                <span className="font-semibold text-[#F4D23C]">16:30 5K</span>
                <span className="text-white/35"> · </span>
                <span className="font-semibold text-[#F4D23C]">Sub-60 HYROX Pro</span>
                <span className="text-white/35"> · </span>
                <span className="font-semibold text-white/80">Still lifting heavy</span>
              </p>

              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/45 sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#F4D23C]" />
                  Free personalised week
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#F4D23C]" />
                  Dashboard + leaderboard
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#F4D23C]" />
                  Telegram accountability
                </span>
              </div>
            </div>

            {/* VSL + full programme CTA — below copy on mobile, right column on desktop */}
            <div className="flex w-full flex-col gap-4">
              <Hybrid75HeroVsl className="w-full lg:max-w-none" />
              <HeroFullProgrammeBanner />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Founder proof ── */}
      <section className="border-t border-white/10 bg-zinc-950/90">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
            {/* Copy — first on mobile */}
            <div className="order-1 lg:order-1">
              <SectionLabel>Built from experience</SectionLabel>
              <SectionHeading>Built from the system I used to get fast, fit and strong</SectionHeading>
              <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
                Hybrid365 is built around the same principle:{" "}
                <span className="font-semibold text-white">build a body that performs.</span>
              </p>

              {/* Stats beside copy on desktop — hidden on mobile (shown under image) */}
              <div className="mt-6 hidden grid-cols-2 gap-3 lg:grid">
                {PROOF_STATS.map((item) => (
                  <div
                    key={item.accent}
                    className="rounded-xl border border-white/10 bg-black/50 px-4 py-3"
                  >
                    <p className="text-sm font-bold leading-snug">
                      <span className="text-[#F4D23C]">{item.accent}</span>
                      {item.rest ? <span className="text-white"> {item.rest}</span> : null}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Image + stats — second on mobile */}
            <div className="order-2 lg:order-2">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 p-3 sm:p-4">
                <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl bg-zinc-950 sm:max-w-none lg:max-h-[560px] lg:aspect-auto lg:h-[520px]">
                  <Image
                    src="/images/community/lean muscle phisique photo.jpg"
                    alt="Hybrid365 founder — lean muscle and hybrid training"
                    fill
                    className="object-contain object-center"
                    sizes="(max-width: 1024px) 100vw, 540px"
                    priority
                  />
                </div>
              </div>

              {/* Stats under image on mobile / tablet */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:hidden">
                {PROOF_STATS.map((item) => (
                  <div
                    key={item.accent}
                    className="rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 sm:px-4 sm:py-3"
                  >
                    <p className="text-xs font-bold leading-snug sm:text-sm">
                      <span className="text-[#F4D23C]">{item.accent}</span>
                      {item.rest ? <span className="text-white"> {item.rest}</span> : null}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Dashboard preview (phone mockup) ── */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-2xl text-center lg:max-w-3xl">
            <SectionLabel>Inside the app</SectionLabel>
            <SectionHeading>Your challenge starts inside the Hybrid365 dashboard</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-white/65 sm:text-base">
              Generate your free week and get instant access — next session, weekly schedule, challenge targets and
              your Hybrid Hard slot, all in one place.
            </p>
          </div>

          <div className="mt-10 lg:mt-14">
            <Hybrid75DashboardPreview />
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <PrimaryCta>Generate My Free Challenge Week</PrimaryCta>
            <p className="text-xs text-white/40">Takes ~2 minutes · no payment required</p>
          </div>
        </div>
      </section>

      {/* ── 4. Rules + what's included ── */}
      <section id="rules" className="scroll-mt-20 border-t border-white/10 bg-zinc-950/80">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionLabel>Non-negotiables</SectionLabel>
              <SectionHeading>The Hybrid 75 Rules</SectionHeading>
              <p className="mt-3 text-sm text-white/65 sm:text-base">
                Your free week is built to help you hit these — personalised to your schedule, level and equipment.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {RULES.map((rule) => (
                  <div
                    key={rule.text}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3"
                  >
                    <rule.icon className="h-4 w-4 shrink-0 text-[#F4D23C]" />
                    <p className="text-sm font-medium text-white/90">{rule.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>What&apos;s included</SectionLabel>
              <SectionHeading>Everything in your free challenge week</SectionHeading>
              <ul className="mt-6 space-y-3">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/80 sm:text-base">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F4D23C]" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F4D23C]">
                  Full availability example
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DEFAULT_WEEK.map((line) => (
                    <span
                      key={line}
                      className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] text-zinc-400"
                    >
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. What happens next ── */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <SectionLabel>Your path in</SectionLabel>
          <SectionHeading>What happens next?</SectionHeading>
          <p className="mt-3 max-w-xl text-sm text-white/60 sm:text-base">
            From joining the group to unlocking the full programme — here&apos;s exactly how the challenge works.
          </p>

          <div className="mt-8 space-y-3">
            {FLOW_STEPS.map((item) => (
              <div
                key={item.step}
                className="flex gap-4 rounded-2xl border border-white/10 bg-zinc-950/60 p-4 sm:items-start sm:gap-5 sm:p-5"
              >
                <span className="text-xl font-black tabular-nums text-[#F4D23C] sm:w-10 sm:shrink-0 sm:text-2xl">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-white sm:text-lg">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/65">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <CtaRow className="mt-8" />
        </div>
      </section>

      {/* ── 6. Community + competition ── */}
      <section className="border-t border-white/10 bg-zinc-950/80">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Community */}
            <div>
              <SectionLabel>Accountability</SectionLabel>
              <SectionHeading>Don&apos;t do another summer alone</SectionHeading>
              <p className="mt-3 text-sm leading-relaxed text-white/65 sm:text-base">
                Surround yourself with like-minded people who are training hard, posting proof, chasing progress and
                refusing average. The challenge only works when you&apos;re not doing it in isolation.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {COMMUNITY_BULLETS.map((item) => (
                  <div
                    key={item.text}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-4"
                  >
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#F4D23C]" />
                    <p className="text-sm text-white/80">{item.text}</p>
                  </div>
                ))}
              </div>

              <TelegramCta className="mt-6" />
            </div>

            {/* Competition */}
            <div>
              <SectionLabel>Competition</SectionLabel>
              <SectionHeading>Compete. Test yourself. Prove it.</SectionHeading>
              <p className="mt-3 text-sm leading-relaxed text-white/65 sm:text-base">
                Every week, the Hybrid Hard Challenge gives you a chance to push yourself, post your score and climb
                the leaderboard. This is where training meets accountability.
              </p>

              <ul className="mt-6 space-y-2.5">
                {LEADERBOARD_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-white/75">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#F4D23C]" />
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-2xl border border-[#F4D23C]/25 bg-[#F4D23C]/5 p-5">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-[#F4D23C]" />
                  <p className="font-semibold text-white">Hybrid Hard Weekly Challenge</p>
                </div>
                <p className="mt-2 text-sm text-white/65">
                  Drops every weekend in Telegram. Complete it, post proof, submit your score — your free week reserves
                  Saturday for the challenge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Full 16-week upgrade ── */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
            <div className="grid lg:grid-cols-2">
              <div className="p-7 sm:p-10 lg:p-12">
                <SectionLabel>Full programme</SectionLabel>
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl lg:text-4xl">
                  Follow the structure. Become the fittest, fastest and strongest you&apos;ve ever been.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
                  The free week gets you started. Follow the full{" "}
                  <span className="font-semibold text-white">16-week personalised Hybrid365 programme</span> with
                  progression, tracking and community support — and you give yourself the best chance of becoming the
                  fittest, fastest and strongest version of yourself.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <UpgradeCta />
                  <Link
                    href="/community"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-[#F4D23C]/40"
                  >
                    Learn about Hybrid365
                  </Link>
                </div>
              </div>

              <div className="border-t border-white/10 bg-black/40 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F4D23C]">Free vs full member</p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-[#F4D23C]/30 bg-[#F4D23C]/5 p-4">
                    <p className="text-sm font-semibold text-white">Free Hybrid 75 week</p>
                    <ul className="mt-2 space-y-1 text-sm text-white/70">
                      <li>Personalised challenge week + dashboard</li>
                      <li>Telegram accountability + weekly challenge</li>
                      <li>Leaderboard + proof culture</li>
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-zinc-500" />
                      <p className="text-sm font-semibold text-white">Full Hybrid365 member</p>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-white/60">
                      <li>Complete 16-week personalised programme</li>
                      <li>Progression, testing & long-term tracking</li>
                      <li>Full community + coaching ecosystem</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA strip */}
          <div className="mt-10 text-center">
            <p className="text-sm text-white/50">Ready to start?</p>
            <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryCta>Generate My Free Challenge Week</PrimaryCta>
              <TelegramCta />
            </div>
            <p className="mt-6 text-xs text-white/35">Hybrid365 · Fast, Fit, Strong · Refuse Average</p>
          </div>
        </div>
      </section>
    </main>
  );
}
