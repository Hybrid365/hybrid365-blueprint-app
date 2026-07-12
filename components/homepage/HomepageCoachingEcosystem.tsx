"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import {
  HERO_ILLUSTRATION_DESKTOP,
  HERO_ILLUSTRATION_MOBILE,
  HERO_ILLUSTRATION_PHONE,
  artboardToPercent,
  artboardWidthPercent,
  type HeroIllustrationSpec,
} from "@/app/lib/homepage/coachingEcosystem";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneVisual } from "./HomepagePhoneVisual";
import { HomepageEcosystemFeatureCard } from "./HomepageEcosystemFeatureCard";

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

function IllustrationConnectors({
  spec,
  animate,
}: {
  spec: HeroIllustrationSpec;
  animate: boolean;
}) {
  const { width, height } = spec;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute inset-0 z-[8] h-full w-full"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`hero-line-${width}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f4d23c" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f4d23c" stopOpacity="0.22" />
        </linearGradient>
        <filter id={`hero-glow-${width}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.9" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {spec.connectors.map((connector, index) => (
        <g key={connector.id} filter={`url(#hero-glow-${width})`}>
          <path
            d={connector.path}
            fill="none"
            stroke={`url(#hero-line-${width})`}
            strokeWidth="1"
            strokeLinecap="round"
            className={cn(animate && "homepage-ecosystem-connector")}
            style={{ animationDelay: `${0.28 + index * 0.05}s` }}
          />
          <circle
            cx={connector.phoneAnchor.x}
            cy={connector.phoneAnchor.y}
            r="2.2"
            fill="#f4d23c"
            fillOpacity={0.75}
            className={cn(animate && "homepage-ecosystem-connector-dot")}
            style={{ animationDelay: `${0.34 + index * 0.05}s` }}
          />
          <circle
            cx={connector.cardAnchor.x}
            cy={connector.cardAnchor.y}
            r="1.8"
            fill="#f4d23c"
            fillOpacity={0.55}
            className={cn(animate && "homepage-ecosystem-connector-dot")}
            style={{ animationDelay: `${0.38 + index * 0.05}s` }}
          />
        </g>
      ))}
    </svg>
  );
}

function HeroIllustrationCanvas({
  spec,
  animate,
  phoneFloatDelay = "0s",
}: {
  spec: HeroIllustrationSpec;
  animate: boolean;
  phoneFloatDelay?: string;
}) {
  const phone = getPhoneScreen(HERO_ILLUSTRATION_PHONE.screenId);
  const phonePos = artboardToPercent(spec.phone.center, spec);

  return (
    <div
      className="relative origin-center"
      style={{
        width: "100%",
        maxWidth: spec.width,
        aspectRatio: `${spec.width} / ${spec.height}`,
      }}
    >
      <div
        className="pointer-events-none absolute z-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(244,210,60,0.1),transparent_70%)]"
        style={{
          ...phonePos,
          width: artboardWidthPercent(190, spec.width),
          height: `${(190 / spec.height) * 100}%`,
        }}
        aria-hidden
      />

      <IllustrationConnectors spec={spec} animate={animate} />

      <div
        className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
        style={{
          ...phonePos,
          width: artboardWidthPercent(spec.phone.width, spec.width),
        }}
      >
        <div
          className={cn(
            animate && "homepage-ecosystem-phone-enter homepage-ecosystem-phone-float"
          )}
          style={{ animationDelay: phoneFloatDelay }}
        >
          <HomepagePhoneVisual
            screen={phone}
            displayWidth={spec.phone.width}
            fillContainer
            priority
          />
        </div>
      </div>

      {spec.cards.map((card, index) => (
        <div
          key={card.id}
          className="absolute z-[14]"
          style={artboardToPercent(card.position, spec)}
        >
          <div
            className={cn(
              animate && "homepage-ecosystem-card-enter homepage-ecosystem-card-float"
            )}
            style={{
              animationDelay: animate ? `${0.08 + index * 0.05}s` : undefined,
            }}
          >
            <HomepageEcosystemFeatureCard
              card={card}
              compact={spec.width <= 320}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomepageCoachingEcosystem({ className }: { className?: string }) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer
  );

  const animate = !prefersReducedMotion;

  return (
    <div
      className={cn("flex w-full justify-center overflow-visible", className)}
      aria-label="Hybrid365 coaching ecosystem preview"
    >
      {/* Desktop + tablet — proportional scale of fixed artboard */}
      <div className="hidden w-full justify-center sm:flex">
        <HeroIllustrationCanvas spec={HERO_ILLUSTRATION_DESKTOP} animate={animate} />
      </div>

      {/* Mobile — separate compact artboard */}
      <div className="flex w-full justify-center sm:hidden">
        <HeroIllustrationCanvas
          spec={HERO_ILLUSTRATION_MOBILE}
          animate={animate}
          phoneFloatDelay="0.1s"
        />
      </div>
    </div>
  );
}
