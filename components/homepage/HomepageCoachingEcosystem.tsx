"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import {
  HERO_ILLUSTRATION_CARDS,
  HERO_ILLUSTRATION_CONNECTORS,
  HERO_ILLUSTRATION_PHONE,
  HERO_ILLUSTRATION_SIZE,
  artboardToPercent,
  artboardWidthPercent,
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

function IllustrationConnectors({ animate }: { animate: boolean }) {
  const { width, height } = HERO_ILLUSTRATION_SIZE;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute inset-0 z-[8] h-full w-full"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="hero-illus-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f4d23c" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f4d23c" stopOpacity="0.18" />
        </linearGradient>
        <filter id="hero-illus-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {HERO_ILLUSTRATION_CONNECTORS.map((connector, index) => (
        <g key={connector.id} filter="url(#hero-illus-glow)">
          <path
            d={connector.path}
            fill="none"
            stroke="url(#hero-illus-line)"
            strokeWidth="1.15"
            strokeLinecap="round"
            className={cn(animate && "homepage-ecosystem-connector")}
            style={{ animationDelay: `${0.3 + index * 0.06}s` }}
          />
          <circle
            cx={connector.phoneAnchor.x}
            cy={connector.phoneAnchor.y}
            r="2.6"
            fill="#f4d23c"
            fillOpacity={0.7}
            className={cn(animate && "homepage-ecosystem-connector")}
            style={{ animationDelay: `${0.36 + index * 0.06}s` }}
          />
          <circle
            cx={connector.cardAnchor.x}
            cy={connector.cardAnchor.y}
            r="2.2"
            fill="#f4d23c"
            fillOpacity={0.5}
            className={cn(animate && "homepage-ecosystem-connector")}
            style={{ animationDelay: `${0.4 + index * 0.06}s` }}
          />
        </g>
      ))}
    </svg>
  );
}

/**
 * Single fixed marketing illustration — scales proportionally, never reflows.
 */
export function HomepageCoachingEcosystem({ className }: { className?: string }) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer
  );

  const phone = getPhoneScreen(HERO_ILLUSTRATION_PHONE.screenId);
  const phonePos = artboardToPercent(HERO_ILLUSTRATION_PHONE.center);
  const animate = !prefersReducedMotion;

  return (
    <div
      className={cn("flex w-full justify-center overflow-visible", className)}
      aria-label="Hybrid365 coaching ecosystem preview"
    >
      <div
        className="relative origin-center"
        style={{
          width: "100%",
          maxWidth: HERO_ILLUSTRATION_SIZE.width,
          aspectRatio: `${HERO_ILLUSTRATION_SIZE.width} / ${HERO_ILLUSTRATION_SIZE.height}`,
        }}
      >
        {/* Hub glow — lowest visual weight */}
        <div
          className="pointer-events-none absolute z-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(244,210,60,0.12),transparent_68%)]"
          style={{
            ...phonePos,
            width: artboardWidthPercent(220),
            height: `${(220 / HERO_ILLUSTRATION_SIZE.height) * 100}%`,
          }}
          aria-hidden
        />

        <IllustrationConnectors animate={animate} />

        {/* Central phone — visual hero */}
        <div
          className={cn(
            "absolute z-20 -translate-x-1/2 -translate-y-1/2",
            animate && "homepage-ecosystem-phone-enter"
          )}
          style={{
            ...phonePos,
            width: artboardWidthPercent(HERO_ILLUSTRATION_PHONE.width),
          }}
        >
          <HomepagePhoneVisual
            screen={phone}
            displayWidth={HERO_ILLUSTRATION_PHONE.width}
            fillContainer
            priority
          />
        </div>

        {/* Satellite cards — manually composed on artboard */}
        {HERO_ILLUSTRATION_CARDS.map((card) => (
          <div
            key={card.id}
            className={cn(
              "absolute z-[14] -translate-x-1/2 -translate-y-1/2",
              animate && "homepage-ecosystem-card-enter"
            )}
            style={{
              ...artboardToPercent(card.center),
              width: artboardWidthPercent(card.width),
            }}
            data-hero-illus-card={card.id}
          >
            <HomepageEcosystemMiniCard card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}
