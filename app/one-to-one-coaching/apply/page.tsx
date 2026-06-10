import type { Metadata } from "next";
import Link from "next/link";
import OneToOneApplyFormSection from "@/app/one-to-one-coaching/apply/OneToOneApplyFormSection";

export const metadata: Metadata = {
  title: "Apply | Hybrid365 1-1 Coaching",
  description:
    "Apply for Hybrid365 1-1 hybrid coaching — personalised programming, weekly check-ins and athlete dashboard access.",
};

export default function OneToOneCoachingApplyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="px-5 pb-8 pt-20 md:px-8 md:pt-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-[#F4D23C]">
            Hybrid365 1-1 · Application
          </div>

          <h1 className="mb-6 text-4xl font-bold uppercase leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
            Apply for
            <br />
            1-1 coaching.
          </h1>

          <p className="mb-8 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
            Application-based 1-1 coaching for hybrid performance — lean muscle, strength, running,
            conditioning and accountability. This isn&apos;t a PDF plan. Take your time with the
            form; I review every application manually.
          </p>

          <div className="flex flex-wrap gap-3">
            {[
              "Application reviewed manually",
              "Hybrid performance focus",
              "Weekly check-ins",
              "Athlete dashboard",
            ].map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white/80"
              >
                {pill}
              </span>
            ))}
          </div>

          <p className="mt-8 text-sm text-white/50">
            <Link href="/one-to-one-coaching" className="text-[#F4D23C] hover:underline">
              ← Back to 1-1 coaching overview
            </Link>
          </p>
        </div>
      </section>

      <OneToOneApplyFormSection />
    </main>
  );
}
