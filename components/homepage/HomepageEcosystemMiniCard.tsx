import { cn } from "@/lib/utils";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import {
  HERO_MINI_UI_WIDTH,
  type EcosystemMiniCard,
} from "@/app/lib/homepage/coachingEcosystem";

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
  const previewWidth = compact ? 42 : HERO_MINI_UI_WIDTH;

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-[#0a0a0a]/92 shadow-[0_12px_36px_rgba(0,0,0,0.45)] backdrop-blur-md",
        compact ? "px-2 py-1.5" : "px-2.5 py-2",
        className
      )}
    >
      <p
        className={cn(
          "text-center font-bold uppercase tracking-[0.1em] text-white/85",
          compact ? "text-[6.5px]" : "text-[7.5px] sm:text-[8px]"
        )}
      >
        {card.title}
      </p>

      <div
        className={cn(
          "relative mx-auto overflow-hidden rounded-[10px] border border-white/10 bg-black",
          compact ? "mt-1" : "mt-1.5"
        )}
        style={{ width: previewWidth, height: previewWidth * 1.75 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screen.src}
          alt=""
          aria-hidden
          width={screen.width}
          height={screen.height}
          className="absolute left-1/2 top-0 block h-auto -translate-x-1/2 object-contain object-top"
          style={{ width: previewWidth }}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}
