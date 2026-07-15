"use client";

import Image from "next/image";
import {
  ATHLETE_PROFILES,
  FOUNDER_TRANSFORM,
  PEOPLE_COPY,
} from "@/app/lib/homepage/peopleWhoRefuseAverage";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

function FounderTransformCard() {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a0a0a]">
      <div className="grid gap-0 lg:grid-cols-2">
        <div className="grid grid-cols-2">
          <div className="relative aspect-[3/4] overflow-hidden">
            <Image
              src={FOUNDER_TRANSFORM.startPhoto.src}
              alt={FOUNDER_TRANSFORM.startPhoto.alt}
              fill
              className="object-cover object-top grayscale"
              sizes="(max-width: 1024px) 45vw, 280px"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-3 pb-3 pt-10">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">
                Starting point
              </p>
            </div>
          </div>
          <div className="relative aspect-[3/4] overflow-hidden border-l border-white/10">
            <Image
              src={FOUNDER_TRANSFORM.currentPhoto.src}
              alt={FOUNDER_TRANSFORM.currentPhoto.alt}
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 45vw, 280px"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-3 pb-3 pt-10">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#f4d23c]">
                Current standard
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]/80">
            {FOUNDER_TRANSFORM.roleLabel}
          </p>
          <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            {FOUNDER_TRANSFORM.name}
          </h3>

          <ul className="mt-6 space-y-3">
            {FOUNDER_TRANSFORM.progressions.map((row) => (
              <li
                key={row.from}
                className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white/80 sm:text-base"
              >
                <span className="text-white/45">{row.from}</span>
                <span className="text-[#f4d23c]" aria-hidden>
                  →
                </span>
                <span className="text-white">{row.to}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-3 text-sm leading-relaxed text-white/55 sm:text-[15px]">
            {FOUNDER_TRANSFORM.copy.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function AthleteMiniCard({
  athlete,
}: {
  athlete: (typeof ATHLETE_PROFILES)[number];
}) {
  return (
    <article className="w-[min(72vw,260px)] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] sm:w-auto">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={athlete.photoSrc}
          alt={athlete.photoAlt}
          fill
          className="object-cover object-top"
          sizes="(max-width: 1024px) 72vw, 220px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-base font-black uppercase tracking-tight text-white">
            {athlete.name}
          </h3>
          <p className="mt-1 text-sm font-bold text-[#f4d23c]">
            {athlete.metric.label} {athlete.metric.value}
            {athlete.secondaryMetric
              ? ` · ${athlete.secondaryMetric.label} ${athlete.secondaryMetric.value}`
              : ""}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
            {athlete.focus}
          </p>
        </div>
      </div>
    </article>
  );
}

export function HomepagePeopleWhoRefuseAverage() {
  return (
    <HomepageSection id="team" variant="dark" className="!py-20 sm:!py-24 lg:!py-28">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{PEOPLE_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3.25rem)]">
          {PEOPLE_COPY.headline[0]}
          <span className="block text-[#f4d23c]">{PEOPLE_COPY.headline[1]}</span>
        </HomepageHeading>
        <p className="mt-5 text-base leading-relaxed text-white/55 sm:text-lg">
          {PEOPLE_COPY.body}
        </p>
      </div>

      <div className="mt-12 sm:mt-14">
        <FounderTransformCard />
      </div>

      <p className="mt-10 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 lg:hidden">
        Swipe athletes →
      </p>
      <div className="mt-4 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-10 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0">
        {ATHLETE_PROFILES.map((athlete) => (
          <AthleteMiniCard key={athlete.id} athlete={athlete} />
        ))}
      </div>
    </HomepageSection>
  );
}
