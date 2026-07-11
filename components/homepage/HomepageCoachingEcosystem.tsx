"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import {
  HERO_ECOSYSTEM_MINI_CARDS,
  HERO_ECOSYSTEM_PHONE,
} from "@/app/lib/homepage/coachingEcosystem";
import { HERO_ECOSYSTEM_PHOTO } from "@/app/lib/homepage/athletePhotography";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneVisual } from "./HomepagePhoneVisual";
import { HomepageEcosystemMiniCard } from "./HomepageEcosystemMiniCard";
import { HomepageEditorialPhoto } from "./HomepageEditorialPhoto";

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

function EcosystemAthleteEnvironment({ animate }: { animate: boolean }) {
  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute -right-[24%] top-[10%] z-[1] h-[50%] w-[48%] opacity-35",
          animate && "homepage-ecosystem-card-enter"
        )}
        style={{ animationDelay: animate ? "0.05s" : undefined }}
      >
        <HomepageEditorialPhoto
          photo={HERO_ECOSYSTEM_PHOTO}
          className="h-full w-full"
          intensity="subtle"
          sizes="160px"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,transparent_28%,#050505_82%)]"
        aria-hidden
      />
    </>
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
      {/* Tablet + desktop — phone hero, 4 cards at corners, generous spacing */}
      <div
        className={cn(
          "relative mx-auto hidden overflow-visible sm:block",
          "h-[400px] w-full max-w-[460px] lg:h-[440px] lg:max-w-[500px]"
        )}
      >
        <EcosystemAthleteEnvironment animate={animate} />

        <div
          className={cn(
            "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2",
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
              "absolute z-20",
              card.desktopClass,
              animate && "homepage-ecosystem-card-enter homepage-ecosystem-float-slow"
            )}
            style={{
              animationDelay: animate ? `${0.12 + index * 0.08}s` : undefined,
            }}
          >
            <HomepageEcosystemMiniCard card={card} />
          </div>
        ))}
      </div>

      {/* Mobile — phone centre, 4 corner cards with spacing */}
      <div className="relative mx-auto block w-full max-w-[320px] overflow-visible sm:hidden">
        <div className="relative mx-auto h-[268px] w-full overflow-visible">
          <div className="pointer-events-none absolute -right-6 top-2 z-[1] h-[45%] w-[38%] opacity-30">
            <HomepageEditorialPhoto
              photo={HERO_ECOSYSTEM_PHOTO}
              className="h-full w-full"
              intensity="subtle"
              sizes="90px"
            />
          </div>
          <div
            className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,transparent_22%,#050505_80%)]"
            aria-hidden
          />

          <div
            className={cn(
              "absolute left-1/2 top-[52%] z-10 -translate-x-1/2 -translate-y-1/2",
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
                "absolute z-20",
                card.mobileClass,
                animate && "homepage-ecosystem-card-enter homepage-ecosystem-float-slow"
              )}
              style={{
                animationDelay: animate ? `${0.1 + index * 0.07}s` : undefined,
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
