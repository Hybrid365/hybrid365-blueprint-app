import { cn } from "@/lib/utils";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import {
  HERO_MINI_UI_WIDTH,
  type EcosystemMiniCard,
} from "@/app/lib/homepage/coachingEcosystem";
import { HomepagePhoneVisual } from "./HomepagePhoneVisual";

export function HomepageEcosystemMiniCard({
  card,
  compact = false,
  className,
}: {
  card: EcosystemMiniCard;
  compact?: boolean;
  className?: string;
}) {
  const screen = getPhoneScreen(card.screenId);
  const previewWidth = compact ? 40 : HERO_MINI_UI_WIDTH;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <p
        className={cn(
          "text-center font-bold uppercase tracking-[0.12em] text-white/70",
          compact ? "mb-1 text-[6.5px]" : "mb-1.5 text-[7px] sm:text-[8px]"
        )}
      >
        {card.title}
      </p>

      <HomepagePhoneVisual
        screen={screen}
        displayWidth={previewWidth}
        className="drop-shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
      />
    </div>
  );
}
