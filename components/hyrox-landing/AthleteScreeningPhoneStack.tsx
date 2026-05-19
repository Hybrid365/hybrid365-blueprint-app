import { cn } from "@/lib/utils"
import { PerformanceTestingMockup } from "./PerformanceTestingMockup"
import { RunVolumeMockup } from "./RunVolumeMockup"
import { WeightTrackingMockup } from "./WeightTrackingMockup"

type Props = {
  className?: string
}

const PHONE = { density: "compact" as const }

/**
 * Three overlapping dashboard mockups for the athlete screening section.
 * Run Volume (left) · Performance Testing (centre) · Weight Tracking (right)
 */
export function AthleteScreeningPhoneStack({ className }: Props) {
  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-[min(100%,520px)] flex-col items-center justify-center overflow-hidden px-1",
        className
      )}
      aria-label="Athlete dashboard previews: run volume, performance testing and weight tracking"
    >
      <div className="relative hidden w-full justify-center overflow-visible py-1 sm:flex">
        <div className="relative flex items-center justify-center">
          <div
            className="relative z-0 -mr-7 shrink-0 -rotate-[5deg] opacity-95 md:-mr-9"
            aria-hidden
          >
            <RunVolumeMockup size="sm" {...PHONE} />
          </div>

          <div className="relative z-20 shrink-0">
            <PerformanceTestingMockup size="md" {...PHONE} />
          </div>

          <div
            className="relative z-0 -ml-7 shrink-0 rotate-[5deg] opacity-95 md:-ml-9"
            aria-hidden
          >
            <WeightTrackingMockup size="sm" {...PHONE} />
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-[min(100%,100vw)] flex-col items-center overflow-hidden sm:hidden">
        <div className="relative z-20 shrink-0">
          <PerformanceTestingMockup size="md" {...PHONE} />
        </div>
        <div className="relative z-10 -mt-12 flex shrink-0 items-end justify-center">
          <div className="relative -mr-7 shrink-0 -rotate-[4deg] opacity-95">
            <RunVolumeMockup size="sm" {...PHONE} />
          </div>
          <div className="relative -ml-7 shrink-0 rotate-[4deg] opacity-95">
            <WeightTrackingMockup size="sm" {...PHONE} />
          </div>
        </div>
      </div>

      <p className="mt-2.5 max-w-xs text-center text-[9px] leading-relaxed text-white/40 sm:mt-3">
        Preview screens from the Hybrid365 athlete dashboard
      </p>
    </div>
  )
}
