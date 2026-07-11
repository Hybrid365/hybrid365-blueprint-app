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
  const previewWidth = compact ? 76 : HERO_MINI_UI_WIDTH;
  const previewHeight = compact ? 52 : 62;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <p
        className={cn(
          "mb-1.5 text-center font-bold uppercase tracking-[0.11em] text-white/80",
          compact ? "text-[6px]" : "text-[7px] sm:text-[8px]"
        )}
      >
        {card.title}
      </p>

      <div
        className={cn(
          "overflow-hidden rounded-xl border border-white/12 bg-[#0d0d0d]/95 shadow-[0_14px_32px_rgba(0,0,0,0.5)] backdrop-blur-md",
          compact ? "p-1.5" : "p-2"
        )}
        style={{ width: previewWidth + (compact ? 12 : 16) }}
      >
        <div
          className="relative overflow-hidden rounded-lg border border-white/8 bg-black"
          style={{ width: previewWidth, height: previewHeight }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screen.src}
            alt=""
            aria-hidden
            width={screen.width}
            height={screen.height}
            className="absolute left-1/2 top-0 block h-auto max-w-none -translate-x-1/2 object-contain object-top"
            style={{ width: previewWidth * 1.35 }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}
