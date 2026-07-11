import { cn } from "@/lib/utils";

export type HomepagePhoneFrameSize = "sm" | "md" | "lg" | "xl";

/** Display widths — React screens render natively at device DPR (no raster upscale). */
const SIZE_CLASS: Record<HomepagePhoneFrameSize, string> = {
  sm: "w-[clamp(140px,32vw,170px)]",
  md: "w-[clamp(168px,36vw,220px)]",
  lg: "w-[clamp(188px,38vw,250px)]",
  xl: "w-[clamp(208px,40vw,270px)]",
};

type HomepagePhoneFrameProps = {
  children: React.ReactNode;
  size?: HomepagePhoneFrameSize;
  className?: string;
};

/**
 * Premium iPhone device wrapper for homepage UI screens.
 * Renders live React screen content for maximum sharpness on retina displays.
 */
export function HomepagePhoneFrame({
  children,
  size = "md",
  className,
}: HomepagePhoneFrameProps) {
  return (
    <div className={cn("relative mx-auto shrink-0", SIZE_CLASS[size], className)}>
      <div
        className="pointer-events-none absolute -inset-3 rounded-[2.75rem] bg-[radial-gradient(circle_at_center,rgba(244,210,60,0.1),transparent_72%)]"
        aria-hidden
      />

      <div
        className={cn(
          "relative aspect-[9/19.5] w-full",
          "rounded-[2.35rem] border-[1.5px] border-white/20",
          "bg-gradient-to-b from-[#1a1a1a] via-[#101010] to-[#060606]",
          "p-[8px]",
          "shadow-[0_22px_52px_rgba(0,0,0,0.65),0_0_32px_rgba(244,210,60,0.07)]"
        )}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-[10px] z-20 h-[21px] w-[78px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/12"
          aria-hidden
        />

        <div className="relative h-full w-full overflow-hidden rounded-[1.7rem] bg-black ring-1 ring-inset ring-white/[0.1]">
          {children}
        </div>

        <div
          className="pointer-events-none absolute bottom-[10px] left-1/2 z-20 h-[4px] w-[70px] -translate-x-1/2 rounded-full bg-white/30"
          aria-hidden
        />
      </div>
    </div>
  );
}
