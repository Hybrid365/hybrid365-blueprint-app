import Image from "next/image";
import {
  ATHLETE_PROOF_CARDS,
  ATHLETE_PROOF_COPY,
} from "@/app/lib/homepage/athleteProof";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

export function HomepageTestimonials() {
  return (
    <HomepageSection id="proof" variant="default">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{ATHLETE_PROOF_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          {ATHLETE_PROOF_COPY.headline[0]}
          <span className="block text-[#f4d23c]">{ATHLETE_PROOF_COPY.headline[1]}</span>
        </HomepageHeading>
        <p className="mt-5 text-base leading-relaxed text-white/55">
          {ATHLETE_PROOF_COPY.body}
        </p>
        <p className="mt-3 text-sm text-white/40">{ATHLETE_PROOF_COPY.note}</p>
      </div>

      <p className="mt-10 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 lg:hidden">
        Swipe proof →
      </p>
      <div className="mt-4 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-12 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0">
        {ATHLETE_PROOF_CARDS.map((card) => (
          <article
            key={card.id}
            className="flex w-[min(78vw,300px)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] lg:w-auto"
          >
            <div className="relative aspect-[5/4] overflow-hidden">
              <Image
                src={card.photoSrc}
                alt={card.photoAlt}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 78vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f4d23c]/80">
                {card.trackHint}
              </p>
              <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-white">
                {card.name}
              </h3>
              <p className="mt-2 text-sm font-bold text-white/90">{card.result}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{card.context}</p>
            </div>
          </article>
        ))}
      </div>
    </HomepageSection>
  );
}
