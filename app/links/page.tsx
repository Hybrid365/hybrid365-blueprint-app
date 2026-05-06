import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Hybrid365 Links | Choose Your Path",
  description:
    "Choose your Hybrid365 path: free personalised training week, Hyrox Team application, or Hybrid365 Hybrid Coaching community.",
}

function PathCard({
  eyebrow,
  title,
  description,
  href,
  cta,
  highlighted = false,
  imageSrc,
}: {
  eyebrow: string
  title: string
  description: string
  href: string
  cta: string
  highlighted?: boolean
  imageSrc?: string
}) {
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-[24px] border p-6 transition-all duration-200 hover:-translate-y-1 ${
        highlighted
          ? "border-[#F4D23C]/50 bg-[#F4D23C]/10 shadow-[0_0_40px_rgba(244,210,60,0.08)]"
          : "border-white/10 bg-white/[0.04] hover:border-[#F4D23C]/35"
      }`}
    >
      {imageSrc && (
        <>
          <div className="absolute inset-0">
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-cover grayscale-[20%] contrast-[1.05] brightness-[0.45] transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/70 to-black/85" />

          {highlighted && <div className="absolute inset-0 bg-[#F4D23C]/[0.06]" />}
        </>
      )}

      <div className="relative z-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <span
            className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] ${
              highlighted
                ? "bg-[#F4D23C] text-black"
                : "border border-white/15 bg-black/20 text-[#F4D23C]"
            }`}
          >
            {eyebrow}
          </span>

          <span className="text-[#F4D23C] transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </div>

        <h2 className="mb-3 text-[26px] font-black uppercase leading-[0.95] tracking-[-0.055em] text-white sm:text-[32px]">
          {title}
        </h2>

        <p className="mb-6 max-w-[540px] text-sm leading-relaxed text-white/75 sm:text-base">
          {description}
        </p>

        <div
          className={`inline-flex min-h-[46px] items-center justify-center rounded-full px-5 text-sm font-black uppercase tracking-[-0.01em] transition-all ${
            highlighted
              ? "bg-[#F4D23C] text-black"
              : "border border-white/15 bg-white/[0.06] text-white group-hover:border-[#F4D23C]/40"
          }`}
        >
          {cta}
        </div>
      </div>
    </Link>
  )
}

export default function LinksPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(244,210,60,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.55)] sm:p-8">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-[#F4D23C]/35 bg-[#F4D23C]/[0.075] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#F4D23C]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#F4D23C] shadow-[0_0_18px_rgba(244,210,60,0.95)]" />
              Hybrid365
            </div>

            <h1 className="mx-auto mb-3 max-w-[560px] text-[clamp(38px,10vw,64px)] font-black uppercase leading-[0.86] tracking-[-0.085em]">
              Build a body that performs.
            </h1>

            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#F4D23C]">
              Refuse Average.
            </p>

            <p className="mx-auto max-w-[460px] text-sm leading-relaxed text-white/60 sm:text-base">
              Choose your path below.
            </p>
          </div>

          <div className="grid gap-3.5">
            <PathCard
              eyebrow="Start here"
              title="Free Personalised Hybrid Training Week"
              description="Get a free training week built around your goals, schedule, training level and current focus."
              href="/free-week"
              cta="Build my week"
              imageSrc="/images/links/Training Week Card.jpg"
            />

            <PathCard
              eyebrow="Applications open"
              title="Hybrid365 Hyrox Team Application"
              description="Apply for the first selective Hybrid365 Hyrox Team — 1-1 coaching inside a small performance team."
              href="/hyrox-team"
              cta="Apply for the team"
              highlighted
              imageSrc="/images/links/HyroxCard.jpg"
            />

            <PathCard
              eyebrow="Community"
              title="Hybrid365 Hybrid Coaching"
              description="Training structure, education and accountability for athletes who want to become fast, fit and strong."
              href="/community"
              cta="Join Hybrid365"
              imageSrc="/images/links/OtherCard.jpg"
            />
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 border-t border-white/10 pt-6 text-xs font-bold uppercase tracking-[0.12em] text-white/45">
            <Link
              href="https://www.instagram.com/hybrid.365"
              className="transition-colors hover:text-[#F4D23C]"
            >
              Instagram
            </Link>

            <span>/</span>

            <Link
              href="https://www.tiktok.com/@hybrid.365"
              className="transition-colors hover:text-[#F4D23C]"
            >
              TikTok
            </Link>

            <span>/</span>

            <span>Fast. Fit. Strong.</span>
          </div>
        </div>
      </section>
    </main>
  )
}