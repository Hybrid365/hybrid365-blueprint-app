import { cn } from "@/lib/utils"

type Props = {
  children: React.ReactNode
  className?: string
  /** `sm` = side phone, `md`/`lg` = centre / hero phone */
  size?: "sm" | "md" | "lg"
  /** Smaller frames for compact stacks (e.g. Athlete Screening) */
  density?: "default" | "compact"
}

/** Width via clamp; height follows 9:19.5 aspect ratio — no independent squashing. */
const SIZE_CLASS = {
  default: {
    sm: "w-[clamp(190px,17vw,245px)] text-[9px]",
    md: "w-[clamp(210px,20vw,280px)] text-[10px]",
    lg: "w-[clamp(210px,20vw,280px)] text-[10px]",
  },
  compact: {
    sm: "w-[clamp(155px,13.5vw,195px)] text-[8px]",
    md: "w-[clamp(172px,15.5vw,222px)] text-[9px]",
    lg: "w-[clamp(172px,15.5vw,222px)] text-[9px]",
  },
} as const

export function IPhoneFrame({
  children,
  className,
  size = "md",
  density = "default",
}: Props) {
  const isCompact = density === "compact"

  return (
    <div
      className={cn("relative mx-auto shrink-0", SIZE_CLASS[density][size], className)}
    >
      <div
        className={cn(
          "relative box-border aspect-[9/19.5] w-full overflow-hidden rounded-[1.75rem] border border-white/[0.14]",
          "bg-[#0c0c0c] p-[5px]",
          isCompact
            ? "shadow-[0_10px_28px_rgba(0,0,0,0.38),0_0_16px_rgba(244,210,60,0.035)]"
            : "shadow-[0_14px_40px_rgba(0,0,0,0.45),0_0_24px_rgba(244,210,60,0.05)]"
        )}
      >
        <div className="pointer-events-none absolute left-1/2 top-[7px] z-20 h-[18px] w-[72px] -translate-x-1/2 rounded-full bg-black" />
        <div className="pointer-events-none absolute left-1/2 top-[14px] z-20 h-[5px] w-8 -translate-x-1/2 rounded-full bg-white/[0.06]" />

        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.45rem] bg-black">
          {children}
        </div>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(244,210,60,0.06),transparent_72%)]",
          isCompact ? "-inset-1.5" : "-inset-2"
        )}
        aria-hidden
      />
    </div>
  )
}
