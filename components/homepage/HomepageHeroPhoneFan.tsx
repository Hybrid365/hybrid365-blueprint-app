import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  getPhoneScreen,
  HERO_PHONE_SCREENS,
} from "@/app/lib/homepage/phoneScreens";
import { FOUNDER_HERO_IMAGE } from "@/app/lib/homepage/founderStats";
import { HomepagePhoneVisual } from "./HomepagePhoneVisual";

export function HomepageHeroPhoneFan({ className }: { className?: string }) {
  const primary = getPhoneScreen(HERO_PHONE_SCREENS.primary);
  const [supportA, supportB] = HERO_PHONE_SCREENS.supporting.map(getPhoneScreen);

  return (
    <div className={cn("relative mx-auto w-full max-w-[400px] pb-10 sm:max-w-[440px] lg:max-w-[480px] lg:pb-0", className)}>
      {/* Supporting phone — back left */}
      <div className="absolute left-0 top-10 z-0 hidden w-[48%] -rotate-[8deg] opacity-75 sm:block lg:left-[-4%] lg:top-12">
        <HomepagePhoneVisual screen={supportA} size="sm" />
      </div>

      {/* Supporting phone — back right */}
      <div className="absolute right-0 top-14 z-0 hidden w-[48%] rotate-[7deg] opacity-70 sm:block lg:right-[-4%] lg:top-16">
        <HomepagePhoneVisual screen={supportB} size="sm" />
      </div>

      {/* Primary phone — centre */}
      <div className="relative z-10 mx-auto flex justify-center">
        <HomepagePhoneVisual screen={primary} size="xl" priority />
      </div>

      {/* Founder proof inset */}
      <div className="absolute -bottom-2 left-2 z-20 w-[32%] min-w-[96px] max-w-[120px] overflow-hidden rounded-xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.55)] sm:-left-2 sm:max-w-[140px] lg:-left-4">
        <div className="relative aspect-[3/4]">
          <Image
            src={FOUNDER_HERO_IMAGE.src}
            alt={FOUNDER_HERO_IMAGE.alt}
            fill
            priority
            className="object-cover object-top"
            sizes="140px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
          <p className="absolute bottom-2 left-2 right-2 text-[8px] font-bold uppercase tracking-wider text-white/90 sm:text-[9px]">
            Founder · HYROX Pro
          </p>
        </div>
      </div>
    </div>
  );
}
