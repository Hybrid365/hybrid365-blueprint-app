import Image from "next/image";
import { TELEGRAM_SECTION_COPY } from "@/app/lib/homepage/telegramCommunity";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneVisual } from "./HomepagePhoneVisual";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageTelegramCommunity() {
  const teamScreen = getPhoneScreen("hybrid365-team");

  return (
    <HomepageSection id="telegram" variant="default" className="!py-20 sm:!py-24">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{TELEGRAM_SECTION_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          {TELEGRAM_SECTION_COPY.headline[0]}
          <span className="block text-[#f4d23c]">{TELEGRAM_SECTION_COPY.headline[1]}</span>
        </HomepageHeading>
        <p className="mt-5 text-base leading-relaxed text-white/55">
          {TELEGRAM_SECTION_COPY.body}
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div>
          <ol className="space-y-5">
            {TELEGRAM_SECTION_COPY.steps.map((step) => (
              <li
                key={step.number}
                className="flex gap-4 rounded-2xl border border-white/10 bg-[#0a0a0a] p-5"
              >
                <span className="text-sm font-black text-[#f4d23c]">{step.number}</span>
                <p className="text-base font-bold text-white">{step.title}</p>
              </li>
            ))}
          </ol>

          <ul className="mt-6 flex flex-wrap gap-1.5">
            {TELEGRAM_SECTION_COPY.posted.map((item) => (
              <li
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/65"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <PrimaryCta
              href={TELEGRAM_SECTION_COPY.primaryHref}
              size="large"
              className={homepageCtaClass}
            >
              {TELEGRAM_SECTION_COPY.primaryCta}
            </PrimaryCta>
            <a
              href={TELEGRAM_SECTION_COPY.secondaryHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/20 bg-white/[0.04] px-6 text-sm font-bold uppercase tracking-wide text-white transition hover:border-white/35 hover:bg-white/[0.08]"
            >
              {TELEGRAM_SECTION_COPY.secondaryCta}
            </a>
          </div>
          <p className="mt-4 text-sm text-white/40">{TELEGRAM_SECTION_COPY.reassurance}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
          <div className="pointer-events-none absolute inset-0 opacity-25">
            <Image
              src="/images/homepage/team/ben-kelly-training.png"
              alt=""
              fill
              className="object-cover object-top"
              sizes="40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/40" />
          </div>
          <div className="relative mx-auto w-[min(52vw,200px)]">
            <HomepagePhoneVisual screen={teamScreen} size="sm" fillContainer />
          </div>
          <p className="relative mt-4 text-center text-xs text-white/45">
            Hybrid365 Team standards inside the product
          </p>
        </div>
      </div>
    </HomepageSection>
  );
}
