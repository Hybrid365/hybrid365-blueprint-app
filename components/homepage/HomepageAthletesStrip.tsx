import Image from "next/image";
import {
  ATHLETE_STRIP_CARDS,
  ATHLETE_STRIP_COPY,
} from "@/app/lib/homepage/athleteStrip";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

function AthleteStripCard({
  athlete,
}: {
  athlete: (typeof ATHLETE_STRIP_CARDS)[number];
}) {
  return (
    <article className="w-[min(78vw,260px)] shrink-0 snap-start sm:w-auto">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
        <Image
          src={athlete.photoSrc}
          alt={athlete.photoAlt}
          fill
          className="object-cover object-center brightness-[0.82] contrast-[1.05] saturate-[0.9]"
          sizes="(max-width: 640px) 78vw, 260px"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/35 to-transparent"
          aria-hidden
        />
      </div>

      <div className="mt-4 px-1">
        <h3 className="text-base font-black uppercase tracking-[0.04em] text-white">
          {athlete.name}
        </h3>
        <dl className="mt-3 space-y-2">
          {athlete.metrics.map((metric) => (
            <div key={metric.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                {metric.label}
              </dt>
              <dd className="text-sm font-black tabular-nums text-white/90">{metric.value}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-3 border-t border-white/8 pt-2">
            <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
              Focus
            </dt>
            <dd className="text-right text-xs font-semibold text-[#f4d23c]/90">{athlete.focus}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export function HomepageAthletesStrip() {
  return (
    <HomepageSection id="athletes" variant="dark" className="!py-14 sm:!py-16 lg:!py-20">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{ATHLETE_STRIP_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          {ATHLETE_STRIP_COPY.headline[0]}
          <span className="block text-[#f4d23c]">{ATHLETE_STRIP_COPY.headline[1]}</span>
        </HomepageHeading>
        <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-white/55">
          {ATHLETE_STRIP_COPY.body}
        </p>
      </div>

      <div className="mt-12 -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-8 lg:overflow-visible lg:px-0">
        {ATHLETE_STRIP_CARDS.map((athlete) => (
          <AthleteStripCard key={athlete.id} athlete={athlete} />
        ))}
      </div>
    </HomepageSection>
  );
}
