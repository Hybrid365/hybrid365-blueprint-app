import { cn } from "@/lib/utils";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import {
  type HeroIllustrationCard,
} from "@/app/lib/homepage/coachingEcosystem";

export function HomepageEcosystemMiniCard({
  card,
  className,
}: {
  card: HeroIllustrationCard;
  className?: string;
}) {
  const screen = getPhoneScreen(card.screenId);

  return (
    <div className={cn("flex w-full flex-col items-center", className)}>
      <p className="mb-1 text-center text-[7px] font-bold uppercase tracking-[0.12em] text-white/75">
        {card.title}
      </p>

      <div className="w-full overflow-hidden rounded-[10px] border border-white/10 bg-[#0c0c0c]/95 p-[6%] shadow-[0_10px_28px_rgba(0,0,0,0.42)] backdrop-blur-sm">
        <div className="relative mx-auto w-full overflow-hidden rounded-md border border-white/8 bg-black aspect-[12/7]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screen.src}
            alt=""
            aria-hidden
            width={screen.width}
            height={screen.height}
            className="absolute left-1/2 top-0 block h-auto max-w-none -translate-x-1/2 object-contain object-top"
            style={{ width: "128%" }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}
