import { BRAND_MOTTO } from "@/app/lib/homepage/brandCopy";
import {
  COACHING_START_URL,
  FREE_WEEK_HYROX_URL,
  TALK_TO_KIERAN_URL,
} from "@/app/lib/homepage/homepageLinks";
import {
  HomepageSection,
  HomepageHeading,
  PrimaryCta,
  SecondaryCta,
  HomepageTextLink,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageFinalCta() {
  return (
    <HomepageSection
      id="start"
      className="relative overflow-hidden border-b-0 pb-28 md:pb-24"
      variant="dark"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,210,60,0.08),transparent_65%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <HomepageHeading as="h2" className="text-[clamp(2rem,7vw,3.75rem)]">
          Ready to
          <span className="block text-[#f4d23c]">start?</span>
        </HomepageHeading>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <PrimaryCta
              href={FREE_WEEK_HYROX_URL}
              size="large"
              className={`${homepageCtaClass} w-full sm:w-full`}
            >
              Build My Free Week
            </PrimaryCta>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              Try Hybrid365 training before committing.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <SecondaryCta href={COACHING_START_URL} className={`${homepageCtaClass} w-full sm:w-full min-h-[56px]`}>
              I&apos;m Ready to Start
            </SecondaryCta>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              Choose between HYROX Track and 1-1 coaching.
            </p>
          </div>
        </div>

        <p className="mt-8">
          <HomepageTextLink href={TALK_TO_KIERAN_URL} className="normal-case tracking-[0.04em] text-sm">
            Not sure? Talk to Kieran →
          </HomepageTextLink>
        </p>

        <p className="mt-10 text-xs font-black uppercase tracking-[0.22em] text-[#f4d23c]">
          {BRAND_MOTTO}
        </p>
      </div>
    </HomepageSection>
  );
}
