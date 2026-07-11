import { cn } from "@/lib/utils";
import {
  getPhoneScreen,
  HERO_PHONE_DISPLAY_WIDTH,
  HERO_PHONE_SCREENS,
} from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneVisual } from "./HomepagePhoneVisual";
import { HomepageHeroProgressCard } from "./HomepageHeroProgressCard";

export function HomepageHeroPhoneFan({ className }: { className?: string }) {
  const primary = getPhoneScreen(HERO_PHONE_SCREENS.primary);
  const [supportA, supportB] = HERO_PHONE_SCREENS.supporting.map(getPhoneScreen);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[280px] pb-6 sm:max-w-[300px] lg:max-w-[320px] lg:pb-0",
        className
      )}
    >
      {/* Supporting phone — back left */}
      <div className="absolute left-0 top-10 z-0 hidden w-[42%] -rotate-[6deg] sm:block lg:left-[-1%]">
        <HomepagePhoneVisual
          screen={supportA}
          displayWidth={HERO_PHONE_DISPLAY_WIDTH.supporting}
          className="opacity-85"
        />
      </div>

      {/* Supporting phone — back right */}
      <div className="absolute right-0 top-12 z-0 hidden w-[42%] rotate-[5deg] sm:block lg:right-[-1%]">
        <HomepagePhoneVisual
          screen={supportB}
          displayWidth={HERO_PHONE_DISPLAY_WIDTH.supporting}
          className="opacity-80"
        />
      </div>

      {/* Primary phone — centre preview */}
      <div className="relative z-10 mx-auto flex justify-center">
        <HomepagePhoneVisual
          screen={primary}
          displayWidth={HERO_PHONE_DISPLAY_WIDTH.primary}
          priority
        />
      </div>

      {/* Performance progress card — replaces founder inset */}
      <div className="absolute -bottom-1 right-0 z-20 w-[58%] min-w-[148px] max-w-[188px] sm:-right-2 lg:-right-4">
        <HomepageHeroProgressCard />
      </div>
    </div>
  );
}
