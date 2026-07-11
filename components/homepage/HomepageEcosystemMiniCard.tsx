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
  const previewWidth = compact ? 44 : HERO_MINI_UI_WIDTH;

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#0a0a0a]/90 p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md",
        compact && "p-2",
        className
      )}
    >
      <p
        className={cn(
          "font-bold uppercase tracking-[0.12em] text-white/90",
          compact ? "text-[7px]" : "text-[8px]"
        )}
      >
        {card.title}
      </p>

      <div
        className={cn(
          "relative mx-auto mt-2 overflow-hidden rounded-[11px] border border-white/12 bg-black shadow-[0_8px_24px_rgba(0,0,0,0.45)]",
          compact ? "mt-1.5" : "mt-2"
        )}
        style={{ width: previewWidth, height: previewWidth * 1.85 }}
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
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]/30"
          aria-hidden
        />
      </div>

      <p
        className={cn(
          "mt-2 text-center leading-tight text-white/45",
          compact ? "mt-1.5 text-[7px]" : "text-[8px]"
        )}
      >
        {card.caption}
      </p>
    </div>
  );
}
