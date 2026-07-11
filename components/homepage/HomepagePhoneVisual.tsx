import { cn } from "@/lib/utils";
import type { PhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneFrame, type HomepagePhoneFrameSize } from "./HomepagePhoneFrame";

export function HomepagePhoneVisual({
  screen,
  size = "md",
  className,
  priority = false,
}: {
  screen: PhoneScreen;
  size?: HomepagePhoneFrameSize;
  className?: string;
  priority?: boolean;
}) {
  return (
    <HomepagePhoneFrame
      image={screen.src}
      alt={screen.alt}
      width={screen.width}
      height={screen.height}
      size={size}
      className={cn(className)}
      priority={priority}
    />
  );
}
