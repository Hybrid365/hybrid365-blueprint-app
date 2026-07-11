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
        className="pointer-events-none absolute -inset-3 rounded-[2.5rem] bg-[radial-gradient(circle_at_center,rgba(244,210,60,0.12),transparent_70%)]"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.55),0_0_40px_rgba(244,210,60,0.06)]">
        <Image
          src={screen.src}
          alt={screen.alt}
          width={390}
          height={844}
          priority={priority}
          className="h-auto w-full"
          sizes="(max-width: 640px) 55vw, (max-width: 1024px) 280px, 320px"
        />
      </div>
    </div>
  );
}
