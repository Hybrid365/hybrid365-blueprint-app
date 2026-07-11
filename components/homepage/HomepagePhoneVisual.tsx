import { cn } from "@/lib/utils";
import type { PhoneScreen } from "@/app/lib/homepage/phoneScreens";
import {
  PHONE_CUTOUT_DISPLAY_WIDTH,
  type HomepagePhoneCutoutSize,
} from "@/app/lib/homepage/phoneScreens";

/**
 * Renders a full-phone transparent cutout PNG directly — no CSS device frame.
 * Uses native <img> for maximum sharpness with explicit dimensions.
 */
export function HomepagePhoneVisual({
  screen,
  size = "md",
  className,
  priority = false,
}: {
  screen: PhoneScreen;
  size?: HomepagePhoneCutoutSize;
  className?: string;
  priority?: boolean;
}) {
  const displayWidth = PHONE_CUTOUT_DISPLAY_WIDTH[size];

  return (
    <div
      className={cn(
        "mx-auto shrink-0 drop-shadow-[0_24px_48px_rgba(0,0,0,0.55)]",
        className
      )}
      style={{ width: displayWidth }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={screen.src}
        alt={screen.alt}
        width={screen.width}
        height={screen.height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className="block h-auto w-full object-contain"
        style={{ maxWidth: displayWidth }}
      />
    </div>
  );
}
