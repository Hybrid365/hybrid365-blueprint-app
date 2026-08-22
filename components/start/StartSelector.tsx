import { TALK_TO_KIERAN_URL } from "@/app/lib/homepage/homepageLinks";
import {
  START_COPY,
  START_TEAM_OPTION,
  START_TRACK_OPTION,
} from "@/app/lib/start/startCopy";
import { AttributedLink } from "./AttributedLink";

function OptionCard({
  option,
  emphasized,
}: {
  option: typeof START_TRACK_OPTION | typeof START_TEAM_OPTION;
  emphasized?: boolean;
}) {
  return (
    <article
      className={
        emphasized
          ? "flex h-full flex-col rounded-2xl border border-[#f4d23c]/50 bg-gradient-to-b from-[#16120a] to-[#080808] p-6 shadow-[0_0_32px_rgba(244,210,60,0.08)] sm:p-8"
          : "flex h-full flex-col rounded-2xl border border-white/18 bg-gradient-to-b from-[#121212] to-[#080808] p-6 sm:p-8"
      }
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f4d23c]">
        {option.label}
      </p>
      <h2 className="mt-4 text-[clamp(1.35rem,3.5vw,1.75rem)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white">
        {option.headline}
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-[15px]">{option.body}</p>
      <ul className="mt-6 space-y-2">
        {option.points.map((point) => (
          <li key={point} className="flex gap-2 text-sm text-white/75">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f4d23c]" aria-hidden />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-8">
        <AttributedLink
          href={option.href}
          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#f4d23c] px-6 text-center text-sm font-black uppercase tracking-wide text-[#050505] transition hover:bg-[#e8c935]"
        >
          {option.cta}
        </AttributedLink>
      </div>
    </article>
  );
}

export function StartSelector() {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1000px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]">
            {START_COPY.eyebrow}
          </p>
          <h1 className="text-[clamp(1.85rem,5.5vw,3.25rem)] font-black uppercase leading-[0.9] tracking-[-0.04em] text-white">
            {START_COPY.headline}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/60">
            {START_COPY.body}
          </p>
        </div>

        <div className="mt-10 grid items-stretch gap-4 lg:mt-14 lg:grid-cols-2 lg:gap-6">
          <OptionCard option={START_TRACK_OPTION} />
          <OptionCard option={START_TEAM_OPTION} emphasized />
        </div>

        <p className="mt-10 text-center">
          <span className="block text-sm text-white/45">{START_COPY.talkPrompt}</span>
          <AttributedLink
            href={TALK_TO_KIERAN_URL}
            className="mt-2 inline-flex min-h-[44px] items-center text-sm font-bold text-[#f4d23c] transition hover:text-[#e8c935]"
          >
            {START_COPY.talkCta}
          </AttributedLink>
        </p>
      </div>
    </section>
  );
}
