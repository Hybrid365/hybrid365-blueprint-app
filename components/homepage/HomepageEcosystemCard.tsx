import { cn } from "@/lib/utils";
import {
  ECOSYSTEM_ACCENT_STYLES,
  type EcosystemFeatureCard,
} from "@/app/lib/homepage/coachingEcosystem";

export function HomepageEcosystemCard({
  card,
  compact = false,
  className,
}: {
  card: EcosystemFeatureCard;
  compact?: boolean;
  className?: string;
}) {
  const accent = ECOSYSTEM_ACCENT_STYLES[card.accent];

  return (
    <div
      className={cn(
        "rounded-xl border bg-[#0c0c0c]/95 backdrop-blur-sm",
        accent.border,
        accent.glow,
        "shadow-[0_12px_32px_rgba(0,0,0,0.45)]",
        compact ? "p-2" : "p-2.5 sm:p-3",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", accent.dot)}
          aria-hidden
        />
        <h3
          className={cn(
            "font-bold uppercase leading-tight tracking-wide text-white",
            compact ? "text-[8px]" : "text-[9px] sm:text-[10px]"
          )}
        >
          {card.title}
        </h3>
      </div>

      {card.highlight ? (
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-white/45",
              compact ? "text-[8px]" : "text-[9px]"
            )}
          >
            {card.highlight.label}
          </span>
          <span
            className={cn(
              "font-bold tabular-nums",
              compact ? "text-[9px]" : "text-[10px]",
              card.highlight.tone === "green"
                ? "text-[#4ade80]"
                : "text-[#f4d23c]"
            )}
          >
            {card.highlight.value}
          </span>
        </div>
      ) : null}

      <ul className={cn("mt-1.5 space-y-0.5", compact && "mt-1")}>
        {card.tags.map((tag) => (
          <li
            key={tag}
            className={cn(
              "leading-snug text-white/50",
              compact ? "text-[7.5px]" : "text-[8px] sm:text-[9px]"
            )}
          >
            {tag}
          </li>
        ))}
      </ul>

      {card.id === "performance" ? (
        <svg
          viewBox="0 0 80 16"
          className={cn("mt-1.5 w-full text-[#4ade80]", compact ? "h-2" : "h-2.5")}
          aria-hidden
        >
          <path
            d="M0 12 L14 10 L28 9 L42 6 L56 4 L70 2 L80 1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="homepage-ecosystem-sparkline"
            pathLength={100}
          />
        </svg>
      ) : null}
    </div>
  );
}
