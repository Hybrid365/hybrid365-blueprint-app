import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PhoneScreen } from "@/app/lib/homepage/phoneScreens";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<Size, string> = {
  sm: "w-[clamp(160px,42vw,200px)]",
  md: "w-[clamp(200px,48vw,260px)]",
  lg: "w-[clamp(240px,52vw,300px)]",
  xl: "w-[clamp(260px,55vw,320px)]",
};

/** Approximate dimensions of cleaned transparent cutouts (~280×607). */
const CUTOUT_WIDTH = 285;
const CUTOUT_HEIGHT = 607;

export function HomepagePhoneVisual({
  screen,
  size = "md",
  className,
  priority = false,
}: {
  screen: PhoneScreen;
  size?: Size;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0",
        SIZE_CLASS[size],
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-4 bg-[radial-gradient(circle_at_center,rgba(244,210,60,0.1),transparent_72%)]"
        aria-hidden
      />
      <Image
        src={screen.src}
        alt={screen.alt}
        width={CUTOUT_WIDTH}
        height={CUTOUT_HEIGHT}
        priority={priority}
        className="relative z-10 h-auto w-full drop-shadow-[0_28px_56px_rgba(0,0,0,0.65)]"
        sizes="(max-width: 640px) 55vw, (max-width: 1024px) 280px, 320px"
      />
    </div>
  );
}
