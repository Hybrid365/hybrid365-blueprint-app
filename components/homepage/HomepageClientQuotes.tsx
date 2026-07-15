import { CLIENT_QUOTES, CLIENT_QUOTES_COPY } from "@/app/lib/homepage/clientQuotes";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

export function HomepageClientQuotes() {
  return (
    <HomepageSection id="quotes" variant="dark" className="!py-16 sm:!py-20">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{CLIENT_QUOTES_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.65rem,4.5vw,2.5rem)]">
          {CLIENT_QUOTES_COPY.headline[0]}
          <span className="block text-[#f4d23c]">{CLIENT_QUOTES_COPY.headline[1]}</span>
        </HomepageHeading>
      </div>

      <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 lg:hidden">
        Swipe quotes →
      </p>
      <div className="mt-4 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-10 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0">
        {CLIENT_QUOTES.map((item) => (
          <blockquote
            key={item.id}
            className="flex w-[min(82vw,300px)] shrink-0 snap-start flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 lg:w-auto"
          >
            <p className="flex-1 text-sm leading-relaxed text-white/75 sm:text-[15px]">
              &ldquo;{item.quote}&rdquo;
            </p>
            <footer className="mt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
              {item.attribution}
            </footer>
          </blockquote>
        ))}
      </div>
    </HomepageSection>
  );
}
