import { cn } from "@/lib/utils";
import type { PhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneFrame, type HomepagePhoneFrameSize } from "./HomepagePhoneFrame";
import { HomepagePhoneScreenById } from "./phone-screens/HomepagePhoneScreens";

export function HomepagePhoneVisual({
  screen,
  size = "md",
  className,
}: {
  screen: PhoneScreen;
  size?: HomepagePhoneFrameSize;
  className?: string;
  /** @deprecated React screens render sharply without image priority hints */
  priority?: boolean;
}) {
  return (
    <HomepagePhoneFrame size={size} className={cn(className)}>
      <HomepagePhoneScreenById id={screen.id} />
    </HomepagePhoneFrame>
  );
}
