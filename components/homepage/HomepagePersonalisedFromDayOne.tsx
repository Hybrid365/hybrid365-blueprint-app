import {
  ACCOUNTABILITY_STRIP,
  PERSONALISED_COPY,
  PERSONALISED_STAGES,
} from "@/app/lib/homepage/personalisedFromDayOne";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  homepageCtaClass,
} from "./homepageUi";

export function HomepagePersonalisedFromDayOne() {
  return (
    <HomepageSection id="screening" variant="dark" className="!py-20 sm:!py-24">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{PERSONALISED_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          {PERSONALISED_COPY.headline[0]}
          <span className="block text-[#f4d23c]">{PERSONALISED_COPY.headline[1]}</span>
        </HomepageHeading>
        <p className="mt-5 text-base leading-relaxed text-white/55">
          {PERSONALISED_COPY.body}
        </p>
      </div>

      <ol className="relative mt-12 hidden gap-4 lg:grid lg:grid-cols-4">
        <div
          className="pointer-events-none absolute left-[8%] right-[8%] top-5 h-px bg-gradient-to-r from-white/15 via-[#f4d23c]/35 to-white/15"
          aria-hidden
        />
        {PERSONALISED_STAGES.map((stage) => (
          <li key={stage.number} className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f4d23c]/50 bg-[#0a0a0a] text-xs font-black text-[#f4d23c]">
              {stage.number}
            </div>
            <h3 className="mt-4 text-base font-black uppercase tracking-tight text-white">
              {stage.title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-white/45">{stage.microcopy}</p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {stage.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/65"
                >
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <ol className="mt-10 space-y-6 lg:hidden">
        {PERSONALISED_STAGES.map((stage) => (
          <li key={stage.number} className="relative border-l border-[#f4d23c]/35 pl-5">
            <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-[#f4d23c]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]/80">
              {stage.number} · {stage.title}
            </p>
            <p className="mt-2 text-sm text-white/50">{stage.microcopy}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {stage.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/65"
                >
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <ul className="mt-12 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACCOUNTABILITY_STRIP.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-3 text-center text-xs font-bold uppercase tracking-[0.1em] text-white/70 sm:text-[11px]"
          >
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-10 text-center text-lg font-black uppercase tracking-tight text-white sm:text-xl lg:text-left">
        {PERSONALISED_COPY.statement[0]}{" "}
        <span className="text-[#f4d23c]">{PERSONALISED_COPY.statement[1]}</span>
      </p>

      <div className="mt-8 flex justify-center lg:justify-start">
        <PrimaryCta
          href={PERSONALISED_COPY.ctaHref}
          size="large"
          className={homepageCtaClass}
        >
          {PERSONALISED_COPY.ctaLabel}
        </PrimaryCta>
      </div>
    </HomepageSection>
  );
}
