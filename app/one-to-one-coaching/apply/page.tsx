import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Apply | Hybrid365 1-1 Coaching",
  description:
    "Apply for Hybrid365 1-1 hybrid coaching — personalised programming, weekly check-ins and athlete dashboard access.",
};

const INSTAGRAM_URL = "https://www.instagram.com/hybrid.365";

export default function OneToOneCoachingApplyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="px-5 pb-16 pt-20 md:px-8 md:pb-24 md:pt-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-[#F4D23C]">
            Hybrid365 1-1 · Application
          </div>

          <h1 className="mb-6 text-4xl font-bold uppercase leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
            Apply for
            <br />
            1-1 coaching.
          </h1>

          <p className="mb-10 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
            Application-based 1-1 coaching with personalised programming, athlete app access,
            weekly check-ins and progress tracking — built for hybrid performance, not a generic
            PDF plan.
          </p>

          <div className="flex flex-wrap gap-3">
            {[
              "Application reviewed manually",
              "Hybrid performance focus",
              "Weekly check-ins",
              "Athlete dashboard",
              "Refuse Average",
            ].map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white/80"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-2xl font-bold uppercase tracking-tight md:text-3xl">
            How to apply
          </h2>
          <p className="mb-8 max-w-2xl text-base leading-relaxed text-white/70">
            Full application form is coming soon. For now, send your interest via Instagram so we
            can review your goals, training history and whether 1-1 coaching is the right fit.
          </p>

          <div className="rounded-2xl border border-[#F4D23C]/30 bg-[#F4D23C]/5 p-6 md:p-8">
            <p className="text-sm font-bold uppercase tracking-wide text-[#F4D23C]">
              Step 1 — Send your application
            </p>
            <p className="mt-3 text-white/80">
              DM <span className="font-semibold text-white">HYBRID</span> on Instagram with:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>→ Your main training goal</li>
              <li>→ Current training days per week</li>
              <li>→ Running / lifting experience</li>
              <li>→ Why you want 1-1 coaching now</li>
            </ul>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#F4D23C] px-8 text-sm font-black uppercase tracking-wide text-black hover:opacity-90"
            >
              DM HYBRID on Instagram
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/one-to-one-coaching"
              className="text-sm font-semibold text-[#F4D23C] hover:underline"
            >
              ← Back to 1-1 coaching overview
            </Link>
            <Link href="/hyrox-team" className="text-sm text-white/50 hover:text-white/70">
              HYROX-specific coaching → Hyrox Team
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
