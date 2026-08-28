import Image from "next/image";
import { HYBRID_PERFORMANCE_HERO } from "@/app/lib/hybrid-performance/hybridPerformanceStory";
import { AttributedLink } from "@/components/start/AttributedLink";

export function HybridPerformanceHero() {
  const h = HYBRID_PERFORMANCE_HERO;

  return (
    <section className="relative overflow-hidden bg-[#050505] pt-[56px] sm:pt-[64px]">
      <div className="mx-auto grid max-w-[1200px] items-end gap-4 px-4 sm:px-6 md:grid-cols-2 md:items-end md:gap-6 lg:px-8">
        <div className="relative z-10 max-w-xl pt-6 sm:pt-8 lg:max-w-none lg:pt-8">
          <h1 className="font-black uppercase leading-[0.84] tracking-[-0.055em] text-white text-[clamp(2.2rem,7.6vw,4.75rem)]">
            {h.headline.map((line) => (
              <span key={line} className="block whitespace-nowrap">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-3 max-w-[22.5rem] text-[13px] font-medium leading-snug text-white/52 sm:mt-3.5 sm:text-[14px]">
            {h.supporting}
          </p>
          <div className="mt-5 flex flex-col items-start gap-2.5 sm:mt-6 sm:flex-row sm:items-center sm:gap-5">
            <AttributedLink
              href={h.primaryHref}
              className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-[#f4d23c] px-7 text-[13px] font-black uppercase tracking-[0.1em] text-[#050505] transition hover:bg-[#e8c935] sm:min-h-[52px] sm:px-8"
            >
              {h.primaryCta}
            </AttributedLink>
            <AttributedLink
              href={h.secondaryHref}
              className="inline-flex items-center py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38 transition hover:text-white/60"
            >
              {h.secondaryCta}
            </AttributedLink>
          </div>
        </div>

        <div className="relative -mx-4 h-[min(52vw,380px)] min-h-[260px] sm:mx-0 sm:h-[400px] md:h-[460px] lg:h-[520px]">
          <Image
            src={h.mediaSrc}
            alt={h.mediaAlt}
            fill
            priority
            className="object-cover object-[center_48%] sm:object-[center_58%] md:object-[center_68%] md:[mask-image:radial-gradient(ellipse_90%_88%_at_72%_58%,#000_42%,transparent_78%)] md:[-webkit-mask-image:radial-gradient(ellipse_90%_88%_at_72%_58%,#000_42%,transparent_78%)] lg:object-[center_72%]"
            sizes="(max-width: 1024px) 100vw, 560px"
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-[28%] bg-gradient-to-r from-[#050505] to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050505] to-transparent"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
