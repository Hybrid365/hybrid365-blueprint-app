import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Application Received | Hybrid365 Hyrox Team",
  description:
    "Your application for the first Hybrid365 Hyrox Team has been received.",
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5 px-3 py-2 border border-[#f4d23c]/[0.36] text-[#f4d23c] rounded-full text-xs font-black tracking-[0.14em] uppercase bg-[#f4d23c]/[0.075]">
      <span className="w-[7px] h-[7px] rounded-full bg-[#f4d23c] shadow-[0_0_18px_rgba(244,210,60,0.95)]" />
      {children}
    </div>
  )
}

function PrimaryButton({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="min-h-[52px] inline-flex items-center justify-center px-6 rounded-full font-black tracking-[-0.02em] bg-[#f4d23c] text-[#050505] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 w-full sm:w-auto"
    >
      {children}
    </Link>
  )
}

function SecondaryButton({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="min-h-[52px] inline-flex items-center justify-center px-6 rounded-full font-black tracking-[-0.02em] text-[#f6f6f6] border border-white/[0.18] bg-white/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 w-full sm:w-auto"
    >
      {children}
    </Link>
  )
}

export default function HyroxTeamThankYouPage() {
  return (
    <div className="font-sans bg-[#050505] text-[#f6f6f6] min-h-screen">
      <main className="max-w-[980px] mx-auto px-2.5 sm:px-[18px] pb-12 sm:pb-20 pt-4">
        <section className="relative min-h-[calc(100vh-48px)] flex items-center justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-[76px] lg:py-[86px] rounded-[24px] sm:rounded-[34px] border border-[#f4d23c]/[0.35] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(244,210,60,0.16),transparent_38%),radial-gradient(circle_at_top_left,rgba(244,210,60,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_40%)]" />

          <div className="relative z-10 text-center">
            <Eyebrow>Team 001 / Application received</Eyebrow>

            <h1 className="mt-6 mb-5 text-[clamp(44px,8vw,96px)] leading-[0.86] tracking-[-0.085em] uppercase font-black">
              Application
              <br />
              <span className="text-[#f4d23c]">received.</span>
            </h1>

            <p className="max-w-[720px] mx-auto text-[#dddddd] text-[clamp(17px,2vw,22px)] leading-[1.45] m-0">
              Thanks for applying for the first Hybrid365 Hyrox Team. Your
              application has been received and will be reviewed manually.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
              <div className="border border-white/[0.11] bg-white/[0.045] rounded-[20px] p-5">
                <div className="text-[#f4d23c] text-xs font-black tracking-[0.12em] uppercase mb-4">
                  01 / Review
                </div>
                <h3 className="m-0 mb-2 text-xl tracking-[-0.04em] uppercase">
                  Manual review
                </h3>
                <p className="m-0 text-[#a9a9a9] leading-[1.45] text-sm">
                  Applications are checked properly, not accepted automatically.
                </p>
              </div>

              <div className="border border-white/[0.11] bg-white/[0.045] rounded-[20px] p-5">
                <div className="text-[#f4d23c] text-xs font-black tracking-[0.12em] uppercase mb-4">
                  02 / Fit
                </div>
                <h3 className="m-0 mb-2 text-xl tracking-[-0.04em] uppercase">
                  Selection fit
                </h3>
                <p className="m-0 text-[#a9a9a9] leading-[1.45] text-sm">
                  The first team will be selected based on intent, standards and coachability.
                </p>
              </div>

              <div className="border border-white/[0.11] bg-white/[0.045] rounded-[20px] p-5">
                <div className="text-[#f4d23c] text-xs font-black tracking-[0.12em] uppercase mb-4">
                  03 / Next
                </div>
                <h3 className="m-0 mb-2 text-xl tracking-[-0.04em] uppercase">
                  Next steps
                </h3>
                <p className="m-0 text-[#a9a9a9] leading-[1.45] text-sm">
                  If you’re a strong fit, I’ll be in touch directly with the next stage.
                </p>
              </div>
            </div>

            <div className="mt-8 border border-[#f4d23c]/[0.26] bg-[#f4d23c]/[0.075] rounded-[20px] p-5 text-left">
              <p className="m-0 text-[#e9e9e9] leading-[1.5] text-sm sm:text-base">
                In the meantime, keep following the build on Instagram. The
                Hybrid365 Hyrox Team will be documented from athlete selection,
                screening and training through to race day.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3.5 mt-8">
              <PrimaryButton href="/hyrox-team">
                Back to Hyrox Team
              </PrimaryButton>

              <SecondaryButton href="/free-week">
                Get Free Training Week
              </SecondaryButton>

              <SecondaryButton href="https://www.instagram.com/hybrid.365">
                Follow @hybrid.365
              </SecondaryButton>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}