"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import {
  ECOSYSTEM_FEATURE_CARDS,
  HERO_ECOSYSTEM_PHONE,
} from "@/app/lib/homepage/coachingEcosystem";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneVisual } from "./HomepagePhoneVisual";
import { HomepageEcosystemCard } from "./HomepageEcosystemCard";
import { HomepageHorizontalScroll } from "./HomepageMotion";

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServer() {
  return true;
}

function EcosystemConnectors({
  animate,
  visibleCardIds,
  className,
}: {
  animate: boolean;
  visibleCardIds?: Set<string>;
  className?: string;
}) {
  const cards = visibleCardIds
    ? ECOSYSTEM_FEATURE_CARDS.filter((c) => visibleCardIds.has(c.id))
    : ECOSYSTEM_FEATURE_CARDS;

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="ecosystem-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f4d23c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      {cards.map((card, index) => (
        <g key={card.id}>
          <path
            d={card.connectorPath}
            fill="none"
            stroke="url(#ecosystem-line-grad)"
            strokeWidth="0.35"
            strokeLinecap="round"
            className={cn(animate && "homepage-ecosystem-connector")}
            style={{ animationDelay: `${0.4 + index * 0.08}s` }}
          />
          <circle
            cx={card.connectorEnd.x}
            cy={card.connectorEnd.y}
            r="0.9"
            fill="#f4d23c"
            fillOpacity={0.5}
            className={cn(animate && "homepage-ecosystem-connector")}
            style={{ animationDelay: `${0.5 + index * 0.08}s` }}
          />
        </g>
      ))}
      <circle cx="50" cy="50" r="1.2" fill="#f4d23c" fillOpacity={0.7} />
    </svg>
  );
}

export function HomepageCoachingEcosystem({ className }: { className?: string }) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer
  );

  const phone = getPhoneScreen(HERO_ECOSYSTEM_PHONE.screenId);
  const floatingCards = ECOSYSTEM_FEATURE_CARDS.filter((c) => c.mobileFloat);
  const scrollCards = ECOSYSTEM_FEATURE_CARDS.filter((c) => !c.mobileFloat);
  const mobileConnectorIds = new Set(floatingCards.map((c) => c.id));
  const animate = !prefersReducedMotion;

  return (
    <div className={cn("w-full", className)} aria-label="Hybrid365 coaching ecosystem preview">
      {/* Tablet + desktop */}
      <div
        className={cn(
          "relative mx-auto hidden sm:block",
          "h-[340px] w-full max-w-[400px] lg:h-[380px] lg:max-w-[440px]"
        )}
      >
        <EcosystemConnectors animate={animate} className="z-0 opacity-80" />

        <div
          className={cn(
            "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-[46%]",
            animate && "homepage-ecosystem-phone-enter"
          )}
        >
          <HomepagePhoneVisual
            screen={phone}
            displayWidth={HERO_ECOSYSTEM_PHONE.displayWidth.desktop}
            priority
          />
        </div>

        {ECOSYSTEM_FEATURE_CARDS.map((card, index) => (
          <div
            key={card.id}
            className={cn(
              "absolute z-20",
              card.desktopClass,
              animate && "homepage-ecosystem-card-enter homepage-ecosystem-float-slow"
            )}
            style={{
              animationDelay: animate ? `${0.15 + index * 0.1}s` : undefined,
            }}
          >
            <HomepageEcosystemCard card={card} />
          </div>
        ))}
      </div>

      {/* Mobile — phone ~48–52% viewport, 4 floating cards + swipe row */}
      <div className="relative mx-auto block w-full max-w-[300px] sm:hidden">
        <div className="relative mx-auto h-[200px] w-full">
          <EcosystemConnectors
            animate={animate}
            visibleCardIds={mobileConnectorIds}
            className="z-0 opacity-70"
          />

          <div
            className={cn(
              "absolute left-1/2 top-[54%] z-10 -translate-x-1/2 -translate-y-1/2",
              animate && "homepage-ecosystem-phone-enter"
            )}
            style={{ width: "min(52vw, 188px)" }}
          >
            <HomepagePhoneVisual
              screen={phone}
              displayWidth={HERO_ECOSYSTEM_PHONE.displayWidth.mobile}
              fillContainer
              priority
            />
          </div>

          {floatingCards.map((card, index) => (
            <div
              key={card.id}
              className={cn(
                "absolute z-20",
                card.mobileClass,
                animate && "homepage-ecosystem-card-enter homepage-ecosystem-float-slow"
              )}
              style={{
                animationDelay: animate ? `${0.12 + index * 0.09}s` : undefined,
              }}
            >
              <HomepageEcosystemCard card={card} compact />
            </div>
          ))}
        </div>

        <HomepageHorizontalScroll className="mt-1 gap-2.5" itemClassName="w-[148px]">
          {scrollCards.map((card) => (
            <HomepageEcosystemCard key={card.id} card={card} compact />
          ))}
        </HomepageHorizontalScroll>
      </div>
    </div>
  );
}
