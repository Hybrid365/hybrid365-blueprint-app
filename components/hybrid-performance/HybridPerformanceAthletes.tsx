import Image from "next/image";
import { HYBRID_PERFORMANCE_ATHLETES } from "@/app/lib/hybrid-performance/hybridPerformanceStory";
import {
  HomepageEyebrow,
  HomepageHeading,
  HomepageSection,
} from "@/components/homepage/homepageUi";
import { HomepageSnapCarousel } from "@/components/homepage/HomepageSnapCarousel";

function AthleteCard({
  athlete,
}: {
  athlete: (typeof HYBRID_PERFORMANCE_ATHLETES.cards)[number];
}) {
  return (
    <article className="overflow-hidden">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-[#111]">
        <Image
          src={athlete.photoSrc}
          alt={athlete.photoAlt}
          fill
          className={athlete.imageClassName}
          sizes="(max-width: 1024px) 86vw, 280px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
            {athlete.primary.label}
          </p>
          <p className="mt-1 text-[2rem] font-black leading-none tracking-tight text-white tabular-nums">
            {athlete.primary.value}
          </p>
          {"secondary" in athlete && athlete.secondary ? (
            <p className="mt-2 text-sm font-bold text-[#f4d23c]">
              {athlete.secondary.label} {athlete.secondary.value}
            </p>
          ) : null}
          <h3 className="mt-4 text-base font-black uppercase tracking-tight text-white">
            {athlete.name}
          </h3>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
            {athlete.focus}
          </p>
        </div>
      </div>
    </article>
  );
}

export function HybridPerformanceAthletes() {
  const copy = HYBRID_PERFORMANCE_ATHLETES;

  return (
    <HomepageSection id="athletes" variant="dark" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{copy.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,6vw,3rem)]">
          {copy.headline[0]}
          <span className="block">{copy.headline[1]}</span>
          <span className="block text-[#f4d23c]">{copy.headline[2]}</span>
        </HomepageHeading>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/55 lg:mx-0">
          {copy.body}
        </p>
      </div>

      <div className="mt-8 lg:mt-10">
        <HomepageSnapCarousel ariaLabel="Hybrid365 Hybrid Performance athletes">
          {copy.cards.map((athlete) => (
            <AthleteCard key={athlete.id} athlete={athlete} />
          ))}
        </HomepageSnapCarousel>
      </div>
    </HomepageSection>
  );
}
