import Link from "next/link";
import { AthletePathwayPhoneStack } from "@/components/hyrox-landing/AthletePathwayPhoneStack";
import { HOW_IT_WORKS_STEPS } from "@/app/lib/homepage/howItWorks";
import {
  FREE_WEEK_HYROX_URL,
  SECONDARY_LINKS,
} from "@/app/lib/homepage/homepageLinks";
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
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
          <HomepageEyebrow>What you get</HomepageEyebrow>
          <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
            From free week to full standard
          </HomepageHeading>
          <p className="mt-5 text-base text-white/55">
            Start with your personalised training week. Progress into the community,
            then the HYROX Team when you want 1-1 coaching.
          </p>

          <div className="mt-10 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:block lg:overflow-visible lg:px-0">
            <ol className="flex gap-4 lg:block lg:space-y-0">
              {HOW_IT_WORKS_STEPS.map((step, index) => (
                <li
                  key={step.step}
                  className="relative w-[min(80vw,280px)] shrink-0 snap-start rounded-xl border border-white/10 bg-[#0a0a0a]/80 p-5 text-left lg:w-auto lg:shrink lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:pb-8 lg:last:pb-0"
                >
                  {index < HOW_IT_WORKS_STEPS.length - 1 ? (
                    <span
                      className="absolute left-[15px] top-8 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-[#f4d23c]/50 to-white/10 lg:block"
                      aria-hidden
                    />
                  ) : null}
                  <div className="flex gap-4 lg:gap-5">
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
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <HomepageCtaRow className="mt-10">
            <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
              Start My Free Training Week
            </PrimaryCta>
          </HomepageCtaRow>
        </div>

        <div className="relative mx-auto flex w-full max-w-[min(100%,680px)] justify-center pt-2 lg:mx-0 lg:pt-0">
          <AthletePathwayPhoneStack />
        </div>
      </div>
    </HomepageSection>
  );
}
