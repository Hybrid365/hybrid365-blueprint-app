import { cn } from "@/lib/utils";
import type { PhoneScreen, PhoneScreenId } from "@/app/lib/homepage/phoneScreens";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneVisual } from "./HomepagePhoneVisual";

export type CarouselItem = {
  screenId: PhoneScreenId;
  feature?: string;
};

export function HomepagePhoneCarousel({
  items,
  phoneSize = "md",
  className,
  showScrollHint = true,
}: {
  items: CarouselItem[] | PhoneScreenId[];
  phoneSize?: "sm" | "md" | "lg";
  className?: string;
  showScrollHint?: boolean;
}) {
  const normalized: { screen: PhoneScreen; feature?: string }[] = items.map(
    (item) => {
      if (typeof item === "string") {
        return { screen: getPhoneScreen(item) };
      }
      return {
        screen: getPhoneScreen(item.screenId),
        feature: item.feature,
      };
    }
  );

  return (
    <div className={className}>
      {showScrollHint ? (
        <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 lg:hidden">
          Swipe to explore →
        </p>
      ) : null}
      <div
        className={cn(
          "-mx-4 flex gap-6 overflow-x-auto px-4 pb-4 snap-x snap-mandatory",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "lg:mx-0 lg:px-0"
        )}
      >
        {normalized.map(({ screen, feature }) => (
          <article
            key={screen.id}
            className="w-[min(64vw,210px)] shrink-0 snap-center sm:w-[min(60vw,220px)]"
          >
            <HomepagePhoneVisual screen={screen} size={phoneSize} className="mx-auto" />
            <div className="mt-5 text-center lg:text-left">
              {feature ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f4d23c]/80">
                  {feature}
                </p>
              ) : null}
              <h3 className="mt-1 text-sm font-black uppercase tracking-wide text-white">
                {screen.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-white/50">
                {screen.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
