"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import {
  HERO_ECOSYSTEM_MINI_CARDS,
  HERO_ECOSYSTEM_PHONE,
} from "@/app/lib/homepage/coachingEcosystem";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneVisual } from "./HomepagePhoneVisual";
import { HomepageEcosystemMiniCard } from "./HomepageEcosystemMiniCard";

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

function EcosystemConnectors({ animate }: { animate: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 z-[12] h-full w-full"
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="hero-orbit-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f4d23c" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      {HERO_ECOSYSTEM_MINI_CARDS.map((card, index) => (
        <g key={card.id}>
          <path
            d={card.connectorPath}
            fill="none"
            stroke="url(#hero-orbit-line)"
            strokeWidth="0.22"
            strokeLinecap="round"
            className={cn(animate && "homepage-ecosystem-connector")}
            style={{ animationDelay: `${0.35 + index * 0.07}s` }}
          />
          <circle
            cx={card.connectorEnd.x}
            cy={card.connectorEnd.y}
            r="0.7"
            fill="#f4d23c"
            fillOpacity={0.6}
            className={cn(animate && "homepage-ecosystem-connector")}
            style={{ animationDelay: `${0.42 + index * 0.07}s` }}
          />
        </g>
      ))}
      <circle cx="50" cy="48" r="0.85" fill="#f4d23c" fillOpacity={0.75} />
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
  const animate = !prefersReducedMotion;

  return (
    <div className={cn("w-full", className)} aria-label="Hybrid365 coaching ecosystem preview">
      {/* Desktop / tablet — tight quadrant composition */}
      <div
        className={cn(
          "relative mx-auto hidden overflow-visible sm:block",
          "h-[420px] w-full max-w-[460px] lg:h-[440px] lg:max-w-[480px]"
        )}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-[48%] z-0 h-[72%] w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(244,210,60,0.16),transparent_70%)]"
          aria-hidden
        />

        <EcosystemConnectors animate={animate} />

        <div
          className={cn(
            "absolute left-1/2 top-[48%] z-20 -translate-x-1/2 -translate-y-1/2",
            animate && "homepage-ecosystem-phone-enter"
          )}
        >
          <HomepagePhoneVisual
            screen={phone}
            displayWidth={HERO_ECOSYSTEM_PHONE.displayWidth.desktop}
            priority
          />
        </div>

        {HERO_ECOSYSTEM_MINI_CARDS.map((card, index) => (
          <div
            key={card.id}
            className={cn(
              "absolute",
              card.desktopClass,
              animate && "homepage-ecosystem-card-enter homepage-ecosystem-float-slow"
            )}
            style={{
              animationDelay: animate ? `${0.1 + index * 0.06}s` : undefined,
            }}
          >
            <HomepageEcosystemMiniCard card={card} />
          </div>
        ))}
      </div>

      {/* Mobile — same quadrant structure, scaled */}
      <div className="relative mx-auto block w-full max-w-[320px] overflow-visible sm:hidden">
        <div className="relative mx-auto h-[320px] w-full overflow-visible">
          <div
            className="pointer-events-none absolute left-1/2 top-[48%] z-0 h-[68%] w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(244,210,60,0.12),transparent_72%)]"
            aria-hidden
          />

          <EcosystemConnectors animate={animate} />

          <div
            className={cn(
              "absolute left-1/2 top-[48%] z-20 -translate-x-1/2 -translate-y-1/2",
              animate && "homepage-ecosystem-phone-enter"
            )}
            style={{ width: HERO_ECOSYSTEM_PHONE.displayWidth.mobile }}
          >
            <HomepagePhoneVisual
              screen={phone}
              displayWidth={HERO_ECOSYSTEM_PHONE.displayWidth.mobile}
              fillContainer
              priority
            />
          </div>

          {HERO_ECOSYSTEM_MINI_CARDS.map((card, index) => (
            <div
              key={card.id}
              className={cn(
                "absolute",
                card.mobileClass,
                animate && "homepage-ecosystem-card-enter homepage-ecosystem-float-slow"
              )}
              style={{
                animationDelay: animate ? `${0.08 + index * 0.05}s` : undefined,
              }}
            >
              <HomepageEcosystemMiniCard card={card} compact />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
