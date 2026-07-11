import Image from "next/image";
import { cn } from "@/lib/utils";

export type HomepagePhoneFrameSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<HomepagePhoneFrameSize, string> = {
  sm: "w-[clamp(148px,38vw,188px)]",
  md: "w-[clamp(188px,44vw,238px)]",
  lg: "w-[clamp(218px,48vw,272px)]",
  xl: "w-[clamp(248px,52vw,300px)]",
};

type HomepagePhoneFrameProps = {
  image: string;
  alt: string;
  size?: HomepagePhoneFrameSize;
  className?: string;
  priority?: boolean;
};

/**
 * Premium iPhone device wrapper for homepage UI screenshots.
 * Renders a visible charcoal device body with inner screen clipping.
 */
export function HomepagePhoneFrame({
  image,
  alt,
  size = "md",
  className,
  priority = false,
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
        {/* Dynamic island */}
        <div
          className="pointer-events-none absolute left-1/2 top-[10px] z-20 h-[21px] w-[78px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/12"
          aria-hidden
        />

        {/* Inner screen */}
        <div className="relative h-full w-full overflow-hidden rounded-[1.7rem] bg-black ring-1 ring-inset ring-white/[0.1]">
          <Image
            src={image}
            alt={alt}
            fill
            priority={priority}
            className="object-cover object-top"
            sizes="(max-width: 640px) 55vw, (max-width: 1024px) 280px, 300px"
          />
        </div>

        {/* Home indicator */}
        <div
          className="pointer-events-none absolute bottom-[10px] left-1/2 z-20 h-[4px] w-[70px] -translate-x-1/2 rounded-full bg-white/30"
          aria-hidden
        />
      </div>
    </div>
  );
}
