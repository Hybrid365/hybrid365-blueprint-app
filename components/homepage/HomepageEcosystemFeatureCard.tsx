import { cn } from "@/lib/utils";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import {
  HERO_FEATURE_CARD,
  type HeroFeatureCardSpec,
} from "@/app/lib/homepage/coachingEcosystem";

export function HomepageEcosystemFeatureCard({
  card,
  compact = false,
  className,
}: {
  card: HeroFeatureCardSpec;
  compact?: boolean;
  className?: string;
}) {
  const screen = getPhoneScreen(card.screenId);
  const cardWidth = compact ? 88 : HERO_FEATURE_CARD.width;
  const bodyHeight = compact ? 52 : HERO_FEATURE_CARD.bodyHeight;
  const miniPhoneWidth = compact ? 22 : 30;

  return (
    <div className={cn("flex flex-col", className)} style={{ width: cardWidth }}>
      <p
        className={cn(
          "mb-1 font-bold uppercase tracking-[0.11em] text-white/80",
          compact ? "text-[5.5px]" : "text-[6.5px] sm:text-[7px]"
        )}
      >
        {card.title}
      </p>

      <div
        className={cn(
          "flex overflow-hidden rounded-[9px] border border-white/12 bg-[#0c0c0c]/95 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm",
          compact ? "gap-1 p-1" : "gap-1.5 p-1.5"
        )}
        style={{ height: bodyHeight }}
      >
        <div
          className="relative shrink-0 overflow-hidden rounded-[5px] border border-white/8 bg-black"
          style={{ width: miniPhoneWidth, height: bodyHeight - (compact ? 8 : 12) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screen.src}
            alt=""
            aria-hidden
            width={screen.width}
            height={screen.height}
            className="absolute left-1/2 top-0 block h-auto max-w-none -translate-x-1/2 object-contain object-top"
            style={{ width: miniPhoneWidth * 1.6 }}
            loading="lazy"
            decoding="async"
          />
        </div>

        <ul className="flex min-w-0 flex-1 flex-col justify-center gap-[3px]">
          {card.metrics.map((metric) => (
            <li
              key={metric.label}
              className={cn(
                "flex items-center gap-1 leading-none",
                compact ? "text-[5px]" : "text-[6px] sm:text-[6.5px]"
              )}
            >
              <span
                className="shrink-0 rounded-full bg-[#f4d23c]/90"
                style={{ width: compact ? 3 : 4, height: compact ? 3 : 4 }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-white/55">
                {metric.value ? (
                  <>
                    {metric.label}
                  </>
                ) : (
                  metric.label
                )}
              </span>
              {metric.value ? (
                <span className="shrink-0 font-semibold tabular-nums text-white/85">
                  {metric.value}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
