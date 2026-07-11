import Link from "next/link";
import { WHAT_YOU_GET_PHONE_SCREENS } from "@/app/lib/homepage/phoneScreens";
import { HOW_IT_WORKS_STEPS } from "@/app/lib/homepage/howItWorks";
import {
  FREE_WEEK_HYROX_URL,
  SECONDARY_LINKS,
} from "@/app/lib/homepage/homepageLinks";
import { HomepagePhoneCarousel } from "./HomepagePhoneCarousel";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageWhatYouGet() {
  return (
    <HomepageSection id="community" variant="accent">
      <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <HomepageEyebrow>What you get</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
          From free week to full standard
        </HomepageHeading>
        <p className="mt-5 text-base text-white/55">
          Start with your personalised training week. Progress into the community,
          then the HYROX Team when you want 1-1 coaching.
        </p>
      </div>

      <HomepagePhoneCarousel
        items={WHAT_YOU_GET_PHONE_SCREENS}
        phoneSize="md"
        className="mt-12"
      />

      <div className="mx-auto mt-14 max-w-2xl">
        <ol className="space-y-0">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <li key={step.step} className="relative flex gap-5 pb-8 last:pb-0">
              {index < HOW_IT_WORKS_STEPS.length - 1 ? (
                <span
                  className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-gradient-to-b from-[#f4d23c]/50 to-white/10"
                  aria-hidden
                />
              ) : null}
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#f4d23c]/40 bg-[#f4d23c]/10 text-xs font-black text-[#f4d23c]">
                {step.step}
              </span>
              <div className="pt-0.5">
                <h3 className="text-sm font-black uppercase tracking-wide text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {step.description}
                  {step.step === 3 ? (
                    <>
                      {" "}
                      <Link
                        href={SECONDARY_LINKS.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/70 underline decoration-white/20 underline-offset-2 hover:text-white"
                      >
                        Join Telegram
                      </Link>
                    </>
                  ) : null}
                  {step.step === 4 ? (
                    <>
                      {" "}
                      <Link
                        href={SECONDARY_LINKS.hyroxTeam}
                        className="text-white/70 underline decoration-white/20 underline-offset-2 hover:text-white"
                      >
                        Learn about HYROX Team
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <HomepageCtaRow className="mt-10 justify-center lg:justify-start">
        <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
          Start My Free Training Week
        </PrimaryCta>
      </HomepageCtaRow>
    </HomepageSection>
  );
}
