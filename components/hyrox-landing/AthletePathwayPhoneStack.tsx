import { cn } from "@/lib/utils"
import { AthleteDashboardMockup } from "./AthleteDashboardMockup"
import { AthleteJourneyMockup } from "./AthleteJourneyMockup"
import { PerformanceTestingMockup } from "./PerformanceTestingMockup"

type Props = {
  className?: string
}

/**
 * Three overlapping code-rendered phone mockups for the athlete pathway.
 * Journey (left) · Dashboard (centre) · Benchmarks (right)
 */
export function AthletePathwayPhoneStack({ className }: Props) {
  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-[min(100%,680px)] flex-col items-center justify-center overflow-visible",
        className
      )}
      aria-label="Athlete app pathway: journey, dashboard and benchmark tracking"
    >
      {/* Desktop / tablet: overlapping fan — fixed phone widths, no % squeeze */}
      <div className="relative hidden w-full justify-center overflow-visible py-2 sm:flex">
        <div className="relative flex items-center justify-center">
          <div
            className="relative z-0 -mr-10 shrink-0 -rotate-[5deg] opacity-95 md:-mr-14"
            aria-hidden
          >
            <AthleteJourneyMockup size="sm" />
          </div>

          <div className="relative z-20 shrink-0">
            <AthleteDashboardMockup size="md" />
          </div>

          <div
            className="relative z-0 -ml-10 shrink-0 rotate-[5deg] opacity-95 md:-ml-14"
            aria-hidden
          >
            <PerformanceTestingMockup size="sm" />
          </div>
        </div>
      </div>

      {/* Mobile: centre phone forward, side phones overlapped behind */}
      <div className="flex w-full flex-col items-center overflow-visible sm:hidden">
        <div className="relative z-20 shrink-0">
          <AthleteDashboardMockup size="md" />
        </div>
        <div className="relative z-10 -mt-16 flex shrink-0 items-end justify-center">
          <div className="relative -mr-10 shrink-0 -rotate-[4deg] opacity-95">
            <AthleteJourneyMockup size="sm" />
          </div>
          <div className="relative -ml-10 shrink-0 rotate-[4deg] opacity-95">
            <PerformanceTestingMockup size="sm" />
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35 sm:mt-4">
        Journey · Dashboard · Benchmarks
      </p>
    </div>
  )
}
