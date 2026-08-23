import Image from "next/image";
import { CLIENT_QUOTES } from "@/app/lib/homepage/clientQuotes";
import { LANDING_ATHLETE_CARDS, LANDING_CLIENT_RESULTS } from "@/app/lib/homepage/landingStory";
import { HomepageEyebrow, HomepageHeading, HomepageSection } from "./homepageUi";

export function HomepageClientResults() {
  return (
    <HomepageSection id="results" variant="dark" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{LANDING_CLIENT_RESULTS.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.75rem,5.8vw,3rem)]">
          {LANDING_CLIENT_RESULTS.headline}
        </HomepageHeading>
        <p className="mt-3 text-xs text-white/40">{LANDING_CLIENT_RESULTS.note}</p>
      </div>

      <ul className="mt-10 space-y-6">
        {LANDING_ATHLETE_CARDS.map((athlete) => (
          <li key={athlete.id} className="grid grid-cols-[88px_1fr] items-center gap-4 sm:grid-cols-[112px_1fr] sm:gap-6">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#111]">
              <Image
                src={athlete.photoSrc}
                alt={athlete.photoAlt}
                fill
                className="object-cover object-top"
                sizes="112px"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                {athlete.primary.label}
              </p>
              <p className="mt-1 text-[2rem] font-black leading-none tracking-tight text-white tabular-nums sm:text-[2.5rem]">
                {athlete.primary.value}
              </p>
              {athlete.secondary ? (
                <p className="mt-2 text-sm font-bold text-[#f4d23c]">
                  {athlete.secondary.label} {athlete.secondary.value}
                </p>
              ) : null}
              <p className="mt-3 text-sm font-black uppercase tracking-tight text-white">
                {athlete.name}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                {athlete.focus}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-12 space-y-8">
        {CLIENT_QUOTES.map((item) => (
          <blockquote key={item.id} className="max-w-2xl">
            <p className="text-base leading-relaxed text-white/70 sm:text-lg">
              &ldquo;{item.quote}&rdquo;
            </p>
            <footer className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/35">
              {item.attribution}
            </footer>
          </blockquote>
        ))}
      </div>
    </HomepageSection>
  );
}
